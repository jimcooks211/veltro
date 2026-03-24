import mysql from 'mysql2/promise'

const db = await mysql.createConnection({
  host: 'switchyard.proxy.rlwy.net', port: 12400,
  user: 'root', password: 'NoUfVdplZRUWtszuIOMEoscTOqxqcVcm',
  database: 'railway', ssl: { rejectUnauthorized: false }
})
console.log('Connected')

await db.execute(`
  CREATE TABLE IF NOT EXISTS notification_preferences (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id      VARCHAR(36) NOT NULL UNIQUE,

    -- security
    security_email    TINYINT(1) NOT NULL DEFAULT 1,
    security_push     TINYINT(1) NOT NULL DEFAULT 1,
    security_sms      TINYINT(1) NOT NULL DEFAULT 1,

    -- deposits
    deposits_email    TINYINT(1) NOT NULL DEFAULT 1,
    deposits_push     TINYINT(1) NOT NULL DEFAULT 1,
    deposits_sms      TINYINT(1) NOT NULL DEFAULT 0,

    -- withdrawals
    withdrawals_email TINYINT(1) NOT NULL DEFAULT 1,
    withdrawals_push  TINYINT(1) NOT NULL DEFAULT 1,
    withdrawals_sms   TINYINT(1) NOT NULL DEFAULT 0,

    -- trades
    trades_email      TINYINT(1) NOT NULL DEFAULT 1,
    trades_push       TINYINT(1) NOT NULL DEFAULT 1,
    trades_sms        TINYINT(1) NOT NULL DEFAULT 0,

    -- kyc
    kyc_email         TINYINT(1) NOT NULL DEFAULT 1,
    kyc_push          TINYINT(1) NOT NULL DEFAULT 1,
    kyc_sms           TINYINT(1) NOT NULL DEFAULT 0,

    -- prices
    prices_email      TINYINT(1) NOT NULL DEFAULT 0,
    prices_push       TINYINT(1) NOT NULL DEFAULT 1,
    prices_sms        TINYINT(1) NOT NULL DEFAULT 0,

    -- marketing
    marketing_email   TINYINT(1) NOT NULL DEFAULT 0,
    marketing_push    TINYINT(1) NOT NULL DEFAULT 0,
    marketing_sms     TINYINT(1) NOT NULL DEFAULT 0,

    -- delivery preferences
    freq              ENUM('instant','daily','weekly') NOT NULL DEFAULT 'instant',
    quiet_hours_on    TINYINT(1) NOT NULL DEFAULT 1,
    quiet_from        VARCHAR(5) NOT NULL DEFAULT '22:00',
    quiet_to          VARCHAR(5) NOT NULL DEFAULT '08:00',
    sound_on          TINYINT(1) NOT NULL DEFAULT 1,
    volume            TINYINT UNSIGNED NOT NULL DEFAULT 65,

    created_at        DATETIME NOT NULL DEFAULT NOW(),
    updated_at        DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`)
console.log('✅  notification_preferences table ready')

await db.end()
console.log('Done.')
