'use client'

import React from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface TicketRowModernProps {
  id: string
  code: string
  title: string
  requesterName: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'DONE' | 'CANCELED'
  assigneeId?: string
  assigneeName?: string
  createdAt: Date
  unreadCount?: number
}

function shortCode(code: string): string {
  return `#${parseInt(code.split('-').pop() ?? '0', 10)}`
}

const priorityBar: Record<string, string> = {
  URGENT: '#f87171',
  HIGH:   '#fb923c',
  MEDIUM: '#fbbf24',
  LOW:    '#334155',
}

const priorityLabel: Record<string, string> = {
  URGENT: 'URGENTE',
  HIGH:   'ALTA',
  MEDIUM: 'MÉDIA',
  LOW:    'BAIXA',
}

const statusConfig: Record<string, { color: string; glow: string; label: string }> = {
  OPEN:        { color: '#38bdf8', glow: 'rgba(56,189,248,0.5)',   label: 'Aberto' },
  IN_PROGRESS: { color: '#f59e0b', glow: 'rgba(245,158,11,0.5)',   label: 'Em atendimento' },
  ON_HOLD:     { color: '#a78bfa', glow: 'rgba(167,139,250,0.4)',  label: 'Aguardando' },
  DONE:        { color: '#34d399', glow: 'rgba(52,211,153,0.4)',   label: 'Concluído' },
  CANCELED:    { color: '#475569', glow: 'transparent',            label: 'Cancelado' },
}

export function TicketRowModern({
  id, code, title, requesterName, priority, status,
  assigneeId, assigneeName, createdAt, unreadCount = 0,
}: TicketRowModernProps) {
  const dot = statusConfig[status]
  const bar = priorityBar[priority]

  const timeAgo = formatDistanceToNow(new Date(createdAt), {
    addSuffix: true, locale: ptBR,
  })

  const handleEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.borderColor = 'var(--border-hover)'
    e.currentTarget.style.background  = 'var(--bg-hover)'
  }
  const handleLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.borderColor = 'var(--border)'
    e.currentTarget.style.background  = 'var(--bg-surface)'
  }

  return (
    <Link href={`/tickets/${id}`} style={{ display: 'block', textDecoration: 'none' }}>
      <div
        className="row-in"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          overflow: 'hidden',
          display: 'flex',
          transition: 'border-color 0.12s, background 0.12s',
        }}
      >
        {/* Priority side bar */}
        <div style={{ width: 3, background: bar, flexShrink: 0 }} />

        {/* Main content */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center',
          gap: 20, padding: '15px 20px', minWidth: 0,
        }}>

          {/* Code + priority */}
          <div style={{ flexShrink: 0, width: 76 }}>
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13, fontWeight: 600,
              color: 'var(--accent-cyan)', letterSpacing: '0.02em',
            }}>
              {shortCode(code)}
            </p>
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11, color: bar, opacity: 0.85,
              marginTop: 3, letterSpacing: '0.05em',
            }}>
              {priorityLabel[priority]}
            </p>
          </div>

          {/* Title + requester */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 14, fontWeight: 500,
              color: 'var(--text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {title}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
              {requesterName} · {timeAgo}
            </p>
          </div>

          {/* Assignee */}
          <div className="hidden md:block" style={{ flexShrink: 0, width: 140 }}>
            {assigneeName ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{assigneeName}</p>
            ) : (
              <p style={{
                fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
                color: '#f87171', opacity: 0.75,
              }}>
                não atribuído
              </p>
            )}
          </div>

          {/* Status dot + label */}
          <div style={{ flexShrink: 0, width: 120, display: 'flex', alignItems: 'center', gap: 8 }}>
            {unreadCount > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 20, height: 20, borderRadius: '50%',
                background: 'var(--accent-cyan)', color: 'var(--bg-base)',
                fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            <span style={{
              display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
              background: dot.color,
              boxShadow: dot.glow !== 'transparent' ? `0 0 6px ${dot.glow}` : 'none',
              flexShrink: 0,
            }} />
            <span style={{
              fontSize: 12, color: dot.color,
              fontFamily: "'JetBrains Mono', monospace",
              whiteSpace: 'nowrap',
            }}>
              {dot.label}
            </span>
          </div>

        </div>
      </div>
    </Link>
  )
}
