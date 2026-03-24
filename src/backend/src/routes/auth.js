// src/routes/auth.js
import { Router }        from 'express'
import bcrypt            from 'bcryptjs'
import jwt               from 'jsonwebtoken'
import crypto            from 'crypto'
import { db, sendEmail } from '../config.js'
import { requireAuth }   from '../middleware/auth.js'
import { createNotification, parseUA, geoLookup } from '../services/notify.js'

const router = Router()

const generateCode   = () => Math.floor(100000 + Math.random() * 900000).toString()
const generateUserId = () => crypto.randomUUID()

function signAccess(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '1h' })
}
function signRefresh(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

function emailShell({ preheader = '', body = '', year = new Date().getFullYear() } = {}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta name="color-scheme" content="dark"/>
  <title>Veltro</title>
</head>
<body style="margin:0;padding:0;background:#060A18;font-family:'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
    style="background:#060A18;padding:48px 16px;">
    <tr><td align="center">

      <table width="560" cellpadding="0" cellspacing="0" role="presentation"
        style="max-width:560px;width:100%;background:#0D1226;border-radius:24px;
               border:1px solid rgba(255,255,255,0.07);overflow:hidden;">

        <tr>
          <td style="height:4px;background:linear-gradient(90deg,#1A56FF 0%,#00D4FF 50%,#C9A84C 100%);
                     font-size:0;line-height:0;">&nbsp;</td>
        </tr>

        <tr>
          <td align="center" style="padding:40px 48px 32px;">
            <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
              <tr>
                <td valign="middle" style="padding-right:10px;">
                  <img src="https://raw.githubusercontent.com/jimcooks211/veltro/main/src/backend/src/VeltroLogo.png"
                       alt="Veltro"
                       width="53"
                       style="display:block;border:0;outline:none;text-decoration:none;"
                  />
                </td>
                <td valign="middle">
                  <span style="font-size:22px;font-weight:800;letter-spacing:-0.5px;color:#EEF2FF;
                                font-family:Syne,'Segoe UI',Arial,sans-serif;white-space:nowrap;">
                    VELTRO
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:0 48px;">
            <div style="height:1px;background:rgba(255,255,255,0.06);"></div>
          </td>
        </tr>

        ${body}

        <tr>
          <td style="padding:0 48px;">
            <div style="height:1px;background:rgba(255,255,255,0.06);"></div>
          </td>
        </tr>

        <tr>
          <td align="center" style="padding:28px 48px 36px;">
            <p style="margin:0 0 8px;font-size:12px;color:rgba(138,150,180,0.5);
                      font-family:'Segoe UI',Arial,sans-serif;letter-spacing:0.3px;">
              &copy; ${year} Veltro Technologies Inc. All rights reserved.
            </p>
            <p style="margin:0;font-size:11px;color:rgba(138,150,180,0.35);
                      font-family:'Segoe UI',Arial,sans-serif;">
              You&apos;re receiving this because you have a Veltro account.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function buildVerificationEmail(code) {
  const digits = code.split('')

  const body = `
    <tr>
      <td style="padding:40px 48px 0;">
        <h1 style="margin:0 0 12px;font-size:28px;font-weight:800;color:#EEF2FF;
                   letter-spacing:-0.8px;font-family:'Segoe UI',Arial,sans-serif;line-height:1.2;">
          Verify your email
        </h1>
        <p style="margin:0;font-size:15px;color:#8A96B4;line-height:1.7;
                  font-family:'Segoe UI',Arial,sans-serif;">
          Use the code below to confirm your email address and activate your Veltro account.
          This code expires in <strong style="color:#EEF2FF;font-weight:600;">15 minutes</strong>.
        </p>
      </td>
    </tr>

    <tr>
      <td align="center" style="padding:36px 48px;">
        <table cellpadding="0" cellspacing="0" role="presentation"
          style="background:#0D1635;border:1px solid rgba(26,86,255,0.25);border-radius:20px;">
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:2px;
                        color:#1A56FF;text-transform:uppercase;font-family:'Segoe UI',Arial,sans-serif;
                        text-align:center;">
                Your verification code
              </p>
              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
                <tr>
                  ${digits.map(d => `
                    <td style="padding:0 4px;">
                      <table cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td width="44" height="72" align="center" valign="middle"
                            style="width:56px;height:72px;padding:0 12px;
                                   background:rgba(255,255,255,0.05);
                                   border:1px solid rgba(255,255,255,0.1);border-radius:12px;
                                   font-size:28px;font-weight:900;color:#EEF2FF;
                                   font-family:'Segoe UI',Arial,sans-serif;text-align:center;">
                            ${d}
                          </td>
                        </tr>
                      </table>
                    </td>
                  `).join('')}
                </tr>
              </table>
              <p style="margin:16px 0 0;font-size:12px;color:rgba(138,150,180,0.6);
                        font-family:'Segoe UI',Arial,sans-serif;text-align:center;">
                Valid for 15 minutes &middot; Do not share this code
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:0 48px 40px;">
        <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
          <tr>
            <td style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.15);
                       border-radius:12px;padding:16px 20px;">
              <p style="margin:0;font-size:13px;color:rgba(201,168,76,0.8);
                        font-family:'Segoe UI',Arial,sans-serif;line-height:1.6;">
                If you didn&apos;t create a Veltro account, you can safely ignore this email.
                Your account will not be activated without this code.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `

  return emailShell({ preheader: `Your Veltro verification code is ${code}`, body })
}

async function sendVerificationEmail(to, code) {
  await sendEmail({
    to,
    subject: `${code} — Your Veltro verification code`,
    html:    buildVerificationEmail(code),
    text:    `Your Veltro verification code is: ${code}\n\nIt expires in 15 minutes.\n\nIf you didn't create a Veltro account, ignore this email.`,
  })
}

const withEmailTimeout = (promise) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error('Email timeout')), 8000))
])

router.post('/register', async (req, res) => {
  const { fullName, email, password } = req.body

  if (!fullName?.trim() || !email?.trim() || !password)
    return res.status(400).json({ message: 'All fields are required.' })
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email))
    return res.status(400).json({ message: 'Invalid email address.' })
  if (password.length < 8)
    return res.status(400).json({ message: 'Password must be at least 8 characters.' })

  try {
    const [[existing]] = await db.execute(
      'SELECT id, is_verified FROM users WHERE email = ?', [email.toLowerCase()]
    )
    if (existing && existing.is_verified) {
      return res.status(409).json({
        message:  'You already have an account with this email. Sign in to continue. If this is a mistake, contact our support.',
        nextStep: 'login',
      })
    }
    if (existing && !existing.is_verified) {
      return res.status(409).json({
        message:  'You already started registration with this email. Sign in to continue where you left off. If this is a mistake, contact our support.',
        nextStep: 'login',
        email:    email.toLowerCase(),
      })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const code         = generateCode()
    const expiresAt    = new Date(Date.now() + 15 * 60 * 1000)
    const parts        = fullName.trim().split(' ')
    const firstName    = parts[0]
    const lastName     = parts.slice(1).join(' ') || ''
    const userId       = generateUserId()

    await db.execute(
      `INSERT INTO users
         (id, email, password_hash, is_verified,
          verification_code, verification_code_expires,
          verification_code_last_sent)
       VALUES (?, ?, ?, 0, ?, ?, NOW())`,
      [userId, email.toLowerCase(), passwordHash, code, expiresAt]
    )
    await db.execute(
      `INSERT INTO profiles (user_id, first_name, last_name) VALUES (?, ?, ?)`,
      [userId, firstName, lastName]
    )
    await db.execute(`INSERT INTO wallets (user_id) VALUES (?)`, [userId])

    // signup notification
    createNotification({
      userId,
      type: 'signup',
      title: 'Welcome to Veltro!',
      message: `Your account has been created. Verify your email to get started.`,
      meta: { email: email.toLowerCase() },
    })

    try {
      await withEmailTimeout(sendVerificationEmail(email, code))
    } catch (mailErr) {
      console.error('Verification email failed:', mailErr.message)
    }

    return res.status(201).json({
      message:   'Account created. Check your email for the verification code.',
      email:     email.toLowerCase(),
      userId,
      fullName:  fullName.trim(),
      firstName,
      lastName,
    })

  } catch (err) {
    console.error('Register error:', err.message)
    return res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
})

router.post('/verify-email', async (req, res) => {
  const { email, code, remember = false } = req.body
  if (!email || !code)
    return res.status(400).json({ message: 'Email and code are required.' })

  try {
    const [[user]] = await db.execute(
      `SELECT id, email, is_verified, verification_code, verification_code_expires
       FROM users WHERE email = ?`,
      [email.toLowerCase()]
    )

    if (!user)
      return res.status(404).json({ message: 'No account found with that email.' })
    if (user.verification_code !== code)
      return res.status(400).json({ message: 'Invalid code. Please check and try again.' })
    if (new Date() > new Date(user.verification_code_expires))
      return res.status(400).json({ message: 'This code has expired. Request a new one.' })

    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip

    await db.execute(
      `UPDATE users
       SET is_verified = 1,
           verified_at = COALESCE(verified_at, NOW()),
           verification_code = NULL,
           verification_code_expires = NULL,
           last_login_at = NOW(),
           last_login_ip = ?,
           login_count   = login_count + 1
       WHERE id = ?`,
      [ip, user.id]
    )

    const accessToken  = signAccess(user.id)
    const refreshToken = signRefresh(user.id)
    const expiresAt    = remember
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() +  24 * 60 * 60 * 1000)

    // resolve geo + ua in parallel (non-blocking)
    const [geo, uaParsed] = await Promise.all([geoLookup(ip), Promise.resolve(parseUA(req.headers['user-agent'] || ''))])

    await db.execute(
      `INSERT INTO sessions (user_id, refresh_token, ip_address, user_agent, expires_at, city, country, country_code, browser, os, device_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user.id, refreshToken, ip, req.headers['user-agent'] || null, expiresAt,
       geo.city, geo.country, geo.country_code, uaParsed.browser, uaParsed.os, uaParsed.device_type]
    )
    await db.execute(
      `INSERT INTO security_log (user_id, event, ip_address) VALUES (?, 'login_success', ?)`,
      [user.id, ip]
    )

    // login notification
    const location = [geo.city, geo.country].filter(Boolean).join(', ') || ip
    createNotification({
      userId: user.id,
      type: 'login',
      title: 'New login to your account',
      message: `Signed in from ${uaParsed.browser} on ${uaParsed.os} · ${location}`,
      meta: { ip, browser: uaParsed.browser, os: uaParsed.os, device: uaParsed.device_type, city: geo.city, country: geo.country },
    })

    const [[profile]] = await db.execute(
      `SELECT first_name, last_name, username, gender, date_of_birth,
              address_line1, city, state, zip, country,
              occupation, investment_experience
       FROM profiles WHERE user_id = ?`,
      [user.id]
    )
    const [[meta]] = await db.execute(
      `SELECT plan, risk_profile, onboarding_complete FROM users WHERE id = ?`, [user.id]
    )

    const PROFILE_REQUIRED = [
      'first_name','last_name','username','gender','date_of_birth',
      'address_line1','city','state','zip','country',
      'occupation','investment_experience',
    ]
    const profileComplete = profile && PROFILE_REQUIRED.every(f => !!profile[f])

    let nextStep
    if (!profileComplete)                nextStep = 'createprofile'
    else if (!meta?.onboarding_complete) nextStep = 'onboard'
    else                                 nextStep = 'dashboard'

    return res.status(200).json({
      message: 'Verified successfully.',
      accessToken,
      refreshToken,
      nextStep,
      userId: user.id,
      user: { id: user.id, email: user.email, firstName: profile?.first_name || null },
    })

  } catch (err) {
    console.error('Verify email error:', err.message)
    return res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
})

router.post('/resend-verification', async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ message: 'Email is required.' })

  try {
    const [[user]] = await db.execute(
      `SELECT id, is_verified, verification_code_resent_count, verification_code_last_sent
       FROM users WHERE email = ?`,
      [email.toLowerCase()]
    )

    if (!user)
      return res.status(404).json({ message: 'No account found with that email.' })
    if (user.verification_code_resent_count >= 5)
      return res.status(429).json({ message: 'Too many resend attempts. Please contact support.' })

    const lastSent = new Date(user.verification_code_last_sent)
    if (Date.now() - lastSent.getTime() < 60_000)
      return res.status(429).json({ message: 'Please wait a moment before requesting another code.' })

    const code      = generateCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await db.execute(
      `UPDATE users
       SET verification_code = ?, verification_code_expires = ?,
           verification_code_last_sent = NOW(),
           verification_code_resent_count = verification_code_resent_count + 1
       WHERE id = ?`,
      [code, expiresAt, user.id]
    )

    try {
      await withEmailTimeout(sendVerificationEmail(email, code))
    } catch (mailErr) {
      console.error('Resend email failed:', mailErr.message)
      return res.status(500).json({ message: 'Failed to send code. Please try again in a moment.' })
    }

    return res.status(200).json({ message: 'A new code has been sent to your email.' })

  } catch (err) {
    console.error('Resend verification error:', err.message)
    return res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
})

router.post('/login', async (req, res) => {
  const { email, password, remember = false } = req.body
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required.' })

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip

  try {
    const [[user]] = await db.execute(
      `SELECT id, email, password_hash, is_verified, is_active,
              is_banned, failed_login_attempts, locked_until
       FROM users WHERE email = ?`,
      [email.toLowerCase()]
    )

    if (!user)
      return res.status(401).json({ message: "Those credentials didn't match. Want to try again?" })
    if (user.is_banned)
      return res.status(403).json({ message: 'Your account has been suspended. Please contact support.' })
    if (user.locked_until && new Date() < new Date(user.locked_until))
      return res.status(423).json({ message: 'Too many failed attempts. Account locked for 15 minutes.' })

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      const attempts  = user.failed_login_attempts + 1
      const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null
      await db.execute(
        `UPDATE users SET failed_login_attempts=?,locked_until=?,last_login_ip=? WHERE id=?`,
        [attempts, lockUntil, ip, user.id]
      )
      await db.execute(
        `INSERT INTO security_log (user_id, event, ip_address) VALUES (?, 'login_failed', ?)`,
        [user.id, ip]
      )
      if (attempts >= 5)
        return res.status(423).json({ message: 'Too many failed attempts. Account locked for 15 minutes.' })
      return res.status(401).json({ message: "Those credentials didn't match. Want to try again?" })
    }

    await db.execute(
      `UPDATE users SET failed_login_attempts=0,locked_until=NULL,last_login_ip=? WHERE id=?`,
      [ip, user.id]
    )

    const loginCode   = generateCode()
    const codeExpires = new Date(Date.now() + 15 * 60 * 1000)

    await db.execute(
      `UPDATE users SET verification_code=?,verification_code_expires=?,
       verification_code_last_sent=NOW() WHERE id=?`,
      [loginCode, codeExpires, user.id]
    )

    try {
      await withEmailTimeout(sendVerificationEmail(user.email, loginCode))
    } catch (mailErr) {
      console.error('Login code email failed:', mailErr.message)
      return res.status(500).json({ message: 'Failed to send login code. Please try again.' })
    }

    return res.status(200).json({
      message:  'A verification code has been sent to your email.',
      nextStep: 'verify',
      email:    user.email,
      remember,
    })

  } catch (err) {
    console.error('Login error:', err.message)
    return res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
})

router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body
  if (refreshToken) {
    await db.execute(
      `UPDATE sessions SET is_revoked=1 WHERE refresh_token=?`, [refreshToken]
    ).catch(() => {})
  }
  return res.status(200).json({ message: 'Logged out successfully.' })
})

router.post('/checkpoint', async (req, res) => {
  res.status(200).json({ ok: true })
  try {
    const authHeader = req.headers.authorization || ''
    const token      = authHeader.replace('Bearer ', '').trim()
    if (!token) return
    const { sub: userId } = jwt.verify(token, process.env.JWT_SECRET)
    const { page } = req.body
    if (!page || typeof page !== 'string') return
    await db.execute(`UPDATE users SET last_page=? WHERE id=?`, [page.slice(0, 200), userId])
  } catch { /* silent */ }
})

/* ── POST /api/auth/change-password ─────────────────────────────
   Authenticated password change — requires current password.
──────────────────────────────────────────────────────────────── */
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.sub || req.userId
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: 'Current and new password are required.' })
    if (newPassword.length < 8)
      return res.status(400).json({ message: 'New password must be at least 8 characters.' })

    const [[user]] = await db.execute(
      'SELECT password_hash FROM users WHERE id = ?', [userId]
    )
    if (!user) return res.status(404).json({ message: 'User not found.' })

    const bcrypt  = await import('bcryptjs')
    const valid   = await bcrypt.default.compare(currentPassword, user.password_hash)
    if (!valid) return res.status(400).json({ message: 'Current password is incorrect.' })

    const hashed  = await bcrypt.default.hash(newPassword, 12)
    await db.execute(
      'UPDATE users SET password_hash=?, updated_at=NOW() WHERE id=?',
      [hashed, userId]
    )

    return res.json({ message: 'Password updated successfully.' })
  } catch (err) {
    console.error('change-password error:', err.message)
    return res.status(500).json({ message: 'Failed to update password.' })
  }
})

/* ── GET /api/auth/sessions ──────────────────────────────────────
   Returns all active (non-revoked, non-expired) sessions for the
   authenticated user so the Security page can display real devices.
──────────────────────────────────────────────────────────────── */
router.get('/sessions', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.sub || req.userId
    const [sessions] = await db.execute(
      `SELECT id, ip_address, user_agent, created_at, expires_at
       FROM sessions
       WHERE user_id = ? AND is_revoked = 0 AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    )
    return res.json({ sessions })
  } catch (err) {
    console.error('GET sessions error:', err.message)
    return res.status(500).json({ message: 'Failed to load sessions.' })
  }
})

/* ── DELETE /api/auth/sessions/:id ───────────────────────────────
   Revoke a specific session (sign out that device).
──────────────────────────────────────────────────────────────── */
router.delete('/sessions/:id', requireAuth, async (req, res) => {
  try {
    const userId    = req.user?.sub || req.userId
    const sessionId = req.params.id
    const [result]  = await db.execute(
      `UPDATE sessions SET is_revoked = 1 WHERE id = ? AND user_id = ?`,
      [sessionId, userId]
    )
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Session not found.' })
    return res.json({ message: 'Session revoked.' })
  } catch (err) {
    console.error('DELETE session error:', err.message)
    return res.status(500).json({ message: 'Failed to revoke session.' })
  }
})

/* ── DELETE /api/auth/sessions (all others) ──────────────────────
   Revoke all sessions; optionally keep the current refresh token.
──────────────────────────────────────────────────────────────── */
router.delete('/sessions', requireAuth, async (req, res) => {
  try {
    const userId       = req.user?.sub || req.userId
    const { keepToken } = req.body
    let query  = `UPDATE sessions SET is_revoked = 1 WHERE user_id = ?`
    const params = [userId]
    if (keepToken) { query += ` AND refresh_token != ?`; params.push(keepToken) }
    await db.execute(query, params)
    return res.json({ message: 'All other sessions revoked.' })
  } catch (err) {
    console.error('DELETE all sessions error:', err.message)
    return res.status(500).json({ message: 'Failed to revoke sessions.' })
  }
})

export default router