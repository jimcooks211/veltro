import { useState, useMemo, useEffect } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { apiGet, apiDelete } from '../../utils/api.js'
import {
  CaretRight, CaretUp, CaretDown, CaretUpDown,
  X, Check, MagnifyingGlass, Funnel, Export,
  ArrowClockwise, Download, Warning,
  TrendUp, TrendDown, ListBullets, Clock,
  ArrowCircleDown, ArrowCircleUp, ChartLine,
  CheckCircle, XCircle, Minus as MinusIcon,
  Circle, Hourglass, Lightning, ArrowRight,
} from '@phosphor-icons/react'
import './Orders.css'

/* ════════════════════════════════════════════════════════
   MOCK DATA — 40 orders across different states
════════════════════════════════════════════════════════ */
let _oid = 1000
function mkOrder(sym, side, type, status, qty, price, filled, ts, pnl) {
  const id = `VO-${++_oid}`
  const filledQty = type === 'Market' ? qty : (filled ?? 0)
  const filledPct = qty > 0 ? (filledQty / qty) * 100 : 0
  const fee = +(price * filledQty * 0.001).toFixed(4)
  return { id, sym, side, type, status, qty, price, filledQty, filledPct, fee, ts, pnl: pnl ?? null }
}

const ALL_ORDERS = [
  mkOrder('BTC/USDT','buy', 'Limit',       'open',    0.0500, 65_000,  0,      '14:22:11', null),
  mkOrder('ETH/USDT','sell','Limit',       'partial', 0.8000,  3_650,  0.3400, '09:44:05', null),
  mkOrder('SOL/USDT','sell','Stop-Limit',  'open',    5.0000,   175,   0,      '11:03:28', null),
  mkOrder('BTC/USDT','buy', 'Market',      'filled',  0.0200, 67_210,  0.0200, '08:11:44', +134.42),
  mkOrder('ETH/USDT','buy', 'Limit',       'filled',  1.5000,  3_410,  1.5000, '07:55:20', +167.70),
  mkOrder('SOL/USDT','buy', 'Market',      'filled',  10.000,   177,   10.000, 'Mar 9 · 15:30', +64.20),
  mkOrder('ARB/USDT','sell','Limit',       'cancelled',2000,    1.35,   0,     'Mar 9 · 12:10', null),
  mkOrder('BNB/USDT','buy', 'Limit',       'filled',  1.0000,  582,    1.0000, 'Mar 9 · 10:05', +12.30),
  mkOrder('OP/USDT', 'sell','Stop-Market', 'filled',  150.0,   2.74,   150.0,  'Mar 9 · 09:44', -18.00),
  mkOrder('BTC/USDT','sell','Limit',       'cancelled',0.0100, 69_000,  0,     'Mar 8 · 16:22', null),
  mkOrder('ETH/USDT','sell','Market',      'filled',  0.6000,  3_590,  0.6000, 'Mar 8 · 14:50', +41.40),
  mkOrder('SOL/USDT','buy', 'Limit',       'filled',  8.0000,  171.5,  8.0000, 'Mar 8 · 11:33', +95.20),
  mkOrder('ARB/USDT','buy', 'Market',      'filled',  500.0,   1.21,   500.0,  'Mar 8 · 10:02', +32.00),
  mkOrder('BNB/USDT','sell','Limit',       'filled',  2.0000,  598,    2.0000, 'Mar 7 · 17:15', +7.40),
  mkOrder('BTC/USDT','buy', 'Limit',       'filled',  0.0350,  63_800, 0.0350, 'Mar 7 · 09:20', +126.35),
  mkOrder('ETH/USDT','buy', 'Stop-Limit',  'cancelled',0.5,    3_300,  0,      'Mar 6 · 14:11', null),
  mkOrder('SOL/USDT','sell','Market',      'filled',  12.000,  188.40, 12.000, 'Mar 6 · 11:05', +84.60),
  mkOrder('OP/USDT', 'buy', 'Limit',       'filled',  200.0,   2.60,   200.0,  'Mar 5 · 15:30', +58.20),
]

const PAIRS_OPTS = ['All','BTC/USDT','ETH/USDT','SOL/USDT','BNB/USDT','ARB/USDT','OP/USDT']
const SIDE_OPTS  = ['All','Buy','Sell']
const TYPE_OPTS  = ['All','Limit','Market','Stop-Limit','Stop-Market']
const STATUS_OPTS_FULL = ['All','Open','Partial','Filled','Cancelled']
const STATUS_OPTS_OPEN = ['All','Open','Partial']

const STATUS_META = {
  open:      { color:'#00FFD1', bg:'rgba(0,255,209,.1)',    Icon: Circle,       label:'Open'      },
  partial:   { color:'#FFB800', bg:'rgba(255,184,0,.1)',    Icon: Hourglass,    label:'Partial'   },
  filled:    { color:'#00C076', bg:'rgba(0,192,118,.1)',    Icon: CheckCircle,  label:'Filled'    },
  cancelled: { color:'rgba(255,255,255,.28)', bg:'rgba(255,255,255,.05)', Icon: XCircle, label:'Cancelled' },
}

const PAIR_COLORS = {
  'BTC/USDT':'#F7931A','ETH/USDT':'#627EEA','SOL/USDT':'#9945FF',
  'BNB/USDT':'#F3BA2F','ARB/USDT':'#12AAFF','OP/USDT':'#FF0420',
}

/* Summary stats */
function calcStats(orders) {
  const filled     = orders.filter(o => o.status === 'filled')
  const winners    = filled.filter(o => (o.pnl ?? 0) > 0)
  const totalPnl   = filled.reduce((s, o) => s + (o.pnl ?? 0), 0)
  const totalFees  = filled.reduce((s, o) => s + o.fee, 0)
  const winRate    = filled.length > 0 ? (winners.length / filled.length) * 100 : 0
  const totalVol   = filled.reduce((s, o) => s + o.price * o.filledQty, 0)
  return { totalPnl, totalFees, winRate, totalVol, filledCount: filled.length }
}

/* ════════════════════════════════════════════════════════
   COMPONENTS
════════════════════════════════════════════════════════ */

function StatusBadge({ status }) {
  const m = STATUS_META[status] ?? STATUS_META.open
  return (
    <span className="od-status-badge"
      style={{ color: m.color, background: m.bg }}>
      <m.Icon size={8} weight="fill" />{m.label}
    </span>
  )
}

function FillBar({ pct }) {
  if (pct === 0) return <span className="od-fill-zero">—</span>
  return (
    <div className="od-fill-bar-wrap">
      <div className="od-fill-track">
        <div className="od-fill-fill"
          style={{
            width: `${pct}%`,
            background: pct >= 100 ? '#00C076' : '#FFB800',
          }} />
      </div>
      <span className="od-fill-pct">{pct.toFixed(0)}%</span>
    </div>
  )
}

function SortHeader({ label, field, sortField, sortDir, onSort }) {
  const isActive = sortField === field
  return (
    <button className={`od-th-btn ${isActive ? 'active' : ''}`} onClick={() => onSort(field)}>
      {label}
      {isActive
        ? sortDir === 'asc'
          ? <CaretUp size={9} weight="bold" />
          : <CaretDown size={9} weight="bold" />
        : <CaretUpDown size={9} weight="bold" style={{ opacity:.4 }} />
      }
    </button>
  )
}

/* ════════════════════════════════════════════════════════
   OPEN ORDERS TAB
════════════════════════════════════════════════════════ */
function OpenOrdersTab({ orders, onCancel }) {
  const [pairF, setPairF]   = useState('All')
  const [sideF, setSideF]   = useState('All')
  const [typeF, setTypeF]   = useState('All')
  const [statusF, setStatusF] = useState('All')
  const [sort, setSort]     = useState({ field:'ts', dir:'desc' })

  const handleSort = f => setSort(s => ({ field: f, dir: s.field === f && s.dir === 'desc' ? 'asc' : 'desc' }))

  const visible = useMemo(() => {
    let rows = orders.filter(o => ['open','partial'].includes(o.status))
    if (pairF !== 'All')   rows = rows.filter(o => o.sym === pairF)
    if (sideF !== 'All')   rows = rows.filter(o => o.side === sideF.toLowerCase())
    if (typeF !== 'All')   rows = rows.filter(o => o.type === typeF)
    if (statusF !== 'All') rows = rows.filter(o => o.status === statusF.toLowerCase())
    rows = [...rows].sort((a,b) => {
      const av = sort.field === 'ts' ? a.ts : a[sort.field]
      const bv = sort.field === 'ts' ? b.ts : b[sort.field]
      const r = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return sort.dir === 'asc' ? r : -r
    })
    return rows
  }, [orders, pairF, sideF, typeF, statusF, sort])

  return (
    <div className="od-tab-content">
      {/* Filters */}
      <div className="od-filter-bar">
        {[
          { label:'Pair',   opts:PAIRS_OPTS,      val:pairF,   set:setPairF   },
          { label:'Side',   opts:SIDE_OPTS,        val:sideF,   set:setSideF   },
          { label:'Type',   opts:TYPE_OPTS,        val:typeF,   set:setTypeF   },
          { label:'Status', opts:STATUS_OPTS_OPEN, val:statusF, set:setStatusF },
        ].map(f => (
          <div key={f.label} className="od-filter-group">
            <span className="od-filter-lbl">{f.label}</span>
            <div className="od-sel-wrap">
              <select className="od-select" value={f.val} onChange={e => f.set(e.target.value)}>
                {f.opts.map(o => <option key={o}>{o}</option>)}
              </select>
              <CaretDown size={9} className="od-sel-arr" />
            </div>
          </div>
        ))}
        <div className="od-filter-spacer" />
        {visible.length > 0 && (
          <button className="od-cancel-all-btn" onClick={() => visible.forEach(o => onCancel(o.id))}>
            <X size={10} weight="bold" />Cancel all ({visible.length})
          </button>
        )}
      </div>

      {/* Table */}
      {visible.length === 0 ? (
        <div className="od-empty">
          <ListBullets size={28} weight="duotone" />
          <span>No open orders match the current filters</span>
        </div>
      ) : (
        <div className="od-table-wrap">
          <table className="od-table">
            <thead>
              <tr>
                <th><SortHeader label="Order ID" field="id" sortField={sort.field} sortDir={sort.dir} onSort={handleSort}/></th>
                <th><SortHeader label="Symbol" field="sym" sortField={sort.field} sortDir={sort.dir} onSort={handleSort}/></th>
                <th>Type</th>
                <th><SortHeader label="Side" field="side" sortField={sort.field} sortDir={sort.dir} onSort={handleSort}/></th>
                <th><SortHeader label="Price" field="price" sortField={sort.field} sortDir={sort.dir} onSort={handleSort}/></th>
                <th>Qty</th>
                <th>Filled</th>
                <th>Status</th>
                <th><SortHeader label="Time" field="ts" sortField={sort.field} sortDir={sort.dir} onSort={handleSort}/></th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(o => (
                <tr key={o.id} className="od-tr">
                  <td><span className="od-id">{o.id}</span></td>
                  <td>
                    <span className="od-sym"
                      style={{ '--sc': PAIR_COLORS[o.sym] ?? '#00FFD1' }}>
                      <span className="od-sym-dot" />
                      {o.sym}
                    </span>
                  </td>
                  <td><span className="od-type">{o.type}</span></td>
                  <td>
                    <span className={`od-side od-side-${o.side}`}>
                      {o.side === 'buy' ? <TrendUp size={9} weight="bold"/> : <TrendDown size={9} weight="bold"/>}
                      {o.side.charAt(0).toUpperCase() + o.side.slice(1)}
                    </span>
                  </td>
                  <td><span className="od-num">{o.price.toLocaleString('en-US', {minimumFractionDigits:2})}</span></td>
                  <td><span className="od-num">{o.qty.toFixed(4)}</span></td>
                  <td><FillBar pct={o.filledPct} /></td>
                  <td><StatusBadge status={o.status} /></td>
                  <td><span className="od-ts">{o.ts}</span></td>
                  <td>
                    <button className="od-cancel-btn" onClick={() => onCancel(o.id)}>
                      <X size={9} weight="bold" />Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   ORDER HISTORY TAB
════════════════════════════════════════════════════════ */
function OrderHistoryTab({ orders }) {
  const [pairF,   setPairF]   = useState('All')
  const [sideF,   setSideF]   = useState('All')
  const [typeF,   setTypeF]   = useState('All')
  const [statusF, setStatusF] = useState('All')
  const [search,  setSearch]  = useState('')
  const [sort,    setSort]    = useState({ field:'ts', dir:'desc' })

  const handleSort = f => setSort(s => ({ field: f, dir: s.field === f && s.dir === 'desc' ? 'asc' : 'desc' }))

  const visible = useMemo(() => {
    let rows = orders.filter(o => ['filled','cancelled'].includes(o.status))
    if (pairF !== 'All')   rows = rows.filter(o => o.sym === pairF)
    if (sideF !== 'All')   rows = rows.filter(o => o.side === sideF.toLowerCase())
    if (typeF !== 'All')   rows = rows.filter(o => o.type === typeF)
    if (statusF !== 'All') rows = rows.filter(o => o.status === statusF.toLowerCase())
    if (search)            rows = rows.filter(o => o.sym.includes(search.toUpperCase()) || o.id.includes(search.toUpperCase()))
    rows = [...rows].sort((a,b) => {
      const av = a[sort.field], bv = b[sort.field]
      const r = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return sort.dir === 'asc' ? r : -r
    })
    return rows
  }, [orders, pairF, sideF, typeF, statusF, search, sort])

  const stats = useMemo(() => calcStats(visible), [visible])

  return (
    <div className="od-tab-content">
      {/* Stats row */}
      <div className="od-hist-stats">
        {[
          { label:'Realized PnL', val: (stats.totalPnl >= 0 ? '+' : '') + stats.totalPnl.toFixed(2) + ' USDT',
            color: stats.totalPnl >= 0 ? '#00C076' : '#FF3D57', Icon: stats.totalPnl >= 0 ? TrendUp : TrendDown },
          { label:'Win Rate',     val: stats.filledCount > 0 ? stats.winRate.toFixed(1) + '%' : '—',
            color: stats.winRate >= 50 ? '#00C076' : '#FF3D57', Icon: ChartLine },
          { label:'Total Volume', val: stats.totalVol >= 1000 ? `$${(stats.totalVol/1000).toFixed(1)}K` : `$${stats.totalVol.toFixed(0)}`,
            color: 'var(--cy-neon,#00FFD1)', Icon: ArrowRight },
          { label:'Fees Paid',    val: stats.totalFees.toFixed(4) + ' USDT',
            color: '#FFB800', Icon: MinusIcon },
          { label:'Filled Orders',val: String(stats.filledCount),
            color: '#00C076', Icon: CheckCircle },
        ].map(s => (
          <div key={s.label} className="od-stat-card">
            <div className="od-stat-ico" style={{ color: s.color, background:`${s.color.replace('var(--cy-neon,','').replace(')','') || s.color}18` }}>
              <s.Icon size={13} weight="duotone" />
            </div>
            <div>
              <div className="od-stat-val" style={{ color: s.color }}>{s.val}</div>
              <div className="od-stat-lbl">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="od-filter-bar">
        <div className="od-search-wrap">
          <MagnifyingGlass size={12} className="od-search-ico" />
          <input className="od-search-input" placeholder="Search symbol or ID…"
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="od-search-clear" onClick={() => setSearch('')}><X size={9} weight="bold" /></button>}
        </div>
        {[
          { label:'Pair',   opts:PAIRS_OPTS,      val:pairF,   set:setPairF   },
          { label:'Side',   opts:SIDE_OPTS,        val:sideF,   set:setSideF   },
          { label:'Type',   opts:TYPE_OPTS,        val:typeF,   set:setTypeF   },
          { label:'Status', opts:['All','Filled','Cancelled'], val:statusF, set:setStatusF },
        ].map(f => (
          <div key={f.label} className="od-filter-group">
            <span className="od-filter-lbl">{f.label}</span>
            <div className="od-sel-wrap">
              <select className="od-select" value={f.val} onChange={e => f.set(e.target.value)}>
                {f.opts.map(o => <option key={o}>{o}</option>)}
              </select>
              <CaretDown size={9} className="od-sel-arr" />
            </div>
          </div>
        ))}
        <div className="od-filter-spacer" />
        <button className="od-export-btn"><Download size={11} weight="bold" />Export CSV</button>
      </div>

      {/* Table */}
      {visible.length === 0 ? (
        <div className="od-empty">
          <Clock size={28} weight="duotone" />
          <span>No orders match the current filters</span>
        </div>
      ) : (
        <div className="od-table-wrap">
          <table className="od-table">
            <thead>
              <tr>
                <th><SortHeader label="Order ID" field="id" sortField={sort.field} sortDir={sort.dir} onSort={handleSort}/></th>
                <th><SortHeader label="Symbol" field="sym" sortField={sort.field} sortDir={sort.dir} onSort={handleSort}/></th>
                <th>Type</th>
                <th><SortHeader label="Side" field="side" sortField={sort.field} sortDir={sort.dir} onSort={handleSort}/></th>
                <th><SortHeader label="Price" field="price" sortField={sort.field} sortDir={sort.dir} onSort={handleSort}/></th>
                <th><SortHeader label="Qty" field="qty" sortField={sort.field} sortDir={sort.dir} onSort={handleSort}/></th>
                <th>Filled</th>
                <th><SortHeader label="PnL" field="pnl" sortField={sort.field} sortDir={sort.dir} onSort={handleSort}/></th>
                <th>Fee</th>
                <th>Status</th>
                <th><SortHeader label="Time" field="ts" sortField={sort.field} sortDir={sort.dir} onSort={handleSort}/></th>
              </tr>
            </thead>
            <tbody>
              {visible.map(o => (
                <tr key={o.id} className={`od-tr od-tr-${o.status}`}>
                  <td><span className="od-id">{o.id}</span></td>
                  <td>
                    <span className="od-sym" style={{ '--sc': PAIR_COLORS[o.sym] ?? '#00FFD1' }}>
                      <span className="od-sym-dot" />{o.sym}
                    </span>
                  </td>
                  <td><span className="od-type">{o.type}</span></td>
                  <td>
                    <span className={`od-side od-side-${o.side}`}>
                      {o.side === 'buy' ? <TrendUp size={9} weight="bold"/> : <TrendDown size={9} weight="bold"/>}
                      {o.side.charAt(0).toUpperCase() + o.side.slice(1)}
                    </span>
                  </td>
                  <td><span className="od-num">{o.price.toLocaleString('en-US',{minimumFractionDigits:2})}</span></td>
                  <td><span className="od-num">{o.qty.toFixed(4)}</span></td>
                  <td><FillBar pct={o.filledPct} /></td>
                  <td>
                    {o.pnl != null
                      ? <span className={`od-pnl ${o.pnl >= 0 ? 'pos' : 'neg'}`}>
                          {o.pnl >= 0 ? '+' : ''}{o.pnl.toFixed(2)}
                        </span>
                      : <span className="od-fill-zero">—</span>
                    }
                  </td>
                  <td><span className="od-fee">{o.fee.toFixed(4)}</span></td>
                  <td><StatusBadge status={o.status} /></td>
                  <td><span className="od-ts">{o.ts}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   ROOT
════════════════════════════════════════════════════════ */
export default function Orders() {
  useOutletContext?.()
  const navigate = useNavigate()
  const [tab,    setTab]    = useState('open')
  const [orders, setOrders] = useState([])        // start empty — no mock fallback
  const [loading, setLoading] = useState(true)

  // Fetch live orders — new users see clean empty state
  useEffect(() => {
    apiGet('/api/orders?limit=100')
      .then(data => {
        setOrders(Array.isArray(data.orders) ? data.orders : [])
      })
      .catch(() => { setOrders([]) })
      .finally(() => setLoading(false))
  }, [])

  const cancelOrder = async id => {
    try {
      await apiDelete(`/api/orders/${id}`)
      // Optimistically update local state
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelled' } : o))
    } catch {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelled' } : o))
    }
  }

  const openOrders  = orders.filter(o => ['open','partial'].includes(o.status))
  const histOrders  = orders.filter(o => ['filled','cancelled'].includes(o.status))
  const stats       = useMemo(() => calcStats(orders), [orders])

  // Show loading state while fetching
  if (loading) {
    return (
      <div className="od-root" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:400 }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, color:'var(--vlt-text-muted)' }}>
          <ArrowClockwise size={28} weight='duotone' style={{ animation:'spin 0.8s linear infinite', opacity:0.5 }}/>
          <span style={{ fontFamily:'Inter,sans-serif', fontSize:13 }}>Loading orders…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="od-root">

      {/* ─── PAGE HEADER ─── */}
      <div className="od-page-head">
        <div className="od-head-left">
          <div className="od-head-ico"><ListBullets size={16} weight="fill" /></div>
          <div>
            <h1 className="od-page-title">Orders</h1>
            <p className="od-page-sub">Manage open orders, view history, and track performance</p>
          </div>
        </div>

        <div className="od-head-actions">
          <button className="od-head-btn" onClick={() => {
            setLoading(true)
            apiGet('/api/orders?limit=100')
              .then(data => setOrders(Array.isArray(data.orders) ? data.orders : []))
              .catch(() => setOrders([]))
              .finally(() => setLoading(false))
          }}>
            <ArrowClockwise size={12} weight="bold" />Refresh
          </button>
          <button className="od-head-btn primary" onClick={() => navigate('../trade')}>
            <Lightning size={12} weight="bold" />New Order
          </button>
        </div>

        <nav className="od-bc">
          <span>Dashboard</span><CaretRight size={9} /><span className="od-bc-cur">Orders</span>
        </nav>
      </div>

      {/* ─── SUMMARY CARDS ─── */}
      <div className="od-summary">
        <div className="od-sum-card">
          <div className="od-sum-top">
            <span className="od-sum-lbl">Total Realized PnL</span>
            <TrendUp size={13} weight="duotone" style={{ color: stats.totalPnl >= 0 ? '#00C076' : '#FF3D57' }} />
          </div>
          <div className="od-sum-val" style={{ color: stats.totalPnl >= 0 ? '#00C076' : '#FF3D57' }}>
            {stats.totalPnl >= 0 ? '+' : ''}{stats.totalPnl.toFixed(2)}
            <span className="od-sum-unit">USDT</span>
          </div>
          <div className="od-sum-bar">
            <div className="od-sum-fill"
              style={{
                width: '100%',
                background: stats.totalPnl >= 0
                  ? 'linear-gradient(90deg,rgba(0,192,118,.35),rgba(0,192,118,.05))'
                  : 'linear-gradient(90deg,rgba(255,61,87,.35),rgba(255,61,87,.05))',
              }} />
          </div>
        </div>

        <div className="od-sum-card">
          <div className="od-sum-top">
            <span className="od-sum-lbl">Win Rate</span>
            <ChartLine size={13} weight="duotone" style={{ color: stats.winRate >= 50 ? '#00C076' : '#FF3D57' }} />
          </div>
          <div className="od-sum-val" style={{ color: stats.winRate >= 50 ? '#00C076' : '#FF3D57' }}>
            {stats.filledCount > 0 ? stats.winRate.toFixed(1) : '—'}
            <span className="od-sum-unit">{stats.filledCount > 0 ? '%' : ''}</span>
          </div>
          <div className="od-sum-bar">
            <div className="od-sum-fill"
              style={{
                width: `${stats.winRate}%`,
                background: stats.winRate >= 50
                  ? 'linear-gradient(90deg,rgba(0,192,118,.4),rgba(0,192,118,.05))'
                  : 'linear-gradient(90deg,rgba(255,61,87,.4),rgba(255,61,87,.05))',
              }} />
          </div>
        </div>

        <div className="od-sum-card">
          <div className="od-sum-top">
            <span className="od-sum-lbl">Open Orders</span>
            <Circle size={13} weight="fill" style={{ color:'var(--cy-neon,#00FFD1)' }} />
          </div>
          <div className="od-sum-val" style={{ color:'var(--cy-neon,#00FFD1)' }}>
            {openOrders.length}
            <span className="od-sum-unit">active</span>
          </div>
          <div className="od-sum-bar">
            <div className="od-sum-fill" style={{ width:`${Math.min(100,(openOrders.length/10)*100)}%`, background:'linear-gradient(90deg,rgba(0,255,209,.3),rgba(0,255,209,.05))' }} />
          </div>
        </div>

        <div className="od-sum-card">
          <div className="od-sum-top">
            <span className="od-sum-lbl">Total Volume</span>
            <ArrowRight size={13} weight="duotone" style={{ color:'#1A56FF' }} />
          </div>
          <div className="od-sum-val" style={{ color:'#1A56FF' }}>
            {stats.totalVol >= 1000 ? `$${(stats.totalVol/1000).toFixed(1)}K` : `$${stats.totalVol.toFixed(0)}`}
            <span className="od-sum-unit">USDT</span>
          </div>
          <div className="od-sum-bar">
            <div className="od-sum-fill" style={{ width:'72%', background:'linear-gradient(90deg,rgba(26,86,255,.35),rgba(26,86,255,.05))' }} />
          </div>
        </div>

        <div className="od-sum-card">
          <div className="od-sum-top">
            <span className="od-sum-lbl">Fees Paid</span>
            <MinusIcon size={13} weight="bold" style={{ color:'#FFB800' }} />
          </div>
          <div className="od-sum-val" style={{ color:'#FFB800' }}>
            {stats.totalFees.toFixed(2)}
            <span className="od-sum-unit">USDT</span>
          </div>
          <div className="od-sum-bar">
            <div className="od-sum-fill" style={{ width:'30%', background:'linear-gradient(90deg,rgba(255,184,0,.3),rgba(255,184,0,.05))' }} />
          </div>
        </div>
      </div>

      {/* ─── TABS ─── */}
      <div className="od-panel">
        <div className="od-tabs">
          <button className={`od-tab ${tab === 'open' ? 'on' : ''}`} onClick={() => setTab('open')}>
            Open Orders
            <span className="od-tab-badge">{openOrders.length}</span>
          </button>
          <button className={`od-tab ${tab === 'history' ? 'on' : ''}`} onClick={() => setTab('history')}>
            Order History
            <span className="od-tab-badge od-tab-badge-dim">{histOrders.length}</span>
          </button>
        </div>

        {tab === 'open'    && <OpenOrdersTab   orders={orders} onCancel={cancelOrder} />}
        {tab === 'history' && <OrderHistoryTab orders={orders} />}
      </div>
    </div>
  )
}
