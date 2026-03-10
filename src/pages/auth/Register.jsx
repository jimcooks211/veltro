import React, { useEffect, useState } from 'react'
import IMG from './IMG/SignIn_SideImg.avif'
import { ArrowRight, WarningCircle, CheckCircle } from '@phosphor-icons/react'
import Veltrolog from '../../components/VeltroIcon'
import "./auth.css"

function FloatingInput({ type, id, label, value, onChange, error, success }) {
  const [focused, setFocused] = useState(false)
  const [shown, setShown] = useState(false)
  const isPassword = type === 'password'
  const isLifted = focused || value.length > 0
  const inputType = isPassword ? (shown ? 'text' : 'password') : type

  return (
    <div className='float-input-wrapper'>
      <input
        id={id}
        type={inputType}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete='new-password'
        autoCorrect='off'
        autoCapitalize='off'
        spellCheck='false'
        className={`auth-input float-input
          ${focused    ? 'focused'    : ''}
          ${error      ? 'error'      : ''}
          ${success    ? 'success'    : ''}
          ${isPassword ? 'has-toggle' : ''}
        `}
      />
      <label
        htmlFor={id}
        className={`float-label ${isLifted ? 'lifted' : ''} ${error ? 'error' : ''}`}
      >
        {label}
      </label>
      {isPassword && (
        <button
          type='button'
          className='float-input-eye'
          onClick={() => setShown(s => !s)}
          tabIndex={-1}
          aria-label={shown ? 'Hide password' : 'Show password'}
        />
      )}
      {(error || success) && (
        <span className={`float-input-status ${isPassword ? 'with-toggle' : ''}`}>
          {error   && <WarningCircle size={16} weight='fill' color='var(--auth-error)'   />}
          {success && <CheckCircle   size={16} weight='fill' color='var(--auth-success)' />}
        </span>
      )}
    </div>
  )
}

function InlineError({ message }) {
  if (!message) return null
  return (
    <p className='auth-feedback error inline-error'>
      <WarningCircle size={11} weight='fill' />
      {message}
    </p>
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

export default function Register({ onSwitch, onRegistered }) {
  const [isDark, setIsDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  )
  const [form,          setForm]          = useState({ fullName: '', email: '', password: '', confirm: '' })
  const [errors,        setErrors]        = useState({})
  const [success,       setSuccess]       = useState({})
  const [loading,       setLoading]       = useState(false)
  const [formError,     setFormError]     = useState('')
  const [showLoginLink, setShowLoginLink] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const h  = (e) => setIsDark(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])

  const set = (field) => (e) => {
    const val = e.target.value
    setForm(p => ({ ...p, [field]: val }))
    setErrors(p => ({ ...p, [field]: '' }))
    setFormError('')

    const ok = {}
    if (field === 'fullName' && val.trim().length >= 2) ok.fullName = true
    if (field === 'email'    && /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val)) ok.email = true
    if (field === 'password' && val.length >= 8)        ok.password = true
    if (field === 'confirm'  && val === form.password && val) ok.confirm = true
    setSuccess(p => ({ ...p, ...ok }))

    if (field === 'confirm' && form.password && val && val !== form.password) {
      setErrors(p => ({ ...p, confirm: "These don't match, give it another go" }))
      setSuccess(p => ({ ...p, confirm: false }))
    }
    if (field === 'confirm' && val === form.password) {
      setErrors(p => ({ ...p, confirm: '' }))
    }
    if (field === 'password' && form.confirm && val !== form.confirm) {
      setErrors(p => ({ ...p, confirm: "These don't match, give it another go" }))
      setSuccess(p => ({ ...p, confirm: false }))
    }
    if (field === 'password' && form.confirm && val === form.confirm) {
      setErrors(p => ({ ...p, confirm: '' }))
      setSuccess(p => ({ ...p, confirm: true }))
    }
  }

  const validate = () => {
    const e = {}
    if (!form.fullName.trim())                e.fullName = 'A name is required to continue'
    else if (form.fullName.trim().length < 2) e.fullName = 'Name should be a little longer'
    if (!form.email)                          e.email    = 'Looks like you forgot your email'
    else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(form.email))
                                              e.email    = "That email doesn't look quite right"
    if (!form.password)                       e.password = "You'll need a password to continue"
    else if (form.password.length < 8)        e.password = 'Password should be at least 8 characters'
    if (!form.confirm)                        e.confirm  = 'Just confirm your password below'
    else if (form.confirm !== form.password)  e.confirm  = "These don't match, give it another go"
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      setFormError('A few things need your attention before we continue.')
      return
    }
    setErrors({})
    setFormError('')
    setLoading(true)

    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          fullName: form.fullName,
          email:    form.email,
          password: form.password,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409 && data.nextStep === 'login') {
          /* account exists — show message with a switch-to-login link */
          setFormError(data.message)
          setShowLoginLink(true)
        } else {
          setFormError(data.message || 'Something went wrong. Please try again.')
        }
        return
      }

      sessionStorage.setItem('newUser', JSON.stringify({
  fullName:  data.fullName,
  firstName: data.firstName,
  lastName:  data.lastName,
  email:     data.email,
  userId:    data.userId,
}))
onRegistered?.({ email: data.email, userId: data.userId })

    } catch {
      setFormError('Network error. Please check your connection and try again.')
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

        <h2 className='signin-header'>Create your account</h2>
        <p className='signin-subheader'>Join thousands of investors already winning with Veltro.</p>

        {formError && (
          <div className='form-error-banner'>
            <WarningCircle size={16} weight='fill' />
            <span>
              {formError}
              {showLoginLink && (
                <>
                  {' '}
                  <span
                    className='signin-register-link'
                    style={{ fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                    onClick={onSwitch}
                  >
                    Sign in →
                  </span>
                </>
              )}
            </span>
          </div>
        )}

        <form className='signin-form' onSubmit={handleSubmit} noValidate autoComplete='off'>
          <div>
            <FloatingInput type='text' id='fullName' label='Full name'
              value={form.fullName} onChange={set('fullName')}
              error={errors.fullName} success={success.fullName && !errors.fullName} />
            <InlineError message={errors.fullName} />
          </div>
          <div>
            <FloatingInput type='email' id='email' label='Email address'
              value={form.email} onChange={set('email')}
              error={errors.email} success={success.email && !errors.email} />
            <InlineError message={errors.email} />
          </div>
          <div>
            <FloatingInput type='password' id='password' label='Password'
              value={form.password} onChange={set('password')}
              error={errors.password} success={success.password && !errors.password} />
            <PasswordStrength password={form.password} />
            <InlineError message={errors.password} />
          </div>
          <div>
            <FloatingInput type='password' id='confirm' label='Confirm password'
              value={form.confirm} onChange={set('confirm')}
              error={errors.confirm} success={success.confirm && !errors.confirm} />
            <InlineError message={errors.confirm} />
          </div>

          <button type='submit' className={`signin-btn ${loading ? 'loading' : ''}`} disabled={loading}>
  <span className='signin-btn-text'>{loading ? 'Create Account...' : 'Create Account'}</span>
  <span className='sign-arrow-icon'>
    {loading
      ? <span className='btn-spinner' />   // ← spins instead
      : <ArrowRight size={18} weight='bold' className=''/>  // ← never spins
    }
  </span>
</button>

          <p className='signin-register'>
            Already have an account?{' '}
            <span className='signin-register-link' onClick={onSwitch}>Sign in</span>
          </p>
        </form>
      </div>

      <div className='sign-in-image-side'>
        <img src={IMG} alt='Veltro' />
      </div>
    </div>
  )
}