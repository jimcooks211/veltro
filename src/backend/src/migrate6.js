// migrate6.js - ensure all notification + session schema is complete
import mysql from 'mysql2/promise'

const db = await mysql.createConnection({
  host: 'switchyard.proxy.rlwy.net', port: 12400,
  user: 'root', password: 'NoUfVdplZRUWtszuIOMEoscTOqxqcVcm',
  database: 'railway', ssl: { rejectUnauthorized: false }
})
console.log('Connected')

await db.execute(`
  CREATE TABLE IF NOT EXISTS notification_preferences (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    security_email TINYINT(1) NOT NULL DEFAULT 1,
    security_push TINYINT(1) NOT NULL DEFAULT 1,
    security_sms TINYINT(1) NOT NULL DEFAULT 1,
    deposits_email TINYINT(1) NOT NULL DEFAULT 1,
    deposits_push TINYINT(1) NOT NULL DEFAULT 1,
    deposits_sms TINYINT(1) NOT NULL DEFAULT 0,
    withdrawals_email TINYINT(1) NOT NULL DEFAULT 1,
    withdrawals_push TINYINT(1) NOT NULL DEFAULT 1,
    withdrawals_sms TINYINT(1) NOT NULL DEFAULT 0,
    trades_email TINYINT(1) NOT NULL DEFAULT 1,
    trades_push TINYINT(1) NOT NULL DEFAULT 1,
    trades_sms TINYINT(1) NOT NULL DEFAULT 0,
    kyc_email TINYINT(1) NOT NULL DEFAULT 1,
    kyc_push TINYINT(1) NOT NULL DEFAULT 1,
    kyc_sms TINYINT(1) NOT NULL DEFAULT 0,
    prices_email TINYINT(1) NOT NULL DEFAULT 0,
    prices_push TINYINT(1) NOT NULL DEFAULT 1,
    prices_sms TINYINT(1) NOT NULL DEFAULT 0,
    marketing_email TINYINT(1) NOT NULL DEFAULT 0,
    marketing_push TINYINT(1) NOT NULL DEFAULT 0,
    marketing_sms TINYINT(1) NOT NULL DEFAULT 0,
    freq ENUM('instant','daily','weekly') NOT NULL DEFAULT 'instant',
    quiet_hours_on TINYINT(1) NOT NULL DEFAULT 1,
    quiet_from VARCHAR(5) NOT NULL DEFAULT '22:00',
    quiet_to VARCHAR(5) NOT NULL DEFAULT '08:00',
    sound_on TINYINT(1) NOT NULL DEFAULT 1,
    volume TINYINT UNSIGNED NOT NULL DEFAULT 65,
    created_at DATETIME NOT NULL DEFAULT NOW(),
    updated_at DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`)
console.log('OK  notification_preferences')

await db.execute(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    type ENUM('login','signup','deposit','withdrawal','trade','kyc','security','price','system') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    meta JSON DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT NOW(),
    INDEX idx_user_read (user_id, is_read),
    INDEX idx_user_created (user_id, created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`)
console.log('OK  notifications')

await db.execute(`
  CREATE TABLE IF NOT EXISTS deposit_addresses (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    currency ENUM('BTC','ETH','SOL','USDC_ETH','USDC_SOL') NOT NULL,
    network VARCHAR(50) NOT NULL,
    address VARCHAR(255) NOT NULL,
    label VARCHAR(100) DEFAULT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT NOW(),
    UNIQUE KEY uq_currency (currency)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`)
await db.execute(`INSERT IGNORE INTO deposit_addresses (currency, network, address, label) VALUES ('BTC','Bitcoin','bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh','Veltro BTC Wallet'),('ETH','ERC-20','0x71C7656EC7ab88b098defB751B7401B5f6d8976F','Veltro ETH Wallet'),('SOL','Solana','7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU','Veltro SOL Wallet'),('USDC_ETH','ERC-20','0x71C7656EC7ab88b098defB751B7401B5f6d8976F','Veltro USDC (Ethereum)'),('USDC_SOL','Solana','7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU','Veltro USDC (Solana)')`)
console.log('OK  deposit_addresses')

const [cols] = await db.execute(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='railway' AND TABLE_NAME='sessions'`)
const existing = cols.map(c => c.COLUMN_NAME)
for (const [col, def] of [['city','VARCHAR(100) DEFAULT NULL'],['country','VARCHAR(100) DEFAULT NULL'],['country_code','VARCHAR(10) DEFAULT NULL'],['browser','VARCHAR(100) DEFAULT NULL'],['os','VARCHAR(100) DEFAULT NULL'],['device_type',"ENUM('desktop','mobile','tablet','unknown') DEFAULT 'unknown'"]]) {
  if (!existing.includes(col)) { await db.execute(`ALTER TABLE sessions ADD COLUMN ${col} ${def}`); console.log('  Added sessions.'+col) }
  else console.log('  Exists sessions.'+col)
}

await db.end()
console.log('Done.')
