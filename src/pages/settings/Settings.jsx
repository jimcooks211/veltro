import { useState, useRef, useEffect, useCallback } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { apiGet, apiPut, apiDelete } from '../../utils/api.js'
import {
  GearSix, Camera, Check, X, CaretRight,
  Moon, Sun, Desktop, Palette, TextAa,
  ChartBar, ArrowSquareOut, Trash, Warning, CircleNotch,
} from '@phosphor-icons/react'
import './Settings.css'

function Field({ label, error, span, children }) {
  return (
    <div className="gs-field" style={span ? { gridColumn: '1/-1' } : {}}>
      {label && <label className="gs-label">{label}</label>}
      {children}
      {error && <span className="gs-err"><Warning size={10} weight="fill" />{error}</span>}
    </div>
  )
}

function Row({ icon: Icon, color = '#00FFD1', title, sub, children }) {
  return (
    <div className="gs-row">
      {Icon && <div className="gs-row-ico" style={{ background: `${color}15`, color }}><Icon size={14} weight="duotone" /></div>}
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

function SaveBar({ dirty, saving, saved: wasSaved, onSave, onDiscard }) {
  if (!dirty && !wasSaved) return null
  return (
    <div className="gs-savebar">
      {wasSaved ? (
        <><Check size={11} weight="bold" style={{ color: '#00C076' }} />Changes saved successfully</>
      ) : (
        <>
          <span className="gs-sb-dot" />
          <span className="gs-sb-msg">Unsaved changes</span>
          <button className="gs-sb-dis" onClick={onDiscard}><X size={10} weight="bold" />Discard</button>
          <button className="gs-sb-save" onClick={onSave} disabled={saving}>
            {saving ? <><span className="gs-sb-spin" />Saving...</> : <><Check size={10} weight="bold" />Save changes</>}
          </button>
        </>
      )}
    </div>
  )
}

function DeleteModal({ onConfirm, onCancel, deleting }) {
  const [confirm, setConfirm] = useState('')
  return (
    <div className="gs-modal-overlay" onClick={onCancel}>
      <div className="gs-modal" onClick={e => e.stopPropagation()}>
        <div className="gs-modal-head">
          <div className="gs-modal-ico"><Trash size={16} weight="duotone" /></div>
          <div>
            <div className="gs-modal-title">Delete account</div>
            <div className="gs-modal-sub">This action is permanent and cannot be undone</div>
          </div>
        </div>
        <p className="gs-modal-warn">
          All your data will be permanently erased. Type <strong>DELETE</strong> to confirm.
        </p>
        <input className="gs-input" placeholder='Type DELETE to confirm'
          value={confirm} onChange={e => setConfirm(e.target.value)} autoFocus />
        <div className="gs-modal-actions">
          <button className="gs-outline-btn" onClick={onCancel} disabled={deleting}>Cancel</button>
          <button className="gs-danger-btn" onClick={onConfirm} disabled={confirm !== 'DELETE' || deleting}>
            {deleting
              ? <><CircleNotch size={11} style={{ animation: 'spin 0.8s linear infinite' }} />Deleting...</>
              : <><Trash size={11} weight="bold" />Delete permanently</>}
          </button>
        </div>
      </div>
    </div>
  )
}

const ACCENTS   = ['#00FFD1','#1A56FF','#F7931A','#9945FF','#FF3D57','#FFB800','#00C076','#627EEA']
const THEMES    = [{ id: 'dark', Icon: Moon }, { id: 'light', Icon: Sun }, { id: 'system', Icon: Desktop }]
const LANGUAGES = [{ value:'en',label:'English' },{ value:'es',label:'Espanol' },{ value:'fr',label:'Francais' },{ value:'de',label:'Deutsch' },{ value:'zh',label:'Chinese' },{ value:'ja',label:'Japanese' },{ value:'ar',label:'Arabic' },{ value:'pt',label:'Portugues' }]
const CURRENCIES = ['USD','EUR','GBP','JPY','AUD','CAD','CHF','SGD']
const TIMEZONES  = ['UTC','America/New_York','America/Los_Angeles','America/Chicago','Europe/London','Europe/Paris','Asia/Tokyo','Asia/Singapore']
const DATE_FMTS  = ['MM/DD/YYYY','DD/MM/YYYY','YYYY-MM-DD','DD MMM YYYY']

export default function Settings() {
  const { user: ctxUser, refreshUser } = useOutletContext() ?? {}
  const navigate = useNavigate()
  const avRef = useRef()

  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [wasSaved, setWasSaved] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDel,  setShowDel]  = useState(false)

  const [avatarPreview, setAvatarPreview] = useState(null)
  const [form, setForm] = useState({ first_name:'', last_name:'', username:'', email:'', phone:'', bio:'', avatar_url: null })
  const [savedForm, setSavedForm] = useState(null)

  const [app, setApp] = useState({ theme:'dark', accent:'#00FFD1', density:'normal' })
  const [reg, setReg] = useState({ lang:'en', currency:'USD', tz:'America/New_York', dateFmt:'MM/DD/YYYY', numFmt:'comma' })
  const [savedApp, setSavedApp] = useState(null)
  const [savedReg, setSavedReg] = useState(null)

  useEffect(() => {
    apiGet('/api/profile/me')
      .then(data => {
        const p = data.profile || data
        const loaded = {
          first_name: p.first_name  || ctxUser?.firstName || '',
          last_name:  p.last_name   || ctxUser?.lastName  || '',
          username:   p.username    || ctxUser?.username  || '',
          email:      p.email       || ctxUser?.email     || '',
          phone:      p.phone       || '',
          bio:        p.bio         || '',
          avatar_url: p.avatar_url  || ctxUser?.avatar    || null,
        }
        setForm(loaded); setSavedForm(loaded); setAvatarPreview(loaded.avatar_url)
      })
      .catch(() => {
        const fb = { first_name: ctxUser?.firstName||'', last_name: ctxUser?.lastName||'', username: ctxUser?.username||'', email: ctxUser?.email||'', phone:'', bio:'', avatar_url: ctxUser?.avatar||null }
        setForm(fb); setSavedForm(fb); setAvatarPreview(fb.avatar_url)
      })
      .finally(() => setLoading(false))
  }, [ctxUser?.id])

  useEffect(() => {
    setSavedApp({ theme:'dark', accent:'#00FFD1', density:'normal' })
    setSavedReg({ lang:'en', currency:'USD', tz:'America/New_York', dateFmt:'MM/DD/YYYY', numFmt:'comma' })
  }, [])

  const f = useCallback((k, v) => setForm(p => ({ ...p, [k]: v })), [])
  const a = (k, v) => setApp(p => ({ ...p, [k]: v }))
  const r = (k, v) => setReg(p => ({ ...p, [k]: v }))

  const dirty = savedForm
    ? JSON.stringify({ form, app, reg }) !== JSON.stringify({ form: savedForm, app: savedApp, reg: savedReg })
    : false

  const discard = () => { setForm({ ...savedForm }); setAvatarPreview(savedForm?.avatar_url || null); setApp({ ...savedApp }); setReg({ ...savedReg }) }

  const handleAvatarPick = e => {
    const file = e.target.files?.[0]; if (!file) return
    setAvatarPreview(URL.createObjectURL(file))
    const reader = new FileReader()
    reader.onload = () => f('avatar_url', reader.result)
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await apiPut('/api/profile/update', { first_name: form.first_name, last_name: form.last_name, username: form.username, phone: form.phone, bio: form.bio, avatar_url: form.avatar_url })
      setSavedForm({ ...form }); setSavedApp({ ...app }); setSavedReg({ ...reg })
      setWasSaved(true); setTimeout(() => setWasSaved(false), 2200)
      if (refreshUser) await refreshUser()
    } catch (err) { console.error('Settings save error:', err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await apiDelete('/api/auth/delete-account')
      ;['accessToken','refreshToken'].forEach(k => { sessionStorage.removeItem(k); localStorage.removeItem(k) })
      window.location.replace('/auth')
    } catch (err) { console.error('Delete error:', err.message); setDeleting(false); setShowDel(false) }
  }

  const initials = ((form.first_name?.[0]||'') + (form.last_name?.[0]||'')).toUpperCase() || '??'

  if (loading) {
    return (
      <div className="gs-root" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:400 }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, color:'var(--vlt-text-muted)' }}>
          <CircleNotch size={28} weight="duotone" style={{ animation:'spin 0.8s linear infinite', opacity:0.5 }} />
          Loading settings...
        </div>
      </div>
    )
  }

  return (
    <div className="gs-root">

      <div className="gs-page-head">
        <div className="gs-ph-left">
          <div className="gs-ph-ico"><GearSix size={16} weight="fill" /></div>
          <div>
            <h1 className="gs-page-title">General</h1>
            <p className="gs-page-sub">Profile, appearance, and regional preferences</p>
          </div>
        </div>
        <nav className="gs-bc"><span>Settings</span><CaretRight size={9} /><span className="cur">General</span></nav>
      </div>

      <Section title="Profile">
        <div className="gs-profile-wrap">
          <div className="gs-av-wrap">
            <div className="gs-av" style={avatarPreview ? { backgroundImage: `url(${avatarPreview})` } : {}}>
              {!avatarPreview && <span className="gs-av-init">{initials}</span>}
            </div>
            <div className="gs-av-ring" style={{ '--ar': app.accent }} />
            <button className="gs-av-btn" onClick={() => avRef.current?.click()}><Camera size={11} weight="fill" /></button>
            <input ref={avRef} type="file" accept="image/*" hidden onChange={handleAvatarPick} />
          </div>
          <div className="gs-profile-grid">
            <Field label="First Name">
              <input className="gs-input" value={form.first_name} onChange={e => f('first_name', e.target.value)} />
            </Field>
            <Field label="Last Name">
              <input className="gs-input" value={form.last_name} onChange={e => f('last_name', e.target.value)} />
            </Field>
            <Field label="Username">
              <div className="gs-pfx-wrap">
                <span className="gs-pfx">@</span>
                <input className="gs-input" style={{ paddingLeft:'26px' }} value={form.username} onChange={e => f('username', e.target.value)} />
              </div>
            </Field>
            <Field label="Email">
              <div className="gs-email-row">
                <input className="gs-input" value={form.email} readOnly />
                <button className="gs-chip" onClick={() => navigate('../settings/security')}>Change</button>
              </div>
            </Field>
            <Field label="Phone">
              <input className="gs-input" value={form.phone} onChange={e => f('phone', e.target.value)} />
            </Field>
            <Field label="Bio" span>
              <textarea className="gs-input gs-ta" rows={2} value={form.bio} onChange={e => f('bio', e.target.value)} maxLength={160} />
            </Field>
          </div>
        </div>
      </Section>

      <Section title="Appearance">
        <Row icon={Moon} color="#9945FF" title="Theme" sub="Dashboard color scheme">
          <div className="gs-theme-pills">
            {THEMES.map(t => (
              <button key={t.id} className={`gs-theme-pill${app.theme === t.id ? " active" : ""}`} onClick={() => a('theme', t.id)}>
                <t.Icon size={11} weight={app.theme === t.id ? 'fill' : 'duotone'} />
                {t.id.charAt(0).toUpperCase() + t.id.slice(1)}
              </button>
            ))}
          </div>
        </Row>
        <Row icon={Palette} color="#627EEA" title="Accent color" sub="Primary highlight across the UI">
          <div className="gs-accents">
            {ACCENTS.map(c => (
              <button key={c} className={`gs-swatch${app.accent === c ? " active" : ""}`} style={{ background: c, '--ac': c }} onClick={() => a('accent', c)}>
                {app.accent === c && <Check size={8} weight="bold" style={{ color:'#000' }} />}
              </button>
            ))}
          </div>
        </Row>
        <Row icon={TextAa} color="#1A56FF" title="Density" sub="Interface spacing and information density">
          <div className="gs-seg">
            {['Compact','Normal','Spacious'].map(d => (
              <button key={d} className={`gs-seg-btn${app.density === d.toLowerCase() ? " active" : ""}`} onClick={() => a('density', d.toLowerCase())}>{d}</button>
            ))}
          </div>
        </Row>
      </Section>

      <Section title="Regional and Language">
        <div className="gs-grid2">
          <Field label="Language">
            <div className="gs-sel-wrap"><select className="gs-select" value={reg.lang} onChange={e => r('lang', e.target.value)}>
              {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select><CaretRight size={10} className="gs-sel-arr" /></div>
          </Field>
          <Field label="Display currency">
            <div className="gs-sel-wrap"><select className="gs-select" value={reg.currency} onChange={e => r('currency', e.target.value)}>
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select><CaretRight size={10} className="gs-sel-arr" /></div>
          </Field>
          <Field label="Timezone">
            <div className="gs-sel-wrap"><select className="gs-select" value={reg.tz} onChange={e => r('tz', e.target.value)}>
              {TIMEZONES.map(t => <option key={t}>{t}</option>)}
            </select><CaretRight size={10} className="gs-sel-arr" /></div>
          </Field>
          <Field label="Date format">
            <div className="gs-sel-wrap"><select className="gs-select" value={reg.dateFmt} onChange={e => r('dateFmt', e.target.value)}>
              {DATE_FMTS.map(d => <option key={d}>{d}</option>)}
            </select><CaretRight size={10} className="gs-sel-arr" /></div>
          </Field>
        </div>
        <Row icon={ChartBar} color="#F7931A" title="Number format" sub="How large numbers are displayed">
          <div className="gs-seg">
            {[{ id:'comma',l:'1,234.56' },{ id:'dot',l:'1.234,56' },{ id:'space',l:'1 234.56' }].map(n => (
              <button key={n.id} className={`gs-seg-btn${reg.numFmt === n.id ? " active" : ""}`} onClick={() => r('numFmt', n.id)}>{n.l}</button>
            ))}
          </div>
        </Row>
      </Section>

      <Section title="Danger zone" accent="#FF3D57">
        <div className="gs-danger-card">
          <div className="gs-danger-row">
            <div><div className="gs-dt">Export account data</div><div className="gs-ds">Download a full GDPR-compliant archive of your account</div></div>
            <button className="gs-outline-btn"><ArrowSquareOut size={12} weight="bold" />Export</button>
          </div>
          <div className="gs-danger-row">
            <div><div className="gs-dt">Delete account</div><div className="gs-ds">Permanently remove your Veltro account and all data</div></div>
            <button className="gs-danger-btn" onClick={() => setShowDel(true)}><Trash size={12} weight="bold" />Delete account</button>
          </div>
        </div>
      </Section>

      <SaveBar dirty={dirty} saving={saving} saved={wasSaved} onSave={handleSave} onDiscard={discard} />
      {showDel && <DeleteModal onConfirm={handleDelete} onCancel={() => setShowDel(false)} deleting={deleting} />}
    </div>
  )
}
