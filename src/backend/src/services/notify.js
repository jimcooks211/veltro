// src/services/notify.js — central helper to create notification records
import { db } from '../config.js'

/**
 * createNotification({ userId, type, title, message, meta? })
 * Inserts a row into the notifications table. Non-blocking — errors are logged, not thrown.
 */
export async function createNotification({ userId, type, title, message, meta = null }) {
  try {
    await db.execute(
      `INSERT INTO notifications (user_id, type, title, message, meta)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, type, title, message, meta ? JSON.stringify(meta) : null]
    )
  } catch (err) {
    console.error('[notify] Failed to create notification:', err.message)
  }
}

/**
 * parseUA(uaString) — minimal browser/OS/device detection, no extra package needed.
 */
export function parseUA(ua = '') {
  let browser = 'Unknown Browser'
  let os      = 'Unknown OS'
  let device  = 'unknown'

  // Browser
  if      (/Edg\//.test(ua))     browser = 'Edge'
  else if (/OPR\//.test(ua))     browser = 'Opera'
  else if (/Chrome\//.test(ua))  browser = 'Chrome'
  else if (/Firefox\//.test(ua)) browser = 'Firefox'
  else if (/Safari\//.test(ua))  browser = 'Safari'

  // Append version
  const verMatch = ua.match(new RegExp(`${browser.replace('Chrome','Chrome|CriOS')}[/ ]([\\d.]+)`))
  if (verMatch) browser += ` ${verMatch[1].split('.')[0]}`

  // OS
  if      (/Windows NT 10/.test(ua)) os = 'Windows 11/10'
  else if (/Windows NT/.test(ua))    os = 'Windows'
  else if (/Mac OS X/.test(ua))      os = 'macOS'
  else if (/Android/.test(ua))       os = 'Android'
  else if (/iPhone|iPad/.test(ua))   os = 'iOS'
  else if (/Linux/.test(ua))         os = 'Linux'

  // Device
  if      (/iPad/.test(ua))                device = 'tablet'
  else if (/iPhone|Android.*Mobile/.test(ua)) device = 'mobile'
  else if (/Android/.test(ua))             device = 'tablet'
  else                                     device = 'desktop'

  return { browser, os, device_type: device }
}

/**
 * geoLookup(ip) — resolves IP → { city, country, country_code }.
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
