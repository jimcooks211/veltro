import { useState, useEffect, useCallback, useReducer } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  RocketLaunch,
  Wallet,
  Newspaper,
  Shield,
  TrendUp,
  Lightning,
  CheckCircle,
  X,
  ChartBar,
  Eye,
  ArrowsLeftRight,
  ChartLineUp,
  WarningCircle,
  SpinnerGap,
} from '@phosphor-icons/react'
import VeltroDarkLogo  from '@/components/VeltroDarkLogo'
import VeltroLightLogo from '@/components/VeltroLogoLight'
import './Onboard.css'
import { getToken, clearTokens } from '../../utils/auth'   // only real exports
import OnboardTransition from './Onboardtransition'

/* ══════════════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════════════ */
const API_BASE = import.meta.env.VITE_API_URL || ''

const STEPS = [
  { id: 'welcome',  label: 'Welcome'  },
  { id: 'features', label: 'Features' },
  { id: 'risk',     label: 'Profile'  },
  { id: 'plan',     label: 'Plan'     },
  { id: 'launch',   label: 'Launch'   },
]
const N = STEPS.length

const FEATURES = [
  { id: 'markets',   name: 'Live Markets',   desc: 'Real-time quotes across global exchanges.',    accent: 'blue',   Icon: ChartLineUp    },
  { id: 'trade',     name: 'Instant Trade',  desc: 'Execute market and limit orders in seconds.',  accent: 'cyan',   Icon: ArrowsLeftRight },
  { id: 'portfolio', name: 'Portfolio',      desc: 'Track P&L, allocation and performance.',       accent: 'green',  Icon: ChartBar       },
  { id: 'watchlist', name: 'Watchlist',      desc: 'Monitor the assets that matter most to you.',  accent: 'violet', Icon: Eye            },
  { id: 'wallet',    name: 'Wallet',         desc: 'Deposit, withdraw and manage your funds.',     accent: 'amber',  Icon: Wallet         },
  { id: 'news',      name: 'Market News',    desc: 'Curated financial news and insights daily.',   accent: 'rose',   Icon: Newspaper      },
]

const RISK_PROFILES = [
  { id: 'conservative', name: 'Conservative', desc: 'Capital preservation first. Low volatility, steady returns.',      return: '~4–8% / yr',    icon: Shield,    risk: 'conservative' },
  { id: 'balanced',     name: 'Balanced',     desc: 'Mix of growth and stability. Diversified across asset classes.',   return: '~8–15% / yr',   icon: TrendUp,   risk: 'balanced'     },
  { id: 'aggressive',   name: 'Aggressive',   desc: 'Maximum growth potential. High risk, high reward approach.',       return: '~15–30%+ / yr', icon: Lightning, risk: 'aggressive'   },
]

const PLANS = [
  {
    id: 'starter', name: 'Starter', price: 'Free', period: '', badge: 'Free forever', plan: 'starter', popular: false,
    features: [
      { label: 'Live market data',          included: true  },
      { label: 'Up to 5 watchlist items',   included: true  },
      { label: 'Basic portfolio analytics', included: true  },
      { label: 'Market & limit orders',     included: true  },
      { label: 'Advanced charting',         included: false },
      { label: 'Priority support',          included: false },
    ],
  },
  {
    id: 'growth', name: 'Essential', price: '$149', period: 'one-time', badge: 'Most popular', plan: 'growth', popular: true,
    features: [
      { label: 'Everything in Starter',    included: true  },
      { label: 'Unlimited watchlist',      included: true  },
      { label: 'Advanced analytics',       included: true  },
      { label: 'Options & margin trading', included: true  },
      { label: 'Advanced charting',        included: true  },
      { label: 'Priority support',         included: false },
    ],
  },
  {
    id: 'elite', name: 'Veltro Pro', price: '$349', period: 'one-time', badge: 'Professional', plan: 'elite', popular: false,
    features: [
      { label: 'Everything in Essential',  included: true },
      { label: 'Institutional-grade data', included: true },
      { label: 'API access',               included: true },
      { label: '1-on-1 investor call',     included: true },
      { label: 'Advanced charting',        included: true },
      { label: 'Lifetime updates',         included: true },
    ],
  },
]

const PLATFORM_STATS = [
  { val: '$4.2B+', lbl: 'Assets traded'  },
  { val: '190K+',  lbl: 'Active traders' },
  { val: '99.9%',  lbl: 'Uptime SLA'     },
]

const PLAN_COLORS = {
  starter: { color: '#8A96B4', bg: 'rgba(138,150,180,0.12)' },
  growth:  { color: '#2563FF', bg: 'rgba(37,99,255,0.12)'   },
  elite:   { color: '#F5A800', bg: 'rgba(245,168,0,0.12)'   },
}

/* ══════════════════════════════════════════════════════════════════
   HELPER — userId
   Priority order matches handleVerified in Onboarding.jsx:
     1. sessionStorage newUser.userId  (set by register / VerifyEmail)
     2. JWT sub claim decoded from the stored accessToken
══════════════════════════════════════════════════════════════════ */
const getUserId = () => {
  try {
    const uid = JSON.parse(sessionStorage.getItem('newUser') || '{}').userId
    if (uid) return uid
  } catch { /* ignore */ }
  try {
    const token = getToken('accessToken')            // localStorage first, then sessionStorage
    if (token) return JSON.parse(atob(token.split('.')[1])).sub
  } catch { /* ignore */ }
  return null
}

/* ══════════════════════════════════════════════════════════════════
   HELPER — authenticated fetch
   - Attaches the current accessToken as a Bearer header.
   - On 401 (token expired / revoked):
       • clearTokens() wipes accessToken, refreshToken, userId
         from both localStorage AND sessionStorage in one call.
       • Returns null so the caller can redirect to login.
   - All other non-OK responses are returned normally so the
     caller can surface the server's error message.
   - Network failures re-throw so the caller can show a
     connectivity error.
   Note: there is no /api/auth/refresh endpoint in the backend,
   so silent refresh is not possible — the correct UX on 401 is
   to send the user back to the login screen.
══════════════════════════════════════════════════════════════════ */
const authFetch = async (url, options = {}) => {
  const token = getToken('accessToken')
  const res   = await fetch(url, {
    ...options,
    headers: {
      'Content-Type':  'application/json',
      ...(options.headers || {}),
      'Authorization': `Bearer ${token}`,
    },
  })

  if (res.status === 401) {
    clearTokens()   // wipes accessToken + refreshToken + userId
    return null     // sentinel: caller must redirect to login
  }

  return res
}

/* ══════════════════════════════════════════════════════════════════
   REDUCER
══════════════════════════════════════════════════════════════════ */
const initialState = {
  step:         0,
  riskProfile:  'balanced',
  selectedPlan: 'growth',
}

function reducer(state, action) {
  switch (action.type) {
    case 'NEXT':     return state.step >= N - 1 ? state : { ...state, step: state.step + 1 }
    case 'BACK':     return state.step <= 0     ? state : { ...state, step: state.step - 1 }
    case 'SET_RISK': return { ...state, riskProfile:  action.payload }
    case 'SET_PLAN': return { ...state, selectedPlan: action.payload }
    default:         return state
  }
}

/* ══════════════════════════════════════════════════════════════════
   ONBOARD
   Props:
     user       — { firstName, avatar, email }
     onComplete — optional callback after successful save
     onSkip     — optional callback before skip navigation
══════════════════════════════════════════════════════════════════ */
export default function Onboard({ user = {}, onComplete, onSkip }) {
  const navigate = useNavigate()
  const [state, dispatch] = useReducer(reducer, initialState)
  const { step, riskProfile, selectedPlan } = state

  const [isDark, setIsDark] = useState(
    () => window.matchMedia('(prefers-color-scheme:dark)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme:dark)')
    const h = (e) => setIsDark(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])

  const [orbsVisible, setOrbsVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setOrbsVisible(true), 120)
    return () => clearTimeout(t)
  }, [])

  const [submitting,  setSubmitting]  = useState(false)
  const [submitError, setSubmitError] = useState('')

  const firstName = user?.firstName || user?.name?.split(' ')[0] || 'Trader'
  const avatar    = user?.avatar
  const email     = user?.email

  /* ── session expired: tokens already cleared by authFetch ── */
  const handleSessionExpired = useCallback(() => {
    navigate('/', { replace: true })
  }, [navigate])

  /* ── shared destination after any successful completion ── */
  const goToDashboard = useCallback(() => {
    const uid = getUserId()
    navigate(uid ? `/dashboard/${uid}` : '/dashboard', { replace: true })
  }, [navigate])

  /* ── submit (Enter Veltro) ── */
  const submitAndRedirect = useCallback(async () => {
    setSubmitting(true)
    setSubmitError('')

    try {
      const res = await authFetch(`${API_BASE}/api/tour/complete`, {
        method: 'POST',
        body:   JSON.stringify({ riskProfile, plan: selectedPlan }),
      })

      if (res === null) {
        /* 401 — clearTokens() already called inside authFetch */
        handleSessionExpired()
        return
      }

      const data = await res.json()

      if (!res.ok) {
        setSubmitError(data.message || 'Something went wrong. Please try again.')
        setSubmitting(false)
        return
      }

      onComplete?.({ riskProfile, plan: selectedPlan })
      goToDashboard()

    } catch (err) {
      console.error('Onboard submit error:', err)
      setSubmitError('Network error. Please check your connection and try again.')
      setSubmitting(false)
    }
  }, [riskProfile, selectedPlan, onComplete, handleSessionExpired, goToDashboard])

  /* ── skip (fire-and-forget, never blocks navigation) ── */
  const handleSkip = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/tour/complete`, {
        method: 'POST',
        body:   JSON.stringify({ riskProfile: 'balanced', plan: 'starter' }),
      })
      if (res === null) {
        /* 401 — session expired even during skip */
        handleSessionExpired()
        return
      }
    } catch { /* network error — skip navigation anyway */ }

    onSkip?.()
    goToDashboard()
  }, [onSkip, handleSessionExpired, goToDashboard])

  /* ── step navigation ── */
  const handleNext = useCallback(() => {
    if (submitting) return
    if (step === N - 1) { submitAndRedirect(); return }
    dispatch({ type: 'NEXT' })
  }, [step, submitting, submitAndRedirect])

  const handleBack = useCallback(() => {
    if (submitting) return
    setSubmitError('')
    dispatch({ type: 'BACK' })
  }, [submitting])

  /* ── keyboard ── */
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext()
      if (e.key === 'ArrowLeft')                       handleBack()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [handleNext, handleBack])

  const isLastStep = step === N - 1
  const ctaLabel   = submitting ? 'Saving…' : isLastStep ? 'Enter Veltro' : 'Continue'
  const ctaIcon    = submitting
    ? <SpinnerGap size={15} weight='bold' className='ob-spin' />
    : isLastStep
      ? <RocketLaunch size={15} weight='bold' />
      : <ArrowRight   size={15} weight='bold' />

  /* ══════════════════════════════════════════════════════
     SLIDES
  ══════════════════════════════════════════════════════ */
  const slideWelcome = (
    <div className='ob-welcome' key='welcome'>
      {avatar && (
        <div className='ob-welcome-avatar-ring'>
          <img src={avatar} alt={firstName} className='ob-welcome-avatar' />
          <div className='ob-welcome-badge'>
            <CheckCircle size={12} weight='fill' color='#fff' />
          </div>
        </div>
      )}
      <p className='ob-welcome-eyebrow'>Account verified</p>
      <h1 className='ob-welcome-title'>
        Welcome to Veltro,{' '}
        <span className='ob-name-highlight'>{firstName}</span>.
      </h1>
      <p className='ob-welcome-sub'>
        Your account is ready. Before you dive in, let's take two minutes
        to set up your trading profile so Veltro works exactly the way you need it.
      </p>
      <div className='ob-welcome-stats'>
        {PLATFORM_STATS.map((s) => (
          <div key={s.lbl} className='ob-stat'>
            <div className='ob-stat-val'>{s.val}</div>
            <div className='ob-stat-lbl'>{s.lbl}</div>
          </div>
        ))}
      </div>
    </div>
  )

  const slideFeatures = (
    <div className='ob-features' key='features'>
      <p className='ob-step-eyebrow'>Everything you need</p>
      <h2 className='ob-step-title'>Your trading command centre</h2>
      <p className='ob-step-sub'>
        Six powerful modules built for traders who take their portfolio seriously.
      </p>
      <div className='ob-feature-grid'>
        {FEATURES.map(({ id, name, desc, accent, Icon }) => (
          <div key={id} className='ob-feature-card' data-accent={accent}>
            <div className='ob-feature-icon'><Icon size={18} weight='duotone' /></div>
            <p className='ob-feature-name'>{name}</p>
            <p className='ob-feature-desc'>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )

  const slideRisk = (
    <div className='ob-risk' key='risk'>
      <p className='ob-step-eyebrow'>Personalise your experience</p>
      <h2 className='ob-step-title'>What's your investment style?</h2>
      <p className='ob-step-sub'>
        This shapes your dashboard defaults and helps Veltro surface
        the right opportunities for you. You can change this anytime in settings.
      </p>
      <div className='ob-risk-cards'>
        {RISK_PROFILES.map(({ id, name, desc, return: ret, icon: Icon, risk }) => (
          <button
            key={id} type='button'
            className={`ob-risk-card ${riskProfile === id ? 'selected' : ''}`}
            data-risk={risk}
            onClick={() => dispatch({ type: 'SET_RISK', payload: id })}
          >
            <div className='ob-risk-icon'><Icon size={20} weight='duotone' /></div>
            <div className='ob-risk-text'>
              <p className='ob-risk-name'>{name}</p>
              <p className='ob-risk-desc'>{desc}</p>
            </div>
            <span className='ob-risk-return'>{ret}</span>
            <div className='ob-risk-radio' />
          </button>
        ))}
      </div>
    </div>
  )

  const slidePlan = (
    <div className='ob-plans' key='plan'>
      <p className='ob-step-eyebrow'>Choose your tier</p>
      <h2 className='ob-step-title'>Start free, scale when ready</h2>
      <p className='ob-step-sub'>No contracts. Upgrade, downgrade or cancel anytime.</p>
      <div className='ob-plan-grid'>
        {PLANS.map((p) => (
          <div
            key={p.id}
            className={`ob-plan-card ${selectedPlan === p.id ? 'selected' : ''}`}
            data-plan={p.plan}
            onClick={() => dispatch({ type: 'SET_PLAN', payload: p.id })}
            role='button' tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && dispatch({ type: 'SET_PLAN', payload: p.id })}
          >
            {p.popular && <div className='ob-plan-popular'>Most popular</div>}
            <div className='ob-plan-badge'>{p.badge}</div>
            <p className='ob-plan-name'>{p.name}</p>
            <div className='ob-plan-price'>
              <span className='ob-plan-amount'>{p.price}</span>
              {p.period && <span className='ob-plan-period'>{p.period}</span>}
            </div>
            <div className='ob-plan-divider' />
            <ul className='ob-plan-features'>
              {p.features.map((f) => (
                <li key={f.label} className={`ob-plan-feature ${f.included ? 'included' : ''}`}>
                  <span className={`ob-plan-check ${f.included ? 'yes' : 'no'}`}>
                    {f.included ? <CheckCircle size={9} weight='fill' /> : <X size={9} weight='bold' />}
                  </span>
                  {f.label}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )

  const planColor = PLAN_COLORS[selectedPlan] ?? PLAN_COLORS.growth
  const riskLabel = RISK_PROFILES.find(r => r.id === riskProfile)?.name ?? 'Balanced'
  const planLabel = PLANS.find(p => p.id === selectedPlan)?.name ?? 'Growth'

  const slideLaunch = (
    <div className='ob-launch' key='launch'>
      <div className='ob-launch-icon'>
        <RocketLaunch size={32} weight='bold' color='#fff' />
      </div>
      <p className='ob-step-eyebrow'>You're all set</p>
      <h2 className='ob-step-title'>Ready for lift-off</h2>
      <p className='ob-step-sub'>
        Here's a snapshot of your setup. Head into the platform —
        your dashboard is already personalised and waiting.
      </p>
      <div className='ob-launch-summary'>
        {email && (
          <div className='ob-summary-row'>
            <span className='ob-summary-key'>Account</span>
            <span className='ob-summary-val'>{email}</span>
          </div>
        )}
        <div className='ob-summary-row'>
          <span className='ob-summary-key'>Investment style</span>
          <span className='ob-summary-val'>{riskLabel}</span>
        </div>
        <div className='ob-summary-row'>
          <span className='ob-summary-key'>Plan</span>
          <span className='ob-summary-plan-tag' style={{ color: planColor.color, background: planColor.bg }}>
            {planLabel}
          </span>
        </div>
        <div className='ob-summary-row'>
          <span className='ob-summary-key'>Next step</span>
          <span className='ob-summary-val' style={{ color: '#00D97E' }}>Fund your account</span>
        </div>
      </div>

      {submitError && (
        <div className='ob-submit-error'>
          <WarningCircle size={14} weight='fill' />
          <span>{submitError}</span>
        </div>
      )}
    </div>
  )

  const SLIDES = [slideWelcome, slideFeatures, slideRisk, slidePlan, slideLaunch]

  /* ══════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════ */
  return (
    <div className={`ob-root ${isDark ? 'dark' : 'light'}`} role='main' aria-label='Onboarding'>

      {submitting && <OnboardTransition />}

      <div className='ob-ambient' aria-hidden='true'>
        <div className={`ob-ambient-orb ob-orb-1 ${orbsVisible ? 'visible' : ''}`} />
        <div className={`ob-ambient-orb ob-orb-2 ${orbsVisible ? 'visible' : ''}`} />
        <div className={`ob-ambient-orb ob-orb-3 ${orbsVisible ? 'visible' : ''}`} />
      </div>
      <div className='ob-grain' aria-hidden='true' />

      <header className='ob-progress-bar'>
        <div className='ob-logo' aria-label='Veltro'>
          {isDark
            ? <VeltroDarkLogo  className='ob-logo-svg' />
            : <VeltroLightLogo className='ob-logo-svg' />
          }
        </div>
        <div className='ob-progress-track' role='progressbar' aria-valuemin={0} aria-valuemax={N} aria-valuenow={step + 1}>
          {STEPS.map((s, i) => (
            <div key={s.id} className={`ob-progress-seg ${i < step ? 'done' : ''} ${i === step ? 'active' : ''}`}>
              <div className='ob-progress-fill' />
            </div>
          ))}
        </div>
        {step < N - 1 && (
          <button type='button' className='ob-progress-skip' onClick={handleSkip} aria-label='Skip onboarding'>
            Skip setup
          </button>
        )}
      </header>

      <main className='ob-stage'>
        <div
          className='ob-track'
          style={{ width: `${N * 100}%`, transform: `translateX(-${(step * 100) / N}%)` }}
        >
          {SLIDES.map((slide, i) => (
            <div
              key={STEPS[i].id}
              className='ob-slide'
              style={{ width: `${100 / N}%` }}
              aria-hidden={i !== step}
              aria-label={STEPS[i].label}
            >
              {Math.abs(i - step) <= 1 && slide}
            </div>
          ))}
        </div>
      </main>

      <footer className='ob-footer'>
        <span className='ob-step-counter'>Step {step + 1} of {N}</span>
        <div className='ob-nav-btns'>
          {step > 0 && (
            <button type='button' className='ob-btn-back' onClick={handleBack} disabled={submitting} aria-label='Go back'>
              <ArrowLeft size={14} weight='bold' /> Back
            </button>
          )}
          <button
            type='button'
            className={`ob-btn-next ${isLastStep ? 'ob-btn-launch' : ''} ${submitting ? 'ob-btn-submitting' : ''}`}
            onClick={handleNext}
            disabled={submitting}
            aria-label={ctaLabel}
          >
            <span className='ob-btn-next-label'>{ctaLabel}</span>
            <span className='ob-btn-next-icon'>{ctaIcon}</span>
          </button>
        </div>
      </footer>

    </div>
  )
}