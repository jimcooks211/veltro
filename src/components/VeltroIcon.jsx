// VeltroIcon.jsx
// Usage:
//   <VeltroIcon />                    dark (default)
//   <VeltroIcon variant="blue" />
//   <VeltroIcon variant="light" />
//   <VeltroIcon variant="gold" />
//   <VeltroIcon size={40} />

import React from 'react'

const VARIANTS = {
  dark: {
    markColors: ['#00D4FF', '#1A56FF', '#7B2FFF'],
    slashColor: '#C9A84C',
    dotColor:   '#00D4FF',
    ringOpacity: 0.3,
    bg:          '#0d1428',
    border:      'rgba(255,255,255,0.08)',
    glow:        'drop-shadow(0 0 10px rgba(0,212,255,0.4))',
  },
  blue: {
    markColors: ['#ffffff'],
    slashColor: '#FFD980',
    dotColor:   '#ffffff',
    ringOpacity: 0.25,
    bg:          'linear-gradient(135deg, #1A56FF, #0A35CC)',
    border:      'transparent',
    glow:        'none',
  },
  light: {
    markColors: ['#1A56FF', '#0A35CC'],
    slashColor: '#C9A84C',
    dotColor:   '#1A56FF',
    ringOpacity: 0.2,
    bg:          '#F0F4FF',
    border:      'rgba(0,0,0,0.08)',
    glow:        'none',
  },
  gold: {
    markColors: ['#ffffff'],
    slashColor: 'rgba(255,255,255,0.7)',
    dotColor:   '#ffffff',
    ringOpacity: 0.3,
    bg:          'linear-gradient(135deg, #C9A84C, #8a6820)',
    border:      'transparent',
    glow:        'none',
  },
}

export default function VeltroIcon({ variant = 'dark', size = 56, rounded = 16, style = {} }) {
  const v = VARIANTS[variant] || VARIANTS.dark
  const iconSize = size * 0.65
  const gradId = `iconGrad_${variant}`

  return (
    <div
      style={{
        width:           size,
        height:          size,
        borderRadius:    rounded,
        background:      v.bg,
        border:          `1px solid ${v.border}`,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        flexShrink:      0,
        ...style,
      }}
    >
      <svg
        width={iconSize} height={iconSize}
        viewBox="0 0 56 56" fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: v.glow }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            {v.markColors.map((c, i) => (
              <stop
                key={i}
                offset={`${v.markColors.length === 1 ? 0 : (i / (v.markColors.length - 1)) * 100}%`}
                stopColor={c}
              />
            ))}
          </linearGradient>
        </defs>

        {/* Hex ring */}
        <path
          d="M28 3 L51 16 L51 40 L28 53 L5 40 L5 16 Z"
          stroke={`url(#${gradId})`} strokeWidth="1.2" fill="none" opacity={v.ringOpacity}
        />

        {/* V shape */}
        <path
          d="M12 14 L28 42 L44 14"
          stroke={`url(#${gradId})`} strokeWidth="4.5"
          strokeLinecap="round" strokeLinejoin="round" fill="none"
        />

        {/* Slash */}
        <line x1="18" y1="28" x2="38" y2="28" stroke={v.slashColor} strokeWidth="2.5" strokeLinecap="round" />

        {/* Center dot */}
        <circle cx="28" cy="28" r="2.5" fill={v.dotColor} />
      </svg>
    </div>
  )
}
