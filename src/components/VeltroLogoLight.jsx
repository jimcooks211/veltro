// VeltroLogoLight.jsx
// Usage: <VeltroLogoLight width={240} tagline="Investment Platform" />
// Use on white or light backgrounds

import React from 'react'

export default function VeltroLogoLight({ width = 240, tagline = 'Investment Platform', style = {} }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '16px', ...style }}>

      {/* Icon Mark */}
      <svg
        width="52" height="52" viewBox="0 0 56 56" fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="lightMarkGrad" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#1A56FF" />
            <stop offset="100%" stopColor="#0A35CC" />
          </linearGradient>
        </defs>

        {/* Hex ring */}
        <path
          d="M28 3 L51 16 L51 40 L28 53 L5 40 L5 16 Z"
          stroke="url(#lightMarkGrad)" strokeWidth="1.2" fill="none" opacity="0.2"
        />

        {/* V shape */}
        <path
          d="M12 14 L28 42 L44 14"
          stroke="url(#lightMarkGrad)" strokeWidth="4"
          strokeLinecap="round" strokeLinejoin="round" fill="none"
        />

        {/* Gold slash */}
        <line x1="18" y1="28" x2="38" y2="28" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" />

        {/* Dots */}
        <circle cx="28" cy="28" r="2.5" fill="#1A56FF" />
        <circle cx="12" cy="14" r="2"   fill="#1A56FF" />
        <circle cx="44" cy="14" r="2"   fill="#1A56FF" />
      </svg>

      {/* Wordmark + Tagline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <span style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: '32px',
          letterSpacing: '1px',
          background: 'linear-gradient(135deg, #0A0F1E 0%, #2a3558 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1,
        }}>
          VELTRO
        </span>

        <span style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '10px',
          fontWeight: 400,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: '#7a8ab0',
        }}>
          {tagline}
        </span>
      </div>

    </div>
  )
}
