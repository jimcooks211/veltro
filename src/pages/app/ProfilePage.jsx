import { useState, useRef, useCallback, useEffect } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { apiGet, apiPost, apiPut } from '../../utils/api.js'
import {
  UserCircle, CaretRight, Check, X, Camera, Pencil,
  EnvelopeSimple, Phone, MapPin, Briefcase, Globe,
  IdentificationCard, CalendarBlank, GenderIntersex, Link,
  ShieldCheck, Warning, CircleNotch, FloppyDisk,
  ChartLineUp, Lightning, Star, Lock, ArrowSquareOut,
  Buildings, TrendUp, CurrencyDollar,
} from '@phosphor-icons/react'
import './ProfilePage.css'

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MOCK DATA — mirrors DB schema exactly:
   users   : { id, email, role, plan, risk_profile, is_verified,
               registration_step, login_count, last_login_at,
               last_login_ip, created_at, gender, onboarding_complete }
   profiles: { first_name, last_name, username, display_name, bio,
               date_of_birth, gender, avatar_url, avatar_type,
               phone, phone_country, address_line1, address_line2,
               city, state, zip, country, country_code, website,
               kyc_status, occupation, investment_experience,
               investment_goal }
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const MOCK_USER = {
  id:                   'a3f2c1d0-8e4b-4f6a-9c2d-1b7e5f3a8c9d',
  email:                'alex.mercer@gmail.com',
  role:                 'user',
  plan:                 'growth',
  risk_profile:         'balanced',
  is_verified:          1,
  registration_step:    'complete',
  login_count:          84,
  last_login_at:        'Mar 10, 2026 · 09:02',
  last_login_ip:        '105.112.34.88',
  created_at:           'Jan 8, 2026',
  gender:               'male',
  onboarding_complete:  1,
}

const MOCK_PROFILE = {
  first_name:             'Alex',
  last_name:              'Mercer',
  username:               'alexmercer',
  display_name:           'Alex Mercer',
  bio:                    'Digital asset trader & DeFi enthusiast. Long-term believer in decentralised finance and emerging markets.',
  date_of_birth:          '1994-07-15',
  gender:                 'male',
  avatar_url:             null,
  avatar_type:            'preset',

  phone:                  '+234 801 234 5678',
  phone_country:          'NG',

  address_line1:          '14 Admiralty Way',
  address_line2:          'Lekki Phase 1',
  city:                   'Lagos',
  state:                  'Lagos',
  zip:                    '101245',
  country:                'Nigeria',
  country_code:           'NG',

  website:                'https://alexmercer.io',

  kyc_status:             'approved',
  kyc_submitted_at:       'Feb 14, 2026',
  kyc_reviewed_at:        'Feb 15, 2026',

  occupation:             'Software Engineer',
  investment_experience:  'moderate',
  investment_goal:        'wealth_growth',
}

/* â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */
const PLAN_META = {
  starter: { label:'Starter',  color:'rgba(255,255,255,.4)', bg:'rgba(255,255,255,.06)' },
  growth:  { label:'Growth',   color:'#FFB800',              bg:'rgba(255,184,0,.1)'    },
  elite:   { label:'Elite',    color:'#00FFD1',              bg:'rgba(0,255,209,.1)'    },
}
const RISK_META = {
conservative: { label:'Conservative', color:'#00C076', icon:'🛡️' },
balanced:     { label:'Balanced',     color:'#FFB800', icon:'⚠️' },
aggressive:   { label:'Aggressive',   color:'#FF3D57', icon:'⚡' },
}
const KYC_META = {
  none:     { label:'Not Started', color:'rgba(255,255,255,.3)', bg:'rgba(255,255,255,.06)'  },
  pending:  { label:'Pending',     color:'#FFB800',              bg:'rgba(255,184,0,.1)'     },
  approved: { label:'Verified',    color:'#00C076',              bg:'rgba(0,192,118,.1)'     },
  rejected: { label:'Rejected',    color:'#FF3D57',              bg:'rgba(255,61,87,.1)'     },
}
const EXP_LABELS = {
  limited:   'Limited',
  moderate:  'Moderate',
  extensive: 'Extensive',
}
const GOAL_LABELS = {
  wealth_growth:        'Wealth Growth',
  passive_income:       'Passive Income',
  capital_preservation: 'Capital Preservation',
  high_risk_reward:     'High Risk / Reward',
}

const GENDERS = ['male','female','non-binary','prefer-not-to-say']
const COUNTRIES = ['Nigeria','United States','United Kingdom','Canada','Australia','Germany','France','Singapore']
const EXP_OPTS  = ['limited','moderate','extensive']
const GOAL_OPTS = ['wealth_growth','passive_income','capital_preservation','high_risk_reward']
const RISK_OPTS = ['conservative','balanced','aggressive']
const PLAN_OPTS = ['starter','growth','elite']

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   HELPERS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function initials(first, last) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase()
}
function age(dob) {
  if (!dob) return null
  const d = new Date(dob)
  const now = new Date()
  return now.getFullYear() - d.getFullYear() -
    (now < new Date(now.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0)
}
function fmtDob(dob) {
  return '—'
  return new Date(dob).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SUB-COMPONENTS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function SaveBar({ dirty, onSave, onDiscard, saving, saved: wasSaved }) {
  if (!dirty && !wasSaved) return null
  return (
    <div className={`pp-savebar ${wasSaved ? 'done' : ''}`}>
      {wasSaved ? (
        <><Check size={11} weight="bold" style={{ color:'#00C076' }} />Changes saved successfully</>
      ) : (
        <>
          <span className="pp-sb-dot" />
          <span className="pp-sb-msg">You have unsaved changes</span>
          <button className="pp-sb-dis" onClick={onDiscard}><X size={10} weight="bold" />Discard</button>
          <button className="pp-sb-save" onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : <><FloppyDisk size={10} weight="bold" />Save changes</>}
          </button>
        </>
      )}
    </div>
  )
}

function Field({ label, children, span }) {
  return (
    <div className="pp-field" style={span ? { gridColumn:'1/-1' } : {}}>
      {label && <label className="pp-label">{label}</label>}
      {children}
    </div>
  )
}

function StatCard({ icon: Icon, color, label, value, sub }) {
  return (
    <div className="pp-stat-card">
      <div className="pp-stat-ico" style={{ background:`${color}18`, color }}><Icon size={14} weight="duotone" /></div>
      <div className="pp-stat-body">
        <div className="pp-stat-val">{value}</div>
        <div className="pp-stat-label">{label}</div>
        {sub && <div className="pp-stat-sub">{sub}</div>}
      </div>
    </div>
  )
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SECTION WRAPPERS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function Section({ title, icon: Icon, iconColor = 'var(--cy-neon,#00FFD1)', children }) {
  return (
    <div className="pp-section">
      <div className="pp-sec-head">
        <div className="pp-sec-ico" style={{ background:`${iconColor}18`, color:iconColor }}>
          <Icon size={13} weight="duotone" />
        </div>
        <span className="pp-sec-title">{title}</span>
      </div>
      <div className="pp-sec-body">{children}</div>
    </div>
  )
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   AVATAR
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function AvatarBlock({ profile, onAvatarChange }) {
  const fileRef = useRef()
  const [preview, setPreview] = useState(null)
  const prevUrlRef = useRef(null)    // track blob URL for cleanup
  const pick = e => {
    const f = e.target.files?.[0]
    if (!f) return

    // Revoke the previous blob URL to avoid memory leak
    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current)
      prevUrlRef.current = null
    }

    // Create preview URL for immediate display
    const previewUrl = URL.createObjectURL(f)
    prevUrlRef.current = previewUrl
    setPreview(previewUrl)

    // Convert to data URL for storage / saving to DB
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      onAvatarChange?.(dataUrl)
    }
    reader.readAsDataURL(f)
  }
  const src = preview || profile.avatar_url
  const kyc = KYC_META[profile.kyc_status]
  const plan = PLAN_META[MOCK_USER.plan]
  const risk = RISK_META[MOCK_USER.risk_profile]
  return (
    <div className="pp-avatar-block">
      <div className="pp-avatar-wrap">
        {src ? (
          <img src={src} alt="avatar" className="pp-avatar-img" />
        ) : (
          <div className="pp-avatar-init">
            {initials(profile.first_name, profile.last_name)}
          </div>
        )}
        <button className="pp-avatar-cam" onClick={() => fileRef.current?.click()}>
          <Camera size={11} weight="fill" />
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={pick} />
      </div>

      <div className="pp-avatar-info">
        <div className="pp-avatar-name">{profile.display_name || `${profile.first_name} ${profile.last_name}`}</div>
        <div className="pp-avatar-user">@{profile.username}</div>
        <div className="pp-avatar-chips">
          <span className="pp-chip" style={{ color:plan.color, background:plan.bg }}>
            <Star size={8} weight="fill" />{plan.label} Plan
          </span>
          <span className="pp-chip" style={{ color:kyc.color, background:kyc.bg }}>
            <ShieldCheck size={8} weight="fill" />KYC {kyc.label}
          </span>
          <span className="pp-chip" style={{ color:risk.color, background:`${risk.color}18` }}>
            {risk.icon} {risk.label}
          </span>
        </div>
        <div className="pp-avatar-meta">
          <span><CalendarBlank size={10} weight="duotone" /> Joined {MOCK_USER.created_at}</span>
          <span><Globe size={10} weight="duotone" /> {profile.country}</span>
          {profile.date_of_birth && <span><IdentificationCard size={10} weight="duotone" /> {age(profile.date_of_birth)} yrs old</span>}
        </div>
      </div>
    </div>
  )
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   ROOT — wired to real /api/profile/me
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export default function ProfilePage() {
  const { user: ctxUser, refreshUser } = useOutletContext() ?? {}
  const navigate = useNavigate()

  /* â"€â"€ state â"€â"€ */
  const [profile, setProfile]   = useState(null)
  const [saved,   setSaved]     = useState(null)
  const [userMeta,setUserMeta]  = useState(null)
  const [loading, setLoading]   = useState(true)
  const [saving,  setSaving]    = useState(false)
  const [wasSaved,setWasSaved]  = useState(false)
  const [editBio, setEditBio]   = useState(false)

  /* â"€â"€ fetch from API â"€â"€ */
  useEffect(() => {
    apiGet('/api/profile/me')
      .then(data => {
        const p = data.profile || data
        const profileData = {
          first_name:            p.first_name            || ctxUser?.firstName || '',
          last_name:             p.last_name             || ctxUser?.lastName  || '',
          username:              p.username              || ctxUser?.username  || '',
          display_name:          p.display_name          || `${p.first_name||''} ${p.last_name||''}`.trim() || '',
          bio:                   p.bio                   || '',
          date_of_birth:         p.date_of_birth         || '',
          gender:                p.gender                || 'male',
          avatar_url:            p.avatar_url            || null,
          avatar_type:           p.avatar_type           || 'preset',
          phone:                 p.phone                 || '',
          phone_country:         p.phone_country         || '',
          address_line1:         p.address_line1         || '',
          address_line2:         p.address_line2         || '',
          city:                  p.city                  || '',
          state:                 p.state                 || '',
          zip:                   p.zip                   || '',
          country:               p.country               || '',
          country_code:          p.country_code          || '',
          website:               p.website               || '',
          kyc_status:            p.kyc_status            || 'none',
          kyc_submitted_at:      p.kyc_submitted_at      || null,
          kyc_reviewed_at:       p.kyc_reviewed_at       || null,
          occupation:            p.occupation            || '',
          investment_experience: p.investment_experience || 'limited',
          investment_goal:       p.investment_goal       || 'wealth_growth',
        }
        const metaData = {
          id:                  p.user_id || ctxUser?.id || '',
          email:               p.email                 || ctxUser?.email || '',
          role:                p.role                  || 'user',
          plan:                p.plan                  || ctxUser?.plan || 'starter',
          risk_profile:        p.risk_profile          || ctxUser?.riskProfile || 'balanced',
          is_verified:         p.is_verified ?? 1,
          registration_step:   p.registration_step     || 'complete',
  login_count:         p.login_count           || 0,
  last_login_at:       p.last_login_at         || '—',
  last_login_ip:       p.last_login_ip         || '—',
          created_at:          p.created_at            || '—',
          onboarding_complete: p.onboarding_complete   || 1,
        }
        setProfile(profileData)
        setSaved(profileData)
        setUserMeta(metaData)
      })
      .catch(() => {
        // Graceful fallback using context user
        const fallback = {
          first_name: ctxUser?.firstName||'', last_name: ctxUser?.lastName||'',
          username: ctxUser?.username||'', display_name: `${ctxUser?.firstName||''} ${ctxUser?.lastName||''}`.trim(),
          bio:'', date_of_birth:'', gender:'male', avatar_url: ctxUser?.avatar||null,
          avatar_type:'preset', phone:'', phone_country:'', address_line1:'', address_line2:'',
          city:'', state:'', zip:'', country:'', country_code:'', website:'',
          kyc_status:'none', kyc_submitted_at:null, kyc_reviewed_at:null,
          occupation:'', investment_experience:'limited', investment_goal:'wealth_growth',
        }
        const fallbackMeta = {
          id: ctxUser?.id||'', email: ctxUser?.email||'', role:'user',
          plan: ctxUser?.plan||'starter', risk_profile: ctxUser?.riskProfile||'balanced',
          is_verified:1, registration_step:'complete', login_count:0,
          last_login_at:'—', last_login_ip:'—', created_at:'—', onboarding_complete:1,
        }
        setProfile(fallback); setSaved(fallback); setUserMeta(fallbackMeta)
      })
      .finally(() => setLoading(false))
  }, [ctxUser?.id])

  const dirty = profile && saved && JSON.stringify(profile) !== JSON.stringify(saved)

  const set  = useCallback((k, v) => setProfile(p => ({ ...p, [k]: v })), [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await apiPut('/api/profile/update', {
        first_name:            profile.first_name,
        last_name:             profile.last_name,
        username:              profile.username,
        display_name:          profile.display_name,
        bio:                   profile.bio,
        avatar_url:            profile.avatar_url,
        date_of_birth:         profile.date_of_birth || null,
        gender:                profile.gender,
        phone:                 profile.phone,
        phone_country:         profile.phone_country,
        address_line1:         profile.address_line1,
        address_line2:         profile.address_line2,
        city:                  profile.city,
        state:                 profile.state,
        zip:                   profile.zip,
        country:               profile.country,
        country_code:          profile.country_code,
        website:               profile.website,
        occupation:            profile.occupation,
        investment_experience: profile.investment_experience,
        investment_goal:       profile.investment_goal,
      })
      setSaved({ ...profile })
      setWasSaved(true)
      setTimeout(() => setWasSaved(false), 2200)
      
      // Refresh user context to update navbar/sidebar with new avatar
      if (refreshUser) await refreshUser()
    } catch (err) {
      console.error('Profile save error:', err.message)
    } finally {
      setSaving(false)
    }
  }
  const handleDiscard = () => { setProfile({ ...saved }) }

  /* â"€â"€ loading state â"€â"€ */
  if (loading) {
    return (
      <div className="pp-root" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:400 }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, color:'var(--vlt-text-muted)' }}>
          <CircleNotch size={28} weight="duotone" style={{ animation:'spin 0.8s linear infinite', opacity:0.5 }}/>
Loading profile…
        </div>
      </div>
    )
  }

  const kyc  = KYC_META[profile.kyc_status] || KYC_META.none
  const plan = PLAN_META[userMeta?.plan] || PLAN_META.starter
  const risk = RISK_META[userMeta?.risk_profile] || RISK_META.balanced

  return (
    <div className="pp-root">

      {/* â"€â"€â"€ PAGE HEADER â"€â"€â"€ */}
      <div className="pp-page-head">
        <div className="pp-head-left">
          <div className="pp-head-ico"><UserCircle size={16} weight="fill" /></div>
          <div>
            <h1 className="pp-page-title">My Profile</h1>
            <p className="pp-page-sub">Manage your personal information, investor profile, and preferences</p>
          </div>
        </div>
        <div className="pp-head-actions">
          <button className="pp-head-btn" onClick={() => navigate('../settings')}>
            <ArrowSquareOut size={12} weight="bold" />Settings
          </button>
          <button className="pp-head-btn" onClick={() => navigate('../settings/kyc')}>
            <ShieldCheck size={12} weight="bold" />KYC Status
          </button>
        </div>
        <nav className="pp-bc">
          <span>Dashboard</span><CaretRight size={9} /><span className="pp-bc-cur">Profile</span>
        </nav>
      </div>

      {/* â"€â"€â"€ SAVE BAR â"€â"€â"€ */}
      <SaveBar dirty={dirty} onSave={handleSave} onDiscard={handleDiscard} saving={saving} saved={wasSaved} />

      {/* â"€â"€â"€ ACCOUNT STATS â"€â"€â"€ */}
      <div className="pp-stats-row">
        <StatCard icon={ChartLineUp}  color="#00FFD1" label="Total Logins"   value={userMeta?.login_count ?? 0}  sub="All time" />
        <StatCard icon={CurrencyDollar}        color="#FFB800" label="Plan"           value={plan.label}        sub={`Active since ${String(userMeta?.created_at||'—').split('T')[0]}`} />
        <StatCard icon={ShieldCheck}  color={kyc.color} label="KYC Status"  value={kyc.label}         sub={profile.kyc_reviewed_at ? `Verified ${profile.kyc_reviewed_at}` : '—'} />
        <StatCard icon={TrendUp}      color={risk.color} label="Risk Profile" value={risk.label}       sub="Investment style" />
        <StatCard icon={Lock}         color="#9945FF" label="Last Login"     value={String(userMeta?.last_login_at||'—').split('T')[0]} sub={userMeta?.last_login_ip||'—'} />
        <StatCard icon={Lightning}      color="#1A56FF" label="Account Role"   value={String(userMeta?.role||'user').charAt(0).toUpperCase()+String(userMeta?.role||'user').slice(1)} sub={`Step: ${userMeta?.registration_step||'complete'}`} />
      </div>

      {/* â"€â"€â"€ MAIN GRID â"€â"€â"€ */}
      <div className="pp-grid">

        {/* â"€â"€ LEFT COL â"€â"€ */}
        <div className="pp-left">

          {/* Avatar card */}
          <div className="pp-card pp-avatar-card">
            <AvatarBlock profile={profile} onAvatarChange={url => set('avatar_url', url)} />
            {/* Bio */}
            <div className="pp-bio-wrap">
              {editBio ? (
                <>
                  <textarea
                    className="pp-bio-area"
                    value={profile.bio}
                    rows={4}
                    maxLength={160}
                    onChange={e => set('bio', e.target.value)}
                    autoFocus
                  />
                  <div className="pp-bio-foot">
                    <span className="pp-bio-count">{profile.bio.length}/160</span>
                    <button className="pp-bio-done" onClick={() => setEditBio(false)}>
                      <Check size={10} weight="bold" />Done
                    </button>
                  </div>
                </>
              ) : (
                <div className="pp-bio-static" onClick={() => setEditBio(true)}>
                  <p>{profile.bio || <span className="pp-bio-empty">Add a bio…</span>}</p>
                  <button className="pp-bio-edit"><Pencil size={10} weight="bold" /></button>
                </div>
              )}
            </div>
          </div>

          {/* Account info (read-only) */}
          <div className="pp-card">
            <Section title="Account Information" icon={IdentificationCard} iconColor="#1A56FF">
              <div className="pp-info-grid">
                {[
                  { l:'User ID',         v: String(userMeta?.id||'—').slice(0,18)+'…'         },
                  { l:'Email Address',   v: userMeta?.email || '—'                             },
                  { l:'Email Verified',  v: (userMeta?.is_verified) ? 'Verified' : 'Not verified',
                    c: (userMeta?.is_verified) ? '#00C076' : '#FF3D57'                          },
                  { l:'Account Role',    v: userMeta?.role || 'user'                           },
                  { l:'Onboarding',      v: userMeta?.onboarding_complete ? 'Complete' : 'Incomplete' },
                  { l:'Member Since',    v: String(userMeta?.created_at||'—').split('T')[0]    },
                  { l:'Last Login',      v: String(userMeta?.last_login_at||'—').split('T')[0] },
                  { l:'Login IP',        v: userMeta?.last_login_ip || '—'                     },
                ].map(r => (
                  <div key={r.l} className="pp-info-row">
                    <span className="pp-info-l">{r.l}</span>
                    <span className="pp-info-v" style={r.c ? { color:r.c } : {}}>{r.v}</span>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        </div>

        {/* â"€â"€ RIGHT COL â"€â"€ */}
        <div className="pp-right">

          {/* Personal details */}
          <div className="pp-card">
            <Section title="Personal Details" icon={UserCircle}>
              <div className="pp-form-grid">
                <Field label="First Name">
                  <input className="pp-input" value={profile.first_name}
                    onChange={e => set('first_name', e.target.value)} />
                </Field>
                <Field label="Last Name">
                  <input className="pp-input" value={profile.last_name}
                    onChange={e => set('last_name', e.target.value)} />
                </Field>
                <Field label="Username">
                  <div className="pp-input-pfx-wrap">
                    <span className="pp-input-pfx">@</span>
                    <input className="pp-input pfx" value={profile.username}
                      onChange={e => set('username', e.target.value)} />
                  </div>
                </Field>
                <Field label="Display Name">
                  <input className="pp-input" value={profile.display_name}
                    onChange={e => set('display_name', e.target.value)} />
                </Field>
                <Field label="Date of Birth">
                  <input className="pp-input" type="date" value={profile.date_of_birth}
                    onChange={e => set('date_of_birth', e.target.value)} />
                </Field>
                <Field label="Gender">
                  <div className="pp-sel-wrap">
                    <select className="pp-select" value={profile.gender}
                      onChange={e => set('gender', e.target.value)}>
                      {GENDERS.map(g => <option key={g} value={g}>{g.charAt(0).toUpperCase()+g.slice(1).replace('-',' ')}</option>)}
                    </select>
                    <CaretRight size={9} className="pp-sel-arr" />
                  </div>
                </Field>
                <Field label="Occupation" span>
                  <input className="pp-input" value={profile.occupation}
                    onChange={e => set('occupation', e.target.value)} />
                </Field>
              </div>
            </Section>
          </div>

          {/* Contact */}
          <div className="pp-card">
            <Section title="Contact Details" icon={Phone} iconColor="#00C076">
              <div className="pp-form-grid">
                <Field label="Email Address" span>
                  <div className="pp-input-ico-wrap">
                    <EnvelopeSimple size={12} className="pp-input-ico" />
                    <input className="pp-input ico" value={userMeta?.email || ''} readOnly />
                    <span className="pp-input-locked"><Lock size={9} weight="fill" />Managed in Security</span>
                  </div>
                </Field>
                <Field label="Phone Number">
                  <input className="pp-input" value={profile.phone}
                    onChange={e => set('phone', e.target.value)} />
                </Field>
                <Field label="Country Code">
                  <input className="pp-input" value={profile.phone_country}
                    onChange={e => set('phone_country', e.target.value.toUpperCase().slice(0,2))}
                    maxLength={2} />
                </Field>
                <Field label="Website" span>
                  <div className="pp-input-ico-wrap">
                    <Link size={12} className="pp-input-ico" />
                    <input className="pp-input ico" value={profile.website}
                      onChange={e => set('website', e.target.value)}
                      placeholder="https://yoursite.com" />
                  </div>
                </Field>
              </div>
            </Section>
          </div>

          {/* Address */}
          <div className="pp-card">
            <Section title="Address" icon={MapPin} iconColor="#F7931A">
              <div className="pp-form-grid">
                <Field label="Address Line 1" span>
                  <input className="pp-input" value={profile.address_line1}
                    onChange={e => set('address_line1', e.target.value)} />
                </Field>
                <Field label="Address Line 2" span>
                  <input className="pp-input" value={profile.address_line2}
                    onChange={e => set('address_line2', e.target.value)}
                    placeholder="Apt, suite, unit..." />
                </Field>
                <Field label="City">
                  <input className="pp-input" value={profile.city}
                    onChange={e => set('city', e.target.value)} />
                </Field>
                <Field label="State / Region">
                  <input className="pp-input" value={profile.state}
                    onChange={e => set('state', e.target.value)} />
                </Field>
                <Field label="ZIP / Postal Code">
                  <input className="pp-input" value={profile.zip}
                    onChange={e => set('zip', e.target.value)} />
                </Field>
                <Field label="Country Code">
                  <input className="pp-input" value={profile.country_code}
                    onChange={e => set('country_code', e.target.value.toUpperCase().slice(0,2))}
                    maxLength={2} />
                </Field>
                <Field label="Country" span>
                  <div className="pp-sel-wrap">
                    <select className="pp-select" value={profile.country}
                      onChange={e => set('country', e.target.value)}>
                      {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <CaretRight size={9} className="pp-sel-arr" />
                  </div>
                </Field>
              </div>
            </Section>
          </div>

          {/* Investor Profile */}
          <div className="pp-card">
            <Section title="Investor Profile" icon={Briefcase} iconColor="#9945FF">
              <div className="pp-form-grid">

                {/* Plan selector */}
                <Field label="Plan" span>
                  <div className="pp-plan-pills">
                    {PLAN_OPTS.map(p => {
                      const m = PLAN_META[p]
                      const isActive = (userMeta?.plan || 'starter') === p
                      return (
                        <button key={p}
                          className={`pp-plan-pill ${isActive ? 'on' : ''}`}
                          style={isActive ? { color:m.color, borderColor:`${m.color}55`, background:`${m.color}12` } : {}}
                          onClick={() => setUserMeta(u => ({...u, plan: p}))}>
                          <Star size={9} weight={isActive ? 'fill' : 'regular'} />
                          {m.label}
                          {isActive && <Check size={8} weight="bold" style={{ marginLeft:'auto' }} />}
                        </button>
                      )
                    })}
                  </div>
                </Field>

                {/* Risk profile */}
                <Field label="Risk Profile" span>
                  <div className="pp-risk-pills">
                    {RISK_OPTS.map(r => {
                      const m = RISK_META[r]
                      const isActive = (userMeta?.risk_profile || 'balanced') === r
                      return (
                        <button key={r}
                          className={`pp-risk-pill ${isActive ? 'on' : ''}`}
                          style={isActive ? { color:m.color, borderColor:`${m.color}55`, background:`${m.color}12` } : {}}
                          onClick={() => setUserMeta(u => ({...u, risk_profile: r}))}>
                          <span className="pp-risk-ico">{m.icon}</span>
                          {m.label}
                          {isActive && <Check size={8} weight="bold" style={{ marginLeft:'auto' }} />}
                        </button>
                      )
                    })}
                  </div>
                </Field>

                {/* Experience */}
                <Field label="Investment Experience">
                  <div className="pp-sel-wrap">
                    <select className="pp-select" value={profile.investment_experience}
                      onChange={e => set('investment_experience', e.target.value)}>
                      {EXP_OPTS.map(o => <option key={o} value={o}>{EXP_LABELS[o]}</option>)}
                    </select>
                    <CaretRight size={9} className="pp-sel-arr" />
                  </div>
                </Field>

                {/* Goal */}
                <Field label="Investment Goal">
                  <div className="pp-sel-wrap">
                    <select className="pp-select" value={profile.investment_goal}
                      onChange={e => set('investment_goal', e.target.value)}>
                      {GOAL_OPTS.map(o => <option key={o} value={o}>{GOAL_LABELS[o]}</option>)}
                    </select>
                    <CaretRight size={9} className="pp-sel-arr" />
                  </div>
                </Field>

              </div>
            </Section>
          </div>

          {/* KYC status (read-only summary) */}
          <div className="pp-card">
            <Section title="KYC Verification" icon={ShieldCheck} iconColor={kyc.color}>
              <div className="pp-kyc-block">
                <div className="pp-kyc-badge" style={{ color:kyc.color, background:kyc.bg }}>
                  <ShieldCheck size={18} weight="duotone" />
                  <div>
                    <div className="pp-kyc-badge-title">{kyc.label}</div>
                    <div className="pp-kyc-badge-sub">
                      {profile.kyc_status === 'approved'
                        ? `Reviewed on ${profile.kyc_reviewed_at}`
                        : profile.kyc_status === 'pending'
                        ? `Submitted ${profile.kyc_submitted_at}`
                        : 'Identity not yet verified'}
                    </div>
                  </div>
                </div>
                <div className="pp-kyc-info">
                  {profile.kyc_status !== 'approved' && (
                    <div className="pp-kyc-warn">
                      <Warning size={10} weight="fill" />
                      Complete KYC to unlock withdrawals and higher trade limits.
                    </div>
                  )}
                  <button className="pp-kyc-btn" onClick={() => navigate('../settings/kyc')}>
                    {profile.kyc_status === 'none' ? 'Start KYC' :
                     profile.kyc_status === 'rejected' ? 'Resubmit KYC' : 'View KYC Details'}
                    <CaretRight size={10} weight="bold" />
                  </button>
                </div>
              </div>
            </Section>
          </div>

        </div>
      </div>
    </div>
  )
}

