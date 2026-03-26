import { getRecentTickets } from '@/lib/dashboard/fetchers/tickets'
import Link from 'next/link'

const statusDot: Record<string, string> = {
  OPEN: '#38bdf8', IN_PROGRESS: '#f59e0b',
  ON_HOLD: '#a78bfa', DONE: '#34d399', CANCELED: '#475569',
}
const statusLabel: Record<string, string> = {
  OPEN: 'Aberto', IN_PROGRESS: 'Em atendimento',
  ON_HOLD: 'Aguardando', DONE: 'Concluído', CANCELED: 'Cancelado',
}
const priorityBar: Record<string, string> = {
  LOW: '#334155', MEDIUM: '#fbbf24', HIGH: '#fb923c', URGENT: '#f87171',
}
const priorityLabel: Record<string, string> = {
  LOW: 'BAIXA', MEDIUM: 'MÉDIA', HIGH: 'ALTA', URGENT: 'URGENTE',
}

function shortCode(code: string) {
  return `#${parseInt(code.split('-').pop() ?? '0', 10)}`
}

function ageInfo(createdAt: Date) {
  const hours = (Date.now() - createdAt.getTime()) / 3_600_000
  const fmt = (h: number) =>
    h < 1 ? `${Math.round(h * 60)}m` : h < 48 ? `${Math.round(h)}h` : `${Math.round(h / 24)}d`
  if (hours < 4)  return { color: '#38bdf8', label: fmt(hours) }
  if (hours < 48) return { color: '#f59e0b', label: fmt(hours) }
  return { color: '#f87171', label: fmt(hours) }
}

export default async function RecentTicketsWidget() {
  const tickets = await getRecentTickets()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p className="section-label">── CHAMADOS RECENTES</p>
        <Link href="/tickets" style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-cyan)', opacity: 0.75, textDecoration: 'none' }}>
          ver todos →
        </Link>
      </div>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', flex: 1 }}>
        {tickets.length === 0 ? (
          <p style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
            Nenhum chamado aberto no momento.
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '7px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg-input)' }}>
              <div style={{ width: 3, flexShrink: 0 }} />
              <p className="section-label" style={{ width: 76, flexShrink: 0 }}>#ID</p>
              <p className="section-label" style={{ flex: 1 }}>TÍTULO</p>
              <p className="section-label" style={{ width: 130, flexShrink: 0 }}>TÉCNICO</p>
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                <p className="section-label" style={{ width: 44, textAlign: 'center' }}>TEMPO</p>
                <div style={{ width: 7 }} />
                <p className="section-label" style={{ width: 112 }}>STATUS</p>
              </div>
            </div>
            <div>
              {tickets.map((ticket, i) => {
                const age = ageInfo(ticket.createdAt)
                return (
                  <Link
                    key={ticket.id}
                    href={`/tickets/${ticket.id}`}
                    className="hover-row"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '11px 18px',
                      borderBottom: i < tickets.length - 1 ? '1px solid var(--border)' : 'none',
                      textDecoration: 'none',
                    }}
                  >
                    <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: priorityBar[ticket.priority], flexShrink: 0 }} />
                    <div style={{ width: 76, flexShrink: 0 }}>
                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: 'var(--accent-cyan)' }}>{shortCode(ticket.code)}</p>
                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: priorityBar[ticket.priority], opacity: 0.9, marginTop: 1, letterSpacing: '0.05em' }}>
                        {priorityLabel[ticket.priority]}
                      </p>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.title}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 3 }}>
                        {ticket.requester.name} · {ticket.category.name}
                      </p>
                    </div>
                    <div style={{ flexShrink: 0, width: 130 }}>
                      {ticket.assignee ? (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.assignee.name}</p>
                      ) : (
                        <p style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#f87171', opacity: 0.7 }}>não atribuído</p>
                      )}
                    </div>
                    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        background: age.color + '18', color: age.color,
                        border: `1px solid ${age.color}35`,
                        display: 'inline-block', width: 44, textAlign: 'center',
                        padding: '2px 0', borderRadius: 20,
                        fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                      }}>{age.label}</span>
                      <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: statusDot[ticket.status], boxShadow: `0 0 5px ${statusDot[ticket.status]}90`, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: statusDot[ticket.status], fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap', width: 112, display: 'inline-block' }}>
                        {statusLabel[ticket.status]}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
