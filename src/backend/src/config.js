// src/config.js
import mysql      from 'mysql2/promise'
import dotenv     from 'dotenv'
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend'
import { fileURLToPath } from 'url'
import { dirname, join }  from 'path'
import nodemailer from 'nodemailer'

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

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.GMAIL_USER,
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    refreshToken: process.env.GMAIL_REFRESH_TOKEN,
  }
})

export async function sendEmail({ to, subject, html, text }) {
  await transporter.sendMail({
    from: `"Veltro" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
    text,
  })
}