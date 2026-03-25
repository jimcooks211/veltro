// src/utils/api.js -- Central API helper with auth headers + token refresh
const BASE = import.meta.env.VITE_API_URL || 'https://veltroinvestment.up.railway.app'

function getToken() {
  return sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken')
}
function getRefreshToken() {
  return sessionStorage.getItem('refreshToken') || localStorage.getItem('refreshToken')
}

async function refreshAccessToken() {
  const rt = getRefreshToken()
  if (!rt) throw new Error('No refresh token')
  const res = await fetch(`${BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: rt }),
  })
  if (!res.ok) throw new Error('Refresh failed')
  const { accessToken } = await res.json()
  if (sessionStorage.getItem('accessToken')) sessionStorage.setItem('accessToken', accessToken)
  else localStorage.setItem('accessToken', accessToken)
  return accessToken
}

export async function apiFetch(path, options = {}) {
  let token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }
  let res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (res.status === 401) {
    try {
      token = await refreshAccessToken()
      headers.Authorization = `Bearer ${token}`
      res = await fetch(`${BASE}${path}`, { ...options, headers })
    } catch { /* Refresh failed -- caller handles */ }
  }
  return res
}

export async function apiGet(path) {
  const res = await apiFetch(path)
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`)
  return res.json()
}

export async function apiPost(path, body) {
  const res = await apiFetch(path, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(err.message || `POST ${path} failed`)
  }
  return res.json()
}

export async function apiPut(path, body) {
  const res = await apiFetch(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(err.message || `PUT ${path} failed`)
  }
  return res.json()
}

export async function apiPatch(path, body) {
  const res = await apiFetch(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(err.message || `PATCH ${path} failed`)
  }
  return res.json()
}

export async function apiDelete(path, body) {
  const res = await apiFetch(path, {
    method: 'DELETE',
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(err.message || `DELETE ${path} failed`)
  }
  return res.json()
}

// Build query string from an object, omitting null/undefined values
export function buildQuery(params = {}) {
  const q = Object.entries(params)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')
  return q ? `?${q}` : ''
}
