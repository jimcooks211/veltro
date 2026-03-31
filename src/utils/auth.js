// src/utils/auth.js

export function getToken(key) {
  return sessionStorage.getItem(key) || localStorage.getItem(key)
}

export function clearTokens() {
  ['accessToken', 'refreshToken', 'userId'].forEach(k => {
    localStorage.removeItem(k)
    sessionStorage.removeItem(k)
  })
}

export function isLoggedIn() {
  return !!(localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken'))
}