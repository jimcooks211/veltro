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

const MAP = {
  'nigeria':'NG','united states':'US','united states of america':'US','usa':'US',
  'united kingdom':'GB','uk':'GB','great britain':'GB','england':'GB',
  'ghana':'GH','kenya':'KE','south africa':'ZA','canada':'CA','australia':'AU',
  'germany':'DE','france':'FR','india':'IN','brazil':'BR','china':'CN',
  'japan':'JP','uae':'AE','united arab emirates':'AE','singapore':'SG',
  'netherlands':'NL','sweden':'SE','norway':'NO','denmark':'DK',
  'spain':'ES','italy':'IT','portugal':'PT','poland':'PL','russia':'RU',
  'mexico':'MX','argentina':'AR','colombia':'CO','indonesia':'ID',
  'malaysia':'MY','philippines':'PH','thailand':'TH','pakistan':'PK',
  'bangladesh':'BD','egypt':'EG','tanzania':'TZ','ethiopia':'ET',
  'cameroon':'CM','ivory coast':'CI','senegal':'SN','zimbabwe':'ZW',
  'uganda':'UG','rwanda':'RW','mozambique':'MZ','zambia':'ZM','angola':'AO',
  'new zealand':'NZ','ireland':'IE','switzerland':'CH','austria':'AT',
  'belgium':'BE','turkey':'TR','saudi arabia':'SA','israel':'IL','iran':'IR',
  'iraq':'IQ','jordan':'JO','lebanon':'LB','qatar':'QA','kuwait':'KW',
  'ukraine':'UA','czech republic':'CZ','hungary':'HU','romania':'RO',
  'greece':'GR','finland':'FI','south korea':'KR','korea':'KR',
  'vietnam':'VN','myanmar':'MM','sri lanka':'LK','nepal':'NP',
  'peru':'PE','chile':'CL','venezuela':'VE','ecuador':'EC','bolivia':'BO',
  'paraguay':'PY','uruguay':'UY','cuba':'CU','jamaica':'JM',
  'morocco':'MA','algeria':'DZ','tunisia':'TN','libya':'LY','sudan':'SD',
  'ethiopia':'ET','somalia':'SO','madagascar':'MG','mali':'ML',
}

const [rows] = await db.execute(
  "SELECT user_id, country, country_code FROM profiles WHERE country IS NOT NULL AND country != ''"
)
let updated = 0
for (const row of rows) {
  if (row.country_code) continue  // already set
  const code = MAP[row.country.toLowerCase().trim()]
  if (code) {
    await db.execute("UPDATE profiles SET country_code = ? WHERE user_id = ?", [code, row.user_id])
    updated++
    console.log(`  ${row.country} → ${code}`)
  }
}
console.log(`\nUpdated ${updated} / ${rows.length} profiles`)
await db.end()
