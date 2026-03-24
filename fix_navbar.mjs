import { readFileSync, writeFileSync } from 'fs'

const file = 'C:/Users/HP OMEN/Documents/Broker/Veltro/src/pages/app/Navbar.jsx'
let c = readFileSync(file, 'utf8')

// 1. Add useNavigate + useParams import
c = c.replace(
  `import { useState, useRef, useEffect } from 'react'`,
  `import { useState, useRef, useEffect } from 'react'\nimport { useNavigate, useParams } from 'react-router-dom'`
)

// 2. Add navigate + base inside UserMenu, add onLogout prop
c = c.replace(
  `function UserMenu({ user, onThemeToggle, isDark }) {\n  const [open, setOpen] = useState(false)\n  const ref = useRef(null)`,
  `function UserMenu({ user, onThemeToggle, isDark, onLogout }) {\n  const [open, setOpen] = useState(false)\n  const ref = useRef(null)\n  const navigate = useNavigate()\n  const { userId } = useParams()\n  const base = \`/dashboard/\${userId || user?.id || ''}\``
)

// 3. Wire Profile button
c = c.replace(
  `<button type='button' className='vlt-um-item'>\n            <UserCircle size={14} weight='duotone' /> Profile\n          </button>`,
  `<button type='button' className='vlt-um-item' onClick={() => { setOpen(false); navigate(\`\${base}/profile\`) }}>\n            <UserCircle size={14} weight='duotone' /> Profile\n          </button>`
)

// 4. Wire Settings button
c = c.replace(
  `<button type='button' className='vlt-um-item'>\n            <Gear size={14} weight='duotone' /> Settings\n          </button>`,
  `<button type='button' className='vlt-um-item' onClick={() => { setOpen(false); navigate(\`\${base}/settings\`) }}>\n            <Gear size={14} weight='duotone' /> Settings\n          </button>`
)

// 5. Fix Sign out to use onLogout prop
c = c.replace(
  `className='vlt-um-item danger'\n            onClick={() => {\n              ;['accessToken', 'refreshToken'].forEach(k => {\n                sessionStorage.removeItem(k); localStorage.removeItem(k)\n              })\n              window.location.replace('/auth')\n            }}\n          >`,
  `className='vlt-um-item danger'\n            onClick={() => { setOpen(false); onLogout?.() }}\n          >`
)

// 6. Pass onLogout to UserMenu render
c = c.replace(
  `<UserMenu user={user} isDark={isDark} onThemeToggle={onThemeToggle} />`,
  `<UserMenu user={user} isDark={isDark} onThemeToggle={onThemeToggle} onLogout={onLogout} />`
)

// 7. Add onLogout to Navbar props
c = c.replace(
  `  user,\n  isDark,\n  onThemeToggle,\n}) {`,
  `  user,\n  isDark,\n  onThemeToggle,\n  onLogout,\n}) {`
)

writeFileSync(file, c, 'utf8')
console.log('Navbar.jsx updated successfully')
