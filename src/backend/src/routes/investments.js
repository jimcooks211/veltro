// routes/investments.js
// Investment management + 10% daily growth engine
import { Router } from 'express'
import { db }     from '../config.js'
import authMiddleware from '../middleware/auth.js'
import crypto from 'crypto'

const router = Router()
router.use(authMiddleware)

const genTxRef = () => `VLT-INV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

/* ── LIVE PRICE MOCK (deterministic per symbol) ─────────────── */
const BASE_PRICES = {
  AAPL:189.42, NVDA:124.80, MSFT:432.10, TSLA:248.90, AMZN:187.30,
  META:590.30, GOOGL:162.80, JPM:245.80, BTC:67420, ETH:3210,
  SOL:142.40, BNB:594.20, ARB:1.24, OP:2.18,
}

function getLivePrice(symbol) {
  const base = BASE_PRICES[symbol] || 100
  const noise = (Math.sin(Date.now() / 90000 + symbol.charCodeAt(0)) * 0.012)
  return +(base * (1 + noise)).toFixed(8)
}

/* ── GET /api/investments ─────────────────────────────────────
   Returns all active investments for user with live P&L
─────────────────────────────────────────────────────────────── */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.sub
    const [rows] = await db.execute(
      `SELECT i.*, s.name as stock_name, s.exchange, s.sector, s.asset_type
       FROM investments i
       LEFT JOIN stocks s ON s.symbol = i.symbol
       WHERE i.user_id = ? AND i.status = 'active'
       ORDER BY i.current_value DESC`,
      [userId]
    )

    const enriched = rows.map(inv => {
      const livePrice    = getLivePrice(inv.symbol)
      const currentValue = +(Number(inv.current_value)).toFixed(2)
      const liveValue    = +(Number(inv.quantity) * livePrice).toFixed(2)
      const totalGain    = +(currentValue - Number(inv.total_invested)).toFixed(2)
      const gainPct      = +((totalGain / Number(inv.total_invested)) * 100).toFixed(2)
      const dayChange    = +(liveValue - currentValue).toFixed(2)
      return {
        ...inv,
        current_value:  currentValue,
        live_value:     liveValue,
        live_price:     livePrice,
        total_gain:     totalGain,
        gain_pct:       gainPct,
        day_change:     dayChange,
      }
    })

    const summary = {
      total_invested:  enriched.reduce((s, i) => s + Number(i.total_invested), 0),
      total_current:   enriched.reduce((s, i) => s + Number(i.current_value), 0),
      total_gain:      enriched.reduce((s, i) => s + Number(i.total_gain), 0),
      position_count:  enriched.length,
    }

    return res.json({ investments: enriched, summary })
  } catch (err) {
    console.error('investments GET error:', err.message)
    return res.status(500).json({ message: 'Failed to load investments.' })
  }
})

/* ── POST /api/investments ────────────────────────────────────
   Create a new investment (buy into a stock/crypto)
─────────────────────────────────────────────────────────────── */
router.post('/', async (req, res) => {
  try {
    const userId = req.user.sub
    const {
      symbol, quantity, purchase_price,
      asset_type = 'stock', name = null,
    } = req.body

    if (!symbol || !quantity || !purchase_price)
      return res.status(400).json({ message: 'symbol, quantity and purchase_price are required.' })

    const qty   = Number(quantity)
    const price = Number(purchase_price)
    if (qty <= 0 || price <= 0)
      return res.status(400).json({ message: 'quantity and purchase_price must be positive.' })

    const totalInvested = +(qty * price).toFixed(8)
    const txRef = genTxRef()

    const conn = await db.getConnection()
    try {
      await conn.beginTransaction()

      // Check if user already has this investment — update existing
      const [existing] = await conn.execute(
        `SELECT id, quantity, total_invested, current_value FROM investments
         WHERE user_id = ? AND symbol = ? AND status = 'active' FOR UPDATE`,
        [userId, symbol.toUpperCase()]
      )

      let investmentId
      if (existing.length > 0) {
        const inv = existing[0]
        const newQty     = +(Number(inv.quantity) + qty).toFixed(8)
        const newInvested = +(Number(inv.total_invested) + totalInvested).toFixed(8)
        const newValue    = +(Number(inv.current_value) + totalInvested).toFixed(8)
        await conn.execute(
          `UPDATE investments SET quantity=?, total_invested=?, current_value=?, updated_at=NOW()
           WHERE id=?`,
          [newQty, newInvested, newValue, inv.id]
        )
        investmentId = inv.id
      } else {
        const stockName = name || (await conn.execute(
          `SELECT name FROM stocks WHERE symbol = ?`, [symbol.toUpperCase()]
        ))[0][0]?.name || symbol

        const [result] = await conn.execute(
          `INSERT INTO investments (user_id, symbol, name, asset_type, quantity, purchase_price, current_value, total_invested, growth_rate)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 10.0000)`,
          [userId, symbol.toUpperCase(), stockName, asset_type, qty, price, totalInvested, totalInvested]
        )
        investmentId = result.insertId
      }

      // Record in transactions
      await conn.execute(
        `INSERT INTO transactions (user_id, type, currency, amount, fee, status, method, reference, note, description, payment_method)
         VALUES (?, 'investment', 'USD', ?, 0, 'completed', 'internal', ?, ?, ?, 'internal')`,
        [userId, totalInvested, txRef, `Investment: ${symbol.toUpperCase()} × ${qty}`, `Bought ${qty} ${symbol.toUpperCase()} @ $${price}`]
      )

      // Also update/create portfolio entry
      const [port] = await conn.execute(
        `SELECT id, quantity, avg_cost, total_invested FROM portfolio
         WHERE user_id = ? AND symbol = ? FOR UPDATE`,
        [userId, symbol.toUpperCase()]
      )
      if (port.length === 0) {
        await conn.execute(
          `INSERT INTO portfolio (user_id, symbol, quantity, avg_cost, total_invested, realised_pnl, first_bought_at)
           VALUES (?, ?, ?, ?, ?, 0, NOW())`,
          [userId, symbol.toUpperCase(), qty, price, totalInvested]
        )
      } else {
        const p = port[0]
        const newQty    = +(Number(p.quantity) + qty).toFixed(8)
        const newTotal  = +(Number(p.total_invested) + totalInvested).toFixed(8)
        const newAvg    = +(newTotal / newQty).toFixed(8)
        await conn.execute(
          `UPDATE portfolio SET quantity=?, avg_cost=?, total_invested=?, updated_at=NOW()
           WHERE user_id=? AND symbol=?`,
          [newQty, newAvg, newTotal, userId, symbol.toUpperCase()]
        )
      }

      await conn.commit()
      return res.status(201).json({
        message:      'Investment created successfully.',
        investmentId,
        totalInvested,
        reference:    txRef,
      })
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  } catch (err) {
    console.error('investments POST error:', err.message)
    return res.status(500).json({ message: 'Failed to create investment.' })
  }
})

/* ── POST /api/investments/:id/sell ──────────────────────────
   Sell/close an investment
─────────────────────────────────────────────────────────────── */
router.post('/:id/sell', async (req, res) => {
  try {
    const userId = req.user.sub
    const invId  = req.params.id
    const { quantity } = req.body

    const [[inv]] = await db.execute(
      `SELECT * FROM investments WHERE id = ? AND user_id = ? AND status = 'active'`,
      [invId, userId]
    )
    if (!inv) return res.status(404).json({ message: 'Investment not found.' })

    const sellQty   = quantity ? Number(quantity) : Number(inv.quantity)
    const livePrice = getLivePrice(inv.symbol)
    const sellValue = +(sellQty * livePrice).toFixed(8)
    const costBasis = +((sellQty / Number(inv.quantity)) * Number(inv.total_invested)).toFixed(8)
    const realised  = +(sellValue - costBasis).toFixed(8)
    const txRef     = genTxRef().replace('INV','SELL')

    const conn = await db.getConnection()
    try {
      await conn.beginTransaction()

      const newQty = +(Number(inv.quantity) - sellQty).toFixed(8)
      if (newQty <= 0) {
        await conn.execute(
          `UPDATE investments SET status='sold', quantity=0, current_value=0, updated_at=NOW() WHERE id=?`,
          [invId]
        )
      } else {
        const newInvested = +(Number(inv.total_invested) - costBasis).toFixed(8)
        const newValue    = +(Number(inv.current_value) * (newQty / Number(inv.quantity))).toFixed(8)
        await conn.execute(
          `UPDATE investments SET quantity=?, total_invested=?, current_value=?, updated_at=NOW() WHERE id=?`,
          [newQty, newInvested, newValue, invId]
        )
      }

      // Credit wallet
      await conn.execute(
        `UPDATE wallets SET balance = balance + ?, updated_at = NOW()
         WHERE user_id = ? AND currency = 'USD'`,
        [sellValue, userId]
      )

      // Record transaction
      await conn.execute(
        `INSERT INTO transactions (user_id, type, currency, amount, fee, status, method, reference, note, description, payment_method)
         VALUES (?, 'trade_credit', 'USD', ?, 0, 'completed', 'internal', ?, ?, ?, 'internal')`,
        [userId, sellValue, txRef, `Sold ${inv.symbol} × ${sellQty}`, `Sold ${sellQty} ${inv.symbol} @ $${livePrice.toFixed(2)} — P&L: ${realised >= 0 ? '+' : ''}$${Math.abs(realised).toFixed(2)}`]
      )

      await conn.commit()
      return res.json({ message: 'Investment sold.', sellValue, realised, reference: txRef })
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  } catch (err) {
    console.error('investments/sell error:', err.message)
    return res.status(500).json({ message: 'Failed to sell investment.' })
  }
})

/* ── GET /api/investments/growth-log ─────────────────────────
   Returns growth history for user
─────────────────────────────────────────────────────────────── */
router.get('/growth-log', async (req, res) => {
  try {
    const userId = req.user.sub
    const limit  = Math.min(Number(req.query.limit) || 50, 200)
    const [rows] = await db.execute(
      `SELECT * FROM investment_growth_log WHERE user_id = ?
       ORDER BY applied_at DESC LIMIT ?`,
      [userId, limit]
    )
    return res.json({ growth_log: rows })
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load growth log.' })
  }
})

export default router
