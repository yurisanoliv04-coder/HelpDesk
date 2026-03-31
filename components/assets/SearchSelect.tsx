'use client'

import { useState, useRef, useEffect } from 'react'

export interface SelectOption {
  value: string
  label: string
  icon?: string | null
  sub?: string | null
}

interface Props {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  clearable?: boolean
}

export function SearchSelect({
  options, value, onChange,
  placeholder = '— selecione —',
  required,
  clearable = false,
}: Props) {
  const [open,  setOpen]  = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLInputElement>(null)

  const selectedOpt = options.find(o => o.value === value)

  // Fecha ao clicar fora
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false); setQuery('')
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  // Fecha com Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpen(false); setQuery('') }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const filtered = query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  function handleOpen() {
    setOpen(true); setQuery('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function select(val: string) {
    onChange(val); setOpen(false); setQuery('')
  }

  const baseStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${open ? 'rgba(0,217,184,0.35)' : 'rgba(255,255,255,0.1)'}`,
    boxShadow: open ? '0 0 0 2px rgba(0,217,184,0.08)' : 'none',
    borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#c8d6e5',
    width: '100%', outline: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box' as const, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    transition: 'border-color 0.1s, box-shadow 0.1s', userSelect: 'none' as const,
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>

      {/* ── Trigger ───────────────────────────────────────────────────────────── */}
      {!open ? (
        <div style={baseStyle} onClick={handleOpen}>
          <span style={{
            color: selectedOpt ? '#c8d6e5' : '#2d4060',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {selectedOpt ? selectedOpt.label : placeholder}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {selectedOpt && clearable && (
              <button
                type="button"
                onClick={e => { e.stopPropagation(); onChange('') }}
                style={{ background: 'none', border: 'none', padding: '1px 4px', cursor: 'pointer', color: '#3d5068', fontSize: 14, lineHeight: 1, borderRadius: 4 }}
              >×</button>
            )}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ color: '#3d5068', flexShrink: 0 }}>
              <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      ) : (
        /* ── Busca ──────────────────────────────────────────────────────────── */
        <div style={{ ...baseStyle, cursor: 'text', padding: 0 }}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar..."
            style={{
              background: 'none', border: 'none', outline: 'none',
              width: '100%', padding: '9px 12px', fontSize: 13,
              color: '#c8d6e5', fontFamily: 'inherit',
            }}
          />
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ color: '#3d5068', flexShrink: 0, marginRight: 12 }}>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* ── Dropdown ────────────────────────────────────────────────────────── */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: '#0d1422', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          zIndex: 9000, maxHeight: 240, overflowY: 'auto', padding: '4px 0',
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '10px 14px', fontSize: 12, color: '#3d5068', fontFamily: "'JetBrains Mono', monospace", fontStyle: 'italic' }}>
              Nenhum resultado para &quot;{query}&quot;
            </div>
          ) : (
            filtered.map(opt => (
              <OptionItem
                key={opt.value}
                opt={opt}
                isSelected={value === opt.value}
                onSelect={() => select(opt.value)}
              />
            ))
          )}
        </div>
      )}

      {required && (
        <input type="text" required value={value} onChange={() => {}} tabIndex={-1}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }} />
      )}
    </div>
  )
}

function OptionItem({
  opt, isSelected, onSelect,
}: { opt: SelectOption; isSelected: boolean; onSelect: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onMouseDown={e => { e.preventDefault(); onSelect() }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '9px 14px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 10,
        background: isSelected ? 'rgba(0,217,184,0.08)' : hover ? 'rgba(255,255,255,0.04)' : 'transparent',
        transition: 'background 0.08s',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          fontSize: 13, display: 'block',
          color: isSelected ? '#00d9b8' : '#c8d6e5',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {opt.label}
        </span>
        {opt.sub && (
          <span style={{ fontSize: 10, color: '#3d5068', display: 'block' }}>{opt.sub}</span>
        )}
      </div>
      {isSelected && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
          <path d="M2 6l3 3 5-5" stroke="#00d9b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  )
}
