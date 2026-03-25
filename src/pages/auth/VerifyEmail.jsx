import React, { useState, useRef, useEffect } from 'react'
import IMG from './IMG/SignIn_SideImg.avif'
import { ArrowLeft, ArrowRight, WarningCircle, CheckCircle } from '@phosphor-icons/react'
import Veltrolog from '../../components/VeltroIcon'
import './auth.css'

/* ── tiny auth util -- stores tokens in sessionStorage (or localStorage if remember) ── */
function storeTokens({ accessToken, refreshToken, remember }) {
  const store = remember ? localStorage : sessionStorage
  store.setItem('accessToken',  accessToken)
  store.setItem('refreshToken', refreshToken)
}

/* ══════════════════════════════════════════════════════════════════
   DIGIT INPUT -- single character box (fully inline-styled)
══════════════════════════════════════════════════════════════════ */
function DigitBox({ value, inputRef, onChange, onKeyDown, onPaste, hasError, isSuccess }) {
  const [focused, setFocused] = useState(false)

  const borderColor = hasError  ? 'rgba(239,68,68,0.7)'
                    : isSuccess ? 'rgba(34,197,94,0.7)'
                    : focused   ? 'rgba(26,86,255,0.8)'
                    :             'rgba(255,255,255,0.1)'

  const bg = hasError  ? 'rgba(239,68,68,0.06)'
           : isSuccess ? 'rgba(34,197,94,0.06)'
           :             'rgba(255,255,255,0.04)'

  const shadow = focused && !hasError ? '0 0 0 3px rgba(26,86,255,0.18)' : 'none'

  return (
    <input
      ref={inputRef}
      type='text'
      inputMode='numeric'
      maxLength={1}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      autoComplete='one-time-code'
      spellCheck='false'
      style={{
        width: 52, height: 64,
        textAlign: 'center',
        fontSize: 28, fontWeight: 800,
        color: 'var(--auth-text, #EEF2FF)',
        background: bg,
        border: `1.5px solid ${borderColor}`,
        borderRadius: 14,
        outline: 'none',
        boxShadow: shadow,
        caretColor: 'transparent',
        transition: 'border-color .15s, box-shadow .15s, background .15s',
        fontFamily: 'inherit',
        cursor: 'text',
      }}
    />
  )
}

/* ══════════════════════════════════════════════════════════════════
   VERIFY EMAIL
══════════════════════════════════════════════════════════════════ */
export default function VerifyEmail({ email, remember = false, onVerified, onBack }) {
  const [isDark, setIsDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  )
  const [digits,    setDigits]    = useState(['', '', '', '', '', ''])
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState('')
  const [cooldown,  setCooldown]  = useState(0)

  const inputRefs = useRef([])
  const cooldownTimer = useRef(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const h  = e => setIsDark(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])

  /* focus first box on mount */
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  /* cooldown ticker */
  useEffect(() => {
    if (cooldown <= 0) return
    cooldownTimer.current = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(cooldownTimer.current)
  }, [cooldown])

  const code = digits.join('')

  /* ── digit input handlers ── */
  const handleChange = (i) => (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i] = val
    setDigits(next)
    setError('')
    if (val && i < 5) inputRefs.current[i + 1]?.focus()
    /* auto-submit when all 6 filled */
    if (val && i === 5) {
      const full = next.join('')
      if (full.length === 6) submitCode(full)
    }
  }

  const handleKeyDown = (i) => (e) => {
    if (e.key === 'Backspace') {
      if (digits[i]) {
        const next = [...digits]; next[i] = ''; setDigits(next)
      } else if (i > 0) {
        inputRefs.current[i - 1]?.focus()
      }
    }
    if (e.key === 'ArrowLeft'  && i > 0) inputRefs.current[i - 1]?.focus()
    if (e.key === 'ArrowRight' && i < 5) inputRefs.current[i + 1]?.focus()
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = ['', '', '', '', '', '']
    pasted.split('').forEach((ch, i) => { next[i] = ch })
    setDigits(next)
    setError('')
    const focusIdx = Math.min(pasted.length, 5)
    inputRefs.current[focusIdx]?.focus()
    if (pasted.length === 6) submitCode(pasted)
  }

  /* ── submit ── */
  const submitCode = async (codeToSubmit) => {
    const finalCode = codeToSubmit ?? code
    if (finalCode.length < 6) {
      setError('Please enter all 6 digits.')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-email`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, code: finalCode, remember }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Invalid code. Please try again.')
        /* shake boxes */
        setDigits(['', '', '', '', '', ''])
        setTimeout(() => inputRefs.current[0]?.focus(), 50)
        return
      }

      /* ── store tokens ── */
      storeTokens({
        accessToken:  data.accessToken,
        refreshToken: data.refreshToken,
        remember,
      })

      /* ── cache userId -- top-level field is the reliable source,
         data.user.id is kept as a fallback for backwards compat ── */
      const verifiedUserId = data.userId || data.user?.id || null

      /* ── persist user info for CreateProfile ── */
      try {
        const existing = JSON.parse(sessionStorage.getItem('newUser') || '{}')
        sessionStorage.setItem('newUser', JSON.stringify({
          ...existing,
          userId:    verifiedUserId,
          email:     data.user?.email     || existing.email     || '',
          firstName: data.user?.firstName || existing.firstName || '',
        }))
      } catch {}

      setSuccess(true)

      /* ── hand off to Onboarding with userId + nextStep ── */
      setTimeout(() => {
        onVerified?.({ userId: verifiedUserId, nextStep: data.nextStep })
      }, 600)

    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  /* ── resend ── */
  const handleResend = async () => {
    if (cooldown > 0 || resending) return
    setResending(true)
    setResendMsg('')
    setError('')

    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/resend-verification`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Could not resend. Please try again.')
        return
      }
      setResendMsg('A new code has been sent to your inbox.')
      setCooldown(60)
      setDigits(['', '', '', '', '', ''])
      setTimeout(() => inputRefs.current[0]?.focus(), 50)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setResending(false)
    }
  }

  const maskedEmail = email
    ? email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(Math.max(2, b.length)) + c)
    : ''

  return (
    <div className={`sign-in ${isDark ? 'dark' : 'light'}`}>
      <style>{`
        @keyframes verifyShake {
          0%,100% { transform: translateX(0) }
          20%      { transform: translateX(-8px) }
          40%      { transform: translateX(8px) }
          60%      { transform: translateX(-5px) }
          80%      { transform: translateX(5px) }
        }
      `}</style>
      <div className='sign-in-form-side'>
        <div className='signin-logo'>
          <Veltrolog variant='blue' />
        </div>

        {/* ── back button ── */}
        <button
          type='button'
          onClick={onBack}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', padding: '6px 0',
            color: 'var(--auth-muted, #8A96B4)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            marginBottom: 8,
            transition: 'color .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--auth-text, #EEF2FF)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--auth-muted, #8A96B4)'}
        >
          <ArrowLeft size={14} weight='bold' />
          Back
        </button>

        <h2 className='signin-header'>Check your email</h2>
        <p className='signin-subheader'>
          We sent a 6-digit code to{' '}
          <strong style={{ color: 'var(--auth-text, #EEF2FF)' }}>{maskedEmail}</strong>.
          Enter it below to continue.
        </p>

        {/* ── digit boxes ── */}
        <div
          style={{
            display: 'flex', gap: 10, justifyContent: 'center',
            margin: '28px 0 0',
            animation: error ? 'verifyShake .4s ease' : 'none',
          }}
        >
          {digits.map((d, i) => (
            <DigitBox
              key={i}
              value={d}
              inputRef={el => (inputRefs.current[i] = el)}
              onChange={handleChange(i)}
              onKeyDown={handleKeyDown(i)}
              onPaste={handlePaste}
              hasError={!!error}
              isSuccess={success}
            />
          ))}
        </div>

        {/* ── feedback ── */}
        <div style={{ minHeight: 36, marginTop: 12, textAlign: 'center' }}>
          {error && (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--auth-error, #EF4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <WarningCircle size={13} weight='fill' /> {error}
            </p>
          )}
          {success && !error && (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--auth-success, #22C55E)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <CheckCircle size={14} weight='fill' /> Verified! Taking you in...
            </p>
          )}
          {resendMsg && !error && !success && (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--auth-success, #22C55E)' }}>
              {resendMsg}
            </p>
          )}
        </div>

        {/* ── submit button ── */}
        <button
          type='button'
          className={`signin-btn ${loading ? 'loading' : ''}`}
          style={{ marginTop: 8 }}
          disabled={loading || success || code.length < 6}
          onClick={() => submitCode(code)}
        >
          <span className='signin-btn-text'>
            {loading ? 'Verifying...' : success ? 'Verified ✓' : 'Verify code'}
          </span>
          <span className='sign-arrow-icon'>
            {loading
              ? <span className='btn-spinner' />
              : <ArrowRight size={18} weight='bold' />
            }
          </span>
        </button>

        {/* ── resend ── */}
        <p className='signin-register' style={{ marginTop: 20 }}>
          Didn't get it?{' '}
          {cooldown > 0 ? (
            <span style={{ color: 'var(--auth-muted)' }}>Resend in {cooldown}s</span>
          ) : (
            <span
              className='signin-register-link'
              onClick={handleResend}
              style={{ opacity: resending ? 0.5 : 1, pointerEvents: resending ? 'none' : 'auto' }}
            >
              {resending ? 'Sending...' : 'Resend code'}
            </span>
          )}
        </p>
      </div>

      <div className='sign-in-image-side'>
        <img src={IMG} alt='Veltro' />
      </div>
    </div>
  )
}