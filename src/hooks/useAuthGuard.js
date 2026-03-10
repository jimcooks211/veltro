import { useEffect } from 'react'
import { isLoggedIn } from '../utils/auth'

const AUTH_ROUTES = ['/onboarding', '/createprofile', '/verify', '/reset-password', '/forgot-password']

export function useAuthGuard() {
  useEffect(() => {
    const current = window.location.pathname
    const isAuthPage = AUTH_ROUTES.some(r => current.startsWith(r))
    
    if (!isAuthPage && !isLoggedIn()) {
      window.location.href = '/onboarding'
    }
  }, [])
}