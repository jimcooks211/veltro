/**
 * src/routes/Veltrotour.js
 */
import { Router }        from 'express'
import { db, sendEmail } from '../config.js'
import { requireAuth }   from '../middleware/auth.js'

const router = Router()

const VALID_RISKS = ['conservative', 'balanced', 'aggressive']
const VALID_PLANS = ['starter', 'growth', 'elite']

const PLAN_META = {
  starter: { label: 'Starter', color: '#8A96B4', badge: 'rgba(138,150,180,0.12)', border: 'rgba(138,150,180,0.2)'  },
  growth:  { label: 'Growth',  color: '#00D4FF', badge: 'rgba(0,212,255,0.1)',    border: 'rgba(0,212,255,0.25)'   },
  elite:   { label: 'Elite',   color: '#C9A84C', badge: 'rgba(201,168,76,0.1)',   border: 'rgba(201,168,76,0.25)'  },
}

const RISK_META = {
  conservative: { label: 'Conservative', icon: '🛡️' },
  balanced:     { label: 'Balanced',     icon: '⚖️' },
  aggressive:   { label: 'Aggressive',   icon: '🚀' },
}

function emailShell({ preheader = '', body = '', year = new Date().getFullYear() } = {}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta name="color-scheme" content="dark"/>
  <title>Veltro</title>
</head>
<body style="margin:0;padding:0;background:#060A18;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
    style="background:#060A18;padding:48px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" role="presentation"
        style="max-width:560px;width:100%;background:#0D1226;border-radius:24px;
               border:1px solid rgba(255,255,255,0.07);overflow:hidden;">
        <tr>
          <td style="height:4px;background:linear-gradient(90deg,#1A56FF 0%,#00D4FF 50%,#C9A84C 100%);
                     font-size:0;line-height:0;">&nbsp;</td>
        </tr>
        <tr>
          <td align="center" style="padding:40px 48px 32px;">
            <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
              <tr>
                <td valign="middle" style="padding-right:10px;">
                  <img src="https://raw.githubusercontent.com/jimcooks211/veltro/main/src/backend/src/VeltroLogo.png"
                       alt="Veltro"
                       width="53"
                       style="display:block;border:0;outline:none;text-decoration:none;"
                  />
                </td>
                <td valign="middle">
                  <span style="font-size:22px;font-weight:800;letter-spacing:-0.5px;color:#EEF2FF;
                                font-family:Syne,'Segoe UI',Arial,sans-serif;white-space:nowrap;">
                    VELTRO
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr><td style="padding:0 48px;"><div style="height:1px;background:rgba(255,255,255,0.06);"></div></td></tr>
        ${body}
        <tr><td style="padding:0 48px;"><div style="height:1px;background:rgba(255,255,255,0.06);"></div></td></tr>
        <tr>
          <td align="center" style="padding:28px 48px 36px;">
            <p style="margin:0 0 8px;font-size:12px;color:rgba(138,150,180,0.5);font-family:'Segoe UI',Arial,sans-serif;">
              &copy; ${year} Veltro Technologies Inc. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function buildWelcomeEmail({ firstName, plan, riskProfile }) {
  const planInfo    = PLAN_META[plan]        || PLAN_META.starter
  const riskInfo    = RISK_META[riskProfile] || RISK_META.balanced
  const displayName = firstName || 'there'

  const body = `
    <tr>
      <td style="padding:40px 48px 0;">
        <p style="margin:0 0 4px;font-size:13px;font-weight:700;letter-spacing:2px;
                  text-transform:uppercase;color:#1A56FF;font-family:'Segoe UI',Arial,sans-serif;">
          Welcome aboard
        </p>
        <h1 style="margin:0 0 16px;font-size:34px;font-weight:900;color:#EEF2FF;
                   letter-spacing:-1px;line-height:1.15;font-family:'Segoe UI',Arial,sans-serif;">
          You're in, ${displayName}. 🎉
        </h1>
        <p style="margin:0;font-size:16px;color:#8A96B4;line-height:1.75;font-family:'Segoe UI',Arial,sans-serif;">
          Your Veltro account is fully set up and ready to go.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 48px 0;">
        <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
          <tr>
            <td width="48%" valign="top"
              style="background:${planInfo.badge};border:1px solid ${planInfo.border};
                     border-radius:16px;padding:20px 22px;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:1.5px;
                        text-transform:uppercase;color:${planInfo.color};font-family:'Segoe UI',Arial,sans-serif;">
                Your plan
              </p>
              <p style="margin:0;font-size:22px;font-weight:800;color:#EEF2FF;font-family:'Segoe UI',Arial,sans-serif;">
                ${planInfo.label}
              </p>
            </td>
            <td width="4%">&nbsp;</td>
            <td width="48%" valign="top"
              style="background:rgba(26,86,255,0.08);border:1px solid rgba(26,86,255,0.2);
                     border-radius:16px;padding:20px 22px;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:1.5px;
                        text-transform:uppercase;color:#1A56FF;font-family:'Segoe UI',Arial,sans-serif;">
                Risk profile
              </p>
              <p style="margin:0;font-size:22px;font-weight:800;color:#EEF2FF;font-family:'Segoe UI',Arial,sans-serif;">
                ${riskInfo.icon} ${riskInfo.label}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:36px 48px;">
        <table cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="border-radius:14px;background:#1A56FF;">
              <a href="${process.env.CLIENT_URL || 'https://veltro.app'}/dashboard"
                style="display:inline-block;padding:16px 48px;font-size:15px;font-weight:700;
                       color:#ffffff;text-decoration:none;border-radius:14px;
                       font-family:'Segoe UI',Arial,sans-serif;">
                Go to my dashboard &#8594;
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `

  return emailShell({
    preheader: `Welcome to Veltro, ${displayName}! Your account is fully set up.`,
    body,
  })
}

async function sendWelcomeEmail({ to, firstName, plan, riskProfile }) {
  await sendEmail({
    to,
    subject: `Welcome to Veltro, ${firstName || 'Investor'} - you're all set 🎉`,
    html:    buildWelcomeEmail({ firstName, plan, riskProfile }),
    text: [
      `Welcome to Veltro${firstName ? `, ${firstName}` : ''}!`,
      ``,
      `Your account is fully set up.`,
      `Plan: ${PLAN_META[plan]?.label || plan}`,
      `Risk Profile: ${RISK_META[riskProfile]?.label || riskProfile}`,
      ``,
      `Head to your dashboard: ${process.env.CLIENT_URL || 'https://veltro.app'}/dashboard`,
      ``,
      `The Veltro Team`,
    ].join('\n'),
  })
}

router.post('/complete', requireAuth, async (req, res) => {
  const userId = req.userId
  const { riskProfile, plan } = req.body

  if (!VALID_RISKS.includes(riskProfile))
    return res.status(400).json({ message: `Invalid risk profile. Allowed: ${VALID_RISKS.join(', ')}.` })
  if (!VALID_PLANS.includes(plan))
    return res.status(400).json({ message: `Invalid plan. Allowed: ${VALID_PLANS.join(', ')}.` })

  try {
    /* ── check if this is the first completion (for email idempotency) ── */
    const [[currentState]] = await db.execute(
      `SELECT onboarding_complete FROM users WHERE id = ?`, [userId]
    )
    const isFirstCompletion = !currentState?.onboarding_complete

    const [result] = await db.execute(
      `UPDATE users SET risk_profile=?, plan=?, onboarding_complete=1, updated_at=NOW() WHERE id=?`,
      [riskProfile, plan, userId]
    )

    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'User not found.' })

    /* ── only send welcome email on the very first tour completion ── */
    if (isFirstCompletion) {
      const [[user]] = await db.execute(
        `SELECT u.email, p.first_name FROM users u LEFT JOIN profiles p ON p.user_id = u.id WHERE u.id = ?`,
        [userId]
      )
      if (user?.email) {
        sendWelcomeEmail({
          to:          user.email,
          firstName:   user.first_name || '',
          plan,
          riskProfile,
        }).catch(err => console.error('Welcome email failed:', err.message))
      }
    }

    return res.status(200).json({ message: 'Onboarding complete.', riskProfile, plan })

  } catch (err) {
    console.error('❌  Tour/complete error:', err)
    return res.status(500).json({
      message: 'Something went wrong. Please try again.',
      ...(process.env.NODE_ENV !== 'production' && { error: err.message }),
    })
  }
})

router.get('/status', requireAuth, async (req, res) => {
  try {
    const [[user]] = await db.execute(
      `SELECT u.onboarding_complete, u.risk_profile, u.plan,
              p.first_name, p.last_name, p.avatar_url, p.username,
              p.gender, p.date_of_birth, p.address_line1,
              p.city, p.state, p.zip, p.country,
              p.occupation, p.investment_experience
       FROM users u LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = ?`,
      [req.userId]
    )

    if (!user) return res.status(404).json({ message: 'User not found.' })

    const PROFILE_REQUIRED = [
      'first_name','last_name','username','gender','date_of_birth',
      'address_line1','city','state','zip','country',
      'occupation','investment_experience',
    ]
    const profileComplete = PROFILE_REQUIRED.every(f => !!user[f])

    return res.status(200).json({
      onboardingComplete: !!user.onboarding_complete,
      profileComplete,
      riskProfile:        user.risk_profile ?? null,
      plan:               user.plan         ?? null,
      profile: {
        firstName: user.first_name ?? null,
        lastName:  user.last_name  ?? null,
        username:  user.username   ?? null,
        avatarUrl: user.avatar_url ?? null,
      },
    })

  } catch (err) {
    console.error('❌  Tour/status error:', err)
    return res.status(500).json({ message: 'Could not fetch status.' })
  }
})

export default router