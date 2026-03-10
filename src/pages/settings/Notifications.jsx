import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Bell, CaretRight, Check, X, Info,
  ShieldCheck, ArrowCircleDown, ArrowCircleUp, Swap,
  IdentificationCard, ChartBar, Sparkle,
  Envelope, BellRinging, DeviceMobile,
  BellSlash, Clock,
} from '@phosphor-icons/react'
import './Notifications.css'

/* ── constants ──────────────────────────────────────────── */
const CATS = [
  { id:'security',    label:'Security',        Icon:ShieldCheck,       color:'#00C076', desc:'Login alerts, 2FA changes, suspicious activity' },
  { id:'deposits',    label:'Deposits',         Icon:ArrowCircleDown,   color:'#1A56FF', desc:'Incoming funds and deposit confirmations' },
  { id:'withdrawals', label:'Withdrawals',      Icon:ArrowCircleUp,     color:'#FF3D57', desc:'Outgoing transfers and withdrawal status' },
  { id:'trades',      label:'Trades',           Icon:Swap,              color:'#F7931A', desc:'Order fills, limit hits, trade executions' },
  { id:'kyc',         label:'KYC',              Icon:IdentificationCard, color:'#9945FF', desc:'Verification status and document requests' },
  { id:'prices',      label:'Price alerts',     Icon:ChartBar,          color:'#FFB800', desc:'Asset price movements and custom thresholds' },
  { id:'marketing',   label:'Promotions',       Icon:Sparkle,           color:'#627EEA', desc:'Platform updates, offers, and newsletters' },
]

const CHANNELS = [
  { id:'email', label:'Email', Icon:Envelope    },
  { id:'push',  label:'Push',  Icon:BellRinging },
  { id:'sms',   label:'SMS',   Icon:DeviceMobile},
]

const initMatrix = () => {
  const m = {}
  CATS.forEach(c => {
    m[c.id] = {}
    CHANNELS.forEach(ch => { m[c.id][ch.id] = c.id !== 'marketing' })
  })
  return m
}

/* ── atoms ─────────────────────────────────────────────── */
function Toggle({ on, onChange, accent = '#00FFD1', size = 'md' }) {
  return (
    <button className={`nt-toggle ${size} ${on?'on':''}`} style={{'--ta':accent}}
      onClick={() => onChange?.(!on)} role="switch" aria-checked={on}>
      <span className="nt-thumb">{on && <Check size={size==='sm'?7:8} weight="bold"/>}</span>
    </button>
  )
}

function Row({ icon:Icon, color='#00FFD1', title, sub, children }) {
  return (
    <div className="nt-row">
      <div className="nt-row-ico" style={{background:`${color}15`,color}}><Icon size={14} weight="duotone"/></div>
      <div className="nt-row-copy">
        <span className="nt-row-title">{title}</span>
        {sub && <span className="nt-row-sub">{sub}</span>}
      </div>
      <div className="nt-row-ctrl">{children}</div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="nt-section">
      <div className="nt-sec-title">{title}</div>
      <div className="nt-sec-body">{children}</div>
    </div>
  )
}

function SaveBar({ dirty, onSave, onDiscard }) {
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  if (!dirty) return null
  const go = async () => {
    setBusy(true); await onSave(); setBusy(false)
    setDone(true); setTimeout(() => setDone(false), 2000)
  }
  return (
    <div className="nt-savebar">
      <span className="nt-sb-dot"/><span className="nt-sb-msg">Unsaved changes</span>
      <button className="nt-sb-dis" onClick={onDiscard}><X size={10} weight="bold"/>Discard</button>
      <button className="nt-sb-save" onClick={go} disabled={busy}>
        {done ? <><Check size={10} weight="bold"/>Saved!</> :
         busy ? <><span className="nt-sb-spin"/>Saving…</> :
                <><Check size={10} weight="bold"/>Save changes</>}
      </button>
    </div>
  )
}

/* ── category row (expandable) ──────────────────────────── */
function CatRow({ cat, matrix, onChange, open, onToggle }) {
  return (
    <div className={`nt-cat-row ${open?'open':''}`}>
      <button className="nt-cat-hd" onClick={onToggle}>
        <div className="nt-cat-ico" style={{background:`${cat.color}18`,color:cat.color}}>
          <cat.Icon size={13} weight="duotone"/>
        </div>
        <div className="nt-cat-info">
          <span className="nt-cat-lbl">{cat.label}</span>
          <span className="nt-cat-desc">{cat.desc}</span>
        </div>
        {/* channel indicator dots */}
        <div className="nt-dots">
          {CHANNELS.map(ch => (
            <div key={ch.id} className="nt-dot"
              style={matrix[cat.id]?.[ch.id] ? {background:cat.color} : {}}
              title={ch.label}/>
          ))}
        </div>
        <CaretRight size={10} className={`nt-caret ${open?'open':''}`}/>
      </button>
      {open && (
        <div className="nt-cat-channels">
          {CHANNELS.map(ch => (
            <div key={ch.id} className="nt-ch-row">
              <ch.Icon size={13} weight="duotone"
                style={{color: matrix[cat.id]?.[ch.id] ? cat.color : 'var(--vlt-text-muted)'}}/>
              <span>{ch.label}</span>
              <Toggle
                on={matrix[cat.id]?.[ch.id] ?? false}
                onChange={v => onChange(cat.id, ch.id, v)}
                accent={cat.color} size="sm"/>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── main ───────────────────────────────────────────────── */
export default function Notifications() {
  useOutletContext?.()
  const [matrix, setMatrix]   = useState(initMatrix())
  const [saved,  setSaved]    = useState(matrix)
  const [openCat,setOpenCat]  = useState('security')
  const [freq,   setFreq]     = useState('instant')
  const [quietOn, setQuietOn] = useState(true)
  const [qFrom,   setQFrom]   = useState('22:00')
  const [qTo,     setQTo]     = useState('08:00')
  const [soundOn, setSoundOn] = useState(true)
  const [volume,  setVolume]  = useState(65)

  const dirty = JSON.stringify(matrix) !== JSON.stringify(saved)

  const total    = Object.values(matrix).reduce((s,c) => s + Object.values(c).filter(Boolean).length, 0)
  const possible = CATS.length * CHANNELS.length
  const pct      = Math.round((total / possible) * 100)

  const handleMatrix = (cat, ch, v) => setMatrix(m => ({...m, [cat]:{...m[cat],[ch]:v}}))

  const setAll = on => {
    const m = {}
    CATS.forEach(c => { m[c.id] = {}; CHANNELS.forEach(ch => { m[c.id][ch.id] = on }) })
    setMatrix(m)
  }

  const save    = async () => { await new Promise(r => setTimeout(r, 700)); setSaved(matrix) }
  const discard = () => setMatrix(saved)

  return (
    <div className="nt-root">

      {/* header */}
      <div className="nt-page-head">
        <div className="nt-ph-left">
          <div className="nt-ph-ico"><Bell size={16} weight="fill"/></div>
          <div>
            <h1 className="nt-page-title">Notifications</h1>
            <p className="nt-page-sub">Notification channels, delivery rules, and quiet hours</p>
          </div>
        </div>
        <nav className="nt-bc"><span>Settings</span><CaretRight size={9}/><span className="cur">Notifications</span></nav>
      </div>

      {/* Overview */}
      <Section title="Overview">
        <div className="nt-overview">
          <div className="nt-ov-left">
            <span className="nt-ov-big">{total}</span>
            <span className="nt-ov-of">/ {possible} active</span>
          </div>
          <div className="nt-ov-track"><div className="nt-ov-fill" style={{width:`${pct}%`}}/></div>
          <div className="nt-ov-actions">
            <button className="nt-chip" onClick={() => setAll(true)}>Enable all</button>
            <button className="nt-chip ghost" onClick={() => setAll(false)}>Disable all</button>
          </div>
        </div>
        {/* channel legend */}
        <div className="nt-ch-legend">
          {CHANNELS.map(ch => (
            <div key={ch.id} className="nt-ch-leg">
              <ch.Icon size={11} weight="duotone" style={{color:'var(--vlt-text-muted)'}}/>
              <span>{ch.label}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Per-category */}
      <Section title="By category">
        <div className="nt-cat-list">
          {CATS.map(cat => (
            <CatRow key={cat.id} cat={cat} matrix={matrix} onChange={handleMatrix}
              open={openCat === cat.id}
              onToggle={() => setOpenCat(o => o === cat.id ? null : cat.id)}/>
          ))}
        </div>
      </Section>

      {/* Delivery preferences */}
      <Section title="Delivery preferences">
        <Row icon={Envelope} color="#627EEA" title="Email digest" sub="How often to bundle email notifications">
          <div className="nt-seg">
            {[{id:'instant',l:'Instant'},{id:'daily',l:'Daily'},{id:'weekly',l:'Weekly'}].map(f => (
              <button key={f.id} className={`nt-seg-btn ${freq===f.id?'on':''}`} onClick={() => setFreq(f.id)}>{f.l}</button>
            ))}
          </div>
        </Row>

        <Row icon={BellSlash} color="#9945FF" title="Quiet hours" sub="Suppress push and SMS during set hours">
          <Toggle on={quietOn} onChange={setQuietOn} accent="#9945FF"/>
        </Row>
        {quietOn && (
          <div className="nt-quiet-panel">
            <div className="nt-qp-row">
              <span className="nt-qp-lbl">From</span>
              <input type="time" className="nt-time" value={qFrom} onChange={e => setQFrom(e.target.value)}/>
              <span className="nt-qp-lbl">to</span>
              <input type="time" className="nt-time" value={qTo} onChange={e => setQTo(e.target.value)}/>
            </div>
            <div className="nt-qp-note"><Info size={10} weight="fill"/>Security alerts always bypass quiet hours.</div>
          </div>
        )}

        <Row icon={BellRinging} color="#FFB800" title="Notification sounds" sub="Audio cues for desktop push notifications">
          <Toggle on={soundOn} onChange={setSoundOn} accent="#FFB800"/>
        </Row>
        {soundOn && (
          <div className="nt-vol-row">
            <span className="nt-vol-l">Volume</span>
            <input type="range" min={0} max={100} value={volume}
              className="nt-slider" onChange={e => setVolume(+e.target.value)}/>
            <span className="nt-vol-v" style={{color:'#FFB800'}}>{volume}%</span>
          </div>
        )}
      </Section>

      <SaveBar dirty={dirty} onSave={save} onDiscard={discard}/>
    </div>
  )
}