import React, { useEffect, useState } from 'react'
import IMG from './IMG/SignIn_SideImg.avif'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowRight, WarningCircle, CheckCircle, Eye, EyeSlash } from '@phosphor-icons/react'
import Veltrolog from '../../components/VeltroIcon'
import "./auth.css"

function FloatingInput({ type, id, label, value, onChange, error, success, rightSlot }) {
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
        className={`auth-input float-input ${focused ? 'focused' : ''} ${error ? 'error' : ''} ${success ? 'success' : ''}`}
        style={{ paddingRight: rightSlot ? '48px' : undefined }}
      />
      <label
        htmlFor={id}
        className={`float-label ${isLifted ? 'lifted' : ''} ${error ? 'error' : ''}`}
      >
        {label}
      </label>
      {rightSlot && (
        <span className='float-input-status' style={{ cursor: 'pointer', pointerEvents: 'all' }}>
          {rightSlot}
        </span>
      )}
    </div>
  )
}

function PasswordStrength({ password }) {
  if (!password) return null
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const score  = checks.filter(Boolean).length
  const labels = ['Weak', 'Fair', 'Good', 'Strong']
  const colors = ['var(--auth-error)', 'var(--auth-warning)', 'var(--auth-info)', 'var(--auth-success)']

  return (
    <div className='password-strength'>
      <div className='password-strength-bars'>
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className='password-strength-bar'
            style={{ background: i < score ? colors[score - 1] : 'rgba(255,255,255,0.08)' }}
          />
        ))}
      </div>
      <p className='password-strength-label' style={{ color: colors[score - 1] }}>
        {labels[score - 1]}
      </p>
    </div>
  )
}

export default function ResetPassword() {
  const [searchParams]              = useSearchParams()
  const navigate                    = useNavigate()

  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const [isDark,     setIsDark]     = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  )
  const [password,   setPassword]   = useState('')
  const [confirm,    setConfirm]    = useState('')
  const [showPass,   setShowPass]   = useState(false)
  const [showConf,   setShowConf]   = useState(false)
  const [errors,     setErrors]     = useState({})
  const [formError,  setFormError]  = useState('')
  const [loading,    setLoading]    = useState(false)
  const [done,       setDone]       = useState(false)

  useEffect(() => {
    const mq      = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => setIsDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const iconColor = isDark ? 'var(--auth-silver)' : 'rgba(0,0,0,0.4)'

  // ── Invalid link guard ───────────────────────────────────────────────────
  if (!token || !email) {
    return (
      <div className={`sign-in ${isDark ? 'dark' : 'light'}`}>
        <div className='sign-in-form-side'>
          <div className='signin-logo'><Veltrolog variant='blue' /></div>
          <div className='auth-success-state'>
            <div className='auth-success-icon' style={{ background: 'var(--auth-error-bg)', color: 'var(--auth-error)' }}>
              <WarningCircle size={32} weight='fill' />
            </div>
            <h2 className='signin-header' style={{ margin: '24px 0 8px' }}>Invalid link</h2>
            <p className='signin-subheader' style={{ margin: '0 0 32px' }}>
              This password reset link is invalid or has already been used.
            </p>
            <button className='signin-btn' onClick={() => navigate('/login')}>
              <span className='signin-btn-text'>Back to sign in</span>
              <span className='signin-btn-icon'><ArrowRight size={18} weight='bold' /></span>
            </button>
          </div>
        </div>
        <div className='sign-in-image-side'>
          <img src={IMG} alt="Veltro" />
        </div>
      </div>
    )
  }

  const validate = () => {
    const e = {}
    if (!password)                e.password = "You'll need a password to continue"
    else if (password.length < 8) e.password = 'Password should be at least 8 characters'
    if (!confirm)                 e.confirm  = 'Just confirm your password below'
    else if (confirm !== password) e.confirm = "These don't match -- give it another go"
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setFormError('')
    setLoading(true)
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/reset-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setDone(true)
    } catch (err) {
      setFormError(err.message || 'Something went wrong. Please try again.')
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

        {!done ? (
          <>
            <h2 className='signin-header'>Set a new password</h2>
            <p className='signin-subheader'>Choose a strong password to protect your account.</p>

            {formError && (
              <div className='form-error-banner' style={{ marginBottom: 8 }}>
                <WarningCircle size={16} weight='fill' />
                <span>{formError}</span>
              </div>
            )}

            <form className='signin-form' onSubmit={handleSubmit} noValidate>

              <div>
                <FloatingInput
                  type={showPass ? 'text' : 'password'}
                  id="new-password"
                  label="New password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })) }}
                  error={errors.password}
                  rightSlot={
                    showPass
                      ? <EyeSlash size={17} color={iconColor} onClick={() => setShowPass(false)} />
                      : <Eye      size={17} color={iconColor} onClick={() => setShowPass(true)}  />
                  }
                />
                <PasswordStrength password={password} />
                {errors.password && (
                  <p className='auth-feedback error'>
                    <WarningCircle size={11} weight='fill' /> {errors.password}
                  </p>
                )}
              </div>

              <div>
                <FloatingInput
                  type={showConf ? 'text' : 'password'}
                  id="confirm-password"
                  label="Confirm new password"
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setErrors(p => ({ ...p, confirm: '' })) }}
                  error={errors.confirm}
                  success={confirm && confirm === password && !errors.confirm}
                  rightSlot={
                    showConf
                      ? <EyeSlash size={17} color={iconColor} onClick={() => setShowConf(false)} />
                      : <Eye      size={17} color={iconColor} onClick={() => setShowConf(true)}  />
                  }
                />
                {errors.confirm && (
                  <p className='auth-feedback error'>
                    <WarningCircle size={11} weight='fill' /> {errors.confirm}
                  </p>
                )}
              </div>

              <button
                type='submit'
                className={`signin-btn ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                <span className='signin-btn-text'>{loading ? 'Updating...' : 'Update password'}</span>
                <span className='signin-btn-icon'>
                  <ArrowRight size={18} weight='bold' />
                </span>
              </button>

            </form>
          </>
        ) : (
          <div className='auth-success-state'>
            <div className='auth-success-icon'>
              <CheckCircle size={32} weight='fill' />
            </div>
            <h2 className='signin-header' style={{ margin: '24px 0 8px' }}>Password updated</h2>
            <p className='signin-subheader' style={{ margin: '0 0 32px' }}>
              Your password has been reset. You can now sign in with your new password.
            </p>
            <button type='submit' className={`signin-btn ${loading ? 'loading' : ''}`} disabled={loading}>
  <span className='signin-btn-text'>{loading ? 'Signing in...' : 'Sign in'}</span>
  <span className='sign-arrow-icon'>
    {loading
      ? <span className='btn-spinner' />   // ← spins instead
      : <ArrowRight size={18} weight='bold' />  // ← never spins
    }
  </span>
</button>
          </div>
        )}
      </div>

      <div className='sign-in-image-side'>
        <img src={IMG} alt="Veltro" />
      </div>

    </div>
  )
}