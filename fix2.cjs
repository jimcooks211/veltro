const fs = require('fs')

// --- Fix 1: Dashboard.jsx - add country_code to userData ---
const dp = 'C:/Users/HP OMEN/Documents/Broker/Veltro/src/pages/app/Dashboard.jsx'
let d = fs.readFileSync(dp, 'utf8')
d = d.replace(
  "country:              p.country               || '',",
  "country:              p.country               || '',\n            country_code:         p.country_code          || '',"
)
fs.writeFileSync(dp, d, 'utf8')
const dk = fs.readFileSync(dp,'utf8')
console.log('Dashboard country_code added:', dk.includes('country_code'))

// --- Fix 2: notifications.js - LIMIT/OFFSET interpolation ---
const np = 'C:/Users/HP OMEN/Documents/Broker/Veltro/src/backend/src/routes/notifications.js'
let n = fs.readFileSync(np, 'utf8')
n = n.replace(
  `      const [rows] = await db.execute(
      \`SELECT id, type, title, message, is_read, meta, created_at
       FROM notifications WHERE user_id = ?
       ORDER BY created_at DESC LIMIT ? OFFSET ?\`,
      [req.userId, limit, offset]
    )`,
  `      const [rows] = await db.execute(
      \`SELECT id, type, title, message, is_read, meta, created_at
       FROM notifications WHERE user_id = ?
       ORDER BY created_at DESC LIMIT \${limit} OFFSET \${offset}\`,
      [req.userId]
    )`
)
fs.writeFileSync(np, n, 'utf8')
const nk = fs.readFileSync(np,'utf8')
console.log('notifications LIMIT fixed:', nk.includes('LIMIT ${limit}'))
