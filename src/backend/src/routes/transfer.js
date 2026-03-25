// routes/transfer.js - internal currency/asset transfers
import { Router } from 'express'
import { db }     from '../config.js'
import authMiddleware from '../middleware/auth.js'
import crypto from 'crypto'

const router = Router()
router.use(authMiddleware)

// Live exchange rates (mock - in production use a real rates API)
const RATES_TO_USD = { USD:1, USDC:1, BTC:67420, ETH:3210, SOL:142.4 }

function getRate(from, to) {
  const fromUSD = RATES_TO_USD[from] || 1
  const toUSD   = RATES_TO_USD[to]   || 1
  return +(fromUSD / toUSD).toFixed(8)
}

/* ── POST /api/transfer ───────────────────────────────────────
   Convert/transfer between user's own wallets
─────────────────────────────────────────────────────────────── */
router.post('/', async (req, res) => {
  try {
    const userId = req.user.sub
    const {
      from_currency,
      to_currency,
      from_amount,
      note = null,
    } = req.body

    if (!from_currency || !to_currency || !from_amount)
      return res.status(400).json({ message: 'from_currency, to_currency and from_amount are required.' })

    if (from_currency === to_currency)
      return res.status(400).json({ message: 'Cannot transfer to the same currency.' })

    const amount = Number(from_amount)
    if (amount <= 0)
      return res.status(400).json({ message: 'Amount must be positive.' })

    const rate     = getRate(from_currency.toUpperCase(), to_currency.toUpperCase())
    const toAmount = +(amount * rate).toFixed(8)
    const fee      = 0 // no transfer fee between own wallets
    const txRef    = `VLT-TRF-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

    const conn = await db.getConnection()
    try {
      await conn.beginTransaction()

      // Verify from wallet has sufficient balance
      const [[fromWallet]] = await conn.execute(
        `SELECT balance, reserved FROM wallets WHERE user_id = ? AND currency = ? FOR UPDATE`,
        [userId, from_currency.toUpperCase()]
      )
      if (!fromWallet)
        return res.status(400).json({ message: `No ${from_currency} wallet found.` })

      const available = Number(fromWallet.balance) - Number(fromWallet.reserved)
      if (amount > available)
        return res.status(400).json({ message: 'Insufficient available balance.' })

      // Deduct from source wallet
      await conn.execute(
        `UPDATE wallets SET balance = balance - ?, updated_at = NOW()
         WHERE user_id = ? AND currency = ?`,
        [amount, userId, from_currency.toUpperCase()]
      )

      // Credit to destination wallet (create if not exists)
      await conn.execute(
        `INSERT INTO wallets (user_id, currency, balance, reserved)
         VALUES (?, ?, ?, 0)
         ON DUPLICATE KEY UPDATE balance = balance + ?`,
        [userId, to_currency.toUpperCase(), toAmount, toAmount]
      )

      // Record transfer
      await conn.execute(
        `INSERT INTO transfers (user_id, from_currency, to_currency, from_amount, to_amount, exchange_rate, fee, status, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', ?)`,
        [userId, from_currency.toUpperCase(), to_currency.toUpperCase(), amount, toAmount, rate, fee, note]
      )

      // Record outgoing transaction
      await conn.execute(
        `INSERT INTO transactions (user_id, type, currency, amount, fee, status, method, reference, note, description, payment_method)
         VALUES (?, 'transfer', ?, ?, 0, 'completed', 'internal', ?, ?, ?, 'internal')`,
        [userId, from_currency.toUpperCase(), amount, txRef,
         `Transfer: ${from_currency} → ${to_currency}`,
         `Converted ${amount} ${from_currency} to ${toAmount} ${to_currency} @ rate ${rate}`]
      )

      await conn.commit()
      return res.status(201).json({
        message:       'Transfer completed successfully.',
        from_currency: from_currency.toUpperCase(),
        to_currency:   to_currency.toUpperCase(),
        from_amount:   amount,
        to_amount:     toAmount,
        exchange_rate: rate,
        reference:     txRef,
      })
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  } catch (err) {
    console.error('transfer error:', err.message)
    return res.status(500).json({ message: 'Failed to process transfer.' })
  }
})

/* ── GET /api/transfer/history ────────────────────────────────
   List past transfers for the user
─────────────────────────────────────────────────────────────── */
router.get('/history', async (req, res) => {
  try {
    const userId = req.user.sub
    const limit  = Math.min(Number(req.query.limit) || 20, 100)
    const offset = Number(req.query.offset) || 0
    const [rows] = await db.execute(
      `SELECT * FROM transfers WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    )
    return res.json({ transfers: rows, limit, offset })
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load transfer history.' })
  }
})

/* ── GET /api/transfer/rates ──────────────────────────────────
   Return current exchange rates
─────────────────────────────────────────────────────────────── */
router.get('/rates', async (req, res) => {
  const rates = {}
  const currencies = Object.keys(RATES_TO_USD)
  for (const from of currencies) {
    rates[from] = {}
    for (const to of currencies) {
      if (from !== to) rates[from][to] = getRate(from, to)
    }
  }
  return res.json({ rates, timestamp: new Date().toISOString() })
})

export default router
