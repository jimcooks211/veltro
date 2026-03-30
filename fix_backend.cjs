const fs = require('fs')

// ── 1. notify.js — fix column names ──────────────────────────────
const np = 'C:/Users/HP OMEN/Documents/Broker/Veltro/src/backend/src/services/notify.js'
let n = fs.readFileSync(np, 'utf8')
n = n.replace(
  '`INSERT INTO notifications (user_id, type, title, message, meta)\n       VALUES (?, ?, ?, ?, ?)`',
  '`INSERT INTO notifications (user_id, type, title, body, metadata)\n       VALUES (?, ?, ?, ?, ?)`'
)
fs.writeFileSync(np, n, 'utf8')
console.log('1. notify.js fixed:', fs.readFileSync(np,'utf8').includes('body, metadata'))

// ── 2. notifications.js — fix PATCH /read to set read_at ─────────
const rp = 'C:/Users/HP OMEN/Documents/Broker/Veltro/src/backend/src/routes/notifications.js'
let r = fs.readFileSync(rp, 'utf8')
r = r.replace(
  '`UPDATE notifications SET is_read = 1 WHERE user_id = ? AND id IN (${placeholders})`',
  '`UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = ? AND id IN (${placeholders})`'
)
r = r.replace(
  '`UPDATE notifications SET is_read = 1 WHERE user_id = ?`',
  '`UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = ?`'
)
fs.writeFileSync(rp, r, 'utf8')
console.log('2. read_at fixed:', fs.readFileSync(rp,'utf8').includes('read_at = NOW()'))
