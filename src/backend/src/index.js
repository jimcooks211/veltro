import dotenv          from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join }  from 'path'
import { readFileSync }   from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env') })

import express from 'express'
import crypto  from 'crypto'
import cors    from 'cors'

import { db, sendEmail } from './config.js'

const app  = express()
const PORT = process.env.PORT || 4000

const testConnection = async () => {
  try {
    const conn = await db.getConnection()
    console.log('✅  MySQL connected')
    conn.release()
  } catch (err) {
    console.error('❌  MySQL connection failed:', err.message)
    process.exit(1)
  }
}

app.set('trust proxy', 1)

// ── Hard CORS headers on every response (Railway-safe) ──
app.use((req, res, next) => {
  const origin = req.headers.origin || '*'
  res.setHeader('Access-Control-Allow-Origin',      origin)
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods',     'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers',     'Content-Type,Authorization,X-Requested-With')
  res.setHeader('Access-Control-Expose-Headers',    'Set-Cookie')
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '86400')
    return res.sendStatus(204)
  }
  next()
})

app.use(cors({
  origin: (origin, callback) => callback(null, origin || '*'),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200,
}))
app.options('*', cors())

app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const ms    = Date.now() - start
    const color = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m'
    console.log(`${color}[${res.statusCode}]\x1b[0m ${req.method} ${req.path} \x1b[90m${ms}ms\x1b[0m`)
  })
  next()
})


app.use(express.json({ limit: '5mb' }))
app.use(express.static(__dirname))



function buildResetEmail(resetUrl) {
  const year = new Date().getFullYear()

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta name="color-scheme" content="dark"/>
  <title>Veltro</title>
</head>
<body style="margin:0;padding:0;background:#060A18;font-family:'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    Reset your Veltro password - link expires in 15 minutes.
  </div>

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

        <tr>
          <td style="padding:40px 48px 0;">
            <h1 style="margin:0 0 12px;font-size:28px;font-weight:800;color:#EEF2FF;
                       letter-spacing:-0.8px;font-family:'Segoe UI',Arial,sans-serif;line-height:1.2;">
              Reset your password
            </h1>
            <p style="margin:0 0 32px;font-size:15px;color:#8A96B4;line-height:1.7;
                      font-family:'Segoe UI',Arial,sans-serif;">
              You requested a password reset. Click the button below to choose a new password.
              This link expires in <strong style="color:#EEF2FF;font-weight:600;">15 minutes</strong>.
            </p>
            <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:32px;">
              <tr>
                <td style="border-radius:14px;background:#1A56FF;">
                  <a href="${resetUrl}"
                    style="display:inline-block;padding:16px 48px;font-size:15px;font-weight:700;
                           color:#ffffff;text-decoration:none;border-radius:14px;letter-spacing:0.2px;
                           font-family:'Segoe UI',Arial,sans-serif;">
                    Reset password &#8594;
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 8px;font-size:13px;color:rgba(138,150,180,0.6);
                      font-family:'Segoe UI',Arial,sans-serif;">
              If the button does not work, copy and paste this link:
            </p>
            <p style="margin:0;font-size:12px;color:#1A56FF;word-break:break-all;
                      font-family:'Segoe UI',Arial,sans-serif;">${resetUrl}</p>
          </td>
        </tr>

        <tr>
          <td style="padding:28px 48px 40px;">
            <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
              <tr>
                <td style="background:rgba(201,168,76,0.05);border:1px solid rgba(201,168,76,0.12);
                           border-radius:12px;padding:16px 20px;">
                  <p style="margin:0;font-size:13px;color:rgba(201,168,76,0.75);
                            font-family:'Segoe UI',Arial,sans-serif;line-height:1.6;">
                    If you did not request this, you can safely ignore this email.
                    Your password will not change until you click the link above.
                  </p>
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

        <tr>
          <td align="center" style="padding:28px 48px 36px;">
            <p style="margin:0 0 8px;font-size:12px;color:rgba(138,150,180,0.5);
                      font-family:'Segoe UI',Arial,sans-serif;letter-spacing:0.3px;">
              &copy; ${year} Veltro Technologies Inc. All rights reserved.
            </p>
            <p style="margin:0;font-size:11px;color:rgba(138,150,180,0.35);
                      font-family:'Segoe UI',Arial,sans-serif;">
              You are receiving this because you have a Veltro account.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  return {
    subject: 'Reset your Veltro password',
    html,
    text: `Reset your Veltro password\n\nClick the link below:\n\n${resetUrl}\n\nExpires in 15 minutes.\nIf you did not request this, ignore this email.`,
  }
}

const resetTokens = new Map()

app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body
  if (!email || !/\S+@\S+\.\S+/.test(email))
    return res.status(400).json({ message: 'A valid email address is required.' })

  const token     = crypto.randomBytes(32).toString('hex')
  const expiresAt = Date.now() + 15 * 60 * 1000
  resetTokens.set(email, { token, expiresAt })

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`
  const { subject, html, text } = buildResetEmail(resetUrl)

  try {
    await sendEmail({ to: email, subject, html, text })
    return res.status(200).json({ message: 'If that email is registered, a reset link is on its way.' })
  } catch (err) {
    console.error('❌  Failed to send reset email:', err.message)
    return res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
})

app.post('/api/verify-reset-token', (req, res) => {
  const { email, token } = req.body
  const record = resetTokens.get(email)
  if (!record || record.token !== token)
    return res.status(400).json({ valid: false, message: 'This link is invalid.' })
  if (Date.now() > record.expiresAt)
    return res.status(400).json({ valid: false, message: 'This link has expired. Please request a new one.' })
  return res.status(200).json({ valid: true })
})

app.post('/api/reset-password', async (req, res) => {
  const { email, token, password } = req.body
  const record = resetTokens.get(email)
  if (!record || record.token !== token)
    return res.status(400).json({ message: 'This link is invalid.' })
  if (Date.now() > record.expiresAt)
    return res.status(400).json({ message: 'This link has expired. Please request a new one.' })
  if (!password || password.length < 8)
    return res.status(400).json({ message: 'Password should be at least 8 characters.' })

  try {
    const bcrypt = await import('bcryptjs')
    const hashed = await bcrypt.default.hash(password, 12)
    await db.execute('UPDATE users SET password_hash=?,updated_at=NOW() WHERE email=?', [hashed, email])
    resetTokens.delete(email)
    return res.status(200).json({ message: 'Password updated successfully.' })
  } catch (err) {
    console.error('Reset password DB error:', err.message)
    resetTokens.delete(email)
    return res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
})

import analyticsRoutes    from './routes/analytics.js'
import authRoutes         from './routes/auth.js'
import profileRoutes      from './routes/profile.js'
import tourRoutes         from './routes/Veltrotour.js'
import walletRoutes       from './routes/wallet.js'
import portfolioRoutes    from './routes/portfolio.js'
import ordersRoutes       from './routes/orders.js'
import investmentsRoutes  from './routes/investments.js'
import transactionsRoutes from './routes/transactions.js'
import transferRoutes       from './routes/transfer.js'
import notificationsRoutes  from './routes/notifications.js'
import depositAddressRoutes from './routes/deposit-addresses.js'
import { startGrowthScheduler } from './services/investmentGrowth.js'

app.use('/api/analytics',    analyticsRoutes)
app.use('/api/stats',        analyticsRoutes)
app.use('/api/auth',         authRoutes)
app.use('/api/profile',      profileRoutes)
app.use('/api/tour',         tourRoutes)
app.use('/api/wallet',       walletRoutes)
app.use('/api/portfolio',    portfolioRoutes)
app.use('/api/orders',       ordersRoutes)
app.use('/api/investments',  investmentsRoutes)
app.use('/api/transactions', transactionsRoutes)
app.use('/api/transfer',      transferRoutes)
app.use('/api/notifications',    notificationsRoutes)
app.use('/api/deposit-addresses', depositAddressRoutes)

// ── OTA distribution routes ───────────────────────────────────────────────
// manifest.plist - iOS reads this to find the IPA URL
app.get('/ota/manifest.plist', (req, res) => {
  res.setHeader('Content-Type', 'application/xml')
  res.sendFile(join(__dirname, 'ota', 'manifest.plist'))
})

// IPA download
app.get('/ota/app.ipa', (req, res) => {
  res.setHeader('Content-Type', 'application/octet-stream')
  res.sendFile(join(__dirname, 'ota', 'app.ipa'))
})

// Icons
app.get('/ota/icon57.png',  (req, res) => res.sendFile(join(__dirname, 'ota', 'icon57.png')))
app.get('/ota/icon512.png', (req, res) => res.sendFile(join(__dirname, 'ota', 'icon512.png')))

// Signed mobileconfig (kept for reference)
app.get('/install', (req, res) => {
  try {
    const buf = readFileSync(join(__dirname, 'veltro_signed.mobileconfig'))
    res.setHeader('Content-Type', 'application/x-apple-aspen-config')
    res.setHeader('Content-Disposition', 'attachment; filename="veltro_signed.mobileconfig"')
    res.setHeader('Cache-Control', 'no-store')
    res.status(200).send(buf)
  } catch (err) {
    res.status(500).json({ error: 'Config not found' })
  }
})

app.get('/api/health', (_, res) => res.json({
  status:  'ok',
  project: 'fantastic-inspiration',
  env:     process.env.NODE_ENV,
}))

app.listen(PORT, async () => {
  startGrowthScheduler()
  console.log(`🚀  Veltro API running on http://localhost:${PORT}`)
  await testConnection()
})


