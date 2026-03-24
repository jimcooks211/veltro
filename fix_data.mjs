import { readFileSync, writeFileSync } from 'fs'

// ── Fix DashboardHome: reset hardcoded portfolio/investment values to 0 for new users ──
const dhFile = 'C:/Users/HP OMEN/Documents/Broker/Veltro/src/pages/app/DashboardHome.jsx'
let dh = readFileSync(dhFile, 'utf8')

// Replace hardcoded INVESTED and BASE_PORT_VAL with 0
dh = dh.replace(
  `  const INVESTED      = 21200\n  const BASE_PORT_VAL = 25180`,
  `  // New users start at 0 — live values come from /api/portfolio/summary\n  const INVESTED      = liveSummary?.total_invested  ?? 0\n  const BASE_PORT_VAL = liveSummary ? (liveSummary.cash_balance + liveSummary.total_invested) : 0`
)

// Replace hardcoded liveOpenPos and liveRealisedPnl fallbacks
dh = dh.replace(
  `  const liveOpenPos   = liveSummary?.open_positions  ?? 4\n  const liveRealisedPnl = liveSummary?.total_realised_pnl ?? dayPnl`,
  `  const liveOpenPos   = liveSummary?.open_positions  ?? 0\n  const liveRealisedPnl = liveSummary?.total_realised_pnl ?? 0`
)

writeFileSync(dhFile, dh, 'utf8')
console.log('DashboardHome.jsx: hardcoded values reset to 0 for new users')

// ── Fix Settings.jsx: load real user data from API instead of hardcoded mock ──
const stFile = 'C:/Users/HP OMEN/Documents/Broker/Veltro/src/pages/settings/Settings.jsx'
let st = readFileSync(stFile, 'utf8')

// Add useOutletContext usage + apiGet import
st = st.replace(
  `import { useState, useRef } from 'react'`,
  `import { useState, useRef, useEffect } from 'react'`
)
st = st.replace(
  `import { apiPost } from '../../utils/api.js'`,
  `import { apiPost, apiGet } from '../../utils/api.js'`
)

// Replace hardcoded form state with dynamic loading from context + API
st = st.replace(
  `export default function Settings() {\n  useOutletContext?.()\n  const avRef = useRef()\n  const [avatar, setAvatar] = useState(null)\n  const [form, setForm] = useState({ name:'Alex Mercer', username:'alexmercer', email:'alex@veltro.io', phone:'+1 555 012 3456', bio:'Digital asset trader & DeFi enthusiast.' })`,
  `export default function Settings() {\n  const { user: ctxUser } = useOutletContext?.() ?? {}\n  const avRef = useRef()\n  const [avatar, setAvatar] = useState(null)\n  const [form, setForm] = useState({\n    name: '',\n    username: '',\n    email: '',\n    phone: '',\n    bio: '',\n  })\n\n  // Load real profile from API\n  useEffect(() => {\n    apiGet('/api/profile/me')\n      .then(data => {\n        const p = data.profile || data\n        setForm({\n          name:     \`\${p.first_name || ctxUser?.firstName || ''} \${p.last_name || ctxUser?.lastName || ''}\`.trim(),\n          username: p.username  || ctxUser?.username || '',\n          email:    p.email     || ctxUser?.email    || '',\n          phone:    p.phone     || '',\n          bio:      p.bio       || '',\n        })\n      })\n      .catch(() => {\n        // Fallback to context user\n        setForm({\n          name:     \`\${ctxUser?.firstName || ''} \${ctxUser?.lastName || ''}\`.trim(),\n          username: ctxUser?.username || '',\n          email:    ctxUser?.email    || '',\n          phone:    '',\n          bio:      '',\n        })\n      })\n  }, [ctxUser?.id])`
)

writeFileSync(stFile, st, 'utf8')
console.log('Settings.jsx: hardcoded profile data replaced with real API load')

console.log('All fixes applied.')
