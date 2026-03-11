'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Toast {
  id: string
  type: string
  title: string
  message: string
  sub?: string
  ticketId?: string
  accent: string   // cor de destaque (border + icon bg)
  iconColor: string
}

interface RealtimeToastProps {
  userId: string
}

// ─── Web Audio API ───────────────────────────────────────────
function playSound(variant: 'new_ticket' | 'message' | 'status' | 'assigned') {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()

    const note = (freq: number, start: number, dur: number, vol = 0.25) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start)
      gain.gain.setValueAtTime(vol, ctx.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + dur)
    }

    if (variant === 'new_ticket') {
      // Dois tons ascendentes — alerta de novo chamado
      note(660, 0,    0.18, 0.3)
      note(990, 0.18, 0.28, 0.3)
    } else if (variant === 'message') {
      // Tom suave único — nova mensagem
      note(880, 0, 0.25, 0.2)
    } else if (variant === 'assigned') {
      // Tom grave + agudo — atribuição
      note(440, 0,    0.12, 0.2)
      note(660, 0.13, 0.22, 0.2)
    } else {
      // status — tom neutro
      note(550, 0, 0.2, 0.15)
    }
  } catch {
    // AudioContext não disponível (ex: teste server-side)
  }
}

// ─── Ícones SVG ──────────────────────────────────────────────
const Icons: Record<string, React.ReactNode> = {
  ticket_created: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  ticket_assigned: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  ticket_assigned_to_you: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  ticket_message: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  ),
  ticket_internal_note: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  ticket_status_changed: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
}

// ─── Componente principal ─────────────────────────────────────
export default function RealtimeToast({ userId }: RealtimeToastProps) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [progress, setProgress] = useState<Record<string, number>>({})
  const router = useRouter()
  const counterRef = useRef(0)
  const timerRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({})

  useEffect(() => {
    const es = new EventSource('/api/realtime')

    es.onmessage = (ev) => {
      try {
        const event = JSON.parse(ev.data)
        const id = String(++counterRef.current)

        if (event.type === 'ticket_created') {
          const { ticketId, code, title, requesterName, categoryName, priority } = event.payload
          const priorityLabel: Record<string, string> = {
            URGENT: '🔴 URGENTE', HIGH: '🟠 Alta', MEDIUM: '🟡 Média', LOW: '⚪ Baixa',
          }
          push({
            id, type: event.type,
            title: 'Novo chamado aberto',
            message: `${code} — ${title}`,
            sub: `${requesterName} · ${categoryName} · ${priorityLabel[priority] ?? priority}`,
            ticketId,
            accent: '#22d3ee',
            iconColor: '#0e7490',
          })
          playSound('new_ticket')

        } else if (event.type === 'ticket_assigned') {
          const { ticketId, code, technicianName } = event.payload
          push({
            id, type: event.type,
            title: 'Chamado atribuído',
            message: `${code} → ${technicianName}`,
            ticketId,
            accent: '#60a5fa',
            iconColor: '#1d4ed8',
          })
          playSound('assigned')

        } else if (event.type === 'ticket_assigned_to_you') {
          const { ticketId, code, title } = event.payload
          push({
            id, type: event.type,
            title: 'Atribuído a você',
            message: `${code} — ${title}`,
            ticketId,
            accent: '#60a5fa',
            iconColor: '#1d4ed8',
          })
          playSound('assigned')

        } else if (event.type === 'ticket_message') {
          const { ticketId, code, authorName } = event.payload
          push({
            id, type: event.type,
            title: 'Nova mensagem',
            message: `${authorName} respondeu ao ${code}`,
            ticketId,
            accent: '#34d399',
            iconColor: '#065f46',
          })
          playSound('message')

        } else if (event.type === 'ticket_internal_note') {
          const { ticketId, code, authorName } = event.payload
          push({
            id, type: event.type,
            title: 'Nota interna',
            message: `${authorName} anotou em ${code}`,
            ticketId,
            accent: '#fbbf24',
            iconColor: '#78350f',
          })
          playSound('message')

        } else if (event.type === 'ticket_status_changed') {
          const { ticketId, code, newStatus } = event.payload
          const labels: Record<string, string> = {
            OPEN: 'Aberto', IN_PROGRESS: 'Em andamento',
            ON_HOLD: 'Aguardando', DONE: 'Concluído', CANCELED: 'Cancelado',
          }
          push({
            id, type: event.type,
            title: 'Status atualizado',
            message: `${code} → ${labels[newStatus] ?? newStatus}`,
            ticketId,
            accent: '#f97316',
            iconColor: '#7c2d12',
          })
          playSound('status')
        }
      } catch {
        // heartbeat ou parse error — ignorar
      }
    }

    es.onerror = () => { /* reconexão automática */ }
    return () => es.close()
  }, [userId])

  function push(toast: Toast) {
    setToasts((prev) => [...prev.slice(-4), toast])
    startProgress(toast.id)
  }

  function startProgress(id: string) {
    const duration = 7000
    const interval = 50
    let elapsed = 0

    setProgress((prev) => ({ ...prev, [id]: 100 }))

    timerRefs.current[id] = setInterval(() => {
      elapsed += interval
      const pct = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress((prev) => ({ ...prev, [id]: pct }))
      if (elapsed >= duration) {
        clearInterval(timerRefs.current[id])
        dismiss(id)
      }
    }, interval)
  }

  function dismiss(id: string) {
    clearInterval(timerRefs.current[id])
    delete timerRefs.current[id]
    setToasts((prev) => prev.filter((t) => t.id !== id))
    setProgress((prev) => { const n = { ...prev }; delete n[id]; return n })
  }

  function handleClick(toast: Toast) {
    if (toast.ticketId) {
      router.push(`/tickets/${toast.ticketId}`)
      router.refresh()
    }
    dismiss(toast.id)
  }

  if (toasts.length === 0) return null

  return (
    <>
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(110%) scale(0.96); }
          to   { opacity: 1; transform: translateX(0)   scale(1);    }
        }
      `}</style>

      <div style={{
        position: 'fixed', top: 20, right: 20,
        zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 10,
        width: 360,
        pointerEvents: 'none',
      }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => handleClick(toast)}
            style={{
              pointerEvents: 'auto',
              background: '#0d1826',
              border: `1px solid rgba(255,255,255,0.08)`,
              borderLeft: `3px solid ${toast.accent}`,
              borderRadius: 10,
              overflow: 'hidden',
              cursor: toast.ticketId ? 'pointer' : 'default',
              animation: 'toastSlideIn 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)`,
              transition: 'opacity 0.2s, transform 0.2s',
            }}
          >
            {/* Barra de progresso */}
            <div style={{ height: 2, background: 'rgba(255,255,255,0.05)' }}>
              <div style={{
                height: '100%',
                width: `${progress[toast.id] ?? 100}%`,
                background: toast.accent,
                transition: 'width 0.05s linear',
                borderRadius: 2,
              }} />
            </div>

            {/* Conteúdo */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px' }}>
              {/* Ícone */}
              <div style={{
                flexShrink: 0,
                width: 34, height: 34,
                borderRadius: 8,
                background: `${toast.accent}18`,
                border: `1px solid ${toast.accent}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: toast.accent,
              }}>
                {Icons[toast.type] ?? Icons.ticket_message}
              </div>

              {/* Texto */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11, fontWeight: 700,
                  color: '#e2eaf4',
                  lineHeight: '1.3',
                  margin: 0,
                }}>
                  {toast.title}
                </p>
                <p style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11, color: '#7a9bbc',
                  margin: '3px 0 0',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {toast.message}
                </p>
                {toast.sub && (
                  <p style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10, color: '#4a6580',
                    margin: '2px 0 0',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {toast.sub}
                  </p>
                )}
              </div>

              {/* Botão fechar */}
              <button
                onClick={(e) => { e.stopPropagation(); dismiss(toast.id) }}
                style={{
                  flexShrink: 0,
                  background: 'none', border: 'none',
                  color: '#3d5570', cursor: 'pointer',
                  padding: 2, lineHeight: 1,
                  marginTop: 1,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#7a9bbc')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#3d5570')}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
