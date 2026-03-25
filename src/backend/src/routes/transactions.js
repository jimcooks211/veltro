// routes/transactions.js - unified transaction history across all activity
import { Router } from 'express'
import { db }     from '../config.js'
import authMiddleware from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

/* ── GET /api/transactions ────────────────────────────────────
   Full paginated transaction history with rich filters
─────────────────────────────────────────────────────────────── */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.sub
    const limit  = Math.min(Number(req.query.limit)  || 20, 200)
    const offset = Number(req.query.offset) || 0
    const type   = req.query.type   || null
    const status = req.query.status || null
    const method = req.query.method || null
    const search = req.query.search || null

    let where  = 'WHERE t.user_id = ?'
    const params = [userId]

    if (type)   { where += ' AND t.type = ?';            params.push(type) }
    if (status) { where += ' AND t.status = ?';          params.push(status) }
    if (method) { where += ' AND t.payment_method = ?';  params.push(method) }
    if (search) {
      where += ' AND (t.reference LIKE ? OR t.description LIKE ? OR t.note LIKE ?)'
      const s = `%${search}%`
      params.push(s, s, s)
    }

    const [rows] = await db.execute(
      `SELECT
         t.id, t.user_id, t.type, t.currency, t.amount, t.fee,
         t.net_amount, t.status, t.method, t.reference,
         t.payment_method, t.bank_name, t.account_last4,
         t.note, t.description,
         t.balance_before, t.balance_after,
         t.created_at, t.updated_at
       FROM transactions t
       ${where}
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )

    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM transactions t ${where}`,
      params
    )

    // Summary stats
    const [[stats]] = await db.execute(
      `SELECT
         COALESCE(SUM(CASE WHEN type='deposit'    AND status='completed' THEN amount ELSE 0 END), 0) AS total_deposited,
         COALESCE(SUM(CASE WHEN type='withdrawal' AND status='completed' THEN amount ELSE 0 END), 0) AS total_withdrawn,
         COALESCE(SUM(CASE WHEN type NOT IN ('deposit','credit','refund') THEN fee ELSE 0 END), 0)   AS total_fees,
         COALESCE(SUM(CASE WHEN type IN ('credit','refund') AND status='completed' THEN amount ELSE 0 END), 0) AS total_credits,
         COUNT(CASE WHEN status='pending' THEN 1 END) AS pending_count
       FROM transactions WHERE user_id = ?`,
      [userId]
    )

    // Current balance
    const [[wallet]] = await db.execute(
      `SELECT COALESCE(SUM(balance), 0) AS total_balance FROM wallets WHERE user_id = ?`,
      [userId]
    )

    return res.json({
      transactions: rows,
      total,
      limit,
      offset,
      stats: {
        current_balance:  Number(wallet.total_balance),
        total_deposited:  Number(stats.total_deposited),
        total_withdrawn:  Number(stats.total_withdrawn),
        total_fees:       Number(stats.total_fees),
        total_credits:    Number(stats.total_credits),
        pending_count:    Number(stats.pending_count),
      }
    })
  } catch (err) {
    console.error('transactions GET error:', err.message)
    return res.status(500).json({ message: 'Failed to load transactions.' })
  }
})

/* ── GET /api/transactions/:id ────────────────────────────────
   Single transaction detail
─────────────────────────────────────────────────────────────── */
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.sub
    const txId   = req.params.id

    const [[tx]] = await db.execute(
      `SELECT * FROM transactions WHERE id = ? AND user_id = ?`,
      [txId, userId]
    )
    if (!tx) return res.status(404).json({ message: 'Transaction not found.' })

    return res.json({ transaction: tx })
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load transaction.' })
  }
})

/* ── GET /api/transactions/monthly-stats ─────────────────────
   Monthly deposit/withdrawal chart data (last 6 months)
─────────────────────────────────────────────────────────────── */
router.get('/stats/monthly', async (req, res) => {
  try {
    const userId = req.user.sub
    const [rows] = await db.execute(
      `SELECT
         DATE_FORMAT(created_at, '%b') AS month,
         MONTH(created_at) AS month_num,
         YEAR(created_at) AS year,
         COALESCE(SUM(CASE WHEN type='deposit'    AND status='completed' THEN amount ELSE 0 END), 0) AS deposits,
         COALESCE(SUM(CASE WHEN type='withdrawal' AND status='completed' THEN amount ELSE 0 END), 0) AS withdrawals
       FROM transactions
       WHERE user_id = ?
         AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY year, month_num, month
       ORDER BY year, month_num`,
      [userId]
    )
    return res.json({ monthly: rows })
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load monthly stats.' })
  }
})

export default router
