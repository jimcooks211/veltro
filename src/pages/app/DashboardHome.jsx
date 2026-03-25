import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { apiGet } from '../../utils/api.js'
import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  ArrowUpRight, ArrowDownRight, Wallet, ChartLineUp,
  Lightning, CaretRight, TrendUp, Eye, Star,
  Target, Briefcase, ChartDonut, BookOpen,
} from '@phosphor-icons/react'
import './DashboardHome.css'

/* ═══════════════════════════════════════════════════════════════
   PRNG CANDLE GENERATOR -- xorshift32, deterministic, no API
═══════════════════════════════════════════════════════════════ */
function rng(seed) {
  let s = (seed >>> 0) || 1
  return () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 0xffffffff }
}
function makeCandles(n = 80, start = 174.2, seed = 4471) {
  const r = rng(seed); const out = []
  const base = new Date(2026, 2, 9); let p = start; let skip = 0
  while (out.length < n) {
    const d = new Date(base); d.setDate(base.getDate() - (n - out.length + skip)); skip++
    if (d.getDay() === 0 || d.getDay() === 6) continue
    const o = p + (r() - 0.5) * 0.006 * p
    const c = o * (1 + (r() - 0.46) * 0.018 + 0.0003)
    const h = Math.max(o, c) * (1 + r() * 0.009)
    const l = Math.min(o, c) * (1 - r() * 0.009)
    const v = 42e6 * (0.5 + r() * 2) * (1 + Math.abs(c - o) / o * 10)
    out.push({ o, h, l, c, v, label: d.toLocaleDateString('en-US', { month:'short', day:'numeric' }) })
    p = c
  }
  return out
}
const BASE_CANDLES = makeCandles()

/* ─ Bar chart data ─ */
const BARS = {
  '1Y': [
    { t:'Jan', b:32000, g:1200, x:0   }, { t:'Feb', b:32200, g:2100, x:0   },
    { t:'Mar', b:32300, g:0,    x:400 }, { t:'Apr', b:32100, g:1800, x:0   },
    { t:'May', b:32400, g:2600, x:0   }, { t:'Jun', b:32500, g:0,    x:200 },
    { t:'Jul', b:32500, g:3100, x:0   }, { t:'Aug', b:33000, g:2400, x:0   },
    { t:'Sep', b:33200, g:0,    x:600 }, { t:'Oct', b:33100, g:1900, x:0   },
    { t:'Nov', b:33200, g:2800, x:0   }, { t:'Dec', b:33400, g:2100, x:0   },
  ],
  '3Y': [
    { t:"Q1'23", b:25000, g:1200, x:0   }, { t:"Q2'23", b:25200, g:2100, x:0   },
    { t:"Q3'23", b:25500, g:0,    x:400 }, { t:"Q4'23", b:25700, g:2900, x:0   },
    { t:"Q1'24", b:29000, g:3100, x:0   }, { t:"Q2'24", b:30000, g:0,    x:200 },
    { t:"Q3'24", b:30200, g:4200, x:0   }, { t:"Q4'24", b:32000, g:4800, x:0   },
    { t:"Q1'25", b:33000, g:2100, x:0   },
  ],
  'All': [
    { t:'2017', b:8000,  g:1200, x:0    }, { t:'2018', b:11000, g:0,    x:800  },
    { t:'2019', b:14000, g:3200, x:0    }, { t:'2020', b:18000, g:4100, x:0    },
    { t:'2021', b:24000, g:8200, x:0    }, { t:'2022', b:22000, g:0,    x:3100 },
    { t:'2023', b:26000, g:5800, x:0    }, { t:'2024', b:32000, g:9400, x:0    },
    { t:'2025', b:35000, g:2100, x:0    },
  ],
}

/* ─ Watchlist ─ */
const WATCH_BASE = [
  { tk:'AAPL', name:'Apple Inc.',   basePrice:189.42, sp:[185,187,186,188,190,189,191,189.42] },
  { tk:'NVDA', name:'NVIDIA Corp.', basePrice:124.80, sp:[118,120,122,119,121,124,126,124.80] },
  { tk:'BTC',  name:'Bitcoin',      basePrice:67420,  sp:[68200,67900,68100,67800,67500,67300,67600,67420] },
  { tk:'ETH',  name:'Ethereum',     basePrice:3210,   sp:[3140,3160,3150,3180,3190,3200,3220,3210] },
  { tk:'MSFT', name:'Microsoft',    basePrice:432.10, sp:[435,434,436,433,432,431,433,432.10] },
]

/* ─ Portfolio holdings -- quantities, fixed ─ */
const HOLDINGS = [
  { tk:'AAPL', name:'Apple Inc.',   qty:28,    color:'#1A56FF' },
  { tk:'BTC',  name:'Bitcoin',      qty:0.18,  color:'#F7931A' },
  { tk:'NVDA', name:'NVIDIA Corp.', qty:42,    color:'#00C076' },
  { tk:'ETH',  name:'Ethereum',     qty:1.85,  color:'#00D4FF' },
  { tk:'MSFT', name:'Microsoft',    qty:12,    color:'#C9A84C' },
  { tk:'CASH', name:'Cash',         qty:1,     color:'#8A96B4' },
]
const CASH_VALUE = 1840

/* ─ Order book symbol options ─ */
const OB_SYMBOLS = ['AAPL', 'BTC', 'NVDA', 'ETH']

/* ─ Colour maps ─ */
const TC = { AAPL:'#1A56FF', BTC:'#F7931A', NVDA:'#00C076', ETH:'#00D4FF', MSFT:'#C9A84C', CASH:'#8A96B4' }

/* ─ Base prices ─ */
const BASE_PRICES = { AAPL:189.42, NVDA:124.80, BTC:67420, ETH:3210, MSFT:432.10, SPY:548.20, VIX:14.32 }

/* ─ Formatters -- Inter tabular-nums only, never Syne ─ */
const $   = (n, d = 2) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits:d, maximumFractionDigits:d })}`
const $K  = (n) => n >= 1000 ? `$${(n / 1000).toFixed(2)}K` : $(n)
const $M  = (n) => n >= 1e6  ? `${(n / 1e6).toFixed(2)}M`  : `${(n / 1e3).toFixed(0)}K`
const pf  = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`
const tod = () => { const h = new Date().getHours(); return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening' }

/* ─ Simulate REST price tick ─ */
function tickPrice(current, base, volatility = 0.0008) {
  const drift = (base - current) * 0.002
  const noise = (Math.random() - 0.499) * current * volatility
  return Math.max(current * 0.92, current + drift + noise)
}

/* ─ Generate order book levels around mid price ─ */
function makeBook(mid, isCrypto = false) {
  const spread   = isCrypto ? mid * 0.0002 : mid * 0.0004
  const tickSize = isCrypto ? 0.5 : 0.01
  const levels   = 10
  const bids = []
  const asks = []
  let bidVol = 0, askVol = 0
  for (let i = 0; i < levels; i++) {
    const bPrice = parseFloat((mid - spread / 2 - i * tickSize).toFixed(isCrypto ? 0 : 2))
    const aPrice = parseFloat((mid + spread / 2 + i * tickSize).toFixed(isCrypto ? 0 : 2))
    const bSize  = parseFloat((200 + Math.random() * 1800).toFixed(0))
    const aSize  = parseFloat((200 + Math.random() * 1800).toFixed(0))
    bidVol += bSize; askVol += aSize
    bids.push({ price: bPrice, size: bSize, total: bidVol })
    asks.push({ price: aPrice, size: aSize, total: askVol })
  }
  const maxVol = Math.max(bidVol, askVol)
  return { bids, asks, maxVol, spread: (spread).toFixed(isCrypto ? 0 : 2) }
}

/* ═══════════════════════════════════════════════════════════════
   PARTICLE SYSTEM
═══════════════════════════════════════════════════════════════ */
function useParticles(canvasRef) {
  const particlesRef = useRef([])
  const rafRef       = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const resize = () => {
      const p = canvas.parentElement; if (!p) return
      canvas.width = p.offsetWidth; canvas.height = p.offsetHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particlesRef.current = particlesRef.current.filter(p => p.life > 0)
      for (const p of particlesRef.current) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.04; p.vx *= 0.975; p.life -= p.decay
        const a = Math.max(0, p.life)
        ctx.save(); ctx.globalAlpha = a; ctx.shadowBlur = 14; ctx.shadowColor = p.color
        ctx.fillStyle = p.color; ctx.beginPath()
        ctx.arc(p.x, p.y, Math.max(0, p.size * (0.4 + a * 0.6)), 0, Math.PI * 2)
        ctx.fill(); ctx.restore()
      }
      rafRef.current = requestAnimationFrame(animate)
    }
    animate()
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect() }
  }, [canvasRef])

  const spawn = useCallback((el, isUp) => {
    const canvas = canvasRef.current; if (!el || !canvas) return
    const er = el.getBoundingClientRect(); const cr = canvas.getBoundingClientRect()
    const cx = er.left + er.width / 2 - cr.left; const cy = er.top + er.height / 2 - cr.top
    const primary = isUp ? '#00FFD1' : '#FF3D57'; const alt = isUp ? '#00E676' : '#FF6B7A'
    for (let i = 0; i < 22; i++) {
      const angle = (Math.PI * 2 * i / 22) + (Math.random() - 0.5) * 0.5
      const speed = 1.4 + Math.random() * 4.2
      particlesRef.current.push({
        x: cx + (Math.random() - 0.5) * 24, y: cy + (Math.random() - 0.5) * 12,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 0.8,
        life: 0.85 + Math.random() * 0.35, decay: 0.015 + Math.random() * 0.02,
        size: 2 + Math.random() * 3.8, color: Math.random() > 0.4 ? primary : alt,
      })
    }
  }, [canvasRef])

  return { spawn }
}

/* ═══════════════════════════════════════════════════════════════
   STATUS BAR
═══════════════════════════════════════════════════════════════ */
function StatusBar({ prices, flash }) {
  const [time, setTime] = useState(() => new Date())
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t) }, [])
  const isOpen = () => {
    const h = time.getHours(), m = time.getMinutes(), day = time.getDay()
    return day >= 1 && day <= 5 && (h * 60 + m) >= 570 && (h * 60 + m) < 960
  }
  const open = isOpen(); const dotColor = open ? 'var(--cy-neon)' : '#FF3D57'
  const BAR_TICKERS = ['SPY', 'BTC', 'AAPL', 'VIX']
  const pcts = Object.fromEntries(Object.keys(prices).map(k => [k, ((prices[k] - BASE_PRICES[k]) / BASE_PRICES[k]) * 100]))
  return (
    <div className='dh-status'>
      <div className='dh-status-live'>
        <div className='dh-live-dot' style={{ background:dotColor, boxShadow:`0 0 7px ${dotColor}` }}/>
        <span className='dh-status-mkt' style={{ color:dotColor }}>{open ? 'MARKET OPEN' : 'MARKET CLOSED'}</span>
      </div>
      <span className='dh-status-clock'>
        {time.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit' })} EST
      </span>
      <div className='dh-status-tickers'>
        {BAR_TICKERS.map(sym => {
          const pct = pcts[sym] ?? 0; const up = pct >= 0
          const fmt = sym === 'BTC' ? `$${Math.round(prices[sym]).toLocaleString()}` : `$${prices[sym].toFixed(2)}`
          return (
            <div key={sym} className='dh-st-item'>
              <span className='dh-st-sym'>{sym}</span>
              <span key={`${sym}-${flash[sym]}`} className={`dh-st-price${flash[sym] ? ` flash-${flash[sym]}` : ''}`}>{fmt}</span>
              <span className={`dh-st-chg ${up ? 'up' : 'dn'}`}>{up ? '+' : ''}{pct.toFixed(2)}%</span>
            </div>
          )
        })}
      </div>
      <span className='dh-status-session'>NYSE · NASDAQ · CME</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   STAT CARD
═══════════════════════════════════════════════════════════════ */
function StatCard({ label, value, pct, sub, Icon, up, delay = 0, flashDir, cardRef }) {
  return (
    <div ref={cardRef} className={`dh-sc${flashDir ? ` flash-${flashDir}` : ''}`} style={{ animationDelay:`${delay}ms` }}>
      <div className='dh-sc-top'>
        <span className='dh-sc-label'>{label}</span>
        <div className='dh-sc-ring'><Icon size={14} weight='duotone'/></div>
      </div>
      <div key={value} className={`dh-sc-val${flashDir ? ` flash-${flashDir}` : ''}`}>{value}</div>
      <div className='dh-sc-foot'>
        <span className={`dh-sc-badge ${up ? 'up' : 'dn'}`}>
          {up ? <ArrowUpRight size={9} weight='bold'/> : <ArrowDownRight size={9} weight='bold'/>}
          {Math.abs(pct).toFixed(1)}%
        </span>
        <span className='dh-sc-sub'>{sub}</span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   RECHARTS TOOLTIP
═══════════════════════════════════════════════════════════════ */
function BarTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const colMap  = { b:'#F7931A', g:'#1A56FF', x:'#FF3D57' }
  const nameMap = { b:'Cost Basis', g:'Unrealised Gain', x:'Unrealised Loss' }
  return (
    <div className='dh-tip'>
      <p className='dh-tip-lbl'>{label}</p>
      {payload.filter(p => p.value > 0 && p.name && p.name !== 'rem').map((p, i) => (
        <div key={i} className='dh-tip-row'>
          <span className='dh-tip-dot' style={{ background:colMap[p.name] || '#8A96B4' }}/>
          <span className='dh-tip-name'>{nameMap[p.name] || p.name}</span>
          <span className='dh-tip-val'>{$K(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PORTFOLIO PERFORMANCE BARS
═══════════════════════════════════════════════════════════════ */
function PerfBars({ data, isDark }) {
  const maxH = Math.max(...data.map(d => d.b + d.g + d.x))
  const proc  = data.map(d => ({ ...d, rem: Math.max(0, maxH - d.b - d.g - d.x) }))
  return (
    <ResponsiveContainer width='100%' height='100%'>
      <ComposedChart data={proc} barSize={20} margin={{ top:4, right:2, left:0, bottom:0 }}>
        <defs>
          <linearGradient id='gB' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0%'   stopColor='#F7931A' stopOpacity={0.95}/>
            <stop offset='100%' stopColor='#c46b0f' stopOpacity={0.8}/>
          </linearGradient>
          <linearGradient id='gG' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0%'   stopColor='#1A56FF' stopOpacity={0.95}/>
            <stop offset='100%' stopColor='#0A35CC' stopOpacity={0.8}/>
          </linearGradient>
          <linearGradient id='gX' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0%'   stopColor='#FF3D57' stopOpacity={0.9}/>
            <stop offset='100%' stopColor='#CC1A30' stopOpacity={0.75}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray='2 4' vertical={false}
          stroke={isDark ? 'rgba(255,255,255,0.038)' : 'rgba(0,0,0,0.04)'}/>
        <XAxis dataKey='t' axisLine={false} tickLine={false} dy={5}
          tick={{ fontSize:10, fill:'var(--vlt-text-muted)', fontFamily:'Inter,system-ui,sans-serif' }}/>
        <YAxis axisLine={false} tickLine={false} width={40}
          tick={{ fontSize:10, fill:'var(--vlt-text-muted)', fontFamily:'Inter,system-ui,sans-serif' }}
          tickFormatter={v => `$${v / 1000}K`}/>
        <RTip content={<BarTip/>} cursor={{ fill:'rgba(255,255,255,0.015)' }}/>
        <Legend iconType='circle' iconSize={6} wrapperStyle={{ paddingTop:6, fontSize:10.5 }}
          formatter={v => v && v !== 'rem'
            ? <span style={{ color:'var(--vlt-text-muted)', fontFamily:'Inter,system-ui,sans-serif' }}>
                {v === 'b' ? 'Cost Basis' : v === 'g' ? 'Gain' : 'Loss'}
              </span>
            : null}/>
        <Bar dataKey='b'   name='b'   stackId='s' fill='url(#gB)' radius={[0,0,3,3]}/>
        <Bar dataKey='g'   name='g'   stackId='s' fill='url(#gG)'/>
        <Bar dataKey='x'   name='x'   stackId='s' fill='url(#gX)'/>
        <Bar dataKey='rem' name='rem' stackId='s' radius={[3,3,0,0]} legendType='none'
          fill={isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.04)'}/>
      </ComposedChart>
    </ResponsiveContainer>
  )
}

/* ═══════════════════════════════════════════════════════════════
   CANDLESTICK -- pure SVG, ResizeObserver, forming candle pulses
═══════════════════════════════════════════════════════════════ */
function Candlestick({ candles, isDark }) {
  const wRef      = useRef(null)
  const [sz, setSz]   = useState({ w:600, h:260 })
  const [hov, setHov] = useState(null)

  useEffect(() => {
    const el = wRef.current; if (!el) return
    const obs = new ResizeObserver(([e]) =>
      setSz({ w:Math.max(e.contentRect.width, 240), h:Math.max(e.contentRect.height, 160) }))
    obs.observe(el); return () => obs.disconnect()
  }, [])

  const P   = { t:22, r:52, b:36, l:4 }
  const { w, h } = sz
  const cW  = w - P.l - P.r; const cH = h - P.t - P.b
  const prH = cH * 0.84 - 6; const vlH = cH * 0.16
  const prT = P.t; const vlT = P.t + prH + 6

  const pMax = Math.max(...candles.map(c => c.h)) * 1.002
  const pMin = Math.min(...candles.map(c => c.l)) * 0.998
  const pRng = pMax - pMin
  const toY  = (p) => prT + prH - ((p - pMin) / pRng) * prH
  const vMax = Math.max(...candles.map(c => c.v))
  const toVH = (v) => (v / vMax) * vlH
  const step = cW / candles.length; const bW = Math.max(step * 0.56, 1)
  const toX  = useCallback((i) => P.l + i * step + step / 2, [step, P.l])

  const ma = useMemo(() => {
    const pts = candles.map((_, i) => {
      if (i < 19) return null
      const avg = candles.slice(i - 19, i + 1).reduce((s, d) => s + d.c, 0) / 20
      return `${toX(i).toFixed(1)},${toY(avg).toFixed(1)}`
    }).filter(Boolean)
    return pts.length > 1 ? `M${pts.join('L')}` : ''
  }, [sz]) // eslint-disable-line

  const last = candles[candles.length - 1]; const overallUp = last.c >= candles[0].o; const lastIdx = candles.length - 1
  const yTicks = Array.from({ length:5 }, (_, i) => ({ v:pMin + (i/4)*pRng, y:toY(pMin + (i/4)*pRng) }))
  const xTicks = candles.map((c, i) => ({ i, x:toX(i), lbl:c.label })).filter((_, i) => i % 15 === 0)
  const gc = isDark ? 'rgba(255,255,255,0.034)' : 'rgba(0,0,0,0.04)'
  const cc = 'rgba(0,255,209,0.18)'; const tc = 'var(--vlt-text-muted)'
  const hc = hov != null ? candles[hov] : null; const hx = hov != null ? toX(hov) : null
  const onMove = (e) => {
    const rect = wRef.current?.getBoundingClientRect(); if (!rect) return
    setHov(Math.max(0, Math.min(lastIdx, Math.round((e.clientX - rect.left - P.l) / step))))
  }

  return (
    <div ref={wRef} className='dh-cs' onMouseMove={onMove} onMouseLeave={() => setHov(null)}>
      <div className={`dh-cs-info${hc ? ' show' : ''}`}>
        {hc && <>
          <span className='dh-cs-date'>{hc.label}</span>
          <span>O <b>{hc.o.toFixed(2)}</b></span>
          <span>H <b className='up'>{hc.h.toFixed(2)}</b></span>
          <span>L <b className='dn'>{hc.l.toFixed(2)}</b></span>
          <span>C <b className={hc.c >= hc.o ? 'up' : 'dn'}>{hc.c.toFixed(2)}</b></span>
          <span>V <b>{$M(hc.v)}</b></span>
        </>}
      </div>
      <svg width={w} height={h} style={{ display:'block' }}>
        {yTicks.map((t, i) => <line key={i} x1={P.l} x2={w-P.r} y1={t.y} y2={t.y} stroke={gc} strokeWidth={1}/>)}
        {hov != null && hc && <>
          <line x1={hx} x2={hx} y1={prT} y2={prT+prH} stroke={cc} strokeWidth={1} strokeDasharray='3 2'/>
          <line x1={P.l} x2={w-P.r} y1={toY(hc.c)} y2={toY(hc.c)} stroke={cc} strokeWidth={1} strokeDasharray='3 2'/>
          <rect x={w-P.r} y={toY(hc.c)-9} width={P.r-2} height={17} rx={3} fill={hc.c >= hc.o ? '#00C076' : '#FF3D57'}/>
          <text x={w-P.r+3} y={toY(hc.c)+4.5} fontSize={9} fill='#fff' fontFamily='Inter,system-ui,sans-serif' fontWeight={700}>{hc.c.toFixed(2)}</text>
        </>}
        {candles.map((c, i) => (
          <rect key={`v${i}`} x={toX(i)-bW/2} y={vlT+vlH-toVH(c.v)} width={bW} height={toVH(c.v)}
            fill={c.c >= c.o ? 'rgba(0,192,118,0.2)' : 'rgba(255,61,87,0.17)'} rx={1}/>
        ))}
        {candles.map((c, i) => {
          const x = toX(i); const bull = c.c >= c.o; const col = bull ? '#00C076' : '#FF3D57'
          const bT = toY(Math.max(c.o, c.c)); const bB = toY(Math.min(c.o, c.c)); const bH = Math.max(bB-bT, 1.5)
          const hl = hov === i; const isLast = i === lastIdx
          return (
            <g key={`c${i}`} className={isLast ? 'cs-forming' : undefined}>
              <line x1={x} x2={x} y1={toY(c.h)} y2={toY(c.l)} stroke={col} strokeWidth={hl ? 1.5 : 1} opacity={0.75}/>
              <rect x={x-bW/2} y={bT} width={bW} height={bH} fill={col} opacity={hl ? 1 : isLast ? 0.9 : 0.84} rx={1.2}
                style={{ filter:(hl||isLast) ? `drop-shadow(0 0 4px ${col}90)` : undefined }}/>
              {isLast && <rect x={x-bW/2-1} y={bT-1} width={bW+2} height={bH+2} fill='none' stroke={col}
                strokeWidth={0.8} strokeDasharray='2 2' rx={2.5} opacity={0.55}/>}
            </g>
          )
        })}
        <path d={ma} fill='none' stroke='#FFB800' strokeWidth={1.5} strokeLinejoin='round' opacity={0.88}/>
        <line x1={P.l} x2={w-P.r-1} y1={toY(last.c)} y2={toY(last.c)}
          stroke={overallUp ? '#00C076' : '#FF3D57'} strokeWidth={1} strokeDasharray='4 3' opacity={0.5}/>
        {hov == null && <>
          <rect x={w-P.r} y={toY(last.c)-9} width={P.r-2} height={17} rx={3} fill={overallUp ? '#00C076' : '#FF3D57'}/>
          <text x={w-P.r+3} y={toY(last.c)+4.5} fontSize={9} fill='#fff' fontFamily='Inter,system-ui,sans-serif' fontWeight={700}>{last.c.toFixed(2)}</text>
        </>}
        {yTicks.map((t, i) => (
          <text key={i} x={w-P.r+4} y={t.y+4} fontSize={9} fill={tc} fontFamily='Inter,system-ui,sans-serif'>
            {t.v >= 100 ? t.v.toFixed(0) : t.v.toFixed(1)}
          </text>
        ))}
        {xTicks.map((t, i) => (
          <text key={i} x={t.x} y={h-P.b+14} fontSize={9} fill={tc} fontFamily='Inter,system-ui,sans-serif' textAnchor='middle'>{t.lbl}</text>
        ))}
        <text x={P.l+3} y={vlT-2} fontSize={8} fill={tc} fontFamily='Inter,system-ui,sans-serif' opacity={0.42}>VOL</text>
        <rect x={toX(lastIdx-9)-bW/2} y={prT} width={toX(lastIdx)-toX(lastIdx-9)+bW} height={prH}
          fill='rgba(0,255,209,0.012)' stroke={isDark ? 'rgba(0,255,209,0.08)' : 'rgba(0,0,0,0.05)'}
          strokeWidth={1} strokeDasharray='4 4' rx={2}/>
      </svg>
      <div className='dh-cs-leg'>
        <span><i className='dh-dot bull'/>Bullish</span>
        <span><i className='dh-dot bear'/>Bearish</span>
        <span><i className='dh-line ma'/>MA(20)</span>
        <span className='dh-cs-proj'><span style={{ letterSpacing:'2px', opacity:0.35 }}>· · · ·</span>&nbsp;Projection</span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MINI SPARKLINE
═══════════════════════════════════════════════════════════════ */
function Spark({ d, up }) {
  const mn = Math.min(...d); const mx = Math.max(...d); const rn = mx - mn || 1
  const W = 52; const H = 22
  const pts = d.map((v, i) => `${(i / (d.length - 1)) * W},${H - ((v - mn) / rn) * H}`).join(' ')
  return (
    <svg width={W} height={H} style={{ overflow:'visible', flexShrink:0 }}>
      <polyline points={pts} fill='none' stroke={up ? '#00C076' : '#FF3D57'}
        strokeWidth={1.6} strokeLinejoin='round' strokeLinecap='round'/>
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PORTFOLIO BREAKDOWN -- SVG donut + live holding values
═══════════════════════════════════════════════════════════════ */
function PortfolioBreakdown({ prices, flash }) {
  const [hovered, setHovered] = useState(null)

  /* Compute live holding values */
  const holdings = HOLDINGS.map(h => ({
    ...h,
    value: h.tk === 'CASH' ? CASH_VALUE : (prices[h.tk] ?? 0) * h.qty,
    color: TC[h.tk],
  }))
  const total = holdings.reduce((s, h) => s + h.value, 0)

  /* SVG donut geometry */
  const CX = 62; const CY = 62; const R = 52; const INNER = 34; const GAP = 0.022
  let cumAngle = -Math.PI / 2
  const slices = holdings.map(h => {
    const frac  = h.value / total
    const angle = frac * (Math.PI * 2) - GAP
    const start = cumAngle + GAP / 2
    const end   = start + angle
    cumAngle    = start + angle + GAP / 2
    const x1 = CX + R * Math.cos(start); const y1 = CY + R * Math.sin(start)
    const x2 = CX + R * Math.cos(end);   const y2 = CY + R * Math.sin(end)
    const ix1 = CX + INNER * Math.cos(start); const iy1 = CY + INNER * Math.sin(start)
    const ix2 = CX + INNER * Math.cos(end);   const iy2 = CY + INNER * Math.sin(end)
    const large = angle > Math.PI ? 1 : 0
    const path = `M${ix1.toFixed(2)},${iy1.toFixed(2)} L${x1.toFixed(2)},${y1.toFixed(2)} A${R},${R} 0 ${large} 1 ${x2.toFixed(2)},${y2.toFixed(2)} L${ix2.toFixed(2)},${iy2.toFixed(2)} A${INNER},${INNER} 0 ${large} 0 ${ix1.toFixed(2)},${iy1.toFixed(2)} Z`
    return { ...h, path, frac }
  })

  const activeH = hovered != null ? holdings.find(h => h.tk === hovered) : null

  return (
    <div className='dh-p dh-port'>
      <div className='dh-ph'>
        <div className='dh-ptw'>
          <ChartDonut size={13} weight='duotone' className='dh-pico'/>
          <span className='dh-ptitle'>Portfolio Breakdown</span>
        </div>
        <span className='dh-port-total'>
          <span key={`pt-${flash.AAPL}`} className={`dh-port-tval${flash.AAPL ? ` flash-${flash.AAPL}` : ''}`}>
            {$K(total)}
          </span>
        </span>
      </div>

      <div className='dh-port-body'>
        {/* Donut */}
        <div className='dh-donut-wrap'>
          <svg viewBox='0 0 124 124' className='dh-donut-svg'>
            <defs>
              {slices.map(s => (
                <filter key={`gf${s.tk}`} id={`gf${s.tk}`} x='-20%' y='-20%' width='140%' height='140%'>
                  <feGaussianBlur stdDeviation='2.5' result='blur'/>
                  <feMerge><feMergeNode in='blur'/><feMergeNode in='SourceGraphic'/></feMerge>
                </filter>
              ))}
            </defs>
            {slices.map(s => (
              <path key={s.tk} d={s.path}
                fill={s.color}
                opacity={hovered == null ? 0.85 : hovered === s.tk ? 1 : 0.32}
                filter={hovered === s.tk ? `url(#gf${s.tk})` : undefined}
                style={{ transition:'opacity 0.18s', cursor:'pointer' }}
                onMouseEnter={() => setHovered(s.tk)}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
            {/* center content */}
            {activeH ? <>
              <text x={CX} y={CY - 10} textAnchor='middle' fontSize={7.5}
                fill='var(--vlt-text-muted)' fontFamily='Inter,system-ui,sans-serif' fontWeight={600} letterSpacing='0.06em'>
                {activeH.tk}
              </text>
              <text x={CX} y={CY + 2} textAnchor='middle' fontSize={9.5}
                fill='var(--cy-data)' fontFamily='Inter,system-ui,sans-serif' fontWeight={800}>
                {$K(activeH.value)}
              </text>
              <text x={CX} y={CY + 13} textAnchor='middle' fontSize={7.5}
                fill={activeH.color} fontFamily='Inter,system-ui,sans-serif' fontWeight={700}>
                {(activeH.frac * 100).toFixed(1)}%
              </text>
            </> : <>
              <text x={CX} y={CY - 7} textAnchor='middle' fontSize={7}
                fill='var(--vlt-text-muted)' fontFamily='Inter,system-ui,sans-serif' letterSpacing='0.07em' fontWeight={600}>
                TOTAL
              </text>
              <text x={CX} y={CY + 5} textAnchor='middle' fontSize={10.5}
                fill='var(--cy-data)' fontFamily='Inter,system-ui,sans-serif' fontWeight={800}>
                {$K(total)}
              </text>
            </>}
          </svg>
        </div>

        {/* Legend */}
        <div className='dh-port-leg'>
          {holdings.map(h => {
            const flashDir = h.tk !== 'CASH' ? flash[h.tk] : null
            const pct = (h.value / total) * 100
            return (
              <div key={h.tk} className={`dh-port-row${hovered === h.tk ? ' hov' : ''}`}
                onMouseEnter={() => setHovered(h.tk)}
                onMouseLeave={() => setHovered(null)}>
                <span className='dh-port-dot' style={{ background:h.color, boxShadow:`0 0 5px ${h.color}60` }}/>
                <span className='dh-port-tk'>{h.tk}</span>
                <div className='dh-port-bar-wrap'>
                  <div className='dh-port-bar' style={{ width:`${pct * 2.5}%`, background:h.color, boxShadow:`0 0 6px ${h.color}50` }}/>
                </div>
                <span key={`${h.tk}-${flashDir}`} className={`dh-port-val${flashDir ? ` flash-${flashDir}` : ''}`}>
                  {$K(h.value)}
                </span>
                <span className='dh-port-pct' style={{ color:h.color }}>{pct.toFixed(1)}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ORDER BOOK -- simulated bid/ask depth, ticks with prices
═══════════════════════════════════════════════════════════════ */
function OrderBook({ prices, flash }) {
  const [sym, setSym]   = useState('AAPL')
  const [book, setBook] = useState(() => makeBook(BASE_PRICES.AAPL, false))
  const prevSym         = useRef('AAPL')

  /* Regenerate book whenever price ticks or symbol changes */
  useEffect(() => {
    const isCrypto = sym === 'BTC' || sym === 'ETH'
    setBook(makeBook(prices[sym], isCrypto))
  }, [prices[sym], sym]) // eslint-disable-line

  const isCrypto = sym === 'BTC' || sym === 'ETH'
  const mid      = prices[sym]
  const fmtP     = (p) => isCrypto ? p.toLocaleString('en-US', { maximumFractionDigits:0 }) : p.toFixed(2)
  const fmtS     = (s) => s >= 1000 ? `${(s/1000).toFixed(1)}K` : `${s}`
  const bidColor = '#00C076'; const askColor = '#FF3D57'

  return (
    <div className='dh-p dh-ob'>
      <div className='dh-ph'>
        <div className='dh-ptw'>
          <BookOpen size={13} weight='duotone' className='dh-pico'/>
          <span className='dh-ptitle'>Order Book</span>
        </div>
        <div className='dh-ob-tabs'>
          {OB_SYMBOLS.map(s => (
            <button key={s} className={`dh-ob-tab${sym === s ? ' on' : ''}`} onClick={() => setSym(s)}>{s}</button>
          ))}
        </div>
      </div>

      <div className='dh-ob-body'>
        {/* Column headers */}
        <div className='dh-ob-hdr'>
          <span>Price</span>
          <span>Size</span>
          <span>Depth</span>
        </div>

        {/* Asks -- reversed so highest ask is top */}
        <div className='dh-ob-asks'>
          {[...book.asks].reverse().map((row, i) => (
            <div key={i} className='dh-ob-row ask'>
              <span className='dh-ob-price ask'>{fmtP(row.price)}</span>
              <span className='dh-ob-size'>{fmtS(row.size)}</span>
              <div className='dh-ob-depth'>
                <div className='dh-ob-fill ask'
                  style={{ width:`${(row.total / book.maxVol) * 100}%` }}/>
              </div>
            </div>
          ))}
        </div>

        {/* Spread row */}
        <div className='dh-ob-spread'>
          <span key={`mid-${flash[sym]}`} className={`dh-ob-mid${flash[sym] ? ` flash-${flash[sym]}` : ''}`}>
            {fmtP(mid)}
          </span>
          <span className='dh-ob-spreadval'>Spread {book.spread}</span>
        </div>

        {/* Bids */}
        <div className='dh-ob-bids'>
          {book.bids.map((row, i) => (
            <div key={i} className='dh-ob-row bid'>
              <span className='dh-ob-price bid'>{fmtP(row.price)}</span>
              <span className='dh-ob-size'>{fmtS(row.size)}</span>
              <div className='dh-ob-depth'>
                <div className='dh-ob-fill bid'
                  style={{ width:`${(row.total / book.maxVol) * 100}%` }}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   WATCHLIST
═══════════════════════════════════════════════════════════════ */
function WatchlistPanel({ prices, flash }) {
  const navigate = useNavigate()
  return (
    <div className='dh-p dh-watch'>
      <div className='dh-ph'>
        <div className='dh-ptw'>
          <Star size={13} weight='duotone' className='dh-pico'/>
          <span className='dh-ptitle'>Watchlist</span>
        </div>
        <button className='dh-btn-ghost' onClick={() => navigate('markets')}>
          Markets <ArrowUpRight size={10} weight='bold'/>
        </button>
      </div>
      <div className='dh-wl'>
        {WATCH_BASE.map((item, i) => {
          const tc       = TC[item.tk] || '#8A96B4'
          const live     = prices[item.tk] ?? item.basePrice
          const pct      = ((live - item.basePrice) / item.basePrice) * 100
          const up       = pct >= 0
          const flashDir = flash[item.tk]
          const fmtd     = item.tk === 'BTC' || item.tk === 'ETH'
            ? `$${Math.round(live).toLocaleString()}`
            : `$${live.toFixed(2)}`
          return (
            <div key={item.tk} className='dh-wi' style={{ animationDelay:`${i * 40}ms` }}>
              <div className='dh-wb' style={{ background:`${tc}1c`, color:tc }}>{item.tk.slice(0, 2)}</div>
              <div className='dh-wif'>
                <span className='dh-wtk'>{item.tk}</span>
                <span className='dh-wn'>{item.name}</span>
              </div>
              <Spark d={item.sp} up={up}/>
              <div className='dh-wpr'>
                <span key={`${item.tk}-${flashDir}`} className={`dh-wpv${flashDir ? ` flash-${flashDir}` : ''}`}>{fmtd}</span>
                <span className={`dh-wpc ${up ? 'up' : 'dn'}`}>
                  {up ? <ArrowUpRight size={9} weight='bold'/> : <ArrowDownRight size={9} weight='bold'/>}
                  {Math.abs(pct).toFixed(2)}%
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
   DASHBOARD HOME -- orchestrator
═══════════════════════════════════════════════════════════════ */
export default function DashboardHome() {
  const { user, isDark } = useOutletContext() ?? {}
  const fn = user?.firstName || 'Investor'

  const [prices, setPrices]       = useState({ ...BASE_PRICES })
  const [flash,  setFlash]        = useState({})
  const [portVal, setPortVal]     = useState(0)
  const [invested, setInvested]   = useState(0)
  const [portFlash, setPortFlash] = useState(null)
  const [candles, setCandles]     = useState(BASE_CANDLES)
  const [perfTab, setPerfTab]     = useState('All')
  const [liveSummary, setLiveSummary] = useState(null)

  // All figures come from DB -- zero for new users
  useEffect(() => {
    apiGet('/api/portfolio/summary')
      .then(data => {
        setLiveSummary(data)
        const totalVal = Number(data.cash_balance || 0) + Number(data.total_invested || 0)
        setInvested(Number(data.total_invested || 0))
        setPortVal(totalVal)
      })
      .catch(() => {})
  }, [])

  const canvasRef = useRef(null)
  const card0Ref  = useRef(null)
  const { spawn } = useParticles(canvasRef)

  /* ─ Poll simulation -- every 2.8s ─ */
  useEffect(() => {
    const poll = () => {
      setPrices(prev => {
        const next     = { ...prev }
        const newFlash = {}
        const vols = { AAPL:0.0006, NVDA:0.0011, BTC:0.0018, ETH:0.0015, MSFT:0.0007, SPY:0.0004, VIX:0.002 }
        Object.keys(next).forEach(k => {
          const p = tickPrice(prev[k], BASE_PRICES[k], vols[k] ?? 0.0008)
          if (Math.abs(p - prev[k]) > prev[k] * 0.00015) newFlash[k] = p > prev[k] ? 'up' : 'dn'
          next[k] = p
        })
        /* Update forming candle */
        setCandles(old => {
          const arr = [...old]; const last = { ...arr[arr.length - 1] }
          last.c = next.AAPL; last.h = Math.max(last.h, next.AAPL); last.l = Math.min(last.l, next.AAPL)
          arr[arr.length - 1] = last; return arr
        })
        /* Update portfolio value -- only if user has holdings */
        const aaplDelta = (next.AAPL - prev.AAPL) / prev.AAPL
        setPortVal(v => {
          if (v === 0) return 0  // new user, no holdings
          const newV = v * (1 + aaplDelta * 1.4)
          const dir  = newV > v ? 'up' : 'dn'
          if (Math.abs(aaplDelta) > 0.0004) {
            setPortFlash(dir); setTimeout(() => setPortFlash(null), 800)
            setTimeout(() => spawn(card0Ref.current, dir === 'up'), 40)
          }
          return Math.max(0, newV)
        })
        if (Object.keys(newFlash).length) { setFlash(newFlash); setTimeout(() => setFlash({}), 700) }
        return next
      })
    }
    const id = setInterval(poll, 2800); return () => clearInterval(id)
  }, [spawn])

  const liveInvested   = liveSummary ? Number(liveSummary.total_invested   || 0) : invested
  const liveCash       = liveSummary ? Number(liveSummary.cash_balance      || 0) : 0
  const liveOpenPos    = liveSummary ? Number(liveSummary.open_positions    || 0) : 0
  const liveRealisedPnl = liveSummary ? Number(liveSummary.total_realised_pnl || 0) : 0
  const dayPnl  = portVal - liveInvested
  const dayPct  = liveInvested > 0 ? (dayPnl / liveInvested) * 100 : 0
  const totPct  = liveInvested > 0 ? ((portVal - liveInvested) / liveInvested) * 100 : 0
  const portFmt = $K(portVal)
  const aaplLive = prices.AAPL
  const aaplPct  = ((aaplLive - BASE_PRICES.AAPL) / BASE_PRICES.AAPL) * 100

  return (
    <div className='dh-root'>
      <canvas ref={canvasRef} className='dh-canvas'/>

      {/* Status bar */}
      <StatusBar prices={prices} flash={flash}/>

      {/* Top bar */}
      <div className='dh-top'>
        <div>
          <h1 className='dh-title'>Portfolio Overview</h1>
          <p className='dh-sub'>Good {tod()}, {fn} -- here's your market snapshot.</p>
        </div>
        <nav className='dh-bc'>
          <span>Veltro</span><CaretRight size={9}/>
          <span>Dashboards</span><CaretRight size={9}/>
          <span className='act'>Overview</span>
        </nav>
      </div>

      {/* Stat cards */}
      <div className='dh-stats'>
        <StatCard cardRef={card0Ref} label='Portfolio Value' value={portFmt} pct={totPct}
          sub={liveInvested > 0 ? `vs. ${$K(liveInvested)} invested` : 'No holdings yet'} Icon={Wallet} up={portVal >= liveInvested} delay={0} flashDir={portFlash}/>
        <StatCard label='Open Positions' value={String(liveOpenPos)} pct={0} sub='active holdings'
          Icon={Briefcase} up={liveOpenPos > 0} delay={55}/>
        <StatCard label="Today's P&L" value={`${liveRealisedPnl >= 0 ? '+' : ''}${$K(Math.abs(liveRealisedPnl))}`} pct={Math.abs(dayPct)} sub='Realised P&L'
          Icon={ChartLineUp} up={liveRealisedPnl >= 0} delay={110} flashDir={portFlash}/>
        <StatCard label='Win Rate' value={liveOpenPos > 0 ? '--' : '--'} pct={0} sub='no trades yet'
          Icon={Target} up delay={165}/>
      </div>

      {/* Charts row */}
      <div className='dh-charts'>
        {/* LEFT -- portfolio performance bars */}
        <div className='dh-p dh-cpanel'>
          <div className='dh-chead'>
            <div>
              <div className='dh-ptw'>
                <TrendUp size={13} weight='duotone' className='dh-pico'/>
                <span className='dh-ptitle'>Portfolio Statistics</span>
              </div>
              <div className='dh-chero'>
                <span key={portFmt} className={`dh-cval${portFlash ? ` flash-${portFlash}` : ''}`}>{portFmt}</span>
                <span className={`dh-cpct ${totPct >= 0 ? 'up' : 'dn'}`}>{pf(totPct)}</span>
              </div>
              <p className='dh-clab'>{liveInvested > 0 ? 'Total portfolio value · all time' : 'Deposit funds to begin'}</p>
            </div>
            <div className='dh-tabs'>
              {['1Y','3Y','All'].map(t => (
                <button key={t} className={`dh-tab${perfTab === t ? ' on' : ''}`}
                  onClick={() => setPerfTab(t)}>{t}</button>
              ))}
            </div>
          </div>
          <div className='dh-cbody'><PerfBars data={BARS[perfTab]} isDark={isDark}/></div>
        </div>

        {/* RIGHT -- live candlestick */}
        <div className='dh-p dh-cpanel dh-cspanel'>
          <div className='dh-chead'>
            <div className='dh-ptw'>
              <Lightning size={13} weight='duotone' className='dh-pico'/>
              <span className='dh-ptitle'>Live Market -- AAPL</span>
            </div>
            <div className='dh-forming-badge'>
              <span style={{ display:'inline-block', width:5, height:5, borderRadius:'50%',
                background:'var(--cy-neon)', animation:'live-pulse 1.9s ease infinite' }}/>
              FORMING
            </div>
          </div>
          <div className='dh-csmini'>
            <div className='dh-csm'>
              <span className='dh-csml'>Portfolio</span>
              <span key={portFmt} className={`dh-csmv${portFlash ? ` flash-${portFlash}` : ''}`}>{portFmt}</span>
              <span className={`dh-csmc ${dayPnl >= 0 ? 'up' : 'dn'}`}>
                {dayPnl >= 0 ? <ArrowUpRight size={9} weight='bold'/> : <ArrowDownRight size={9} weight='bold'/>}
                {Math.abs(dayPct).toFixed(2)}%
              </span>
            </div>
            <div className='dh-csmd'/>
            <div className='dh-csm'>
              <span className='dh-csml'>AAPL</span>
              <span key={`aapl-${flash.AAPL}`} className={`dh-csmv${flash.AAPL ? ` flash-${flash.AAPL}` : ''}`}>
                ${aaplLive.toFixed(2)}
              </span>
              <span className={`dh-csmc ${aaplPct >= 0 ? 'up' : 'dn'}`}>
                {aaplPct >= 0 ? <ArrowUpRight size={9} weight='bold'/> : <ArrowDownRight size={9} weight='bold'/>}
                {Math.abs(aaplPct).toFixed(2)}%
              </span>
            </div>
          </div>
          <div className='dh-csbody'><Candlestick candles={candles} isDark={isDark}/></div>
        </div>
      </div>

      {/* Bottom row -- Portfolio Breakdown · Watchlist · Order Book */}
      <div className='dh-bottom'>
        <PortfolioBreakdown prices={prices} flash={flash}/>
        <WatchlistPanel prices={prices} flash={flash}/>
        <OrderBook prices={prices} flash={flash}/>
      </div>

    </div>
  )
}