import { useState, useMemo, useEffect } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { apiGet } from '../../utils/api.js'
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
} from 'recharts'
import {
  CaretRight, CaretUp, CaretDown, CaretUpDown,
  ArrowCircleDown, ArrowCircleUp, ArrowsLeftRight,
  MagnifyingGlass, Funnel, X, Download, Check, CaretLeft,
  ArrowRight, Clock, Warning, CircleNotch,
  CurrencyDollar, ChartBar, Buildings, Lightning,
  Receipt, XCircle, CheckCircle, Hourglass,
} from '@phosphor-icons/react'
import './Transactions.css'

/* ════════════════════════════════════════════════════════
   MOCK DATA -- mirrors DB transactions schema exactly:
   { id, user_id, wallet_id, type, status, amount, fee,
     net_amount, currency, balance_before, balance_after,
     payment_method, payment_ref, bank_name, account_last4,
     description, created_at }
════════════════════════════════════════════════════════ */
let _tid = 8000
const mkTx = (type, status, amount, fee, bal_before, method, bank, last4, desc, ts, ref) => {
  const id = `TX-${++_tid}`
  const net = type === 'deposit' || type === 'credit' || type === 'refund' || type === 'trade_credit'
    ? +(amount - fee).toFixed(2)
    : -(amount + fee)
  const bal_after = +(bal_before + net).toFixed(2)
  return {
    id, type, status, amount, fee: fee ?? 0,
    net_amount: net, currency: 'USD',
    balance_before: bal_before, balance_after: bal_after,
    payment_method: method ?? 'bank_transfer',
    payment_ref: ref ?? `REF-${Math.random().toString(36).slice(2,10).toUpperCase()}`,
    bank_name: bank ?? null, account_last4: last4 ?? null,
    description: desc, created_at: ts,
  }
}

const TRANSACTIONS = [
  mkTx('deposit',      'completed',  5000.00, 0,       7450.38, 'bank_transfer', 'First Bank Nigeria',  '4821', 'Deposit via First Bank',              'Mar 10 · 09:14', 'FBN-8812443'),
  mkTx('trade_debit',  'completed',  2382.60, 2.38,   12450.38, 'internal',      null,                  null,  'NVDA × 22 -- Market Buy',              'Mar 9 · 10:14',  null),
  mkTx('trade_credit', 'completed',  1180.40, 1.18,   10069.96, 'internal',      null,                  null,  'ETH/USDT × 0.34 -- Partial Fill',      'Mar 9 · 09:44',  null),
  mkTx('withdrawal',   'completed',  2000.00, 15.00,  11250.36, 'bank_transfer', 'GTBank',              '7734', 'Withdrawal to GTBank ••7734',          'Mar 8 · 16:30',  'GTB-9921004'),
  mkTx('trade_debit',  'completed',  2040.00, 2.04,   13252.36, 'internal',      null,                  null,  'META × 4 -- Limit Buy',                'Mar 7 · 14:22',  null),
  mkTx('fee',          'completed',    12.50, 0,      11210.36, 'internal',      null,                  null,  'Monthly platform fee',                'Mar 7 · 00:00',  null),
  mkTx('deposit',      'completed', 10000.00, 0,       1210.36, 'bank_transfer', 'Zenith Bank',         '2290', 'Deposit via Zenith Bank',             'Mar 5 · 11:03',  'ZEN-5541209'),
  mkTx('trade_debit',  'completed',  1843.20, 1.84,   11210.36, 'internal',      null,                  null,  'XOM × 16 -- Market Buy',               'Mar 5 · 10:55',  null),
  mkTx('trade_credit', 'completed',  1081.80, 1.08,    9368.00, 'internal',      null,                  null,  'SOL/USDT × 6 -- Limit Sell',           'Mar 4 · 15:30',  null),
  mkTx('withdrawal',   'pending',    1500.00, 10.00,  10449.72, 'bank_transfer', 'Access Bank',         '3318', 'Withdrawal to Access ••3318',          'Mar 4 · 12:00',  'ACC-7730012'),
  mkTx('deposit',      'completed',  3000.00, 0,       7449.72, 'card',          null,                  '4444', 'Card deposit ••4444',                 'Mar 3 · 08:20',  'CRD-1182903'),
  mkTx('trade_debit',  'completed',   912.00, 0.91,   10449.72, 'internal',      null,                  null,  'BNB/USDT × 1.8 -- Limit Buy',          'Mar 2 · 17:44',  null),
  mkTx('refund',       'completed',    50.00, 0,       9537.63, 'internal',      null,                  null,  'Trade fee refund -- promo credit',     'Mar 2 · 09:00',  null),
  mkTx('deposit',      'completed',  2000.00, 0,       9487.63, 'bank_transfer', 'UBA',                 '6612', 'Deposit via UBA',                     'Mar 1 · 10:45',  'UBA-4490218'),
  mkTx('trade_debit',  'completed',  2887.50, 2.89,  11487.63, 'internal',      null,                  null,  'MSFT × 7.5 -- Limit Buy',              'Feb 28 · 14:55', null),
  mkTx('trade_credit', 'completed',   807.00, 0.81,   8599.02, 'internal',      null,                  null,  'OP/USDT × 200 -- Limit Sell',          'Feb 27 · 12:18', null),
  mkTx('withdrawal',   'failed',     1000.00, 8.00,   9406.83, 'bank_transfer', 'Fidelity Bank',       '8891', 'Withdrawal failed -- insufficient KYC', 'Feb 26 · 16:00', 'FID-0041823'),
  mkTx('credit',       'completed',   100.00, 0,       9406.83, 'internal',      null,                  null,  'Referral bonus credit',               'Feb 25 · 09:00',  null),
  mkTx('deposit',      'completed',  5000.00, 0,       9306.83, 'bank_transfer', 'Sterling Bank',       '1103', 'Deposit via Sterling Bank',           'Feb 22 · 11:30',  'STL-2210044'),
  mkTx('trade_debit',  'completed',  1980.90, 1.98,  14306.83, 'internal',      null,                  null,  'JPM × 9 -- Market Buy',                'Feb 20 · 09:20',  null),
]

/* ─── META ─── */
const TYPE_META = {
  deposit:       { label:'Deposit',       color:'#00C076', bg:'rgba(0,192,118,.1)',   Icon: ArrowCircleDown  },
  withdrawal:    { label:'Withdrawal',    color:'#FF3D57', bg:'rgba(255,61,87,.1)',   Icon: ArrowCircleUp    },
  trade_debit:   { label:'Trade Buy',     color:'#1A56FF', bg:'rgba(26,86,255,.1)',   Icon: ArrowsLeftRight  },
  trade_credit:  { label:'Trade Sell',    color:'#9945FF', bg:'rgba(153,69,255,.1)',  Icon: ArrowsLeftRight  },
  fee:           { label:'Fee',           color:'#FFB800', bg:'rgba(255,184,0,.1)',   Icon: Receipt          },
  credit:        { label:'Credit',        color:'#00FFD1', bg:'rgba(0,255,209,.1)',   Icon: CheckCircle      },
  refund:        { label:'Refund',        color:'#00E676', bg:'rgba(0,230,118,.1)',   Icon: ArrowRight       },
}
const STATUS_META = {
  completed:  { color:'#00C076', bg:'rgba(0,192,118,.1)',            Icon: CheckCircle, label:'Completed'  },
  pending:    { color:'#FFB800', bg:'rgba(255,184,0,.1)',            Icon: Hourglass,   label:'Pending'    },
  processing: { color:'#00D4FF', bg:'rgba(0,212,255,.1)',            Icon: CircleNotch, label:'Processing' },
  failed:     { color:'#FF3D57', bg:'rgba(255,61,87,.1)',            Icon: XCircle,     label:'Failed'     },
  cancelled:  { color:'rgba(255,255,255,.3)', bg:'rgba(255,255,255,.06)', Icon: XCircle, label:'Cancelled' },
}
const METHOD_LABELS = {
  bank_transfer:'Bank Transfer', card:'Card', crypto:'Crypto', internal:'Internal',
}
const TYPE_OPTS   = ['All','Deposits','Withdrawals','Trades','Fees','Credits']
const STATUS_OPTS = ['All','Completed','Pending','Failed']
const METHOD_OPTS = ['All','Bank Transfer','Card','Internal']

const MONTHLY = [
  { m:'Oct', dep:1200, wth: 500 },
  { m:'Nov', dep:3000, wth: 800 },
  { m:'Dec', dep:2000, wth:1200 },
  { m:'Jan', dep:5000, wth: 500 },
  { m:'Feb', dep:7000, wth:2000 },
  { m:'Mar', dep:5000, wth:1500 },
]

/* ─── HELPERS ─── */
const fmt = (n, dec = 2) => Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
function isCredit(type) { return ['deposit','credit','refund','trade_credit'].includes(type) }

/* ─── STATUS BADGE ─── */
function StatusBadge({ status }) {
  const m = STATUS_META[status] ?? STATUS_META.completed
  return (
    <span className="tx-status-badge" style={{ color: m.color, background: m.bg }}>
      <m.Icon size={8} weight="fill" />{m.label}
    </span>
  )
}

/* ─── DETAIL DRAWER ─── */
function TxDrawer({ tx, onClose }) {
  if (!tx) return null
  const tm = TYPE_META[tx.type] ?? TYPE_META.deposit
  const credit = isCredit(tx.type)
  return (
    <div className="tx-drawer-backdrop" onClick={onClose}>
      <div className="tx-drawer" onClick={e => e.stopPropagation()}>
        <div className="tx-drawer-head">
          <div className="tx-drawer-ico" style={{ background: tm.bg, color: tm.color }}>
            <tm.Icon size={18} weight="duotone" />
          </div>
          <div>
            <div className="tx-drawer-title">{tm.label}</div>
            <div className="tx-drawer-id">{tx.id}</div>
          </div>
          <button className="tx-drawer-close" onClick={onClose}><X size={12} weight="bold" /></button>
        </div>

        <div className="tx-drawer-amount" style={{ color: credit ? '#00C076' : '#FF3D57' }}>
          {credit ? '+' : '−'}${fmt(tx.amount)}
          <span className="tx-drawer-currency">USD</span>
        </div>

        <StatusBadge status={tx.status} />

        <div className="tx-drawer-rows">
          {[
            { l:'Description',    v: tx.description },
            { l:'Date & Time',    v: tx.created_at },
            { l:'Net Amount',     v: `${credit ? '+' : '−'}$${fmt(Math.abs(tx.net_amount))}` },
            { l:'Fee',            v: tx.fee > 0 ? `$${fmt(tx.fee)}` : 'None' },
            { l:'Balance Before', v: `$${fmt(tx.balance_before)}` },
            { l:'Balance After',  v: `$${fmt(tx.balance_after)}` },
            { l:'Payment Method', v: METHOD_LABELS[tx.payment_method] ?? tx.payment_method },
            tx.bank_name     && { l:'Bank',      v: tx.bank_name },
            tx.account_last4 && { l:'Account',   v: `••••${tx.account_last4}` },
            tx.payment_ref   && { l:'Reference', v: tx.payment_ref },
          ].filter(Boolean).map(row => (
            <div key={row.l} className="tx-drawer-row">
              <span className="tx-dr-label">{row.l}</span>
              <span className="tx-dr-val">{row.v}</span>
            </div>
          ))}
        </div>

        {tx.status === 'failed' && (
          <div className="tx-drawer-alert">
            <Warning size={11} weight="fill" />
            Transaction failed. Funds were not debited. Contact support if needed.
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── BAR CHART TOOLTIP ─── */
function BarTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="tx-bar-tip">
      <div className="tx-bar-tip-month">{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="tx-bar-tip-row">
          <span style={{ color: p.fill }}>{p.name}</span>
          <span>${fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   ROOT
════════════════════════════════════════════════════════ */
export default function Transactions() {
  useOutletContext?.()
  const navigate = useNavigate()

  const [search,   setSearch]   = useState('')
  const [typeF,    setTypeF]    = useState('All')
  const [statusF,  setStatusF]  = useState('All')
  const [methodF,  setMethodF]  = useState('All')
  const [sort,     setSort]     = useState({ field:'created_at', dir:'desc' })
  const [selected, setSelected] = useState(null)
  const [page,     setPage]     = useState(1)
  const [txRows,   setTxRows]   = useState([])     // start empty -- no mock fallback
  const [loading,  setLoading]  = useState(true)
  const [chartData,setChartData]= useState(MONTHLY) // keep static 6-month chart as visual fixture
  const PER_PAGE = 10

  // Fetch live transactions -- new users see clean empty state
  useEffect(() => {
    apiGet('/api/wallet/transactions?limit=200')
      .then(data => {
        setTxRows(Array.isArray(data.transactions) ? data.transactions : [])
      })
      .catch(() => { setTxRows([]) })
      .finally(() => setLoading(false))
  }, [])

  const handleSort = f => setSort(s => ({
    field: f,
    dir: s.field === f && s.dir === 'desc' ? 'asc' : 'desc',
  }))

  const filtered = useMemo(() => {
    let rows = [...txRows]
    if (search) rows = rows.filter(t =>
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      (t.bank_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (t.payment_ref ?? '').toLowerCase().includes(search.toLowerCase())
    )
    if (typeF !== 'All') {
      const map = { Deposits:'deposit', Withdrawals:'withdrawal', Fees:'fee', Credits:'credit' }
      if (typeF === 'Trades') rows = rows.filter(t => t.type.startsWith('trade'))
      else if (map[typeF])    rows = rows.filter(t => t.type === map[typeF])
    }
    if (statusF !== 'All') rows = rows.filter(t => t.status === statusF.toLowerCase())
    if (methodF !== 'All') {
      const map = { 'Bank Transfer':'bank_transfer', 'Card':'card', 'Internal':'internal' }
      rows = rows.filter(t => t.payment_method === map[methodF])
    }
    rows.sort((a, b) => {
      const av = a[sort.field], bv = b[sort.field]
      const r = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return sort.dir === 'asc' ? r : -r
    })
    return rows
  }, [search, typeF, statusF, methodF, sort])

  const paginated  = useMemo(() => filtered.slice((page-1)*PER_PAGE, page*PER_PAGE), [filtered, page])
  const totalPages = Math.ceil(filtered.length / PER_PAGE)

  const stats = useMemo(() => {
    const done = txRows.filter(t => t.status === 'completed')
    const latestBal = txRows.length > 0 ? (Number(txRows[0]?.balance_after) || 0) : 0
    return {
      currentBalance: latestBal,
      totalDeposited: done.filter(t => t.type === 'deposit').reduce((s,t) => s+Number(t.amount||0), 0),
      totalWithdrawn: done.filter(t => t.type === 'withdrawal').reduce((s,t) => s+Number(t.amount||0), 0),
      totalFeesPaid:  done.filter(t => !['deposit','credit','refund'].includes(t.type)).reduce((s,t) => s+Number(t.fee||0), 0),
      totalCredits:   done.filter(t => ['credit','refund'].includes(t.type)).reduce((s,t) => s+Number(t.amount||0), 0),
      pendingCount:   txRows.filter(t => t.status === 'pending').length,
    }
  }, [txRows])

  /* Sort header button -- renders a <div> (never <th>) */
  function SortTh({ field, label }) {
    const active = sort.field === field
    return (
      <div className={`tx-th-btn ${active ? 'on' : ''}`} onClick={() => handleSort(field)}>
        {label}
        {active
          ? sort.dir === 'desc' ? <CaretDown size={8} weight="bold" /> : <CaretUp size={8} weight="bold" />
          : <CaretUpDown size={8} weight="bold" style={{ opacity:.28 }} />}
      </div>
    )
  }

  return (
    <div className="tx-root">

      {/* ─── PAGE HEADER ─── */}
      <div className="tx-page-head">
        <div className="tx-head-left">
          <div className="tx-head-ico"><Receipt size={16} weight="fill" /></div>
          <div>
            <h1 className="tx-page-title">Transactions</h1>
            <p className="tx-page-sub">Complete history of all wallet activity</p>
          </div>
        </div>
        <div className="tx-head-actions">
          <button className="tx-head-btn" onClick={() => navigate('../wallet/deposit')}>
            <ArrowCircleDown size={12} weight="bold" />Deposit
          </button>
          <button className="tx-head-btn" onClick={() => navigate('../wallet/withdraw')}>
            <ArrowCircleUp size={12} weight="bold" />Withdraw
          </button>
          <button className="tx-head-btn ghost">
            <Download size={12} weight="bold" />Export CSV
          </button>
        </div>
        <nav className="tx-bc">
          <span>Dashboard</span><CaretRight size={9} /><span className="tx-bc-cur">Transactions</span>
        </nav>
      </div>

      {/* ─── SUMMARY CARDS ─── */}
      <div className="tx-summary">
        {[
          { label:'Current Balance',   val:`$${fmt(stats.currentBalance)}`,  color:'var(--cy-neon,#00FFD1)', Icon:CurrencyDollar,  sub:'Available funds'          },
          { label:'Total Deposited',   val:`$${fmt(stats.totalDeposited)}`,  color:'#00C076',                Icon:ArrowCircleDown, sub:'All time'                 },
          { label:'Total Withdrawn',   val:`$${fmt(stats.totalWithdrawn)}`,  color:'#FF3D57',                Icon:ArrowCircleUp,   sub:'All time'                 },
          { label:'Fees Paid',         val:`$${fmt(stats.totalFeesPaid)}`,   color:'#FFB800',                Icon:Receipt,         sub:'Across all transactions'  },
          { label:'Credits & Refunds', val:`$${fmt(stats.totalCredits)}`,    color:'#9945FF',                Icon:CheckCircle,     sub:'Bonuses & refunds'        },
          { label:'Pending',           val:String(stats.pendingCount),       color:stats.pendingCount > 0 ? '#FFB800' : 'rgba(255,255,255,.3)',
            Icon:Hourglass, sub:'Awaiting completion' },
        ].map(s => (
          <div key={s.label} className="tx-sum-card">
            <div className="tx-sum-top">
              <div className="tx-sum-ico" style={{ color:s.color, background:`${s.color}18` }}>
                <s.Icon size={14} weight="duotone" />
              </div>
              <div className="tx-sum-lbl">{s.label}</div>
            </div>
            <div className="tx-sum-val" style={{ color:s.color }}>{s.val}</div>
            <div className="tx-sum-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ─── CHART ─── */}
      <div className="tx-chart-card">
        <div className="tx-chart-head">
          <div className="tx-chart-title"><ChartBar size={13} weight="duotone" />6-Month Activity</div>
          <div className="tx-chart-legend">
            <span className="tx-legend-dot" style={{ background:'#00C076' }} />Deposits
            <span className="tx-legend-dot" style={{ background:'#FF3D57', marginLeft:12 }} />Withdrawals
          </div>
        </div>
        <div className="tx-chart-body">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MONTHLY} barGap={4} margin={{ top:4, right:8, bottom:0, left:0 }}>
              <XAxis dataKey="m" axisLine={false} tickLine={false}
                tick={{ fontSize:9, fill:'rgba(255,255,255,.3)', fontFamily:'Inter,system-ui,sans-serif' }} />
              <YAxis hide />
              <Tooltip content={<BarTip />} cursor={{ fill:'rgba(255,255,255,.03)' }} />
              <Bar dataKey="dep" name="Deposits"    fill="#00C076" radius={[3,3,0,0]} maxBarSize={22} />
              <Bar dataKey="wth" name="Withdrawals" fill="#FF3D57" radius={[3,3,0,0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── MAIN PANEL ─── */}
      <div className="tx-panel">

        {/* Filters */}
        <div className="tx-filter-bar">
          <div className="tx-search-wrap">
            <MagnifyingGlass size={12} className="tx-search-ico" />
            <input className="tx-search-input" placeholder="Search ID, description, reference..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
            {search && <button className="tx-search-clear" onClick={() => setSearch('')}><X size={9} weight="bold" /></button>}
          </div>
          {[
            { label:'Type',   opts:TYPE_OPTS,   val:typeF,   set:v => { setTypeF(v);   setPage(1) } },
            { label:'Status', opts:STATUS_OPTS, val:statusF, set:v => { setStatusF(v); setPage(1) } },
            { label:'Method', opts:METHOD_OPTS, val:methodF, set:v => { setMethodF(v); setPage(1) } },
          ].map(f => (
            <div key={f.label} className="tx-filter-group">
              <span className="tx-filter-lbl">{f.label}</span>
              <div className="tx-sel-wrap">
                <select className="tx-select" value={f.val} onChange={e => f.set(e.target.value)}>
                  {f.opts.map(o => <option key={o}>{o}</option>)}
                </select>
                <CaretDown size={9} className="tx-sel-arr" />
              </div>
            </div>
          ))}
          <div className="tx-filter-spacer" />
          <span className="tx-result-count">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Table header -- all divs, no th */}
        <div className="tx-table-head">
          <SortTh field="id"            label="Transaction ID" />
          <div className="tx-th-btn">Type</div>
          <SortTh field="amount"        label="Amount" />
          <SortTh field="fee"           label="Fee" />
          <SortTh field="net_amount"    label="Net" />
          <SortTh field="balance_after" label="Balance After" />
          <div className="tx-th-btn">Method</div>
          <div className="tx-th-btn">Status</div>
          <SortTh field="created_at"    label="Date" />
        </div>

        {/* Rows */}
        {loading ? (
          <div className="tx-empty" style={{ gap:10 }}>
            <CircleNotch size={28} weight="duotone" style={{ animation:'spin 0.8s linear infinite', opacity:0.4 }}/>
            <span>Loading transactions...</span>
          </div>
        ) : paginated.length === 0 ? (
          <div className="tx-empty">
            <Receipt size={28} weight="duotone" />
            <span>{txRows.length === 0 ? 'No transactions yet -- make your first deposit to get started.' : 'No transactions match your filters'}</span>
          </div>
        ) : (
          <div className="tx-list">
            {paginated.map((t, idx) => {
              const txType = t.type || 'deposit'
              const tm     = TYPE_META[txType] ?? TYPE_META.deposit
              const credit = isCredit(txType)
              const dateStr = t.created_at
                ? new Date(t.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})
                : '--'
              return (
                <div key={t.id||idx}
                  className={`tx-row ${t.status === 'failed' ? 'row-failed' : ''}`}
                  style={{ animationDelay:`${idx * 20}ms` }}
                  onClick={() => setSelected(t)}>
                  <div className="tx-row-id-cell">
                    <div className="tx-row-ico" style={{ background:tm.bg, color:tm.color }}>
                      <tm.Icon size={11} weight="duotone" />
                    </div>
                    <div>
                      <div className="tx-row-id">{String(t.id||'').slice(0,16)}</div>
                      <div className="tx-row-desc">{t.description||t.note||'--'}</div>
                    </div>
                  </div>
                  <span className="tx-type-chip" style={{ color:tm.color, background:tm.bg }}>{tm.label}</span>
                  <span className={`tx-amount ${credit ? 'credit' : 'debit'}`}>{credit ? '+' : '−'}${fmt(Number(t.amount||0))}</span>
                  <span className="tx-fee">{Number(t.fee||0) > 0 ? `$${fmt(Number(t.fee))}` : <span className="tx-no-fee">--</span>}</span>
                  <span className={`tx-net ${credit ? 'credit' : 'debit'}`}>{credit ? '+' : '−'}${fmt(Math.abs(Number(t.net_amount||t.amount||0)))}</span>
                  <span className="tx-balance">{Number(t.balance_after||0)>0 ? `$${fmt(Number(t.balance_after))}` : '--'}</span>
                  <span className="tx-method">{METHOD_LABELS[t.payment_method||t.method] ?? (t.payment_method||'--')}</span>
                  <StatusBadge status={t.status||'completed'} />
                  <span className="tx-date">{dateStr}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="tx-pagination">
            <button className="tx-page-btn" disabled={page === 1} onClick={() => setPage(p => p-1)}>
              <CaretLeft size={11} weight="bold" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i+1).map(p => (
              <button key={p} className={`tx-page-btn ${page === p ? 'on' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="tx-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p+1)}>
              <CaretRight size={11} weight="bold" />
            </button>
            <span className="tx-page-info">
              {(page-1)*PER_PAGE+1}-{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length}
            </span>
          </div>
        )}
      </div>

      {/* ─── DETAIL DRAWER ─── */}
      <TxDrawer tx={selected} onClose={() => setSelected(null)} />
    </div>
  )
}