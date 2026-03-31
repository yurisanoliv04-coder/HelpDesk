'use client'

import { useState, useRef, useEffect } from 'react'
import { useTheme, THEMES, ThemeName } from '@/lib/context/theme'

interface ThemePickerProps {
  /** Se true, renderiza inline (no fluxo da página). Se false (default), usa position: fixed top-right. */
  inline?: boolean
}

export default function ThemePicker({ inline = false }: ThemePickerProps) {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = THEMES.find(t => t.id === theme) ?? THEMES[0]

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div
      ref={ref}
      style={inline
        ? { position: 'relative', flexShrink: 0 }
        : { position: 'fixed', top: 14, right: 16, zIndex: 1000 }
      }
    >
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Alterar tema"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '7px 13px 7px 10px',
          borderRadius: 8,
          border: '1px solid var(--border-hover)',
          background: 'var(--bg-elevated)',
          cursor: 'pointer',
          transition: 'border-color 0.12s, background 0.12s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--accent-cyan)'
          e.currentTarget.style.background = 'var(--bg-hover)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border-hover)'
          e.currentTarget.style.background = 'var(--bg-elevated)'
        }}
      >
        {/* Accent swatch */}
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: current.accent,
            boxShadow: `0 0 6px ${current.accent}80`,
            flexShrink: 0,
            display: 'inline-block',
          }}
        />
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: 'var(--text-muted)',
            letterSpacing: '0.04em',
            lineHeight: 1,
          }}
        >
          {current.label}
        </span>
        {/* chevron */}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          style={{
            color: 'var(--text-dim)',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s',
            flexShrink: 0,
          }}
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            width: 200,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-hover)',
            borderRadius: 10,
            boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
            padding: '6px',
            zIndex: 1001,
          }}
        >
          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: 'var(--text-dim)',
              letterSpacing: '0.10em',
              padding: '4px 8px 6px',
            }}
          >
            TEMA DA INTERFACE
          </p>
          {THEMES.map(t => {
            const isActive = t.id === theme
            return (
              <button
                key={t.id}
                onClick={() => { setTheme(t.id as ThemeName); setOpen(false) }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 6,
                  border: 'none',
                  background: isActive ? 'var(--bg-hover)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                  textAlign: 'left',
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.background = 'var(--bg-surface)'
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.background = 'transparent'
                }}
              >
                {/* Mini preview: bg + accent */}
                <div
                  style={{
                    width: 28,
                    height: 18,
                    borderRadius: 4,
                    background: t.bg,
                    border: isActive ? `1.5px solid ${t.accent}` : '1px solid rgba(255,255,255,0.12)',
                    position: 'relative',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 3,
                      left: 4,
                      right: 4,
                      height: 3,
                      borderRadius: 2,
                      background: t.accent,
                      opacity: 0.85,
                    }}
                  />
                </div>

                <span
                  style={{
                    flex: 1,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {t.label}
                </span>

                {isActive && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M2 6L5 9L10 3" stroke={t.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
