const fs = require('fs')
const p = 'C:/Users/HP OMEN/Documents/Broker/Veltro/src/backend/src/routes/notifications.js'
let t = fs.readFileSync(p, 'utf8')

// Fix SELECT to use actual column names: body->message alias, metadata->meta alias
t = t.replace(
  '`SELECT id, type, title, message, is_read, meta, created_at\n       FROM notifications WHERE user_id = ?\n       ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`',
  '`SELECT id, type, title, body AS message, is_read, metadata AS meta, created_at\n       FROM notifications WHERE user_id = ?\n       ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`'
)

// Fix seedWelcomeIfEmpty INSERT - it uses 'message' column name
t = t.replace(
  "`INSERT INTO notifications (user_id, type, title, message) VALUES (?, 'system', ?, ?)`",
  "`INSERT INTO notifications (user_id, type, title, body) VALUES (?, 'system', ?, ?)`"
)

// Fix PATCH /read - check if is_read column name is correct (it's is_read, ok)
// Fix unread-count - uses is_read=0, that's fine

fs.writeFileSync(p, t, 'utf8')
const check = fs.readFileSync(p, 'utf8')
console.log('body AS message:', check.includes('body AS message'))
console.log('INSERT body:', check.includes('(user_id, type, title, body)'))
