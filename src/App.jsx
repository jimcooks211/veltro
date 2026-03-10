import { BrowserRouter, Routes, Route } from 'react-router-dom'

/* ── Public ── */
import Landing from './pages/public/Landing'

/* ── Legal ── */
import Terms          from './pages/legal/Terms'
import Privacy        from './pages/legal/Privacy'
import RiskDisclosure from './pages/legal/RiskDisclosure'

/* ── Auth ── */
import Onboarding     from './pages/auth/Onboarding'
import ResetPassword  from './pages/auth/ResetPassword'
import CreateProfile  from './pages/auth/Profile'
import Onboard        from './pages/auth/Onboard'

/* ── Dashboard shell ── */
import Dashboard from './pages/app/Dashboard'

/* ── Dashboard child pages (render inside Outlet) ── */
import DashboardHome  from './pages/app/DashboardHome'
import Markets        from './pages/app/Markets'
import MarketDetail   from './pages/app/MarketDetail'
import Trade          from './pages/app/Trade'
import Portfolio      from './pages/app/Portfolio'
import Watchlist      from './pages/app/Watchlist'
import ProfilePage    from './pages/app/ProfilePage'
import Orders         from './pages/app/Orders'
import Transactions   from './pages/app/Transactions'
import News           from './pages/app/News'
import Support        from './pages/app/Support'

/* ── Wallet (inside dashboard) ── */
import Wallet   from './pages/wallet/Wallet'
import Deposit  from './pages/wallet/Deposit'
import Withdraw from './pages/wallet/Withdraw'

/* ── Settings (inside dashboard) ── */
import Settings      from './pages/settings/Settings'
import Security      from './pages/settings/Security'
import KYC           from './pages/settings/KYC'
import Notifications from './pages/settings/Notifications'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Public ── */}
        <Route path='/' element={<Landing />} />

        {/* ── Legal ── */}
        <Route path='/legal/terms'            element={<Terms />} />
        <Route path='/legal/privacy'          element={<Privacy />} />
        <Route path='/legal/risk-disclosure'  element={<RiskDisclosure />} />

        {/* ── Auth ── */}
        <Route path='/onboarding'             element={<Onboarding />} />
        <Route path='/auth'                   element={<Onboarding />} />
        <Route path='/reset-password'         element={<ResetPassword />} />
        <Route path='/createprofile/:userId'  element={<CreateProfile />} />
        <Route path='/veltrotour'             element={<Onboard />} />

        {/* ── Dashboard shell — all sub-pages render via <Outlet /> ─────────
            Every URL is scoped to the user:  /dashboard/:userId/...
            The Outlet in Dashboard.jsx renders the matching child here.
        ─────────────────────────────────────────────────────────────────── */}
        <Route path='/dashboard/:userId' element={<Dashboard />}>

          {/* index — shown at exactly /dashboard/:userId */}
          <Route index element={<DashboardHome />} />

          {/* Overview */}
          <Route path='markets'              element={<Markets />} />
          <Route path='markets/:symbol'      element={<MarketDetail />} />
          <Route path='news'                 element={<News />} />

          {/* Apps */}
          <Route path='trade'                element={<Trade />} />
          <Route path='orders'               element={<Orders />} />
          <Route path='portfolio'            element={<Portfolio />} />
          <Route path='watchlist'            element={<Watchlist />} />
          <Route path='transactions'         element={<Transactions />} />
          <Route path='profile'              element={<ProfilePage />} />
          <Route path='support'              element={<Support />} />

          {/* Wallet */}
          <Route path='wallet'               element={<Wallet />} />
          <Route path='wallet/deposit'       element={<Deposit />} />
          <Route path='wallet/withdraw'      element={<Withdraw />} />

          {/* Settings */}
          <Route path='settings'             element={<Settings />} />
          <Route path='settings/security'    element={<Security />} />
          <Route path='settings/kyc'         element={<KYC />} />
          <Route path='settings/notifications' element={<Notifications />} />

        </Route>

      </Routes>
    </BrowserRouter>
  )
}