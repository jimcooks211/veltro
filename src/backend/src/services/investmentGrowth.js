// services/investmentGrowth.js
// Runs every 24 hours and increases each user's investment by 10%
// Intelligently applies growth only if 24hrs have passed since last growth

import { db } from '../config.js'

const GROWTH_RATE = 0.10  // 10% per 24 hours
const INTERVAL_MS = 60 * 60 * 1000  // check every hour, apply if 24h elapsed

export async function applyInvestmentGrowth() {
  console.log('\x1b[36m[growth]\x1b[0m Running investment growth check...')
  let applied = 0

  try {
    const [investments] = await db.execute(
      `SELECT i.*, u.id AS uid
       FROM investments i
       JOIN users u ON u.id = i.user_id COLLATE utf8mb4_0900_ai_ci
       WHERE i.status = 'active'
         AND i.quantity > 0
         AND i.current_value > 0
         AND (
           i.last_growth_at IS NULL
           OR TIMESTAMPDIFF(SECOND, i.last_growth_at, NOW()) >= 86400
         )`
    )

    if (investments.length === 0) {
      console.log('\x1b[36m[growth]\x1b[0m No investments due for growth')
      return
    }

    console.log(`\x1b[36m[growth]\x1b[0m Applying 10% growth to ${investments.length} investments`)

    const conn = await db.getConnection()
    try {
      await conn.beginTransaction()

      for (const inv of investments) {
        const valueBefore  = Number(inv.current_value)
        const growthAmount = +(valueBefore * GROWTH_RATE).toFixed(8)
        const valueAfter   = +(valueBefore + growthAmount).toFixed(8)

        await conn.execute(
          `UPDATE investments SET current_value=?, last_growth_at=NOW(), updated_at=NOW() WHERE id=?`,
          [valueAfter, inv.id]
        )
        await conn.execute(
          `INSERT INTO investment_growth_log (investment_id, user_id, symbol, value_before, value_after, growth_amount, growth_pct)
           VALUES (?, ?, ?, ?, ?, ?, 10.0000)`,
          [inv.id, inv.user_id, inv.symbol, valueBefore, valueAfter, growthAmount]
        )
        await conn.execute(
          `INSERT INTO transactions (user_id, type, currency, amount, fee, status, method, note, description, payment_method)
           VALUES (?, 'credit', 'USD', ?, 0, 'completed', 'internal', ?, ?, 'internal')`,
          [inv.user_id, growthAmount,
           `Investment growth: ${inv.symbol}`,
           `+10% daily growth on ${inv.symbol} - $${valueBefore.toFixed(2)} → $${valueAfter.toFixed(2)}`]
        )
        applied++
      }

      await conn.commit()
      console.log(`\x1b[32m[growth]\x1b[0m ✅ Applied growth to ${applied} investments`)
    } catch (err) {
      await conn.rollback()
      console.error('\x1b[31m[growth]\x1b[0m ❌ Growth transaction failed:', err.message)
    } finally {
      conn.release()
    }
  } catch (err) {
    console.error('\x1b[31m[growth]\x1b[0m ❌ Growth check failed:', err.message)
  }
}

export async function triggerGrowthForUser(userId) {
  const [investments] = await db.execute(
    `SELECT * FROM investments WHERE user_id = ? AND status = 'active' AND quantity > 0`,
    [userId]
  )
  if (investments.length === 0) return { applied: 0, message: 'No active investments.' }

  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()
    let count = 0
    for (const inv of investments) {
      const valueBefore  = Number(inv.current_value)
      const growthAmount = +(valueBefore * GROWTH_RATE).toFixed(8)
      const valueAfter   = +(valueBefore + growthAmount).toFixed(8)
      await conn.execute(
        `UPDATE investments SET current_value=?, last_growth_at=NOW(), updated_at=NOW() WHERE id=?`,
        [valueAfter, inv.id]
      )
      await conn.execute(
        `INSERT INTO investment_growth_log (investment_id, user_id, symbol, value_before, value_after, growth_amount, growth_pct)
         VALUES (?, ?, ?, ?, ?, ?, 10.0000)`,
        [inv.id, userId, inv.symbol, valueBefore, valueAfter, growthAmount]
      )
      await conn.execute(
        `INSERT INTO transactions (user_id, type, currency, amount, fee, status, method, note, description, payment_method)
         VALUES (?, 'credit', 'USD', ?, 0, 'completed', 'internal', ?, ?, 'internal')`,
        [userId, growthAmount, `Growth: ${inv.symbol}`,
         `+10% growth on ${inv.symbol}: $${valueBefore.toFixed(2)} → $${valueAfter.toFixed(2)}`]
      )
      count++
    }
    await conn.commit()
    return { applied: count, message: `Growth applied to ${count} investments.` }
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

export function startGrowthScheduler() {
  console.log('\x1b[32m[growth]\x1b[0m 🌱 Investment growth scheduler started (checks every hour)')
  applyInvestmentGrowth()
  setInterval(applyInvestmentGrowth, INTERVAL_MS)
}
