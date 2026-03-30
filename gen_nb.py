import re, base64

p = r'C:/Users/HP OMEN/Documents/Broker/Veltro/src/pages/app/Navbar.jsx'
out = r'C:/Users/HP OMEN/Documents/Broker/Veltro/_nb.b64'

t = open(p,'rb').read().decode('utf-8-sig').replace('\r\n','\n')

t = re.sub(u'\u00e2\u0094\u0080+', '--', t)

mark = "return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })\n}"
helper = ("\n\n/* -- country flag helper -- */\n"
          "function countryFlag(code) {\n"
          "  if (!code || code.length !== 2) return null\n"
          "  const c = code.trim().toUpperCase()\n"
          "  return String.fromCodePoint(...[...c].map(ch => 0x1F1E6 + ch.charCodeAt(0) - 65))\n"
          "}")
if mark in t and 'countryFlag' not in t:
    t = t.replace(mark, mark + helper, 1)

t = t.replace('\u00c3\u00d7', '&times;')
t = t.replace('\u00d7', '&times;')

pat = r"<button type='button' className='vlt-nb-icon-btn' title='Language'>\s*<span className='vlt-nb-flag'>.*?</span>\s*</button>"
rep = ("{flag && (\n"
       "          <button type='button' className='vlt-nb-icon-btn' title={user?.country || 'Country'}>\n"
       "            <span className='vlt-nb-flag'>{flag}</span>\n"
       "          </button>\n"
       "        )}")
t, n = re.subn(pat, rep, t, 1, re.DOTALL)

t = t.replace(
    "  const [searchFocused",
    "  const flag = countryFlag(user?.country_code)\n  const [searchFocused"
)

encoded = base64.b64encode(t.encode('utf-8')).decode('ascii')
open(out, 'w').write(encoded)
print('ok flag_replaced=' + str(n) + ' countryFlag=' + str('countryFlag' in t) + ' size=' + str(len(encoded)))
