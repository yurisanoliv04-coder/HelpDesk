'use client'

import { useState, useRef, useEffect } from 'react'

interface UserOption {
  id: string
  name: string
}

interface Props {
  users: UserOption[]
  value: string              // selected userId
  onChange: (id: string) => void
  placeholder?: string
}

export function UserSearchSelect({ users, value, onChange, placeholder = '— nenhum —' }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedUser = users.find(u => u.id === value)

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpen(false); setQuery('') }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const filtered = query.trim()
    ? users.filter(u => u.name.toLowerCase().includes(query.toLowerCase()))
    : users

  function handleOpen() {
    setOpen(true)
    setQuery('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function select(id: string) {
    onChange(id)
    setOpen(false)
    setQuery('')
  }

  const baseStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${open ? 'rgba(0,217,184,0.35)' : 'rgba(255,255,255,0.1)'}`,
    boxShadow: open ? '0 0 0 2px rgba(0,217,184,0.08)' : 'none',
    borderRadius: 8,
    padding: '9px 12px',
    fontSize: 13,
    color: '#c8d6e5',
    width: '100%',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    transition: 'border-color 0.1s, box-shadow 0.1s',
    userSelect: 'none',
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger */}
      {!open ? (
        <div style={baseStyle} onClick={handleOpen}>
          <span style={{ color: selectedUser ? '#c8d6e5' : '#2d4060', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedUser ? selectedUser.name : placeholder}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {selectedUser && (
              <button
                type="button"
                onClick={e => { e.stopPropagation(); onChange('') }}
                style={{
                  background: 'none', border: 'none', padding: '1px 4px',
                  cursor: 'pointer', color: '#3d5068', fontSize: 14, lineHeight: 1,
                  borderRadius: 4,
                }}
                title="Remover atribuição"
              >
                ×
              </button>
            )}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ color: '#3d5068', flexShrink: 0 }}>
              <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      ) : (
        // Search input (replaces trigger when open)
        <div style={{ ...baseStyle, cursor: 'text', padding: '0' }}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por nome..."
            style={{
              background: 'none', border: 'none', outline: 'none',
              width: '100%', padding: '9px 12px',
              fontSize: 13, color: '#c8d6e5', fontFamily: 'inherit',
            }}
          />
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ color: '#3d5068', flexShrink: 0, marginRight: 12 }}>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: '#0d1422',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          zIndex: 9000,
          maxHeight: 220,
          overflowY: 'auto',
          padding: '4px 0',
        }}>
          {/* Nenhum option */}
          <DropdownItem
            label="— nenhum —"
            isSelected={value === ''}
            isNone
            onSelect={() => select('')}
          />

          {filtered.length === 0 ? (
            <div style={{ padding: '10px 14px', fontSize: 12, color: '#3d5068', fontFamily: "'JetBrains Mono', monospace", fontStyle: 'italic' }}>
              Nenhum resultado para "{query}"
            </div>
          ) : (
            filtered.map(u => (
              <DropdownItem
                key={u.id}
                label={u.name}
                isSelected={value === u.id}
                onSelect={() => select(u.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

function DropdownItem({
  label, isSelected, isNone = false, onSelect,
}: {
  label: string
  isSelected: boolean
  isNone?: boolean
  onSelect: () => void
}) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onMouseDown={e => { e.preventDefault(); onSelect() }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '8px 14px',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 8,
        background: isSelected ? 'rgba(0,217,184,0.08)' : hover ? 'rgba(255,255,255,0.04)' : 'transparent',
        transition: 'background 0.08s',
      }}
    >
      {/* Avatar / indicator */}
      <div style={{
        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
        background: isSelected ? 'rgba(0,217,184,0.15)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${isSelected ? 'rgba(0,217,184,0.3)' : 'rgba(255,255,255,0.07)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 8, fontWeight: 700, color: isSelected ? '#00d9b8' : '#3d5068',
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        {isNone ? '—' : label.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
      </div>
      <span style={{
        fontSize: 13,
        color: isSelected ? '#00d9b8' : isNone ? '#3d5068' : '#c8d6e5',
        fontStyle: isNone ? 'italic' : 'normal',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
      {isSelected && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 'auto', flexShrink: 0 }}>
          <path d="M2 6l3 3 5-5" stroke="#00d9b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  )
}
