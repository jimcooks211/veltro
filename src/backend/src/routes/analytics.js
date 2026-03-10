// src/routes/analytics.js
import { Router } from 'express'
import { db }     from '../index.js'
import crypto     from 'crypto'

const router = Router()

/* ══════════════════════════════════════════════════════════════════
   HELPER — derive a session fingerprint from request headers
   No cookies needed — deterministic per browser session.
   Hashed so raw IP is never stored in the session_id column.
══════════════════════════════════════════════════════════════════ */
function buildSessionId(req) {
  const raw = [
    req.ip,
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
  ].join('|')
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 64)
}

/* ══════════════════════════════════════════════════════════════════
   HELPER — coarse device type from user-agent string
══════════════════════════════════════════════════════════════════ */
function getDeviceType(ua = '') {
  if (/tablet|ipad|playbook|silk/i.test(ua))               return 'tablet'
  if (/mobile|iphone|ipod|android|blackberry|mini/i.test(ua)) return 'mobile'
  return 'desktop'
}

/* ══════════════════════════════════════════════════════════════════
   POST /api/analytics/visit
   Body: { page?, referrer? }
   Called on every public page mount — fire-and-forget from frontend.
   Always returns 200 so a DB hiccup never breaks the landing page.
══════════════════════════════════════════════════════════════════ */
router.post('/visit', async (req, res) => {
  // respond immediately — don't make the client wait
  res.status(200).json({ ok: true })

  try {
    const {
      page     = '/',
      referrer = null,
    } = req.body

    const ip         = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip
    const ua         = req.headers['user-agent'] || null
    const sessionId  = buildSessionId(req)
    const deviceType = getDeviceType(ua)

    await db.execute(
      `INSERT INTO page_visits
         (session_id, ip_address, user_agent, referrer, page, device_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sessionId, ip, ua, referrer || null, page.slice(0, 200), deviceType]
    )
  } catch (err) {
    // silent — never surface analytics errors to the user
    console.error('Analytics write failed:', err.message)
  }
})

/* ══════════════════════════════════════════════════════════════════
   GET /api/stats/public
   Returns hardcoded platform stats for the landing hero section.
   When you're ready to go live, replace values with real DB queries.
══════════════════════════════════════════════════════════════════ */
router.get('/stats', async (req, res) => {
  try {
    // ── Live queries (uncomment when ready) ───────────────────────
    // const [[{ userCount }]]  = await db.execute('SELECT COUNT(*) AS userCount FROM users WHERE is_active = 1')
    // const [[{ tradeVol  }]]  = await db.execute('SELECT COALESCE(SUM(total),0) AS tradeVol FROM trades')
    // ─────────────────────────────────────────────────────────────

    return res.json({
      investors:      '190K+',
      assets_traded:  '$4.2B+',
      uptime:         '99.9%',
      countries:      '30+',
    })
  } catch (err) {
    console.error('Stats fetch failed:', err.message)
    return res.status(500).json({ message: 'Could not fetch stats.' })
  }
})

export default router