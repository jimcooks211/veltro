// routes/orders.js
import { Router } from 'express'
import { db }     from '../config.js'
import authMiddleware from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

/* ── GET /api/orders ─────────────────────────────────────────────
   Paginated order history. Filter by status, symbol, side.
──────────────────────────────────────────────────────────────── */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.sub
    const limit  = Math.min(Number(req.query.limit) || 20, 100)
    const offset = Number(req.query.offset) || 0
    const status = req.query.status || null
    const symbol = req.query.symbol || null
    const side   = req.query.side   || null

    let where = 'WHERE user_id = ?'
    const params = [userId]

    if (status) { where += ' AND status = ?';  params.push(status) }
    if (symbol) { where += ' AND symbol = ?';  params.push(symbol.toUpperCase()) }
    if (side)   { where += ' AND side = ?';    params.push(side.toUpperCase()) }

    const [rows] = await db.execute(
      `SELECT id, symbol, side, order_type, quantity, filled_qty,
              price, avg_fill_price, status, fee, created_at, updated_at
       FROM orders ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )

    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM orders ${where}`,
      params
    )

    return res.json({ orders: rows, total, limit, offset })
  } catch (err) {
    console.error('orders error:', err.message)
    return res.status(500).json({ message: 'Failed to load orders.' })
  }
})

/* ── POST /api/orders ────────────────────────────────────────────
   Place a new order. Market orders fill immediately (mock).
   Limit orders go to 'open' status.
──────────────────────────────────────────────────────────────── */
router.post('/', async (req, res) => {
  try {
    const userId = req.user.sub
    const { symbol, side, order_type = 'Market', quantity, price = null } = req.body

    if (!symbol || !side || !quantity)
      return res.status(400).json({ message: 'symbol, side and quantity are required.' })

    if (!['BUY','SELL'].includes(side.toUpperCase()))
      return res.status(400).json({ message: 'side must be BUY or SELL.' })

    const isMarket = order_type.toUpperCase() === 'MARKET'
    const status   = isMarket ? 'filled' : 'open'
    const filledQty = isMarket ? quantity : 0
    const avgFill  = isMarket ? (price || 0) : null
    const fee      = isMarket ? (Number(quantity) * (price || 0) * 0.001) : 0

    const conn = await db.getConnection()
    try {
      await conn.beginTransaction()

      const [result] = await conn.execute(
        `INSERT INTO orders
           (user_id, symbol, side, order_type, quantity, filled_qty,
            price, avg_fill_price, status, fee)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId, symbol.toUpperCase(), side.toUpperCase(),
          order_type.toUpperCase(), Number(quantity), Number(filledQty),
          price ? Number(price) : null, avgFill ? Number(avgFill) : null,
          status, Number(fee),
        ]
      )

      // If market order filled - update portfolio
      if (isMarket && price) {
        const [existing] = await conn.execute(
          `SELECT id, quantity, avg_cost, total_invested
           FROM portfolio WHERE user_id = ? AND symbol = ? FOR UPDATE`,
          [userId, symbol.toUpperCase()]
        )

        if (side.toUpperCase() === 'BUY') {
          if (existing.length === 0) {
            await conn.execute(
              `INSERT INTO portfolio (user_id, symbol, quantity, avg_cost, total_invested, realised_pnl, first_bought_at)
               VALUES (?, ?, ?, ?, ?, 0, NOW())`,
              [userId, symbol.toUpperCase(), Number(quantity), Number(price), Number(quantity) * Number(price)]
            )
          } else {
            const row  = existing[0]
            const newQty   = Number(row.quantity) + Number(quantity)
            const newTotal = Number(row.total_invested) + Number(quantity) * Number(price)
            const newAvg   = newTotal / newQty
            await conn.execute(
              `UPDATE portfolio SET quantity=?, avg_cost=?, total_invested=?, updated_at=NOW()
               WHERE user_id=? AND symbol=?`,
              [newQty, newAvg, newTotal, userId, symbol.toUpperCase()]
            )
          }
        } else if (side.toUpperCase() === 'SELL' && existing.length > 0) {
          const row     = existing[0]
          const newQty  = Math.max(0, Number(row.quantity) - Number(quantity))
          const realised = (Number(price) - Number(row.avg_cost)) * Number(quantity)
          await conn.execute(
            `UPDATE portfolio SET quantity=?, realised_pnl = realised_pnl + ?, updated_at=NOW()
             WHERE user_id=? AND symbol=?`,
            [newQty, realised, userId, symbol.toUpperCase()]
          )
        }
      }

      await conn.commit()
      return res.status(201).json({ message: 'Order placed.', orderId: result.insertId, status })
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  } catch (err) {
    console.error('orders/place error:', err.message)
    return res.status(500).json({ message: 'Failed to place order.' })
  }
})

/* ── DELETE /api/orders/:id ─────────────────────────────────────
   Cancel an open order.
──────────────────────────────────────────────────────────────── */
router.delete('/:id', async (req, res) => {
  try {
    const userId  = req.user.sub
    const orderId = req.params.id

    const [[order]] = await db.execute(
      `SELECT id, status FROM orders WHERE id = ? AND user_id = ?`,
      [orderId, userId]
    )

    if (!order)      return res.status(404).json({ message: 'Order not found.' })
    if (order.status !== 'open')
      return res.status(400).json({ message: 'Only open orders can be cancelled.' })

    await db.execute(
      `UPDATE orders SET status='cancelled', updated_at=NOW() WHERE id=? AND user_id=?`,
      [orderId, userId]
    )

    return res.json({ message: 'Order cancelled.' })
  } catch (err) {
    console.error('orders/cancel error:', err.message)
    return res.status(500).json({ message: 'Failed to cancel order.' })
  }
})

export default router
