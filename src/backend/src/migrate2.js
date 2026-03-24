import mysql from 'mysql2/promise'
const db = await mysql.createConnection({
  host: 'switchyard.proxy.rlwy.net', port: 12400,
  user: 'root', password: 'NoUfVdplZRUWtszuIOMEoscTOqxqcVcm',
  database: 'railway', ssl: { rejectUnauthorized: false }
})
console.log('Connected to Railway MySQL')

const sqls = [
  `CREATE TABLE IF NOT EXISTS investments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(255),
    asset_type ENUM('stock','crypto','etf') DEFAULT 'stock',
    quantity DECIMAL(20,8) NOT NULL DEFAULT 0,
    purchase_price DECIMAL(20,8) NOT NULL DEFAULT 0,
    current_value DECIMAL(20,8) NOT NULL DEFAULT 0,
    total_invested DECIMAL(20,8) NOT NULL DEFAULT 0,
    growth_rate DECIMAL(8,4) NOT NULL DEFAULT 10.0000,
    last_growth_at DATETIME DEFAULT NULL,
    status ENUM('active','sold','paused') DEFAULT 'active',
    created_at DATETIME DEFAULT NOW(),
    updated_at DATETIME DEFAULT NOW(),
    UNIQUE KEY uq_user_investment (user_id, symbol)
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS investment_growth_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    investment_id INT NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    value_before DECIMAL(20,8) NOT NULL,
    value_after DECIMAL(20,8) NOT NULL,
    growth_amount DECIMAL(20,8) NOT NULL,
    growth_pct DECIMAL(8,4) NOT NULL DEFAULT 10.0000,
    applied_at DATETIME DEFAULT NOW()
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS transfers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    from_currency VARCHAR(10) NOT NULL,
    to_currency VARCHAR(10) NOT NULL,
    from_amount DECIMAL(20,8) NOT NULL,
    to_amount DECIMAL(20,8) NOT NULL,
    exchange_rate DECIMAL(20,8) NOT NULL DEFAULT 1,
    fee DECIMAL(20,8) DEFAULT 0,
    status ENUM('pending','completed','failed','cancelled') DEFAULT 'completed',
    note TEXT,
    created_at DATETIME DEFAULT NOW()
  ) ENGINE=InnoDB`,
]

const alters = [
  `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tx_ref VARCHAR(36) NOT NULL DEFAULT (UUID())`,
  `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS net_amount DECIMAL(20,8) DEFAULT NULL`,
  `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS balance_before DECIMAL(20,8) DEFAULT 0`,
  `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS balance_after DECIMAL(20,8) DEFAULT 0`,
  `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT NULL`,
  `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100) DEFAULT NULL`,
  `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account_last4 VARCHAR(10) DEFAULT NULL`,
  `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL`,
  `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS updated_at DATETIME DEFAULT NOW()`,
  `ALTER TABLE transactions MODIFY COLUMN type ENUM('deposit','withdrawal','trade','trade_debit','trade_credit','fee','credit','refund','transfer','investment') NOT NULL`,
  `ALTER TABLE wallets ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'USD'`,
]

for (const sql of [...sqls, ...alters]) {
  try {
    await db.execute(sql)
    const snippet = sql.trim().slice(0, 60)
    console.log('OK:', snippet)
  } catch(e) {
    console.log('SKIP:', e.message.slice(0, 90))
  }
}
await db.end()
console.log('Migration complete.')
