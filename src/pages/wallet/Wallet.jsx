import { useState, useEffect, useRef } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import {
  Wallet, ArrowUpRight, ArrowDownRight, CaretRight,
  ArrowSquareOut, Eye, EyeSlash, Clock, CheckCircle,
  XCircle, Hourglass, CurrencyBtc, CurrencyEth,
  ArrowCircleDown, ArrowCircleUp, Swap, ShieldCheck,
  Percent, Lightning, Plus, DotsThree,
  CurrencyDollar, Coins,
} from '@phosphor-icons/react'
import './Wallet.css'

/* ═══════════════════════════════════════════════════════════════
   MOCK DATA
═══════════════════════════════════════════════════════════════ */
const ASSETS = [
  { id:'USD',  label:'US Dollar',     sym:'USD',  bal:8_420.00, alloc:33.4, icon: CurrencyDollar, color:'#00C076', locked:0        },
  { id:'BTC',  label:'Bitcoin',       sym:'BTC',  bal:0.4812,   alloc:28.7, icon: CurrencyBtc,    color:'#F7931A', locked:0.02     },
  { id:'ETH',  label:'Ethereum',      sym:'ETH',  bal:3.812,    alloc:18.2, icon: CurrencyEth,    color:'#627EEA', locked:0.5      },
  { id:'SOL',  label:'Solana',        sym:'SOL',  bal:42.6,     alloc:10.4, icon: Coins,          color:'#9945FF', locked:0        },
  { id:'USDC', label:'USD Coin',      sym:'USDC', bal:2_280.00, alloc:9.3,  icon: CurrencyDollar, color:'#2775CA', locked:0        },
]

const USD_VALUES = { USD:1, BTC:67_420, ETH:3_210, SOL:142.4, USDC:1 }
const totalUSD   = ASSETS.reduce((s, a) => s + a.bal * USD_VALUES[a.id], 0)

const TX = [
  { id:1,  type:'deposit',  asset:'USD',  amount:5_000,  date:'Mar 08, 2026', status:'completed', note:'Bank transfer'         },
  { id:2,  type:'trade',    asset:'BTC',  amount:0.12,   date:'Mar 07, 2026', status:'completed', note:'Bought @ $67,100'      },
  { id:3,  type:'withdraw', asset:'USDC', amount:1_000,  date:'Mar 06, 2026', status:'completed', note:'To external wallet'    },
  { id:4,  type:'trade',    asset:'ETH',  amount:1.5,    date:'Mar 05, 2026', status:'completed', note:'Bought @ $3,185'       },
  { id:5,  type:'deposit',  asset:'USDC', amount:2_000,  date:'Mar 04, 2026', status:'pending',   note:'Circle USDC'           },
  { id:6,  type:'withdraw', asset:'BTC',  amount:0.05,   date:'Mar 03, 2026', status:'completed', note:'Cold storage'          },
  { id:7,  type:'trade',    asset:'SOL',  amount:20,     date:'Mar 02, 2026', status:'completed', note:'Bought @ $138.20'      },
  { id:8,  type:'deposit',  asset:'USD',  amount:2_500,  date:'Mar 01, 2026', status:'failed',    note:'Card declined'         },
]

const TX_ICONS = {
  deposit:  { icon: ArrowCircleDown, color: '#00C076' },
  withdraw: { icon: ArrowCircleUp,   color: '#FF3D57' },
  trade:    { icon: Swap,            color: '#1A56FF' },
}
const STATUS_CFG = {
  completed: { icon: CheckCircle, color:'#00C076', bg:'rgba(0,192,118,0.1)'  },
  pending:   { icon: Hourglass,   color:'#FFB800', bg:'rgba(255,184,0,0.1)'  },
  failed:    { icon: XCircle,     color:'#FF3D57', bg:'rgba(255,61,87,0.1)'  },
}

const $ = (n, d=2) =>
  `$${Number(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d})}`
const $K = (n) => n >= 1e6 ? `$${(n/1e6).toFixed(3)}M` : n >= 1000 ? `$${(n/1000).toFixed(2)}K` : $(n)
const fmtBal = (n, sym) => {
  if (sym === 'USD' || sym === 'USDC') return $(n, 2)
  if (sym === 'BTC') return `${n.toFixed(4)} BTC`
  if (sym === 'ETH') return `${n.toFixed(3)} ETH`
  return `${n.toFixed(2)} ${sym}`
}
const fmtAmt = (n, sym) => {
  if (sym === 'USD' || sym === 'USDC') return $(n, 0)
  return `${n} ${sym}`
}

/* ═══════════════════════════════════════════════════════════════
   DONUT CHART — pure SVG
═══════════════════════════════════════════════════════════════ */
function DonutChart({ assets, hov, setHov }) {
  const SIZE = 148, CX = 74, CY = 74, R = 54, INNER = 34, GAP = 2.5
  const total = assets.reduce((s, a) => s + a.alloc, 0)

  let angle = -90
  const slices = assets.map((a) => {
    const sweep = (a.alloc / total) * 360
    const start = angle
    angle += sweep + GAP
    const deg2r = (d) => (d * Math.PI) / 180
    const x1 = CX + R * Math.cos(deg2r(start))
    const y1 = CY + R * Math.sin(deg2r(start))
    const x2 = CX + R * Math.cos(deg2r(start + sweep))
    const y2 = CY + R * Math.sin(deg2r(start + sweep))
    const ix1 = CX + INNER * Math.cos(deg2r(start))
    const iy1 = CY + INNER * Math.sin(deg2r(start))
    const ix2 = CX + INNER * Math.cos(deg2r(start + sweep))
    const iy2 = CY + INNER * Math.sin(deg2r(start + sweep))
    const large = sweep > 180 ? 1 : 0
    const path = `M${x1.toFixed(2)} ${y1.toFixed(2)} A${R} ${R} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L${ix2.toFixed(2)} ${iy2.toFixed(2)} A${INNER} ${INNER} 0 ${large} 0 ${ix1.toFixed(2)} ${iy1.toFixed(2)} Z`
    return { ...a, path }
  })

  const active = hov != null ? assets[hov] : null

  return (
    <svg width={SIZE} height={SIZE} style={{ overflow: 'visible', flexShrink: 0 }}>
      {slices.map((s, i) => (
        <path
          key={s.id}
          d={s.path}
          fill={s.color}
          opacity={hov == null ? 0.9 : i === hov ? 1 : 0.28}
          style={{
            cursor: 'pointer',
            transform: i === hov ? `scale(1.04)` : 'scale(1)',
            transformOrigin: `${CX}px ${CY}px`,
            transition: 'opacity 0.18s, transform 0.18s',
            filter: i === hov ? `drop-shadow(0 0 6px ${s.color}88)` : 'none',
          }}
          onMouseEnter={() => setHov(i)}
          onMouseLeave={() => setHov(null)}
        />
      ))}
      {/* centre label */}
      <text x={CX} y={CY - 7} textAnchor='middle' fontSize={10} fill='var(--vlt-text-muted)'
        fontFamily='Inter,system-ui,sans-serif' fontWeight={600}>
        {active ? active.sym : 'TOTAL'}
      </text>
      <text x={CX} y={CY + 8} textAnchor='middle' fontSize={13} fill='var(--vlt-text-primary)'
        fontFamily='Inter,system-ui,sans-serif' fontWeight={800}
        style={{ fontVariantNumeric: 'tabular-nums' }}>
        {active ? `${active.alloc}%` : $K(totalUSD)}
      </text>
      <text x={CX} y={CY + 22} textAnchor='middle' fontSize={9.5} fill='var(--vlt-text-muted)'
        fontFamily='Inter,system-ui,sans-serif' fontWeight={600}>
        {active ? active.label : 'Portfolio Value'}
      </text>
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════════════
   BALANCE CARD
═══════════════════════════════════════════════════════════════ */
function BalanceCard({ onDeposit, onWithdraw }) {
  const [hidden, setHidden] = useState(false)
  const available = totalUSD * 0.934
  const locked    = totalUSD * 0.066

  return (
    <div className='wl-balance-card'>
      <div className='wl-bc-top'>
        <div className='wl-bc-glow'/>
        <div className='wl-bc-grid'/>
        <div className='wl-bc-content'>
          <div className='wl-bc-header'>
            <div className='wl-bc-badge'>
              <ShieldCheck size={11} weight='fill'/>
              Secured Vault
            </div>
            <button className='wl-bc-eye' onClick={() => setHidden(h => !h)}>
              {hidden ? <EyeSlash size={14} weight='bold'/> : <Eye size={14} weight='bold'/>}
            </button>
          </div>
          <div className='wl-bc-label'>Total Portfolio Value</div>
          <div className='wl-bc-amount'>
            {hidden ? <span className='wl-bc-redact'>••••••</span> : $K(totalUSD)}
          </div>
          <div className='wl-bc-sub-row'>
            <div className='wl-bc-sub'>
              <span className='wl-bc-sub-label'>Available</span>
              <span className='wl-bc-sub-val up'>
                {hidden ? '•••' : $K(available)}
              </span>
            </div>
            <div className='wl-bc-sub-divider'/>
            <div className='wl-bc-sub'>
              <span className='wl-bc-sub-label'>Locked</span>
              <span className='wl-bc-sub-val'>
                {hidden ? '•••' : $K(locked)}
              </span>
            </div>
          </div>
        </div>
        <div className='wl-bc-actions'>
          <button className='wl-action-btn primary' onClick={onDeposit}>
            <ArrowCircleDown size={15} weight='bold'/>
            Deposit
          </button>
          <button className='wl-action-btn ghost' onClick={onWithdraw}>
            <ArrowCircleUp size={15} weight='bold'/>
            Withdraw
          </button>
          <button className='wl-action-btn ghost'>
            <Swap size={15} weight='bold'/>
            Convert
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   STAT STRIP
═══════════════════════════════════════════════════════════════ */
function StatStrip() {
  const invested   = 19_400
  const pnl        = totalUSD - invested
  const pnlPct     = (pnl / invested) * 100
  const dayChange  = +642.80
  const dayPct     = 2.64
  const yield7d    = 0.18

  const stats = [
    {
      label: 'Total P&L',
      value: $K(Math.abs(pnl)),
      badge: `${pnl>=0?'+':''}${pnlPct.toFixed(2)}%`,
      up: pnl >= 0,
    },
    {
      label: "24h Change",
      value: $(Math.abs(dayChange), 2),
      badge: `${dayChange>=0?'+':''}${dayPct}%`,
      up: dayChange >= 0,
    },
    {
      label: '7d Yield',
      value: `${yield7d}%`,
      badge: 'APY',
      up: true,
      plain: true,
    },
    {
      label: 'Transactions',
      value: TX.length,
      badge: 'This month',
      up: true,
      plain: true,
    },
  ]

  return (
    <div className='wl-strip'>
      {stats.map((s, i) => (
        <div key={i} className='wl-strip-item'>
          <span className='wl-strip-label'>{s.label}</span>
          <span className='wl-strip-value'>{s.value}</span>
          <span className={`wl-strip-badge ${s.plain ? '' : s.up ? 'up' : 'dn'}`}>
            {!s.plain && (s.up
              ? <ArrowUpRight size={9} weight='bold'/>
              : <ArrowDownRight size={9} weight='bold'/>
            )}
            {s.badge}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ASSET BREAKDOWN
═══════════════════════════════════════════════════════════════ */
function AssetBreakdown() {
  const [hov, setHov] = useState(null)

  return (
    <div className='wl-panel wl-assets-panel'>
      <div className='wl-panel-head'>
        <div className='wl-panel-title'>
          <Coins size={13} weight='duotone' className='wl-pico'/>
          Asset Breakdown
        </div>
        <button className='wl-btn-ghost'>
          <Plus size={11} weight='bold'/>Add Asset
        </button>
      </div>

      <div className='wl-assets-body'>
        {/* donut */}
        <div className='wl-donut-wrap'>
          <DonutChart assets={ASSETS} hov={hov} setHov={setHov}/>
        </div>

        {/* rows */}
        <div className='wl-asset-rows'>
          {ASSETS.map((a, i) => {
            const Icon = a.icon
            const usdVal = a.bal * USD_VALUES[a.id]
            return (
              <div
                key={a.id}
                className={`wl-ar ${hov === i ? 'hov' : ''}`}
                onMouseEnter={() => setHov(i)}
                onMouseLeave={() => setHov(null)}
              >
                <div className='wl-ar-dot' style={{ background: a.color, boxShadow:`0 0 8px ${a.color}60`}}/>
                <div className='wl-ar-icon' style={{ background:`${a.color}18`, color: a.color }}>
                  <Icon size={13} weight='duotone'/>
                </div>
                <div className='wl-ar-info'>
                  <span className='wl-ar-sym'>{a.sym}</span>
                  <span className='wl-ar-name'>{a.label}</span>
                </div>
                <div className='wl-ar-right'>
                  <span className='wl-ar-usd'>{$K(usdVal)}</span>
                  <span className='wl-ar-bal'>{fmtBal(a.bal, a.sym)}</span>
                </div>
                <span className='wl-ar-alloc' style={{ color: a.color }}>{a.alloc}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TRANSACTION HISTORY
═══════════════════════════════════════════════════════════════ */
function TxHistory() {
  const [filter, setFilter] = useState('all')
  const filters = ['all', 'deposit', 'withdraw', 'trade']

  const visible = TX.filter(t => filter === 'all' || t.type === filter)

  return (
    <div className='wl-panel wl-tx-panel'>
      <div className='wl-panel-head'>
        <div className='wl-panel-title'>
          <Clock size={13} weight='duotone' className='wl-pico'/>
          Transaction History
        </div>
        <div className='wl-tx-tabs'>
          {filters.map(f => (
            <button
              key={f}
              className={`wl-tx-tab ${filter === f ? 'on' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className='wl-tx-list'>
        {visible.map((tx, i) => {
          const TxCfg   = TX_ICONS[tx.type]
          const TxIcon  = TxCfg.icon
          const StCfg   = STATUS_CFG[tx.status]
          const StIcon  = StCfg.icon
          const assetCol = ASSETS.find(a => a.id === tx.asset)?.color || '#8A96B4'
          return (
            <div key={tx.id} className='wl-tx-row' style={{ animationDelay:`${i*28}ms` }}>
              <div className='wl-tx-icon-wrap' style={{ background:`${TxCfg.color}14`, color:TxCfg.color }}>
                <TxIcon size={15} weight='duotone'/>
              </div>
              <div className='wl-tx-info'>
                <div className='wl-tx-top-row'>
                  <span className='wl-tx-type'>{tx.type.charAt(0).toUpperCase()+tx.type.slice(1)}</span>
                  <span className='wl-tx-note'>{tx.note}</span>
                </div>
                <span className='wl-tx-date'>
                  <Clock size={9} weight='duotone'/>
                  {tx.date}
                </span>
              </div>
              <div className='wl-tx-right'>
                <span className='wl-tx-amount' style={{ color: assetCol }}>
                  {tx.type==='withdraw' ? '−' : '+'}{fmtAmt(tx.amount, tx.asset)}
                </span>
                <span className='wl-tx-status' style={{ color:StCfg.color, background:StCfg.bg }}>
                  <StIcon size={9} weight='bold'/>
                  {tx.status}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR — Quick Actions + Limits
═══════════════════════════════════════════════════════════════ */
function WalletSidebar({ user, onDeposit, onWithdraw }) {
  const navigate   = useNavigate()
  const displayName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Investor'
  const initials   = displayName.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()

  const limits = [
    { label:'Daily Deposit',  used: 5_000, max: 25_000, color:'#00C076' },
    { label:'Daily Withdraw', used: 1_000, max: 10_000, color:'#1A56FF' },
  ]

  const quick = [
    { label:'Deposit',  Icon: ArrowCircleDown, action: onDeposit,           col:'#00C076' },
    { label:'Withdraw', Icon: ArrowCircleUp,   action: onWithdraw,          col:'#FF3D57' },
    { label:'Convert',  Icon: Swap,            action: () => {},            col:'#1A56FF' },
    { label:'Earn',     Icon: Percent,         action: () => {},            col:'#FFB800' },
    { label:'Boost',    Icon: Lightning,       action: () => {},            col:'#9945FF' },
  ]

  return (
    <aside className='wl-sidebar'>

      {/* User card */}
      <div className='wl-side-panel wl-user-panel'>
        <div className='wl-user-avatar'>{initials}</div>
        <div className='wl-user-name'>{displayName}</div>
        <div className='wl-user-handle'>@{user?.username || 'investor'}</div>
        <div className='wl-user-tier'>
          <ShieldCheck size={10} weight='fill' style={{ color:'#00C076' }}/>
          Verified · KYC Level 2
        </div>
        <div className='wl-user-divider'/>
        <div className='wl-user-stats'>
          <div className='wl-us-item'>
            <span className='wl-us-val'>{$K(totalUSD)}</span>
            <span className='wl-us-lab'>Net Worth</span>
          </div>
          <div className='wl-us-divider'/>
          <div className='wl-us-item'>
            <span className='wl-us-val'>8</span>
            <span className='wl-us-lab'>Positions</span>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className='wl-side-panel'>
        <div className='wl-side-head'>
          <Lightning size={12} weight='duotone' className='wl-pico'/>
          Quick Actions
        </div>
        <div className='wl-quick-grid'>
          {quick.map((q) => {
            const Icon = q.Icon
            return (
              <button key={q.label} className='wl-quick-btn' onClick={q.action}
                style={{ '--qcol': q.col }}>
                <span className='wl-qb-icon' style={{ background:`${q.col}1a`, color:q.col }}>
                  <Icon size={16} weight='duotone'/>
                </span>
                <span className='wl-qb-label'>{q.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Account limits */}
      <div className='wl-side-panel'>
        <div className='wl-side-head'>
          <Percent size={12} weight='duotone' className='wl-pico'/>
          Account Limits
        </div>
        <div className='wl-limits'>
          {limits.map((lim) => {
            const pct = (lim.used / lim.max) * 100
            return (
              <div key={lim.label} className='wl-lim-row'>
                <div className='wl-lim-top'>
                  <span className='wl-lim-label'>{lim.label}</span>
                  <span className='wl-lim-vals'>
                    <span style={{ color: lim.color }}>{$K(lim.used)}</span>
                    <span className='wl-lim-max'>/ {$K(lim.max)}</span>
                  </span>
                </div>
                <div className='wl-lim-bar'>
                  <div className='wl-lim-fill'
                    style={{ width:`${pct}%`, background:lim.color, boxShadow:`0 0 8px ${lim.color}50` }}/>
                </div>
                <span className='wl-lim-remain'>{$K(lim.max - lim.used)} remaining</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Security status */}
      <div className='wl-side-panel wl-sec-panel'>
        <div className='wl-side-head'>
          <ShieldCheck size={12} weight='duotone' className='wl-pico'/>
          Security
        </div>
        <div className='wl-sec-list'>
          {[
            { label:'2FA Enabled',      ok: true  },
            { label:'Whitelist Active', ok: true  },
            { label:'Anti-phishing',    ok: true  },
            { label:'Withdrawal Lock',  ok: false },
          ].map((item) => (
            <div key={item.label} className='wl-sec-row'>
              <span className={`wl-sec-dot ${item.ok ? 'on' : 'off'}`}/>
              <span className='wl-sec-label'>{item.label}</span>
              <span className={`wl-sec-status ${item.ok ? 'on' : 'off'}`}>
                {item.ok ? 'Active' : 'Off'}
              </span>
            </div>
          ))}
        </div>
      </div>

    </aside>
  )
}

/* ═══════════════════════════════════════════════════════════════
   WALLET PAGE
═══════════════════════════════════════════════════════════════ */
export default function WalletOverview() {
  const { user, isDark } = useOutletContext() ?? {}
  const navigate         = useNavigate()

  const onDeposit  = () => navigate('deposit')
  const onWithdraw = () => navigate('withdraw')

  return (
    <div className='wl-root'>

      {/* top bar */}
      <div className='wl-top'>
        <div>
          <h1 className='wl-title'>Wallet</h1>
          <p className='wl-sub'>Manage balances, deposits and withdrawals.</p>
        </div>
        <nav className='wl-bc'>
          <span>Veltro</span><CaretRight size={9}/>
          <span>Dashboard</span><CaretRight size={9}/>
          <span className='act'>Wallet</span>
        </nav>
      </div>

      {/* balance card + stat strip */}
      <BalanceCard onDeposit={onDeposit} onWithdraw={onWithdraw}/>
      <StatStrip/>

      {/* body */}
      <div className='wl-body'>
        <div className='wl-main'>
          <AssetBreakdown/>
          <TxHistory/>
        </div>
        <WalletSidebar user={user} onDeposit={onDeposit} onWithdraw={onWithdraw}/>
      </div>

    </div>
  )
}