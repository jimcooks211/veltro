import { useEffect, useState } from 'react'

const styleTag = document.getElementById('dark-mode-styles') || (() => {
  const s = document.createElement('style')
  s.id = 'dark-mode-styles'
  s.textContent = `
    :root {
      --bg: #ffffff;
      --fg: #0A0F1E;
    }
    html.dark {
      --bg: #0A0F1E;
      --fg: #f5f5f5;
    }
    body {
      background-color: var(--bg);
      color: var(--fg);
      transition: background-color 0.3s, color 0.3s;
    }
  `
  document.head.appendChild(s)
  return s
})()

export default function SwitchMode() {
  const [isDark, setIsDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  useEffect(() => {
    const root = document.documentElement
    isDark ? root.classList.add('dark') : root.classList.remove('dark')
  }, [isDark])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => setIsDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return null  // 👈 renders nothing, logic still runs
}