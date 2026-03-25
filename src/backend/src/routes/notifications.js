import express        from 'express'
import { db }         from '../config.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

/* â”€â”€ sensible defaults every new user inherits â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const DEFAULT_PREFS = {
  security_email:     true,  security_push:     true,  security_sms:     true,
  deposits_email:     true,  deposits_push:     true,  deposits_sms:     false,
  withdrawals_email:  true,  withdrawals_push:  true,  withdrawals_sms:  false,
  trades_email:       true,  trades_push:       true,  trades_sms:       false,
  kyc_email:          true,  kyc_push:          true,  kyc_sms:          false,
  prices_email:       false, prices_push:       true,  prices_sms:       false,
  marketing_email:    false, marketing_push:    false, marketing_sms:    false,
  freq:               'instant',
  quiet_hours_on:     true,
  quiet_from:         '22:00',
  quiet_to:           '08:00',
  sound_on:           true,
  volume:             65,
}

async function ensureRow(userId) {
  const cols = Object.keys(DEFAULT_PREFS).join(', ')
  const placeholders = Object.keys(DEFAULT_PREFS).map(() => '?').join(', ')
  await db.execute(
    `INSERT IGNORE INTO notification_preferences (user_id, ${cols}) VALUES (?, ${placeholders})`,
    [userId, ...Object.values(DEFAULT_PREFS)]
  )
}

/* â”€â”€ GET /api/notifications/preferences â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
router.get('/preferences', requireAuth, async (req, res) => {
  try {
    await ensureRow(req.userId)
    const [rows] = await db.execute(
      'SELECT * FROM notification_preferences WHERE user_id = ?', [req.userId]
    )
    if (!rows.length) return res.json({ preferences: DEFAULT_PREFS })
    const { user_id, id, created_at, updated_at, ...prefs } = rows[0]
    return res.json({ preferences: prefs })
  } catch (err) {
    console.error('GET notifications/preferences:', err.message)
    return res.status(500).json({ message: 'Failed to load notification preferences.' })
  }
})

/* â”€â”€ PATCH /api/notifications/preferences â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
router.patch('/preferences', requireAuth, async (req, res) => {
  const allowed = new Set(Object.keys(DEFAULT_PREFS))
  const updates = {}
  for (const [k, v] of Object.entries(req.body)) {
    if (allowed.has(k)) updates[k] = v
  }
  if (!Object.keys(updates).length)
    return res.status(400).json({ message: 'No valid fields provided.' })
  try {
    await ensureRow(req.userId)
    const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ')
    await db.execute(
      `UPDATE notification_preferences SET ${setClauses}, updated_at = NOW() WHERE user_id = ?`,
      [...Object.values(updates), req.userId]
    )
    return res.json({ message: 'Preferences saved.' })
  } catch (err) {
    console.error('PATCH notifications/preferences:', err.message)
    return res.status(500).json({ message: 'Failed to save notification preferences.' })
  }
})

/* â”€â”€ GET /api/notifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
router.get('/', requireAuth, async (req, res) => {
  try {
    const limit  = Math.min(Number(req.query.limit) || 30, 100)
    const offset = Number(req.query.offset) || 0
    const [rows] = await db.execute(
      `SELECT id, type, title, message, is_read, meta, created_at
       FROM notifications WHERE user_id = ?
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [req.userId, limit, offset]
    )
    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM notifications WHERE user_id = ?`, [req.userId]
    )
    const [[{ unread }]] = await db.execute(
      `SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND is_read = 0`, [req.userId]
    )
    return res.json({ notifications: rows, total, unread, limit, offset })
  } catch (err) {
    console.error('GET notifications:', err.message)
    return res.status(500).json({ message: 'Failed to load notifications.' })
  }
})

/* â”€â”€ GET /api/notifications/unread-count â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
router.get('/unread-count', requireAuth, async (req, res) => {
  try {
    const [[{ unread }]] = await db.execute(
      `SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND is_read = 0`, [req.userId]
    )
    return res.json({ unread })
  } catch (err) {
    return res.status(500).json({ unread: 0 })
  }
})

/* â”€â”€ PATCH /api/notifications/read â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
router.patch('/read', requireAuth, async (req, res) => {
  try {
    const { ids } = req.body // array of ids, or omit to mark all
    if (ids?.length) {
      const placeholders = ids.map(() => '?').join(',')
      await db.execute(
        `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND id IN (${placeholders})`,
        [req.userId, ...ids]
      )
    } else {
      await db.execute(
        `UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [req.userId]
      )
    }
    return res.json({ message: 'Marked as read.' })
  } catch (err) {
    console.error('PATCH notifications/read:', err.message)
    return res.status(500).json({ message: 'Failed to mark as read.' })
  }
})

/* â”€â”€ DELETE /api/notifications/:id â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await db.execute(
      `DELETE FROM notifications WHERE id = ? AND user_id = ?`, [req.params.id, req.userId]
    )
    return res.json({ message: 'Deleted.' })
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete notification.' })
  }
})

export default router

