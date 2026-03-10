import { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  SquaresFour,
  ChartLineUp,
  Wallet,
  ChartPie,
  NewspaperClipping,
  Headset,
  Gear,
  Bell,
  CaretRight,
  CaretDown,
  CaretUpDown,
  SquareHalf,
  ChartBarHorizontal,
  UserCircle,
  Question,
  ArrowsClockwise,
  SignOut,
} from '@phosphor-icons/react'
import VeltroLogoLight from '../../components/VeltroLogoLight'
import VeltroDark      from '../../components/VeltroDarkLogo'
import './Sidebar.css'

/* ── navigation tree ─────────────────────────────────────────────── */
const buildNavSections = (userId) => {
  const base = userId ? `/dashboard/${userId}` : '/dashboard'
  return [
    {
      section: 'Overview',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: SquaresFour,
          path: base,
        },
        {
          id: 'markets',
          label: 'Markets',
          icon: ChartLineUp,
          path: `${base}/markets`,
        },
        {
          id: 'news',
          label: 'News',
          icon: NewspaperClipping,
          path: `${base}/news`,
        },
      ],
    },
    {
      section: 'Apps',
      items: [
        {
          id: 'trading',
          label: 'Trading',
          icon: ChartBarHorizontal,
          children: [
            { id: 'tr-trade',  label: 'Trade',  path: `${base}/trade`  },
            { id: 'tr-orders', label: 'Orders', path: `${base}/orders` },
          ],
        },
        {
          id: 'portfolio',
          label: 'Portfolio',
          icon: ChartPie,
          children: [
            { id: 'pf-portfolio',    label: 'Portfolio',    path: `${base}/portfolio`    },
            { id: 'pf-watchlist',    label: 'Watchlist',    path: `${base}/watchlist`    },
            { id: 'pf-transactions', label: 'Transactions', path: `${base}/transactions` },
          ],
        },
        {
          id: 'wallet',
          label: 'Wallet',
          icon: Wallet,
          children: [
            { id: 'wl-wallet',   label: 'Overview', path: `${base}/wallet`          },
            { id: 'wl-deposit',  label: 'Deposit',  path: `${base}/wallet/deposit`  },
            { id: 'wl-withdraw', label: 'Withdraw', path: `${base}/wallet/withdraw` },
          ],
        },
        {
          id: 'support',
          label: 'Support',
          icon: Headset,
          path: `${base}/support`,
        },
      ],
    },
    {
      section: 'Settings',
      items: [
        {
          id: 'settings',
          label: 'Settings',
          icon: Gear,
          children: [
            { id: 'st-general',  label: 'General',       path: `${base}/settings`               },
            { id: 'st-security', label: 'Security',      path: `${base}/settings/security`      },
            { id: 'st-kyc',      label: 'KYC',           path: `${base}/settings/kyc`           },
            { id: 'st-notif',    label: 'Notifications', path: `${base}/settings/notifications` },
          ],
        },
      ],
    },
  ]
}

/* ── SidebarItem ─────────────────────────────────────────────────── */
function SidebarItem({ item, collapsed }) {
  const location    = useLocation()
  const childActive = item.children?.some(c => location.pathname === c.path)
  const [open, setOpen] = useState(childActive)

  useEffect(() => { if (childActive) setOpen(true) }, [childActive])

  const Icon        = item.icon
  const hasChildren = !!item.children?.length

  /* ── leaf item ── */
  if (!hasChildren) {
    return (
      <NavLink
        to={item.path}
        end={item.id === 'dashboard'} /* exact match for dashboard index */
        title={collapsed ? item.label : undefined}
        className={({ isActive }) =>
          ['vlt-nav-item', isActive ? 'active' : '', item.accent ? 'accent' : '']
            .filter(Boolean).join(' ')
        }
      >
        {Icon && <Icon size={17} weight='duotone' className='vlt-nav-icon' />}
        {!collapsed && (
          <>
            <span className='vlt-nav-label'>{item.label}</span>
            {item.badge && <span className='vlt-nav-badge'>{item.badge}</span>}
          </>
        )}
      </NavLink>
    )
  }

  /* ── group with children ── */
  return (
    <div className={['vlt-nav-group', open ? 'open' : ''].filter(Boolean).join(' ')}>
      <button
        type='button'
        title={collapsed ? item.label : undefined}
        className={['vlt-nav-item parent', childActive ? 'child-active' : '']
          .filter(Boolean).join(' ')}
        onClick={() => setOpen(o => !o)}
      >
        {Icon && <Icon size={17} weight='duotone' className='vlt-nav-icon' />}
        {!collapsed && (
          <>
            <span className='vlt-nav-label'>{item.label}</span>
            <span className='vlt-nav-caret'>
              {open
                ? <CaretDown  size={11} weight='bold' />
                : <CaretRight size={11} weight='bold' />}
            </span>
          </>
        )}
      </button>

      {!collapsed && (
        <div className='vlt-nav-children'>
          {item.children.map(child => (
            <NavLink
              key={child.id}
              to={child.path}
              className={({ isActive }) =>
                ['vlt-nav-item child', isActive ? 'active' : ''].filter(Boolean).join(' ')
              }
            >
              <span className='vlt-child-dot' />
              <span className='vlt-nav-label'>{child.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── UserPopup ───────────────────────────────────────────────────── */
function UserPopup({ onClose, onLogout, userId }) {
  const navigate = useNavigate()
  const ref      = useRef(null)
  const base     = userId ? `/dashboard/${userId}` : '/dashboard'

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    const id = setTimeout(() => document.addEventListener('mousedown', h), 10)
    return () => { clearTimeout(id); document.removeEventListener('mousedown', h) }
  }, [onClose])

  const go = (path) => { navigate(path); onClose() }

  return (
    <div ref={ref} className='vlt-user-popup'>
      <button type='button' className='vlt-up-item' onClick={() => go(`${base}/profile`)}>
        <UserCircle      size={15} weight='duotone' className='vlt-up-icon' />
        <span>My Profile</span>
      </button>
      <button type='button' className='vlt-up-item' onClick={() => go(`${base}/settings`)}>
        <Gear            size={15} weight='duotone' className='vlt-up-icon' />
        <span>Settings</span>
      </button>
      <button type='button' className='vlt-up-item' onClick={() => go(`${base}/support`)}>
        <Question        size={15} weight='duotone' className='vlt-up-icon' />
        <span>Help &amp; Support</span>
      </button>
      <button type='button' className='vlt-up-item' onClick={() => go(`${base}/settings/notifications`)}>
        <Bell            size={15} weight='duotone' className='vlt-up-icon' />
        <span>Notifications</span>
      </button>
      <button type='button' className='vlt-up-item' onClick={() => go('/switch-account')}>
        <ArrowsClockwise size={15} weight='duotone' className='vlt-up-icon' />
        <span>Switch Account</span>
      </button>
      <div className='vlt-up-divider' />
      <button type='button' className='vlt-up-item danger' onClick={onLogout}>
        <SignOut size={15} weight='duotone' className='vlt-up-icon' />
        <span>Sign out</span>
      </button>
    </div>
  )
}

/* ── Sidebar ─────────────────────────────────────────────────────── */
export default function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
  user,
  isDark,
  onLogout,
}) {
  const [popupOpen, setPopupOpen] = useState(false)

  const displayName   = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : 'Your Name'

  const navSections   = buildNavSections(user?.id)
  const LogoComponent = isDark ? VeltroDark : VeltroLogoLight

  return (
    <>
      {mobileOpen && (
        <div className='vlt-sidebar-overlay' onClick={onMobileClose} />
      )}

      <aside
        className={[
          'vlt-sidebar',
          collapsed  ? 'collapsed'   : '',
          mobileOpen ? 'mobile-open' : '',
        ].filter(Boolean).join(' ')}
      >
        {/* ── logo row ── */}
        <div className='vlt-sidebar-logo'>
          <div className='vlt-logo-wrap'>
            <LogoComponent
              className='vlt-logo-svg'
              style={{ scale: '0.65', transform: 'translate(-4rem, 3px)' }}
            />
          </div>
          <button
            type='button'
            className='vlt-sidebar-toggle'
            onClick={onToggle}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <SquareHalf size={16} weight='duotone' />
          </button>
        </div>

        {/* ── nav sections ── */}
        <nav className='vlt-sidebar-nav'>
          {navSections.map(section => (
            <div key={section.section} className='vlt-nav-section'>
              {!collapsed && (
                <p className='vlt-section-label'>{section.section}</p>
              )}
              {section.items.map(item => (
                <SidebarItem key={item.id} item={item} collapsed={collapsed} />
              ))}
            </div>
          ))}
        </nav>

        {/* ── bottom user card + popup ── */}
        <div className='vlt-sidebar-user-wrap'>
          {popupOpen && (
            <UserPopup
              userId={user?.id}
              onClose={() => setPopupOpen(false)}
              onLogout={() => { setPopupOpen(false); onLogout?.() }}
            />
          )}

          <div
            className={['vlt-sidebar-user', popupOpen ? 'popup-open' : ''].filter(Boolean).join(' ')}
            role='button'
            tabIndex={0}
            onClick={() => setPopupOpen(o => !o)}
            onKeyDown={e => e.key === 'Enter' && setPopupOpen(o => !o)}
          >
            <img
              src={user?.avatar || '/default-avatar.png'}
              alt='avatar'
              className='vlt-user-avatar'
            />
            {!collapsed && (
              <>
                <div className='vlt-user-info'>
                  <span className='vlt-user-name'>{displayName}</span>
                  <span className='vlt-user-handle'>@{user?.username || 'username'}</span>
                </div>
                <button
                  type='button'
                  className='vlt-user-expand'
                  tabIndex={-1}
                  aria-label='Account options'
                >
                  <CaretUpDown size={13} weight='bold' />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}