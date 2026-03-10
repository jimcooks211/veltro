import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import {
  CaretRight, CaretUp, CaretDown, ArrowsLeftRight,
  ChartLine, X, ArrowClockwise, Gear, Info,
  TrendUp, TrendDown, Lightning,
} from '@phosphor-icons/react'
import './Trade.css'

/* ════════════════════════════════════════════════════════
   DATA LAYER
════════════════════════════════════════════════════════ */
const PAIRS = [
  { sym:'BTC/USDT', base:'BTC', quote:'USDT', price:67_423.50, chg:+2.34,  vol:'$2.14B', high:68_200, low:65_800, color:'#F7931A', mark:'₿' },
  { sym:'ETH/USDT', base:'ETH', quote:'USDT', price: 3_521.80, chg:-0.87,  vol:'$980M',  high: 3_610, low: 3_481, color:'#627EEA', mark:'Ξ' },
  { sym:'SOL/USDT', base:'SOL', quote:'USDT', price:   183.42, chg:+5.12,  vol:'$428M',  high:   188, low:   175, color:'#9945FF', mark:'◎' },
  { sym:'BNB/USDT', base:'BNB', quote:'USDT', price:   594.30, chg:+1.21,  vol:'$312M',  high:   601, low:   585, color:'#F3BA2F', mark:'B' },
  { sym:'ARB/USDT', base:'ARB', quote:'USDT', price:     1.284,chg:-2.44,  vol:'$181M',  high:  1.34, low:  1.24, color:'#12AAFF', mark:'A' },
  { sym:'OP/USDT',  base:'OP',  quote:'USDT', price:     2.891,chg:+3.77,  vol:'$97M',   high:  2.96, low:  2.73, color:'#FF0420', mark:'O' },
]

const ORDER_TYPES = ['Limit','Market','Stop-Limit','Stop-Market']

function fmtPx(n, price) {
  return n?.toLocaleString('en-US', {
    minimumFractionDigits: price > 10 ? 2 : 5,
    maximumFractionDigits: price > 10 ? 2 : 5,
  }) ?? '—'
}

function genChartData(base, pts = 90) {
  let p = base * 0.985
  return Array.from({ length: pts }, (_, i) => {
    p += (Math.random() - 0.47) * p * 0.003
    p  = Math.max(base * 0.97, Math.min(base * 1.03, p))
    return { i, v: +p.toFixed(base > 10 ? 2 : 5) }
  })
}

function genBook(mid, side) {
  const spread = mid * 0.00025
  return Array.from({ length: 16 }, (_, i) => {
    const off = spread + i * spread * 0.6
    const px  = side === 'ask' ? mid + off : mid - off
    const qty = +(Math.random() * 3 + 0.05).toFixed(4)
    return { px: +(px).toFixed(mid > 10 ? 2 : 5), qty }
  })
}

function genRecentTrades(mid, n = 22) {
  return Array.from({ length: n }, (_, i) => {
    const side = Math.random() > 0.5 ? 'buy' : 'sell'
    const px   = mid * (1 + (Math.random() - 0.5) * 0.0008)
    const now  = new Date()
    now.setSeconds(now.getSeconds() - i * 4)
    return {
      id: i, side,
      px: +(px.toFixed(mid > 10 ? 2 : 5)),
      qty: +(Math.random() * 1.5 + 0.002).toFixed(4),
      ts: now.toTimeString().slice(0, 8),
    }
  })
}

const MOCK_POSITIONS = [
  { id:1, sym:'BTC/USDT', side:'long',  size:0.0842, entry:64_200, mark:67_423, roe:+5.02, pnl:+271.30, liq:58_000, margin:540.24 },
  { id:2, sym:'ETH/USDT', side:'short', size:1.2400, entry: 3_580, mark: 3_521, roe:+2.04, pnl:+73.16,  liq: 3_920, margin:443.92 },
]

const MOCK_OPEN_ORDERS = [
  { id:'vo-001', sym:'BTC/USDT', type:'Limit', side:'buy',  qty:0.05,  price:65_000, filled:0,    ts:'14:22:11', status:'open'     },
  { id:'vo-002', sym:'ETH/USDT', type:'Limit', side:'sell', qty:0.8,   price: 3_650, filled:0.34, ts:'09:44:05', status:'partial'  },
  { id:'vo-003', sym:'SOL/USDT', type:'Stop-Limit', side:'sell', qty:5, price: 175,  filled:0,    ts:'11:03:28', status:'open'     },
]

/* ════════════════════════════════════════════════════════
   CHART TOOLTIP
════════════════════════════════════════════════════════ */
function ChartTooltip({ active, payload, price }) {
  if (!active || !payload?.length) return null
  const v = payload[0]?.value
  return (
    <div className="tr-tip">
      <span className="tr-tip-val">{fmtPx(v, price)}</span>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   ORDER BOOK
════════════════════════════════════════════════════════ */
function OrderBook({ asks, bids, mid, pair }) {
  const maxQ = useMemo(() =>
    Math.max(...asks.map(r => r.qty), ...bids.map(r => r.qty)), [asks, bids])

  const spread = asks[asks.length - 1]?.px && bids[0]?.px
    ? (asks[asks.length - 1].px - bids[0].px).toFixed(pair.price > 10 ? 2 : 5)
    : '—'

  return (
    <div className="tr-book">
      <div className="tr-book-cols">
        <span>Price (USDT)</span>
        <span>Qty ({pair.base})</span>
        <span>Total</span>
      </div>
      <div className="tr-asks-list">
        {[...asks].reverse().slice(0, 10).map((r, i) => (
          <div key={i} className="tr-book-row">
            <div className="tr-depth-bar tr-depth-ask"
              style={{ width:`${(r.qty / maxQ) * 100}%` }} />
            <span className="tr-book-px tr-ask-px">{fmtPx(r.px, pair.price)}</span>
            <span className="tr-book-qty">{r.qty.toFixed(4)}</span>
            <span className="tr-book-total">{(r.px * r.qty).toFixed(0)}</span>
          </div>
        ))}
      </div>
      <div className="tr-book-mid">
        <span className="tr-book-mid-px" style={{ color: pair.chg >= 0 ? '#00C076' : '#FF3D57' }}>
          {fmtPx(mid, pair.price)}
          {pair.chg >= 0
            ? <CaretUp  size={11} weight="fill" style={{ color:'#00C076' }} />
            : <CaretDown size={11} weight="fill" style={{ color:'#FF3D57' }} />}
        </span>
        <span className="tr-book-spread">Spread {spread}</span>
      </div>
      <div className="tr-bids-list">
        {bids.slice(0, 10).map((r, i) => (
          <div key={i} className="tr-book-row">
            <div className="tr-depth-bar tr-depth-bid"
              style={{ width:`${(r.qty / maxQ) * 100}%` }} />
            <span className="tr-book-px tr-bid-px">{fmtPx(r.px, pair.price)}</span>
            <span className="tr-book-qty">{r.qty.toFixed(4)}</span>
            <span className="tr-book-total">{(r.px * r.qty).toFixed(0)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   RECENT TRADES
════════════════════════════════════════════════════════ */
function RecentTrades({ trades, pair }) {
  return (
    <div className="tr-recent">
      <div className="tr-recent-cols">
        <span>Price (USDT)</span>
        <span>Qty ({pair.base})</span>
        <span>Time</span>
      </div>
      <div className="tr-recent-list">
        {trades.map(t => (
          <div key={t.id} className={`tr-recent-row ${t.side}`}>
            <span className={`tr-recent-px ${t.side}`}>{fmtPx(t.px, pair.price)}</span>
            <span className="tr-recent-qty">{t.qty.toFixed(4)}</span>
            <span className="tr-recent-ts">{t.ts}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   ORDER FORM
════════════════════════════════════════════════════════ */
function OrderForm({ pair, livePrice }) {
  const [side,   setSide]   = useState('buy')
  const [otype,  setOtype]  = useState('Limit')
  const [price,  setPrice]  = useState(String(livePrice))
  const [amount, setAmount] = useState('')
  const [stopPx, setStopPx] = useState('')
  const [tpsl,   setTpsl]   = useState(false)
  const [tp, setTp] = useState('')
  const [sl, setSl] = useState('')

  const BALANCE_USDT = 12_450.38
  const BALANCE_BASE = 0

  const isLimit = otype === 'Limit' || otype === 'Stop-Limit'
  const isStop  = otype.startsWith('Stop')
  const numAmt  = parseFloat(amount) || 0
  const numPx   = parseFloat(price)  || livePrice
  const total   = +(numAmt * numPx).toFixed(2)
  const fee     = +(total * 0.001).toFixed(4)
  const usedPct = Math.min(100, (total / BALANCE_USDT) * 100)

  const applyPct = p => {
    const t = (side === 'buy' ? BALANCE_USDT : BALANCE_BASE * numPx) * (p / 100)
    setAmount((t / numPx).toFixed(6))
  }

  const canSubmit = numAmt > 0 && numPx > 0

  return (
    <div className="tr-form">
      {/* Side switch */}
      <div className="tr-side-tabs">
        <button className={`tr-side-tab buy ${side === 'buy' ? 'on' : ''}`}
          onClick={() => setSide('buy')}>
          <TrendUp size={12} weight="bold" />Buy / Long
        </button>
        <button className={`tr-side-tab sell ${side === 'sell' ? 'on' : ''}`}
          onClick={() => setSide('sell')}>
          <TrendDown size={12} weight="bold" />Sell / Short
        </button>
      </div>

      {/* Order types */}
      <div className="tr-otype-row">
        {ORDER_TYPES.map(t => (
          <button key={t}
            className={`tr-otype-btn ${otype === t ? 'on' : ''} otype-${side}`}
            onClick={() => setOtype(t)}>{t}</button>
        ))}
      </div>

      {/* Balance display */}
      <div className="tr-balance-row">
        <span className="tr-bal-lbl">Available</span>
        <span className="tr-bal-val">
          {side === 'buy'
            ? BALANCE_USDT.toLocaleString('en-US', { minimumFractionDigits: 2 }) + ' USDT'
            : BALANCE_BASE.toFixed(6) + ' ' + pair.base}
        </span>
      </div>

      {/* Stop price */}
      {isStop && (
        <div className="tr-input-group">
          <label className="tr-input-label">Stop Price</label>
          <div className="tr-input-shell">
            <input className="tr-input" type="number" placeholder="0.00"
              value={stopPx} onChange={e => setStopPx(e.target.value)} />
            <span className="tr-input-unit">USDT</span>
          </div>
        </div>
      )}

      {/* Limit price */}
      {isLimit && (
        <div className="tr-input-group">
          <label className="tr-input-label">Price</label>
          <div className="tr-input-shell">
            <input className="tr-input" type="number"
              value={price} onChange={e => setPrice(e.target.value)} />
            <span className="tr-input-unit">USDT</span>
          </div>
        </div>
      )}

      {/* Amount */}
      <div className="tr-input-group">
        <label className="tr-input-label">Amount</label>
        <div className="tr-input-shell">
          <input className="tr-input" type="number" placeholder="0.000000"
            value={amount} onChange={e => setAmount(e.target.value)} />
          <span className="tr-input-unit">{pair.base}</span>
        </div>
        <div className="tr-pct-row">
          {[25, 50, 75, 100].map(p => (
            <button key={p} className="tr-pct-btn" onClick={() => applyPct(p)}>{p}%</button>
          ))}
        </div>
      </div>

      {/* Slider allocation bar */}
      <div className="tr-alloc">
        <div className="tr-alloc-track">
          <div className="tr-alloc-fill"
            style={{
              width: `${usedPct}%`,
              background: side === 'buy' ? '#00C076' : '#FF3D57',
            }} />
          <div className="tr-alloc-knob"
            style={{
              left: `${usedPct}%`,
              borderColor: side === 'buy' ? '#00C076' : '#FF3D57',
            }} />
        </div>
        <span className="tr-alloc-pct"
          style={{ color: side === 'buy' ? '#00C076' : '#FF3D57' }}>
          {usedPct.toFixed(0)}%
        </span>
      </div>

      {/* Summary calc */}
      <div className="tr-summary">
        <div className="tr-sum-row">
          <span>Total</span>
          <span>{total > 0 ? total.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'} USDT</span>
        </div>
        <div className="tr-sum-row">
          <span>Fee (0.10%)</span>
          <span>{fee > 0 ? fee.toFixed(4) : '—'} USDT</span>
        </div>
      </div>

      {/* TP/SL */}
      <button className={`tr-tpsl-row ${tpsl ? 'on' : ''}`} onClick={() => setTpsl(v => !v)}>
        <div className={`tr-tpsl-indicator ${tpsl ? 'on' : ''}`} />
        <span>Take Profit / Stop Loss</span>
        <div className="tr-tpsl-caret">{tpsl ? '−' : '+'}</div>
      </button>

      {tpsl && (
        <div className="tr-tpsl-panel">
          <div className="tr-input-group">
            <label className="tr-input-label tp">Take Profit</label>
            <div className="tr-input-shell">
              <input className="tr-input" type="number" placeholder="0.00"
                value={tp} onChange={e => setTp(e.target.value)} />
              <span className="tr-input-unit">USDT</span>
            </div>
          </div>
          <div className="tr-input-group">
            <label className="tr-input-label sl">Stop Loss</label>
            <div className="tr-input-shell">
              <input className="tr-input" type="number" placeholder="0.00"
                value={sl} onChange={e => setSl(e.target.value)} />
              <span className="tr-input-unit">USDT</span>
            </div>
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        className={`tr-submit-btn ${side}`}
        disabled={!canSubmit}
        onClick={() => { setAmount(''); setTp(''); setSl('') }}>
        {side === 'buy'
          ? <><TrendUp size={14} weight="bold" />Buy {pair.base}</>
          : <><TrendDown size={14} weight="bold" />Sell {pair.base}</>}
        {otype !== 'Market' && <span className="tr-submit-otype">{otype}</span>}
      </button>

      <div className="tr-form-note">
        <Info size={9} weight="fill" />Orders are subject to available balance and market conditions
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   BOTTOM PANEL — Positions + Open Orders
════════════════════════════════════════════════════════ */
function BottomPanel() {
  const [tab, setTab] = useState('positions')
  const [positions, setPositions] = useState(MOCK_POSITIONS)
  const [openOrders, setOpenOrders] = useState(MOCK_OPEN_ORDERS)

  return (
    <div className="tr-bottom">
      <div className="tr-bottom-tabs">
        {[
          { id:'positions',   label:'Positions',    badge: positions.length   },
          { id:'open',        label:'Open Orders',  badge: openOrders.length  },
          { id:'history',     label:'Trade History',badge: null               },
        ].map(t => (
          <button key={t.id}
            className={`tr-btab ${tab === t.id ? 'on' : ''}`}
            onClick={() => setTab(t.id)}>
            {t.label}
            {t.badge != null && <span className="tr-btab-badge">{t.badge}</span>}
          </button>
        ))}
      </div>

      <div className="tr-bottom-body">
        {tab === 'positions' && (
          <>
            {positions.length === 0 ? (
              <div className="tr-empty-state">No open positions</div>
            ) : (
              <div className="tr-pos-table">
                <div className="tr-pos-head">
                  <span>Symbol</span><span>Side</span><span>Size</span>
                  <span>Entry Price</span><span>Mark Price</span>
                  <span>Unrealized PnL</span><span>Liq. Price</span>
                  <span>Margin</span><span></span>
                </div>
                {positions.map(p => (
                  <div key={p.id} className={`tr-pos-row pos-${p.side}`}>
                    <span className="tr-pos-sym">{p.sym}</span>
                    <span className={`tr-pos-side side-${p.side}`}>
                      {p.side === 'long' ? '↑ Long' : '↓ Short'}
                    </span>
                    <span className="tr-pos-num">{p.size}</span>
                    <span className="tr-pos-num">{p.entry.toLocaleString()}</span>
                    <span className="tr-pos-num">{p.mark.toLocaleString()}</span>
                    <span className={`tr-pos-pnl ${p.pnl >= 0 ? 'pos' : 'neg'}`}>
                      {p.pnl >= 0 ? '+' : ''}{p.pnl.toFixed(2)} USDT
                      <em>({p.pnl >= 0 ? '+' : ''}{p.roe.toFixed(2)}%)</em>
                    </span>
                    <span className="tr-pos-num tr-liq">{p.liq.toLocaleString()}</span>
                    <span className="tr-pos-num">{p.margin.toFixed(2)}</span>
                    <button className="tr-pos-close-btn"
                      onClick={() => setPositions(pp => pp.filter(x => x.id !== p.id))}>
                      <X size={10} weight="bold" />Close
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'open' && (
          <>
            {openOrders.length === 0 ? (
              <div className="tr-empty-state">No open orders</div>
            ) : (
              <div className="tr-pos-table">
                <div className="tr-pos-head">
                  <span>Symbol</span><span>Type</span><span>Side</span>
                  <span>Price</span><span>Qty</span><span>Filled</span>
                  <span>Status</span><span>Time</span><span></span>
                </div>
                {openOrders.map(o => (
                  <div key={o.id} className="tr-pos-row">
                    <span className="tr-pos-sym">{o.sym}</span>
                    <span className="tr-pos-num">{o.type}</span>
                    <span className={`tr-pos-side side-${o.side}`}>
                      {o.side === 'buy' ? '↑ Buy' : '↓ Sell'}
                    </span>
                    <span className="tr-pos-num">{o.price.toLocaleString()}</span>
                    <span className="tr-pos-num">{o.qty}</span>
                    <span className="tr-pos-num">{o.filled} / {o.qty}</span>
                    <span className={`tr-order-status st-${o.status}`}>
                      {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                    </span>
                    <span className="tr-pos-num tr-time">{o.ts}</span>
                    <button className="tr-pos-close-btn"
                      onClick={() => setOpenOrders(oo => oo.filter(x => x.id !== o.id))}>
                      <X size={10} weight="bold" />Cancel
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'history' && (
          <div className="tr-empty-state">No trade history for today</div>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   ROOT
════════════════════════════════════════════════════════ */
export default function Trade() {
  useOutletContext?.()
  const [activePair,  setActivePair]  = useState(PAIRS[0])
  const [chartData,   setChartData]   = useState(() => genChartData(PAIRS[0].price))
  const [asks,        setAsks]        = useState(() => genBook(PAIRS[0].price, 'ask'))
  const [bids,        setBids]        = useState(() => genBook(PAIRS[0].price, 'bid'))
  const [recentTrades,setRecentTrades]= useState(() => genRecentTrades(PAIRS[0].price))
  const [livePrice,   setLivePrice]   = useState(PAIRS[0].price)
  const [priceDir,    setPriceDir]    = useState(null)
  const [chartTf,     setChartTf]     = useState('1H')
  const [rightPanel,  setRightPanel]  = useState('book')

  const prevRef = useRef(PAIRS[0].price)

  const switchPair = useCallback(p => {
    setActivePair(p)
    setChartData(genChartData(p.price))
    setAsks(genBook(p.price, 'ask'))
    setBids(genBook(p.price, 'bid'))
    setRecentTrades(genRecentTrades(p.price))
    setLivePrice(p.price)
    prevRef.current = p.price
  }, [])

  /* Price tick */
  useEffect(() => {
    const iv = setInterval(() => {
      setLivePrice(prev => {
        const next = Math.max(prev * 0.993, prev + (Math.random() - 0.488) * prev * 0.0007)
        const rounded = +next.toFixed(activePair.price > 10 ? 2 : 5)
        setPriceDir(rounded >= prevRef.current ? 'up' : 'dn')
        prevRef.current = rounded
        setTimeout(() => setPriceDir(null), 550)
        return rounded
      })
    }, 1200)
    return () => clearInterval(iv)
  }, [activePair])

  /* Book refresh */
  useEffect(() => {
    const iv = setInterval(() => {
      setAsks(genBook(livePrice, 'ask'))
      setBids(genBook(livePrice, 'bid'))
    }, 2000)
    return () => clearInterval(iv)
  }, [livePrice])

  const chartMin = useMemo(() => Math.min(...chartData.map(d => d.v)) * 0.9996, [chartData])
  const chartMax = useMemo(() => Math.max(...chartData.map(d => d.v)) * 1.0004, [chartData])
  const isGreen  = chartData[chartData.length - 1]?.v >= chartData[0]?.v

  return (
    <div className="tr-root">

      {/* ─── PAIR STRIP ─── */}
      <div className="tr-pair-strip">
        {PAIRS.map(p => (
          <button
            key={p.sym}
            className={`tr-pair-chip ${activePair.sym === p.sym ? 'active' : ''}`}
            style={{ '--pc': p.color }}
            onClick={() => switchPair(p)}>
            <span className="tr-pair-mark" style={{ color: p.color }}>{p.mark}</span>
            <span className="tr-pair-sym">{p.sym}</span>
            <span className={`tr-pair-chg ${p.chg >= 0 ? 'pos' : 'neg'}`}>
              {p.chg >= 0 ? '+' : ''}{p.chg.toFixed(2)}%
            </span>
          </button>
        ))}
      </div>

      {/* ─── TICKER ─── */}
      <div className="tr-ticker">
        <div className="tr-ticker-ident">
          <div className="tr-ticker-icon" style={{ background:`${activePair.color}18`, color: activePair.color }}>
            {activePair.mark}
          </div>
          <div>
            <div className="tr-ticker-sym">{activePair.sym}</div>
            <div className="tr-ticker-sub">Perpetual Futures</div>
          </div>
        </div>

        <div className={`tr-ticker-price ${priceDir ?? ''}`}>
          {fmtPx(livePrice, activePair.price)}
          {priceDir === 'up' && <CaretUp  size={13} weight="fill" className="tr-px-arrow up" />}
          {priceDir === 'dn' && <CaretDown size={13} weight="fill" className="tr-px-arrow dn" />}
        </div>

        <span className={`tr-ticker-chg ${activePair.chg >= 0 ? 'pos' : 'neg'}`}>
          {activePair.chg >= 0 ? '+' : ''}{activePair.chg.toFixed(2)}%
        </span>

        <div className="tr-ticker-stats">
          <div className="tr-stat-item"><span className="tr-stat-l">24h High</span><span className="tr-stat-v">{activePair.high.toLocaleString()}</span></div>
          <div className="tr-stat-sep" />
          <div className="tr-stat-item"><span className="tr-stat-l">24h Low</span><span className="tr-stat-v">{activePair.low.toLocaleString()}</span></div>
          <div className="tr-stat-sep" />
          <div className="tr-stat-item"><span className="tr-stat-l">24h Volume</span><span className="tr-stat-v">{activePair.vol}</span></div>
        </div>

        <nav className="tr-bc">
          <span>Dashboard</span>
          <CaretRight size={9} />
          <span className="tr-bc-cur">Trade</span>
        </nav>
      </div>

      {/* ─── MAIN LAYOUT ─── */}
      <div className="tr-main">

        {/* LEFT column — Chart + Book/Trades */}
        <div className="tr-col-left">

          {/* Chart */}
          <div className="tr-chart-card">
            <div className="tr-chart-toolbar">
              <div className="tr-tf-pills">
                {['1m','5m','15m','1H','4H','1D','1W'].map(tf => (
                  <button
                    key={tf}
                    className={`tr-tf-btn ${chartTf === tf ? 'on' : ''}`}
                    onClick={() => { setChartTf(tf); setChartData(genChartData(activePair.price)) }}>
                    {tf}
                  </button>
                ))}
              </div>
              <div className="tr-chart-actions">
                <button className="tr-chart-action"><ChartLine size={13} weight="duotone" /></button>
                <button className="tr-chart-action"><Gear size={13} weight="duotone" /></button>
                <button className="tr-chart-action"
                  onClick={() => setChartData(genChartData(activePair.price))}>
                  <ArrowClockwise size={13} weight="duotone" />
                </button>
              </div>
            </div>
            <div className="tr-chart-canvas">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top:10, right:2, bottom:0, left:0 }}>
                  <defs>
                    <linearGradient id="tr-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={isGreen ? '#00C076' : '#FF3D57'} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={isGreen ? '#00C076' : '#FF3D57'} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="i" hide />
                  <YAxis domain={[chartMin, chartMax]} hide />
                  <Tooltip content={<ChartTooltip price={activePair.price} />} />
                  <ReferenceLine
                    y={chartData[0]?.v}
                    stroke="rgba(255,255,255,0.07)"
                    strokeDasharray="4 3"
                  />
                  <Area
                    type="monotoneX"
                    dataKey="v"
                    stroke={isGreen ? '#00C076' : '#FF3D57'}
                    strokeWidth={1.5}
                    fill="url(#tr-grad)"
                    dot={false}
                    activeDot={{ r: 3, strokeWidth: 0, fill: isGreen ? '#00C076' : '#FF3D57' }}
                    animationDuration={350}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Order Book / Recent Trades */}
          <div className="tr-data-card">
            <div className="tr-data-tabs">
              <button
                className={`tr-data-tab ${rightPanel === 'book' ? 'on' : ''}`}
                onClick={() => setRightPanel('book')}>Order Book</button>
              <button
                className={`tr-data-tab ${rightPanel === 'trades' ? 'on' : ''}`}
                onClick={() => setRightPanel('trades')}>Recent Trades</button>
            </div>
            {rightPanel === 'book'
              ? <OrderBook asks={asks} bids={bids} mid={livePrice} pair={activePair} />
              : <RecentTrades trades={recentTrades} pair={activePair} />}
          </div>
        </div>

        {/* RIGHT column — Order Form */}
        <div className="tr-col-right">
          <OrderForm pair={activePair} livePrice={livePrice} />
        </div>
      </div>

      {/* ─── BOTTOM PANEL ─── */}
      <BottomPanel />
    </div>
  )
}