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

// Show actual notifications table columns
const [cols] = await db.execute(
  "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='notifications' ORDER BY ORDINAL_POSITION"
)
console.log('notifications columns:', cols.map(c => c.COLUMN_NAME).join(', '))

// Add missing columns
const existing = cols.map(c => c.COLUMN_NAME)
const needed = [
  ['message', 'TEXT NOT NULL DEFAULT ""'],
  ['meta',    'JSON DEFAULT NULL'],
]
for (const [col, def] of needed) {
  if (!existing.includes(col)) {
    await db.execute(`ALTER TABLE notifications ADD COLUMN ${col} ${def}`)
    console.log('Added:', col)
  } else {
    console.log('Already exists:', col)
  }
}

await db.end()
console.log('Done')
