'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface TicketCardProps {
  id: string
  code: string
  title: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'DONE' | 'CANCELED'
  categoryName: string
  requesterName: string
  assigneeName?: string
  createdAt: Date
}

const priorityColors: Record<string, string> = {
  URGENT: '#f87171', HIGH: '#fb923c', MEDIUM: '#fbbf24', LOW: '#475569',
}
const priorityLabels: Record<string, string> = {
  URGENT: 'URGENTE', HIGH: 'ALTA', MEDIUM: 'MÉDIA', LOW: 'BAIXA',
}
const statusConfig: Record<string, { color: string; glow: string; label: string }> = {
  OPEN:        { color: '#38bdf8', glow: 'rgba(56,189,248,0.5)',   label: 'Aberto' },
  IN_PROGRESS: { color: '#f59e0b', glow: 'rgba(245,158,11,0.5)',   label: 'Em atendimento' },
  ON_HOLD:     { color: '#a78bfa', glow: 'rgba(167,139,250,0.4)',  label: 'Aguardando' },
  DONE:        { color: '#34d399', glow: 'rgba(52,211,153,0.4)',   label: 'Concluído' },
  CANCELED:    { color: '#475569', glow: 'transparent',            label: 'Cancelado' },
}

function shortCode(code: string) {
  return `#${parseInt(code.split('-').pop() ?? '0', 10)}`
}

export function TicketCardModern({
  id, code, title, priority, status,
  categoryName, requesterName, assigneeName, createdAt,
}: TicketCardProps) {
  const st  = statusConfig[status] ?? statusConfig.OPEN
  const bar = priorityColors[priority] ?? '#475569'
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: ptBR })

  return (
    <Link href={`/tickets/${id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        className="row-in"
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
          e.currentTarget.style.background  = '#111927'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
          e.currentTarget.style.background  = '#0d1422'
        }}
        style={{
          background: '#0d1422',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 8, overflow: 'hidden',
          transition: 'border-color 0.12s, background 0.12s',
          display: 'flex', flexDirection: 'column', flex: 1,
        }}
      >
        {/* Priority top bar */}
        <div style={{ height: 3, background: bar, flexShrink: 0 }} />

        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>

          {/* Code + Status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700,
                color: '#00d9b8',
              }}>
                {shortCode(code)}
              </span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600,
                color: bar, letterSpacing: '0.06em',
                background: `${bar}18`, border: `1px solid ${bar}30`,
                padding: '2px 6px', borderRadius: 4,
              }}>
                {priorityLabels[priority]}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
                background: st.color,
                boxShadow: st.glow !== 'transparent' ? `0 0 5px ${st.glow}` : 'none',
              }} />
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: st.color,
                whiteSpace: 'nowrap',
              }}>
                {st.label}
              </span>
            </div>
          </div>

          {/* Title */}
          <p style={{
            fontSize: 14, fontWeight: 600, color: '#cbd5e1', lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
          }}>
            {title}
          </p>

          {/* Category chip */}
          <span style={{
            alignSelf: 'flex-start',
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
            color: '#4a6580', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            padding: '2px 8px', borderRadius: 4,
          }}>
            {categoryName}
          </span>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 -16px' }} />

          {/* Footer: requester + assignee */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div>
              <p style={{
                fontSize: 11, color: '#2d4060',
                fontFamily: "'JetBrains Mono', monospace", marginBottom: 2,
              }}>
                SOLICITANTE
              </p>
              <p style={{ fontSize: 12, color: '#64748b' }}>{requesterName}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              {assigneeName ? (
                <>
                  <p style={{
                    fontSize: 11, color: '#2d4060',
                    fontFamily: "'JetBrains Mono', monospace", marginBottom: 2,
                  }}>
                    TÉCNICO
                  </p>
                  <p style={{ fontSize: 12, color: '#64748b' }}>{assigneeName}</p>
                </>
              ) : (
                <p style={{
                  fontSize: 11, color: '#f87171',
                  fontFamily: "'JetBrains Mono', monospace", opacity: 0.75,
                }}>
                  não atribuído
                </p>
              )}
            </div>
          </div>

          {/* Time */}
          <p style={{
            fontSize: 11, color: '#2d4060',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {timeAgo}
          </p>

        </div>
      </div>
    </Link>
  )
}
