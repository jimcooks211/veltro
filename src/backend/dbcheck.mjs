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

try {
  const [rows] = await db.execute(
    `SELECT id, type, title, message, is_read, meta, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 15 OFFSET 0`,
    ['6e6822f9-eefe-42ec-b43a-c7d47856bda8']
  )
  console.log('notif query OK rows:', rows.length)
} catch(e) {
  console.log('notif ERROR:', e.message, e.code)
}

const [p] = await db.execute(
  'SELECT country, country_code FROM profiles WHERE user_id = ?',
  ['6e6822f9-eefe-42ec-b43a-c7d47856bda8']
)
console.log('country fields:', JSON.stringify(p[0]))

await db.end()
