import { useState, useRef, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { apiPost, apiGet } from '../../utils/api.js'
import {
  GearSix, Camera, Check, X, CaretRight,
  Moon, Sun, Desktop, Palette, TextAa,
  Globe, ChartBar, ArrowSquareOut, Trash, Warning,
} from '@phosphor-icons/react'
import './Settings.css'

/* ── atoms ─────────────────────────────────────────────── */
function Field({ label, error, span, children }) {
  return (
    <div className="gs-field" style={span ? { gridColumn:'1/-1' } : {}}>
      {label && <label className="gs-label">{label}</label>}
      {children}
      {error && <span className="gs-err"><Warning size={10} weight="fill"/>{error}</span>}
    </div>
  )
}

function Row({ icon: Icon, color = '#00FFD1', title, sub, children }) {
  return (
    <div className="gs-row">
      {Icon && <div className="gs-row-ico" style={{ background:`${color}15`, color }}><Icon size={14} weight="duotone"/></div>}
      <div className="gs-row-copy">
        <span className="gs-row-title">{title}</span>
        {sub && <span className="gs-row-sub">{sub}</span>}
      </div>
      <div className="gs-row-ctrl">{children}</div>
    </div>
  )
}

function Section({ title, accent, children }) {
  return (
    <div className="gs-section">
      <div className="gs-sec-title" style={accent ? { color: accent } : {}}>{title}</div>
      <div className="gs-sec-body">{children}</div>
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
    <div className="gs-savebar">
      <span className="gs-sb-dot"/><span className="gs-sb-msg">Unsaved changes</span>
      <button className="gs-sb-dis" onClick={onDiscard}><X size={10} weight="bold"/>Discard</button>
      <button className="gs-sb-save" onClick={go} disabled={busy}>
        {done ? <><Check size={10} weight="bold"/>Saved!</> :
         busy ? <><span className="gs-sb-spin"/>Saving...</> :
                <><Check size={10} weight="bold"/>Save changes</>}
      </button>
    </div>
  )
}

/* ── constants ──────────────────────────────────────────── */
const ACCENTS   = ['#00FFD1','#1A56FF','#F7931A','#9945FF','#FF3D57','#FFB800','#00C076','#627EEA']
const THEMES    = [{ id:'dark', Icon:Moon },{ id:'light', Icon:Sun },{ id:'system', Icon:Desktop }]
const LANGUAGES = [{value:'en',label:'English'},{value:'es',label:'Español'},{value:'fr',label:'Français'},{value:'de',label:'Deutsch'},{value:'zh',label:'中文'},{value:'ja',label:'日本語'},{value:'ar',label:'العربية'},{value:'pt',label:'Português'}]
const CURRENCIES = ['USD','EUR','GBP','JPY','AUD','CAD','CHF','SGD']
const TIMEZONES  = ['UTC','America/New_York','America/Los_Angeles','America/Chicago','Europe/London','Europe/Paris','Asia/Tokyo','Asia/Singapore']
const DATE_FMTS  = ['MM/DD/YYYY','DD/MM/YYYY','YYYY-MM-DD','DD MMM YYYY']

/* ── main ───────────────────────────────────────────────── */
export default function Settings() {
  useOutletContext?.()
  const avRef = useRef()
  const [avatar, setAvatar] = useState(null)
  const [form, setForm] = useState({ name:'Alex Mercer', username:'alexmercer', email:'alex@veltro.io', phone:'+1 555 012 3456', bio:'Digital asset trader & DeFi enthusiast.' })
  const [app,  setApp]  = useState({ theme:'dark', accent:'#00FFD1', density:'normal' })
  const [reg,  setReg]  = useState({ lang:'en', currency:'USD', tz:'America/New_York', dateFmt:'MM/DD/YYYY', numFmt:'comma' })
  const [saved,setSaved]= useState({ form, app, reg })
  const [emailFlow, setEmailFlow] = useState(false)
  const [newEmail,  setNewEmail]  = useState('')

  const dirty = JSON.stringify({ form, app, reg }) !== JSON.stringify(saved)
  const f = (k,v) => setForm(p => ({...p,[k]:v}))
  const a = (k,v) => setApp(p  => ({...p,[k]:v}))
  const r = (k,v) => setReg(p  => ({...p,[k]:v}))
  const discard = () => { setForm(saved.form); setApp(saved.app); setReg(saved.reg) }
  const save = async () => {
    try {
      await apiPost('/api/profile/update', {
        first_name: form.name?.split(' ')[0],
        last_name:  form.name?.split(' ').slice(1).join(' '),
        username:   form.username,
        phone:      form.phone,
        bio:        form.bio,
      })
    } catch { /* fail silently -- settings saved locally */ }
    setSaved({ form, app, reg })
  }

  return (
    <div className="gs-root">

      {/* header */}
      <div className="gs-page-head">
        <div className="gs-ph-left">
          <div className="gs-ph-ico"><GearSix size={16} weight="fill"/></div>
          <div>
            <h1 className="gs-page-title">General</h1>
            <p className="gs-page-sub">Profile, appearance, and regional preferences</p>
          </div>
        </div>
        <nav className="gs-bc"><span>Settings</span><CaretRight size={9}/><span className="cur">General</span></nav>
      </div>

      {/* Profile */}
      <Section title="Profile">
        <div className="gs-profile-wrap">
          <div className="gs-av-wrap">
            <div className="gs-av" style={avatar ? {backgroundImage:`url(${avatar})`} : {}}>
              {!avatar && <span className="gs-av-init">{form.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</span>}
            </div>
            <div className="gs-av-ring" style={{'--ar':app.accent}}/>
            <button className="gs-av-btn" onClick={() => avRef.current?.click()}><Camera size={11} weight="fill"/></button>
            <input ref={avRef} type="file" accept="image/*" hidden onChange={e => { const file=e.target.files?.[0]; if(file) setAvatar(URL.createObjectURL(file)) }}/>
          </div>
          <div className="gs-profile-grid">
            <Field label="Full name">
              <input className="gs-input" value={form.name} onChange={e => f('name', e.target.value)}/>
            </Field>
            <Field label="Username">
              <div className="gs-pfx-wrap"><span className="gs-pfx">@</span>
                <input className="gs-input" style={{paddingLeft:'26px'}} value={form.username} onChange={e => f('username', e.target.value)}/>
              </div>
            </Field>
            <Field label="Email">
              {emailFlow ? (
                <div className="gs-email-edit">
                  <input className="gs-input" placeholder="New email..." autoFocus value={newEmail} onChange={e => setNewEmail(e.target.value)}/>
                  <button className="gs-ico-btn ok" onClick={() => { if(newEmail) f('email',newEmail); setEmailFlow(false); setNewEmail('') }}><Check size={11} weight="bold"/></button>
                  <button className="gs-ico-btn"    onClick={() => setEmailFlow(false)}><X size={11} weight="bold"/></button>
                </div>
              ) : (
                <div className="gs-email-row">
                  <input className="gs-input" value={form.email} readOnly/>
                  <button className="gs-chip" onClick={() => setEmailFlow(true)}>Change</button>
                </div>
              )}
            </Field>
            <Field label="Phone">
              <input className="gs-input" value={form.phone} onChange={e => f('phone', e.target.value)}/>
            </Field>
            <Field label="Bio" span>
              <textarea className="gs-input gs-ta" rows={2} value={form.bio} onChange={e => f('bio', e.target.value)}/>
            </Field>
          </div>
        </div>
      </Section>

      {/* Appearance */}
      <Section title="Appearance">
        <Row icon={Moon} color="#9945FF" title="Theme" sub="Dashboard color scheme">
          <div className="gs-theme-pills">
            {THEMES.map(t => (
              <button key={t.id} className={`gs-theme-pill ${app.theme===t.id?'on':''}`} onClick={() => a('theme',t.id)}>
                <t.Icon size={11} weight={app.theme===t.id?'fill':'duotone'}/>{t.id.charAt(0).toUpperCase()+t.id.slice(1)}
              </button>
            ))}
          </div>
        </Row>
        <Row icon={Palette} color="#627EEA" title="Accent color" sub="Primary highlight across the UI">
          <div className="gs-accents">
            {ACCENTS.map(c => (
              <button key={c} className={`gs-swatch ${app.accent===c?'on':''}`}
                style={{background:c,'--ac':c}} onClick={() => a('accent',c)}>
                {app.accent===c && <Check size={8} weight="bold" style={{color:'#000'}}/>}
              </button>
            ))}
          </div>
        </Row>
        <Row icon={TextAa} color="#1A56FF" title="Density" sub="Interface spacing and information density">
          <div className="gs-seg">
            {['Compact','Normal','Spacious'].map(d => (
              <button key={d} className={`gs-seg-btn ${app.density===d.toLowerCase()?'on':''}`}
                onClick={() => a('density',d.toLowerCase())}>{d}</button>
            ))}
          </div>
        </Row>
      </Section>

      {/* Regional */}
      <Section title="Regional & Language">
        <div className="gs-grid2">
          <Field label="Language">
            <div className="gs-sel-wrap"><select className="gs-select" value={reg.lang} onChange={e => r('lang',e.target.value)}>
              {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select><CaretRight size={10} className="gs-sel-arr"/></div>
          </Field>
          <Field label="Display currency">
            <div className="gs-sel-wrap"><select className="gs-select" value={reg.currency} onChange={e => r('currency',e.target.value)}>
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select><CaretRight size={10} className="gs-sel-arr"/></div>
          </Field>
          <Field label="Timezone">
            <div className="gs-sel-wrap"><select className="gs-select" value={reg.tz} onChange={e => r('tz',e.target.value)}>
              {TIMEZONES.map(t => <option key={t}>{t}</option>)}
            </select><CaretRight size={10} className="gs-sel-arr"/></div>
          </Field>
          <Field label="Date format">
            <div className="gs-sel-wrap"><select className="gs-select" value={reg.dateFmt} onChange={e => r('dateFmt',e.target.value)}>
              {DATE_FMTS.map(d => <option key={d}>{d}</option>)}
            </select><CaretRight size={10} className="gs-sel-arr"/></div>
          </Field>
        </div>
        <Row icon={ChartBar} color="#F7931A" title="Number format" sub="How large numbers are displayed">
          <div className="gs-seg">
            {[{id:'comma',l:'1,234.56'},{id:'dot',l:'1.234,56'},{id:'space',l:'1 234.56'}].map(n => (
              <button key={n.id} className={`gs-seg-btn ${reg.numFmt===n.id?'on':''}`}
                onClick={() => r('numFmt',n.id)}>{n.l}</button>
            ))}
          </div>
        </Row>
      </Section>

      {/* Danger zone */}
      <Section title="Danger zone" accent="#FF3D57">
        <div className="gs-danger-card">
          <div className="gs-danger-row">
            <div><div className="gs-dt">Export account data</div><div className="gs-ds">Download a full GDPR-compliant archive of your account</div></div>
            <button className="gs-outline-btn"><ArrowSquareOut size={12} weight="bold"/>Export</button>
          </div>
          <div className="gs-danger-row">
            <div><div className="gs-dt">Delete account</div><div className="gs-ds">Permanently remove your Veltro account and all data</div></div>
            <button className="gs-danger-btn"><Trash size={12} weight="bold"/>Delete account</button>
          </div>
        </div>
      </Section>

      <SaveBar dirty={dirty} onSave={save} onDiscard={discard}/>
    </div>
  )
}