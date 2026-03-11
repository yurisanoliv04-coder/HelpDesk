'use client'

import React from 'react'

// Deterministic color based on name hash
const COLORS = [
  { bg: 'rgba(0,217,184,0.18)',   text: '#00d9b8' },   // cyan
  { bg: 'rgba(56,189,248,0.18)',  text: '#38bdf8' },   // blue
  { bg: 'rgba(167,139,250,0.18)', text: '#a78bfa' },   // purple
  { bg: 'rgba(245,158,11,0.18)',  text: '#f59e0b' },   // amber
  { bg: 'rgba(248,113,113,0.18)', text: '#f87171' },   // red
  { bg: 'rgba(52,211,153,0.18)',  text: '#34d399' },   // green
  { bg: 'rgba(129,140,248,0.18)', text: '#818cf8' },   // indigo
  { bg: 'rgba(251,146,60,0.18)',  text: '#fb923c' },   // orange
]

function hashName(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  }
  return hash
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

interface AvatarInitialsProps {
  name: string
  size?: number
  fontSize?: number
}

export function AvatarInitials({ name, size = 32, fontSize }: AvatarInitialsProps) {
  const color = COLORS[hashName(name) % COLORS.length]
  const initials = getInitials(name)
  const fz = fontSize ?? Math.round(size * 0.38)

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: color.bg,
        border: `1px solid ${color.text}35`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: fz,
          fontWeight: 600,
          color: color.text,
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        {initials}
      </span>
    </div>
  )
}
