'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface Props {
  categories: { id: string; name: string; kind: string }[]
  locations:  string[]
}

export default function ConsumiveisFilters({ categories, locations }: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const sp       = useSearchParams()
  const [, start] = useTransition()
  const spRef = useRef(sp)
  useEffect(() => { spRef.current = sp }, [sp])

  const [search, setSearch] = useState(() => sp.get('q') ?? '')

  // Sync input when URL changes externally (e.g. stat card / tab click)
  const prevQ = useRef(sp.get('q') ?? '')
  const spQ   = sp.get('q') ?? ''
  if (spQ !== prevQ.current) {
    prevQ.current = spQ
    if (spQ !== search) setSearch(spQ)
  }

  // ── helper: update one param, keep the rest ──────────────────────────────
  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(spRef.current.toString())
    if (value) params.set(key, value); else params.delete(key)
    params.delete('page') // reset pagination
    const url = params.toString() ? `${pathname}?${params}` : pathname
    start(() => router.push(url))
  }

  // ── debounced text search ─────────────────────────────────────────────────
  useEffect(() => {
    if (search === (spRef.current.get('q') ?? '')) return
    const t = setTimeout(() => {
      const params = new URLSearchParams(spRef.current.toString())
      if (search) params.set('q', search); else params.delete('q')
      params.delete('page')
      const url = params.toString() ? `${pathname}?${params}` : pathname
      start(() => router.push(url))
    }, 320)
    return () => clearTimeout(t)
  }, [search]) // eslint-disable-line

  function clearAll() {
    const params = new URLSearchParams()
    // preserve kind/status tabs
    const kind   = spRef.current.get('kind')
    const status = spRef.current.get('status')
    if (kind)   params.set('kind',   kind)
    if (status) params.set('status', status)
    setSearch('')
    const url = params.toString() ? `${pathname}?${params}` : pathname
    start(() => router.push(url))
  }

  const currentCategoryId = sp.get('categoryId') ?? ''
  const currentLocation   = sp.get('location')   ?? ''
  const hasFilters        = !!(search || currentCategoryId || currentLocation)

  const inp: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 7, padding: '7px 10px', fontSize: 12, color: '#c8d6e5',
    outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
  }

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>

      {/* ── Busca ─────────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
        <svg
          style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#3d5068" strokeWidth={2}
        >
          <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome, tag, usuário, local, histórico…"
          style={{
            ...inp,
            padding: '7px 30px 7px 28px',
            width: '100%', boxSizing: 'border-box',
            background: search ? 'rgba(167,139,250,0.05)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${search ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.08)'}`,
            transition: 'border-color 0.15s',
          }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#3d5068', padding: 2, display: 'flex', alignItems: 'center',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Categoria ─────────────────────────────────────────────────────── */}
      <select
        value={currentCategoryId}
        onChange={e => setParam('categoryId', e.target.value || null)}
        style={{
          ...inp,
          background: currentCategoryId ? 'rgba(167,139,250,0.06)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${currentCategoryId ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.08)'}`,
          color: currentCategoryId ? '#a78bfa' : '#3d5068',
        }}
      >
        <option value="">Todas as categorias</option>
        {categories.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      {/* ── Local ─────────────────────────────────────────────────────────── */}
      {locations.length > 0 && (
        <select
          value={currentLocation}
          onChange={e => setParam('location', e.target.value || null)}
          style={{
            ...inp,
            background: currentLocation ? 'rgba(56,189,248,0.06)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${currentLocation ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.08)'}`,
            color: currentLocation ? '#38bdf8' : '#3d5068',
          }}
        >
          <option value="">Todos os locais</option>
          {locations.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      )}

      {/* ── Limpar ────────────────────────────────────────────────────────── */}
      {hasFilters && (
        <button
          onClick={clearAll}
          style={{
            padding: '7px 12px', borderRadius: 7, fontSize: 11, cursor: 'pointer',
            background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.18)',
            color: '#f87171', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Limpar
        </button>
      )}
    </div>
  )
}
