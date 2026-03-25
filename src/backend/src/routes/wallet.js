// routes/wallet.js - full wallet management with proper transaction recording
import { Router } from 'express'
import { db }     from '../config.js'
import authMiddleware from '../middleware/auth.js'
import crypto from 'crypto'
import { createNotification } from '../services/notify.js'

const router = Router()
router.use(authMiddleware)

const genRef = (prefix) => `VLT-${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

/* ── GET /api/wallet/balances ─────────────────────────────────── */
router.get('/balances', async (req, res) => {
  try {
    const userId = req.user.sub
    let [rows] = await db.execute(
      `SELECT currency, balance, reserved, updated_at
       FROM wallets WHERE user_id = ? ORDER BY balance DESC`,
      [userId]
    )
    if (rows.length === 0) {
      await db.execute(
        `INSERT IGNORE INTO wallets (user_id, currency, balance, reserved) VALUES (?, 'USD', 0.00, 0.00)`,
        [userId]
      )
      rows = [{ currency:'USD', balance:0, reserved:0, updated_at:new Date() }]
    }
    return res.json({ balances: rows })
  } catch (err) {
    console.error('wallet/balances error:', err.message)
    return res.status(500).json({ message: 'Failed to load balances.' })
  }
})

/* ── GET /api/wallet/transactions ─────────────────────────────── */
router.get('/transactions', async (req, res) => {
  try {
    const userId = req.user.sub
    const limit  = Math.min(Number(req.query.limit) || 20, 100)
    const offset = Number(req.query.offset) || 0

    const [rows] = await db.execute(
      `SELECT id, type, currency, amount, fee, status,
              reference, note, description, payment_method,
              bank_name, account_last4,
              balance_before, balance_after,
              created_at, updated_at
       FROM transactions WHERE user_id = ?
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    )
    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM transactions WHERE user_id = ?`, [userId]
    )
    return res.json({ transactions: rows, total, limit, offset })
  } catch (err) {
    console.error('wallet/transactions error:', err.message)
    return res.status(500).json({ message: 'Failed to load transactions.' })
  }
})

/* ── POST /api/wallet/deposit ─────────────────────────────────── */
router.post('/deposit', async (req, res) => {
  try {
    const userId = req.user.sub
    const {
      currency = 'USD', amount, method = 'bank',
      reference = null, bank_name = null, account_last4 = null,
      note = null,
    } = req.body

    if (!amount || isNaN(amount) || Number(amount) <= 0)
      return res.status(400).json({ message: 'Invalid amount.' })

    const amt = Number(amount)
    const txRef = reference || genRef('DEP')
    const conn = await db.getConnection()

    try {
      await conn.beginTransaction()

      // Get current balance for before/after tracking
      const [[wallet]] = await conn.execute(
        `SELECT balance FROM wallets WHERE user_id = ? AND currency = ?`,
        [userId, currency.toUpperCase()]
      )
      const balBefore = wallet ? Number(wallet.balance) : 0

      // Insert transaction record as pending
      const [result] = await conn.execute(
        `INSERT INTO transactions
           (user_id, type, currency, amount, fee, status, method, reference, note,
            description, payment_method, bank_name, account_last4, balance_before, balance_after)
         VALUES (?, 'deposit', ?, ?, 0.00, 'pending', ?, ?, ?,
                 ?, ?, ?, ?, ?, ?)`,
        [userId, currency.toUpperCase(), amt, method, txRef,
         note || `Deposit via ${method}`,
         `Deposit of $${amt.toFixed(2)} via ${method}`,
         method, bank_name, account_last4,
         balBefore, balBefore]  // balance_after = same until approved
      )

      await conn.commit()

      createNotification({
        userId,
        type: 'deposit',
        title: 'Deposit request received',
        message: `Your deposit of $${amt.toFixed(2)} via ${method} is pending confirmation.`,
        meta: { amount: amt, currency: currency.toUpperCase(), method, reference: txRef },
      })

      return res.status(201).json({
        message:      'Deposit request received. Pending confirmation.',
        transactionId: result.insertId,
        reference:    txRef,
        status:       'pending',
      })
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  } catch (err) {
    console.error('wallet/deposit error:', err.message)
    return res.status(500).json({ message: 'Failed to process deposit.' })
  }
})

/* ── POST /api/wallet/withdraw ────────────────────────────────── */
router.post('/withdraw', async (req, res) => {
  try {
    const userId = req.user.sub
    const {
      currency = 'USD', amount, method = 'bank',
      destination = null, bank_name = null, account_last4 = null,
      note = null,
    } = req.body

    if (!amount || isNaN(amount) || Number(amount) <= 0)
      return res.status(400).json({ message: 'Invalid amount.' })

    const amt   = Number(amount)
    const txRef = genRef('WD')
    const conn  = await db.getConnection()

    try {
      await conn.beginTransaction()

      const [[wallet]] = await conn.execute(
        `SELECT balance, reserved FROM wallets WHERE user_id = ? AND currency = ? FOR UPDATE`,
        [userId, currency.toUpperCase()]
      )
      if (!wallet) return res.status(400).json({ message: `No ${currency} wallet found.` })

      const available = Number(wallet.balance) - Number(wallet.reserved)
      if (amt > available)
        return res.status(400).json({ message: 'Insufficient available balance.' })

      const balBefore = Number(wallet.balance)

      // Reserve funds
      await conn.execute(
        `UPDATE wallets SET reserved = reserved + ?, updated_at = NOW()
         WHERE user_id = ? AND currency = ?`,
        [amt, userId, currency.toUpperCase()]
      )

      // Record transaction
      const [result] = await conn.execute(
        `INSERT INTO transactions
           (user_id, type, currency, amount, fee, status, method, reference, note,
            description, payment_method, bank_name, account_last4, balance_before, balance_after)
         VALUES (?, 'withdrawal', ?, ?, 0.00, 'pending', ?, ?, ?,
                 ?, ?, ?, ?, ?, ?)`,
        [userId, currency.toUpperCase(), amt, method, txRef,
         note || `Withdrawal to ${destination || method}`,
         `Withdrawal of $${amt.toFixed(2)} via ${method}`,
         method, bank_name, account_last4,
         balBefore, balBefore - amt]
      )

      await conn.commit()

      createNotification({
        userId,
        type: 'withdrawal',
        title: 'Withdrawal submitted',
        message: `Withdrawal of $${amt.toFixed(2)} via ${method} is pending processing.`,
        meta: { amount: amt, currency: currency.toUpperCase(), method, reference: txRef },
      })

      return res.status(201).json({
        message:       'Withdrawal submitted. Pending processing.',
        transactionId: result.insertId,
        reference:     txRef,
        status:        'pending',
      })
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  } catch (err) {
    console.error('wallet/withdraw error:', err.message)
    return res.status(500).json({ message: 'Failed to process withdrawal.' })
  }
})

/* ── POST /api/wallet/approve/:txId ─── (Admin-style approval) ─ */
router.post('/approve/:txId', async (req, res) => {
  try {
    const userId = req.user.sub
    const txId   = req.params.txId

    const [[tx]] = await db.execute(
      `SELECT * FROM transactions WHERE id = ? AND user_id = ? AND status = 'pending'`,
      [txId, userId]
    )
    if (!tx) return res.status(404).json({ message: 'Pending transaction not found.' })

    const conn = await db.getConnection()
    try {
      await conn.beginTransaction()

      if (tx.type === 'deposit') {
        const [[wallet]] = await conn.execute(
          `SELECT balance FROM wallets WHERE user_id = ? AND currency = ? FOR UPDATE`,
          [userId, tx.currency]
        )
        const balAfter = (wallet ? Number(wallet.balance) : 0) + Number(tx.amount)

        await conn.execute(
          `UPDATE wallets SET balance = balance + ?, updated_at = NOW()
           WHERE user_id = ? AND currency = ?`,
          [Number(tx.amount), userId, tx.currency]
        )
        await conn.execute(
          `UPDATE transactions SET status='completed', balance_after=?, updated_at=NOW() WHERE id=?`,
          [balAfter, txId]
        )
      } else if (tx.type === 'withdrawal') {
        const [[wallet]] = await conn.execute(
          `SELECT balance, reserved FROM wallets WHERE user_id = ? AND currency = ? FOR UPDATE`,
          [userId, tx.currency]
        )
        await conn.execute(
          `UPDATE wallets SET balance=balance-?, reserved=reserved-?, updated_at=NOW()
           WHERE user_id=? AND currency=?`,
          [Number(tx.amount), Number(tx.amount), userId, tx.currency]
        )
        const balAfter = Number(wallet.balance) - Number(tx.amount)
        await conn.execute(
          `UPDATE transactions SET status='completed', balance_after=?, updated_at=NOW() WHERE id=?`,
          [balAfter, txId]
        )
      }

      await conn.commit()
      return res.json({ message: 'Transaction approved and completed.' })
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  } catch (err) {
    return res.status(500).json({ message: 'Failed to approve transaction.' })
  }
})

export default router
