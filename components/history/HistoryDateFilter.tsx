'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Calendar, X } from 'lucide-react'

interface Props {
  tab: string
  q?: string | null
  typeFilter?: string | null
  dateFrom?: string | null
  dateTo?: string | null
}

export default function HistoryDateFilter({ tab, q, typeFilter, dateFrom, dateTo }: Props) {
  const router   = useRouter()
  const pathname = usePathname()

  function push(from: string | null, to: string | null) {
    const params = new URLSearchParams()
    params.set('tab', tab)
    if (q)          params.set('q', q)
    if (typeFilter) params.set('type', typeFilter)
    if (from)       params.set('dateFrom', from)
    if (to)         params.set('dateTo',   to)
    router.push(`${pathname}?${params.toString()}`)
  }

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 7, padding: '6px 10px',
    color: '#c8d6e5', fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
    outline: 'none', cursor: 'pointer',
    colorScheme: 'dark',
  }

  const hasFilter = !!(dateFrom || dateTo)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      {/* Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <Calendar size={12} color="#3d5068" />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3d5068', whiteSpace: 'nowrap' }}>
          PERÍODO
        </span>
      </div>

      {/* De */}
      <input
        type="date"
        defaultValue={dateFrom ?? ''}
        max={dateTo ?? undefined}
        onChange={e => push(e.target.value || null, dateTo ?? null)}
        style={{ ...inputStyle, borderColor: dateFrom ? 'rgba(0,217,184,0.3)' : 'rgba(255,255,255,0.09)' }}
      />

      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060' }}>→</span>

      {/* Até */}
      <input
        type="date"
        defaultValue={dateTo ?? ''}
        min={dateFrom ?? undefined}
        onChange={e => push(dateFrom ?? null, e.target.value || null)}
        style={{ ...inputStyle, borderColor: dateTo ? 'rgba(0,217,184,0.3)' : 'rgba(255,255,255,0.09)' }}
      />

      {/* Clear */}
      {hasFilter && (
        <button
          onClick={() => push(null, null)}
          title="Limpar datas"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 26, height: 26, borderRadius: 6,
            background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
            color: '#f87171', cursor: 'pointer',
          }}
        >
          <X size={11} />
        </button>
      )}
    </div>
  )
}
