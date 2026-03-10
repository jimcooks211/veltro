import React, { useState } from 'react'
import Login          from './Login'
import Register       from './Register'
import ForgotPassword from './ForgotPassword'
import VerifyEmail    from './VerifyEmail'
import './auth.css'

export default function Onboarding() {
  // 'login' | 'register' | 'forgot' | 'verify'
  const [view,         setView]         = useState('login')
  const [remember,     setRemember]     = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')

  const isRegister = view === 'register'

  /* ── Register success → verify screen ── */
  const handleRegistered = ({ email }) => {
    setPendingEmail(email)
    setView('verify')
  }

  /* ── Login: password accepted, code sent → verify screen ── */
  const handleNeedsVerify = ({ email, remember: rem }) => {
    setPendingEmail(email)
    setRemember(rem ?? false)
    setView('verify')
  }

  /* ── Email verified ────────────────────────────────────────────
     VerifyEmail passes { userId, nextStep } after it stores the
     tokens. We use userId to build the guarded URL so that:
       • only the owner can visit /createprofile/:userId
       • revisiting after completion redirects away automatically
  ─────────────────────────────────────────────────────────────── */
  const handleVerified = ({ userId, nextStep } = {}) => {
    /* Priority order for userId:
       1. Passed directly from VerifyEmail (data.userId top-level field)
       2. sessionStorage newUser.userId  (set during register or VerifyEmail)
       3. Decode sub claim from the JWT we just stored — guaranteed present
          for both register AND login flows since tokens were just written    */
    const uid = userId
      || (() => { try { return JSON.parse(sessionStorage.getItem('newUser') || '{}').userId } catch { return null } })()
      || (() => {
           try {
             const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken')
             if (!token) return null
             return JSON.parse(atob(token.split('.')[1])).sub
           } catch { return null }
         })()

    switch (nextStep) {
      case 'createprofile':
        window.location.href = uid ? `/createprofile/${uid}` : '/createprofile'
        break
      case 'onboard':
        window.location.href = '/veltrotour'
        break
      case 'dashboard':
        window.location.href = uid ? `/dashboard/${uid}` : '/dashboard'
        break
      default:
        /* safe fallback — CreateProfile guard will re-route if already done */
        window.location.href = uid ? `/createprofile/${uid}` : '/veltrotour'
    }
  }

  if (view === 'forgot') {
    return <ForgotPassword onBack={() => setView('login')} />
  }

  if (view === 'verify') {
    return (
      <VerifyEmail
        email={pendingEmail}
        remember={remember}
        onVerified={handleVerified}
        onBack={() => setView('login')}
      />
    )
  }

  return (
    <div className={`onboarding-flip-wrapper ${isRegister ? 'flipped' : ''}`}>
      <div className='onboarding-flip-inner'>
        <div className='onboarding-flip-front'>
          <Login
            onSwitch={() => setView('register')}
            onForgot={() => setView('forgot')}
            onNeedsVerify={handleNeedsVerify}
          />
        </div>
        <div className='onboarding-flip-back'>
          <Register
            onSwitch={() => setView('login')}
            onRegistered={handleRegistered}
          />
        </div>
      </div>
    </div>
  )
}