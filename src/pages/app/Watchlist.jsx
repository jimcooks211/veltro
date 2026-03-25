import { useState, useMemo, useRef } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import {
  Star, CaretRight, CaretUp, CaretDown, X,
  MagnifyingGlass, Plus, Bell, BellSlash,
  TrendUp, TrendDown, Lightning, Trash,
  Check, Pencil, Warning, Buildings,
  Cpu, Heartbeat, Leaf, Globe, Funnel,
  ArrowsDownUp,
} from '@phosphor-icons/react'
import './Watchlist.css'

/* ════════════════════════════════════════════════════════
   DB-ALIGNED MOCK DATA
   ─ watchlist: { stock_id, notes, alert_above, alert_below, added_at }
   ─ stocks:    { symbol, name, exchange, sector, industry,
                  last_price, prev_close, day_high, day_low,
                  volume, market_cap, pe_ratio,
                  week_52_high, week_52_low, is_tradeable }
════════════════════════════════════════════════════════ */
function genSpark(base, n = 30) {
  let p = base
  return Array.from({length:n},(_,i)=>{
    p += (Math.random()-.47)*p*.009
    return {i, v:+p.toFixed(base>10?2:5)}
  })
}

const WATCHLIST_ROWS = [
  {
    id:'wl1', stock_id:'st1',
    notes:'Watching for breakout above $275 -- earnings catalyst expected Q2',
    alert_above:275, alert_below:240, added_at:'Jan 22, 2024',
    symbol:'TSLA', name:'Tesla Inc.',          exchange:'NASDAQ', sector:'Consumer',
    industry:'Electric Vehicles',
    last_price:258.10, prev_close:251.40, day_high:262.80, day_low:249.90,
    volume:112_400_000, market_cap:820_000_000_000, pe_ratio:56.2,
    week_52_high:299.29, week_52_low:138.80, is_tradeable:1, color:'#FF3D57',
  },
  {
    id:'wl2', stock_id:'st2',
    notes:'AWS growth + AI infrastructure spend -- long term hold candidate',
    alert_above:250, alert_below:210, added_at:'Feb 5, 2024',
    symbol:'AMZN', name:'Amazon.com Inc.',      exchange:'NASDAQ', sector:'Consumer',
    industry:'Internet & Catalog Retail',
    last_price:229.40, prev_close:232.10, day_high:233.00, day_low:226.50,
    volume:38_100_000, market_cap:2_100_000_000_000, pe_ratio:43.1,
    week_52_high:242.52, week_52_low:151.61, is_tradeable:1, color:'#F7931A',
  },
  {
    id:'wl3', stock_id:'st3',
    notes:'AI integration across Search, Cloud -- watching for multiple expansion',
    alert_above:185, alert_below:165, added_at:'Feb 14, 2024',
    symbol:'GOOGL', name:'Alphabet Inc.',       exchange:'NASDAQ', sector:'Technology',
    industry:'Internet Content & Services',
    last_price:174.50, prev_close:176.80, day_high:178.20, day_low:173.10,
    volume:24_600_000, market_cap:2_010_000_000_000, pe_ratio:23.8,
    week_52_high:207.05, week_52_low:130.67, is_tradeable:1, color:'#FFB800',
  },
  {
    id:'wl4', stock_id:'st4',
    notes:'Payments network moat + international expansion thesis',
    alert_above:345, alert_below:315, added_at:'Mar 1, 2024',
    symbol:'V',     name:'Visa Inc.',           exchange:'NYSE',   sector:'Financials',
    industry:'Transaction & Payment Processing',
    last_price:332.40, prev_close:330.00, day_high:334.60, day_low:328.90,
    volume:6_800_000,  market_cap:610_000_000_000,  pe_ratio:31.4,
    week_52_high:354.44, week_52_low:265.97, is_tradeable:1, color:'#00D4FF',
  },
  {
    id:'wl5', stock_id:'st5',
    notes:'GLP-1 / Zepbound revenue; strong pipeline -- watching for dip entry',
    alert_above:820, alert_below:750, added_at:'Mar 9, 2024',
    symbol:'LLY',   name:'Eli Lilly & Co.',     exchange:'NYSE',   sector:'Healthcare',
    industry:'Drug Manufacturers',
    last_price:790.20, prev_close:785.40, day_high:798.00, day_low:782.10,
    volume:3_100_000,  market_cap:751_000_000_000,  pe_ratio:68.4,
    week_52_high:972.53, week_52_low:659.00, is_tradeable:1, color:'#00E676',
  },
  {
    id:'wl6', stock_id:'st6',
    notes:'AI platform momentum -- AIP + Foundry enterprise deals accelerating',
    alert_above:28, alert_below:20, added_at:'Mar 9, 2024',
    symbol:'PLTR',  name:'Palantir Tech.',       exchange:'NYSE',   sector:'Technology',
    industry:'Software',
    last_price:24.80, prev_close:23.90, day_high:25.40, day_low:23.50,
    volume:82_300_000, market_cap:52_000_000_000,  pe_ratio:null,
    week_52_high:33.12, week_52_low:13.36, is_tradeable:1, color:'#9945FF',
  },
  {
    id:'wl7', stock_id:'st7',
    notes:'Password sharing + ad-tier scaling; price hikes sticking',
    alert_above:650, alert_below:590, added_at:'Feb 28, 2024',
    symbol:'NFLX',  name:'Netflix Inc.',         exchange:'NASDAQ', sector:'Consumer',
    industry:'Entertainment',
    last_price:628.50, prev_close:620.30, day_high:635.20, day_low:617.40,
    volume:5_600_000,  market_cap:273_000_000_000, pe_ratio:44.2,
    week_52_high:741.04, week_52_low:385.97, is_tradeable:1, color:'#FF0000',
  },
  {
    id:'wl8', stock_id:'st8',
    notes:null, alert_above:null, alert_below:null, added_at:'Mar 10, 2024',
    symbol:'COIN',  name:'Coinbase Global',      exchange:'NASDAQ', sector:'Financials',
    industry:'Financial Data & Stock Exchanges',
    last_price:218.40, prev_close:212.80, day_high:222.00, day_low:210.50,
    volume:14_200_000, market_cap:54_000_000_000,  pe_ratio:null,
    week_52_high:349.75, week_52_low:115.59, is_tradeable:1, color:'#1A56FF',
  },
]

/* Stocks that can be added (not already in watchlist) */
const ADD_CANDIDATES = [
  { stock_id:'ac1', symbol:'AMD',   name:'Advanced Micro',     sector:'Technology', industry:'Semiconductors',    last_price:172.60,  prev_close:174.30, color:'#00C076', market_cap:279_000_000_000,  pe_ratio:158  },
  { stock_id:'ac2', symbol:'SBUX',  name:'Starbucks Corp.',    sector:'Consumer',   industry:'Restaurants',       last_price:91.30,   prev_close:92.10,  color:'#00AA44', market_cap:104_000_000_000,  pe_ratio:28.7 },
  { stock_id:'ac3', symbol:'UNH',   name:'UnitedHealth Group', sector:'Healthcare', industry:'Managed Healthcare', last_price:541.30, prev_close:538.80, color:'#A855F7', market_cap:470_000_000_000,  pe_ratio:22.1 },
  { stock_id:'ac4', symbol:'BRK.B', name:'Berkshire Hathaway', sector:'Financials', industry:'Insurance',          last_price:464.20, prev_close:461.40, color:'#C9A84C', market_cap:680_000_000_000,  pe_ratio:null },
]

const SECTOR_ICONS  = { Technology:Cpu, Financials:Buildings, Healthcare:Heartbeat, Energy:Leaf, Consumer:Globe }
const fmtVol  = n => n>=1e9?`${(n/1e9).toFixed(1)}B`:n>=1e6?`${(n/1e6).toFixed(1)}M`:`${n}`
const fmtCap  = n => n>=1e12?`$${(n/1e12).toFixed(1)}T`:n>=1e9?`$${(n/1e9).toFixed(0)}B`:'--'
const fmtPx   = (n,base) => n?.toLocaleString('en-US',{minimumFractionDigits:base>100?2:base>1?2:4,maximumFractionDigits:base>100?2:base>1?2:4})||'--'

/* ════════════════════════════════════════════════════════
   ALERT MODAL
════════════════════════════════════════════════════════ */
function AlertModal({item, onClose, onSave}) {
  const [above, setAbove] = useState(item?.alert_above??'')
  const [below, setBelow] = useState(item?.alert_below??'')
  const [notes, setNotes] = useState(item?.notes??'')
  if(!item) return null
  const chg = ((item.last_price-item.prev_close)/item.prev_close*100).toFixed(2)
  return (
    <div className="wt-overlay" onClick={onClose}>
      <div className="wt-modal" onClick={e=>e.stopPropagation()}>
        <div className="wt-modal-hd">
          <div>
            <div className="wt-modal-sym">{item.symbol} <span className={`wt-modal-chg ${item.last_price>=item.prev_close?'g':'r'}`}>{item.last_price>=item.prev_close?'+':''}{chg}%</span></div>
            <div className="wt-modal-name">{item.name} · ${fmtPx(item.last_price,item.last_price)}</div>
          </div>
          <button className="wt-modal-x" onClick={onClose}><X size={12} weight="bold"/></button>
        </div>
        <div className="wt-modal-body">
          <div className="wt-modal-row">
            <label className="wt-modal-lbl up">↑ Alert above</label>
            <div className="wt-inp-wrap">
              <span className="wt-inp-pfx">$</span>
              <input className="wt-inp" type="number" placeholder={fmtPx(item.last_price*1.05,item.last_price)}
                value={above} onChange={e=>setAbove(e.target.value)}/>
            </div>
          </div>
          <div className="wt-modal-row">
            <label className="wt-modal-lbl dn">↓ Alert below</label>
            <div className="wt-inp-wrap">
              <span className="wt-inp-pfx">$</span>
              <input className="wt-inp" type="number" placeholder={fmtPx(item.last_price*0.95,item.last_price)}
                value={below} onChange={e=>setBelow(e.target.value)}/>
            </div>
          </div>
          <div className="wt-modal-row">
            <label className="wt-modal-lbl notes">Notes (optional)</label>
            <textarea className="wt-textarea" rows={2} maxLength={300} placeholder="Your thesis or reason for watching..."
              value={notes} onChange={e=>setNotes(e.target.value)}/>
          </div>
        </div>
        <div className="wt-modal-ft">
          <button className="wt-modal-clear" onClick={()=>{setAbove('');setBelow('');setNotes('')}}>Clear</button>
          <button className="wt-modal-save" onClick={()=>onSave(item.id,above,below,notes)}>
            <Check size={11} weight="bold"/>Save
          </button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   ADD STOCK DRAWER
════════════════════════════════════════════════════════ */
function AddDrawer({onAdd, onClose, existingIds}) {
  const [q, setQ] = useState('')
  const results = ADD_CANDIDATES.filter(s=>
    !existingIds.includes(s.stock_id) &&
    (s.symbol.includes(q.toUpperCase())||s.name.toLowerCase().includes(q.toLowerCase()))
  )
  return (
    <div className="wt-drawer">
      <div className="wt-drawer-hd">
        <span>Add to Watchlist</span>
        <button className="wt-drawer-x" onClick={onClose}><X size={11} weight="bold"/></button>
      </div>
      <div className="wt-drawer-search">
        <MagnifyingGlass size={11} className="wt-ds-ico"/>
        <input className="wt-ds-inp" placeholder="Symbol or company name..." value={q} onChange={e=>setQ(e.target.value)} autoFocus/>
      </div>
      <div className="wt-drawer-list">
        {results.length===0
          ? <div className="wt-drawer-empty">No matching stocks</div>
          : results.map(s=>{
              const chg = ((s.last_price-s.prev_close)/s.prev_close*100)
              return (
                <div key={s.stock_id} className="wt-drawer-row">
                  <div className="wt-dico" style={{background:`${s.color}15`,color:s.color}}>{s.symbol.slice(0,2)}</div>
                  <div className="wt-dinfo">
                    <span className="wt-dsym">{s.symbol}</span>
                    <span className="wt-dname">{s.name}</span>
                  </div>
                  <span className={`wt-dchg ${chg>=0?'g':'r'}`}>{chg>=0?'+':''}{chg.toFixed(2)}%</span>
                  <button className="wt-dadd" onClick={()=>{onAdd(s);setQ('')}}>
                    <Plus size={9} weight="bold"/>Add
                  </button>
                </div>
              )
            })
        }
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   ROOT
════════════════════════════════════════════════════════ */
export default function Watchlist() {
  useOutletContext?.()
  const navigate = useNavigate()
  const [rows,     setRows]     = useState(()=>WATCHLIST_ROWS.map(r=>({...r,spark:genSpark(r.last_price)})))
  const [search,   setSearch]   = useState('')
  const [sector,   setSector]   = useState('All')
  const [sortMode, setSortMode] = useState('added')
  const [alertFor, setAlertFor] = useState(null)
  const [showAdd,  setShowAdd]  = useState(false)

  const sectors = ['All',...new Set(WATCHLIST_ROWS.map(r=>r.sector))]

  const visible = useMemo(()=>{
    let list = [...rows]
    if(sector!=='All') list=list.filter(r=>r.sector===sector)
    if(search)         list=list.filter(r=>r.symbol.includes(search.toUpperCase())||r.name.toLowerCase().includes(search.toLowerCase()))
    if(sortMode==='chg') list.sort((a,b)=>((b.last_price-b.prev_close)/b.prev_close)-((a.last_price-a.prev_close)/a.prev_close))
    if(sortMode==='price') list.sort((a,b)=>b.last_price-a.last_price)
    if(sortMode==='mktcap') list.sort((a,b)=>(b.market_cap||0)-(a.market_cap||0))
    return list
  },[rows,search,sector,sortMode])

  const triggered = rows.filter(r=>
    (r.alert_above&&r.last_price>=r.alert_above)||(r.alert_below&&r.last_price<=r.alert_below))

  const remove = id => setRows(p=>p.filter(x=>x.id!==id))
  const saveAlert = (id,above,below,notes) => {
    setRows(p=>p.map(x=>x.id===id?{...x,alert_above:above?+above:null,alert_below:below?+below:null,notes:notes||x.notes}:x))
    setAlertFor(null)
  }
  const addStock = s => {
    setRows(p=>[...p,{
      ...s, id:`wl${Date.now()}`, notes:null, alert_above:null, alert_below:null,
      added_at:'Just now', spark:genSpark(s.last_price)
    }])
    setShowAdd(false)
  }

  return (
    <div className="wt-root">

      {/* ── HEADER ── */}
      <div className="wt-hdr">
        <div className="wt-hdr-left">
          <div className="wt-hdr-ico"><Star size={15} weight="fill"/></div>
          <div>
            <h1 className="wt-hdr-title">Watchlist</h1>
            <p className="wt-hdr-sub">Monitor assets · Set price alerts · Find opportunities</p>
          </div>
        </div>
        <div className="wt-hdr-right">
          {triggered.length>0&&(
            <div className="wt-triggered-chip">
              <Warning size={10} weight="fill"/>
              {triggered.length} alert{triggered.length>1?'s':''} triggered
            </div>
          )}
          <button className="wt-btn primary" onClick={()=>setShowAdd(v=>!v)}>
            <Plus size={11} weight="bold"/>Add Stock
          </button>
        </div>
        <nav className="wt-bc"><span>Dashboard</span><CaretRight size={9}/><span className="wt-bc-c">Watchlist</span></nav>
      </div>

      {/* ── ADD DRAWER ── */}
      {showAdd&&<AddDrawer onAdd={addStock} onClose={()=>setShowAdd(false)} existingIds={rows.map(r=>r.stock_id)}/>}

      {/* ── CONTROLS ── */}
      <div className="wt-ctrl">
        <div className="wt-srch">
          <MagnifyingGlass size={11} className="wt-srch-ico"/>
          <input className="wt-srch-inp" placeholder="Search symbol or name..." value={search} onChange={e=>setSearch(e.target.value)}/>
          {search&&<button className="wt-srch-x" onClick={()=>setSearch('')}><X size={8} weight="bold"/></button>}
        </div>
        <div className="wt-pills">
          {sectors.map(s=>(
            <button key={s} className={`wt-pill ${sector===s?'on':''}`} onClick={()=>setSector(s)}>{s}</button>
          ))}
        </div>
        <div className="wt-sort-row">
          <ArrowsDownUp size={11} style={{color:'var(--vlt-text-muted)'}}/>
          {[{id:'added',l:'Default'},{id:'chg',l:'% Change'},{id:'price',l:'Price'},{id:'mktcap',l:'Mkt Cap'}].map(s=>(
            <button key={s.id} className={`wt-sort ${sortMode===s.id?'on':''}`} onClick={()=>setSortMode(s.id)}>{s.l}</button>
          ))}
        </div>
        <span className="wt-count">{visible.length} / {rows.length} stocks</span>
      </div>

      {/* ── TABLE ── */}
      <div className="wt-panel">
        <div className="wt-thead">
          <span>Asset</span><span>Sector</span><span>Sparkline 30D</span>
          <span>Last Price</span><span>Day Change</span>
          <span>52W Range</span><span>Volume · Mkt Cap</span>
          <span>Alert</span><span>P/E</span><span>Actions</span>
        </div>

        {visible.length===0
          ? <div className="wt-empty"><Star size={28} weight="duotone"/><span>No stocks match your filters</span></div>
          : visible.map((item,idx)=>{
              const chg     = item.last_price - item.prev_close
              const chgPct  = (chg/item.prev_close)*100
              const isUp    = chg>=0
              const Icon    = SECTOR_ICONS[item.sector]||Globe
              const rPct    = ((item.last_price-item.week_52_low)/(item.week_52_high-item.week_52_low))*100
              const aAbove  = item.alert_above&&item.last_price>=item.alert_above
              const aBelow  = item.alert_below&&item.last_price<=item.alert_below
              const aTrig   = aAbove||aBelow
              const hasAlert = item.alert_above||item.alert_below

              return (
                <div key={item.id} className="wt-row" style={{animationDelay:`${idx*22}ms`}}>
                  {/* Asset */}
                  <div className="wt-cell-asset">
                    <div className="wt-ico" style={{background:`${item.color}14`,color:item.color}}>{item.symbol.slice(0,2)}</div>
                    <div>
                      <div className="wt-sym">{item.symbol}</div>
                      <div className="wt-name">{item.name}</div>
                    </div>
                  </div>
                  {/* Sector */}
                  <div className="wt-cell-sector">
                    <Icon size={10} weight="duotone" style={{color:item.color}}/>
                    {item.sector}
                  </div>
                  {/* Spark */}
                  <div className="wt-spark">
                    <ResponsiveContainer width="100%" height={36}>
                      <LineChart data={item.spark}>
                        <Line type="monotone" dataKey="v" stroke={isUp?'#00C076':'#FF3D57'} strokeWidth={1.4} dot={false} animationDuration={0}/>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Price */}
                  <div className="wt-cell-price">${fmtPx(item.last_price,item.last_price)}</div>
                  {/* Day change */}
                  <div className={`wt-cell-chg ${isUp?'g':'r'}`}>
                    {isUp?<CaretUp size={9} weight="fill"/>:<CaretDown size={9} weight="fill"/>}
                    {isUp?'+':''}{fmtPx(chg,item.last_price)} ({isUp?'+':''}{chgPct.toFixed(2)}%)
                  </div>
                  {/* 52W Range */}
                  <div className="wt-cell-range">
                    <span className="wt-52l">{fmtPx(item.week_52_low,item.last_price)}</span>
                    <div className="wt-rng-track">
                      <div className="wt-rng-fill" style={{width:`${Math.max(0,Math.min(100,rPct))}%`,background:item.color}}/>
                      <div className="wt-rng-knob" style={{left:`${Math.max(0,Math.min(100,rPct))}%`,background:item.color}}/>
                    </div>
                    <span className="wt-52h">{fmtPx(item.week_52_high,item.last_price)}</span>
                  </div>
                  {/* Volume · Mkt Cap */}
                  <div className="wt-cell-meta">
                    <span>{fmtVol(item.volume)}</span>
                    <span className="wt-meta-sub">{fmtCap(item.market_cap)}</span>
                  </div>
                  {/* Alert */}
                  <button className={`wt-alert-chip ${aTrig?'triggered':hasAlert?'set':'none'}`}
                    onClick={()=>setAlertFor(item)}>
                    {aTrig?<><Warning size={8} weight="fill"/>Triggered</>:
                     hasAlert?<><Bell size={8} weight="fill"/>Set</>:
                     <><BellSlash size={8} weight="duotone"/>None</>}
                  </button>
                  {/* P/E */}
                  <div className="wt-cell-pe">{item.pe_ratio?.toFixed(1)??'N/A'}</div>
                  {/* Actions */}
                  <div className="wt-cell-act">
                    <button className="wt-act-edit" onClick={()=>setAlertFor(item)} title="Edit alert / notes">
                      <Pencil size={10} weight="bold"/>
                    </button>
                    <button className="wt-act-trade" onClick={()=>navigate('../trade')}>
                      <Lightning size={9} weight="bold"/>Trade
                    </button>
                    <button className="wt-act-remove" onClick={()=>remove(item.id)}>
                      <Trash size={10} weight="bold"/>
                    </button>
                  </div>
                </div>
              )
            })
        }
      </div>

      {/* Notes preview strip */}
      {visible.filter(r=>r.notes).length>0&&(
        <div className="wt-notes-strip">
          <div className="wt-notes-hd"><Pencil size={10} weight="duotone"/>Research Notes</div>
          {visible.filter(r=>r.notes).slice(0,3).map(r=>(
            <div key={r.id} className="wt-note-row">
              <span className="wt-note-sym" style={{color:r.color}}>{r.symbol}</span>
              <span className="wt-note-text">{r.notes}</span>
            </div>
          ))}
        </div>
      )}

      <AlertModal item={alertFor} onClose={()=>setAlertFor(null)} onSave={saveAlert}/>
    </div>
  )
}