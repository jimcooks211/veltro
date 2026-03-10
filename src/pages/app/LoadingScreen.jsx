import { useEffect, useState } from 'react'
import Veltrolog from '../../components/VeltroIcon'

/* ══════════════════════════════════════════════════════════════════
   VELTRO LOADING SCREEN
   — theme-aware (respects system preference + veltro-theme localStorage)
   — uses VeltroIcon for branding consistency
   — matches the dashboard CSS token system
══════════════════════════════════════════════════════════════════ */
export default function LoadingScreen({ message = '' }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('veltro-theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const saved = localStorage.getItem('veltro-theme')
    if (saved) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const h = (e) => setIsDark(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])

  const bg       = isDark ? '#080d18' : '#f4f7fc'
  const ringFade = isDark ? 'rgba(26,86,255,0.08)' : 'rgba(26,86,255,0.06)'
  const ringEdge = isDark ? 'rgba(26,86,255,0.55)' : 'rgba(26,86,255,0.45)'
  const textCol  = isDark ? 'rgba(168,178,204,0.55)' : 'rgba(61,74,102,0.6)'
  const barBg    = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(10,15,30,0.07)'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: bg,
      fontFamily: "'Inter','Segoe UI',Arial,sans-serif",
      transition: 'background 0.3s',
    }}>
      <style>{`
        @keyframes vls-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes vls-pulse-ring {
          0%   { transform: scale(0.92); opacity: 0.7; }
          50%  { transform: scale(1.06); opacity: 0.25; }
          100% { transform: scale(0.92); opacity: 0.7; }
        }
        @keyframes vls-bar {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        @keyframes vls-fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* outer pulse ring */}
      <div style={{
        position: 'absolute',
        width: 120, height: 120,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${ringEdge} 0%, ${ringFade} 60%, transparent 75%)`,
        animation: 'vls-pulse-ring 2.4s ease-in-out infinite',
      }} />

      {/* spinner ring */}
      <div style={{
        position: 'absolute',
        width: 90, height: 90,
        borderRadius: '50%',
        border: `1.5px solid ${ringFade}`,
        borderTopColor: ringEdge,
        animation: 'vls-spin 1.1s linear infinite',
      }} />

      {/* logo */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 28,
        animation: 'vls-fade-up 0.5s ease both',
      }}>
        <div style={{
          width: 52, height: 52,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          /* slight drop shadow so icon pops on both themes */
          filter: isDark
            ? 'drop-shadow(0 0 14px rgba(26,86,255,0.45))'
            : 'drop-shadow(0 0 8px rgba(26,86,255,0.25))',
        }}>
          <Veltrolog variant='blue' />
        </div>

        {/* progress bar track */}
        <div style={{
          width: 120, height: 2, borderRadius: 4,
          background: barBg, overflow: 'hidden',
        }}>
          <div style={{
            width: '35%', height: '100%', borderRadius: 4,
            background: 'linear-gradient(90deg,transparent,#1A56FF,#00D4FF,transparent)',
            animation: 'vls-bar 1.4s cubic-bezier(0.4,0,0.2,1) infinite',
          }} />
        </div>

        {/* message */}
        {message && (
          <p style={{
            margin: 0,
            fontSize: 12, fontWeight: 600,
            letterSpacing: '0.5px',
            color: textCol,
            animation: 'vls-fade-up 0.6s ease 0.15s both',
          }}>
            {message}
          </p>
        )}
      </div>
    </div>
  )
}