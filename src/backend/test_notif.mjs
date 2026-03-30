import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import mysql from 'mysql2/promise'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '.env') })

const db = await mysql.createConnection({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
  user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, ssl: { rejectUnauthorized: false }
})

// Test the fixed query
try {
  const [rows] = await db.execute(
    `SELECT id, type, title, body AS message, is_read, metadata AS meta, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 15 OFFSET 0`,
    ['6e6822f9-eefe-42ec-b43a-c7d47856bda8']
  )
  console.log('query OK, rows:', rows.length, rows[0] || 'empty')
} catch(e) {
  console.log('ERROR:', e.message)
}

await db.end()
