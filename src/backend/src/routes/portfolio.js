// routes/portfolio.js
import { Router } from 'express'
import { db }     from '../config.js'
import authMiddleware from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

/* ── GET /api/portfolio ───────────────────────────────────────────
   Returns the user's holdings with current mock prices applied.
──────────────────────────────────────────────────────────────── */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.sub

    const [holdings] = await db.execute(
      `SELECT p.id, p.symbol, p.quantity, p.avg_cost,
              p.total_invested, p.realised_pnl, p.first_bought_at,
              s.name, s.exchange, s.sector, s.asset_type
       FROM portfolio p
       LEFT JOIN stocks s ON s.symbol = p.symbol
       WHERE p.user_id = ? AND p.quantity > 0
       ORDER BY p.total_invested DESC`,
      [userId]
    )

    return res.json({ holdings })
  } catch (err) {
    console.error('portfolio error:', err.message)
    return res.status(500).json({ message: 'Failed to load portfolio.' })
  }
})

/* ── GET /api/portfolio/summary ──────────────────────────────────
   Aggregated stats: total invested, realised PnL, position count.
──────────────────────────────────────────────────────────────── */
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user.sub

    const [[stats]] = await db.execute(
      `SELECT
         COUNT(*)                   AS open_positions,
         COALESCE(SUM(total_invested), 0) AS total_invested,
         COALESCE(SUM(realised_pnl),  0) AS total_realised_pnl
       FROM portfolio
       WHERE user_id = ? AND quantity > 0`,
      [userId]
    )

    const [[walletStats]] = await db.execute(
      `SELECT COALESCE(SUM(balance), 0) AS total_balance
       FROM wallets WHERE user_id = ?`,
      [userId]
    )

    return res.json({
      open_positions:    stats.open_positions,
      total_invested:    Number(stats.total_invested),
      total_realised_pnl: Number(stats.total_realised_pnl),
      cash_balance:      Number(walletStats.total_balance),
    })
  } catch (err) {
    console.error('portfolio/summary error:', err.message)
    return res.status(500).json({ message: 'Failed to load summary.' })
  }
})

export default router
