'use client'

import { useState, useEffect } from 'react'

const COLLAPSED_COUNT = 4

const eventLabel: Record<string, string> = {
  CREATED: 'Chamado criado', STATUS_CHANGED: 'Status alterado',
  PRIORITY_CHANGED: 'Prioridade alterada', ASSIGNED: 'Técnico atribuído', UNASSIGNED: 'Técnico removido',
  COLLABORATOR_ADDED: 'Colaborador adicionado', COLLABORATOR_REMOVED: 'Colaborador removido',
  COMMENTED: 'Mensagem adicionada', NOTE_ADDED: 'Nota adicionada',
  SOLUTION_ADDED: 'Solução registrada', MOVEMENT_LINKED: 'Ordem de movimentação criada',
  MOVEMENT_COMPLETED: 'Ordem concluída', CLOSED: 'Chamado encerrado', REOPENED: 'Chamado reaberto',
}

const eventDotColor: Record<string, string> = {
  CREATED: '#a78bfa', ASSIGNED: '#38bdf8', CLOSED: '#34d399', REOPENED: '#fb923c',
  CANCELED: '#f87171', STATUS_CHANGED: '#f59e0b', COMMENTED: '#475569',
  NOTE_ADDED: '#fbbf24', SOLUTION_ADDED: '#34d399', COLLABORATOR_ADDED: '#8b5cf6',
  COLLABORATOR_REMOVED: '#f87171', MOVEMENT_LINKED: '#00d9b8',
}

interface Event {
  id: string
  type: string
  payload: unknown
  createdAt: string
  actor: { id: string; name: string } | null
}

interface Props {
  events: Event[]
  ticketId: string
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(date)
}

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000)
  if (s < 60) return 'agora'
  const m = Math.floor(s / 60); if (m < 60) return `${m}min`
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`
  return formatDate(date)
}

export default function TicketHistoryPanel({ events, ticketId }: Props) {
  const storageKey = `hd_history_expanded_${ticketId}`
  const [expanded, setExpanded] = useState(false)

  // Restore expanded state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved === 'true') setExpanded(true)
    } catch { /* ignore */ }
  }, [storageKey])

  function toggle() {
    const next = !expanded
    setExpanded(next)
    try { localStorage.setItem(storageKey, String(next)) } catch { /* ignore */ }
  }

  const hidden = events.length - COLLAPSED_COUNT
  const visible = expanded ? events : events.slice(0, COLLAPSED_COUNT)

  return (
    <div style={{
      background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10, padding: 16,
    }}>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#7a9bbc', letterSpacing: '0.06em', marginBottom: 16 }}>
        HISTÓRICO
      </p>
      {events.length === 0 ? (
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#2d4060' }}>Nenhum evento.</p>
      ) : (
        <>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 9, top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.05)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {visible.map(ev => {
                const dotC = eventDotColor[ev.type] ?? '#475569'
                const payload = ev.payload as Record<string, unknown> | null
                return (
                  <div key={ev.id} style={{ paddingLeft: 26, position: 'relative' }}>
                    <div style={{
                      position: 'absolute', left: 0, top: 2,
                      width: 18, height: 18, borderRadius: '50%',
                      background: '#0d1422', border: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: dotC }} />
                    </div>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: '#7a9bbc' }}>
                      {eventLabel[ev.type] ?? ev.type}
                    </p>
                    {payload?.description != null && (
                      <p style={{ fontSize: 11, color: '#4a6580', marginTop: 2 }}>{String(payload.description)}</p>
                    )}
                    {ev.actor && <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3d5068', marginTop: 2 }}>{ev.actor.name}</p>}
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#1e3048', marginTop: 2 }}>{timeAgo(new Date(ev.createdAt))}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {events.length > COLLAPSED_COUNT && (
            <button
              onClick={toggle}
              style={{
                marginTop: 14, width: '100%', padding: '6px 0',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 7, cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600,
                color: '#3d5068', transition: 'all 0.12s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#7a9bbc' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#3d5068' }}
            >
              {expanded ? (
                <>
                  <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                  Recolher
                </>
              ) : (
                <>
                  <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                  Ver mais ({hidden})
                </>
              )}
            </button>
          )}
        </>
      )}
    </div>
  )
}
