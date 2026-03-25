/**
 * OnboardTransition.jsx
 * Full-screen animated overlay shown while onboarding data is saving.
 * Drop-in -- renders when `visible` prop is true, unmounts cleanly after exit.
 *
 * Usage in Onboard.jsx:
 *   import OnboardTransition from './OnboardTransition'
 *   ...
 *   {submitting && <OnboardTransition />}
 */

import { useEffect, useState } from 'react'
import Veltrolog from '../../components/VeltroIcon'
import './Onboardtransition.css'

const MESSAGES = [
  'Setting up your profile...',
  'Calibrating your dashboard...',
  'Almost there...',
]

export default function OnboardTransition({ visible = true }) {
  const [msgIndex, setMsgIndex]   = useState(0)
  const [fade, setFade]           = useState(true)   // true = visible, false = fading out
  const [mounted, setMounted]     = useState(false)  // triggers enter animation

  /* ── mount trigger -- tiny delay lets CSS transition fire ── */
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(t)
  }, [])

  /* ── cycle messages every 1.8 s ── */
  useEffect(() => {
    if (msgIndex >= MESSAGES.length - 1) return
    const out = setTimeout(() => setFade(false), 1600)
    const next = setTimeout(() => {
      setMsgIndex(i => i + 1)
      setFade(true)
    }, 1900)
    return () => { clearTimeout(out); clearTimeout(next) }
  }, [msgIndex])

  return (
    <div className={`obt-root ${mounted ? 'obt-mounted' : ''}`} aria-live='polite' aria-label='Loading'>

      {/* ── noise grain ── */}
      <div className='obt-grain' aria-hidden='true' />

      {/* ── soft radial bloom behind icon ── */}
      <div className='obt-bloom' aria-hidden='true' />

      {/* ── orbit rings ── */}
      <div className='obt-rings' aria-hidden='true'>
        <div className='obt-ring obt-ring-1' />
        <div className='obt-ring obt-ring-2' />
        <div className='obt-ring obt-ring-3' />
      </div>

      {/* ── icon ── */}
      <div className='obt-icon-wrap'>
        <div className='obt-icon-pulse'>
          <Veltrolog variant='blue' className='obt-icon' />
        </div>
      </div>

      {/* ── message ── */}
      <p className={`obt-message ${fade ? 'obt-msg-in' : 'obt-msg-out'}`}>
        {MESSAGES[msgIndex]}
      </p>

      {/* ── progress dots ── */}
      <div className='obt-dots' aria-hidden='true'>
        <span className='obt-dot' style={{ animationDelay: '0ms'   }} />
        <span className='obt-dot' style={{ animationDelay: '160ms' }} />
        <span className='obt-dot' style={{ animationDelay: '320ms' }} />
      </div>

    </div>
  )
}