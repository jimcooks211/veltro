// src/config.js
import mysql                from 'mysql2/promise'
import dotenv               from 'dotenv'
import { google, gmail_v1 } from 'googleapis'
import { fileURLToPath }    from 'url'
import { dirname, join }    from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '..', '.env') })

/* ── MySQL pool ── */
export const db = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT),
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
})

/* ── Gmail OAuth2 ── */
const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
)

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN
})

/* ── Outbound HTTPS connectivity check ── */
;(async () => {
  try {
    const res = await fetch('https://www.google.com')
    if (res.ok) {
      console.log('\x1b[32m[railway]\x1b[0m ✅ outbound HTTPS:443 — reachable')
    }
  } catch (err) {
    console.error('\x1b[31m[railway]\x1b[0m ❌ outbound HTTPS:443 — blocked:', err.message)
  }
})()

/* ── Startup credential + transport check ── */
;(async () => {
  const missing = []
  if (!process.env.GMAIL_USER)          missing.push('GMAIL_USER')
  if (!process.env.GMAIL_CLIENT_ID)     missing.push('GMAIL_CLIENT_ID')
  if (!process.env.GMAIL_CLIENT_SECRET) missing.push('GMAIL_CLIENT_SECRET')
  if (!process.env.GMAIL_REFRESH_TOKEN) missing.push('GMAIL_REFRESH_TOKEN')

  if (missing.length) {
    console.error(`\x1b[31m[email]\x1b[0m ❌ missing env variables: ${missing.join(', ')}`)
    return
  }

  try {
    const token = await oauth2Client.getAccessToken()
    if (token?.token) {
      console.log('\x1b[32m[email]\x1b[0m ✅ Gmail OAuth2 connected — credentials valid')
      console.log('\x1b[32m[email]\x1b[0m 📡 transport: Gmail REST API (HTTPS:443)')
    } else {
      console.warn('\x1b[33m[email]\x1b[0m ⚠️  Gmail OAuth2 — no access token returned, check credentials')
    }
  } catch (err) {
    console.error('\x1b[31m[email]\x1b[0m ❌ Gmail OAuth2 failed —', err.message)
  }
})()

/* ── sendEmail ── */
export async function sendEmail({ to, subject, html, text }) {
  console.log(`\x1b[36m[email]\x1b[0m sending → ${to}`)
  console.log(`\x1b[36m[email]\x1b[0m subject  → ${subject}`)

  try {
    const gmail = new gmail_v1.Gmail({ auth: oauth2Client })

    const message = [
      `From: "Veltro" <${process.env.GMAIL_USER}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      html,
    ].join('\n')

    const encoded = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encoded },
    })

    console.log(`\x1b[32m[email]\x1b[0m ✅ delivered → ${to}`)
    console.log(`\x1b[32m[email]\x1b[0m 📡 sent via Gmail REST API (HTTPS:443)`)
  } catch (err) {
    console.error(`\x1b[31m[email]\x1b[0m ❌ failed → ${to}`)
    console.error(`\x1b[31m[email]\x1b[0m reason  → ${err.message}`)
    throw err
  }
}