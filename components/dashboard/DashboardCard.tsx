'use client'

import React from 'react'
import Link from 'next/link'

type IconName = 'alert' | 'clock' | 'zap' | 'package' | 'trending' | 'inbox'

interface DashboardCardProps {
  title: string
  value: number | string
  icon: IconName
  href: string
  color: 'emerald' | 'blue' | 'amber' | 'purple' | 'red' | 'cyan'
  trend?: { value: number; direction: 'up' | 'down' }
  subtitle?: string
  isClickable?: boolean
}

const NavIcon = ({ d, size = 17 }: { d: string; size?: number }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const icons: Record<IconName, React.ReactNode> = {
  alert:   <NavIcon d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
  clock:   <NavIcon d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
  zap:     <NavIcon d="M13 10V3L4 14h7v7l9-11h-7z" />,
  package: <NavIcon d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
  trending:<NavIcon d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
  inbox:   <NavIcon d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />,
}

const accents: Record<string, string> = {
  red:     '#f87171',
  blue:    '#38bdf8',
  amber:   '#f59e0b',
  purple:  '#a78bfa',
  emerald: '#34d399',
  cyan:    '#00d9b8',
}

export function DashboardCard({
  title, value, icon, href, color, trend, subtitle, isClickable = true,
}: DashboardCardProps) {
  const accent = accents[color] ?? '#00d9b8'

  const handleEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isClickable) return
    e.currentTarget.style.borderColor = `${accent}35`
    e.currentTarget.style.boxShadow = `0 0 28px ${accent}0d`
  }
  const handleLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.borderColor = 'var(--border)'
    e.currentTarget.style.boxShadow = 'none'
  }

  const card = (
    <div
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '22px 24px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        cursor: isClickable ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        height: '100%',
      }}
    >
      {/* Accent bar at top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${accent} 0%, transparent 75%)`,
      }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, fontWeight: 600,
            letterSpacing: '0.1em', color: 'var(--text-dim)',
            textTransform: 'uppercase' as const,
          }}>
            {title}
          </p>
          {subtitle && (
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 3 }}>{subtitle}</p>
          )}
        </div>
        <span style={{ color: accent, opacity: 0.75 }}>{icons[icon]}</span>
      </div>

      {/* Value */}
      <div>
        <p style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 44, fontWeight: 700,
          color: 'var(--text-primary)', lineHeight: 1,
          letterSpacing: '-0.02em',
        }}>
          {value}
        </p>
        {trend && (
          <p style={{
            marginTop: 8, fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
            color: trend.direction === 'up' ? '#34d399' : '#f87171',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span>{trend.direction === 'up' ? '↑' : '↓'}</span>
            <span>{Math.abs(trend.value)}% vs semana anterior</span>
          </p>
        )}
      </div>
    </div>
  )

  if (!isClickable) return card

  return (
    <Link href={href} style={{ display: 'block', height: '100%' }}>
      {card}
    </Link>
  )
}
