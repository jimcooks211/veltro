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

await db.execute(
  "UPDATE profiles SET country = 'United States', country_code = 'US' WHERE user_id = ?",
  ['6e6822f9-eefe-42ec-b43a-c7d47856bda8']
)
const [r] = await db.execute(
  "SELECT country, country_code FROM profiles WHERE user_id = ?",
  ['6e6822f9-eefe-42ec-b43a-c7d47856bda8']
)
console.log('updated:', r[0])
await db.end()
