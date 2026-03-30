// src/services/notify.js - central helper to create notification records
import { db } from '../config.js'

/**
 * createNotification({ userId, type, title, message, meta? })
 * Inserts a row into the notifications table. Non-blocking - errors are logged, not thrown.
 */
export async function createNotification({ userId, type, title, message, meta = null }) {
  try {
    await db.execute(
      `INSERT INTO notifications (user_id, type, title, body, metadata)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, type, title, message, meta ? JSON.stringify(meta) : null]
    )
  } catch (err) {
    console.error('[notify] Failed to create notification:', err.message)
  }
}

/**
 * parseUA(uaString) - minimal browser/OS/device detection, no extra package needed.
 */
export function parseUA(ua = '') {
  // Handle empty or invalid user agents
  if (!ua || typeof ua !== 'string' || ua.length < 10) {
    return { browser: 'Unknown Browser', os: 'Unknown OS', device_type: 'unknown' }
  }

  let browser = 'Unknown Browser'
  let os = 'Unknown OS'
  let device = 'unknown'

  // Browser detection - more comprehensive
  const uaLower = ua.toLowerCase()
  if (uaLower.includes('edg/')) browser = 'Edge'
  else if (uaLower.includes('opr/') || uaLower.includes('opera')) browser = 'Opera'
  else if (uaLower.includes('chrome') && !uaLower.includes('edg/')) browser = 'Chrome'
  else if (uaLower.includes('firefox')) browser = 'Firefox'
  else if (uaLower.includes('safari') && !uaLower.includes('chrome')) browser = 'Safari'
  else if (uaLower.includes('trident') || uaLower.includes('msie')) browser = 'Internet Explorer'

  // OS detection - more comprehensive
  if (uaLower.includes('windows nt 10') || uaLower.includes('windows nt 11')) os = 'Windows 11/10'
  else if (uaLower.includes('windows nt')) os = 'Windows'
  else if (uaLower.includes('mac os x') || uaLower.includes('macos')) os = 'macOS'
  else if (uaLower.includes('android')) os = 'Android'
  else if (uaLower.includes('iphone') || uaLower.includes('ipad')) os = 'iOS'
  else if (uaLower.includes('linux')) os = 'Linux'
  else if (uaLower.includes('cros')) os = 'Chrome OS'

  // Device detection
  if (uaLower.includes('ipad')) device = 'tablet'
  else if (uaLower.includes('iphone') || (uaLower.includes('android') && uaLower.includes('mobile'))) device = 'mobile'
  else if (uaLower.includes('android')) device = 'tablet'
  else device = 'desktop'

  return { browser, os, device_type: device }
}

/**
 * geoLookup(ip) - resolves IP → { city, country, country_code }.
 * Uses ip-api.com (free, no key, 45 req/min).
 * Falls back to nulls on timeout or private IP.
 */
export async function geoLookup(ip) {
  const fallback = { city: null, country: null, country_code: null }
  if (!ip || ip === '127.0.0.1' || ip.startsWith('192.168') || ip.startsWith('10.') || ip === '::1') {
    return fallback
  }
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,country,countryCode`, {
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!res.ok) return fallback
    const data = await res.json()
    if (data.status !== 'success') return fallback
    return { city: data.city || null, country: data.country || null, country_code: data.countryCode || null }
  } catch {
    return fallback
  }
}
