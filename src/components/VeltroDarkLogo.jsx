// VeltroLogoDark.jsx
// Usage: <VeltroLogoDark width={240} tagline="Investment Platform" />

import React from 'react'

export default function VeltroLogoDark({ width = 240, tagline = 'Investment Platform', style = {} }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '16px', ...style }}>

      {/* Icon Mark */}
      <svg
        width="65" height="65" viewBox="0 0 56 56" fill="#F0F4FF"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 0 10px #F0F4FF' }}
      >
        <defs>
          <linearGradient id="darkMarkGrad" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#F0F4FF" />
            <stop offset="50%"  stopColor="#F0F4FF" />
            <stop offset="100%" stopColor="#F0F4FF" />
          </linearGradient>
        </defs>

        {/* Hex ring */}
        <path
          d="M28 3 L51 16 L51 40 L28 53 L5 40 L5 16 Z"
          stroke="url(#darkMarkGrad)" strokeWidth="1.2" fill="#0A0F1E" opacity="0.3"
        />

        {/* V shape */}
        <path
          d="M12 14 L28 42 L44 14"
          stroke="url(#darkMarkGrad)" strokeWidth="4"
          strokeLinecap="round" strokeLinejoin="round" fill="none"
        />

        {/* Gold slash */}
        <line x1="18" y1="28" x2="38" y2="28" stroke="#FFB800" strokeWidth="2" strokeLinecap="round" />

        {/* Dots */}
        <circle cx="28" cy="28" r="2.5" fill="#F0F4FF" />
        <circle cx="12" cy="14" r="2"   fill="#F0F4FF" />
        <circle cx="44" cy="14" r="2"   fill="#F0F4FF" />
      </svg>

      {/* Wordmark + Tagline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <span style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: '28px',
          letterSpacing: '1px',
          background: '#F0F4FF',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1,
        }}>
          VELTRO
        </span>

        <span style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '9px',
          fontWeight: 400,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: '#A8B2CC',
        }}>
          {tagline}
        </span>
      </div>

    </div>
  )
}
