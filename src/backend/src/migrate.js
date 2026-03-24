import mysql from 'mysql2/promise'
const db = await mysql.createConnection({
  host: 'switchyard.proxy.rlwy.net', port: 12400,
  user: 'root', password: 'NoUfVdplZRUWtszuIOMEoscTOqxqcVcm',
  database: 'railway', ssl: { rejectUnauthorized: false }
})
console.log('Connected to Railway MySQL')
const sqls = [
  `CREATE TABLE IF NOT EXISTS wallets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    balance DECIMAL(20,8) NOT NULL DEFAULT 0,
    reserved DECIMAL(20,8) NOT NULL DEFAULT 0,
    updated_at DATETIME DEFAULT NOW(),
    UNIQUE KEY uq_user_currency (user_id, currency)
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    type ENUM('deposit','withdrawal','trade','fee') NOT NULL,
    currency VARCHAR(10) NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    fee DECIMAL(20,8) DEFAULT 0,
    status ENUM('pending','completed','failed','cancelled') DEFAULT 'pending',
    method VARCHAR(50),
    reference VARCHAR(255),
    note TEXT,
    created_at DATETIME DEFAULT NOW()
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS portfolio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    quantity DECIMAL(20,8) NOT NULL DEFAULT 0,
    avg_cost DECIMAL(20,8) NOT NULL DEFAULT 0,
    total_invested DECIMAL(20,8) NOT NULL DEFAULT 0,
    realised_pnl DECIMAL(20,8) NOT NULL DEFAULT 0,
    first_bought_at DATETIME,
    updated_at DATETIME DEFAULT NOW(),
    UNIQUE KEY uq_user_symbol (user_id, symbol)
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    side ENUM('BUY','SELL') NOT NULL,
    order_type ENUM('MARKET','LIMIT','STOP-LIMIT','STOP-MARKET') NOT NULL,
    quantity DECIMAL(20,8) NOT NULL,
    filled_qty DECIMAL(20,8) DEFAULT 0,
    price DECIMAL(20,8),
    avg_fill_price DECIMAL(20,8),
    status ENUM('open','filled','cancelled','rejected') DEFAULT 'open',
    fee DECIMAL(20,8) DEFAULT 0,
    created_at DATETIME DEFAULT NOW(),
    updated_at DATETIME DEFAULT NOW()
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS stocks (
    symbol VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255),
    exchange VARCHAR(50),
    sector VARCHAR(100),
    asset_type ENUM('stock','crypto','etf') DEFAULT 'stock'
  ) ENGINE=InnoDB`,
  `INSERT IGNORE INTO stocks (symbol,name,exchange,sector) VALUES
    ('AAPL','Apple Inc.','NASDAQ','Technology'),
    ('NVDA','NVIDIA Corporation','NASDAQ','Technology'),
    ('MSFT','Microsoft Corporation','NASDAQ','Technology'),
    ('TSLA','Tesla Inc.','NASDAQ','Automotive'),
    ('AMZN','Amazon.com Inc.','NASDAQ','Technology'),
    ('BTC','Bitcoin','CRYPTO','Crypto'),
    ('ETH','Ethereum','CRYPTO','Crypto'),
    ('SOL','Solana','CRYPTO','Crypto'),
    ('BNB','BNB','CRYPTO','Crypto'),
    ('ARB','Arbitrum','CRYPTO','Crypto'),
    ('OP','Optimism','CRYPTO','Crypto')`
]
for (const sql of sqls) {
  try {
    await db.execute(sql)
    console.log('OK:', sql.trim().slice(0, 50))
  } catch (e) {
    console.error('ERR:', e.message)
  }
}
await db.end()
console.log('Migration complete.')
