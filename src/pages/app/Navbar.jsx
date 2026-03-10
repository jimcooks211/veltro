import { useState, useRef, useEffect } from 'react'
import {
  List,
  MagnifyingGlass,
  Moon,
  Sun,
  Bell,
  ArrowsLeftRight,
  CaretDown,
  SignOut,
  UserCircle,
  Gear,
} from '@phosphor-icons/react'
import './Navbar.css'

/* ── NotificationBell ─────────────────────────────────────────────── */
function NotificationBell({ count = 0 }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  return (
    <div ref={ref} className='vlt-nb-wrap'>
      <button
        type='button'
        className={['vlt-nb-btn', open ? 'active' : ''].filter(Boolean).join(' ')}
        onClick={() => setOpen(o => !o)}
        title='Notifications'
      >
        <Bell size={18} weight='duotone' />
        {count > 0 && <span className='vlt-nb-dot' />}
      </button>

      {open && (
        <div className='vlt-nb-panel'>
          <div className='vlt-nb-header'>
            <span>Notifications</span>
            {count > 0 && <span className='vlt-nb-count'>{count} new</span>}
          </div>
          <div className='vlt-nb-empty'>
            <Bell size={28} weight='duotone' className='vlt-nb-empty-icon' />
            <p>You're all caught up</p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── UserMenu (navbar dropdown) ──────────────────────────────────── */
function UserMenu({ user, onThemeToggle, isDark }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

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

  return (
    <div ref={ref} className='vlt-um-wrap'>
      <button
        type='button'
        className={['vlt-um-trigger', open ? 'active' : ''].filter(Boolean).join(' ')}
        onClick={() => setOpen(o => !o)}
      >
        <img
          src={user?.avatar || '/default-avatar.png'}
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
          {/* header */}
          <div className='vlt-um-panel-header'>
            <img
              src={user?.avatar || '/default-avatar.png'}
              alt='avatar'
              className='vlt-um-ph-avatar'
            />
            <div>
              <p className='vlt-um-ph-name'>{displayName}</p>
              <p className='vlt-um-ph-email'>{user?.email || ''}</p>
            </div>
          </div>
          <div className='vlt-um-divider' />

          <button type='button' className='vlt-um-item'>
            <UserCircle size={14} weight='duotone' /> Profile
          </button>
          <button type='button' className='vlt-um-item'>
            <Gear size={14} weight='duotone' /> Settings
          </button>
          <button type='button' className='vlt-um-item' onClick={onThemeToggle}>
            {isDark
              ? <Sun  size={14} weight='duotone' />
              : <Moon size={14} weight='duotone' />}
            {isDark ? 'Light mode' : 'Dark mode'}
          </button>

          <div className='vlt-um-divider' />

          <button
            type='button'
            className='vlt-um-item danger'
            onClick={() => {
              ;['accessToken', 'refreshToken'].forEach(k => {
                sessionStorage.removeItem(k); localStorage.removeItem(k)
              })
              window.location.replace('/auth')
            }}
          >
            <SignOut size={14} weight='duotone' /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Navbar ──────────────────────────────────────────────────────── */
export default function Navbar({
  onMobileMenuOpen,
  onSidebarToggle,
  sidebarCollapsed,
  user,
  isDark,
  onThemeToggle,
}) {
  const [search,       setSearch]       = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  return (
    <header
      className={[
        'vlt-navbar',
        sidebarCollapsed ? 'sidebar-collapsed' : '',
      ].filter(Boolean).join(' ')}
    >
      {/* ── left ── */}
      <div className='vlt-nb-left'>

        {/* desktop: sidebar collapse toggle (≡) — always visible */}
        <button
          type='button'
          className='vlt-nb-sidebar-toggle'
          onClick={onSidebarToggle}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <List size={19} weight='bold' />
        </button>

        {/* mobile: open drawer */}
        <button
          type='button'
          className='vlt-nb-hamburger'
          onClick={onMobileMenuOpen}
          title='Open menu'
        >
          <List size={19} weight='bold' />
        </button>

        {/* search */}
        <div className={['vlt-nb-search', searchFocused ? 'focused' : ''].filter(Boolean).join(' ')}>
          <MagnifyingGlass size={14} weight='bold' className='vlt-nb-search-icon' />
          <input
            type='text'
            placeholder='Search…'
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className='vlt-nb-search-input'
            autoComplete='off'
            spellCheck='false'
          />
          {search && (
            <button
              type='button'
              className='vlt-nb-search-clear'
              onClick={() => setSearch('')}
            >×</button>
          )}
        </div>
      </div>

      {/* ── right ── */}
      <div className='vlt-nb-right'>

        {/* locale / flag */}
        <button type='button' className='vlt-nb-icon-btn' title='Language'>
          <span className='vlt-nb-flag'>🇺🇸</span>
        </button>

        {/* theme */}
        <button
          type='button'
          className='vlt-nb-icon-btn'
          onClick={onThemeToggle}
          title={isDark ? 'Switch to light' : 'Switch to dark'}
        >
          {isDark
            ? <Moon size={17} weight='duotone' />
            : <Sun  size={17} weight='duotone' />}
        </button>

        {/* transfers */}
        <button type='button' className='vlt-nb-icon-btn' title='Transfers'>
          <ArrowsLeftRight size={17} weight='duotone' />
        </button>

        {/* notifications */}
        <NotificationBell count={1} />

        {/* user */}
        <UserMenu user={user} isDark={isDark} onThemeToggle={onThemeToggle} />
      </div>
    </header>
  )
}