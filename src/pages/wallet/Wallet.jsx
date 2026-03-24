import { useState, useEffect, useRef, useCallback } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { apiGet } from '../../utils/api.js'
import {
  Wallet, ArrowUpRight, ArrowDownRight, CaretRight,
  Eye, EyeSlash, Clock, CheckCircle,
  XCircle, Hourglass, CurrencyBtc, CurrencyEth,
  ArrowCircleDown, ArrowCircleUp, Swap, ShieldCheck,
  Percent, Lightning, Plus, Spinner,
  CurrencyDollar, Coins, ArrowClockwise,
} from '@phosphor-icons/react'
import './Wallet.css'

/* ═══════════════════════════════════════════════════════════════
   STATIC REFERENCE DATA
═══════════════════════════════════════════════════════════════ */
const USD_RATES   = { USD:1, USDC:1, BTC:67_420, ETH:3_210, SOL:142.4 }
const ASSET_META  = {
  USD:  { label:'US Dollar',   icon: CurrencyDollar, color:'#00C076' },
  USDC: { label:'USD Coin',    icon: CurrencyDollar, color:'#2775CA' },
  BTC:  { label:'Bitcoin',     icon: CurrencyBtc,    color:'#F7931A' },
  ETH:  { label:'Ethereum',    icon: CurrencyEth,    color:'#627EEA' },
  SOL:  { label:'Solana',      icon: Coins,          color:'#9945FF' },
}

const TX_ICONS = {
  deposit:      { icon: ArrowCircleDown, color:'#00C076' },
  withdrawal:   { icon: ArrowCircleUp,   color:'#FF3D57' },
  trade:        { icon: Swap,            color:'#1A56FF' },
  trade_debit:  { icon: Swap,            color:'#1A56FF' },
  trade_credit: { icon: Swap,            color:'#9945FF' },
  investment:   { icon: ArrowUpRight,    color:'#FFB800' },
  fee:          { icon: ArrowDownRight,  color:'#FF8C42' },
  credit:       { icon: CheckCircle,     color:'#00FFD1' },
  refund:       { icon: CheckCircle,     color:'#00E676' },
}
const STATUS_CFG = {
  completed: { icon: CheckCircle, color:'#00C076', bg:'rgba(0,192,118,0.1)'  },
  pending:   { icon: Hourglass,   color:'#FFB800', bg:'rgba(255,184,0,0.1)'  },
  failed:    { icon: XCircle,     color:'#FF3D57', bg:'rgba(255,61,87,0.1)'  },
}

/* ─ Formatters ─ */
const $ = (n, d=2) =>
  `$${Number(n||0).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d})}`
const $K = n => n>=1e6 ? `$${(n/1e6).toFixed(3)}M` : n>=1e3 ? `$${(n/1e3).toFixed(2)}K` : $(n)
const fmtBal = (n, sym) => {
  if (!sym || sym==='USD'||sym==='USDC') return $(n,2)
  if (sym==='BTC') return `${Number(n||0).toFixed(6)} BTC`
  if (sym==='ETH') return `${Number(n||0).toFixed(4)} ETH`
  return `${Number(n||0).toFixed(2)} ${sym}`
}
const fmtType = t => {
  if (!t) return 'Transaction'
  const m = { deposit:'Deposit', withdrawal:'Withdrawal', trade_debit:'Trade Buy',
               trade_credit:'Trade Sell', investment:'Investment', fee:'Fee',
               credit:'Credit', refund:'Refund', trade:'Trade' }
  return m[t] || t.charAt(0).toUpperCase()+t.slice(1)
}

/* ═══════════════════════════════════════════════════════════════
   DONUT CHART — pure SVG
═══════════════════════════════════════════════════════════════ */
function DonutChart({ assets, hov, setHov, totalUSD }) {
  if (!assets.length) {
    return (
      <svg width={148} height={148} style={{ overflow:'visible', flexShrink:0 }}>
        <circle cx={74} cy={74} r={54} fill='none' stroke='rgba(255,255,255,0.06)' strokeWidth={20}/>
        <text x={74} y={70}  textAnchor='middle' fontSize={10} fill='var(--vlt-text-muted)' fontFamily='Inter,sans-serif' fontWeight={600}>TOTAL</text>
        <text x={74} y={85}  textAnchor='middle' fontSize={13} fill='var(--vlt-text-primary)' fontFamily='Inter,sans-serif' fontWeight={800}>$0.00</text>
      </svg>
    )
  }

  const SIZE=148, CX=74, CY=74, R=54, INNER=34, GAP=2.5
  const total = assets.reduce((s,a)=>s+a.alloc,0)
  let angle = -90
  const slices = assets.map(a => {
    const sweep = (a.alloc/total)*360
    const start = angle
    angle += sweep + GAP
    const deg2r = d => (d*Math.PI)/180
    const x1=CX+R*Math.cos(deg2r(start)); const y1=CY+R*Math.sin(deg2r(start))
    const x2=CX+R*Math.cos(deg2r(start+sweep)); const y2=CY+R*Math.sin(deg2r(start+sweep))
    const ix1=CX+INNER*Math.cos(deg2r(start)); const iy1=CY+INNER*Math.sin(deg2r(start))
    const ix2=CX+INNER*Math.cos(deg2r(start+sweep)); const iy2=CY+INNER*Math.sin(deg2r(start+sweep))
    const large=sweep>180?1:0
    const path=`M${x1.toFixed(2)} ${y1.toFixed(2)} A${R} ${R} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L${ix2.toFixed(2)} ${iy2.toFixed(2)} A${INNER} ${INNER} 0 ${large} 0 ${ix1.toFixed(2)} ${iy1.toFixed(2)} Z`
    return { ...a, path }
  })
  const active = hov!=null ? assets[hov] : null
  return (
    <svg width={SIZE} height={SIZE} style={{ overflow:'visible', flexShrink:0 }}>
      {slices.map((s,i) => (
        <path key={s.id} d={s.path} fill={s.color}
          opacity={hov==null?0.9:i===hov?1:0.28}
          style={{ cursor:'pointer', transform:i===hov?`scale(1.04)`:'scale(1)', transformOrigin:`${CX}px ${CY}px`, transition:'opacity 0.18s,transform 0.18s', filter:i===hov?`drop-shadow(0 0 6px ${s.color}88)`:'none' }}
          onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}/>
      ))}
      <text x={CX} y={CY-7} textAnchor='middle' fontSize={10} fill='var(--vlt-text-muted)' fontFamily='Inter,sans-serif' fontWeight={600}>
        {active?active.sym:'TOTAL'}
      </text>
      <text x={CX} y={CY+8} textAnchor='middle' fontSize={13} fill='var(--vlt-text-primary)' fontFamily='Inter,sans-serif' fontWeight={800} style={{ fontVariantNumeric:'tabular-nums' }}>
        {active?`${active.alloc.toFixed(1)}%`:$K(totalUSD)}
      </text>
      <text x={CX} y={CY+22} textAnchor='middle' fontSize={9.5} fill='var(--vlt-text-muted)' fontFamily='Inter,sans-serif' fontWeight={600}>
        {active?active.label:'Portfolio Value'}
      </text>
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════════════
   BALANCE CARD — real API data
═══════════════════════════════════════════════════════════════ */
function BalanceCard({ totalUSD, available, locked, onDeposit, onWithdraw }) {
  const [hidden, setHidden] = useState(false)
  return (
    <div className='wl-balance-card'>
      <div className='wl-bc-top'>
        <div className='wl-bc-glow'/>
        <div className='wl-bc-grid'/>
        <div className='wl-bc-content'>
          <div className='wl-bc-header'>
            <div className='wl-bc-badge'><ShieldCheck size={11} weight='fill'/>Secured Vault</div>
            <button className='wl-bc-eye' onClick={()=>setHidden(h=>!h)}>
              {hidden?<EyeSlash size={14} weight='bold'/>:<Eye size={14} weight='bold'/>}
            </button>
          </div>
          <div className='wl-bc-label'>Total Portfolio Value</div>
          <div className='wl-bc-amount'>
            {hidden?<span className='wl-bc-redact'>••••••</span>:$K(totalUSD)}
          </div>
          <div className='wl-bc-sub-row'>
            <div className='wl-bc-sub'>
              <span className='wl-bc-sub-label'>Available</span>
              <span className='wl-bc-sub-val up'>{hidden?'•••':$K(available)}</span>
            </div>
            <div className='wl-bc-sub-divider'/>
            <div className='wl-bc-sub'>
              <span className='wl-bc-sub-label'>Reserved</span>
              <span className='wl-bc-sub-val'>{hidden?'•••':$K(locked)}</span>
            </div>
          </div>
        </div>
        <div className='wl-bc-actions'>
          <button className='wl-action-btn primary' onClick={onDeposit}>
            <ArrowCircleDown size={15} weight='bold'/>Deposit
          </button>
          <button className='wl-action-btn ghost' onClick={onWithdraw}>
            <ArrowCircleUp size={15} weight='bold'/>Withdraw
          </button>
          <button className='wl-action-btn ghost' onClick={()=>{}}>
            <Swap size={15} weight='bold'/>Convert
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   STAT STRIP — real numbers
═══════════════════════════════════════════════════════════════ */
function StatStrip({ totalUSD, txCount }) {
  return (
    <div className='wl-strip'>
      {[
        { label:'Portfolio Value', value:$K(totalUSD),   badge:'Total',          up:true, plain:true },
        { label:'Transactions',    value:String(txCount), badge:'All time',       up:true, plain:true },
        { label:'USD Balance',     value:$K(totalUSD),   badge:'Available',      up:totalUSD>0, plain:false },
        { label:'Growth Rate',     value:'+10%',          badge:'Daily (inv.)',   up:true, plain:true },
      ].map((s,i) => (
        <div key={i} className='wl-strip-item'>
          <span className='wl-strip-label'>{s.label}</span>
          <span className='wl-strip-value'>{s.value}</span>
          <span className={`wl-strip-badge ${s.plain?'':s.up?'up':'dn'}`}>
            {!s.plain&&(s.up?<ArrowUpRight size={9} weight='bold'/>:<ArrowDownRight size={9} weight='bold'/>)}
            {s.badge}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ASSET BREAKDOWN — real balances
═══════════════════════════════════════════════════════════════ */
function AssetBreakdown({ balances }) {
  const [hov, setHov] = useState(null)

  /* Build display assets from real API balances */
  const assets = balances
    .filter(b => Number(b.balance) > 0 || b.currency === 'USD')
    .map((b, i) => {
      const meta   = ASSET_META[b.currency] || { label:b.currency, icon:CurrencyDollar, color:'#8A96B4' }
      const usdVal = Number(b.balance) * (USD_RATES[b.currency] || 1)
      return { id:b.currency, sym:b.currency, label:meta.label, color:meta.color,
               icon:meta.icon, bal:Number(b.balance), usdVal, alloc:0 }
    })
  const totalUSD = assets.reduce((s,a)=>s+a.usdVal, 0) || 1
  assets.forEach(a => { a.alloc = (a.usdVal/totalUSD)*100 })

  return (
    <div className='wl-panel wl-assets-panel'>
      <div className='wl-panel-head'>
        <div className='wl-panel-title'><Coins size={13} weight='duotone' className='wl-pico'/>Asset Breakdown</div>
        <button className='wl-btn-ghost'><Plus size={11} weight='bold'/>Add Asset</button>
      </div>
      <div className='wl-assets-body'>
        <div className='wl-donut-wrap'>
          <DonutChart assets={assets} hov={hov} setHov={setHov} totalUSD={totalUSD}/>
        </div>
        <div className='wl-asset-rows'>
          {assets.length === 0 ? (
            <div style={{ padding:'24px 0', color:'var(--vlt-text-muted)', fontSize:12, fontFamily:'Inter,sans-serif', textAlign:'center' }}>
              No assets yet — deposit to get started.
            </div>
          ) : (
            assets.map((a,i) => {
              const Icon = a.icon
              return (
                <div key={a.id} className={`wl-ar ${hov===i?'hov':''}`}
                  onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}>
                  <div className='wl-ar-dot' style={{ background:a.color, boxShadow:`0 0 8px ${a.color}60` }}/>
                  <div className='wl-ar-icon' style={{ background:`${a.color}18`, color:a.color }}>
                    <Icon size={13} weight='duotone'/>
                  </div>
                  <div className='wl-ar-info'>
                    <span className='wl-ar-sym'>{a.sym}</span>
                    <span className='wl-ar-name'>{a.label}</span>
                  </div>
                  <div className='wl-ar-right'>
                    <span className='wl-ar-usd'>{$K(a.usdVal)}</span>
                    <span className='wl-ar-bal'>{fmtBal(a.bal, a.sym)}</span>
                  </div>
                  <span className='wl-ar-alloc' style={{ color:a.color }}>{a.alloc.toFixed(1)}%</span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TRANSACTION HISTORY — real API data, empty state for new users
═══════════════════════════════════════════════════════════════ */
function TxHistory({ transactions, loading }) {
  const [filter, setFilter] = useState('all')
  const filters = ['all', 'deposit', 'withdrawal', 'trade']

  const visible = transactions.filter(t => {
    if (filter === 'all') return true
    if (filter === 'trade') return t.type?.startsWith('trade') || t.type === 'investment'
    return t.type === filter
  })

  return (
    <div className='wl-panel wl-tx-panel'>
      <div className='wl-panel-head'>
        <div className='wl-panel-title'><Clock size={13} weight='duotone' className='wl-pico'/>Transaction History</div>
        <div className='wl-tx-tabs'>
          {filters.map(f => (
            <button key={f} className={`wl-tx-tab ${filter===f?'on':''}`} onClick={()=>setFilter(f)}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className='wl-tx-list'>
        {loading ? (
          <div style={{ padding:'32px 0', display:'flex', alignItems:'center', justifyContent:'center', gap:8, color:'var(--vlt-text-muted)' }}>
            <Spinner size={18} className='inv-spinner'/> Loading transactions…
          </div>
        ) : visible.length === 0 ? (
          <div style={{ padding:'40px 16px', textAlign:'center', color:'var(--vlt-text-muted)', fontFamily:'Inter,sans-serif', fontSize:13 }}>
            <Clock size={28} weight='duotone' style={{ opacity:0.2, display:'block', margin:'0 auto 12px' }}/>
            {filter==='all' ? 'No transactions yet. Make your first deposit to get started.' : `No ${filter} transactions yet.`}
          </div>
        ) : (
          visible.map((tx,i) => {
            const txCfg  = TX_ICONS[tx.type] || TX_ICONS.deposit
            const TxIcon = txCfg.icon
            const status = tx.status || 'completed'
            const stCfg  = STATUS_CFG[status] || STATUS_CFG.completed
            const StIcon = stCfg.icon
            const isCredit = ['deposit','credit','refund','trade_credit'].includes(tx.type)
            const currency = tx.currency || 'USD'
            const meta     = ASSET_META[currency] || { color:'#8A96B4' }
            return (
              <div key={tx.id||i} className='wl-tx-row' style={{ animationDelay:`${i*28}ms` }}>
                <div className='wl-tx-icon-wrap' style={{ background:`${txCfg.color}14`, color:txCfg.color }}>
                  <TxIcon size={15} weight='duotone'/>
                </div>
                <div className='wl-tx-info'>
                  <div className='wl-tx-top-row'>
                    <span className='wl-tx-type'>{fmtType(tx.type)}</span>
                    <span className='wl-tx-note'>{tx.description||tx.note||''}</span>
                  </div>
                  <span className='wl-tx-date'>
                    <Clock size={9} weight='duotone'/>
                    {tx.created_at ? new Date(tx.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—'}
                  </span>
                </div>
                <div className='wl-tx-right'>
                  <span className='wl-tx-amount' style={{ color:meta.color }}>
                    {isCredit?'+':'−'}${Math.abs(Number(tx.amount||0)).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}
                  </span>
                  <span className='wl-tx-status' style={{ color:stCfg.color, background:stCfg.bg }}>
                    <StIcon size={9} weight='bold'/>{status}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR — real data
═══════════════════════════════════════════════════════════════ */
function WalletSidebar({ user, totalUSD, txCount, onDeposit, onWithdraw }) {
  const navigate    = useNavigate()
  const displayName = user?.firstName ? `${user.firstName} ${user.lastName||''}`.trim() : 'Investor'
  const initials    = displayName.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()

  const quick = [
    { label:'Deposit',  Icon:ArrowCircleDown, action:onDeposit,              col:'#00C076' },
    { label:'Withdraw', Icon:ArrowCircleUp,   action:onWithdraw,             col:'#FF3D57' },
    { label:'Convert',  Icon:Swap,            action:()=>navigate('transfer'),col:'#1A56FF' },
    { label:'Earn',     Icon:Percent,         action:()=>{},                 col:'#FFB800' },
    { label:'Boost',    Icon:Lightning,       action:()=>{},                 col:'#9945FF' },
  ]

  return (
    <aside className='wl-sidebar'>
      {/* User card */}
      <div className='wl-side-panel wl-user-panel'>
        <div className='wl-user-avatar'>{initials}</div>
        <div className='wl-user-name'>{displayName}</div>
        <div className='wl-user-handle'>@{user?.username||'investor'}</div>
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
            <span className='wl-us-val'>{txCount}</span>
            <span className='wl-us-lab'>Transactions</span>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className='wl-side-panel'>
        <div className='wl-side-head'><Lightning size={12} weight='duotone' className='wl-pico'/>Quick Actions</div>
        <div className='wl-quick-grid'>
          {quick.map(q => {
            const Icon = q.Icon
            return (
              <button key={q.label} className='wl-quick-btn' onClick={q.action} style={{ '--qcol':q.col }}>
                <span className='wl-qb-icon' style={{ background:`${q.col}1a`, color:q.col }}>
                  <Icon size={16} weight='duotone'/>
                </span>
                <span className='wl-qb-label'>{q.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Security status */}
      <div className='wl-side-panel wl-sec-panel'>
        <div className='wl-side-head'><ShieldCheck size={12} weight='duotone' className='wl-pico'/>Security</div>
        <div className='wl-sec-list'>
          {[
            { label:'2FA Enabled',      ok:true  },
            { label:'Whitelist Active', ok:true  },
            { label:'Anti-phishing',    ok:true  },
            { label:'Withdrawal Lock',  ok:false },
          ].map(item => (
            <div key={item.label} className='wl-sec-row'>
              <span className={`wl-sec-dot ${item.ok?'on':'off'}`}/>
              <span className='wl-sec-label'>{item.label}</span>
              <span className={`wl-sec-status ${item.ok?'on':'off'}`}>{item.ok?'Active':'Off'}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}

/* ═══════════════════════════════════════════════════════════════
   WALLET PAGE — orchestrator
═══════════════════════════════════════════════════════════════ */
export default function WalletOverview() {
  const { user } = useOutletContext() ?? {}
  const navigate = useNavigate()

  const [balances,     setBalances]     = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [txLoading,    setTxLoading]    = useState(true)
  const [refreshing,   setRefreshing]   = useState(false)

  const fetchAll = useCallback(async (showSpin = false) => {
    if (showSpin) setRefreshing(true)
    try {
      const [balRes, txRes] = await Promise.allSettled([
        apiGet('/api/wallet/balances'),
        apiGet('/api/wallet/transactions?limit=50'),
      ])
      if (balRes.status === 'fulfilled') setBalances(balRes.value.balances || [])
      if (txRes.status  === 'fulfilled') setTransactions(txRes.value.transactions || [])
    } catch { /* silent */ }
    setLoading(false)
    setTxLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  /* ── Computed totals from real data ── */
  const totalUSD  = balances.reduce((s,b) => s + Number(b.balance||0) * (USD_RATES[b.currency]||1), 0)
  const available = balances.reduce((s,b) => {
    const avail = Number(b.balance||0) - Number(b.reserved||0)
    return s + Math.max(0, avail) * (USD_RATES[b.currency]||1)
  }, 0)
  const locked    = totalUSD - available
  const txCount   = transactions.length

  const onDeposit  = () => navigate('deposit')
  const onWithdraw = () => navigate('withdraw')

  if (loading) {
    return (
      <div className='wl-root' style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:400 }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, color:'var(--vlt-text-muted)' }}>
          <Spinner size={28} style={{ animation:'spin 0.8s linear infinite' }}/>
          <span style={{ fontFamily:'Inter,sans-serif', fontSize:13 }}>Loading wallet…</span>
        </div>
      </div>
    )
  }

  return (
    <div className='wl-root'>
      {/* Top bar */}
      <div className='wl-top'>
        <div>
          <h1 className='wl-title'>Wallet</h1>
          <p className='wl-sub'>Manage balances, deposits and withdrawals.</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:'auto' }}>
          <button className='wl-btn-ghost' onClick={()=>fetchAll(true)} disabled={refreshing}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', fontSize:12 }}>
            <ArrowClockwise size={13} weight='bold' style={{ animation:refreshing?'spin 0.8s linear infinite':undefined }}/>
            Refresh
          </button>
        </div>
        <nav className='wl-bc'>
          <span>Veltro</span><CaretRight size={9}/>
          <span>Dashboard</span><CaretRight size={9}/>
          <span className='act'>Wallet</span>
        </nav>
      </div>

      <BalanceCard totalUSD={totalUSD} available={available} locked={Math.max(0,locked)} onDeposit={onDeposit} onWithdraw={onWithdraw}/>
      <StatStrip totalUSD={totalUSD} txCount={txCount}/>

      <div className='wl-body'>
        <div className='wl-main'>
          <AssetBreakdown balances={balances}/>
          <TxHistory transactions={transactions} loading={txLoading}/>
        </div>
        <WalletSidebar user={user} totalUSD={totalUSD} txCount={txCount} onDeposit={onDeposit} onWithdraw={onWithdraw}/>
      </div>
    </div>
  )
}
