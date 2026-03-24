import mysql from 'mysql2/promise'
const db = await mysql.createConnection({
  host: 'switchyard.proxy.rlwy.net', port: 12400,
  user: 'root', password: 'NoUfVdplZRUWtszuIOMEoscTOqxqcVcm',
  database: 'railway', ssl: { rejectUnauthorized: false }
})
console.log('Connected')

// Check existing columns in transactions table
const [cols] = await db.execute(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='railway' AND TABLE_NAME='transactions'`)
const existing = cols.map(c => c.COLUMN_NAME)
console.log('Existing columns:', existing.join(', '))

const toAdd = [
  ['tx_ref',         'VARCHAR(36) NOT NULL DEFAULT (UUID())'],
  ['net_amount',     'DECIMAL(20,8) DEFAULT NULL'],
  ['balance_before', 'DECIMAL(20,8) DEFAULT 0'],
  ['balance_after',  'DECIMAL(20,8) DEFAULT 0'],
  ['payment_method', 'VARCHAR(50) DEFAULT NULL'],
  ['bank_name',      'VARCHAR(100) DEFAULT NULL'],
  ['account_last4',  'VARCHAR(10) DEFAULT NULL'],
  ['description',    'TEXT DEFAULT NULL'],
  ['updated_at',     'DATETIME DEFAULT NOW() ON UPDATE NOW()'],
]

for (const [col, def] of toAdd) {
  if (!existing.includes(col)) {
    try {
      await db.execute(`ALTER TABLE transactions ADD COLUMN ${col} ${def}`)
      console.log('Added column:', col)
    } catch(e) {
      console.log('Skip', col, e.message.slice(0,60))
    }
  } else {
    console.log('Already exists:', col)
  }
}

// Update ENUM type
try {
  await db.execute(`ALTER TABLE transactions MODIFY COLUMN type ENUM('deposit','withdrawal','trade','trade_debit','trade_credit','fee','credit','refund','transfer','investment') NOT NULL`)
  console.log('Updated type ENUM')
} catch(e) {
  console.log('ENUM skip:', e.message.slice(0,80))
}

// Add tx_id to investments
try {
  await db.execute(`ALTER TABLE investments ADD COLUMN tx_id VARCHAR(36) UNIQUE`)
  console.log('Added tx_id to investments')
} catch(e) { console.log('investments tx_id skip') }

await db.end()
console.log('Done.')
