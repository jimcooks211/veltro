// src/utils/auth.js

export function getToken(key) {
  return localStorage.getItem(key) || sessionStorage.getItem(key)
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