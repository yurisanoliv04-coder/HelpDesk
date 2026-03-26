'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface Props {
  locations: string[]
  categories: { id: string; name: string }[]
  perfCounts: { BOM: number; INTERMEDIARIO: number; RUIM: number }
}

const PERF = [
  { key: null,           label: 'Todos',          color: null },
  { key: 'BOM',          label: 'Bom',            color: '#34d399' },
  { key: 'INTERMEDIARIO',label: 'Intermediário',   color: '#fbbf24' },
  { key: 'RUIM',         label: 'Ruim',            color: '#f87171' },
] as const

const SEL: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 8, fontSize: 12,
  outline: 'none', cursor: 'pointer',
  fontFamily: 'inherit', minWidth: 160,
}

export default function AssetsFilters({ locations, categories, perfCounts }: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const sp       = useSearchParams()
  const [, start] = useTransition()
  const spRef = useRef(sp)
  useEffect(() => { spRef.current = sp }, [sp])

  const [search, setSearch] = useState(() => sp.get('q') ?? '')

  // Sync input when URL changes externally (e.g. stat card click)
  const prevQ = useRef(sp.get('q') ?? '')
  const spQ = sp.get('q') ?? ''
  if (spQ !== prevQ.current) {
    prevQ.current = spQ
    if (spQ !== search) setSearch(spQ)
  }

  // Debounced push for text search
  useEffect(() => {
    if (search === (spRef.current.get('q') ?? '')) return
    const t = setTimeout(() => {
      const params = new URLSearchParams(spRef.current.toString())
      if (search) params.set('q', search); else params.delete('q')
      const url = params.toString() ? `${pathname}?${params}` : pathname
      start(() => router.push(url))
    }, 320)
    return () => clearTimeout(t)
  }, [search]) // eslint-disable-line

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(sp.toString())
    if (value) params.set(key, value); else params.delete(key)
    const url = params.toString() ? `${pathname}?${params}` : pathname
    start(() => router.push(url))
  }

  function clearAll() {
    setSearch('')
    start(() => router.push(pathname))
  }

  const currentPerf     = sp.get('performance')
  const currentLocation = sp.get('location') ?? ''
  const currentCategory = sp.get('categoryId') ?? ''
  const hasFilters      = !!(sp.get('q') || currentPerf || currentLocation || currentCategory || sp.get('status'))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* ── Row 1: search + location + category + clear ────────────────────── */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>

        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 200, maxWidth: 420 }}>
          <svg
            style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#3d5068" strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar ativo por nome..."
            style={{
              width: '100%', padding: '8px 12px 8px 32px', boxSizing: 'border-box',
              background: search ? 'rgba(0,217,184,0.04)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${search ? 'rgba(0,217,184,0.25)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 8, fontSize: 13, color: '#c8d6e5', outline: 'none',
              transition: 'border-color 0.15s',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#3d5068',
                padding: 2, display: 'flex', alignItems: 'center',
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Location */}
        <select
          value={currentLocation}
          onChange={e => setParam('location', e.target.value || null)}
          style={{
            ...SEL,
            background: currentLocation ? 'rgba(56,189,248,0.06)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${currentLocation ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.08)'}`,
            color: currentLocation ? '#38bdf8' : '#4a6580',
          }}
        >
          <option value="" style={{ background: '#0d1422', color: '#c8d6e5' }}>📍 Todos os locais</option>
          {locations.map(l => (
            <option key={l} value={l} style={{ background: '#0d1422', color: '#c8d6e5' }}>{l}</option>
          ))}
        </select>

        {/* Category */}
        <select
          value={currentCategory}
          onChange={e => setParam('categoryId', e.target.value || null)}
          style={{
            ...SEL,
            background: currentCategory ? 'rgba(167,139,250,0.06)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${currentCategory ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.08)'}`,
            color: currentCategory ? '#a78bfa' : '#4a6580',
          }}
        >
          <option value="" style={{ background: '#0d1422', color: '#c8d6e5' }}>🏷️ Todas as categorias</option>
          {categories.map(c => (
            <option key={c.id} value={c.id} style={{ background: '#0d1422', color: '#c8d6e5' }}>{c.name}</option>
          ))}
        </select>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={clearAll}
            style={{
              padding: '8px 13px', borderRadius: 8, fontSize: 11, cursor: 'pointer',
              background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.18)',
              color: '#f87171', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Limpar filtros
          </button>
        )}
      </div>

      {/* ── Row 2: performance chips ────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
          color: '#2d4060', letterSpacing: '0.08em', flexShrink: 0,
        }}>
          PERFORMANCE:
        </span>

        {PERF.map(p => {
          const isActive = currentPerf === p.key
          const count = p.key ? perfCounts[p.key] : null
          const rgb   = p.key === 'BOM' ? '52,211,153' : p.key === 'INTERMEDIARIO' ? '251,191,36' : p.key === 'RUIM' ? '248,113,113' : '255,255,255'

          return (
            <button
              key={p.key ?? 'all'}
              onClick={() => setParam('performance', p.key ?? null)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 11px', borderRadius: 6, cursor: 'pointer',
                background: isActive ? `rgba(${rgb},0.12)` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isActive ? (p.color ?? 'rgba(255,255,255,0.2)') : 'rgba(255,255,255,0.07)'}`,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10, fontWeight: isActive ? 700 : 500,
                color: isActive ? (p.color ?? '#e2eaf4') : '#3d5068',
                transition: 'all 0.12s',
              }}
            >
              {p.color && (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
              )}
              {p.label}
              {count !== null && (
                <span style={{
                  fontSize: 9, color: isActive ? (p.color ?? '#2d4060') : '#2d4060',
                  background: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: '1px 5px',
                }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
