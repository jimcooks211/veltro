const fs = require('fs')

// Fix Navbar.jsx - add country-name-to-code fallback map
const np = 'C:/Users/HP OMEN/Documents/Broker/Veltro/src/pages/app/Navbar.jsx'
let n = fs.readFileSync(np, 'utf8')

const oldHelper = `/* -- country flag helper -- */
function countryFlag(code) {
  if (!code || code.length !== 2) return null
  const c = code.trim().toUpperCase()
  return String.fromCodePoint(...[...c].map(ch => 0x1F1E6 + ch.charCodeAt(0) - 65))
}`

const newHelper = `/* -- country flag helper -- */
const COUNTRY_NAME_TO_CODE = {
  'nigeria':'NG','united states':'US','united kingdom':'GB','ghana':'GH',
  'kenya':'KE','south africa':'ZA','canada':'CA','australia':'AU',
  'germany':'DE','france':'FR','india':'IN','brazil':'BR','china':'CN',
  'japan':'JP','uae':'AE','united arab emirates':'AE','singapore':'SG',
  'netherlands':'NL','sweden':'SE','norway':'NO','denmark':'DK',
  'spain':'ES','italy':'IT','portugal':'PT','poland':'PL','russia':'RU',
  'mexico':'MX','argentina':'AR','colombia':'CO','indonesia':'ID',
  'malaysia':'MY','philippines':'PH','thailand':'TH','pakistan':'PK',
  'bangladesh':'BD','egypt':'EG','tanzania':'TZ','ethiopia':'ET',
  'cameroon':'CM','ivory coast':'CI','senegal':'SN','zimbabwe':'ZW',
}
function countryFlag(codeOrName) {
  if (!codeOrName) return null
  let code = codeOrName.trim()
  if (code.length !== 2) {
    code = COUNTRY_NAME_TO_CODE[code.toLowerCase()] || null
    if (!code) return null
  }
  const c = code.toUpperCase()
  return String.fromCodePoint(...[...c].map(ch => 0x1F1E6 + ch.charCodeAt(0) - 65))
}`

n = n.replace(oldHelper, newHelper)

// Fix: pass country_code OR country to countryFlag
n = n.replace(
  'const flag = countryFlag(user?.country_code)',
  'const flag = countryFlag(user?.country_code || user?.country)'
)

fs.writeFileSync(np, n, 'utf8')
const check = fs.readFileSync(np,'utf8')
console.log('COUNTRY_NAME_TO_CODE:', check.includes('COUNTRY_NAME_TO_CODE'))
console.log('fallback country:', check.includes('user?.country_code || user?.country'))
