// src/hooks/useCheckpoint.js
// Drop this in every authenticated page's top-level component.
// Fires once on mount, saves current path to the DB so login
// can resume exactly where the user left off.

import { useEffect } from 'react'

export function useCheckpoint() {
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    // fire-and-forget — never block the UI
    fetch(`${import.meta.env.VITE_API_URL}/api/auth/checkpoint`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ page: window.location.pathname }),
    }).catch(() => {})
  }, [])
}