import re

path = r'C:\Users\HP OMEN\Documents\Broker\Veltro\src\pages\app\Navbar.jsx'
with open(path, 'rb') as f:
    raw = f.read()
text = raw.decode('utf-8-sig').replace('\r\n', '\n')

mark = "return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })\n}"
helper = (
    "\n\n/* -- country flag helper -- */\n"
    "function countryFlag(code) {\n"
    "  if (!code || code.length !== 2) return null\n"
    "  const c = code.trim().toUpperCase()\n"
    "  return String.fromCodePoint(...[...c].map(ch => 0x1F1E6 + ch.charCodeAt(0) - 65))\n"
    "}"
)
if mark in text and 'countryFlag' not in text:
    text = text.replace(mark, mark + helper, 1)
    print('1.ok')
else:
    print('1.skip')

for bad in ['\xc3\xd7', '\xd7']:
    if bad in text:
        text = text.replace(bad, '&times;', 1)
        print('2.ok')
        break
else:
    print('2.skip')

pat = r"<button type='button' className='vlt-nb-icon-btn' title='Language'>\s*<span className='vlt-nb-flag'>.*?</span>\s*</button>"
rep = ("{countryFlag(user?.country_code) && (\n"
       "          <button type='button' className='vlt-nb-icon-btn' title={user?.country || 'Country'}>\n"
       "            <span className='vlt-nb-flag'>{countryFlag(user?.country_code)}</span>\n"
       "          </button>\n"
       "        )}")
text, n = re.subn(pat, rep, text, 1, re.DOTALL)
print('3.ok' if n else '3.fail')

with open(path, 'w', encoding='utf-8', newline='\n') as f:
    f.write(text)
print('DONE', 'countryFlag' in text, 'country_code' in text)
