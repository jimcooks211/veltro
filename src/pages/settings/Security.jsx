import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  ShieldCheck, CaretRight, Check, X, Eye, EyeSlash,
  Fingerprint, Shield, Bell, Globe, Clock, Key,
  LockSimple, Lightning, Trash, Plus, Copy,
  Warning, Desktop, Phone, Prohibit, Minus,
} from '@phosphor-icons/react'
import './Security.css'

/* ── atoms ─────────────────────────────────────────────── */
function Toggle({ on, onChange, accent = '#00FFD1' }) {
  return (
    <button className={`sc-toggle ${on ? 'on' : ''}`} style={{ '--ta': accent }}
      onClick={() => onChange?.(!on)} role="switch" aria-checked={on}>
      <span className="sc-thumb">{on && <Check size={8} weight="bold"/>}</span>
    </button>
  )
}

function Row({ icon: Icon, color = '#00FFD1', title, sub, badge, children }) {
  return (
    <div className="sc-row">
      <div className="sc-row-ico" style={{ background:`${color}15`, color }}><Icon size={14} weight="duotone"/></div>
      <div className="sc-row-copy">
        <span className="sc-row-title">{title}{badge && <span className="sc-badge">{badge}</span>}</span>
        {sub && <span className="sc-row-sub">{sub}</span>}
      </div>
      <div className="sc-row-ctrl">{children}</div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="sc-section">
      <div className="sc-sec-title">{title}</div>
      <div className="sc-sec-body">{children}</div>
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
    <div className="sc-savebar">
      <span className="sc-sb-dot"/><span className="sc-sb-msg">Unsaved changes</span>
      <button className="sc-sb-dis" onClick={onDiscard}><X size={10} weight="bold"/>Discard</button>
      <button className="sc-sb-save" onClick={go} disabled={busy}>
        {done ? <><Check size={10} weight="bold"/>Saved!</> :
         busy ? <><span className="sc-sb-spin"/>Saving…</> :
                <><Check size={10} weight="bold"/>Save changes</>}
      </button>
    </div>
  )
}

/* ── score ring ─────────────────────────────────────────── */
const SEC_FACTORS = [
  { id:'pw',      label:'Strong password',      pts:25, key:'pwStrong'    },
  { id:'2fa',     label:'Two-factor auth',       pts:30, key:'twoFA'       },
  { id:'wl',      label:'Withdrawal whitelist',  pts:20, key:'whitelist'   },
  { id:'alerts',  label:'Login alerts active',   pts:15, key:'loginAlerts' },
  { id:'timeout', label:'Session timeout set',   pts:10, key:'sessTimeout' },
]

function ScoreRing({ score }) {
  const r = 42, circ = 2 * Math.PI * r, fill = circ * (score / 100)
  const color = score >= 80 ? '#00C076' : score >= 50 ? '#FFB800' : '#FF3D57'
  const label = score >= 80 ? 'Excellent' : score >= 50 ? 'Moderate' : 'At Risk'
  return (
    <div className="sc-score-ring">
      <svg width={104} height={104} viewBox="0 0 104 104">
        <circle cx={52} cy={52} r={r} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth={7}/>
        <circle cx={52} cy={52} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={`${fill} ${circ}`} strokeDashoffset={circ * .25}
          strokeLinecap="round"
          style={{ transition:'stroke-dasharray 1s cubic-bezier(.34,1.2,.64,1), stroke .4s' }}/>
        <circle cx={52} cy={52} r={r - 14} fill="none" stroke={`${color}18`} strokeWidth={1}/>
      </svg>
      <div className="sc-score-num">
        <span className="sc-score-val" style={{ color }}>{score}</span>
        <span className="sc-score-lbl">{label}</span>
      </div>
    </div>
  )
}

/* ── password strength ──────────────────────────────────── */
function StrengthBar({ pw }) {
  const checks = [
    { ok: pw.length >= 8,          l: '8+ chars'  },
    { ok: /[A-Z]/.test(pw),        l: 'Uppercase' },
    { ok: /[0-9]/.test(pw),        l: 'Number'    },
    { ok: /[^A-Za-z0-9]/.test(pw), l: 'Symbol'    },
  ]
  const score = checks.filter(c => c.ok).length
  const cols  = ['#FF3D57','#FF8C42','#FFB800','#00C076']
  const lbls  = ['Weak','Fair','Good','Strong']
  if (!pw) return null
  return (
    <div className="sc-strength">
      <div className="sc-str-bars">{[0,1,2,3].map(i => (
        <div key={i} className="sc-str-b"
          style={{ background: i < score ? cols[score-1] : 'rgba(255,255,255,.07)', transition:`background .3s ${i*.07}s` }}/>
      ))}</div>
      <span className="sc-str-lbl" style={{ color: score > 0 ? cols[score-1] : 'transparent' }}>{lbls[score-1]||''}</span>
      <div className="sc-str-checks">{checks.map(c => (
        <span key={c.l} className={`sc-str-ch ${c.ok?'ok':''}`}>
          {c.ok ? <Check size={8} weight="bold"/> : <Minus size={8} weight="bold"/>}{c.l}
        </span>
      ))}</div>
    </div>
  )
}

/* ── mock data ──────────────────────────────────────────── */
const SESSIONS_MOCK = [
  { id:1, device:'Chrome 122', os:'macOS Sonoma',  ip:'192.168.1.100', loc:'New York, US', Icon:Desktop, last:'Now',    cur:true  },
  { id:2, device:'Safari',     os:'iPhone 15 Pro', ip:'172.20.10.4',   loc:'New York, US', Icon:Phone,   last:'3h ago', cur:false },
  { id:3, device:'Firefox 123',os:'Windows 11',    ip:'203.45.89.12',  loc:'London, UK',   Icon:Desktop, last:'Mar 7',  cur:false },
]

/* ── main ───────────────────────────────────────────────── */
export default function Security() {
  useOutletContext?.()
  const [sec, setSec]     = useState({ twoFA:true, whitelist:true, loginAlerts:true, sessTimeout:false, newDevice:true, pwStrong:true })
  const [saved, setSaved] = useState(sec)
  const [pw, setPw]       = useState({ cur:'', next:'', conf:'' })
  const [showPw, setShowPw] = useState({ cur:false, next:false, conf:false })
  const [sessions, setSessions] = useState(SESSIONS_MOCK)
  const [keys, setKeys]   = useState([
    { id:1, name:'Trading Bot', created:'Jan 15', scopes:['read','trade'], preview:'sk-vlt-••••••1f3a' },
    { id:2, name:'Analytics',   created:'Feb 2',  scopes:['read'],         preview:'sk-vlt-••••••9c2e' },
  ])
  const [addingKey,  setAddingKey]  = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [revKey,  setRevKey]  = useState(null)
  const [copied,  setCopied]  = useState(false)

  const pwScore = [/[A-Z]/.test(pw.next), /[0-9]/.test(pw.next), /[^A-Za-z0-9]/.test(pw.next), pw.next.length >= 8].filter(Boolean).length
  const secScore = SEC_FACTORS.reduce((s, f) => s + (f.id === 'pw' ? pwScore >= 4 ? f.pts : 0 : sec[f.key] ? f.pts : 0), 0)
  const dirty = JSON.stringify(sec) !== JSON.stringify(saved)

  const genKey = () => {
    const k = 'sk-vlt-' + Array.from({ length:40 }, () => '0123456789abcdef'[Math.floor(Math.random()*16)]).join('')
    setRevKey(k)
    setKeys(ks => [...ks, { id:Date.now(), name:newKeyName||'New Key', created:'Today', scopes:['read'], preview:`sk-vlt-••••••${k.slice(-4)}` }])
    setNewKeyName(''); setAddingKey(false)
  }
  const copyKey = () => {
    navigator.clipboard?.writeText(revKey).catch(()=>{})
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }
  const save    = async () => { await new Promise(r => setTimeout(r, 700)); setSaved(sec) }
  const discard = () => setSec(saved)

  return (
    <div className="sc-root">

      {/* header */}
      <div className="sc-page-head">
        <div className="sc-ph-left">
          <div className="sc-ph-ico"><ShieldCheck size={16} weight="fill"/></div>
          <div>
            <h1 className="sc-page-title">Security</h1>
            <p className="sc-page-sub">Passwords, 2FA, sessions, and API keys</p>
          </div>
        </div>
        <nav className="sc-bc"><span>Settings</span><CaretRight size={9}/><span className="cur">Security</span></nav>
      </div>

      {/* Score */}
      <Section title="Security health">
        <div className="sc-score-panel">
          <ScoreRing score={secScore}/>
          <div className="sc-score-checks">
            <div className="sc-sc-head"><span>Security factors</span><span className="sc-sc-total">{secScore}/100</span></div>
            {SEC_FACTORS.map(f => {
              const ok = f.id === 'pw' ? pwScore >= 4 : sec[f.key]
              return (
                <div key={f.id} className={`sc-sc-row ${ok?'ok':''}`}>
                  <div className="sc-sc-dot" style={ok ? {background:'#00C076'} : {}}/>
                  <span>{f.label}</span>
                  <span className="sc-sc-pts" style={{color: ok ? '#00C076' : 'rgba(255,255,255,.18)'}}>+{f.pts}</span>
                </div>
              )
            })}
          </div>
        </div>
      </Section>

      {/* Access Controls */}
      <Section title="Access controls">
        {[
          { key:'twoFA',      Icon:Fingerprint, color:'#00FFD1', title:'Two-factor authentication',     sub:'Require 2FA on every login and withdrawal', badge:'Recommended' },
          { key:'whitelist',  Icon:Shield,      color:'#1A56FF', title:'Withdrawal address whitelist',  sub:'Block transfers to non-approved addresses'                      },
          { key:'loginAlerts',Icon:Bell,        color:'#FFB800', title:'Login alerts',                  sub:'Email me when a new device signs in'                            },
          { key:'newDevice',  Icon:Globe,       color:'#9945FF', title:'New device detection',          sub:'Flag sessions from unusual locations or IPs'                    },
          { key:'sessTimeout',Icon:Clock,       color:'#F7931A', title:'Auto session timeout',          sub:'Sign out after 30 minutes of inactivity'                        },
        ].map(({ key, Icon, color, title, sub, badge }) => (
          <Row key={key} icon={Icon} color={color} title={title} sub={sub} badge={badge}>
            <Toggle on={sec[key]} onChange={v => setSec(s => ({...s,[key]:v}))} accent={color}/>
          </Row>
        ))}
      </Section>

      {/* Password */}
      <Section title="Change password">
        <div className="sc-pw-grid">
          {[
            { f:'cur',  label:'Current password',      ph:'••••••••'            },
            { f:'next', label:'New password',           ph:'Min 8 characters'   },
            { f:'conf', label:'Confirm new password',   ph:'Repeat new password'},
          ].map(({ f, label, ph }) => (
            <div key={f} className="sc-field">
              <label className="sc-label">{label}</label>
              <div className="sc-pw-wrap">
                <input className="sc-input" type={showPw[f] ? 'text' : 'password'}
                  value={pw[f]} placeholder={ph}
                  onChange={e => setPw(p => ({...p,[f]:e.target.value}))}/>
                <button className="sc-eye" onClick={() => setShowPw(s => ({...s,[f]:!s[f]}))}>
                  {showPw[f] ? <EyeSlash size={13}/> : <Eye size={13}/>}
                </button>
              </div>
              {f === 'next' && <StrengthBar pw={pw.next}/>}
              {f === 'conf' && pw.conf && pw.next !== pw.conf && (
                <span className="sc-ferr"><Warning size={10} weight="fill"/>Passwords do not match</span>
              )}
            </div>
          ))}
        </div>
        <button className="sc-primary-btn"
          disabled={!pw.cur || pw.next.length < 8 || pw.next !== pw.conf}
          onClick={() => { setSec(s => ({...s,pwStrong:pwScore>=4})); setPw({cur:'',next:'',conf:''}) }}>
          <LockSimple size={13} weight="bold"/>Update password
        </button>
      </Section>

      {/* Sessions */}
      <Section title="Active sessions">
        <div className="sc-sessions">
          {sessions.map(s => (
            <div key={s.id} className={`sc-session ${s.cur?'cur':''}`}>
              <div className="sc-sess-ico"><s.Icon size={14} weight="duotone"/></div>
              <div className="sc-sess-info">
                <div className="sc-sess-dev">
                  {s.device} · {s.os}
                  {s.cur && <span className="sc-sess-tag">This device</span>}
                </div>
                <div className="sc-sess-meta">{s.ip} · {s.loc} · {s.last}</div>
              </div>
              {!s.cur && (
                <button className="sc-revoke" onClick={() => setSessions(ss => ss.filter(x => x.id !== s.id))}>
                  <X size={10} weight="bold"/>Revoke
                </button>
              )}
            </div>
          ))}
        </div>
        <button className="sc-outline-btn">
          <Prohibit size={12} weight="bold"/>Sign out all other sessions
        </button>
      </Section>

      {/* API Keys */}
      <Section title="API keys">
        <div className="sc-apikeys">
          {keys.map(k => (
            <div key={k.id} className="sc-apikey">
              <Key size={13} weight="duotone" style={{color:'#FFB800',flexShrink:0}}/>
              <div className="sc-ak-info">
                <span className="sc-ak-name">{k.name}</span>
                <span className="sc-ak-meta">
                  <code className="sc-ak-code">{k.preview}</code>
                  · {k.created}
                  {k.scopes.map(s => <span key={s} className="sc-ak-scope">{s}</span>)}
                </span>
              </div>
              <button className="sc-revoke" onClick={() => setKeys(ks => ks.filter(x => x.id !== k.id))}>
                <Trash size={10} weight="bold"/>Delete
              </button>
            </div>
          ))}
        </div>

        {revKey && (
          <div className="sc-reveal-key">
            <Warning size={12} weight="fill" style={{color:'#FFB800',flexShrink:0}}/>
            <div className="sc-rk-inner">
              <span className="sc-rk-warn">Copy now — shown only once</span>
              <code className="sc-rk-val">{revKey}</code>
            </div>
            <button className="sc-chip" onClick={copyKey}>
              {copied ? <><Check size={10} weight="bold"/>Copied</> : <><Copy size={10} weight="bold"/>Copy</>}
            </button>
          </div>
        )}

        {addingKey ? (
          <div className="sc-addkey">
            <input className="sc-input" placeholder="Key name e.g. Trading Bot"
              value={newKeyName} onChange={e => setNewKeyName(e.target.value)} autoFocus/>
            <button className="sc-primary-btn" onClick={genKey} disabled={!newKeyName.trim()}>
              <Lightning size={12} weight="bold"/>Generate
            </button>
            <button className="sc-outline-btn" onClick={() => setAddingKey(false)}>Cancel</button>
          </div>
        ) : (
          <button className="sc-outline-btn" onClick={() => setAddingKey(true)}>
            <Plus size={12} weight="bold"/>New API key
          </button>
        )}
      </Section>

      <SaveBar dirty={dirty} onSave={save} onDiscard={discard}/>
    </div>
  )
}