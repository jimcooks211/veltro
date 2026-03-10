import { useState, useEffect }   from 'react'
import { useParams, Outlet }      from 'react-router-dom'
import Sidebar       from './Sidebar'
import Navbar        from './Navbar'
import LoadingScreen from './LoadingScreen'
import './Dashboard.css'

/* ══════════════════════════════════════════════════════════════════
   TOKEN HELPERS
══════════════════════════════════════════════════════════════════ */
function getAccessToken() {
  return sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken') || null
}

function nukeAllStorage() {
  ;['accessToken', 'refreshToken'].forEach(k => {
    sessionStorage.removeItem(k)
    localStorage.removeItem(k)
  })
  sessionStorage.removeItem('newUser')
  sessionStorage.removeItem('veltro-profile-draft')
  ;[sessionStorage, localStorage].forEach(store => {
    Object.keys(store)
      .filter(k => k.startsWith('veltro'))
      .forEach(k => store.removeItem(k))
  })
}

/* ════════════════════════════════════════════════════════════════════
   DASHBOARD SHELL
   Routes nested under /dashboard/:userId render via <Outlet />
   inside vlt-dash-content — no page navigations away from the shell.
════════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { userId: routeUserId } = useParams()

  /* ── theme ── */
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('veltro-theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const saved = localStorage.getItem('veltro-theme')
    if (saved) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const h  = (e) => setIsDark(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])

  useEffect(() => {
    const root = document.getElementById('root')
    if (!root) return
    if (isDark) {
      root.classList.add('dark');  root.classList.remove('light')
    } else {
      root.classList.add('light'); root.classList.remove('dark')
    }
    document.body.style.background = 'var(--vlt-bg-page)'
  }, [isDark])

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    localStorage.setItem('veltro-theme', next ? 'dark' : 'light')
  }

  /* ── layout ── */
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen,   setMobileMenuOpen]   = useState(false)

  /* ── guard ── */
  const [guardStatus, setGuardStatus] = useState('checking')
  const [user,        setUser]        = useState(null)

  /* ── auth guard + profile fetch ── */
  useEffect(() => {
    const init = async () => {
      const token = getAccessToken()
      if (!token) { window.location.replace('/auth'); return }

      try {
        const payload     = JSON.parse(atob(token.split('.')[1]))
        const tokenUserId = payload.sub

        /* wrong userId in URL — redirect to the correct one */
        if (routeUserId && tokenUserId !== routeUserId) {
          window.location.replace(`/dashboard/${tokenUserId}`)
          return
        }

        /* onboarding check */
        const statusRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/tour/status`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        if (!statusRes.ok) { nukeAllStorage(); window.location.replace('/auth'); return }

        const status = await statusRes.json()
        if (!status.onboardingComplete) {
          window.location.replace(
            status.profileComplete ? '/veltrotour' : `/createprofile/${tokenUserId}`
          )
          return
        }

        /* full profile fetch */
        try {
          const meRes = await fetch(
            `${import.meta.env.VITE_API_URL}/api/profile/me`,
            { headers: { Authorization: `Bearer ${token}` } }
          )
          if (meRes.ok) {
            const { profile: p } = await meRes.json()
            if (p) {
              setUser({
                id:                   tokenUserId,
                firstName:            p.first_name            || '',
                lastName:             p.last_name             || '',
                username:             p.username              || '',
                bio:                  p.bio                   || '',
                email:                p.email                 || '',
                phone:                p.phone                 || '',
                dob:                  p.date_of_birth         || null,
                gender:               p.gender                || '',
                address:              p.address_line1         || '',
                apt:                  p.address_line2         || '',
                city:                 p.city                  || '',
                state:                p.state                 || '',
                zip:                  p.zip                   || '',
                country:              p.country               || '',
                occupation:           p.occupation            || '',
                investmentExperience: p.investment_experience || '',
                website:              p.website               || '',
                avatar:               p.avatar_url            || '',
                plan:                 p.plan                  || 'starter',
                riskProfile:          p.risk_profile          || 'balanced',
                createdAt:            p.created_at            || null,
              })
            }
          }
        } catch {
          /* non-fatal — try sessionStorage fallback */
          try {
            const raw = sessionStorage.getItem('newUser')
            if (raw) {
              const s = JSON.parse(raw)
              setUser({
                id:        tokenUserId,
                firstName: s.firstName || s.fullName?.split(' ')[0] || '',
                lastName:  s.lastName  || s.fullName?.split(' ').slice(1).join(' ') || '',
                email:     s.email     || '',
                avatar:    '',
                username:  '',
              })
            }
          } catch {}
        }

        setGuardStatus('ok')

      } catch {
        nukeAllStorage()
        window.location.replace('/auth')
      }
    }

    init()
  }, [routeUserId]) // eslint-disable-line

  /* close mobile drawer on desktop resize */
  useEffect(() => {
    const h = () => { if (window.innerWidth > 768) setMobileMenuOpen(false) }
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  const handleLogout = () => { nukeAllStorage(); window.location.replace('/auth') }

  /* ── guard gate ── */
  if (guardStatus === 'checking') return <LoadingScreen message='Loading your dashboard…' />

  /* ── shell ── */
  return (
    <div className={`vlt-dash-root ${isDark ? 'dark' : 'light'}`}>

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
        user={user}
        isDark={isDark}
        onLogout={handleLogout}
      />

      <div className={`vlt-dash-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>

        <Navbar
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
          onSidebarToggle={() => setSidebarCollapsed(c => !c)}
          sidebarCollapsed={sidebarCollapsed}
          user={user}
          isDark={isDark}
          onThemeToggle={toggleTheme}
          onLogout={handleLogout}
        />

        {/* nested route content renders here — no full page navigation */}
        <main className='vlt-dash-content'>
          <Outlet context={{ user, isDark, toggleTheme }} />
        </main>

      </div>
    </div>
  )
}