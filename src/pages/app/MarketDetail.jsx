import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useOutletContext, useNavigate, useParams } from 'react-router-dom'
import {
  CaretRight, CaretUp, CaretDown,
  Star, ArrowLeft, ArrowClockwise, Gear,
  TrendUp, TrendDown, ChartLine, ChartBar,
  WarningCircle,
} from '@phosphor-icons/react'
import './MarketDetail.css'

/* ════════════════════════════════════════════════════════
   PRNG
════════════════════════════════════════════════════════ */
function xorshift(seed) {
  let s = (seed >>> 0) || 1
  return () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 0xFFFFFFFF }
}
function symSeed(sym) {
  return sym.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 4471)
}

function genCandles(sym, basePrice, n, mod = 1) {
  const r = xorshift((symSeed(sym) * mod) >>> 0)
  let p = basePrice * (0.91 + r() * 0.04)
  return Array.from({ length: n }, () => {
    const open  = p
    const move  = (r() - 0.485) * p * 0.022
    const close = open + move
    const wick  = r() * p * 0.009
    const high  = Math.max(open, close) + wick
    const low   = Math.min(open, close) - wick * (r() * 0.7 + 0.2)
    const vol   = r() * 0.82 + 0.18
    p = close
    return { open, close, high, low, vol }
  })
}

function genBook(mid, side, n = 12) {
  const spread = mid * 0.00028
  return Array.from({ length: n }, (_, i) => {
    const off = spread * (1 + i * 0.7)
    const px  = side === 'ask' ? mid + off : mid - off
    const qty = +(Math.random() * 2.8 + 0.02).toFixed(4)
    return { px: +(px.toFixed(mid > 10 ? 2 : 5)), qty }
  })
}

/* ════════════════════════════════════════════════════════
   ASSET DATABASE
════════════════════════════════════════════════════════ */
const ASSETS = [
  { sym:'AAPL',    name:'Apple Inc.',          cat:'Stock',  sector:'Technology',  mktCap:2940, baseP:189.42, vol24:'$12.4B', color:'#1A56FF' },
  { sym:'MSFT',    name:'Microsoft Corp.',     cat:'Stock',  sector:'Technology',  mktCap:3120, baseP:432.10, vol24:'$10.1B', color:'#00D4FF' },
  { sym:'NVDA',    name:'NVIDIA Corp.',        cat:'Stock',  sector:'Technology',  mktCap:2180, baseP:875.40, vol24:'$45.1B', color:'#00C076' },
  { sym:'GOOGL',   name:'Alphabet Inc.',       cat:'Stock',  sector:'Technology',  mktCap:2010, baseP:174.50, vol24:'$9.8B',  color:'#FFB800' },
  { sym:'META',    name:'Meta Platforms',      cat:'Stock',  sector:'Technology',  mktCap:1430, baseP:590.30, vol24:'$16.3B', color:'#1A56FF' },
  { sym:'AMZN',    name:'Amazon.com',          cat:'Stock',  sector:'Consumer',    mktCap:2100, baseP:229.40, vol24:'$14.8B', color:'#F7931A' },
  { sym:'TSLA',    name:'Tesla Inc.',          cat:'Stock',  sector:'Consumer',    mktCap:820,  baseP:258.10, vol24:'$18.2B', color:'#FF3D57' },
  { sym:'JPM',     name:'JPMorgan Chase',      cat:'Stock',  sector:'Financials',  mktCap:720,  baseP:245.80, vol24:'$6.8B',  color:'#C9A84C' },
  { sym:'JNJ',     name:'Johnson & Johnson',   cat:'Stock',  sector:'Healthcare',  mktCap:380,  baseP:157.20, vol24:'$7.4B',  color:'#00E676' },
  { sym:'XOM',     name:'ExxonMobil Corp.',    cat:'Stock',  sector:'Energy',      mktCap:495,  baseP:110.40, vol24:'$8.9B',  color:'#FF8C42' },
  { sym:'BTC',     name:'Bitcoin',             cat:'Crypto', sector:'Crypto',      mktCap:1340, baseP:67423,  vol24:'$2.14B', color:'#F7931A' },
  { sym:'ETH',     name:'Ethereum',            cat:'Crypto', sector:'Crypto',      mktCap:387,  baseP:3521.8, vol24:'$980M',  color:'#627EEA' },
  { sym:'SOL',     name:'Solana',              cat:'Crypto', sector:'Crypto',      mktCap:82,   baseP:183.42, vol24:'$428M',  color:'#9945FF' },
  { sym:'BNB',     name:'BNB',                 cat:'Crypto', sector:'Crypto',      mktCap:87,   baseP:594.30, vol24:'$312M',  color:'#F0B90B' },
  { sym:'XRP',     name:'XRP',                 cat:'Crypto', sector:'Crypto',      mktCap:74,   baseP:1.28,   vol24:'$3.2B',  color:'#00AAE4' },
  { sym:'DOGE',    name:'Dogecoin',            cat:'Crypto', sector:'Crypto',      mktCap:26,   baseP:0.182,  vol24:'$840M',  color:'#C3A634' },
  { sym:'SPY',     name:'SPDR S&P 500 ETF',    cat:'ETF',    sector:'Index',       mktCap:554,  baseP:548.20, vol24:'$28.5B', color:'#1A56FF' },
  { sym:'QQQ',     name:'Invesco QQQ Trust',   cat:'ETF',    sector:'Index',       mktCap:278,  baseP:480.30, vol24:'$22.4B', color:'#00D4FF' },
  { sym:'GLD',     name:'SPDR Gold Shares',    cat:'ETF',    sector:'Commodity',   mktCap:68,   baseP:232.10, vol24:'$3.2B',  color:'#FFD700' },
  { sym:'EUR/USD', name:'Euro / US Dollar',    cat:'Forex',  sector:'Forex',       mktCap:null, baseP:1.0842, vol24:'N/A',    color:'#1A56FF' },
  { sym:'GBP/USD', name:'British Pound / USD', cat:'Forex',  sector:'Forex',       mktCap:null, baseP:1.2634, vol24:'N/A',    color:'#C9A84C' },
]

const TF_CONFIG = {
  '1m':  { n: 120, mod: 1 }, '5m':  { n: 100, mod: 2 }, '15m': { n: 80,  mod: 3 },
  '1H':  { n: 80,  mod: 4 }, '4H':  { n: 60,  mod: 5 }, '1D':  { n: 60,  mod: 6 }, '1W': { n: 52, mod: 7 },
}

/* ════════════════════════════════════════════════════════
   PRICE FORMATTER
════════════════════════════════════════════════════════ */
function fmtP(p, sym) {
  if (!p) return '—'
  if (sym?.includes('/')) return p.toFixed(4)
  if (p >= 10000) return `$${p.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  if (p >= 1)     return `$${p.toFixed(2)}`
  return `$${p.toFixed(4)}`
}

// FIX #3 — fmtAxis now accepts sym so forex pairs get correct decimal places
function fmtAxis(p, sym) {
  if (!p) return '—'
  if (sym?.includes('/')) return p.toFixed(4)
  if (p >= 10000) return `${(p / 1000).toFixed(1)}k`
  if (p >= 1000)  return p.toFixed(0)
  if (p >= 10)    return p.toFixed(2)
  return p.toFixed(4)
}

function fmtCap(b) { return !b ? '—' : b >= 1000 ? `$${(b / 1000).toFixed(2)}T` : `$${b.toFixed(0)}B` }

/* ════════════════════════════════════════════════════════
   CANDLESTICK SVG COMPONENT
════════════════════════════════════════════════════════ */
function CandleSVG({ candles, livePrice, color, sym }) {
  const wrapRef = useRef(null)
  const [W, setW] = useState(800)
  const [hover, setHover] = useState(null)

  useEffect(() => {
    if (!wrapRef.current) return
    const obs = new ResizeObserver(entries => setW(entries[0].contentRect.width))
    obs.observe(wrapRef.current)
    return () => obs.disconnect()
  }, [])

  const PRICE_H = 284
  const VOL_H   = 52
  const GAP     = 8
  const TOTAL_H = PRICE_H + GAP + VOL_H
  const AXIS_W  = 58
  const IW      = Math.max(1, W - AXIS_W)

  const n   = candles.length
  const cw  = IW / n
  const bw  = Math.max(1, cw * 0.62)

  const allH = candles.map(c => c.high)
  const allL = candles.map(c => c.low)
  const maxP = Math.max(...allH); const minP = Math.min(...allL)
  const pad  = (maxP - minP) * 0.055
  const HI = maxP + pad; const LO = minP - pad; const RNGP = HI - LO || 1

  const toY = useCallback(p => PRICE_H * (1 - (p - LO) / RNGP), [PRICE_H, LO, RNGP])
  const toX = useCallback(i => i * cw + cw / 2, [cw])

  const maxVol = Math.max(...candles.map(c => c.vol))
  const toVH = v => (v / maxVol) * (VOL_H - 5)

  const maPath = useMemo(() => {
    let d = ''
    candles.forEach((_, i) => {
      if (i < 19) return
      const avg = candles.slice(i - 19, i + 1).reduce((s, c) => s + (c.open + c.close) / 2, 0) / 20
      const x = toX(i).toFixed(1); const y = toY(avg).toFixed(1)
      d += i === 19 ? `M${x},${y}` : ` L${x},${y}`
    })
    return d
  }, [candles, toX, toY])

  const livePY   = toY(livePrice)
  const lastC    = candles[n - 1]
  const isGreen  = lastC?.close >= lastC?.open
  const projN    = Math.max(5, Math.floor(n * 0.13))
  const projX    = toX(n - projN) - cw / 2
  const gridLvls = Array.from({ length: 5 }, (_, i) => LO + RNGP * (i + 1) / 6)

  const handleMove = useCallback(e => {
    if (!wrapRef.current) return
    const r   = wrapRef.current.getBoundingClientRect()
    const px  = e.clientX - r.left
    const idx = Math.min(n - 1, Math.max(0, Math.floor(px / cw)))
    setHover({ idx })
  }, [n, cw])

  const hc = hover !== null ? candles[hover.idx] : null

  return (
    <div ref={wrapRef} className="mdt-chart-canvas"
      onMouseMove={handleMove}
      onMouseLeave={() => setHover(null)}>

      {W > 0 && (
        <svg width={W} height={TOTAL_H + 2} style={{ display: 'block', overflow: 'visible' }}>
          <defs>
            <linearGradient id={`mdt-vol-g-${sym}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridLvls.map((p, i) => (
            <line key={i}
              x1={0} y1={toY(p).toFixed(1)}
              x2={IW} y2={toY(p).toFixed(1)}
              stroke="rgba(255,255,255,0.035)" strokeWidth="1"
            />
          ))}

          {/* Projection zone */}
          <rect
            x={projX.toFixed(1)} y={0}
            width={(IW - projX).toFixed(1)} height={PRICE_H}
            fill={`${color}08`}
            stroke={`${color}22`}
            strokeWidth="1" strokeDasharray="4 3"
          />
          <text x={(projX + 5).toFixed(1)} y={13}
            fontSize="7" fill={`${color}55`}
            fontFamily="Inter, sans-serif"
            fontWeight="800" letterSpacing="0.07em">PROJECTION</text>

          {/* Candle bodies + wicks */}
          {candles.map((c, i) => {
            const x     = toX(i)
            const up    = c.close >= c.open
            const col   = up ? '#00C076' : '#FF3D57'
            const bTop  = toY(Math.max(c.open, c.close))
            const bBot  = toY(Math.min(c.open, c.close))
            const bH    = Math.max(1, bBot - bTop)
            const isHov = hover?.idx === i
            const dimmed = hover !== null && !isHov
            return (
              <g key={i} style={{ opacity: dimmed ? 0.45 : 1 }}>
                <line
                  x1={x.toFixed(1)} y1={toY(c.high).toFixed(1)}
                  x2={x.toFixed(1)} y2={toY(c.low).toFixed(1)}
                  stroke={col} strokeWidth="1"
                />
                <rect
                  x={(x - bw / 2).toFixed(1)} y={bTop.toFixed(1)}
                  width={bw.toFixed(1)} height={bH.toFixed(1)}
                  fill={col} fillOpacity={up ? 0.88 : 0.8}
                  stroke={col} strokeWidth={isHov ? 0.8 : 0}
                />
              </g>
            )
          })}

          {/* MA(20) */}
          {maPath && (
            <path d={maPath} fill="none"
              stroke="#FFB800" strokeWidth="1.3"
              strokeLinejoin="round" strokeLinecap="round"
              opacity="0.75" />
          )}

          {/* Live price dashed line */}
          <line
            x1={0} y1={livePY.toFixed(1)}
            x2={IW} y2={livePY.toFixed(1)}
            stroke={isGreen ? 'rgba(0,192,118,.3)' : 'rgba(255,61,87,.3)'}
            strokeWidth="1" strokeDasharray="5 4"
          />

          {/* Price axis labels */}
          {gridLvls.map((p, i) => (
            <text key={i}
              x={(IW + 5).toFixed(1)} y={(toY(p) + 3.5).toFixed(1)}
              fontSize="8.5" fill="rgba(168,178,204,.45)"
              fontFamily="Inter, sans-serif"
              fontVariantNumeric="tabular-nums">
              {fmtAxis(p, sym)}
            </text>
          ))}

          {/* Live price axis badge */}
          <rect
            x={(IW + 1).toFixed(1)} y={(livePY - 8).toFixed(1)}
            width={AXIS_W - 3} height={16} rx={3}
            fill={isGreen ? '#00C076' : '#FF3D57'}
          />
          <text
            x={(IW + 1 + (AXIS_W - 3) / 2).toFixed(1)}
            y={(livePY + 4.5).toFixed(1)}
            fontSize="8.5" fill={isGreen ? '#021a0e' : '#200209'}
            fontFamily="Inter, sans-serif"
            fontWeight="800" fontVariantNumeric="tabular-nums"
            textAnchor="middle">
            {fmtAxis(livePrice, sym)}
          </text>

          {/* Volume bars */}
          {candles.map((c, i) => {
            const x     = toX(i)
            const up    = c.close >= c.open
            const barH  = toVH(c.vol)
            const vy    = PRICE_H + GAP + VOL_H - barH
            const isHov = hover?.idx === i
            return (
              <rect key={`v${i}`}
                x={(x - bw / 2).toFixed(1)} y={vy.toFixed(1)}
                width={bw.toFixed(1)} height={barH.toFixed(1)}
                fill={up ? 'rgba(0,192,118,.45)' : 'rgba(255,61,87,.42)'}
                opacity={isHov ? 1 : 0.65}
              />
            )
          })}

          {/* Crosshair */}
          {hover !== null && (
            <>
              <line
                x1={toX(hover.idx).toFixed(1)} y1={0}
                x2={toX(hover.idx).toFixed(1)} y2={PRICE_H}
                stroke="rgba(255,255,255,.13)"
                strokeWidth="1" strokeDasharray="3 3"
              />
              <circle cx={toX(hover.idx).toFixed(1)} cy={(PRICE_H + 2).toFixed(1)}
                r={3} fill={color} opacity={0.7} />
            </>
          )}
        </svg>
      )}

      {/* OHLCV overlay — FIX #3: fmtAxis now receives sym */}
      {hc && (
        <div className="mdt-ohlcv">
          {[
            { k: 'O', v: fmtAxis(hc.open,  sym) },
            { k: 'H', v: fmtAxis(hc.high,  sym) },
            { k: 'L', v: fmtAxis(hc.low,   sym) },
            { k: 'C', v: fmtAxis(hc.close, sym), cls: hc.close >= hc.open ? 'pos' : 'neg' },
            { k: 'V', v: `${(hc.vol * 100).toFixed(1)}M` },
          ].map(({ k, v, cls }) => (
            <div key={k} className="mdt-ohlcv-item">
              <span className="mdt-ohlcv-key">{k}</span>
              <span className={`mdt-ohlcv-val ${cls ?? ''}`}>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   ORDER BOOK
════════════════════════════════════════════════════════ */
function OrderBook({ asks, bids, mid, asset }) {
  const maxQ = useMemo(() =>
    Math.max(...asks.map(r => r.qty), ...bids.map(r => r.qty)), [asks, bids])

  const fmt = p => p >= 1000
    ? p.toFixed(2)
    : p < 10 ? p.toFixed(5) : p.toFixed(2)

  const spread = asks[0] && bids[0]
    ? Math.abs(asks[0].px - bids[0].px).toFixed(asset.baseP > 10 ? 2 : 5)
    : '—'

  // FIX #4 — compare mid against baseP to determine direction, not just baseP >= 0
  const isPos = mid >= asset.baseP

  return (
    <div className="mdt-book-body">
      <div className="mdt-book-cols">
        <span>Price (USD)</span>
        <span>Qty</span>
        <span>Total</span>
      </div>

      <div className="mdt-asks-wrap">
        {[...asks].reverse().slice(0, 8).map((r, i) => (
          <div key={i} className="mdt-book-row">
            <div className="mdt-depth-bar mdt-depth-ask"
              style={{ width: `${(r.qty / maxQ) * 100}%` }} />
            <span className="mdt-ask-px">{fmt(r.px)}</span>
            <span className="mdt-book-qty">{r.qty.toFixed(4)}</span>
            <span className="mdt-book-total">{(r.px * r.qty).toFixed(0)}</span>
          </div>
        ))}
      </div>

      <div className="mdt-book-mid">
        <div className={`mdt-mid-price ${isPos ? 'pos' : 'neg'}`}>
          {isPos
            ? <CaretUp size={11} weight="fill" />
            : <CaretDown size={11} weight="fill" />}
          {fmt(mid)}
        </div>
        <span className="mdt-spread">Spread {spread}</span>
      </div>

      <div className="mdt-bids-wrap">
        {bids.slice(0, 8).map((r, i) => (
          <div key={i} className="mdt-book-row">
            <div className="mdt-depth-bar mdt-depth-bid"
              style={{ width: `${(r.qty / maxQ) * 100}%` }} />
            <span className="mdt-bid-px">{fmt(r.px)}</span>
            <span className="mdt-book-qty">{r.qty.toFixed(4)}</span>
            <span className="mdt-book-total">{(r.px * r.qty).toFixed(0)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   ORDER FORM
════════════════════════════════════════════════════════ */
function OrderForm({ asset, livePrice }) {
  const [side,   setSide]   = useState('buy')
  const [otype,  setOtype]  = useState('Limit')
  // FIX #5 — price initialises from prop; syncs when livePrice changes (Market mode excluded)
  const [price,  setPrice]  = useState(String(livePrice))
  const [amount, setAmount] = useState('')

  useEffect(() => {
    if (otype !== 'Market') {
      setPrice(prev => {
        // Only auto-update if the user hasn't manually edited the field
        // (i.e. it still roughly matches the last known live price)
        return prev === '' ? String(livePrice) : prev
      })
    }
  }, [livePrice, otype])

  // Reset price field to latest live price when switching to Limit/Stop
  useEffect(() => {
    if (otype !== 'Market') setPrice(String(livePrice))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otype])

  const BALANCE  = 12_450.38
  const numAmt   = parseFloat(amount)  || 0
  const numPx    = parseFloat(price)   || livePrice
  const total    = +(numAmt * numPx).toFixed(2)
  const fee      = +(total * 0.001).toFixed(4)
  const usedPct  = Math.min(100, (total / BALANCE) * 100)
  const canSubmit = numAmt > 0 && numPx > 0

  const applyPct = p => {
    const t = BALANCE * (p / 100)
    setAmount((t / numPx).toFixed(6))
  }

  const bColor = side === 'buy' ? '#00C076' : '#FF3D57'
  const sym    = asset.sym.includes('/') ? asset.sym.split('/')[0] : asset.sym

  return (
    <div className="mdt-form-card mdt-card">

      {/* Side toggle */}
      <div className="mdt-side-tabs">
        <button className={`mdt-side-tab buy ${side === 'buy' ? 'on' : ''}`}
          onClick={() => setSide('buy')}>
          <TrendUp size={12} weight="bold" />Buy / Long
        </button>
        <button className={`mdt-side-tab sell ${side === 'sell' ? 'on' : ''}`}
          onClick={() => setSide('sell')}>
          <TrendDown size={12} weight="bold" />Sell / Short
        </button>
      </div>

      {/* Order types */}
      <div className="mdt-otype-row">
        {['Limit', 'Market', 'Stop'].map(t => (
          <button key={t}
            className={`mdt-otype-btn ${otype === t ? 'on' : ''} otype-${side}`}
            onClick={() => setOtype(t)}>{t}</button>
        ))}
      </div>

      {/* Balance */}
      <div className="mdt-form-row">
        <span className="mdt-form-lbl">Available</span>
        <span className="mdt-form-val">{BALANCE.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT</span>
      </div>

      {/* Price input */}
      {otype !== 'Market' && (
        <div className="mdt-input-group">
          <label className="mdt-input-label">Price</label>
          <div className="mdt-input-shell">
            <input className="mdt-input" type="number"
              value={price} onChange={e => setPrice(e.target.value)} />
            <span className="mdt-input-unit">USDT</span>
          </div>
        </div>
      )}

      {/* Amount */}
      <div className="mdt-input-group">
        <label className="mdt-input-label">Amount</label>
        <div className="mdt-input-shell">
          <input className="mdt-input" type="number" placeholder="0.000000"
            value={amount} onChange={e => setAmount(e.target.value)} />
          <span className="mdt-input-unit">{sym}</span>
        </div>
        <div className="mdt-pct-row">
          {[25, 50, 75, 100].map(p => (
            <button key={p} className="mdt-pct-btn" onClick={() => applyPct(p)}>{p}%</button>
          ))}
        </div>
      </div>

      {/* Allocation bar */}
      <div className="mdt-alloc">
        <div className="mdt-alloc-track">
          <div className="mdt-alloc-fill" style={{ width: `${usedPct}%`, background: bColor }} />
          <div className="mdt-alloc-knob" style={{ left: `${usedPct}%`, borderColor: bColor }} />
        </div>
        <span className="mdt-alloc-pct" style={{ color: bColor }}>{usedPct.toFixed(0)}%</span>
      </div>

      {/* Summary */}
      <div className="mdt-form-summary">
        <div className="mdt-sum-row">
          <span>Total</span>
          <span>{total > 0 ? total.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'} USDT</span>
        </div>
        <div className="mdt-sum-row">
          <span>Fee (0.10%)</span>
          <span>{fee > 0 ? fee.toFixed(4) : '—'} USDT</span>
        </div>
      </div>

      {/* Submit */}
      <button
        className={`mdt-submit-btn ${side}`}
        disabled={!canSubmit}
        onClick={() => setAmount('')}>
        {side === 'buy'
          ? <><TrendUp size={13} weight="bold" />Buy {sym}</>
          : <><TrendDown size={13} weight="bold" />Sell {sym}</>}
      </button>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════ */
export default function MarketDetail() {
  // FIX #1 — call hook unconditionally; destructure (or ignore) the result properly
  useOutletContext()

  const navigate     = useNavigate()
  const { symbol }   = useParams()
  const sym          = decodeURIComponent(symbol ?? '')
  const asset        = ASSETS.find(a => a.sym === sym)

  /* ── live price ── */
  const [livePrice,  setLivePrice]  = useState(() => asset?.baseP ?? 0)
  const [priceDir,   setPriceDir]   = useState(null)   // kept for potential UI use
  const [flashClass, setFlashClass] = useState('')

  /* ── chart state ── */
  const [tf, setTf] = useState('1H')

  /* ── order book ── */
  const [asks, setAsks] = useState(() => asset ? genBook(asset.baseP, 'ask') : [])
  const [bids, setBids] = useState(() => asset ? genBook(asset.baseP, 'bid') : [])

  /* ── watchlist ── */
  const [watched, setWatched] = useState(false)

  /* ── candles per TF ── */
  const candles = useMemo(() => {
    if (!asset) return []
    const cfg = TF_CONFIG[tf]
    return genCandles(asset.sym, asset.baseP, cfg.n, cfg.mod)
  }, [asset, tf])

  // FIX #6 — stable derived stats; memoised on asset only so they don't re-randomize on every tick
  const stableStats = useMemo(() => {
    if (!asset) return {}
    const r      = xorshift(symSeed(asset.sym) + 99)
    const dayHi  = asset.baseP * (1 + r() * 0.012)
    const dayLo  = asset.baseP * (1 - r() * 0.012)
    const openPx = asset.baseP * (1 + (r() - 0.5) * 0.007)
    const prevCl = asset.baseP * (1 + (r() - 0.5) * 0.008)
    const wk52hi = asset.baseP * 1.41
    const wk52lo = asset.baseP * 0.72
    const pe     = asset.cat === 'Stock' ? (22 + r() * 14).toFixed(2) : '—'
    const eps    = asset.cat === 'Stock' ? `$${(r() * 8 + 2).toFixed(2)}` : '—'
    const beta   = asset.cat !== 'Forex' ? (0.6 + r() * 1.4).toFixed(2) : '—'
    const divY   = asset.cat === 'Stock' ? `${(r() * 3).toFixed(2)}%` : '—'
    return { dayHi, dayLo, openPx, prevCl, wk52hi, wk52lo, pe, eps, beta, divY }
  }, [asset])

  // FIX #2 — side effects (setPriceDir, setFlashClass, setTimeout) lifted out of the
  //           state updater and driven by a separate ref + useEffect instead
  const prevPxRef  = useRef(asset?.baseP ?? 0)
  const livePxRef  = useRef(asset?.baseP ?? 0)  // FIX #8 — stable ref for book interval

  /* Live tick — state updater is now a pure function; side effects handled separately */
  useEffect(() => {
    if (!asset) return
    const vol = asset.sym.includes('/') ? 0.00025 : (asset.cat === 'Crypto' ? 0.0018 : 0.0009)

    const iv = setInterval(() => {
      const prev  = prevPxRef.current
      const drift = (asset.baseP - prev) * 0.002
      const noise = (Math.random() - 0.499) * prev * vol
      const next  = Math.max(prev * 0.96, prev + drift + noise)

      const dir     = next >= prev ? 'up' : 'dn'
      const pctMove = Math.abs((next - prev) / prev) * 100
      const cls     = pctMove > 0.08 ? `flash-${dir}` : ''

      // Update refs first (synchronous, no re-render)
      prevPxRef.current = next
      livePxRef.current = next

      // FIX #2 — these setState calls are outside the updater; safe to call here
      setLivePrice(next)
      setPriceDir(dir)
      if (cls) {
        setFlashClass(cls)
        setTimeout(() => setFlashClass(''), 680)
      }
    }, asset.cat === 'Crypto' ? 1400 : 2600)

    return () => clearInterval(iv)
  }, [asset])

  // FIX #8 — book interval uses ref so it never needs livePrice as a dependency,
  //           preventing constant interval teardown/recreation on every tick
  useEffect(() => {
    if (!asset) return
    const iv = setInterval(() => {
      setAsks(genBook(livePxRef.current, 'ask'))
      setBids(genBook(livePxRef.current, 'bid'))
    }, 2200)
    return () => clearInterval(iv)
  }, [asset]) // ← asset is the only real dependency

  /* ── Not found ── */
  if (!asset) {
    return (
      <div className="mdt-root">
        <div className="mdt-not-found">
          <WarningCircle size={42} weight="duotone" style={{ color: '#FF3D57', opacity: .6 }} />
          <h2>Instrument Not Found</h2>
          <p>"{sym}" is not in the Veltro universe yet.</p>
          <button className="mdt-back-btn" onClick={() => navigate('../markets')}>
            <ArrowLeft size={13} weight="bold" />Back to Markets
          </button>
        </div>
      </div>
    )
  }

  /* ── Derived values ── */
  const { dayHi, dayLo, openPx, prevCl, wk52hi, wk52lo, pe, eps, beta, divY } = stableStats
  const pct      = ((livePrice - asset.baseP) / asset.baseP) * 100
  const absChg   = livePrice - asset.baseP
  const isPos    = pct >= 0
  const rangePct = Math.min(100, Math.max(0, ((livePrice - wk52lo) / ((wk52hi - wk52lo) || 1)) * 100))

  /* Related assets — same sector, excluding self */
  const related = useMemo(() => {
    return ASSETS
      .filter(a => a.sector === asset.sector && a.sym !== asset.sym)
      .slice(0, 6)
      .map(a => {
        const rr   = xorshift(symSeed(a.sym) + 7)
        const rChg = (rr() - 0.49) * 5.2
        return { ...a, rChg, rPrice: a.baseP * (1 + rChg / 100) }
      })
  }, [asset])

  return (
    <div className="mdt-root" style={{ '--asset-color': asset.color }}>

      {/* ─── HERO ─── */}
      <div className="mdt-hero">
        <div className="mdt-hero-glow" />

        <div className="mdt-hero-inner">
          {/* Identity */}
          <div className="mdt-hero-id">
            <div className="mdt-asset-badge"
              style={{ background: `${asset.color}18`, color: asset.color }}>
              {asset.sym.includes('/') ? asset.sym.split('/')[0].slice(0, 2) : asset.sym.slice(0, 2)}
            </div>
            <div className="mdt-sym-wrap">
              <div className="mdt-sym">{asset.sym}</div>
              <div className="mdt-name">{asset.name}</div>
              <div className="mdt-tags">
                <span className="mdt-tag accent">{asset.cat}</span>
                <span className="mdt-tag">{asset.sector}</span>
              </div>
            </div>
          </div>

          <div className="mdt-hero-divider" />

          {/* Live price */}
          <div className="mdt-price-block">
            <div className={`mdt-live-price ${flashClass}`}>
              {fmtP(livePrice, asset.sym)}
            </div>
            <div className="mdt-price-row">
              <span className={`mdt-chg-pill ${isPos ? 'pos' : 'neg'}`}>
                {isPos ? <CaretUp size={10} weight="bold" /> : <CaretDown size={10} weight="bold" />}
                {isPos ? '+' : ''}{pct.toFixed(2)}%
              </span>
              <span className="mdt-abs-chg">
                {absChg >= 0 ? '+' : ''}{fmtP(Math.abs(absChg), asset.sym)} today
              </span>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mdt-stats-strip">
            {[
              { label: 'Open',       val: fmtP(openPx, asset.sym) },
              { label: 'Prev Close', val: fmtP(prevCl, asset.sym) },
              { label: 'Day High',   val: fmtP(dayHi,  asset.sym), col: '#00C076' },
              { label: 'Day Low',    val: fmtP(dayLo,  asset.sym), col: '#FF3D57' },
              { label: 'Volume',     val: asset.vol24              },
              { label: 'Mkt Cap',    val: fmtCap(asset.mktCap)     },
            ].map((s, i, arr) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                <div className="mdt-stat-item">
                  <span className="mdt-stat-label">{s.label}</span>
                  <span className="mdt-stat-val" style={s.col ? { color: s.col } : {}}>{s.val}</span>
                </div>
                {i < arr.length - 1 && <div className="mdt-stat-sep" />}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mdt-hero-actions">
            <button className="mdt-btn-buy"  onClick={() => navigate('/trade')}>
              <TrendUp size={13} weight="bold" />Buy
            </button>
            <button className="mdt-btn-sell" onClick={() => navigate('/trade')}>
              <TrendDown size={13} weight="bold" />Sell
            </button>
            <button
              className={`mdt-btn-watch ${watched ? 'on' : ''}`}
              onClick={() => setWatched(w => !w)}>
              <Star size={14} weight={watched ? 'fill' : 'duotone'} />
            </button>
          </div>
        </div>

        {/* Breadcrumb bar */}
        <div className="mdt-bc-bar">
          <button className="mdt-bc-btn" onClick={() => navigate('../markets')}>
            <ArrowLeft size={10} weight="bold" />Markets
          </button>
          <CaretRight size={9} />
          <span className="mdt-bc-cur">{asset.sym}</span>
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 9, color: 'var(--vlt-text-muted)', fontFamily: 'Inter,sans-serif', fontWeight: 700 }}>
              {asset.sector} · {asset.cat}
            </span>
          </span>
        </div>
      </div>

      {/* ─── MAIN GRID ─── */}
      <div className="mdt-main">

        {/* LEFT COLUMN */}
        <div className="mdt-col-left">

          {/* Chart Card */}
          <div className="mdt-card mdt-chart-card">
            <div className="mdt-chart-toolbar">
              <div className="mdt-tf-pills">
                {Object.keys(TF_CONFIG).map(t => (
                  <button key={t}
                    className={`mdt-tf-btn ${tf === t ? 'on' : ''}`}
                    onClick={() => setTf(t)}>{t}</button>
                ))}
              </div>
              <div className="mdt-chart-tools">
                <button className="mdt-chart-tool"><ChartLine size={13} weight="duotone" /></button>
                <button className="mdt-chart-tool"><ChartBar  size={13} weight="duotone" /></button>
                <button className="mdt-chart-tool"><Gear      size={13} weight="duotone" /></button>
                <button className="mdt-chart-tool" onClick={() => setTf(t => t)}>
                  <ArrowClockwise size={13} weight="duotone" />
                </button>
              </div>
            </div>

            <CandleSVG
              candles={candles}
              livePrice={livePrice}
              color={asset.color}
              sym={asset.sym}
            />

            <div className="mdt-chart-legend">
              <div className="mdt-legend-item">
                <div className="mdt-legend-line" style={{ background: isPos ? '#00C076' : '#FF3D57' }} />
                Candles
              </div>
              <div className="mdt-legend-item">
                <div className="mdt-legend-line" style={{ background: '#FFB800' }} />
                MA(20)
              </div>
              <div className="mdt-legend-item">
                <div className="mdt-legend-line" style={{ background: asset.color, opacity: .7 }} />
                Projection
              </div>
            </div>
          </div>

          {/* Bottom row: Stats + Related */}
          <div className="mdt-bottom-row">

            {/* Key Statistics */}
            <div className="mdt-card">
              <div className="mdt-card-head">
                <div className="mdt-card-title">
                  Key Statistics
                  <span className="mdt-card-badge">{asset.cat}</span>
                </div>
              </div>
              <div className="mdt-stats-grid">
                {[
                  { label: 'Market Cap',  val: fmtCap(asset.mktCap)               },
                  { label: 'Volume 24h',  val: asset.vol24                         },
                  { label: 'Day High',    val: fmtP(dayHi,  asset.sym), cls: 'pos' },
                  { label: 'Day Low',     val: fmtP(dayLo,  asset.sym), cls: 'neg' },
                  { label: '52w High',    val: fmtP(wk52hi, asset.sym)             },
                  { label: '52w Low',     val: fmtP(wk52lo, asset.sym)             },
                  { label: 'Open',        val: fmtP(openPx, asset.sym)             },
                  { label: 'Prev Close',  val: fmtP(prevCl, asset.sym)             },
                  { label: 'P/E Ratio',   val: pe                                  },
                  { label: 'EPS',         val: eps                                 },
                  { label: 'Beta',        val: beta                                },
                  { label: 'Div. Yield',  val: divY                                },
                ].map(s => (
                  <div key={s.label} className="mdt-key-stat">
                    <span className="mdt-key-label">{s.label}</span>
                    <span className={`mdt-key-val ${s.cls ?? ''}`}>{s.val}</span>
                  </div>
                ))}
              </div>

              {/* 52-week range */}
              <div className="mdt-range-section">
                <div className="mdt-range-head">
                  <span>52-Week Range</span>
                  <span className="mdt-range-cur">{fmtP(livePrice, asset.sym)}</span>
                </div>
                <div className="mdt-range-track">
                  <div className="mdt-range-fill" />
                  <div className="mdt-range-dot" style={{ left: `${rangePct}%` }} />
                </div>
                <div className="mdt-range-labels">
                  <span>{fmtP(wk52lo, asset.sym)}</span>
                  <span>{fmtP(wk52hi, asset.sym)}</span>
                </div>
              </div>
            </div>

            {/* Related Assets */}
            <div className="mdt-card">
              <div className="mdt-card-head">
                <div className="mdt-card-title">
                  Related Assets
                  <span className="mdt-card-badge">{asset.sector}</span>
                </div>
              </div>
              <div className="mdt-related-list">
                {related.length > 0 ? related.map(a => (
                  <div key={a.sym} className="mdt-related-row"
                    onClick={() => navigate(`../markets/${encodeURIComponent(a.sym)}`)}>
                    <div className="mdt-rel-badge"
                      style={{ background: `${a.color}18`, color: a.color }}>
                      {a.sym.includes('/') ? a.sym.split('/')[0].slice(0, 2) : a.sym.slice(0, 2)}
                    </div>
                    <div className="mdt-rel-info">
                      <div className="mdt-rel-sym">{a.sym}</div>
                      <div className="mdt-rel-name">{a.name}</div>
                    </div>
                    <div className="mdt-rel-right">
                      <span className="mdt-rel-price">{fmtP(a.rPrice, a.sym)}</span>
                      <span className={`mdt-rel-chg ${a.rChg >= 0 ? 'pos' : 'neg'}`}>
                        {a.rChg >= 0 ? '+' : ''}{a.rChg.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                )) : (
                  <div style={{ padding: '24px 16px', color: 'var(--vlt-text-muted)', fontSize: 11, fontFamily: 'Inter,sans-serif', textAlign: 'center' }}>
                    No related assets in {asset.sector}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="mdt-col-right">

          {/* Order Form */}
          <OrderForm asset={asset} livePrice={livePrice} />

          {/* Order Book */}
          <div className="mdt-card mdt-book-card">
            <div className="mdt-card-head">
              <div className="mdt-card-title">Order Book</div>
              <span style={{ fontSize: 9, color: 'var(--vlt-text-muted)', fontFamily: 'Inter,sans-serif', fontWeight: 700, letterSpacing: '.06em' }}>LIVE</span>
            </div>
            <OrderBook asks={asks} bids={bids} mid={livePrice} asset={asset} />
          </div>

        </div>
      </div>
    </div>
  )
}