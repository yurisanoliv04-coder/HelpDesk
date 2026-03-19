'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Search, X, Loader2 } from 'lucide-react'

interface Props {
  initialValue: string
  tab: string
  typeFilter?: string
  dateFrom?: string | null
  dateTo?: string | null
}

export default function HistorySearchInput({ initialValue, tab, typeFilter, dateFrom, dateTo }: Props) {
  const [value, setValue] = useState(initialValue)
  const router    = useRouter()
  const pathname  = usePathname()
  const [isPending, startTransition] = useTransition()

  // Debounced URL push
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams()
      params.set('tab', tab)
      if (typeFilter) params.set('type', typeFilter)
      if (value.trim()) params.set('q', value.trim())
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo)   params.set('dateTo',   dateTo)
      // reset to page 1 on new search
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    }, 350)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const placeholders: Record<string, string> = {
    ativos:    'Buscar por ativo, tipo, movimentação, executado por, chamado...',
    pessoas:   'Buscar por pessoa, departamento, evento, executado por...',
    historico: 'Buscar em todo o histórico...',
  }

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1, maxWidth: 460 }}>
      <span style={{ position: 'absolute', left: 11, color: isPending ? '#00d9b8' : '#2d4060', pointerEvents: 'none', display: 'flex' }}>
        {isPending ? <Loader2 size={13} style={{ animation: 'spin 0.6s linear infinite' }} /> : <Search size={13} />}
      </span>
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholders[tab] ?? 'Buscar...'}
        style={{
          width: '100%',
          padding: '8px 32px 8px 32px',
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${isPending || value ? 'rgba(0,217,184,0.25)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 8,
          color: '#c8d6e5',
          fontSize: 12,
          fontFamily: "'JetBrains Mono', monospace",
          outline: 'none',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,217,184,0.4)' }}
        onBlur={e => { if (!value) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
      />
      {value && (
        <button
          onClick={() => setValue('')}
          style={{
            position: 'absolute', right: 9,
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#3d5068', padding: 2, display: 'flex', alignItems: 'center',
          }}
        >
          <X size={12} />
        </button>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
