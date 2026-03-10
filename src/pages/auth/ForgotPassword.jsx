import React, { useEffect, useState } from 'react'
import IMG from './IMG/SignIn_SideImg.avif'
import { ArrowRight, ArrowLeft, WarningCircle, PaperPlaneTilt } from '@phosphor-icons/react'
import Veltrolog from '../../components/VeltroIcon'
import "./auth.css"

function FloatingInput({ type, id, label, value, onChange, error }) {
  const [focused, setFocused] = useState(false)
  const isLifted = focused || value.length > 0

  return (
    <div className='float-input-wrapper'>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`auth-input float-input ${focused ? 'focused' : ''} ${error ? 'error' : ''}`}
      />
      <label
        htmlFor={id}
        className={`float-label ${isLifted ? 'lifted' : ''} ${error ? 'error' : ''}`}
      >
        {label}
      </label>
    </div>
  )
}

export default function ForgotPassword({ onBack }) {
  const [isDark, setIsDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  )
  const [email,   setEmail]   = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => setIsDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

const handleSubmit = async (e) => {
  e.preventDefault()
  if (!email)                         return setError('Looks like you forgot your email')
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
console.log("regex test result:", emailRegex.test(email))
if (!emailRegex.test(email)) return setError("That email doesn't look quite right")
  setError('')
  setLoading(true)
  try {
    const res = await fetch('http://172.20.10.2:4000/api/forgot-password', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    setSent(true)
  } catch (err) {
    setError(err.message || 'Something went wrong. Please try again.')
  } finally {
    setLoading(false)
  }
}

  return (
    <div className={`sign-in ${isDark ? 'dark' : 'light'}`}>

      <div className='sign-in-form-side'>
        <div className='signin-logo'>
          <Veltrolog variant='blue' />
        </div>

        {!sent ? (
          <>
            <h2 className='signin-header'>Forgot your password?</h2>
            <p className='signin-subheader'>Enter your email and we will send you a reset link.</p>

            <form className='signin-form' onSubmit={handleSubmit} noValidate>

              <div>
                <FloatingInput
                  type="email"
                  id="forgot-email"
                  label="Email address"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  error={error}
                />
                {error && (
                  <p className='auth-feedback error inline-error'>
                    <WarningCircle size={11} weight='fill' /> {error}
                  </p>
                )}
              </div>

              <button type='submit' className={`signin-btn ${loading ? 'loading' : ''}`} disabled={loading}>
  <span className='signin-btn-text'>{loading ? 'Signing in...' : 'Sign in'}</span>
  <span className='sign-arrow-icon'>
    {loading
      ? <span className='btn-spinner' />   // ← spins instead
      : <ArrowRight size={18} weight='bold' />  // ← never spins
    }
  </span>
</button>

              <p className='signin-register'>
                <span className='signin-back-link' onClick={onBack}>
                  <ArrowLeft size={13} weight='bold' style={{ marginRight: 4 }} />
                  Back to sign in
                </span>
              </p>

            </form>
          </>
        ) : (
          /* success state */
          <div className='auth-success-state'>
            <div className='auth-success-icon'>
              <PaperPlaneTilt size={32} weight='fill' />
            </div>
            <h2 className='signin-header' style={{ margin: '24px 0 8px' }}>Check your inbox</h2>
            <p className='signin-subheader' style={{ margin: '0 0 32px' }}>
              We sent a password reset link to <strong style={{ color: 'var(--auth-blue)' }}>{email}</strong>. It expires in 15 minutes.
            </p>
            <button className='signin-btn' onClick={onBack}>
              <span className='signin-btn-text'>Back to sign in</span>
              <span className='signin-btn-icon'>
                <ArrowRight size={18} weight='bold' />
              </span>
            </button>
            <p className='signin-register' style={{ marginTop: 20 }}>
              Didn't receive it?{' '}
              <span className='signin-register-link' onClick={() => setSent(false)}>Resend email</span>
            </p>
          </div>
        )}
      </div>

      <div className='sign-in-image-side'>
        <img src={IMG} alt="Veltro" />
      </div>

    </div>
  )
}