import mysql from 'mysql2/promise'

const db = await mysql.createConnection({
  host: 'switchyard.proxy.rlwy.net', port: 12400,
  user: 'root', password: 'NoUfVdplZRUWtszuIOMEoscTOqxqcVcm',
  database: 'railway', ssl: { rejectUnauthorized: false }
})
console.log('Connected')

/* ── 1. notifications ───────────────────────────────────────── */
await db.execute(`
  CREATE TABLE IF NOT EXISTS notifications (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id    VARCHAR(36) NOT NULL,
    type       ENUM('login','signup','deposit','withdrawal','trade','kyc','security','price','system') NOT NULL,
    title      VARCHAR(255) NOT NULL,
    message    TEXT NOT NULL,
    is_read    TINYINT(1) NOT NULL DEFAULT 0,
    meta       JSON DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT NOW(),
    INDEX idx_user_read (user_id, is_read),
    INDEX idx_user_created (user_id, created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`)
console.log('✅  notifications table ready')

/* ── 2. deposit_addresses ───────────────────────────────────── */
await db.execute(`
  CREATE TABLE IF NOT EXISTS deposit_addresses (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    currency   ENUM('BTC','ETH','SOL','USDC_ETH','USDC_SOL') NOT NULL,
    network    VARCHAR(50) NOT NULL,
    address    VARCHAR(255) NOT NULL,
    label      VARCHAR(100) DEFAULT NULL,
    is_active  TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT NOW(),
    UNIQUE KEY uq_currency (currency)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`)
console.log('✅  deposit_addresses table ready')

/* ── seed deposit addresses (INSERT IGNORE = safe to re-run) ── */
await db.execute(`
  INSERT IGNORE INTO deposit_addresses (currency, network, address, label) VALUES
    ('BTC',      'Bitcoin',  'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', 'Veltro BTC Wallet'),
    ('ETH',      'ERC-20',   '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', 'Veltro ETH Wallet'),
    ('SOL',      'Solana',   '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', 'Veltro SOL Wallet'),
    ('USDC_ETH', 'ERC-20',   '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', 'Veltro USDC (Ethereum)'),
    ('USDC_SOL', 'Solana',   '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', 'Veltro USDC (Solana)')
`)
console.log('✅  deposit_addresses seeded')

/* ── 3. add geo + parsed-UA columns to sessions ─────────────── */
const [cols] = await db.execute(`
  SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA='railway' AND TABLE_NAME='sessions'
`)
const existing = cols.map(c => c.COLUMN_NAME)

const sessionCols = [
  ['city',        'VARCHAR(100) DEFAULT NULL'],
  ['country',     'VARCHAR(100) DEFAULT NULL'],
  ['country_code','VARCHAR(10) DEFAULT NULL'],
  ['browser',     'VARCHAR(100) DEFAULT NULL'],
  ['os',          'VARCHAR(100) DEFAULT NULL'],
  ['device_type', "ENUM('desktop','mobile','tablet','unknown') DEFAULT 'unknown'"],
]
for (const [col, def] of sessionCols) {
  if (!existing.includes(col)) {
    await db.execute(`ALTER TABLE sessions ADD COLUMN ${col} ${def}`)
    console.log(`  Added sessions.${col}`)
  } else {
    console.log(`  sessions.${col} already exists`)
  }
}

await db.end()
console.log('Done.')
