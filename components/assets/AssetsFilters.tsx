'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface Props {
  locations: string[]
  categories: { id: string; name: string }[]
  perfCounts: { BOM: number; INTERMEDIARIO: number; RUIM: number }
  hasHardwareFilters?: boolean
}

const PERF = [
  { key: null,            label: 'Todos',        color: null },
  { key: 'BOM',           label: 'Bom',          color: '#34d399' },
  { key: 'INTERMEDIARIO', label: 'Intermediário', color: '#fbbf24' },
  { key: 'RUIM',          label: 'Ruim',         color: '#f87171' },
] as const

type PerfKey = 'BOM' | 'INTERMEDIARIO' | 'RUIM'

const HW_QUALITY: { key: PerfKey; label: string; color: string; rgb: string }[] = [
  { key: 'BOM',          label: 'Bom',          color: '#34d399', rgb: '52,211,153'   },
  { key: 'INTERMEDIARIO',label: 'Intermediário', color: '#fbbf24', rgb: '251,191,36'  },
  { key: 'RUIM',         label: 'Ruim',         color: '#f87171', rgb: '248,113,113'  },
]

const STORAGE_OPTS = [
  { key: 'SSD_NVME', label: 'SSD NVMe', color: '#34d399', rgb: '52,211,153',   desc: 'Máximo desempenho' },
  { key: 'SSD_SATA', label: 'SSD SATA', color: '#fbbf24', rgb: '251,191,36',   desc: 'Bom para escritório' },
  { key: 'HDD',      label: 'HDD',      color: '#f87171', rgb: '248,113,113',  desc: 'Lento — gargalo' },
]

const CPU_BRAND_OPTS = [
  { key: 'INTEL', label: 'Intel', color: '#60a5fa', rgb: '96,165,250'    },
  { key: 'AMD',   label: 'AMD',   color: '#f87171', rgb: '248,113,113'   },
  { key: 'OTHER', label: 'Outro', color: '#94a3b8', rgb: '148,163,184'   },
]

const SEL: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 8, fontSize: 12,
  outline: 'none', cursor: 'pointer',
  fontFamily: 'inherit', minWidth: 160,
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
      color: '#2d4060', letterSpacing: '0.1em', flexShrink: 0, display: 'block',
      marginBottom: 7,
    }}>
      {children}
    </span>
  )
}

function QChip({
  label, color, rgb, active, onClick, desc,
}: {
  label: string; color: string; rgb: string; active: boolean; onClick: () => void; desc?: string
}) {
  return (
    <button
      onClick={onClick}
      title={desc}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
        background: active ? `rgba(${rgb},0.12)` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${active ? color : 'rgba(255,255,255,0.07)'}`,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10, fontWeight: active ? 700 : 500,
        color: active ? color : '#3d5068',
        transition: 'all 0.12s',
      }}
    >
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: color,
        opacity: active ? 1 : 0.35, flexShrink: 0,
      }} />
      {label}
    </button>
  )
}

export default function AssetsFilters({ locations, categories, perfCounts, hasHardwareFilters }: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const sp       = useSearchParams()
  const [, start] = useTransition()
  const spRef = useRef(sp)
  useEffect(() => { spRef.current = sp }, [sp])

  const [search, setSearch] = useState(() => sp.get('q') ?? '')
  const [showAdvanced, setShowAdvanced] = useState(() => hasHardwareFilters ?? false)

  // Sync input when URL changes externally
  const prevQ = useRef(sp.get('q') ?? '')
  const spQ = sp.get('q') ?? ''
  if (spQ !== prevQ.current) {
    prevQ.current = spQ
    if (spQ !== search) setSearch(spQ)
  }

  // Keep panel open when hardware filters are active
  useEffect(() => {
    if (hasHardwareFilters) setShowAdvanced(true)
  }, [hasHardwareFilters])

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
    params.delete('page')
    const url = params.toString() ? `${pathname}?${params}` : pathname
    start(() => router.push(url))
  }

  function toggleParam(key: string, value: string) {
    const current = sp.get(key)
    setParam(key, current === value ? null : value)
  }

  function clearAll() {
    setSearch('')
    start(() => router.push(pathname))
  }

  const currentPerf     = sp.get('performance')
  const currentLocation = sp.get('location') ?? ''
  const currentCategory = sp.get('categoryId') ?? ''
  const currentRam      = sp.get('ramQ') ?? ''
  const currentStorage  = sp.get('storageQ') ?? ''
  const currentCpuGen   = sp.get('cpuGenQ') ?? ''
  const currentCpuBrand = sp.get('cpuBrandQ') ?? ''

  const hwActive = !!(currentRam || currentStorage || currentCpuGen || currentCpuBrand)
  const hasFilters = !!(sp.get('q') || currentPerf || currentLocation || currentCategory || sp.get('status') || hwActive)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* ── Row 1: search + location + category + advanced toggle + clear ── */}
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
            placeholder="Buscar por nome, tag, usuário, local, histórico…"
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

        {/* Advanced toggle */}
        <button
          onClick={() => setShowAdvanced(v => !v)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 13px', borderRadius: 8, cursor: 'pointer',
            background: (showAdvanced || hwActive) ? 'rgba(0,217,184,0.06)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${(showAdvanced || hwActive) ? 'rgba(0,217,184,0.3)' : 'rgba(255,255,255,0.08)'}`,
            color: (showAdvanced || hwActive) ? '#00d9b8' : '#4a6580',
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600,
            transition: 'all 0.12s', flexShrink: 0,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M3 6h18M7 12h10M11 18h2" />
          </svg>
          Hardware
          {hwActive && (
            <span style={{
              background: '#00d9b8', color: '#000', borderRadius: '50%',
              width: 14, height: 14, fontSize: 8, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {[currentRam, currentStorage, currentCpuGen, currentCpuBrand].filter(Boolean).length}
            </span>
          )}
          <svg
            width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
            style={{ transform: showAdvanced ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
          </svg>
        </button>

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
          const rgb = p.key === 'BOM' ? '52,211,153' : p.key === 'INTERMEDIARIO' ? '251,191,36' : p.key === 'RUIM' ? '248,113,113' : '255,255,255'

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

      {/* ── Row 3: Advanced hardware filters panel ──────────────────────────── */}
      {showAdvanced && (
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10,
          padding: '14px 18px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px 24px',
        }}>

          {/* RAM */}
          <div>
            <SectionLabel>MEMÓRIA RAM</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {HW_QUALITY.map(q => (
                <QChip
                  key={q.key}
                  label={q.key === 'BOM' ? 'Boa (≥16 GB)' : q.key === 'INTERMEDIARIO' ? 'Média (8–15 GB)' : 'Ruim (<8 GB)'}
                  color={q.color} rgb={q.rgb}
                  active={currentRam === q.key}
                  onClick={() => toggleParam('ramQ', q.key)}
                />
              ))}
            </div>
          </div>

          {/* Armazenamento */}
          <div>
            <SectionLabel>ARMAZENAMENTO</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {STORAGE_OPTS.map(s => (
                <QChip
                  key={s.key}
                  label={s.label} desc={s.desc}
                  color={s.color} rgb={s.rgb}
                  active={currentStorage === s.key}
                  onClick={() => toggleParam('storageQ', s.key)}
                />
              ))}
            </div>
          </div>

          {/* CPU Geração */}
          <div>
            <SectionLabel>GERAÇÃO DO CPU</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {HW_QUALITY.map(q => (
                <QChip
                  key={q.key}
                  label={q.key === 'BOM' ? 'Boa (≥10ª gen)' : q.key === 'INTERMEDIARIO' ? 'Média (6ª–9ª)' : 'Ruim (≤5ª)'}
                  color={q.color} rgb={q.rgb}
                  active={currentCpuGen === q.key}
                  onClick={() => toggleParam('cpuGenQ', q.key)}
                />
              ))}
            </div>
          </div>

          {/* CPU Marca */}
          <div>
            <SectionLabel>MARCA DO CPU</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {CPU_BRAND_OPTS.map(b => (
                <QChip
                  key={b.key}
                  label={b.label}
                  color={b.color} rgb={b.rgb}
                  active={currentCpuBrand === b.key}
                  onClick={() => toggleParam('cpuBrandQ', b.key)}
                />
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  )
}
