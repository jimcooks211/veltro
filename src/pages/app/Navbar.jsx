import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiGet, apiPatch } from '../../utils/api.js'
import {
  List, MagnifyingGlass, Moon, Sun, Bell, ArrowsLeftRight,
  CaretDown, SignOut, UserCircle, Gear, Check,
  ShieldCheck, ArrowCircleDown, ArrowCircleUp, Swap,
  IdentificationCard, ChartBar, Sparkle, Tag, Info,
} from '@phosphor-icons/react'
import './Navbar.css'

/* â”€â”€ notification type config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const N_TYPE = {
  login:      { color: '#00C076', Icon: ShieldCheck  },
  signup:     { color: '#1A56FF', Icon: UserCircle   },
  deposit:    { color: '#00FFD1', Icon: ArrowCircleDown },
  withdrawal: { color: '#FF3D57', Icon: ArrowCircleUp   },
  trade:      { color: '#F7931A', Icon: Swap            },
  kyc:        { color: '#9945FF', Icon: IdentificationCard },
  security:   { color: '#FFB800', Icon: ShieldCheck   },
  price:      { color: '#627EEA', Icon: ChartBar      },
  system:     { color: 'rgba(255,255,255,0.35)', Icon: Info },
}

const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/* â”€â”€ NotificationBell â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function NotificationBell() {
  const [open,          setOpen]          = useState(false)
  const [count,         setCount]         = useState(0)
  const [notifications, setNotifications] = useState([])
  const [loading,       setLoading]       = useState(false)
  const [marking,       setMarking]       = useState(false)
  const ref = useRef(null)

  /* â”€â”€ fetch unread count â”€â”€ */
  const fetchCount = useCallback(() => {
    apiGet('/api/notifications/unread-count')
      .then(({ unread }) => setCount(unread ?? 0))
      .catch(() => {})
  }, [])

  /* â”€â”€ poll count every 60s â”€â”€ */
  useEffect(() => {
    fetchCount()
    const id = setInterval(fetchCount, 60_000)
    return () => clearInterval(id)
  }, [fetchCount])

  /* â”€â”€ close on outside click â”€â”€ */
  useEffect(() => {
    if (!open) return
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  /* â”€â”€ fetch fresh notifications every time panel opens â”€â”€ */
  useEffect(() => {
    if (!open) return
    setLoading(true)
    apiGet('/api/notifications?limit=15')
      .then(({ notifications: notifs, unread }) => {
        setNotifications(Array.isArray(notifs) ? notifs : [])
        if (typeof unread === 'number') setCount(unread)
      })
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false))
  }, [open]) // â† removed notifications.length guard -- always fetch fresh

  /* â”€â”€ mark all as read â”€â”€ */
  const markAllRead = async () => {
    if (marking || count === 0) return
    setMarking(true)
    try {
      await apiPatch('/api/notifications/read', {})
      setNotifications(ns => ns.map(n => ({ ...n, is_read: 1 })))
      setCount(0)
    } catch {
      /* silent */
    } finally {
      setMarking(false)
    }
  }

  const displayCount = count > 99 ? '99+' : count > 0 ? String(count) : null

  return (
    <div ref={ref} className='vlt-nb-wrap'>
      <button
        type='button'
        className={['vlt-nb-btn', open ? 'active' : ''].filter(Boolean).join(' ')}
        onClick={() => setOpen(o => !o)}
        title='Notifications'
      >
        <Bell size={18} weight='duotone' />
        {displayCount && (
          <span className='vlt-nb-dot'>
            {displayCount}
          </span>
        )}
      </button>

      {open && (
        <div className='vlt-nb-panel'>
          {/* header */}
          <div className='vlt-nb-header'>
            <span className='vlt-nb-header-title'>Notifications</span>
            <div className='vlt-nb-header-right'>
              {count > 0 && <span className='vlt-nb-count'>{count} new</span>}
              {count > 0 && (
                <button
                  className='vlt-nb-mark-all'
                  onClick={markAllRead}
                  disabled={marking}
                >
                  {marking ? 'Marking...' : 'Mark all read'}
                </button>
              )}
            </div>
          </div>

          {/* body */}
          <div className='vlt-nb-content'>
            {loading ? (
              <div className='vlt-nb-loading'>
                <span className='vlt-nb-spin' />
                Loading...
              </div>
            ) : notifications.length > 0 ? (
              <div className='vlt-nb-list'>
                {notifications.map(n => {
                  const cfg = N_TYPE[n.type] || N_TYPE.system
                  const Icon = cfg.Icon
                  return (
                    <div
                      key={n.id}
                      className={`vlt-nb-item ${!n.is_read ? 'unread' : ''}`}
                    >
                      <div
                        className='vlt-nb-item-ico'
                        style={{ background: `${cfg.color}18`, color: cfg.color }}
                      >
                        <Icon size={12} weight='duotone' />
                      </div>
                      <div className='vlt-nb-item-body'>
                        <div className='vlt-nb-item-title'>{n.title}</div>
                        <div className='vlt-nb-item-msg'>{n.message}</div>
                        <div className='vlt-nb-item-time'>{formatTime(n.created_at)}</div>
                      </div>
                      {!n.is_read && <span className='vlt-nb-unread-dot' />}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className='vlt-nb-empty'>
                <Bell size={28} weight='duotone' className='vlt-nb-empty-icon' />
                <p>You're all caught up</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* â”€â”€ UserMenu (navbar dropdown) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function UserMenu({ user, onThemeToggle, isDark, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()
  const { userId } = useParams()

  useEffect(() => {
    if (!open) return
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : 'Your Name'

  const experience = user?.investmentExperience
    ? user.investmentExperience.charAt(0).toUpperCase() + user.investmentExperience.slice(1)
    : 'Investor'

  const handleLogout = () => {
    if (onLogout) { onLogout(); return }
    ;['accessToken', 'refreshToken'].forEach(k => {
      sessionStorage.removeItem(k); localStorage.removeItem(k)
    })
    window.location.replace('/auth')
  }

  return (
    <div ref={ref} className='vlt-um-wrap'>
      <button
        type='button'
        className={['vlt-um-trigger', open ? 'active' : ''].filter(Boolean).join(' ')}
        onClick={() => setOpen(o => !o)}
      >
        <img
          src={user?.avatar || '/default-avatar.svg'}
          alt='avatar'
          className='vlt-um-avatar'
        />
        <div className='vlt-um-info'>
          <span className='vlt-um-name'>{displayName}</span>
          <span className='vlt-um-role'>{experience}</span>
        </div>
        <CaretDown
          size={11}
          weight='bold'
          className={['vlt-um-caret', open ? 'open' : ''].filter(Boolean).join(' ')}
        />
      </button>

      {open && (
        <div className='vlt-um-panel'>
          <div className='vlt-um-panel-header'>
            <img
              src={user?.avatar || '/default-avatar.svg'}
              alt='avatar'
              className='vlt-um-ph-avatar'
            />
            <div>
              <p className='vlt-um-ph-name'>{displayName}</p>
              <p className='vlt-um-ph-email'>{user?.email || ''}</p>
            </div>
          </div>
          <div className='vlt-um-divider' />
          <button type='button' className='vlt-um-item' onClick={() => { setOpen(false); navigate(\/dashboard/\/profile\) }}>
            <UserCircle size={14} weight='duotone' /> Profile
          </button>
          <button type='button' className='vlt-um-item' onClick={() => { setOpen(false); navigate(\/dashboard/\/settings\) }}>
            <Gear size={14} weight='duotone' /> Settings
          </button>
          <button type='button' className='vlt-um-item' onClick={onThemeToggle}>
            {isDark
              ? <Sun  size={14} weight='duotone' />
              : <Moon size={14} weight='duotone' />}
            {isDark ? 'Light mode' : 'Dark mode'}
          </button>
          <div className='vlt-um-divider' />
          <button type='button' className='vlt-um-item danger' onClick={handleLogout}>
            <SignOut size={14} weight='duotone' /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}

/* â”€â”€ Navbar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function Navbar({
  onMobileMenuOpen,
  onSidebarToggle,
  sidebarCollapsed,
  user,
  isDark,
  onThemeToggle,
  onLogout,
}) {
  const [search,        setSearch]       = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  return (
    <header
      className={[
        'vlt-navbar',
        sidebarCollapsed ? 'sidebar-collapsed' : '',
      ].filter(Boolean).join(' ')}
    >
      <div className='vlt-nb-left'>
        <button type='button' className='vlt-nb-sidebar-toggle' onClick={onSidebarToggle}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <List size={19} weight='bold' />
        </button>
        <button type='button' className='vlt-nb-hamburger' onClick={onMobileMenuOpen} title='Open menu'>
          <List size={19} weight='bold' />
        </button>
        <div className={['vlt-nb-search', searchFocused ? 'focused' : ''].filter(Boolean).join(' ')}>
          <MagnifyingGlass size={14} weight='bold' className='vlt-nb-search-icon' />
          <input
            type='text' placeholder='Search...' value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className='vlt-nb-search-input' autoComplete='off' spellCheck='false'
          />
          {search && (
            <button type='button' className='vlt-nb-search-clear' onClick={() => setSearch('')}>Ã—</button>
          )}
        </div>
      </div>

      <div className='vlt-nb-right'>
        <button type='button' className='vlt-nb-icon-btn' title='Language'>
          <span className='vlt-nb-flag'>ðŸ‡ºðŸ‡¸</span>
        </button>
        <button type='button' className='vlt-nb-icon-btn' onClick={onThemeToggle}
          title={isDark ? 'Switch to light' : 'Switch to dark'}>
          {isDark ? <Moon size={17} weight='duotone' /> : <Sun size={17} weight='duotone' />}
        </button>
        <button type='button' className='vlt-nb-icon-btn' title='Transfers'>
          <ArrowsLeftRight size={17} weight='duotone' />
        </button>
        <NotificationBell />
        <UserMenu user={user} isDark={isDark} onThemeToggle={onThemeToggle} onLogout={onLogout} />
      </div>
    </header>
  )
}

