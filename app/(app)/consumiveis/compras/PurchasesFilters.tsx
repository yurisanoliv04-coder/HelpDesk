'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useTransition, useState } from 'react'

const INPUT_STYLE: React.CSSProperties = {
  background: 'var(--bg-input)',
  border: '1px solid var(--border)',
  borderRadius: 7,
  padding: '7px 11px',
  fontSize: 12,
  color: 'var(--text-primary)',
  fontFamily: "'JetBrains Mono', monospace",
  outline: 'none',
  width: '100%',
  minWidth: 0,
}

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 9,
  fontWeight: 700,
  color: 'var(--text-dim)',
  letterSpacing: '0.08em',
  marginBottom: 5,
  display: 'block',
}

export default function PurchasesFilters({
  categories,
}: {
  categories: { id: string; name: string; kind: string }[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Local state — synced from URL on mount and when URL changes externally
  const [fields, setFields] = useState({
    q:          searchParams.get('q') ?? '',
    categoryId: searchParams.get('categoryId') ?? '',
    dateFrom:   searchParams.get('dateFrom') ?? '',
    dateTo:     searchParams.get('dateTo') ?? '',
    supplier:   searchParams.get('supplier') ?? '',
    minTotal:   searchParams.get('minTotal') ?? '',
    maxTotal:   searchParams.get('maxTotal') ?? '',
  })

  // Sync local state when URL changes (e.g. stat-card click clears filters)
  useEffect(() => {
    setFields({
      q:          searchParams.get('q') ?? '',
      categoryId: searchParams.get('categoryId') ?? '',
      dateFrom:   searchParams.get('dateFrom') ?? '',
      dateTo:     searchParams.get('dateTo') ?? '',
      supplier:   searchParams.get('supplier') ?? '',
      minTotal:   searchParams.get('minTotal') ?? '',
      maxTotal:   searchParams.get('maxTotal') ?? '',
    })
  }, [searchParams])

  const hasActiveFilters = Object.values(fields).some(v => v !== '')

  /** Push all current field values to the URL; always resets to page 1 */
  const pushToURL = useCallback((nextFields: typeof fields) => {
    const params = new URLSearchParams()
    // preserve status (controlled by stat cards, not this panel)
    const status = searchParams.get('status')
    if (status) params.set('status', status)
    // reset pagination when filters change
    Object.entries(nextFields).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }, [router, pathname, searchParams])

  /** Update a single field; debounce text fields, immediate for date/select */
  function updateField(key: keyof typeof fields, value: string, debounce = false) {
    const next = { ...fields, [key]: value }
    setFields(next)
    if (debounce) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => pushToURL(next), 400)
    } else {
      pushToURL(next)
    }
  }

  function clearAll() {
    const empty = { q: '', categoryId: '', dateFrom: '', dateTo: '', supplier: '', minTotal: '', maxTotal: '' }
    setFields(empty)
    const params = new URLSearchParams()
    const status = searchParams.get('status')
    if (status) params.set('status', status)
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  function focusStyle(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    e.currentTarget.style.borderColor = 'var(--accent-cyan)'
    e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-cyan-dim)'
  }
  function blurStyle(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    e.currentTarget.style.borderColor = 'var(--border)'
    e.currentTarget.style.boxShadow = 'none'
  }

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '16px 20px',
      opacity: isPending ? 0.7 : 1,
      transition: 'opacity 0.15s',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Funnel icon */}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
            FILTROS
          </span>
          {hasActiveFilters && (
            <span style={{
              background: 'var(--accent-cyan-dim)',
              border: '1px solid var(--accent-cyan)',
              borderRadius: 10,
              padding: '1px 8px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: 'var(--accent-cyan)',
              fontWeight: 700,
            }}>
              ATIVOS
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: 'var(--text-dim)',
              padding: '2px 6px',
              borderRadius: 4,
              transition: 'color 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f87171' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)' }}
          >
            ✕ Limpar filtros
          </button>
        )}
      </div>

      {/* Filter grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px 16px' }}>

        {/* Search — spans 2 columns */}
        <div style={{ gridColumn: 'span 2' }}>
          <label style={LABEL_STYLE}>BUSCA</label>
          <div style={{ position: 'relative' }}>
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="var(--text-dim)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            >
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Título, fornecedor ou Nº NF…"
              value={fields.q}
              style={{ ...INPUT_STYLE, paddingLeft: 30 }}
              onChange={e => updateField('q', e.target.value, true)}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label style={LABEL_STYLE}>CATEGORIA</label>
          <select
            value={fields.categoryId}
            onChange={e => updateField('categoryId', e.target.value)}
            style={INPUT_STYLE}
            onFocus={focusStyle}
            onBlur={blurStyle}
          >
            <option value="">Todas</option>
            <optgroup label="Acessórios">
              {categories.filter(c => c.kind === 'ACCESSORY').map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </optgroup>
            <optgroup label="Consumíveis">
              {categories.filter(c => c.kind === 'DISPOSABLE').map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </optgroup>
            <optgroup label="Equipamentos">
              {categories.filter(c => c.kind === 'EQUIPMENT').map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Supplier */}
        <div>
          <label style={LABEL_STYLE}>FORNECEDOR</label>
          <input
            type="text"
            placeholder="Nome do fornecedor…"
            value={fields.supplier}
            style={INPUT_STYLE}
            onChange={e => updateField('supplier', e.target.value, true)}
            onFocus={focusStyle}
            onBlur={blurStyle}
          />
        </div>

        {/* Date from */}
        <div>
          <label style={LABEL_STYLE}>DATA — INÍCIO</label>
          <input
            type="date"
            value={fields.dateFrom}
            style={INPUT_STYLE}
            onChange={e => updateField('dateFrom', e.target.value)}
            onFocus={focusStyle}
            onBlur={blurStyle}
          />
        </div>

        {/* Date to */}
        <div>
          <label style={LABEL_STYLE}>DATA — FIM</label>
          <input
            type="date"
            value={fields.dateTo}
            style={INPUT_STYLE}
            onChange={e => updateField('dateTo', e.target.value)}
            onFocus={focusStyle}
            onBlur={blurStyle}
          />
        </div>

        {/* Min total */}
        <div>
          <label style={LABEL_STYLE}>VALOR TOTAL — MÍN (R$)</label>
          <input
            type="number"
            min={0}
            step={0.01}
            placeholder="0,00"
            value={fields.minTotal}
            style={INPUT_STYLE}
            onChange={e => updateField('minTotal', e.target.value, true)}
            onFocus={focusStyle}
            onBlur={blurStyle}
          />
        </div>

        {/* Max total */}
        <div>
          <label style={LABEL_STYLE}>VALOR TOTAL — MÁX (R$)</label>
          <input
            type="number"
            min={0}
            step={0.01}
            placeholder="sem limite"
            value={fields.maxTotal}
            style={INPUT_STYLE}
            onChange={e => updateField('maxTotal', e.target.value, true)}
            onFocus={focusStyle}
            onBlur={blurStyle}
          />
        </div>

      </div>
    </div>
  )
}
