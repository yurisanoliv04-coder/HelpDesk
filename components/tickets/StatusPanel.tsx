'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUSES = [
  { value: 'OPEN',        label: 'Aberto',         color: '#38bdf8', bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.25)' },
  { value: 'IN_PROGRESS', label: 'Em atendimento',  color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },
  { value: 'ON_HOLD',     label: 'Aguardando',      color: '#a78bfa', bg: 'rgba(167,139,250,0.08)',border: 'rgba(167,139,250,0.25)' },
  { value: 'DONE',        label: 'Concluído',       color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.25)' },
  { value: 'CANCELED',    label: 'Cancelado',       color: '#94a3b8', bg: 'rgba(148,163,184,0.06)',border: 'rgba(148,163,184,0.18)' },
]

interface StatusPanelProps {
  ticketId: string
  currentStatus: string
}

export default function StatusPanel({ ticketId, currentStatus }: StatusPanelProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  async function handleStatusChange(newStatus: string) {
    if (newStatus === currentStatus) return
    setLoading(newStatus)
    setFeedback(null)
    try {
      const res = await fetch(`/api/tickets/${ticketId}/status`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (data.ok) { setFeedback({ type: 'success', msg: 'Status atualizado!' }); router.refresh() }
      else setFeedback({ type: 'error', msg: data.error?.message ?? 'Erro ao atualizar status' })
    } catch { setFeedback({ type: 'error', msg: 'Erro de conexão' }) }
    finally { setLoading(null) }
  }

  return (
    <div style={{
      background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#34d399" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#7a9bbc', letterSpacing: '0.06em' }}>
          ALTERAR STATUS
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {STATUSES.map((s) => {
          const isCurrent = s.value === currentStatus
          const isLoading = loading === s.value

          return (
            <button
              key={s.value}
              onClick={() => handleStatusChange(s.value)}
              disabled={isCurrent || !!loading}
              style={{
                width: '100%', padding: '8px 12px',
                background: isCurrent ? s.bg : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isCurrent ? s.border : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 7, color: isCurrent ? s.color : '#4a6580',
                fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: isCurrent ? 700 : 500,
                cursor: isCurrent || !!loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'all 0.15s',
                opacity: loading && !isCurrent ? 0.4 : 1,
              }}
            >
              <span>{s.label}</span>
              {isCurrent && (
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {isLoading && (
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }}/>
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" style={{ opacity: 0.75 }}/>
                </svg>
              )}
            </button>
          )
        })}
      </div>

      {feedback && (
        <p style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textAlign: 'center',
          color: feedback.type === 'success' ? '#34d399' : '#f87171',
        }}>
          {feedback.msg}
        </p>
      )}
    </div>
  )
}
