import React, { useState, useEffect } from 'react'
import VeltroLogoDark from '../../components/VeltroDarkLogo'
import VeltroLogoLight from '../../components/VeltroLogoLight'

export default function BlogPost() {
  const [isDark, setIsDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => setIsDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (!el) return
    const offset = (3 / 100) * window.innerWidth
    const top = el.getBoundingClientRect().top + window.scrollY - offset - 80
    window.scrollTo({ top, behavior: 'smooth' })
  }

  const muted     = isDark ? 'rgba(174, 185, 214, 0.55)' : 'rgba(0, 0, 0, 0.45)'
  const fg        = isDark ? 'white' : '#080C1A'
  const border    = isDark ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(0,0,0,0.15)'
  const linkStyle = { color: muted, marginBottom: "5px", cursor: "pointer" }

  return (
    <div style={{ width: "95%", margin: "2rem auto 0", fontSize: "15px", padding: "0 5px", color: fg }}>

      <div>
        <div style={{ scale: ".9", transform: "translate(-6dvw, 0)" }}>
          {isDark ? <VeltroLogoDark /> : <VeltroLogoLight />}
        </div>
        <p style={{ margin: "20px 0" }}>
          The market has a winning side. Veltro puts you on it. Intelligence, precision, growth, and security built into every decision you make.
        </p>
      </div>

      <div>
        <p style={{ margin: "2rem 0 1rem", fontSize: "17px", fontWeight: "bold" }}>Sitemap</p>
        <p style={linkStyle} onClick={() => scrollTo('about')}>About Us</p>
        <p style={linkStyle} onClick={() => scrollTo('pricing')}>Pricing</p>
        <p style={linkStyle} onClick={() => scrollTo('services')}>Services</p>
        <p style={linkStyle} onClick={() => scrollTo('faq')}>FAQ</p>
        <p style={linkStyle} onClick={() => scrollTo('contact')}>Contact</p>
      </div>

      <div>
        <p style={{ margin: "2rem 0 1rem", fontSize: "17px", fontWeight: "bold" }}>Contact</p>
        <p style={{ color: muted, marginBottom: "5px" }}>New York, USA</p>
        <p style={{ color: muted, marginBottom: "5px" }}>hello@veltro.com</p>
        <p style={{ color: muted, marginBottom: "5px" }}>+1 (000) 000 0000</p>
      </div>

      <div style={{ borderTop: border, margin: "3rem 0 0", padding: "2rem 0", textAlign: "center" }}>
        <p style={{ color: muted, fontSize: "13px" }}>
          Built for every investor who refuses to settle for average. The edge is yours.
        </p>
        <p style={{ color: muted, marginTop: "10px", fontSize: "12px" }}>
          &copy; 2026 Veltro. All Rights Reserved.
        </p>
      </div>

    </div>
  )
}