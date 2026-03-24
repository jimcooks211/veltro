// routes/deposit-addresses.js
import express from 'express'
import { db }  from '../config.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()
router.use(authMiddleware)

/* ── GET /api/deposit-addresses ──────────────────────────────── */
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT currency, network, address, label
       FROM deposit_addresses WHERE is_active = 1`
    )
    return res.json({ addresses: rows })
  } catch (err) {
    console.error('GET deposit-addresses:', err.message)
    return res.status(500).json({ message: 'Failed to load deposit addresses.' })
  }
})

export default router
