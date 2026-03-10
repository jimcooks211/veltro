import { useState, useEffect, useRef, useCallback } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import {
  CaretRight, PaperPlaneTilt, Robot, User, SpinnerGap,
  ChatCircleDots, Lightning, BookOpen, ShieldCheck,
  CurrencyBtc, ArrowCircleDown, ArrowCircleUp, Clock,
  CheckCircle, Warning, ArrowCounterClockwise, Copy,
  DotsThree, Headset, Ticket, ChatsTeardrop,
  ArrowLeft, Check, ThumbsUp, ThumbsDown,
  MagnifyingGlass, Hourglass,
} from '@phosphor-icons/react'
import './Support.css'

/* ═══════════════════════════════════════════════════════════════
   VERA — LOCAL KNOWLEDGE ENGINE (no API required)
   Pattern matching → ranked response lookup → follow-up chips
═══════════════════════════════════════════════════════════════ */

const KB = [
  /* ── DEPOSITS ─────────────────────────────────────────────── */
  {
    id: 'deposit_pending',
    tags: ['deposit','pending','not credited','not showing','missing deposit','where is my deposit','hasn\'t arrived'],
    followUps: ['What are deposit limits?','How do I deposit with crypto?','Contact human agent'],
    reply: `Your deposit may be pending for a few reasons:

- **Bank Transfer (ACH):** Takes **1–3 business days** to settle. Initiated transfers show as "Pending" until the bank clears them.
- **Card deposit:** Usually instant, but some banks flag first-time crypto purchases — check with your card issuer.
- **Crypto deposit:** Requires network confirmations (3 for BTC, 12 for ETH). This can take 10–60 minutes.

To check status, go to **Wallet → Transaction History** and find your reference ID. If it's been over 3 business days, please contact a human agent with your reference code.`,
  },
  {
    id: 'deposit_limits',
    tags: ['deposit limit','how much can i deposit','maximum deposit','minimum deposit','daily limit deposit'],
    followUps: ['How do I deposit by bank?','How long does a deposit take?','Upgrade KYC tier'],
    reply: `Veltro deposit limits by method:

- **Bank Transfer (ACH):** Min $50 · Max $50,000/txn · $25,000/day · Free
- **Debit/Credit Card:** Min $10 · Max $5,000/txn · $5,000/day · 1.5% fee
- **Crypto & USDC:** No USD minimum — network fee applies

To increase your limits, upgrade your **KYC verification tier**. Tier 2 unlocks higher daily limits and Tier 3 (Institutional) removes most caps.`,
  },
  {
    id: 'deposit_how',
    tags: ['how to deposit','how do i deposit','add funds','fund my account','deposit money','deposit usd','bank transfer deposit'],
    followUps: ['What are deposit limits?','Why is my deposit pending?','Which deposit method is fastest?'],
    reply: `To deposit funds on Veltro:

1. Go to **Wallet → Deposit**
2. Choose your method: Bank Transfer, Card, Crypto, or USDC
3. Enter the amount (or select your asset for crypto)
4. Follow the on-screen steps — bank transfers show routing details, crypto shows your wallet address
5. Confirm and you're done

**Fastest:** Card (instant) · **Cheapest:** Bank ACH (free) · **Crypto:** 10–60 min after network confirmation.`,
  },
  {
    id: 'deposit_crypto',
    tags: ['deposit bitcoin','deposit eth','deposit btc','deposit crypto','deposit solana','send crypto to veltro'],
    followUps: ['What networks are supported?','How long for crypto confirmation?','Deposit limits'],
    reply: `To deposit crypto into Veltro:

1. Go to **Wallet → Deposit → Crypto Deposit**
2. Select your asset (BTC, ETH, or SOL)
3. Copy your unique **Veltro deposit address**
4. Send from your external wallet to that address

**Important:** Always send the correct asset to the matching address. Sending BTC to an ETH address results in **permanent loss** — Veltro cannot recover cross-chain deposits.

Deposits credit after **3 confirmations** for BTC (~30 min) and **12 confirmations** for ETH (~3 min).`,
  },

  /* ── WITHDRAWALS ───────────────────────────────────────────── */
  {
    id: 'withdrawal_time',
    tags: ['withdrawal time','how long withdrawal','when will i receive','withdrawal processing','withdrawal pending','withdrawal slow'],
    followUps: ['What are withdrawal limits?','How do I withdraw crypto?','Enable 2FA for withdrawals'],
    reply: `Withdrawal processing times by method:

- **Bank Transfer (ACH):** 1–3 business days after approval
- **Crypto (BTC/ETH/SOL):** 10–60 minutes — depends on network congestion
- **USDC on Solana:** ~2 minutes · **USDC on Ethereum:** 5–15 minutes

All withdrawals require **2FA verification**. New destination addresses are held for **24 hours** as a security measure before the first withdrawal is processed.`,
  },
  {
    id: 'withdrawal_limits',
    tags: ['withdrawal limit','how much can i withdraw','maximum withdrawal','minimum withdrawal','daily withdrawal limit'],
    followUps: ['How do I withdraw?','How long does withdrawal take?','Upgrade my KYC tier'],
    reply: `Withdrawal limits on Veltro:

- **Bank Transfer:** Min $50 · Max $10,000/txn · $10,000/day · Free
- **USDC:** Min $10 · Max $50,000/txn · $25,000/day · network fee
- **Crypto:** No fixed USD cap — network fee deducted from amount

Limits increase with your **KYC tier**. Tier 2 doubles daily limits; Tier 3 (Institutional) is negotiated individually. To upgrade, visit **Profile → Verification**.`,
  },
  {
    id: 'withdrawal_how',
    tags: ['how to withdraw','how do i withdraw','send money out','cash out','take out funds','withdraw usd','withdraw crypto'],
    followUps: ['What are withdrawal limits?','How long does a withdrawal take?','Set up 2FA'],
    reply: `To withdraw from Veltro:

1. Go to **Wallet → Withdraw**
2. Choose method: Bank Transfer, Crypto, or USDC
3. Select your asset and enter the amount
4. Choose a saved destination or enter a new address/account
5. Enter your **6-digit 2FA code** to confirm
6. Done — you'll receive an email confirmation with a reference number

New addresses have a **24-hour security hold** on first use. Saved/whitelisted addresses process immediately.`,
  },
  {
    id: 'withdrawal_failed',
    tags: ['withdrawal failed','withdrawal rejected','withdrawal error','withdrawal declined','can\'t withdraw'],
    followUps: ['Check my 2FA setup','What are withdrawal limits?','Contact human agent'],
    reply: `Common reasons a withdrawal fails:

- **Insufficient balance** — check available vs. locked amounts in your wallet
- **2FA code expired** — codes are only valid for 30 seconds; try again with a fresh code
- **Daily limit exceeded** — you've hit your tier's daily withdrawal cap
- **New address hold** — first withdrawal to a new address waits 24 hours
- **KYC not verified** — some withdrawal methods require Tier 2 verification
- **Account flag** — unusual activity may trigger a manual review

If none of these apply, contact a human agent with your reference ID.`,
  },

  /* ── SECURITY ──────────────────────────────────────────────── */
  {
    id: '2fa_setup',
    tags: ['2fa','two factor','authenticator','enable 2fa','set up 2fa','google authenticator','two-factor authentication'],
    followUps: ['What if I lose my 2FA device?','Enable withdrawal whitelist','Account security tips'],
    reply: `To enable Two-Factor Authentication (2FA):

1. Go to **Profile → Security → Two-Factor Auth**
2. Download an authenticator app: **Google Authenticator**, **Authy**, or **1Password**
3. Scan the QR code shown in your settings
4. Enter the 6-digit code to confirm and save

**Store your backup codes** in a safe place — you'll need them if you lose your device. 2FA is **required** for all withdrawals on Veltro.`,
  },
  {
    id: 'lost_2fa',
    tags: ['lost 2fa','lost authenticator','can\'t access 2fa','locked out','lost phone','2fa device lost','reset 2fa'],
    followUps: ['Contact human agent','Account recovery process','Submit a ticket'],
    reply: `If you've lost access to your 2FA device:

1. Use your **backup recovery codes** (provided when you set up 2FA) to log in
2. Once in, go to **Profile → Security** and reset your 2FA with a new device

If you don't have backup codes, this requires **identity verification with a human agent** — we cannot bypass 2FA automatically for security reasons.

Please **submit a support ticket** or request a human agent. You'll need to verify your identity with government-issued ID.`,
  },
  {
    id: 'suspicious_activity',
    tags: ['suspicious','hacked','someone logged in','unauthorized','account compromised','stolen','fraud','strange activity'],
    followUps: ['How to freeze my account','Change my password','Contact human agent immediately'],
    reply: `⚠️ **Act immediately if you suspect unauthorized access:**

1. **Change your password** right now — go to Profile → Security
2. **Revoke all sessions** — Profile → Security → Active Sessions → Sign Out All
3. **Disable and reset 2FA** if your authenticator may be compromised
4. **Contact a human agent** — select "Human Agent" in this support center for priority handling

Do **not** share your password, seed phrases, or recovery codes with anyone — including anyone claiming to be Veltro support. Veltro will never ask for these.`,
  },
  {
    id: 'whitelist',
    tags: ['whitelist','address whitelist','trusted addresses','whitelist address','approved addresses'],
    followUps: ['How do I add a whitelisted address?','Why is there a 24h hold?','Set up 2FA'],
    reply: `Address whitelisting lets you pre-approve withdrawal destinations:

- Whitelisted addresses **skip the 24-hour new-address hold**
- Adding a new address to the whitelist itself has a **48-hour confirmation period**
- You'll receive an email to confirm each new whitelisted address

To manage your whitelist: **Profile → Security → Withdrawal Addresses → Add Address**

This is one of the strongest protections against unauthorized withdrawals — we strongly recommend enabling it.`,
  },

  /* ── TRADING ───────────────────────────────────────────────── */
  {
    id: 'trading_fees',
    tags: ['trading fee','fees','how much does trading cost','maker taker','fee structure','commission','cost to trade'],
    followUps: ['What order types are available?','How does portfolio tracking work?','Upgrade KYC for fee discounts'],
    reply: `Veltro spot trading fees:

- **Maker fee:** 0.10% — orders that add liquidity (limit orders that don't fill immediately)
- **Taker fee:** 0.15% — orders that remove liquidity (market orders, or limit orders that fill immediately)

Fees are calculated on the trade value and deducted from the received asset.

**Example:** Buying $1,000 of BTC with a market order = $1.50 taker fee. The fee is taken from the BTC you receive.

Higher KYC tiers and larger trading volumes unlock fee discounts.`,
  },
  {
    id: 'order_types',
    tags: ['market order','limit order','order type','how to place order','buy bitcoin','sell crypto','trade'],
    followUps: ['What are Veltro\'s trading fees?','How does portfolio tracking work?'],
    reply: `Veltro supports two order types:

**Market Order**
- Executes immediately at the current best price
- Guaranteed fill, but price may vary in volatile markets
- Taker fee: 0.15%

**Limit Order**
- You set the exact price you want to buy or sell at
- Only fills when the market reaches your price (or better)
- Maker fee: 0.10% — cheaper than market orders

To place an order: go to **Markets**, select your pair, choose order type, and enter amount.`,
  },

  /* ── KYC ───────────────────────────────────────────────────── */
  {
    id: 'kyc_upgrade',
    tags: ['kyc','verify','verification','upgrade tier','identity verification','tier 2','tier 3','increase limits','unverified'],
    followUps: ['What documents are needed for KYC?','What limits does each tier unlock?','How long does KYC take?'],
    reply: `Veltro has three KYC tiers:

- **Tier 1 (Basic):** Email verified — limited deposits/withdrawals
- **Tier 2 (Verified):** Government ID + selfie — standard limits unlocked
- **Tier 3 (Institutional):** Business documents — negotiated limits, lowest fees

To upgrade: **Profile → Verification → Start Verification**

**Documents accepted for Tier 2:** Passport, Driver's License, or National ID. Have a clear photo/scan ready. Most verifications are approved within **1–24 hours**.`,
  },
  {
    id: 'kyc_rejected',
    tags: ['kyc rejected','verification failed','document rejected','id rejected','verification declined','kyc not approved'],
    followUps: ['Resubmit KYC documents','What documents are accepted?','Contact human agent'],
    reply: `Common reasons KYC verification is rejected:

- **Blurry or cropped photo** — the full document must be visible with all four corners
- **Expired document** — use a valid, in-date ID
- **Name mismatch** — your account name must match your ID exactly
- **Wrong document type** — screenshots or photocopies are not accepted; use the original
- **Selfie quality** — must be well-lit, face fully visible, no glasses or hat

You can **resubmit** immediately after a rejection. Go to **Profile → Verification** and upload new documents.`,
  },
  {
    id: 'kyc_time',
    tags: ['how long kyc','kyc processing time','when will kyc be approved','kyc pending','verification pending'],
    followUps: ['What documents do I need?','KYC was rejected'],
    reply: `KYC verification timelines:

- **Tier 2 (standard):** Usually **1–4 hours**, up to 24 hours during peak periods
- **Tier 3 (institutional):** **2–5 business days** — requires manual review of business documents

You'll receive an email when your verification is approved or if additional information is needed. You can also check the status any time at **Profile → Verification**.`,
  },

  /* ── ACCOUNT ───────────────────────────────────────────────── */
  {
    id: 'change_password',
    tags: ['change password','reset password','forgot password','update password','new password'],
    followUps: ['Set up 2FA','Account security tips'],
    reply: `To change your password:

1. Go to **Profile → Security → Change Password**
2. Enter your current password and your new password (twice)
3. Confirm with your **2FA code**

If you've forgotten your password, use the **"Forgot Password"** link on the login page — a reset link will be sent to your registered email within a few minutes.

For security, Veltro logs all password changes and sends a notification email.`,
  },
  {
    id: 'close_account',
    tags: ['close account','delete account','deactivate','cancel account','remove my account'],
    followUps: ['Withdraw all funds first','Contact human agent'],
    reply: `To close your Veltro account:

1. **Withdraw all funds** first — accounts with balances cannot be closed
2. Contact a **human agent** via this support center to initiate the closure
3. You'll need to verify your identity

Note: Per regulatory requirements, transaction records are retained for **7 years** even after account closure. Closed accounts cannot be reopened.`,
  },
  {
    id: 'portfolio',
    tags: ['portfolio','performance','profit loss','p&l','how am i doing','returns','gains','track my investments'],
    followUps: ['What assets does Veltro support?','How are fees calculated?','Trading order types'],
    reply: `Your portfolio analytics are available at **Dashboard → Portfolio**:

- **Total value** across all assets in USD equivalent
- **P&L** (profit and loss) — daily, weekly, and all-time
- **Allocation breakdown** — percentage per asset with a visual chart
- **Performance chart** — historical value over time
- **Transaction history** — all deposits, withdrawals, and trades

Prices are updated in real-time during market hours using live exchange data.`,
  },

  /* ── GENERAL / FALLBACK ────────────────────────────────────── */
  {
    id: 'greeting',
    tags: ['hello','hi','hey','good morning','good afternoon','good evening','sup','yo','howdy'],
    followUps: ['Why is my deposit pending?','How do I withdraw?','How do I set up 2FA?'],
    reply: `Hi there! I'm **Vera**, Veltro's support assistant.

I can help you with deposits, withdrawals, account security, trading, KYC verification, and anything else on the platform.

What can I help you with today?`,
  },
  {
    id: 'thanks',
    tags: ['thank you','thanks','ty','cheers','appreciate','helpful','great','awesome','perfect'],
    followUps: ['Ask another question','Contact human agent'],
    reply: `Happy to help! If anything else comes up — whether it's a transaction issue, security question, or anything platform-related — just ask.

You can also reach a human agent or browse the Help Center using the sidebar.`,
  },
  {
    id: 'human_agent',
    tags: ['human','agent','real person','speak to someone','live support','representative','escalate','call','phone'],
    followUps: ['Submit a support ticket','Browse Help Center'],
    reply: `To connect with a **human support agent**:

- Click **"Talk to Agent"** in the sidebar on the left
- Fill out the contact form with your issue category and details
- Average response time: **4 minutes** during business hours (Mon–Fri, 9am–6pm EST)

For **urgent security issues** (unauthorized access, suspected fraud), select category "Account Security" for priority routing.

AI support (me!) is available 24/7 for everything else.`,
  },
]

/* score a query against a KB entry */
const scoreEntry = (query, entry) => {
  const q = query.toLowerCase()
  return entry.tags.reduce((score, tag) => {
    if (q.includes(tag)) return score + tag.split(' ').length  // longer tag match = higher score
    if (tag.split(' ').some(word => word.length > 3 && q.includes(word))) return score + 0.5
    return score
  }, 0)
}

/* main local bot function — returns { reply, followUps } */
const veraReply = (userText, history = []) => {
  const scores = KB.map(entry => ({ entry, score: scoreEntry(userText, entry) }))
  scores.sort((a, b) => b.score - a.score)

  if (scores[0].score > 0) {
    const { entry } = scores[0]
    return { reply: entry.reply, followUps: entry.followUps }
  }

  // context-aware fallback: look at recent topics
  const lastBot = [...history].reverse().find(m => m.role === 'assistant' && m.entryId)
  if (lastBot) {
    const prev = KB.find(e => e.id === lastBot.entryId)
    if (prev) return {
      reply: `I'm not sure I understood that fully. Based on what we were discussing — **${prev.id.replace(/_/g,' ')}** — here are a few related options:`,
      followUps: prev.followUps,
    }
  }

  return {
    reply: `I'm not sure I have specific information about that. Here are some things I **can** help with:

- Deposit and withdrawal questions
- Account security and 2FA setup
- KYC verification and tier upgrades
- Trading fees and order types
- Portfolio tracking

Try rephrasing your question, or select one of the suggestions below. For complex issues, a **human agent** is also available.`,
    followUps: ['Why is my deposit pending?', 'How do I set up 2FA?', 'Talk to a human agent'],
  }
}

/* ═══════════════════════════════════════════════════════════════
   SUGGESTED PROMPTS
═══════════════════════════════════════════════════════════════ */
const SUGGESTIONS = [
  { icon: ArrowCircleDown, color: '#00C076', text: 'Why is my deposit pending?', cat: 'Deposits' },
  { icon: ArrowCircleUp,   color: '#FF3D57', text: 'How long does a withdrawal take?', cat: 'Withdrawals' },
  { icon: ShieldCheck,     color: '#00FFD1', text: 'How do I enable 2FA?', cat: 'Security' },
  { icon: CurrencyBtc,     color: '#F7931A', text: 'What are the trading fees?', cat: 'Trading' },
  { icon: Ticket,    color: '#9945FF', text: 'How do I upgrade my KYC tier?', cat: 'KYC' },
  { icon: Warning,         color: '#FFB800', text: 'I see suspicious activity on my account', cat: 'Security' },
]

const TOPICS = ['All', 'Deposits', 'Withdrawals', 'Security', 'Trading', 'KYC', 'Account']

/* ═══════════════════════════════════════════════════════════════
   TICKET HISTORY (mock)
═══════════════════════════════════════════════════════════════ */
const TICKETS = [
  { id:'VLT-4921', subject:'Deposit not credited', status:'resolved', date:'Mar 07', preview:'ACH transfer from Chase...' },
  { id:'VLT-4810', subject:'KYC document resubmission', status:'open',     date:'Mar 04', preview:'My passport scan was...'   },
  { id:'VLT-4703', subject:'Withdrawal limit increase',  status:'resolved', date:'Feb 27', preview:'I need to withdraw more...' },
]

/* ═══════════════════════════════════════════════════════════════
   PARSE MARKDOWN (lightweight)
═══════════════════════════════════════════════════════════════ */
function parseMarkdown(text) {
  if (!text) return []
  const lines = text.split('\n')
  const result = []
  let listItems = []

  const flushList = () => {
    if (listItems.length) {
      result.push({ type: 'list', items: [...listItems] })
      listItems = []
    }
  }
  const inlineFormat = (str) => {
    const parts = []
    const re = /(\*\*(.+?)\*\*|`(.+?)`)/g
    let last = 0, m
    while ((m = re.exec(str)) !== null) {
      if (m.index > last) parts.push({ t: 'text', v: str.slice(last, m.index) })
      if (m[2]) parts.push({ t: 'bold', v: m[2] })
      else if (m[3]) parts.push({ t: 'code', v: m[3] })
      last = m.index + m[0].length
    }
    if (last < str.length) parts.push({ t: 'text', v: str.slice(last) })
    return parts
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) { flushList(); result.push({ type: 'br' }); continue }
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      listItems.push(inlineFormat(trimmed.slice(2)))
    } else {
      flushList()
      result.push({ type: 'p', parts: inlineFormat(trimmed) })
    }
  }
  flushList()
  return result
}

function RenderMd({ text }) {
  const nodes = parseMarkdown(text)
  return (
    <div className='sp-md'>
      {nodes.map((n, i) => {
        if (n.type === 'br') return <div key={i} className='sp-md-br'/>
        if (n.type === 'p') return (
          <p key={i} className='sp-md-p'>
            {n.parts.map((p, j) =>
              p.t === 'bold' ? <strong key={j}>{p.v}</strong>
              : p.t === 'code' ? <code key={j} className='sp-md-code'>{p.v}</code>
              : <span key={j}>{p.v}</span>
            )}
          </p>
        )
        if (n.type === 'list') return (
          <ul key={i} className='sp-md-ul'>
            {n.items.map((item, j) => (
              <li key={j}>
                {item.map((p, k) =>
                  p.t === 'bold' ? <strong key={k}>{p.v}</strong>
                  : p.t === 'code' ? <code key={k} className='sp-md-code'>{p.v}</code>
                  : <span key={k}>{p.v}</span>
                )}
              </li>
            ))}
          </ul>
        )
        return null
      })}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MESSAGE BUBBLE
═══════════════════════════════════════════════════════════════ */
function Bubble({ msg, onFeedback, onFollowUp }) {
  const [copied, setCopied] = useState(false)
  const isBot = msg.role === 'assistant'

  const copy = () => {
    navigator.clipboard?.writeText(msg.content).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`sp-bubble-row ${isBot ? 'bot' : 'user'}`}>
      {isBot && (
        <div className='sp-avatar bot'>
          <Robot size={14} weight='duotone'/>
          <span className='sp-avatar-pulse'/>
        </div>
      )}

      <div className={`sp-bubble ${isBot ? 'bot' : 'user'}`}>
        {isBot
          ? <RenderMd text={msg.content}/>
          : <p className='sp-bubble-text'>{msg.content}</p>
        }

        {isBot && msg.done && (
          <div className='sp-bubble-actions'>
            <span className='sp-ts'>{msg.ts}</span>
            <button className='sp-ba-btn' onClick={copy} title='Copy'>
              {copied ? <Check size={11} weight='bold'/> : <Copy size={11} weight='bold'/>}
            </button>
            <button className={`sp-ba-btn ${msg.feedback==='up'?'on-up':''}`}
              onClick={() => onFeedback(msg.id, 'up')} title='Helpful'>
              <ThumbsUp size={11} weight={msg.feedback==='up'?'fill':'bold'}/>
            </button>
            <button className={`sp-ba-btn ${msg.feedback==='down'?'on-down':''}`}
              onClick={() => onFeedback(msg.id, 'down')} title='Not helpful'>
              <ThumbsDown size={11} weight={msg.feedback==='down'?'fill':'bold'}/>
            </button>
          </div>
        )}

        {isBot && msg.done && msg.followUps?.length > 0 && (
          <div className='sp-follow-ups'>
            {msg.followUps.map((f, i) => (
              <button key={i} className='sp-follow-chip' onClick={() => onFollowUp(f)}>
                {f} <CaretRight size={9}/>
              </button>
            ))}
          </div>
        )}

        {!isBot && <span className='sp-ts user-ts'>{msg.ts}</span>}
      </div>

      {!isBot && (
        <div className='sp-avatar user'>
          <User size={14} weight='duotone'/>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TYPING INDICATOR
═══════════════════════════════════════════════════════════════ */
function TypingIndicator() {
  return (
    <div className='sp-bubble-row bot'>
      <div className='sp-avatar bot'>
        <Robot size={14} weight='duotone'/>
        <span className='sp-avatar-pulse active'/>
      </div>
      <div className='sp-bubble bot sp-typing'>
        <span/><span/><span/>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR — tickets + quick links
═══════════════════════════════════════════════════════════════ */
function SupportSidebar({ activeView, setActiveView }) {
  return (
    <aside className='sp-sidebar'>

      {/* Vera status */}
      <div className='sp-side-panel sp-vera-card'>
        <div className='sp-vera-glow'/>
        <div className='sp-vera-avatar'>
          <Robot size={22} weight='duotone'/>
          <span className='sp-vera-status-dot'/>
        </div>
        <div className='sp-vera-info'>
          <span className='sp-vera-name'>Vera AI</span>
          <span className='sp-vera-tag'>Veltro Support · Online</span>
        </div>
        <div className='sp-vera-badge'>
          <Lightning size={10} weight='fill'/>
          Instant
        </div>
      </div>

      {/* quick nav */}
      <div className='sp-side-panel'>
        <div className='sp-side-head'>
          <ChatsTeardrop size={12} weight='duotone' className='sp-pico'/>
          Support Options
        </div>
        <div className='sp-side-body sp-nav-body'>
          {[
            { id:'chat',   Icon: Robot,       label: 'AI Chat',       sub: 'Instant answers'   },
            { id:'ticket', Icon: Ticket, label: 'My Tickets',    sub: `${TICKETS.length} total` },
            { id:'docs',   Icon: BookOpen,     label: 'Help Center',   sub: 'Browse articles'   },
            { id:'human',  Icon: Headset,      label: 'Talk to Agent', sub: 'Avg. 4 min wait'   },
          ].map(({ id, Icon, label, sub }) => (
            <button key={id}
              className={`sp-nav-item ${activeView===id?'on':''}`}
              onClick={() => setActiveView(id)}>
              <Icon size={14} weight='duotone' className='sp-nav-ico'/>
              <div className='sp-nav-info'>
                <span className='sp-nav-label'>{label}</span>
                <span className='sp-nav-sub'>{sub}</span>
              </div>
              <CaretRight size={9} className='sp-nav-caret'/>
            </button>
          ))}
        </div>
      </div>

      {/* open tickets */}
      <div className='sp-side-panel'>
        <div className='sp-side-head'>
          <Ticket size={12} weight='duotone' className='sp-pico'/>
          Recent Tickets
        </div>
        <div className='sp-side-body sp-tickets'>
          {TICKETS.map(t => (
            <div key={t.id} className='sp-ticket-row'>
              <div className='sp-ticket-dot'
                style={{background: t.status==='open' ? '#FFB800' : '#00C076'}}/>
              <div className='sp-ticket-info'>
                <span className='sp-ticket-id'>{t.id}</span>
                <span className='sp-ticket-subj'>{t.subject}</span>
              </div>
              <span className='sp-ticket-date'>{t.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* hours */}
      <div className='sp-side-panel sp-hours-card'>
        <div className='sp-side-head'>
          <Clock size={12} weight='duotone' className='sp-pico'/>
          Support Hours
        </div>
        <div className='sp-side-body'>
          {[
            { day:'AI Support', time:'24 / 7', accent:true },
            { day:'Live Agents', time:'Mon–Fri 9–6 EST' },
            { day:'Emergency',   time:'+1 (800) VLT-0001' },
          ].map(r => (
            <div key={r.day} className='sp-side-row'>
              <span className='sp-sr-key'>{r.day}</span>
              <span className={`sp-sr-val ${r.accent?'accent':''}`}>{r.time}</span>
            </div>
          ))}
        </div>
      </div>

    </aside>
  )
}

/* ═══════════════════════════════════════════════════════════════
   CHAT VIEW
═══════════════════════════════════════════════════════════════ */
function ChatView() {
  const [messages,  setMessages]  = useState([])
  const [input,     setInput]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [topic,     setTopic]     = useState('All')
  const [error,     setError]     = useState(null)
  const bottomRef   = useRef(null)
  const inputRef    = useRef(null)
  const msgId       = useRef(0)

  const ts = () => new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = useCallback((text) => {
    const userText = text || input.trim()
    if (!userText || loading) return

    setInput('')
    setError(null)

    const userMsg = { id: ++msgId.current, role: 'user', content: userText, ts: ts() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    // simulate a short "thinking" delay for realism
    setTimeout(() => {
      const history = [...messages, userMsg]
      const { reply, followUps } = veraReply(userText, history)

      // find which KB entry matched to enable context-aware follow-ups
      const scores = KB.map(e => ({ e, s: scoreEntry(userText, e) })).sort((a,b) => b.s - a.s)
      const entryId = scores[0].s > 0 ? scores[0].e.id : null

      const botMsg = {
        id: ++msgId.current,
        role: 'assistant',
        content: reply,
        followUps,
        entryId,
        ts: ts(),
        done: true,
        feedback: null,
      }
      setMessages(prev => [...prev, botMsg])
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }, 600 + Math.random() * 500)
  }, [input, messages, loading])

  const onFeedback = (id, val) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, feedback: val } : m))
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const filteredSuggestions = topic === 'All'
    ? SUGGESTIONS
    : SUGGESTIONS.filter(s => s.cat === topic)

  const isEmpty = messages.length === 0

  return (
    <div className='sp-chat-wrap'>

      {/* topic filter */}
      <div className='sp-topic-bar'>
        {TOPICS.map(t => (
          <button key={t} className={`sp-topic-chip ${topic===t?'on':''}`}
            onClick={() => setTopic(t)}>{t}</button>
        ))}
      </div>

      {/* messages area */}
      <div className='sp-messages'>

        {isEmpty && (
          <div className='sp-empty'>
            <div className='sp-empty-orb'>
              <Robot size={32} weight='duotone'/>
            </div>
            <h3 className='sp-empty-title'>Hi, I'm Vera</h3>
            <p className='sp-empty-sub'>
              Your Veltro AI assistant — I can help with deposits, withdrawals,
              security, trading, and anything else on the platform.
            </p>
            <div className='sp-suggestions'>
              {filteredSuggestions.map((s, i) => {
                const Icon = s.icon
                return (
                  <button key={i} className='sp-suggestion'
                    style={{'--sc': s.color}}
                    onClick={() => sendMessage(s.text)}>
                    <Icon size={14} weight='duotone' style={{color: s.color, flexShrink:0}}/>
                    <span>{s.text}</span>
                    <CaretRight size={10} className='sp-sug-arrow'/>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <Bubble key={msg.id} msg={msg} onFeedback={onFeedback} onFollowUp={sendMessage}/>
        ))}

        {loading && <TypingIndicator/>}

        {error && (
          <div className='sp-error-banner'>
            <Warning size={13} weight='fill'/>
            {error}
            <button className='sp-retry' onClick={() => sendMessage(messages[messages.length-1]?.content)}>
              <ArrowCounterClockwise size={11} weight='bold'/>Retry
            </button>
          </div>
        )}

        <div ref={bottomRef}/>
      </div>

      {/* input bar */}
      <div className='sp-input-bar'>
        {messages.length > 0 && !loading && (
          <div className='sp-quick-sug'>
            {SUGGESTIONS.slice(0,3).map((s,i) => (
              <button key={i} className='sp-qs-pill'
                onClick={() => sendMessage(s.text)}>
                {s.text}
              </button>
            ))}
          </div>
        )}
        <div className={`sp-input-row ${loading?'busy':''}`}>
          <div className='sp-input-wrap'>
            <textarea
              ref={inputRef}
              className='sp-textarea'
              placeholder='Ask Vera anything about your Veltro account…'
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              disabled={loading}
            />
          </div>
          <button
            className='sp-send-btn'
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            {loading
              ? <SpinnerGap size={16} className='sp-send-spin'/>
              : <PaperPlaneTilt size={16} weight='fill'/>
            }
          </button>
        </div>
        <p className='sp-disclaimer'>
          Vera provides guidance based on platform policies. For account recovery, contact a human agent.
        </p>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TICKET VIEW
═══════════════════════════════════════════════════════════════ */
function TicketView() {
  return (
    <div className='sp-tickets-view'>
      <div className='sp-tv-head'>
        <h3 className='sp-tv-title'>My Support Tickets</h3>
        <button className='sp-tv-new'>
          <Ticket size={13} weight='bold'/>
          New Ticket
        </button>
      </div>
      <div className='sp-tv-list'>
        {TICKETS.map(t => {
          const col = t.status === 'open' ? '#FFB800' : '#00C076'
          const Ico = t.status === 'open' ? Hourglass : CheckCircle
          return (
            <div key={t.id} className='sp-tv-row'>
              <div className='sp-tv-icon' style={{background:`${col}18`, color:col}}>
                <Ico size={16} weight='duotone'/>
              </div>
              <div className='sp-tv-info'>
                <div className='sp-tv-row-head'>
                  <span className='sp-tv-id'>{t.id}</span>
                  <span className='sp-tv-status' style={{color:col, background:`${col}14`}}>
                    {t.status}
                  </span>
                </div>
                <span className='sp-tv-subj'>{t.subject}</span>
                <span className='sp-tv-preview'>{t.preview}</span>
              </div>
              <div className='sp-tv-date'>
                <span>{t.date}</span>
                <CaretRight size={11} style={{color:'var(--vlt-text-muted)'}}/>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   DOCS VIEW
═══════════════════════════════════════════════════════════════ */
const DOCS = [
  { cat:'Deposits',    title:'How to deposit funds',              reads:'2.4k' },
  { cat:'Deposits',    title:'Deposit limits and timelines',      reads:'1.8k' },
  { cat:'Withdrawals', title:'Withdrawal processing times',       reads:'3.1k' },
  { cat:'Security',    title:'Setting up Two-Factor Auth (2FA)',  reads:'4.2k' },
  { cat:'Security',    title:'Address whitelisting guide',        reads:'1.2k' },
  { cat:'KYC',         title:'Verifying your identity (KYC)',     reads:'5.0k' },
  { cat:'Trading',     title:'Understanding trading fees',        reads:'2.7k' },
  { cat:'Trading',     title:'Order types: Market vs Limit',      reads:'1.9k' },
]
function DocsView() {
  const [search, setSearch] = useState('')
  const filtered = DOCS.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.cat.toLowerCase().includes(search.toLowerCase())
  )
  return (
    <div className='sp-docs-view'>
      <div className='sp-docs-search-wrap'>
        <MagnifyingGlass size={14} className='sp-docs-ico'/>
        <input className='sp-docs-search' placeholder='Search help articles…'
          value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>
      <div className='sp-docs-list'>
        {filtered.map((d,i) => (
          <button key={i} className='sp-doc-row'>
            <div className='sp-doc-cat-badge'>{d.cat}</div>
            <span className='sp-doc-title'>{d.title}</span>
            <span className='sp-doc-reads'>{d.reads} reads</span>
            <CaretRight size={11} style={{color:'var(--vlt-text-muted)', flexShrink:0}}/>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className='sp-docs-empty'>No articles found for "{search}"</div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   HUMAN AGENT VIEW
═══════════════════════════════════════════════════════════════ */
function HumanView() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ subject:'', category:'', message:'' })
  const valid = form.subject.trim() && form.category && form.message.trim()

  return (
    <div className='sp-human-view'>
      {sent ? (
        <div className='sp-human-success'>
          <div className='sp-hs-ring'><CheckCircle size={32} weight='fill'/></div>
          <h3>Request Submitted</h3>
          <p>A human agent will reach out within 4 minutes during business hours.</p>
          <span className='sp-hs-ref'>Ref: VLT-SUP-{Date.now().toString().slice(-6)}</span>
          <button className='sp-hs-btn' onClick={()=>setSent(false)}>Submit Another</button>
        </div>
      ) : (
        <>
          <div className='sp-human-head'>
            <Headset size={20} weight='duotone' style={{color:'var(--cy-neon)'}}/>
            <div>
              <div className='sp-human-title'>Talk to a Human Agent</div>
              <div className='sp-human-sub'>Average response time: 4 minutes</div>
            </div>
            <div className='sp-agent-dots'>
              {[0,1,2].map(i=><div key={i} className='sp-agent-dot' style={{'--delay':`${i*0.3}s`}}/>)}
            </div>
          </div>
          <div className='sp-human-form'>
            <div className='sp-hf-group'>
              <label className='sp-hf-label'>Category</label>
              <div className='sp-hf-select-wrap'>
                <select className='sp-hf-select' value={form.category}
                  onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                  <option value=''>Select a category…</option>
                  {['Deposit issue','Withdrawal issue','Account security','KYC / Verification','Trading problem','Other'].map(c=>(
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className='sp-hf-group'>
              <label className='sp-hf-label'>Subject</label>
              <input className='sp-hf-input' placeholder='Briefly describe your issue…'
                value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))}/>
            </div>
            <div className='sp-hf-group'>
              <label className='sp-hf-label'>Message</label>
              <textarea className='sp-hf-textarea' rows={4}
                placeholder='Provide as much detail as possible. Do not include passwords or seed phrases.'
                value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))}/>
            </div>
            <button className='sp-hf-submit' disabled={!valid} onClick={()=>setSent(true)}>
              <Headset size={14} weight='bold'/>
              Request Human Agent
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SUPPORT PAGE
═══════════════════════════════════════════════════════════════ */
export default function Support() {
  const { user }   = useOutletContext() ?? {}
  const navigate   = useNavigate()
  const [view, setView] = useState('chat')

  const VIEW_LABELS = { chat:'AI Assistant', ticket:'My Tickets', docs:'Help Center', human:'Human Agent' }

  return (
    <div className='sp-root'>

      {/* top bar */}
      <div className='sp-top'>
        <div>
          <h1 className='sp-title'>Support Center</h1>
          <p className='sp-sub'>Get instant help from Vera or connect with our team.</p>
        </div>
        <nav className='sp-bc'>
          <span>Veltro</span><CaretRight size={9}/>
          <span className='act'>Support</span>
        </nav>
      </div>

      <div className='sp-body'>

        <SupportSidebar activeView={view} setActiveView={setView}/>

        {/* main panel */}
        <div className='sp-main'>
          <div className='sp-card'>

            {/* panel header */}
            <div className='sp-panel-head'>
              <div className='sp-ph-left'>
                {view === 'chat' && (
                  <div className='sp-vera-mini'>
                    <div className='sp-vm-avatar'>
                      <Robot size={14} weight='duotone'/>
                    </div>
                    <div>
                      <span className='sp-vm-name'>Vera</span>
                      <span className='sp-vm-online'>
                        <span className='sp-vm-dot'/>Online
                      </span>
                    </div>
                  </div>
                )}
                {view !== 'chat' && (
                  <span className='sp-ph-title'>{VIEW_LABELS[view]}</span>
                )}
              </div>
              <div className='sp-ph-right'>
                {view !== 'chat' && (
                  <button className='sp-ph-back' onClick={() => setView('chat')}>
                    <ArrowLeft size={12} weight='bold'/> Back to Chat
                  </button>
                )}
              </div>
            </div>

            {view === 'chat'   && <ChatView/>}
            {view === 'ticket' && <TicketView/>}
            {view === 'docs'   && <DocsView/>}
            {view === 'human'  && <HumanView/>}

          </div>
        </div>

      </div>
    </div>
  )
}