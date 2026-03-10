import { useState, useMemo, useCallback } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  Briefcase, CaretRight, CaretUp, CaretDown, CaretUpDown,
  Eye, EyeSlash, Lightning, TrendUp, TrendDown,
  ChartPieSlice, ChartLineUp, Wallet, ArrowRight,
  Buildings, Cpu, Heartbeat, Leaf, Globe, ArrowUp, ArrowDown,
} from '@phosphor-icons/react'
import './Portfolio.css'

/* ════════════════════════════════════════════════════════
   DB-ALIGNED MOCK DATA
   ─ wallets:   balance, reserved, currency
   ─ portfolio: quantity, avg_cost, total_invested,
                realised_pnl, first_bought_at
   ─ stocks:    symbol, name, exchange, sector, industry,
                last_price, prev_close, day_high, day_low,
                volume, market_cap, pe_ratio,
                week_52_high, week_52_low
════════════════════════════════════════════════════════ */
const WALLET = {
  balance:  12_450.38,
  reserved:  1_840.00,    // funds locked in open orders
  currency: 'USD',
}

const RAW_HOLDINGS = [
  {
    // portfolio row
    stock_id:'s1', quantity:14, avg_cost:168.42, total_invested:2_357.88,
    realised_pnl:0, first_bought_at:'Jan 15, 2024',
    // stocks join
    symbol:'AAPL', name:'Apple Inc.',        exchange:'NASDAQ', sector:'Technology',
    industry:'Consumer Electronics',
    last_price:189.42, prev_close:186.80, day_high:191.20, day_low:186.10,
    volume:68_200_000, market_cap:2_940_000_000_000,
    pe_ratio:29.4, week_52_high:199.62, week_52_low:164.08, color:'#1A56FF',
  },
  {
    stock_id:'s2', quantity:22, avg_cost:108.30, total_invested:2_382.60,
    realised_pnl:362.00, first_bought_at:'Mar 2, 2024',
    symbol:'NVDA', name:'NVIDIA Corp.',       exchange:'NASDAQ', sector:'Technology',
    industry:'Semiconductors',
    last_price:124.80, prev_close:128.90, day_high:129.40, day_low:123.60,
    volume:412_800_000, market_cap:2_180_000_000_000,
    pe_ratio:65.2, week_52_high:153.13, week_52_low:47.32, color:'#00C076',
  },
  {
    stock_id:'s3', quantity:7.5, avg_cost:385.00, total_invested:2_887.50,
    realised_pnl:188.50, first_bought_at:'Nov 8, 2023',
    symbol:'MSFT', name:'Microsoft Corp.',    exchange:'NASDAQ', sector:'Technology',
    industry:'Software',
    last_price:432.10, prev_close:435.20, day_high:437.00, day_low:430.40,
    volume:22_400_000, market_cap:3_120_000_000_000,
    pe_ratio:36.1, week_52_high:468.35, week_52_low:366.50, color:'#00D4FF',
  },
  {
    stock_id:'s4', quantity:9, avg_cost:220.10, total_invested:1_980.90,
    realised_pnl:75.60, first_bought_at:'Feb 20, 2024',
    symbol:'JPM',  name:'JPMorgan Chase',     exchange:'NYSE',   sector:'Financials',
    industry:'Diversified Banks',
    last_price:245.80, prev_close:244.10, day_high:247.30, day_low:243.50,
    volume:11_200_000, market_cap:720_000_000_000,
    pe_ratio:12.3, week_52_high:260.00, week_52_low:182.10, color:'#C9A84C',
  },
  {
    stock_id:'s5', quantity:4, avg_cost:510.00, total_invested:2_040.00,
    realised_pnl:142.00, first_bought_at:'Dec 3, 2023',
    symbol:'META', name:'Meta Platforms',     exchange:'NASDAQ', sector:'Technology',
    industry:'Interactive Media',
    last_price:590.30, prev_close:582.40, day_high:595.10, day_low:580.20,
    volume:18_900_000, market_cap:1_430_000_000_000,
    pe_ratio:27.8, week_52_high:638.40, week_52_low:393.05, color:'#627EEA',
  },
  {
    stock_id:'s6', quantity:16, avg_cost:115.20, total_invested:1_843.20,
    realised_pnl:-76.80, first_bought_at:'Apr 5, 2024',
    symbol:'XOM',  name:'ExxonMobil Corp.',   exchange:'NYSE',   sector:'Energy',
    industry:'Oil & Gas',
    last_price:110.40, prev_close:111.80, day_high:112.50, day_low:109.80,
    volume:16_800_000, market_cap:495_000_000_000,
    pe_ratio:14.1, week_52_high:126.34, week_52_low:95.77, color:'#FF8C42',
  },
  {
    stock_id:'s7', quantity:11, avg_cost:163.40, total_invested:1_797.40,
    realised_pnl:-68.20, first_bought_at:'Jun 11, 2024',
    symbol:'JNJ',  name:'Johnson & Johnson',  exchange:'NYSE',   sector:'Healthcare',
    industry:'Pharmaceuticals',
    last_price:157.20, prev_close:158.90, day_high:159.70, day_low:156.40,
    volume:7_400_000, market_cap:380_000_000_000,
    pe_ratio:17.6, week_52_high:175.97, week_52_low:143.13, color:'#00E676',
  },
  {
    stock_id:'s8', quantity:20, avg_cost:91.50, total_invested:1_830.00,
    realised_pnl:134.00, first_bought_at:'Aug 22, 2024',
    symbol:'WMT',  name:'Walmart Inc.',       exchange:'NYSE',   sector:'Consumer',
    industry:'Hypermarkets & Super Centers',
    last_price:98.20, prev_close:97.40, day_high:99.10, day_low:97.00,
    volume:12_300_000, market_cap:790_000_000_000,
    pe_ratio:31.5, week_52_high:105.31, week_52_low:60.53, color:'#FFB800',
  },
]

/* Derived computed fields (what the frontend calculates from DB data) */
const POSITIONS = RAW_HOLDINGS.map(h => {
  const market_value   = +(h.quantity * h.last_price).toFixed(2)
  const unrealised_pnl = +(market_value - h.total_invested).toFixed(2)
  const unrealised_pct = +((unrealised_pnl / h.total_invested) * 100).toFixed(2)
  const day_pnl        = +((h.last_price - h.prev_close) * h.quantity).toFixed(2)
  const day_pct        = +(((h.last_price - h.prev_close) / h.prev_close) * 100).toFixed(2)
  const vs_52wk_high   = +(((h.last_price - h.week_52_high) / h.week_52_high) * 100).toFixed(1)
  const vs_52wk_low    = +(((h.last_price - h.week_52_low)  / h.week_52_low)  * 100).toFixed(1)
  return { ...h, market_value, unrealised_pnl, unrealised_pct, day_pnl, day_pct, vs_52wk_high, vs_52wk_low }
})

/* Portfolio-level aggregates */
const TOTAL_VALUE    = POSITIONS.reduce((s, p) => s + p.market_value,   0)
const TOTAL_INVESTED = POSITIONS.reduce((s, p) => s + p.total_invested, 0)
const UNREAL_PNL     = +(TOTAL_VALUE - TOTAL_INVESTED).toFixed(2)
const REAL_PNL       = +POSITIONS.reduce((s, p) => s + p.realised_pnl, 0).toFixed(2)
const DAY_PNL        = +POSITIONS.reduce((s, p) => s + p.day_pnl,      0).toFixed(2)
const TOTAL_RETURN   = +((UNREAL_PNL / TOTAL_INVESTED) * 100).toFixed(2)
const NET_WORTH      = +(TOTAL_VALUE + WALLET.balance).toFixed(2)
const DAY_PCT        = +((DAY_PNL / (TOTAL_VALUE - DAY_PNL)) * 100).toFixed(2)

/* Sector breakdown */
const SECTOR_COLORS = { Technology:'#1A56FF', Financials:'#C9A84C', Healthcare:'#00E676', Energy:'#FF8C42', Consumer:'#FFB800' }
const SECTOR_ICONS  = { Technology:Cpu, Financials:Buildings, Healthcare:Heartbeat, Energy:Leaf, Consumer:Globe }
const SECTORS = Object.entries(
  POSITIONS.reduce((acc, p) => { acc[p.sector] = (acc[p.sector]||0) + p.market_value; return acc }, {})
).map(([s, v]) => ({ sector:s, value:v, pct:+((v/TOTAL_VALUE)*100).toFixed(1), color:SECTOR_COLORS[s]||'#627EEA' }))
  .sort((a,b) => b.value - a.value)

/* Synthetic 12-month NAV curve */
function genNAV() {
  const labels = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar']
  let v = TOTAL_INVESTED * 0.91
  return labels.map((m, i) => {
    v += (Math.random()-0.40) * v * 0.048
    if (i === labels.length-1) v = TOTAL_VALUE
    return { m, v:+v.toFixed(2) }
  })
}
const NAV_CHART = genNAV()

/* ─── helpers ─── */
const f2  = n => Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})
const fM  = n => n>=1e12?`$${(n/1e12).toFixed(2)}T`:n>=1e9?`$${(n/1e9).toFixed(1)}B`:`$${(n/1e6).toFixed(0)}M`
const sgn = n => n>=0?'+':''

function NAVTip({active,payload}) {
  if(!active||!payload?.length) return null
  return <div className="pf-tip"><span>${f2(payload[0]?.value)}</span></div>
}

function PieLbl({cx,cy,midAngle,innerRadius,outerRadius,pct}) {
  if(pct<7) return null
  const R=Math.PI/180, r=innerRadius+(outerRadius-innerRadius)*0.55
  return <text x={cx+r*Math.cos(-midAngle*R)} y={cy+r*Math.sin(-midAngle*R)}
    fill="#fff" textAnchor="middle" dominantBaseline="central"
    style={{fontSize:9,fontWeight:800,fontFamily:'DM Mono,monospace'}}>{pct.toFixed(0)}%</text>
}

/* ════════════════════════════════════════════════════════
   SORT BUTTON
════════════════════════════════════════════════════════ */
function SortBtn({label,field,sk,sd,onSort}) {
  const on = sk===field
  return (
    <button className={`pf-th-btn ${on?'active':''}`} onClick={()=>onSort(field)}>
      {label}
      {on ? (sd==='desc'?<CaretDown size={8} weight="bold"/>:<CaretUp size={8} weight="bold"/>)
           : <CaretUpDown size={8} weight="bold" style={{opacity:.3}}/>}
    </button>
  )
}

/* ════════════════════════════════════════════════════════
   ROOT
════════════════════════════════════════════════════════ */
export default function Portfolio() {
  useOutletContext?.()
  const navigate = useNavigate()
  const [hidden,  setHidden]  = useState(false)
  const [sk,      setSk]      = useState('market_value')
  const [sd,      setSd]      = useState('desc')
  const [tab,     setTab]     = useState('holdings')

  const sorted = useMemo(()=>[...POSITIONS].sort((a,b)=>{
    const r = typeof a[sk]==='number' ? a[sk]-b[sk] : String(a[sk]).localeCompare(String(b[sk]))
    return sd==='asc'?r:-r
  }),[sk,sd])

  const sort = useCallback(k=>{
    setSk(k); setSd(s=>k===sk?(s==='desc'?'asc':'desc'):'desc')
  },[sk])

  const H  = v => hidden ? '——' : v
  const hMin = Math.min(...NAV_CHART.map(d=>d.v))*0.97
  const hMax = Math.max(...NAV_CHART.map(d=>d.v))*1.015
  const navUp = UNREAL_PNL >= 0

  return (
    <div className="pf-root">

      {/* ── PAGE HEADER ── */}
      <div className="pf-hdr">
        <div className="pf-hdr-left">
          <div className="pf-hdr-ico"><Briefcase size={16} weight="fill"/></div>
          <div>
            <h1 className="pf-hdr-title">Portfolio</h1>
            <p className="pf-hdr-sub">Holdings · Allocation · Performance</p>
          </div>
        </div>
        <div className="pf-hdr-right">
          <button className="pf-btn ghost" onClick={()=>setHidden(h=>!h)}>
            {hidden?<Eye size={12} weight="bold"/>:<EyeSlash size={12} weight="bold"/>}
            {hidden?'Show':'Hide'}
          </button>
          <button className="pf-btn primary" onClick={()=>navigate('../trade')}>
            <Lightning size={12} weight="bold"/>Trade
          </button>
        </div>
        <nav className="pf-bc">
          <span>Dashboard</span><CaretRight size={9}/><span className="pf-bc-c">Portfolio</span>
        </nav>
      </div>

      {/* ── HERO WEALTH STRIP ── */}
      <div className="pf-hero">
        <div className="pf-hero-nw">
          <span className="pf-hero-label">Total Net Worth</span>
          <div className="pf-hero-big">{hidden?'$ ———':(<><span className="pf-hero-curr">$</span>{(NET_WORTH).toLocaleString('en-US',{minimumFractionDigits:2})}</>)}</div>
          <div className={`pf-hero-day ${DAY_PNL>=0?'g':'r'}`}>
            {DAY_PNL>=0?<ArrowUp size={11} weight="bold"/>:<ArrowDown size={11} weight="bold"/>}
            {sgn(DAY_PNL)}${f2(Math.abs(DAY_PNL))} &nbsp;·&nbsp; {sgn(DAY_PCT)}{Math.abs(DAY_PCT).toFixed(2)}% today
          </div>
        </div>

        <div className="pf-hero-grid">
          {[
            { label:'Portfolio Value',  v:H(`$${f2(TOTAL_VALUE)}`),          c:'var(--cy-neon,#00FFD1)' },
            { label:'Total Invested',   v:H(`$${f2(TOTAL_INVESTED)}`),        c:'var(--vlt-text-secondary)' },
            { label:'Unrealised P&L',   v:H(`${sgn(UNREAL_PNL)}$${f2(Math.abs(UNREAL_PNL))}`), c:UNREAL_PNL>=0?'#00C076':'#FF3D57' },
            { label:'Realised P&L',     v:H(`${sgn(REAL_PNL)}$${f2(Math.abs(REAL_PNL))}`),   c:REAL_PNL>=0?'#00C076':'#FF3D57' },
            { label:'Total Return',     v:H(`${sgn(TOTAL_RETURN)}${Math.abs(TOTAL_RETURN).toFixed(2)}%`), c:TOTAL_RETURN>=0?'#00C076':'#FF3D57' },
            { label:'Cash Available',   v:H(`$${f2(WALLET.balance)}`),        c:'#FFB800' },
            { label:'Reserved (Orders)',v:H(`$${f2(WALLET.reserved)}`),       c:'rgba(255,255,255,.45)' },
            { label:'Open Positions',   v:String(POSITIONS.length),           c:'var(--vlt-text-primary)' },
          ].map(s=>(
            <div key={s.label} className="pf-stat">
              <span className="pf-stat-l">{s.label}</span>
              <span className="pf-stat-v" style={{color:s.c}}>{s.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── CHARTS ROW ── */}
      <div className="pf-charts">
        {/* NAV Performance */}
        <div className="pf-card pf-nav-card">
          <div className="pf-card-top">
            <span className="pf-card-title"><ChartLineUp size={13} weight="duotone"/>Performance (12M)</span>
            <span className="pf-return-badge" style={{color:navUp?'#00C076':'#FF3D57',background:navUp?'rgba(0,192,118,.1)':'rgba(255,61,87,.1)'}}>
              {sgn(TOTAL_RETURN)}{Math.abs(TOTAL_RETURN).toFixed(2)}% all-time
            </span>
          </div>
          <div className="pf-nav-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={NAV_CHART} margin={{top:10,right:4,bottom:0,left:0}}>
                <defs>
                  <linearGradient id="pf-ng" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={navUp?'#00C076':'#FF3D57'} stopOpacity={.3}/>
                    <stop offset="100%" stopColor={navUp?'#00C076':'#FF3D57'} stopOpacity={.01}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="m" axisLine={false} tickLine={false}
                  tick={{fontSize:9,fill:'rgba(255,255,255,.3)',fontFamily:'DM Mono,monospace'}}/>
                <YAxis domain={[hMin,hMax]} hide/>
                <Tooltip content={<NAVTip/>}/>
                <Area type="monotone" dataKey="v"
                  stroke={navUp?'#00C076':'#FF3D57'} strokeWidth={1.8}
                  fill="url(#pf-ng)" dot={false} activeDot={{r:3,strokeWidth:0}}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sector Allocation */}
        <div className="pf-card pf-sector-card">
          <div className="pf-card-top">
            <span className="pf-card-title"><ChartPieSlice size={13} weight="duotone"/>Sector Allocation</span>
          </div>
          <div className="pf-sector-body">
            <div className="pf-pie-wrap">
              <PieChart width={136} height={136}>
                <Pie data={SECTORS} dataKey="value" cx="50%" cy="50%"
                  innerRadius={36} outerRadius={60}
                  labelLine={false} label={PieLbl}
                  animationBegin={0} animationDuration={700}>
                  {SECTORS.map((s,i)=><Cell key={i} fill={s.color} stroke="rgba(4,9,20,.6)" strokeWidth={2}/>)}
                </Pie>
              </PieChart>
              <div className="pf-pie-ctr">
                <span className="pf-pie-n">{POSITIONS.length}</span>
                <span className="pf-pie-l">stocks</span>
              </div>
            </div>
            <div className="pf-sector-list">
              {SECTORS.map(s=>{
                const Icon = SECTOR_ICONS[s.sector]||Globe
                return (
                  <div key={s.sector} className="pf-sector-row">
                    <span className="pf-sect-dot" style={{background:s.color}}/>
                    <Icon size={10} weight="duotone" style={{color:s.color,flexShrink:0}}/>
                    <span className="pf-sect-name">{s.sector}</span>
                    <span className="pf-sect-pct">{s.pct}%</span>
                    <span className="pf-sect-val">${f2(s.value)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── HOLDINGS PANEL ── */}
      <div className="pf-panel">
        <div className="pf-tabs">
          {[{id:'holdings',label:'Holdings',count:POSITIONS.length},{id:'activity',label:'Recent Trades'}].map(t=>(
            <button key={t.id} className={`pf-tab ${tab===t.id?'on':''}`} onClick={()=>setTab(t.id)}>
              {t.label}{t.count!=null&&<span className="pf-tab-badge">{t.count}</span>}
            </button>
          ))}
        </div>

        {tab==='holdings' && (
          <div className="pf-tbl-wrap">
            {/* Table head */}
            <div className="pf-thead">
              <SortBtn label="Asset"           field="symbol"        sk={sk} sd={sd} onSort={sort}/>
              <SortBtn label="Last Price"      field="last_price"    sk={sk} sd={sd} onSort={sort}/>
              <SortBtn label="Day"             field="day_pct"       sk={sk} sd={sd} onSort={sort}/>
              <SortBtn label="Shares"          field="quantity"      sk={sk} sd={sd} onSort={sort}/>
              <SortBtn label="Avg Cost"        field="avg_cost"      sk={sk} sd={sd} onSort={sort}/>
              <SortBtn label="Market Value"    field="market_value"  sk={sk} sd={sd} onSort={sort}/>
              <SortBtn label="Unrealised P&L"  field="unrealised_pnl"sk={sk} sd={sd} onSort={sort}/>
              <SortBtn label="Return"          field="unrealised_pct"sk={sk} sd={sd} onSort={sort}/>
              <SortBtn label="P/E"             field="pe_ratio"      sk={sk} sd={sd} onSort={sort}/>
              <div className="pf-th-btn">52W Range</div>
              <div className="pf-th-btn">Weight</div>
              <div className="pf-th-btn">Action</div>
            </div>

            {/* Rows */}
            <div className="pf-tbody">
              {sorted.map((p,i)=>{
                const wt = (p.market_value/TOTAL_VALUE)*100
                const rangePct = ((p.last_price-p.week_52_low)/(p.week_52_high-p.week_52_low))*100
                return (
                  <div key={p.stock_id} className="pf-trow" style={{animationDelay:`${i*25}ms`}}>
                    {/* Asset */}
                    <div className="pf-cell-asset">
                      <div className="pf-logo" style={{background:`${p.color}15`,color:p.color}}>
                        {p.symbol.slice(0,2)}
                      </div>
                      <div>
                        <div className="pf-sym">{p.symbol}</div>
                        <div className="pf-name">{p.exchange}</div>
                      </div>
                    </div>
                    {/* Last price */}
                    <div className="pf-cell-num">${f2(p.last_price)}</div>
                    {/* Day */}
                    <div className={`pf-cell-chg ${p.day_pct>=0?'g':'r'}`}>
                      {p.day_pct>=0?<CaretUp size={8} weight="fill"/>:<CaretDown size={8} weight="fill"/>}
                      {Math.abs(p.day_pct).toFixed(2)}%
                    </div>
                    {/* Shares */}
                    <div className="pf-cell-num">{p.quantity % 1===0?p.quantity:p.quantity.toFixed(3)}</div>
                    {/* Avg cost */}
                    <div className="pf-cell-num">${f2(p.avg_cost)}</div>
                    {/* Market value */}
                    <div className="pf-cell-num bold">{H(`$${f2(p.market_value)}`)}</div>
                    {/* Unrealised P&L */}
                    <div className={`pf-cell-pnl ${p.unrealised_pnl>=0?'g':'r'}`}>
                      {H(`${sgn(p.unrealised_pnl)}$${f2(Math.abs(p.unrealised_pnl))}`)}
                    </div>
                    {/* Return % */}
                    <div className={`pf-cell-ret ${p.unrealised_pct>=0?'g':'r'}`}>
                      {sgn(p.unrealised_pct)}{Math.abs(p.unrealised_pct).toFixed(2)}%
                    </div>
                    {/* P/E */}
                    <div className="pf-cell-num dim">{p.pe_ratio?.toFixed(1)??'N/A'}</div>
                    {/* 52W Range */}
                    <div className="pf-cell-range">
                      <div className="pf-range-track">
                        <div className="pf-range-fill" style={{width:`${Math.max(0,Math.min(100,rangePct))}%`,background:p.color}}/>
                        <div className="pf-range-knob" style={{left:`${Math.max(0,Math.min(100,rangePct))}%`,background:p.color}}/>
                      </div>
                    </div>
                    {/* Weight */}
                    <div className="pf-cell-weight">
                      <div className="pf-wt-track">
                        <div className="pf-wt-fill" style={{width:`${wt}%`,background:p.color}}/>
                      </div>
                      <span>{wt.toFixed(1)}%</span>
                    </div>
                    {/* Action */}
                    <div className="pf-cell-act">
                      <button className="pf-act-buy"  onClick={()=>navigate('../trade')}>Buy</button>
                      <button className="pf-act-sell" onClick={()=>navigate('../trade')}>Sell</button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer totals */}
            <div className="pf-tfoot">
              <span className="pf-tfoot-label">Total Portfolio</span>
              <span/><span/><span/><span/>
              <span className="pf-tfoot-val">{H(`$${f2(TOTAL_VALUE)}`)}</span>
              <span className={`pf-tfoot-pnl ${UNREAL_PNL>=0?'g':'r'}`}>{H(`${sgn(UNREAL_PNL)}$${f2(Math.abs(UNREAL_PNL))}`)}</span>
              <span className={`pf-tfoot-ret ${TOTAL_RETURN>=0?'g':'r'}`}>{sgn(TOTAL_RETURN)}{Math.abs(TOTAL_RETURN).toFixed(2)}%</span>
              <span/><span/><span/><span/>
            </div>
          </div>
        )}

        {tab==='activity' && (
          <div className="pf-activity">
            {[
              {sym:'NVDA',side:'buy', qty:5,   price:108.30, total:541.50,  fee:0.54,  ts:'Mar 9 · 10:14',  realised:null    },
              {sym:'AAPL',side:'buy', qty:3,   price:168.42, total:505.26,  fee:0.51,  ts:'Mar 8 · 14:22',  realised:null    },
              {sym:'MSFT',side:'sell',qty:2.5, price:432.10, total:1080.25, fee:1.08,  ts:'Mar 7 · 09:55',  realised:+118.75 },
              {sym:'XOM', side:'buy', qty:8,   price:115.20, total:921.60,  fee:0.92,  ts:'Mar 5 · 15:40',  realised:null    },
              {sym:'META',side:'sell',qty:1,   price:590.30, total:590.30,  fee:0.59,  ts:'Mar 2 · 08:49',  realised:+80.30  },
              {sym:'WMT', side:'buy', qty:10,  price:91.50,  total:915.00,  fee:0.92,  ts:'Feb 28 · 11:03', realised:null    },
              {sym:'JPM', side:'buy', qty:4,   price:220.10, total:880.40,  fee:0.88,  ts:'Feb 26 · 16:30', realised:null    },
              {sym:'NVDA',side:'sell',qty:3,   price:124.80, total:374.40,  fee:0.37,  ts:'Feb 20 · 12:18', realised:+49.50  },
            ].map((t,i)=>{
              const pos = POSITIONS.find(p=>p.symbol===t.sym)
              return (
                <div key={i} className="pf-act-row">
                  <div className="pf-act-ico" style={{background:`${pos?.color}15`,color:pos?.color}}>
                    {t.sym.slice(0,2)}
                  </div>
                  <div className="pf-act-mid">
                    <span className="pf-act-sym">{t.sym}</span>
                    <span className="pf-act-detail">
                      {t.side==='buy'?'Bought':'Sold'} {t.qty} {t.qty===1?'share':'shares'} @ ${f2(t.price)}
                    </span>
                  </div>
                  <div className="pf-act-info">
                    <span className="pf-act-total">{H(`$${f2(t.total)}`)}</span>
                    <span className="pf-act-fee">Fee: ${t.fee.toFixed(4)}</span>
                  </div>
                  {t.realised!=null&&(
                    <span className={`pf-act-pnl ${t.realised>=0?'g':'r'}`}>
                      {t.realised>=0?'+':''}{H(`$${f2(Math.abs(t.realised))}`)}
                    </span>
                  )}
                  <span className={`pf-act-badge ${t.side}`}>
                    {t.side==='buy'?'↑ Buy':'↓ Sell'}
                  </span>
                  <span className="pf-act-ts">{t.ts}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}