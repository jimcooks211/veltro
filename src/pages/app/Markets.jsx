import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import {
  MagnifyingGlass, CaretRight, CaretUp, CaretDown,
  ArrowUpRight, ArrowDownRight, Star, X,
  TrendUp, Globe, Cpu, CurrencyBtc, Buildings,
  Heartbeat, Leaf, ArrowsLeftRight, CaretUpDown,
  Fire, ShieldCheck, Lightning, ChartLine,
} from '@phosphor-icons/react'
import './Markets.css'

/* ═══════════════════════════════════════════════════════════════
   ASSET DATABASE -- 40 instruments
═══════════════════════════════════════════════════════════════ */
const ASSETS_RAW = [
  { sym:'AAPL',    name:'Apple Inc.',          cat:'stock',  sector:'Technology',  mktCap:2940, baseP:189.42, avgVol:68.2,  color:'#1A56FF', vol:0.0006 },
  { sym:'MSFT',    name:'Microsoft Corp.',     cat:'stock',  sector:'Technology',  mktCap:3120, baseP:432.10, avgVol:22.4,  color:'#00D4FF', vol:0.0006 },
  { sym:'NVDA',    name:'NVIDIA Corp.',        cat:'stock',  sector:'Technology',  mktCap:2180, baseP:124.80, avgVol:412.8, color:'#00C076', vol:0.0011 },
  { sym:'GOOGL',   name:'Alphabet Inc.',       cat:'stock',  sector:'Technology',  mktCap:2010, baseP:174.50, avgVol:24.6,  color:'#FFB800', vol:0.0007 },
  { sym:'META',    name:'Meta Platforms',      cat:'stock',  sector:'Technology',  mktCap:1430, baseP:590.30, avgVol:18.9,  color:'#1A56FF', vol:0.0008 },
  { sym:'AMZN',    name:'Amazon.com Inc.',     cat:'stock',  sector:'Consumer',    mktCap:2100, baseP:229.40, avgVol:38.1,  color:'#F7931A', vol:0.0007 },
  { sym:'TSLA',    name:'Tesla Inc.',          cat:'stock',  sector:'Consumer',    mktCap:820,  baseP:258.10, avgVol:112.4, color:'#FF3D57', vol:0.0014 },
  { sym:'JPM',     name:'JPMorgan Chase',      cat:'stock',  sector:'Financials',  mktCap:720,  baseP:245.80, avgVol:11.2,  color:'#C9A84C', vol:0.0006 },
  { sym:'V',       name:'Visa Inc.',           cat:'stock',  sector:'Financials',  mktCap:610,  baseP:332.40, avgVol:6.8,   color:'#00D4FF', vol:0.0005 },
  { sym:'JNJ',     name:'Johnson & Johnson',   cat:'stock',  sector:'Healthcare',  mktCap:380,  baseP:157.20, avgVol:7.4,   color:'#00E676', vol:0.0005 },
  { sym:'UNH',     name:'UnitedHealth Group',  cat:'stock',  sector:'Healthcare',  mktCap:470,  baseP:541.30, avgVol:4.2,   color:'#A855F7', vol:0.0006 },
  { sym:'XOM',     name:'ExxonMobil Corp.',    cat:'stock',  sector:'Energy',      mktCap:495,  baseP:110.40, avgVol:16.8,  color:'#FF8C42', vol:0.0007 },
  { sym:'BAC',     name:'Bank of America',     cat:'stock',  sector:'Financials',  mktCap:315,  baseP:40.80,  avgVol:42.1,  color:'#C9A84C', vol:0.0007 },
  { sym:'WMT',     name:'Walmart Inc.',        cat:'stock',  sector:'Consumer',    mktCap:790,  baseP:98.20,  avgVol:12.3,  color:'#00C076', vol:0.0005 },
  { sym:'LLY',     name:'Eli Lilly and Co.',   cat:'stock',  sector:'Healthcare',  mktCap:742,  baseP:800.20, avgVol:3.1,   color:'#A855F7', vol:0.0007 },
  { sym:'HD',      name:'Home Depot Inc.',     cat:'stock',  sector:'Consumer',    mktCap:330,  baseP:418.60, avgVol:4.6,   color:'#FF8C42', vol:0.0006 },
  { sym:'CVX',     name:'Chevron Corp.',       cat:'stock',  sector:'Energy',      mktCap:262,  baseP:157.40, avgVol:11.4,  color:'#FF8C42', vol:0.0006 },
  { sym:'ABBV',    name:'AbbVie Inc.',         cat:'stock',  sector:'Healthcare',  mktCap:315,  baseP:186.40, avgVol:7.8,   color:'#A855F7', vol:0.0006 },
  { sym:'MRK',     name:'Merck & Co.',         cat:'stock',  sector:'Healthcare',  mktCap:276,  baseP:107.80, avgVol:9.1,   color:'#00E676', vol:0.0006 },
  { sym:'PG',      name:'Procter & Gamble',    cat:'stock',  sector:'Consumer',    mktCap:380,  baseP:162.80, avgVol:8.2,   color:'#1A56FF', vol:0.0004 },
  /* ── CRYPTO ── */
  { sym:'BTC',     name:'Bitcoin',             cat:'crypto', sector:'Crypto',      mktCap:1340, baseP:67420,  avgVol:38200, color:'#F7931A', vol:0.0018 },
  { sym:'ETH',     name:'Ethereum',            cat:'crypto', sector:'Crypto',      mktCap:387,  baseP:3210,   avgVol:18400, color:'#627EEA', vol:0.0015 },
  { sym:'SOL',     name:'Solana',              cat:'crypto', sector:'Crypto',      mktCap:82,   baseP:178.40, avgVol:4820,  color:'#9945FF', vol:0.0022 },
  { sym:'BNB',     name:'BNB',                 cat:'crypto', sector:'Crypto',      mktCap:87,   baseP:590.20, avgVol:2100,  color:'#F0B90B', vol:0.0016 },
  { sym:'XRP',     name:'XRP',                 cat:'crypto', sector:'Crypto',      mktCap:74,   baseP:1.28,   avgVol:8400,  color:'#00AAE4', vol:0.002  },
  { sym:'DOGE',    name:'Dogecoin',            cat:'crypto', sector:'Crypto',      mktCap:26,   baseP:0.18,   avgVol:2840,  color:'#C3A634', vol:0.003  },
  { sym:'ADA',     name:'Cardano',             cat:'crypto', sector:'Crypto',      mktCap:22,   baseP:0.64,   avgVol:1240,  color:'#0033AD', vol:0.0025 },
  { sym:'AVAX',    name:'Avalanche',           cat:'crypto', sector:'Crypto',      mktCap:16,   baseP:42.80,  avgVol:920,   color:'#E84142', vol:0.0025 },
  /* ── ETFs ── */
  { sym:'SPY',     name:'SPDR S&P 500 ETF',    cat:'etf',    sector:'Index',       mktCap:554,  baseP:548.20, avgVol:68.4,  color:'#1A56FF', vol:0.0004 },
  { sym:'QQQ',     name:'Invesco QQQ Trust',   cat:'etf',    sector:'Index',       mktCap:278,  baseP:480.30, avgVol:42.1,  color:'#00D4FF', vol:0.0005 },
  { sym:'IWM',     name:'iShares Russell 2000',cat:'etf',    sector:'Index',       mktCap:72,   baseP:210.40, avgVol:28.2,  color:'#C9A84C', vol:0.0006 },
  { sym:'GLD',     name:'SPDR Gold Shares',    cat:'etf',    sector:'Commodity',   mktCap:68,   baseP:218.60, avgVol:12.8,  color:'#FFD700', vol:0.0005 },
  { sym:'VTI',     name:'Vanguard Total Mkt',  cat:'etf',    sector:'Index',       mktCap:424,  baseP:286.40, avgVol:8.6,   color:'#1A56FF', vol:0.0004 },
  { sym:'ARKK',    name:'ARK Innovation ETF',  cat:'etf',    sector:'Innovation',  mktCap:8,    baseP:48.20,  avgVol:32.4,  color:'#00C076', vol:0.0016 },
  /* ── FOREX ── */
  { sym:'EUR/USD', name:'Euro / US Dollar',    cat:'forex',  sector:'Forex',       mktCap:null, baseP:1.0842, avgVol:null,  color:'#1A56FF', vol:0.0003 },
  { sym:'GBP/USD', name:'British Pound / USD', cat:'forex',  sector:'Forex',       mktCap:null, baseP:1.2634, avgVol:null,  color:'#C9A84C', vol:0.0003 },
  { sym:'USD/JPY', name:'US Dollar / Yen',     cat:'forex',  sector:'Forex',       mktCap:null, baseP:149.82, avgVol:null,  color:'#FF8C42', vol:0.0002 },
  { sym:'USD/CHF', name:'US Dollar / Franc',   cat:'forex',  sector:'Forex',       mktCap:null, baseP:0.8924, avgVol:null,  color:'#00E676', vol:0.0002 },
  { sym:'AUD/USD', name:'Aus Dollar / USD',    cat:'forex',  sector:'Forex',       mktCap:null, baseP:0.6512, avgVol:null,  color:'#A855F7', vol:0.0003 },
  { sym:'NZD/USD', name:'NZ Dollar / USD',     cat:'forex',  sector:'Forex',       mktCap:null, baseP:0.5984, avgVol:null,  color:'#00D4FF', vol:0.0003 },
]

const INDICES_BASE = [
  { sym:'S&P 500', val:5842.10, vol:0.00035 },
  { sym:'NASDAQ',  val:19284.40, vol:0.0004 },
  { sym:'DOW',     val:43142.80, vol:0.0003 },
  { sym:'VIX',     val:14.32,   vol:0.002   },
  { sym:'10Y',     val:4.284,   vol:0.001   },
]

const SECTORS = ['All','Technology','Crypto','Financials','Healthcare','Consumer','Energy','Index','Forex','Commodity']
const CAT_TABS = ['All','Stocks','Crypto','ETFs','Forex']
const SECTOR_ICONS = {
  Technology:Cpu, Crypto:CurrencyBtc, Financials:Buildings,
  Healthcare:Heartbeat, Consumer:ShieldCheck, Energy:Leaf,
  Index:Globe, Forex:ArrowsLeftRight, Commodity:Globe, All:Globe,
}

/* ─ PRNG for sparklines ─ */
function rng(seed) {
  let s = (seed>>>0)||1
  return () => { s^=s<<13; s^=s>>17; s^=s<<5; return (s>>>0)/0xffffffff }
}
function makeSpark(base, sym) {
  const r = rng(sym.split('').reduce((a,c)=>a+c.charCodeAt(0),0))
  const pts = [base]
  for (let i=1; i<24; i++) pts.push(pts[i-1]*(1+(r()-0.492)*0.019))
  return pts
}
const SPARKS = Object.fromEntries(ASSETS_RAW.map(a=>[a.sym, makeSpark(a.baseP, a.sym)]))

/* ─ Tick price -- drift back to base ─ */
function tickPrice(cur, base, vol) {
  const drift = (base - cur) * 0.0015
  const noise = (Math.random() - 0.499) * cur * vol
  return Math.max(cur * 0.88, cur + drift + noise)
}

/* ─ Formatters ─ */
const fmtPrice = (p, sym) => {
  if (!p) return '--'
  if (sym?.includes('/')) return p.toFixed(4)
  if (p >= 10000) return `$${p.toLocaleString('en-US',{maximumFractionDigits:0})}`
  if (p >= 100)   return `$${p.toFixed(2)}`
  if (p >= 1)     return `$${p.toFixed(2)}`
  return `$${p.toFixed(4)}`
}
const fmtCap = b => !b ? '--' : b>=1000 ? `$${(b/1000).toFixed(2)}T` : `$${b.toFixed(0)}B`
const fmtVol = (v,cat) => !v ? '--' : cat==='crypto' ? `$${(v/1000).toFixed(1)}B` : `${v.toFixed(1)}M`

/* ═══════════════════════════════════════════════════════════════
   TIERED FLASH LOGIC
   move < 0.04%  → colour transition only (CSS var swap)
   move 0.04-0.1% → subtle glow pulse
   move > 0.1%  → full keyframe flash
═══════════════════════════════════════════════════════════════ */
function flashTier(delta, price) {
  const pct = Math.abs(delta / price) * 100
  if (pct < 0.04) return null          // CSS transition handles it
  if (pct < 0.1)  return delta > 0 ? 'glow-up' : 'glow-dn'
  return delta > 0 ? 'flash-up' : 'flash-dn'
}

/* ═══════════════════════════════════════════════════════════════
   MINI SPARKLINE
═══════════════════════════════════════════════════════════════ */
function Spark({ d, up, w=62, h=26 }) {
  const mn = Math.min(...d), mx = Math.max(...d), rn = mx-mn||1
  const col = up ? '#00C076' : '#FF3D57'
  const pts = d.map((v,i)=>`${(i/(d.length-1))*w},${h-((v-mn)/rn)*(h-2)+1}`).join(' ')
  const id  = `sg${up?'u':'d'}${w}`
  return (
    <svg width={w} height={h} style={{overflow:'visible',display:'block',flexShrink:0}}>
      <defs>
        <linearGradient id={id} x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0%'   stopColor={col} stopOpacity={0.22}/>
          <stop offset='100%' stopColor={col} stopOpacity={0}/>
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${id})`}/>
      <polyline points={pts} fill='none' stroke={col} strokeWidth={1.6}
        strokeLinejoin='round' strokeLinecap='round'/>
      <circle cx={(d.length-1)/(d.length-1)*w} cy={h-((d[d.length-1]-mn)/rn)*(h-2)+1}
        r={2.2} fill={col} style={{filter:`drop-shadow(0 0 3px ${col})`}}/>
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════════════
   INDEX BAR -- live ticking major indices
═══════════════════════════════════════════════════════════════ */
function IndexBar({ indices, flash }) {
  return (
    <div className='mk-idxbar'>
      {indices.map((idx,i) => {
        const base = INDICES_BASE[i]
        const pct  = ((idx.val - base.val) / base.val) * 100
        const up   = pct >= 0
        const tier = flash[idx.sym]
        const isYield = idx.sym === '10Y'
        return (
          <div key={idx.sym} className={`mk-idx-item${tier?' '+tier:''}`}>
            <div className='mk-idx-left'>
              <span className='mk-idx-sym'>{idx.sym}</span>
              {isYield && <span className='mk-idx-badge'>YIELD</span>}
            </div>
            <div className='mk-idx-right'>
              <span className={`mk-idx-val${tier?' '+tier:''}`}>
                {isYield ? `${idx.val.toFixed(3)}%` : idx.sym==='VIX'
                  ? idx.val.toFixed(2)
                  : idx.val.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}
              </span>
              <span className={`mk-idx-chg ${up?'up':'dn'}`}>
                {up?<ArrowUpRight size={9} weight='bold'/>:<ArrowDownRight size={9} weight='bold'/>}
                {Math.abs(pct).toFixed(2)}%
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   DETAIL PANEL
═══════════════════════════════════════════════════════════════ */
function DetailPanel({ asset, prices, watchlist, onToggleWatch, onClose }) {
  const navigate = useNavigate()
  const price    = prices[asset.sym] ?? asset.baseP
  const pct      = ((price - asset.baseP) / asset.baseP) * 100
  const up       = pct >= 0
  const sp       = SPARKS[asset.sym] ?? []
  const inWatch  = watchlist.has(asset.sym)

  /* stable random stats seeded to asset */
  const r = rng(asset.sym.split('').reduce((a,c)=>a+c.charCodeAt(0),0)+77)
  const dayHi  = price * (1 + r() * 0.009)
  const dayLo  = price * (1 - r() * 0.009)
  const prevCl = asset.baseP * (1 + (r()-0.5)*0.006)
  const openP  = asset.baseP * (1 + (r()-0.5)*0.004)

  const stats = [
    { label:'Open',      val: fmtPrice(openP, asset.sym)   },
    { label:'Prev Close',val: fmtPrice(prevCl, asset.sym)  },
    { label:'Day High',  val: fmtPrice(dayHi,  asset.sym)  },
    { label:'Day Low',   val: fmtPrice(dayLo,  asset.sym)  },
    { label:'Mkt Cap',   val: fmtCap(asset.mktCap)         },
    { label:'Avg Volume',val: fmtVol(asset.avgVol,asset.cat) },
  ]

  /* 52w range */
  const wk52lo = asset.baseP * 0.74
  const wk52hi = asset.baseP * 1.38
  const rangePct = ((price - wk52lo) / (wk52hi - wk52lo)) * 100

  return (
    <aside className='mk-detail mk-detail-appear'>

      {/* head */}
      <div className='mk-detail-head'>
        <div className='mk-detail-id'>
          <div className='mk-detail-badge' style={{background:`${asset.color}1a`,color:asset.color}}>
            {asset.sym.includes('/') ? asset.sym.split('/')[0].slice(0,2) : asset.sym.slice(0,2)}
          </div>
          <div>
            <div className='mk-detail-sym'>{asset.sym}</div>
            <div className='mk-detail-name'>{asset.name}</div>
          </div>
        </div>
        <button className='mk-detail-close' onClick={onClose}><X size={13} weight='bold'/></button>
      </div>

      {/* live price */}
      <div className='mk-detail-price-block'>
        <span className='mk-detail-pval'>{fmtPrice(price, asset.sym)}</span>
        <div className={`mk-detail-ppct ${up?'up':'dn'}`}>
          {up?<ArrowUpRight size={11} weight='bold'/>:<ArrowDownRight size={11} weight='bold'/>}
          {Math.abs(pct).toFixed(2)}%
        </div>
        <div className='mk-detail-cat-tags'>
          <span className='mk-detail-tag' style={{color:asset.color,borderColor:`${asset.color}30`,background:`${asset.color}10`}}>
            {asset.cat.toUpperCase()}
          </span>
          <span className='mk-detail-tag'>{asset.sector}</span>
        </div>
      </div>

      {/* sparkline enlarged */}
      <div className='mk-detail-spark'>
        {sp.length > 1 && <Spark d={sp} up={up} w={228} h={68}/>}
        <div className='mk-detail-spark-axis'>
          <span>7D</span>
          <span className={up?'up':'dn'}>{up?'+':''}{pct.toFixed(2)}%</span>
        </div>
      </div>

      {/* 52w range bar */}
      <div className='mk-detail-range'>
        <div className='mk-detail-range-hdr'>
          <span>52-Week Range</span>
          <span className='mk-detail-range-cur'>{fmtPrice(price, asset.sym)}</span>
        </div>
        <div className='mk-detail-rangebar'>
          <div className='mk-detail-rangefill' style={{width:`${Math.min(100,Math.max(0,rangePct))}%`}}>
            <div className='mk-detail-rangedot' style={{background:asset.color,boxShadow:`0 0 6px ${asset.color}`}}/>
          </div>
        </div>
        <div className='mk-detail-range-labels'>
          <span>{fmtPrice(wk52lo, asset.sym)}</span>
          <span>{fmtPrice(wk52hi, asset.sym)}</span>
        </div>
      </div>

      {/* stats grid */}
      <div className='mk-detail-grid'>
        {stats.map(s => (
          <div key={s.label} className='mk-detail-stat'>
            <span className='mk-detail-slabel'>{s.label}</span>
            <span className='mk-detail-sval'>{s.val}</span>
          </div>
        ))}
      </div>

      {/* actions */}
      <div className='mk-detail-actions'>
        <button className='mk-btn-buy' onClick={()=>navigate('trade')}>Buy {asset.sym}</button>
        <button className='mk-btn-sell' onClick={()=>navigate('trade')}>Sell</button>
        <button className={`mk-btn-watch ${inWatch?'on':''}`} onClick={()=>onToggleWatch(asset.sym)}>
          <Star size={13} weight={inWatch?'fill':'duotone'}/>
        </button>
      </div>
    </aside>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MARKETS PAGE
═══════════════════════════════════════════════════════════════ */
export default function Markets() {
  const { user, isDark } = useOutletContext() ?? {}
  const navigate = useNavigate()

  /* ── state ── */
  const [prices,   setPrices]   = useState(()=>Object.fromEntries(ASSETS_RAW.map(a=>[a.sym,a.baseP])))
  const [indices,  setIndices]  = useState(()=>INDICES_BASE.map(i=>({...i})))
  const [flash,    setFlash]    = useState({})      // keyed by sym → tier class
  const [idxFlash, setIdxFlash] = useState({})
  const [search,   setSearch]   = useState('')
  const [cat,      setCat]      = useState('All')
  const [sector,   setSector]   = useState('All')
  const [sortCol,  setSortCol]  = useState('mktCap')
  const [sortDir,  setSortDir]  = useState('desc')
  const [selected, setSelected] = useState(null)
  const [watchlist,setWatchlist]= useState(new Set(['AAPL','BTC','NVDA']))
  const [time,     setTime]     = useState(()=>new Date())
  const prevPrices              = useRef(Object.fromEntries(ASSETS_RAW.map(a=>[a.sym,a.baseP])))
  const flashTimers             = useRef({})
  const searchRef               = useRef(null)

  /* ── clock ── */
  useEffect(()=>{ const t=setInterval(()=>setTime(new Date()),1000); return ()=>clearInterval(t) },[])

  /* ─────────────────────────────────────────────────────────
     TIERED POLLING -- staggered by asset class
     crypto: 1.6s  |  stocks: 2.8s  |  etfs: 3.4s  |  forex: 4.8s
     indices: 2.2s
  ───────────────────────────────────────────────────────── */
  useEffect(()=>{
    const intervals = []

    const pollGroup = (syms, interval) => {
      const id = setInterval(()=>{
        setPrices(prev=>{
          const next = {...prev}
          const newFlash = {}
          syms.forEach(sym=>{
            const asset  = ASSETS_RAW.find(a=>a.sym===sym)
            if (!asset) return
            const np     = tickPrice(prev[sym], asset.baseP, asset.vol)
            const delta  = np - prev[sym]
            const tier   = flashTier(delta, prev[sym])
            if (tier) newFlash[sym] = tier
            next[sym] = np
          })
          /* apply flash -- clear each sym independently after 750ms */
          Object.entries(newFlash).forEach(([sym, tier])=>{
            clearTimeout(flashTimers.current[sym])
            setFlash(f=>({...f,[sym]:tier}))
            flashTimers.current[sym] = setTimeout(()=>{
              setFlash(f=>{ const n={...f}; delete n[sym]; return n })
            }, 750)
          })
          prevPrices.current = {...prevPrices.current, ...next}
          return next
        })
      }, interval + Math.random()*300) // jitter
      intervals.push(id)
    }

    /* group by class */
    const cryptoSyms = ASSETS_RAW.filter(a=>a.cat==='crypto').map(a=>a.sym)
    const stockSyms  = ASSETS_RAW.filter(a=>a.cat==='stock').map(a=>a.sym)
    const etfSyms    = ASSETS_RAW.filter(a=>a.cat==='etf').map(a=>a.sym)
    const forexSyms  = ASSETS_RAW.filter(a=>a.cat==='forex').map(a=>a.sym)

    pollGroup(cryptoSyms, 1600)
    pollGroup(stockSyms,  2800)
    pollGroup(etfSyms,    3400)
    pollGroup(forexSyms,  4800)

    /* indices */
    const idxId = setInterval(()=>{
      setIndices(prev=>prev.map((idx,i)=>{
        const base = INDICES_BASE[i]
        const np   = tickPrice(idx.val, base.val, base.vol)
        const delta = np - idx.val
        const tier = flashTier(delta, idx.val)
        if (tier) {
          setIdxFlash(f=>({...f,[idx.sym]:tier}))
          setTimeout(()=>setIdxFlash(f=>{ const n={...f}; delete n[idx.sym]; return n }),700)
        }
        return {...idx, val:np}
      }))
    }, 2200+Math.random()*400)
    intervals.push(idxId)

    return ()=>{ intervals.forEach(clearInterval); Object.values(flashTimers.current).forEach(clearTimeout) }
  },[])

  /* ── handlers ── */
  const handleSort = useCallback((col)=>{
    setSortCol(c=>{ if(c===col){setSortDir(d=>d==='asc'?'desc':'asc'); return c} setSortDir('desc'); return col })
  },[])

  const toggleWatch = useCallback((sym)=>{
    setWatchlist(prev=>{ const n=new Set(prev); n.has(sym)?n.delete(sym):n.add(sym); return n })
  },[])

  const selectRow = useCallback((row)=>{
    setSelected(s=>s?.sym===row.sym?null:row)
  },[])

  /* ── computed rows ── */
  const rows = useMemo(()=>{
    let list = ASSETS_RAW.map(a=>({
      ...a,
      price: prices[a.sym]??a.baseP,
      pct:   ((prices[a.sym]??a.baseP)-a.baseP)/a.baseP*100,
      flash: flash[a.sym]??null,
    }))
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(a=>a.sym.toLowerCase().includes(q)||a.name.toLowerCase().includes(q))
    }
    const catMap = {Stocks:'stock',Crypto:'crypto',ETFs:'etf',Forex:'forex'}
    if (cat!=='All') list=list.filter(a=>a.cat===catMap[cat])
    if (sector!=='All') list=list.filter(a=>a.sector===sector)
    list.sort((a,b)=>{
      const getV = x => sortCol==='sym'?x.sym : sortCol==='price'?x.price : sortCol==='pct'?x.pct : sortCol==='mktCap'?(x.mktCap??-1) : sortCol==='vol'?(x.avgVol??-1) : (x.mktCap??-1)
      const [av,bv]=[getV(a),getV(b)]
      if (av<bv) return sortDir==='asc'?-1:1
      if (av>bv) return sortDir==='asc'?1:-1
      return 0
    })
    return list
  },[prices,flash,search,cat,sector,sortCol,sortDir])

  /* ── top movers ── */
  const movers = useMemo(()=>[...ASSETS_RAW]
    .filter(a=>a.cat!=='forex')
    .map(a=>({...a,pct:((prices[a.sym]??a.baseP)-a.baseP)/a.baseP*100}))
    .sort((a,b)=>Math.abs(b.pct)-Math.abs(a.pct))
    .slice(0,6)
  ,[prices])

  const SortIcon = ({col})=>sortCol!==col
    ? <CaretUpDown size={9} style={{opacity:0.3}}/>
    : sortDir==='asc'
      ? <CaretUp size={9} style={{color:'var(--cy-neon)'}}/>
      : <CaretDown size={9} style={{color:'var(--cy-neon)'}}/>

  const isOpen=()=>{const h=time.getHours(),m=time.getMinutes(),d=time.getDay();return d>=1&&d<=5&&(h*60+m)>=570&&(h*60+m)<960}
  const mktOpen=isOpen(); const dotCol=mktOpen?'var(--cy-neon)':'#FF3D57'

  return (
    <div className='mk-root'>

      {/* ── INDEX BAR ── */}
      <IndexBar indices={indices} flash={idxFlash}/>

      {/* ── TOP BAR ── */}
      <div className='mk-top'>
        <div>
          <h1 className='mk-title'>Markets</h1>
          <div className='mk-meta'>
            <div className='mk-live-dot' style={{background:dotCol,boxShadow:`0 0 6px ${dotCol}`}}/>
            <span className='mk-live-label' style={{color:dotCol}}>{mktOpen?'LIVE':'CLOSED'}</span>
            <span className='mk-divider'/>
            <span className='mk-clock'>
              {time.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'})} EST
            </span>
            <span className='mk-divider'/>
            <span className='mk-count'>{rows.length} of {ASSETS_RAW.length} instruments</span>
          </div>
        </div>
        <nav className='mk-bc'>
          <span>Veltro</span><CaretRight size={9}/>
          <span>Dashboards</span><CaretRight size={9}/>
          <span className='act'>Markets</span>
        </nav>
      </div>

      {/* ── BODY ── */}
      <div className={`mk-body${selected?' has-detail':''}`}>

        {/* LEFT SIDEBAR */}
        <aside className='mk-sidebar'>

          {/* Sectors */}
          <div className='mk-side-panel'>
            <div className='mk-side-head'>
              <Globe size={11} weight='duotone' style={{color:'var(--cy-neon)'}}/>
              <span>Sectors</span>
            </div>
            <div className='mk-sector-list'>
              {SECTORS.map(s=>{
                const Icon  = SECTOR_ICONS[s]||Globe
                const count = s==='All'?ASSETS_RAW.length:ASSETS_RAW.filter(a=>a.sector===s).length
                return (
                  <button key={s} className={`mk-sector-btn${sector===s?' on':''}`} onClick={()=>setSector(s)}>
                    <Icon size={11} weight='duotone'/>
                    <span>{s}</span>
                    <span className='mk-sector-count'>{count}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Top movers */}
          <div className='mk-side-panel'>
            <div className='mk-side-head'>
              <Fire size={11} weight='duotone' style={{color:'#FF6B42'}}/>
              <span>Top Movers</span>
            </div>
            <div className='mk-movers-list'>
              {movers.map(m=>{
                const up=m.pct>=0
                return (
                  <div key={m.sym} className={`mk-mover-row${selected?.sym===m.sym?' sel':''}`}
                    onClick={()=>selectRow(m)}>
                    <div className='mk-mover-badge' style={{background:`${m.color}1a`,color:m.color}}>
                      {m.sym.slice(0,2)}
                    </div>
                    <div className='mk-mover-info'>
                      <span className='mk-mover-sym'>{m.sym}</span>
                      <span className='mk-mover-name'>{m.name.split(' ')[0]}</span>
                    </div>
                    <div className='mk-mover-right'>
                      <span className={`mk-mover-pct ${up?'up':'dn'}`}>{up?'+':''}{m.pct.toFixed(2)}%</span>
                      <Spark d={SPARKS[m.sym]??[]} up={up} w={32} h={14}/>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <div className='mk-main'>

          {/* Search + tabs */}
          <div className='mk-controls'>
            <div className='mk-search-wrap'>
              <MagnifyingGlass size={13} className='mk-search-ico' weight='bold'/>
              <input ref={searchRef} className='mk-search' placeholder='Search symbol or name...'
                value={search} onChange={e=>setSearch(e.target.value)}/>
              {search && (
                <button className='mk-search-clear' onClick={()=>{setSearch('');searchRef.current?.focus()}}>
                  <X size={11} weight='bold'/>
                </button>
              )}
            </div>
            <div className='mk-cat-tabs'>
              {CAT_TABS.map(t=>(
                <button key={t} className={`mk-cat-tab${cat===t?' on':''}`} onClick={()=>setCat(t)}>{t}</button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className='mk-tbl-wrap'>
            <table className='mk-tbl'>
              <thead>
                <tr>
                  <th className='mk-th mk-th-fav'/>
                  <th className='mk-th mk-th-asset' onClick={()=>handleSort('sym')}>
                    <span>Asset <SortIcon col='sym'/></span>
                  </th>
                  <th className='mk-th mk-th-price' onClick={()=>handleSort('price')}>
                    <span>Price <SortIcon col='price'/></span>
                  </th>
                  <th className='mk-th mk-th-chg' onClick={()=>handleSort('pct')}>
                    <span>24h Change <SortIcon col='pct'/></span>
                  </th>
                  <th className='mk-th mk-th-cap' onClick={()=>handleSort('mktCap')}>
                    <span>Mkt Cap <SortIcon col='mktCap'/></span>
                  </th>
                  <th className='mk-th mk-th-vol' onClick={()=>handleSort('vol')}>
                    <span>Volume <SortIcon col='vol'/></span>
                  </th>
                  <th className='mk-th mk-th-spark'>7D Chart</th>
                  <th className='mk-th mk-th-action'/>
                </tr>
              </thead>
              <tbody>
                {rows.map((row,idx)=>{
                  const up    = row.pct >= 0
                  const isSel = selected?.sym === row.sym
                  const inW   = watchlist.has(row.sym)
                  const sp    = SPARKS[row.sym]??[]
                  return (
                    <tr key={row.sym}
                      className={`mk-tr${isSel?' sel':''}${row.flash?' '+row.flash:''}`}
                      style={{animationDelay:`${Math.min(idx*8,240)}ms`}}
                      onClick={()=>selectRow(row)}>

                      {/* star */}
                      <td className='mk-td mk-td-fav' onClick={e=>{e.stopPropagation();toggleWatch(row.sym)}}>
                        <Star size={12} weight={inW?'fill':'duotone'} style={{color:inW?'#FFB800':'var(--vlt-text-muted)',opacity:inW?1:0.38,transition:'color 0.2s,opacity 0.2s'}}/>
                      </td>

                      {/* asset */}
                      <td className='mk-td mk-td-asset'>
                        <div className='mk-asset-cell'>
                          <div className='mk-asset-badge' style={{background:`${row.color}18`,color:row.color}}>
                            {row.sym.includes('/')?row.sym.split('/')[0].slice(0,2):row.sym.slice(0,2)}
                          </div>
                          <div className='mk-asset-info'>
                            <span className='mk-asset-sym'>{row.sym}</span>
                            <span className='mk-asset-name'>{row.name}</span>
                          </div>
                        </div>
                      </td>

                      {/* price */}
                      <td className='mk-td mk-td-price'>
                        <span className={`mk-price-val ${row.flash||''}`}>
                          {fmtPrice(row.price, row.sym)}
                        </span>
                      </td>

                      {/* change */}
                      <td className='mk-td mk-td-chg'>
                        <span className={`mk-chg-pill ${up?'up':'dn'}`}>
                          {up?<ArrowUpRight size={9} weight='bold'/>:<ArrowDownRight size={9} weight='bold'/>}
                          {up?'+':''}{row.pct.toFixed(2)}%
                        </span>
                      </td>

                      {/* mktcap */}
                      <td className='mk-td mk-td-r'>{fmtCap(row.mktCap)}</td>

                      {/* volume */}
                      <td className='mk-td mk-td-r mk-td-muted'>{fmtVol(row.avgVol,row.cat)}</td>

                      {/* spark */}
                      <td className='mk-td mk-td-spark'>
                        {sp.length>1&&<Spark d={sp} up={up}/>}
                      </td>

                      {/* action */}
                      <td className='mk-td mk-td-action' onClick={e=>e.stopPropagation()}>
                        <button className='mk-trade-btn' onClick={()=>navigate('trade')}>Trade</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {rows.length===0&&(
              <div className='mk-empty'>
                <MagnifyingGlass size={30} weight='duotone' style={{opacity:0.2}}/>
                <p>No instruments match your filters</p>
                <button className='mk-empty-reset' onClick={()=>{setSearch('');setCat('All');setSector('All')}}>
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* DETAIL PANEL */}
        {selected&&(
          <DetailPanel
            key={selected.sym}
            asset={selected}
            prices={prices}
            watchlist={watchlist}
            onToggleWatch={toggleWatch}
            onClose={()=>setSelected(null)}
          />
        )}
      </div>
    </div>
  )
}