// src/config.js
import mysql      from 'mysql2/promise'
import dotenv     from 'dotenv'
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend'
import { fileURLToPath } from 'url'
import { dirname, join }  from 'path'

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

/* ── MailerSend HTTP client ── */
export const mailer = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
})

/* ── sendEmail helper — used everywhere instead of transporter.sendMail ── */
export async function sendEmail({ to, subject, html, text }) {
  const sentFrom  = new Sender(process.env.EMAIL_USER, 'Veltro')
  const recipients = [new Recipient(to)]
  const params = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setSubject(subject)
    .setHtml(html)
    .setText(text)
  const result = await mailer.email.send(params)
  console.log('✅ Email sent →', to)
  return result
}