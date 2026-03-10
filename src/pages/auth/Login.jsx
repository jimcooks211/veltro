import React, { useEffect, useState } from 'react'
import IMG from './IMG/SignIn_SideImg.avif'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowRight, WarningCircle, X } from '@phosphor-icons/react'
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

function ErrorModal({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className='error-modal-overlay' onClick={onClose}>
      <div className='error-modal' onClick={(e) => e.stopPropagation()}>
        <div className='error-modal-icon'>
          <WarningCircle size={22} weight='fill' />
        </div>
        <div className='error-modal-body'>
          <p className='error-modal-title'>Sign in failed</p>
          <p className='error-modal-message'>{message}</p>
        </div>
        <button className='error-modal-close' onClick={onClose}>
          <X size={16} />
        </button>
        <div className='error-modal-progress' />
      </div>
    </div>
  )
}

export default function Login({ onSwitch, onForgot, onNeedsVerify }) {
  const [isDark, setIsDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  )
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [errors,     setErrors]     = useState({})
  const [modalError, setModalError] = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [remember,   setRemember]   = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const h  = (e) => setIsDark(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])

  const validate = () => {
    const e = {}
    if (!email)
      e.email = 'Looks like you forgot your email'
    else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email))
      e.email = "That email doesn't look quite right"
    if (!password)
      e.password = "You'll need a password to continue"
    else if (password.length < 6)
      e.password = 'Password should be at least 6 characters'
    return e
  }

const handleSubmit = async (e) => {
  e.preventDefault()
  const errs = validate()
  if (Object.keys(errs).length) { setErrors(errs); return }
  setErrors({})
  setLoading(true)

  try {
    const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password, remember }),
    })
    const data = await res.json()

    if (!res.ok) {
      setModalError(data.message || "Those credentials didn't match. Want to try again?")
      return
    }

    // login always returns nextStep: 'verify' now — go to verify screen
    // pass remember so VerifyEmail can forward it to /verify-email for correct session length
    onNeedsVerify?.({ email: data.email, remember })

  } catch {
    setModalError('Network error. Please check your connection and try again.')
  } finally {
    setLoading(false)
  }
}

  return (
    <div className={`sign-in ${isDark ? 'dark' : 'light'}`}>

      {modalError && (
        <ErrorModal message={modalError} onClose={() => setModalError(null)} />
      )}

      <div className='sign-in-form-side'>
        <div className='signin-logo'>
          <Veltrolog variant='blue' />
        </div>

        <h2 className='signin-header'>Sign in to your account</h2>

        <form className='signin-form' onSubmit={handleSubmit} noValidate>
          <div>
            <FloatingInput
              type='email' id='email' label='Email address' value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })) }}
              error={errors.email}
            />
            {errors.email && (
              <p className='auth-feedback error'>
                <WarningCircle size={11} weight='fill' /> {errors.email}
              </p>
            )}
          </div>

          <div>
            <FloatingInput
              type='password' id='password' label='Password' value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })) }}
              error={errors.password}
            />
            {errors.password && (
              <p className='auth-feedback error'>
                <WarningCircle size={11} weight='fill' /> {errors.password}
              </p>
            )}
          </div>

          <div className='signin-row'>
            <div className='signin-radio-row'>
              <Checkbox id='remember' checked={remember} onCheckedChange={setRemember} />
              <label htmlFor='remember' className='signin-radio-label' style={{ cursor: 'pointer' }}>
                Remember me
              </label>
            </div>
            <p className='signin-forgot' onClick={onForgot}>Forgot password?</p>
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
            Not a member?{' '}
            <span className='signin-register-link' onClick={onSwitch}>Create an account</span>
          </p>
        </form>
      </div>

      <div className='sign-in-image-side'>
        <img src={IMG} alt='Veltro' />
      </div>
    </div>
  )
}