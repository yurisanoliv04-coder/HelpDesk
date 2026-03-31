'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const STORAGE_FILTER_ORDER  = 'hd_tickets_filter_order'
const COOKIE_FILTER         = 'hd_tickets_filter' // written client-side, read server-side

// ── Icons ────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
  </svg>
)
const XIcon = () => (
  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)
const DragIcon = () => (
  <svg width="8" height="12" fill="currentColor" viewBox="0 0 8 12">
    <circle cx="2" cy="2"  r="1.2" /><circle cx="6" cy="2"  r="1.2" />
    <circle cx="2" cy="6"  r="1.2" /><circle cx="6" cy="6"  r="1.2" />
    <circle cx="2" cy="10" r="1.2" /><circle cx="6" cy="10" r="1.2" />
  </svg>
)

// ── Filter definitions ───────────────────────────────────────
type FilterKey = 'filter' | 'priority'
interface FilterDef { label: string; filterKey: FilterKey; filterVal: string }

const ALL_FILTERS: FilterDef[] = [
  { label: 'TODOS',           filterKey: 'filter',   filterVal: 'all'         },
  { label: 'ABERTOS',         filterKey: 'filter',   filterVal: 'open'        },
  { label: 'NÃO ATRIBUÍDOS',  filterKey: 'filter',   filterVal: 'unassigned'  },
  { label: 'NÃO RESOLVIDOS',  filterKey: 'filter',   filterVal: 'unresolved'  },
  { label: 'URGENTES',        filterKey: 'priority', filterVal: 'URGENT'      },
  { label: 'EM ATENDIMENTO',  filterKey: 'filter',   filterVal: 'in_progress' },
  { label: 'CONCLUÍDOS',      filterKey: 'filter',   filterVal: 'done'        },
]
const DEFAULT_ORDER = ALL_FILTERS.map(f => f.filterVal)

function loadOrder(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_FILTER_ORDER)
    if (!raw) return DEFAULT_ORDER
    const parsed: string[] = JSON.parse(raw)
    if (
      parsed.length === DEFAULT_ORDER.length &&
      DEFAULT_ORDER.every(v => parsed.includes(v))
    ) return parsed
  } catch {}
  return DEFAULT_ORDER
}

// ── Component ────────────────────────────────────────────────
interface Props { totalCount: number }

export default function TicketsToolbar({ totalCount }: Props) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  const spFilter   = searchParams.get('filter')
  const spPriority = searchParams.get('priority') ?? ''
  const spQ        = searchParams.get('q')        ?? ''

  const [searchValue, setSearchValue] = useState(spQ)
  const [filterOrder, setFilterOrder] = useState<string[]>(DEFAULT_ORDER)

  // Drag-and-drop state
  const [draggedVal, setDraggedVal]   = useState<string | null>(null)
  const [dragOverVal, setDragOverVal] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── On mount: load persisted filter order ────────────────
  useEffect(() => {
    setFilterOrder(loadOrder())
  }, [])

  // ── Sync search when URL changes ─────────────────────────
  useEffect(() => { setSearchValue(spQ) }, [spQ])

  // ── Debounced search push ─────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (searchValue.trim()) params.set('q', searchValue.trim())
      else params.delete('q')
      router.push(`${pathname}?${params.toString()}`)
    }, 380)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchValue]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── URL builder ───────────────────────────────────────────
  const buildUrl = (overrides: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === null || v === '') params.delete(k)
      else params.set(k, v)
    })
    return `${pathname}?${params.toString()}`
  }

  const isFilterActive = (filterKey: string, filterVal: string) => {
    if (filterKey === 'priority') return spPriority === filterVal && !spFilter
    if (filterVal === 'all') return (!spFilter || spFilter === 'all') && !spPriority
    return spFilter === filterVal && !spPriority
  }

  const filterHref = (filterKey: string, filterVal: string) =>
    filterKey === 'priority'
      ? buildUrl({ priority: filterVal, filter: null })
      : buildUrl({ filter: filterVal === 'all' ? null : filterVal, priority: null })

  const saveFilter = (filterKey: string, filterVal: string) => {
    const val = filterKey === 'priority' ? `priority:${filterVal}` : filterVal
    try {
      // Cookie lido pelo servidor no próximo acesso — persiste após F5 e troca de aba
      const maxAge = 60 * 60 * 24 * 365
      document.cookie = `${COOKIE_FILTER}=${encodeURIComponent(val)}; path=/; max-age=${maxAge}; SameSite=Lax`
    } catch {}
  }

  // ── Drag-and-drop ─────────────────────────────────────────
  const handleDragStart = (val: string) => setDraggedVal(val)

  const handleDragOver = (e: React.DragEvent, val: string) => {
    e.preventDefault()
    if (val !== dragOverVal) setDragOverVal(val)
  }

  const handleDrop = (targetVal: string) => {
    if (!draggedVal || draggedVal === targetVal) {
      setDraggedVal(null); setDragOverVal(null); return
    }
    const next = [...filterOrder]
    const from = next.indexOf(draggedVal)
    const to   = next.indexOf(targetVal)
    next.splice(from, 1)
    next.splice(to, 0, draggedVal)
    setFilterOrder(next)
    try { localStorage.setItem(STORAGE_FILTER_ORDER, JSON.stringify(next)) } catch {}
    setDraggedVal(null)
    setDragOverVal(null)
  }

  const handleDragEnd = () => { setDraggedVal(null); setDragOverVal(null) }

  const orderedFilters = filterOrder
    .map(val => ALL_FILTERS.find(f => f.filterVal === val))
    .filter(Boolean) as FilterDef[]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Search bar ── */}
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
          color: '#2d4060', pointerEvents: 'none',
        }}>
          <SearchIcon />
        </div>
        <input
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
          placeholder="Pesquisar por título, código, solicitante, técnico, categoria..."
          style={{
            width: '100%', boxSizing: 'border-box',
            background: '#0d1422',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 8,
            padding: '10px 40px 10px 38px',
            color: '#e2eaf4', fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            outline: 'none', transition: 'border-color 0.15s',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,217,184,0.35)')}
          onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
        />
        {searchValue && (
          <button
            onClick={() => setSearchValue('')}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#3d5068', padding: 2, display: 'flex', alignItems: 'center',
            }}
          >
            <XIcon />
          </button>
        )}
      </div>

      {/* ── Filter chips ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {orderedFilters.map(f => {
          const active    = isFilterActive(f.filterKey, f.filterVal)
          const isDragged = draggedVal === f.filterVal
          const isOver    = dragOverVal === f.filterVal && draggedVal !== f.filterVal

          return (
            <div
              key={f.filterVal}
              draggable
              onDragStart={() => handleDragStart(f.filterVal)}
              onDragOver={e => handleDragOver(e, f.filterVal)}
              onDrop={() => handleDrop(f.filterVal)}
              onDragEnd={handleDragEnd}
              style={{
                opacity: isDragged ? 0.35 : 1,
                transition: 'opacity 0.15s',
                outline: isOver ? '2px solid rgba(0,217,184,0.5)' : '2px solid transparent',
                borderRadius: 6,
              }}
            >
              <Link
                href={filterHref(f.filterKey, f.filterVal)}
                className="filter-chip"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  userSelect: 'none',
                  ...(active ? {
                    borderColor: 'rgba(0,217,184,0.5)',
                    color: '#00d9b8',
                    background: 'rgba(0,217,184,0.08)',
                  } : {}),
                }}
                onClick={e => {
                  if (draggedVal) { e.preventDefault(); return }
                  saveFilter(f.filterKey, f.filterVal)
                }}
              >
                <span style={{ color: '#2d4060', opacity: 0.7, lineHeight: 0 }}>
                  <DragIcon />
                </span>
                {f.label}
              </Link>
            </div>
          )
        })}
      </div>

      {/* Count */}
      <p style={{ fontSize: 13, color: '#3d5068', marginTop: -4 }}>
        {totalCount} {totalCount === 1 ? 'chamado encontrado' : 'chamados encontrados'}
        {spQ && (
          <span style={{ color: '#2d4060' }}>
            {' '}para <span style={{ color: '#7a9bbc' }}>"{spQ}"</span>
          </span>
        )}
      </p>
    </div>
  )
}
