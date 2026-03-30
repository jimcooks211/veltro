const fs = require('fs')
const np = 'C:/Users/HP OMEN/Documents/Broker/Veltro/src/backend/src/routes/notifications.js'
let n = fs.readFileSync(np, 'utf8')

const old = "ORDER BY created_at DESC LIMIT ? OFFSET ?`,\n      [req.userId, limit, offset]"
const fix = "ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,\n      [req.userId]"
n = n.replace(old, fix)
fs.writeFileSync(np, n, 'utf8')
console.log('fixed:', fs.readFileSync(np,'utf8').includes('LIMIT ${limit}'))
