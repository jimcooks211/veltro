import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '..', '.env') })

const db = await mysql.createConnection({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
  user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, ssl: { rejectUnauthorized: false }
})
console.log('Connected')

const [cols] = await db.execute(
  "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='profiles'"
)
const existing = cols.map(c => c.COLUMN_NAME)

if (!existing.includes('country_code')) {
  await db.execute("ALTER TABLE profiles ADD COLUMN country_code VARCHAR(10) DEFAULT NULL AFTER country")
  console.log('Added profiles.country_code')
} else {
  console.log('profiles.country_code already exists')
}

await db.end()
console.log('Done.')
