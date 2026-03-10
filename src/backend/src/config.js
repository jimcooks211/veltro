// src/config.js
// Shared db pool + email transporter
// Import from here in route files — never from index.js

import mysql      from 'mysql2/promise'
import nodemailer from 'nodemailer'
import dotenv     from 'dotenv'
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

/* ── Gmail transporter ── */
export const transporter = nodemailer.createTransport({
  host:   'smtp.gmail.com',
  port:   process.env.GMAIL_PORT,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
})