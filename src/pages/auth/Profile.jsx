import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import { isValidPhoneNumber } from 'react-phone-number-input'
import {
  Camera, CheckCircle, WarningCircle, FloppyDisk,
  MapPin, EnvelopeSimple, IdentificationCard,
  Briefcase, Trash, MagnifyingGlass, CaretDown,
  ArrowLeft, ArrowRight, Spinner
} from '@phosphor-icons/react'
import 'react-datepicker/dist/react-datepicker.css'
import VeltroModal from '../../hooks/VeltroModal'
import '../../hooks/VeltroModal.css'
import { createPortal } from 'react-dom'
import IMG     from './IMG/SignIn_SideImg.avif'
import AVATAR  from '../public/users/user-1.jpg'
import AVATAR2 from '../public/users/user-2.jpg'
import AVATAR3 from '../public/users/user-3.jpg'
import AVATAR4 from '../public/users/user-4.jpg'
import './Createprofile.css'
import { COUNTRIES, DEFAULT_COUNTRY } from '../../data/Countries'

/* ── read token from whichever store it was placed in ── */
function getAccessToken() {
  return sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken') || null
}
function clearTokens() {
  ;['accessToken', 'refreshToken'].forEach(k => {
    sessionStorage.removeItem(k)
    localStorage.removeItem(k)
  })
}

/* ══════════════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════════════ */
const DEFAULT_AVATAR = AVATAR
const SEEDS = [AVATAR, AVATAR2, AVATAR3, AVATAR4]

const SEGMENTS = [
  { id: 'identity', title: 'Your identity',    subtitle: 'Tell us who you are',             icon: IdentificationCard },
  { id: 'contact',  title: 'Contact details',  subtitle: 'How people can reach you',         icon: EnvelopeSimple     },
  { id: 'address',  title: 'Your location',    subtitle: 'Where in the world are you?',      icon: MapPin             },
  { id: 'investor', title: 'Investor profile', subtitle: 'Help us personalise your journey', icon: Briefcase          },
]
const N = SEGMENTS.length

const EXPERIENCE_OPTIONS = [
  { value: 'limited',   label: 'Limited',   sub: 'Familiar with basic investment concepts'              },
  { value: 'moderate',  label: 'Moderate',  sub: 'Trades occasionally, understands market risk'         },
  { value: 'extensive', label: 'Extensive', sub: 'Active trader, experienced with advanced instruments' },
]

const GENDER_OPTIONS = [
  { value: 'male',              label: 'Male'             },
  { value: 'female',            label: 'Female'           },
  { value: 'non-binary',        label: 'Non-binary'       },
  { value: 'prefer-not-to-say', label: 'Prefer not to say'},
]

/* ══════════════════════════════════════════════════════════════════
   PHONE FORMATTING
══════════════════════════════════════════════════════════════════ */
const formatDigits = (raw, maxLen) => {
  const d = raw.replace(/\D/g, '').slice(0, maxLen)
  if (!d) return ''
  if (maxLen <= 7)  return d.replace(/^(\d{1,3})(\d{0,4})$/,          (_, a, b)    => [a, b].filter(Boolean).join('-'))
  if (maxLen === 8) return d.replace(/^(\d{1,4})(\d{0,4})$/,          (_, a, b)    => [a, b].filter(Boolean).join('-'))
  if (maxLen === 9) return d.replace(/^(\d{1,3})(\d{0,3})(\d{0,3})$/, (_, a, b, c) => [a, b, c].filter(Boolean).join('-'))
  if (maxLen === 10)return d.replace(/^(\d{1,3})(\d{0,3})(\d{0,4})$/, (_, a, b, c) => [a, b, c].filter(Boolean).join('-'))
  return               d.replace(/^(\d{1,3})(\d{0,4})(\d{0,4})$/,    (_, a, b, c) => [a, b, c].filter(Boolean).join('-'))
}
const buildPlaceholder = (maxLen) => formatDigits('0'.repeat(maxLen), maxLen)

/* ══════════════════════════════════════════════════════════════════
   DRAFT PERSISTENCE
══════════════════════════════════════════════════════════════════ */
const SESSION_KEY = 'veltro-profile-draft'
const loadDraft = () => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const d = JSON.parse(raw)
    if (d.dob) d.dob = new Date(d.dob)
    return d
  } catch { return null }
}
const saveDraft = (data) => {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      ...data,
      dob:       data.dob?.toISOString() ?? null,
      customImg: null, // never persist base64 to sessionStorage
    }))
  } catch {}
}

/* ══════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════════════════════════ */
function FloatingInput({ id, label, value, onChange, error, success, type = 'text', disabled, hint }) {
  const [focused, setFocused] = useState(false)
  const lifted = focused || String(value || '').length > 0 || !!error
  return (
    <div className='float-input-wrapper'>
      <input id={id} type={type} value={value} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        disabled={disabled} autoComplete='off' spellCheck='false'
        className={['auth-input float-input',
          focused ? 'focused' : '', error ? 'error' : '',
          success ? 'success' : '', disabled ? 'disabled-input' : '',
        ].filter(Boolean).join(' ')}
      />
      <label htmlFor={id} className={['float-label', lifted ? 'lifted' : '', error ? 'error' : ''].filter(Boolean).join(' ')}>
        {label}
      </label>
      {(error || success) && !disabled && (
        <span className='float-input-status'>
          {error   && <WarningCircle size={16} weight='fill' color='var(--auth-error)'   />}
          {success && <CheckCircle   size={16} weight='fill' color='var(--auth-success)' />}
        </span>
      )}
      {error && <p className='auth-feedback error inline-error'><WarningCircle size={11} weight='fill' /> {error}</p>}
      {hint && !error && <p className='auth-feedback hint inline-error' style={{ color: 'var(--auth-muted)' }}>{hint}</p>}
    </div>
  )
}

function FloatingTextarea({ id, label, value, onChange, maxLength }) {
  const [focused, setFocused] = useState(false)
  const lifted = focused || value.length > 0
  return (
    <div className='float-input-wrapper'>
      <textarea id={id} value={value} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        maxLength={maxLength} rows={3} autoComplete='off' spellCheck='false'
        className={['auth-input float-input float-textarea', focused ? 'focused' : ''].filter(Boolean).join(' ')}
      />
      <label htmlFor={id} className={['float-label', lifted ? 'lifted' : ''].filter(Boolean).join(' ')}>{label}</label>
      {maxLength && <span className='textarea-count'>{value.length}/{maxLength}</span>}
    </div>
  )
}

function SelectCard({ options, value, onChange, columns = 2 }) {
  return (
    <div className={`select-card-grid cols-${columns}`}>
      {options.map(opt => (
        <button key={opt.value} type='button'
          className={['select-card', value === opt.value ? 'selected' : ''].filter(Boolean).join(' ')}
          onClick={() => onChange(opt.value)}>
          <span className='select-card-label'>{opt.label}</span>
          {opt.sub && <span className='select-card-sub'>{opt.sub}</span>}
          {value === opt.value && (
            <span className='select-card-check'><CheckCircle size={14} weight='fill' /></span>
          )}
        </button>
      ))}
    </div>
  )
}

function AddressField({ id, label, value, onChange, bias, onSelect, success, error }) {
  const [focused,  setFocused]  = useState(false)
  const [results,  setResults]  = useState([])
  const [loading,  setLoading]  = useState(false)
  const [dropPos,  setDropPos]  = useState({ top: 0, left: 0, width: 0 })
  const wrapRef = useRef(null)
  const timer   = useRef(null)
  const lifted  = focused || String(value || '').length > 0 || !!error

  const search = (val) => {
    if (!val || val.length < 3) { setResults([]); return }
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const q   = bias ? `${val}, ${bias}` : val
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=5`,
          { headers: { 'Accept-Language': 'en' } }
        )
        setResults(await res.json())
      } catch { setResults([]) }
      setLoading(false)
    }, 300)
  }

  const updatePos = () => {
    if (wrapRef.current) {
      const r = wrapRef.current.getBoundingClientRect()
      setDropPos({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX, width: r.width })
    }
  }
  const handleChange = (e) => { updatePos(); onChange(e); search(e.target.value) }
  const handleFocus  = ()  => { updatePos(); setFocused(true) }
  const handleSelect = (r) => { onSelect(r); setResults([]); setFocused(false) }
  const showDrop = focused && (loading || results.length > 0)

  const dropdown = showDrop && createPortal(
    <div className='addr-suggest-panel' style={{ position: 'absolute', top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999 }}>
      {loading && <div className='addr-suggest-loading'>Searching...</div>}
      {results.map((r, i) => (
        <button key={i} type='button' className='addr-suggest-item' onMouseDown={() => handleSelect(r)}>
          <MapPin size={12} weight='fill' className='addr-suggest-pin' />
          <span>{r.display_name}</span>
        </button>
      ))}
    </div>,
    document.getElementById('root')
  )

  return (
    <div ref={wrapRef} className='float-input-wrapper addr-field'>
      <input id={id} type='text' value={value}
        onChange={handleChange} onFocus={handleFocus}
        onBlur={() => setTimeout(() => setFocused(false), 180)}
        autoComplete='off' spellCheck='false'
        className={['auth-input float-input', focused ? 'focused' : '', error ? 'error' : '', success ? 'success' : ''].filter(Boolean).join(' ')}
      />
      <label htmlFor={id} className={['float-label', lifted ? 'lifted' : '', error ? 'error' : ''].filter(Boolean).join(' ')}>{label}</label>
      {success && !focused && !error && <span className='float-input-status'><CheckCircle size={16} weight='fill' color='var(--auth-success)' /></span>}
      {error && <span className='float-input-status'><WarningCircle size={16} weight='fill' color='var(--auth-error)' /></span>}
      {error && <p className='auth-feedback error inline-error'><WarningCircle size={11} weight='fill' /> {error}</p>}
      {dropdown}
    </div>
  )
}

function AvatarPicker({ seed, onSeedChange, customImg, onCustom, onRemove, name, email, isDark }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const fileRef = useRef()
  useEffect(() => {
    if (!open) return
    const h = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  const src = customImg || (seed || DEFAULT_AVATAR)
  return (
    <div ref={containerRef} className='profile-avatar-section'>
      <div className='profile-avatar-ring' onClick={() => setOpen(o => !o)}>
        <img src={src} alt='avatar' className='profile-avatar-img'
          style={{ background: customImg ? 'transparent' : '#0d1428', padding: customImg ? 0 : '4px', boxSizing: 'border-box' }} />
        <button type='button' className='profile-avatar-btn' aria-label='Change avatar'>
          <Camera size={13} weight='bold' />
        </button>
      </div>
      {open && (
        <div className='avatar-picker-panel'>
          <p className='avatar-picker-label'>Choose an avatar</p>
          <div className='avatar-picker-grid'>
            {SEEDS.map(s => (
              <button key={s} type='button'
                className={['avatar-picker-opt', seed === s && !customImg ? 'active' : ''].filter(Boolean).join(' ')}
                onClick={() => { onSeedChange(s); setOpen(false) }}
                style={{ background: '#0d1428', padding: '3px', boxSizing: 'border-box' }}>
                <img src={s} alt='' style={{ width: '100%', height: '100%', display: 'block' }} />
              </button>
            ))}
          </div>
          <div className='avatar-picker-divider'><span>or upload your own</span></div>
          <button type='button' className='avatar-picker-upload' onClick={() => fileRef.current?.click()}>
            <Camera size={13} weight='bold' /> Upload photo
          </button>
          <input ref={fileRef} type='file' accept='image/*' style={{ display: 'none' }}
            onChange={e => { onCustom(e); setOpen(false) }} />
          {customImg && (
            <button type='button' className='profile-remove-photo'
              style={{ marginTop: '.6rem', width: '100%', justifyContent: 'center' }}
              onClick={() => { onRemove(); setOpen(false) }}>
              <Trash size={12} weight='bold' /> Remove photo
            </button>
          )}
        </div>
      )}
      <div className='profile-avatar-meta'>
        <span className='profile-avatar-name' style={{ color: isDark ? '#EEF2FF' : '#080C1A' }}>
          {name || 'Your Name'}
        </span>
        <span className='profile-avatar-email'>{email || 'your@email.com'}</span>
        <span className='profile-avatar-hint'>Click avatar to change</span>
      </div>
    </div>
  )
}

function CountryPickerContent({ onSelect, selectedIso }) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return COUNTRIES
    return COUNTRIES.filter(c => c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.iso.toLowerCase().includes(q))
  }, [query])
  return (
    <div className='cp-country-picker'>
      <div className='cp-country-search-wrap'>
        <MagnifyingGlass size={14} className='cp-country-search-icon' />
        <input type='text' placeholder='Search country or code...' value={query}
          onChange={e => setQuery(e.target.value)} autoFocus className='cp-country-search'
          autoComplete='off' spellCheck='false' />
      </div>
      <div className='cp-country-list'>
        {filtered.length === 0 && <p className='cp-country-empty'>No countries match "{query}"</p>}
        {filtered.map(c => (
          <button key={c.iso} type='button'
            className={['cp-country-row', selectedIso === c.iso ? 'selected' : ''].filter(Boolean).join(' ')}
            onClick={() => onSelect(c)}>
            <span className='cp-country-name'>{c.name}</span>
            <div className='cp-country-right'>
              <span className='cp-country-dial'>{c.dial}</span>
              <span className='cp-country-flag'>{c.flag}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function PhoneField({ digits, onDigitsChange, error, onOpenCountryPicker, selectedCountry }) {
  const [focused, setFocused] = useState(false)
  const maxLen      = selectedCountry?.digits ?? 10
  const displayVal  = formatDigits(digits, maxLen)
  const placeholder = buildPlaceholder(maxLen)
  const lifted      = focused || digits.length > 0 || !!error

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, maxLen)
    onDigitsChange(raw)
  }
  return (
    <div className='float-input-wrapper'>
      <div className={['cp-phone-wrap', focused ? 'focused' : '', error ? 'error' : ''].filter(Boolean).join(' ')}>
        <button type='button' className='cp-phone-country-btn' onClick={onOpenCountryPicker} tabIndex={0}>
          <span className='cp-phone-flag'>{selectedCountry.flag}</span>
          <span className='cp-phone-dial'>{selectedCountry.dial}</span>
          <CaretDown size={10} weight='bold' className='cp-phone-caret' />
        </button>
        <div className='cp-phone-divider' />
        <input type='tel' inputMode='numeric' value={displayVal} onChange={handleChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder={focused ? placeholder : ''} autoComplete='tel' spellCheck='false'
          className='cp-phone-input'
          maxLength={maxLen + (maxLen <= 8 ? 1 : 2)}
        />
      </div>
      <label className={['float-label cp-phone-label', lifted ? 'lifted' : ''].filter(Boolean).join(' ')}>
        Phone number
      </label>
      {error && <p className='auth-feedback error inline-error'><WarningCircle size={11} weight='fill' /> {error}</p>}
    </div>
  )
}

function UsernameField({ value, onChange, status, statusEl, error }) {
  const [focused, setFocused] = useState(false)
  const lifted = focused || value.length > 0
  const hintColor = status === 'available' ? 'var(--auth-success)' : 'var(--auth-error)'
  const hintMsg   = status === 'available' ? '✓ Available'
                  : status === 'taken'     ? 'Already taken -- try another'
                  : null
  return (
    <div className='float-input-wrapper'>
      <input id='username' type='text' value={value} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        autoComplete='off' spellCheck='false' maxLength={20}
        className={[
          'auth-input float-input',
          focused ? 'focused' : '',
          error ? 'error' : '',
          status === 'available' ? 'success' : '',
        ].filter(Boolean).join(' ')}
      />
      <label htmlFor='username'
        className={['float-label', lifted ? 'lifted' : '', error ? 'error' : ''].filter(Boolean).join(' ')}>
        Username
      </label>
      {statusEl && !error && <span className='float-input-status'>{statusEl}</span>}
      {error && (
        <>
          <span className='float-input-status'><WarningCircle size={16} weight='fill' color='var(--auth-error)' /></span>
          <p className='auth-feedback error inline-error'><WarningCircle size={11} weight='fill' /> {error}</p>
        </>
      )}
      {!error && hintMsg && (
        <p className='auth-feedback hint inline-error' style={{ color: hintColor }}>{hintMsg}</p>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   AUTH GUARD SCREEN
══════════════════════════════════════════════════════════════════ */
function GuardScreen({ message }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#060A18',
      color: 'rgba(138,150,180,0.6)', fontSize: 14,
      fontFamily: "'Segoe UI',Arial,sans-serif",
    }}>
      {message || 'Checking your session...'}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   CREATE PROFILE
══════════════════════════════════════════════════════════════════ */
export default function CreateProfile({ onSave }) {
  /* /createprofile/:userId -- read the userId from the URL */
  const { userId: routeUserId } = useParams()

  /* guard: 'checking' | 'ok' | 'denied' */
  const [guardStatus, setGuardStatus] = useState('checking')

  /* dark mode */
  const [isDark, setIsDark] = useState(() => window.matchMedia('(prefers-color-scheme:dark)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme:dark)')
    const h = e => setIsDark(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])
  useEffect(() => {
    document.getElementById('root')?.classList.toggle('light', !isDark)
    document.getElementById('root')?.classList.toggle('dark',  isDark)
  }, [isDark])

  /* ══════════════════════════════════════════════════════════════
     AUTH GUARD -- runs on every mount, including back-button visits
  ══════════════════════════════════════════════════════════════ */
  useEffect(() => {
    const check = async () => {
      const token = getAccessToken()

      if (!token) {
        window.location.replace('/auth')
        return
      }

      try {
        const payload     = JSON.parse(atob(token.split('.')[1]))
        const tokenUserId = payload.sub

        if (routeUserId && tokenUserId !== routeUserId) {
          window.location.replace(`/createprofile/${tokenUserId}`)
          return
        }

        const statusRes = await fetch(`${import.meta.env.VITE_API_URL}/api/tour/status`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!statusRes.ok) {
          clearTokens()
          window.location.replace('/auth')
          return
        }

        const status = await statusRes.json()

        if (status.onboardingComplete) {
          window.location.replace(`/dashboard/${tokenUserId}`)
          return
        }

        if (status.profileComplete) {
          window.location.replace('/veltrotour')
          return
        }

        try {
          const meRes = await fetch(`${import.meta.env.VITE_API_URL}/api/profile/me`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (meRes.ok) {
            const { profile: p } = await meRes.json()
            if (p) {
              setForm(prev => ({
                firstName:            p.first_name        || prev.firstName,
                lastName:             p.last_name         || prev.lastName,
                username:             p.username          || prev.username,
                bio:                  p.bio               || prev.bio,
                address:              p.address_line1     || prev.address,
                apt:                  p.address_line2     || prev.apt,
                city:                 p.city              || prev.city,
                state:                p.state             || prev.state,
                zip:                  p.zip               || prev.zip,
                country:              p.country           || prev.country,
                occupation:           p.occupation        || prev.occupation,
                investmentExperience: p.investment_experience || prev.investmentExperience,
                website:              p.website           || prev.website,
              }))

              if (p.date_of_birth) {
                setDob(new Date(p.date_of_birth))
              }

              if (p.gender) setGender(p.gender)

              if (p.phone) {
                const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length)
                const match  = sorted.find(c => p.phone.startsWith(c.dial))
                if (match) {
                  setSelectedCountry(match)
                  setPhoneDigits(p.phone.slice(match.dial.length).replace(/\D/g, ''))
                } else {
                  setPhoneDigits(p.phone.replace(/\D/g, ''))
                }
              }

              if (p.avatar_url) {
                if (p.avatar_url.startsWith('data:')) {
                  setCustomImg(p.avatar_url)
                } else {
                  setAvatarSeed(p.avatar_url)
                }
              }

              if (p.username) setUsernameStatus('available')

              try {
                const existing = JSON.parse(sessionStorage.getItem('newUser') || '{}')
                if (!existing.email && p.email) {
                  sessionStorage.setItem('newUser', JSON.stringify({
                    ...existing,
                    email:     p.email,
                    firstName: p.first_name || existing.firstName || '',
                    lastName:  p.last_name  || existing.lastName  || '',
                  }))
                }
              } catch {}
            }
          }
        } catch {
          /* pre-fill fetch failed -- non-fatal */
        }

        setGuardStatus('ok')

      } catch {
        clearTokens()
        window.location.replace('/auth')
      }
    }

    check()
  }, [routeUserId]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── read signup data passed from register / VerifyEmail ── */
  const signupUser = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('newUser')
      if (raw) return JSON.parse(raw)
    } catch {}
    return { firstName: '', lastName: '', fullName: '', email: '' }
  }, [])

  const signupFirstName = signupUser.firstName || signupUser.fullName?.split(' ')[0] || ''
  const signupLastName  = signupUser.lastName  || signupUser.fullName?.split(' ').slice(1).join(' ') || ''
  const signupEmail     = signupUser.email || ''

  /* ── form state ── */
  const draft = useMemo(loadDraft, [])

  const [form, setForm] = useState(() => ({
    firstName:            signupFirstName,
    lastName:             signupLastName,
    username:             draft?.form?.username             || '',
    bio:                  draft?.form?.bio                  || '',
    address:              draft?.form?.address              || '',
    apt:                  draft?.form?.apt                  || '',
    city:                 draft?.form?.city                 || '',
    state:                draft?.form?.state                || '',
    zip:                  draft?.form?.zip                  || '',
    country:              draft?.form?.country              || '',
    occupation:           draft?.form?.occupation           || '',
    investmentExperience: draft?.form?.investmentExperience || '',
    website:              draft?.form?.website              || '',
  }))

  const [phoneDigits,     setPhoneDigits]     = useState(draft?.phoneDigits     ?? '')
  const [dob,             setDob]             = useState(draft?.dob             ?? null)
  const [gender,          setGender]          = useState(draft?.gender          ?? '')
  const [avatarSeed,      setAvatarSeed]      = useState(draft?.avatarSeed      ?? '')
  const [customImg,       setCustomImg]       = useState(null)
  const [selectedCountry, setSelectedCountry] = useState(draft?.selectedCountry ?? DEFAULT_COUNTRY)

  const [errors,       setErrors]       = useState({})
  const [success,      setSuccess]      = useState({})
  const [segmentError, setSegmentError] = useState('')
  const [loading,      setLoading]      = useState(false)
  const [currentStep,  setCurrentStep]  = useState(0)
  const [countryOpen,  setCountryOpen]  = useState(false)

  const [usernameStatus, setUsernameStatus] = useState('idle')
  const usernameTimer = useRef(null)
  const segErrTimer   = useRef(null)

  /* flip animation */
  const [flipped,  setFlipped]  = useState(false)
  const [flipping, setFlipping] = useState(false)

  const doFlip = useCallback((nextStep) => {
    if (flipping) return
    setFlipping(true)
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setFlipped(f => !f)
      setTimeout(() => setFlipping(false), 680)
    }))
  }, [flipping])

  /* ── date-of-birth: enforce minimum age of 13 ── */
  const maxDobDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)       // rewind to yesterday
    d.setFullYear(d.getFullYear() - 13) // then exactly 13 years back
    return d
  }, [])

  /*
   * Track the calendar's current view date (month/year navigation) separately
   * from the committed dob value.
   *
   * Problem: react-datepicker fires onChange for BOTH day clicks AND
   * month/year dropdown changes (showMonthDropdown + dropdownMode='select').
   * This causes dob to be set prematurely on first month/year selection.
   *
   * Fix:
   *   - onChange  → only update the calendar view position (calViewDate)
   *   - onSelect  → fires exclusively on day clicks → commit to dob
   */
  const [calViewDate, setCalViewDate] = useState(null)

  /* auto-suggest username */
  useEffect(() => {
    if (form.username || !signupFirstName) return
    const suggest = async () => {
      try {
        const res  = await fetch(
          `${import.meta.env.VITE_API_URL}/api/profile/suggest-username?first=${encodeURIComponent(signupFirstName)}&last=${encodeURIComponent(signupLastName)}`
        )
        const data = await res.json()
        if (data.username) { setForm(p => ({ ...p, username: data.username })); setUsernameStatus('available') }
      } catch {}
    }
    suggest()
  }, []) // eslint-disable-line

  /* username live check */
  const checkUsername = (value) => {
    clearTimeout(usernameTimer.current)
    if (!value || value.length < 3) { setUsernameStatus('idle'); return }
    if (!/^[a-zA-Z0-9_.]{3,20}$/.test(value)) { setUsernameStatus('error'); return }
    setUsernameStatus('checking')
    usernameTimer.current = setTimeout(async () => {
      try {
        const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/profile/check-username?u=${encodeURIComponent(value)}`)
        const data = await res.json()
        setUsernameStatus(data.available ? 'available' : 'taken')
      } catch { setUsernameStatus('idle') }
    }, 500)
  }

  const handleCountrySelect = (c) => { setSelectedCountry(c); setCountryOpen(false); setPhoneDigits('') }

  const set = (field) => (e) => {
    const val = e.target.value
    setForm(p => ({ ...p, [field]: val }))
    setErrors(p => ({ ...p, [field]: '' }))
    const ok = {}
    if (field === 'username')   { checkUsername(val); if (/^[a-zA-Z0-9_.]{3,20}$/.test(val)) ok.username = true }
    if (field === 'occupation' && val.trim().length > 1) ok.occupation = true
    if (field === 'website'    && val.length > 4)        ok.website    = true
    setSuccess(p => ({ ...p, ...ok }))
  }

  const fillAddress = (r) => { const a = r.address || {}; setForm(p => ({ ...p, address: [a.house_number, a.road].filter(Boolean).join(' ') || p.address, city: a.city || a.town || a.village || a.county || p.city, state: a.state || p.state, zip: a.postcode || p.zip, country: a.country || p.country })) }
  const fillCity    = (r) => { const a = r.address || {}; setForm(p => ({ ...p, city: a.city || a.town || a.village || p.city, state: a.state || p.state, zip: a.postcode || p.zip, country: a.country || p.country })) }
  const fillState   = (r) => { const a = r.address || {}; setForm(p => ({ ...p, state: a.state || p.state, country: a.country || p.country })) }
  const fillZip     = (r) => { const a = r.address || {}; setForm(p => ({ ...p, zip: a.postcode || p.zip })) }
  const fillCountry = (r) => { const a = r.address || {}; setForm(p => ({ ...p, country: a.country || p.country })) }

  /* ── avatar: resize to max 200×200 before storing ── */
  const handleCustomAvatar = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX    = 200
      const scale  = Math.min(MAX / img.width, MAX / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.width  * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      setCustomImg(canvas.toDataURL('image/jpeg', 0.85))
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  const usernameStatusEl = useMemo(() => {
    if (usernameStatus === 'checking')  return <Spinner size={14} className='spin-icon' />
    if (usernameStatus === 'available') return <CheckCircle size={14} weight='fill' color='var(--auth-success)' />
    if (usernameStatus === 'taken')     return <WarningCircle size={14} weight='fill' color='var(--auth-error)' />
    return null
  }, [usernameStatus])

  /* ── validation ── */
  const validateSegment = (step) => {
    const e = {}
    if (step === 0) {
      if (!form.firstName.trim())                 e.firstName = 'First name is required'
      else if (form.firstName.trim().length < 2)  e.firstName = 'First name is too short'
      if (!form.lastName.trim())                  e.lastName  = 'Last name is required'
      else if (form.lastName.trim().length < 2)   e.lastName  = 'Last name is too short'
      if (!form.username.trim())                  e.username  = 'Username is required'
      else if (usernameStatus === 'taken')         e.username  = 'This username is already taken'
      else if (usernameStatus === 'checking')      e.username  = 'Please wait while we check availability'
      else if (!/^[a-zA-Z0-9_.]{3,20}$/.test(form.username)) e.username = 'Only letters, numbers, _ and . (3-20 chars)'
    }
    if (step === 1) {
      if (!dob)    e.dob    = 'Date of birth is required'
      if (!gender) e.gender = 'Gender is required'
      if (phoneDigits) {
        const full = `${selectedCountry.dial}${phoneDigits}`
        try { if (!isValidPhoneNumber(full)) e.phone = 'Invalid phone number' } catch {}
      }
    }
    if (step === 2) {
      if (!form.address.trim())              e.address = 'Street address is required'
      if (!form.city.trim())                 e.city    = 'City is required'
      if (!form.state.trim())                e.state   = 'State / Region is required'
      if (!form.zip.trim())                  e.zip     = 'ZIP / Postal code is required'
      else if (form.zip.trim().length < 3)   e.zip     = 'Enter a valid postal code'
      else if (form.zip.trim().length > 10)  e.zip     = 'Postal code is too long'
      else if (!/^[a-zA-Z0-9\s\-]{3,10}$/.test(form.zip.trim())) e.zip = 'Invalid postal code format'
      if (!form.country.trim())              e.country = 'Country is required'
    }
    if (step === 3) {
      if (!form.occupation?.trim())    e.occupation           = 'Occupation is required'
      if (!form.investmentExperience)  e.investmentExperience = 'Please indicate your level of investment experience'
    }
    return e
  }

  /* ── navigation / submit ── */
  const handleNext = async () => {
    const errs = validateSegment(currentStep)
    if (Object.keys(errs).length) {
      setErrors(errs)
      setSegmentError('Please fix the highlighted fields.')
      clearTimeout(segErrTimer.current)
      segErrTimer.current = setTimeout(() => setSegmentError(''), 3000)
      return
    }
    setErrors({}); setSegmentError('')
    saveDraft({ form, phoneDigits, dob, gender, avatarSeed, selectedCountry })

    if (currentStep === N - 1) {
      /* ── FINAL SUBMIT ── */
      setLoading(true)
      try {
        const token     = getAccessToken()
        const fullPhone = phoneDigits ? `${selectedCountry.dial}${phoneDigits}` : ''
        const avatarUrl = customImg || avatarSeed || DEFAULT_AVATAR

        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/profile/create`, {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            firstName:            form.firstName,
            lastName:             form.lastName,
            username:             form.username,
            bio:                  form.bio,
            gender,
            occupation:           form.occupation,
            investmentExperience: form.investmentExperience,
            website:              form.website,
            address:              form.address,
            apt:                  form.apt,
            city:                 form.city,
            state:                form.state,
            zip:                  form.zip,
            country:              form.country,
            email:                signupEmail,
            phone:                fullPhone,
            dob: dob
              ? `${dob.getFullYear()}-${String(dob.getMonth() + 1).padStart(2, '0')}-${String(dob.getDate()).padStart(2, '0')}`
              : null,
            avatarUrl,
          }),
        })

        if (!res.ok) {
          let data = {}
          try { data = await res.json() } catch {}
          if (data.field === 'username') {
            setErrors({ username: data.message })
          } else {
            setSegmentError(data.message || 'Something went wrong. Please try again.')
            clearTimeout(segErrTimer.current)
            segErrTimer.current = setTimeout(() => setSegmentError(''), 4000)
          }
          return
        }

        const data = await res.json()

        try {
          const existing = JSON.parse(sessionStorage.getItem('newUser') || '{}')
          sessionStorage.setItem('newUser', JSON.stringify({
            ...existing,
            firstName: data.firstName,
            lastName:  data.lastName,
          }))
        } catch {}

        sessionStorage.removeItem(SESSION_KEY)
        onSave?.({ ...form, gender, phone: fullPhone, dob, avatar: avatarUrl })
        window.location.href = '/veltrotour'

      } catch (err) {
        console.error('Profile save error:', err)
        setSegmentError('Network error. Please check your connection and try again.')
        clearTimeout(segErrTimer.current)
        segErrTimer.current = setTimeout(() => setSegmentError(''), 4000)
      } finally {
        setLoading(false)
      }
      return
    }

    doFlip(currentStep + 1)
    setCurrentStep(s => s + 1)
  }

  const handleBack = () => {
    setErrors({}); setSegmentError('')
    saveDraft({ form, phoneDigits, dob, gender, avatarSeed, selectedCountry })
    doFlip(currentStep - 1)
    setCurrentStep(s => s - 1)
  }

  /* ── DOB calendar custom header ────────────────────────────────────
     react-datepicker's built-in month dropdown does not restrict options
     to the maxDate for the boundary year (2013 still shows Apr-Dec).
     This custom header:
       • limits the month <select> to only valid months for the viewed year
       • limits the year  <select> to 1900 → maxDobDate year
     Day cells are already greyed-out by maxDate; this covers the dropdowns.
  ─────────────────────────────────────────────────────────────────── */
  const DobHeader = useCallback(({
    date,
    changeMonth,
    changeYear,
    decreaseMonth,
    increaseMonth,
    prevMonthButtonDisabled,
    nextMonthButtonDisabled,
  }) => {
    const viewYear  = date.getFullYear()
    const viewMonth = date.getMonth()        // 0-based

    const maxYear  = maxDobDate.getFullYear()
    const maxMonth = maxDobDate.getMonth()   // last valid month (0-based) in maxYear

    /* years: 1900 up to and including the cutoff year */
    const years = []
    for (let y = 1900; y <= maxYear; y++) years.push(y)

    /* months: all 12 normally; in the cutoff year only Jan → maxMonth */
    const MONTH_NAMES = [
      'January','February','March','April','May','June',
      'July','August','September','October','November','December',
    ]
    const lastValidMonth = viewYear === maxYear ? maxMonth : 11
    const months = MONTH_NAMES.slice(0, lastValidMonth + 1)

    /* if the current view month is now out of range, snap it back */
    if (viewMonth > lastValidMonth) {
      changeMonth(lastValidMonth)
    }

    return (
      <div className='cp-dob-header'>
        <button
          type='button'
          className='cp-dob-nav'
          onClick={decreaseMonth}
          disabled={prevMonthButtonDisabled}
          aria-label='Previous month'
        >‹</button>

        <select
          value={viewMonth}
          onChange={e => changeMonth(Number(e.target.value))}
          className='cp-dob-select'
        >
          {months.map((name, idx) => (
            <option key={name} value={idx}>{name}</option>
          ))}
        </select>

        <select
          value={viewYear}
          onChange={e => changeYear(Number(e.target.value))}
          className='cp-dob-select'
        >
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <button
          type='button'
          className='cp-dob-nav'
          onClick={increaseMonth}
          disabled={nextMonthButtonDisabled}
          aria-label='Next month'
        >›</button>
      </div>
    )
  }, [maxDobDate])

  const cityBias    = [form.address, form.country].filter(Boolean).join(', ')
  const stateBias   = [form.city, form.country].filter(Boolean).join(', ')
  const zipBias     = [form.city, form.state, form.country].filter(Boolean).join(', ')
  const countryBias = [form.state, form.city].filter(Boolean).join(', ')

  /* ── guard gate ── */
  if (guardStatus === 'checking') return <GuardScreen />
  if (guardStatus === 'denied')   return <GuardScreen message='Redirecting...' />

  /* ── panels ── */
  const panels = [
    /* 0 -- identity */
    <div className='ps-fields' key='identity'>
      <AvatarPicker seed={avatarSeed} onSeedChange={setAvatarSeed}
        customImg={customImg} onCustom={handleCustomAvatar}
        onRemove={() => { setCustomImg(null); setAvatarSeed('') }}
        name={[form.firstName, form.lastName].filter(Boolean).join(' ')}
        email={signupEmail} isDark={isDark} />
      <div className='profile-row'>
        <div className='profile-col'>
          <FloatingInput id='firstName' label='First name' value={form.firstName}
            onChange={set('firstName')} error={errors.firstName} success={!!form.firstName.trim()} />
        </div>
        <div className='profile-col'>
          <FloatingInput id='lastName' label='Last name' value={form.lastName}
            onChange={set('lastName')} error={errors.lastName} success={!!form.lastName.trim()} />
        </div>
      </div>
      <UsernameField value={form.username} onChange={set('username')}
        status={usernameStatus} statusEl={usernameStatusEl} error={errors.username} />
      <FloatingTextarea id='bio' label='Bio (optional)' value={form.bio}
        onChange={set('bio')} maxLength={160} />
    </div>,

    /* 1 -- contact */
    <div className='ps-fields' key='contact'>
      <FloatingInput id='email' label='Email address' type='email'
        value={signupEmail} onChange={() => {}} disabled
        hint={<span style={{ color: 'var(--auth-success)', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={11} weight='fill' />Verified email</span>} />
      <PhoneField digits={phoneDigits} onDigitsChange={setPhoneDigits}
        error={errors.phone} selectedCountry={selectedCountry}
        onOpenCountryPicker={() => setCountryOpen(true)} />
      <div className='float-input-wrapper'>
        <div className={['cp-date-wrap', errors.dob ? 'error' : ''].filter(Boolean).join(' ')}>
          <DatePicker
            selected={dob}
            onChange={(date) => {
              setCalViewDate(date)
            }}
            onSelect={(date) => {
              setDob(date)
              setCalViewDate(null)
              setErrors(p => ({ ...p, dob: '' }))
            }}
            openToDate={calViewDate ?? dob ?? maxDobDate}
            dateFormat='MMMM d, yyyy'
            renderCustomHeader={DobHeader}
            maxDate={maxDobDate}
            filterDate={(date) => date <= maxDobDate}
            minDate={new Date('1900-01-01')}
            placeholderText=' '
            className='cp-date-input'
            calendarClassName='cp-calendar'
            wrapperClassName='cp-date-picker-wrapper'
            popperPlacement='bottom-start'
            popperClassName='cp-dob-no-arrow'
            showPopperArrow={false}
            onFocus={e => e.target.blur()}
            portalId='root'
            popperProps={{ strategy: 'fixed' }}
          />
        </div>
        <label className={['float-label', dob ? 'lifted' : '', errors.dob ? 'error' : ''].filter(Boolean).join(' ')}>
          Date of birth
        </label>
        {errors.dob && <p className='auth-feedback error inline-error'><WarningCircle size={11} weight='fill' /> {errors.dob}</p>}
      </div>
      <div className='ps-select-section'>
        <p className='ps-select-label'>
          Gender
          {errors.gender && <span style={{ color: 'var(--auth-error)', marginLeft: 8, fontSize: 11 }}>-- {errors.gender}</span>}
        </p>
        <SelectCard options={GENDER_OPTIONS} value={gender}
          onChange={val => { setGender(val); setErrors(p => ({ ...p, gender: '' })) }} columns={2} />
      </div>
    </div>,

    /* 2 -- address */
    <div className='ps-fields' key='address'>
      <AddressField id='address' label='Street address' value={form.address}
        onChange={set('address')} bias={null} onSelect={fillAddress}
        success={!!form.address.trim()} error={errors.address} />
      <div className='profile-row'>
        <AddressField id='city'  label='City'           value={form.city}  onChange={set('city')}
          bias={cityBias}  onSelect={fillCity}  success={!!form.city.trim()}  error={errors.city} />
        <AddressField id='state' label='State / Region' value={form.state} onChange={set('state')}
          bias={stateBias} onSelect={fillState} success={!!form.state.trim()} error={errors.state} />
      </div>
      <div className='profile-row'>
        <AddressField id='zip'     label='ZIP / Postal code' value={form.zip}     onChange={set('zip')}
          bias={zipBias}     onSelect={fillZip}     success={!!form.zip.trim()}     error={errors.zip} />
        <AddressField id='country' label='Country'           value={form.country} onChange={set('country')}
          bias={countryBias} onSelect={fillCountry} success={!!form.country.trim()} error={errors.country} />
      </div>
    </div>,

    /* 3 -- investor profile */
    <div className='ps-fields' key='investor'>
      <FloatingInput id='occupation' label='Occupation / Job title / Business position'
        value={form.occupation} onChange={set('occupation')} success={success.occupation} error={errors.occupation} />
      <div className='ps-select-section'>
        <p className='ps-select-label'>
          Investment experience
          {errors.investmentExperience && (
            <span style={{ color: 'var(--auth-error)', marginLeft: 8, fontSize: 11 }}>-- {errors.investmentExperience}</span>
          )}
        </p>
        <SelectCard options={EXPERIENCE_OPTIONS} value={form.investmentExperience}
          onChange={val => { setForm(p => ({ ...p, investmentExperience: val })); setErrors(p => ({ ...p, investmentExperience: '' })) }}
          columns={3} />
      </div>
      <FloatingInput id='website' label='Professional URL (optional)'
        value={form.website} onChange={set('website')} success={success.website}
        hint='Corporate website, professional profile, or digital portfolio' />
    </div>,
  ]

  /* ── render ── */
  return (
    <div className={`cp-page ${isDark ? 'dark' : 'light'}`}>

      {/* LEFT -- form */}
      <div className='cp-form-side'>
        <div className='ps-dots'>
          {SEGMENTS.map((s, i) => (
            <div key={s.id}
              className={['ps-dot', i === currentStep ? 'active' : '', i < currentStep ? 'done' : ''].filter(Boolean).join(' ')} />
          ))}
        </div>

        <div className='ps-track-wrap'>
          <div className='ps-track' style={{
            width:     `${N * 100}%`,
            transform: `translateX(-${currentStep * 100 / N}%)`,
          }}>
            {SEGMENTS.map((seg, i) => (
              <div key={seg.id} className='ps-panel' style={{ width: `${100 / N}%` }} aria-hidden={i !== currentStep}>
                <div className='ps-heading'>
                  <p className='ps-step-label'>Step {i + 1} of {N}</p>
                  <h2 className='ps-title'>{seg.title}</h2>
                  <p className='ps-subtitle'>{seg.subtitle}</p>
                </div>
                {i === currentStep && segmentError && (
                  <div className='form-error-banner' style={{ marginBottom: '8px' }}>
                    <WarningCircle size={16} weight='fill' /><span>{segmentError}</span>
                  </div>
                )}
                {panels[i]}
              </div>
            ))}
          </div>
        </div>

        <div className='ps-nav'>
          {currentStep > 0 && (
            <button type='button' className='ps-btn-back' onClick={handleBack} disabled={flipping}>
              <ArrowLeft size={15} weight='bold' /> Back
            </button>
          )}
          <button type='button' className='ps-btn-next' onClick={handleNext} disabled={loading || flipping}>
            <span className='ps-btn-next-label'>
              {loading ? 'Saving...' : currentStep === N - 1 ? 'Save profile' : 'Continue'}
            </span>
            <span className='ps-btn-next-icon'>
              {loading
                ? <span className='btn-spinner' />
                : currentStep === N - 1
                  ? <FloppyDisk size={15} weight='bold' />
                  : <ArrowRight size={15} weight='bold' />
              }
            </span>
          </button>
        </div>
      </div>

      {/* RIGHT -- image flip */}
      <div className='cp-image-side'>
        <div className='cp-flip-scene'>
          <div className={`cp-flip-card ${flipped ? 'cp-flipped' : ''}`}>
            <div className='cp-flip-face cp-flip-front'>
              <img src={IMG} alt='' className='cp-flip-img' />
            </div>
            <div className='cp-flip-face cp-flip-back'>
              <img src={IMG} alt='' className='cp-flip-img' />
            </div>
          </div>
        </div>
      </div>

      <VeltroModal open={countryOpen} onClose={() => setCountryOpen(false)} title='Select country code'>
        <CountryPickerContent onSelect={handleCountrySelect} selectedIso={selectedCountry.iso} />
      </VeltroModal>

    </div>
  )
}