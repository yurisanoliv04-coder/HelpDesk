import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import AssignPanel from '@/components/tickets/AssignPanel'
import StatusPanel from '@/components/tickets/StatusPanel'
import MessageComposer from '@/components/tickets/MessageComposer'
import SolutionPanel from '@/components/tickets/SolutionPanel'
import TicketAssetActionsPanel from '@/components/tickets/TicketAssetActionsPanel'
import TicketHistoryPanel from '@/components/tickets/TicketHistoryPanel'

// ── config maps ───────────────────────────────────────────────
const statusConfig: Record<string, { color: string; bg: string; border: string; label: string; glow: string }> = {
  OPEN:        { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',   border: 'rgba(56,189,248,0.35)',   label: 'Aberto',          glow: '#38bdf840' },
  IN_PROGRESS: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.35)',   label: 'Em atendimento',  glow: '#f59e0b40' },
  ON_HOLD:     { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.35)',  label: 'Aguardando',      glow: '#a78bfa40' },
  DONE:        { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.35)',   label: 'Concluído',       glow: '#34d39940' },
  CANCELED:    { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)',  border: 'rgba(148,163,184,0.25)',  label: 'Cancelado',       glow: '#94a3b820' },
}
const priorityConfig: Record<string, { color: string; label: string }> = {
  LOW:    { color: '#475569', label: 'Baixa' },
  MEDIUM: { color: '#fbbf24', label: 'Média' },
  HIGH:   { color: '#fb923c', label: 'Alta' },
  URGENT: { color: '#f87171', label: 'Urgente' },
}

const visibilityLabel: Record<string, { label: string; color: string; icon: string }> = {
  PUBLIC:      { label: 'Público',         color: '#475569', icon: '🌐' },
  TECHNICIANS: { label: 'Técnicos',        color: '#38bdf8', icon: '🔒' },
  AUTHOR:      { label: 'Somente autor',   color: '#a78bfa', icon: '👤' },
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
function shortCode(code: string) { return `#${parseInt(code.split('-').pop() ?? '0', 10)}` }
function getInitials(name: string) { return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() }
const AVATAR_COLORS = ['#0ea5e9','#8b5cf6','#f59e0b','#10b981','#f43f5e','#6366f1','#14b8a6','#f97316']
function avatarColor(name: string) {
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const { id } = await params

  const [ticket, technicians, allUsers] = await Promise.all([
    prisma.ticket.findUnique({
      where: { id },
      include: {
        category: true,
        requester: { select: { id: true, name: true, email: true } },
        openedBy:  { select: { id: true, name: true } },
        assignee:  { select: { id: true, name: true } },
        department:{ select: { name: true } },
        collaborators: { include: { user: { select: { id: true, name: true, role: true } } }, orderBy: { addedAt: 'asc' } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { id: true, name: true, role: true } } },
        },
        events: {
          orderBy: { createdAt: 'asc' },
          include: { actor: { select: { id: true, name: true } } },
        },
        solutions: {
          orderBy: { createdAt: 'desc' },
          include: { createdBy: { select: { name: true } } },
        },
        movementOrders: {
          include: { items: { include: { asset: { select: { tag: true, name: true } } } } },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ['TECNICO', 'ADMIN'] }, active: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  if (!ticket) notFound()

  const isTI       = ['TECNICO', 'ADMIN', 'AUXILIAR_TI'].includes(session?.user.role ?? '')
  const isAuxiliar = session?.user.role === 'AUXILIAR_TI'
  const canEdit    = ['TECNICO', 'ADMIN'].includes(session?.user.role ?? '')
  const isOwner = ticket.requesterId === session?.user.id || ticket.openedById === session?.user.id
  if (!isOwner && !isTI) redirect('/tickets')

  const isClosed = ticket.status === 'DONE' || ticket.status === 'CANCELED'
  const isSlaWarning = ticket.slaResolutionDue && !ticket.slaBreached &&
    (ticket.slaResolutionDue.getTime() - Date.now()) < 60 * 60 * 1000

  const visibleMessages = ticket.messages.filter(m => {
    if (m.visibility === 'AUTHOR') return m.authorId === session?.user.id
    if (m.visibility === 'TECHNICIANS') return isTI
    return true // PUBLIC
  })

  const sc = statusConfig[ticket.status] ?? statusConfig.OPEN
  const pc = priorityConfig[ticket.priority] ?? priorityConfig.MEDIUM

  const collaboratorsList = ticket.collaborators.map(c => ({
    userId: c.userId, name: c.user.name, addedAt: c.addedAt.toISOString(),
  }))

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link href="/tickets" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#3d5068', textDecoration: 'none' }}>
            Chamados
          </Link>
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#2d4060" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: sc.color, fontWeight: 700 }}>
            {shortCode(ticket.code)}
          </span>
        </nav>
        {isSlaWarning && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.3)',
            borderRadius: 8, padding: '6px 12px',
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#fb923c',
          }}>
            ⚠ SLA próximo do vencimento
          </div>
        )}
      </div>

      {/* Body: header + chat on left, sidebar on right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 310px', gap: 20, alignItems: 'start' }}>

        {/* ── Left col: header card + messages ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Header card */}
          <div style={{
            background: '#0d1422',
            border: '1px solid rgba(255,255,255,0.07)',
            borderLeft: `3px solid ${sc.color}`,
            borderRadius: 12, padding: '18px 22px',
            boxShadow: `0 0 40px ${sc.glow}`,
          }}>
            {/* Badges row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 800, color: sc.color }}>
                {shortCode(ticket.code)}
              </span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700,
                color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`,
                padding: '3px 11px', borderRadius: 20,
              }}>
                {sc.label}
              </span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700,
                color: pc.color, background: `${pc.color}18`, border: `1px solid ${pc.color}30`,
                padding: '3px 11px', borderRadius: 20,
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: pc.color }} />
                {pc.label}
              </span>
              {ticket.category && (
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                  color: '#4a6580', background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  padding: '3px 11px', borderRadius: 20,
                }}>
                  {ticket.category.name}
                </span>
              )}
            </div>

            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e2eaf4', lineHeight: 1.3, marginBottom: 18 }}>
              {ticket.title}
            </h1>

            {/* Meta grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '12px 20px', paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)',
            }}>
              <MetaField label="Solicitante"  value={ticket.requester.name}  sub={ticket.requester.email} accentColor={avatarColor(ticket.requester.name)} />
              <MetaField label="Aberto por"   value={ticket.openedBy?.name ?? ticket.requester.name} />
              <MetaField label="Técnico"      value={ticket.assignee?.name ?? 'Não atribuído'} empty={!ticket.assignee} accentColor={ticket.assignee ? avatarColor(ticket.assignee.name) : undefined} />
              <MetaField label="Departamento" value={ticket.department?.name ?? '—'} empty={!ticket.department} />
              <MetaField label="Aberto em"    value={formatDate(ticket.createdAt)} />
              {ticket.slaResolutionDue && (
                <MetaField label="Prazo SLA" value={formatDate(ticket.slaResolutionDue)} highlight={!!isSlaWarning} />
              )}
              {ticket.closedAt && <MetaField label="Encerrado em" value={formatDate(ticket.closedAt)} />}
            </div>

            {/* Collaborators */}
            {ticket.collaborators.length > 0 && (
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3d5068' }}>COLABORADORES</span>
                {ticket.collaborators.map(c => {
                  const color = avatarColor(c.user.name)
                  return (
                    <span key={c.userId} style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      background: `${color}15`, border: `1px solid ${color}30`,
                      borderRadius: 20, padding: '3px 10px',
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color,
                    }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', background: `${color}30`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800 }}>
                        {getInitials(c.user.name)}
                      </span>
                      {c.user.name}
                    </span>
                  )
                })}
              </div>
            )}

            {/* Descrição */}
            <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#2d4060', letterSpacing: '0.1em', marginBottom: 10 }}>
                DESCRIÇÃO
              </p>
              <p style={{ fontSize: 14, color: '#94a3b8', whiteSpace: 'pre-wrap', lineHeight: 1.75 }}>
                {ticket.description}
              </p>
            </div>
          </div>

          {/* ── Messages ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#3d5068', letterSpacing: '0.07em' }}>
              MENSAGENS
            </span>
            {visibleMessages.length > 0 && (
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3d5068',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                padding: '1px 7px', borderRadius: 10,
              }}>
                {visibleMessages.length}
              </span>
            )}
          </div>

          {/* Message list */}
          {visibleMessages.length === 0 ? (
            <div style={{
              background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10, padding: '44px 24px', textAlign: 'center',
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
              }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#2d4060" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#2d4060' }}>Nenhuma mensagem ainda</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {visibleMessages.map(msg => {
                const isMe = msg.authorId === session?.user.id
                const isTIAuthor = ['TECNICO', 'ADMIN', 'AUXILIAR_TI'].includes(msg.author.role)
                const avColor = avatarColor(msg.author.name)
                const vis = visibilityLabel[msg.visibility] ?? visibilityLabel.PUBLIC
                const isNote = msg.isNote

                // Bubble colors
                const bubbleBg = isNote
                  ? (msg.visibility === 'TECHNICIANS' ? 'rgba(56,189,248,0.06)' : 'rgba(255,255,255,0.04)')
                  : isTIAuthor
                  ? 'rgba(56,189,248,0.08)'
                  : '#0d1422'
                const bubbleBorder = isNote
                  ? (msg.visibility === 'TECHNICIANS' ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.08)')
                  : isTIAuthor
                  ? 'rgba(56,189,248,0.18)'
                  : 'rgba(255,255,255,0.07)'
                const nameColor = isNote
                  ? (msg.visibility === 'TECHNICIANS' ? '#38bdf8' : '#7a9bbc')
                  : isTIAuthor ? '#38bdf8' : '#4a6580'
                const textColor = isNote ? '#c8d6e5' : isTIAuthor ? '#d1e8ff' : '#94a3b8'

                return (
                  <div key={msg.id} style={{
                    display: 'flex', gap: 10,
                    flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-start',
                  }}>
                    {/* Avatar */}
                    <div style={{
                      flexShrink: 0, width: 32, height: 32, borderRadius: 9,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#fff',
                      background: `${avColor}28`, border: `1px solid ${avColor}50`, marginTop: 2,
                    }}>
                      {getInitials(msg.author.name)}
                    </div>

                    <div style={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', gap: 4, alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      {/* Note badge */}
                      {isNote && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          background: msg.visibility === 'TECHNICIANS' ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${msg.visibility === 'TECHNICIANS' ? 'rgba(56,189,248,0.25)' : 'rgba(255,255,255,0.1)'}`,
                          borderRadius: 20, padding: '2px 9px',
                        }}>
                          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke={msg.visibility === 'TECHNICIANS' ? '#38bdf8' : '#7a9bbc'} strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: msg.visibility === 'TECHNICIANS' ? '#38bdf8' : '#7a9bbc' }}>
                            NOTA · {msg.visibility === 'TECHNICIANS' ? 'TÉCNICOS' : 'TODOS'}
                          </span>
                        </div>
                      )}

                      {/* Visibility badge for non-public messages that aren't notes */}
                      {!isNote && msg.visibility !== 'PUBLIC' && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          background: `${vis.color}12`, border: `1px solid ${vis.color}25`,
                          borderRadius: 20, padding: '2px 8px',
                        }}>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: vis.color }}>
                            {vis.icon} {vis.label.toUpperCase()}
                          </span>
                        </div>
                      )}

                      {/* Bubble */}
                      <div style={{ background: bubbleBg, border: `1px solid ${bubbleBorder}`, borderRadius: 10, padding: '10px 14px' }}>
                        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, marginBottom: 6, color: nameColor }}>
                          {msg.author.name}
                        </p>
                        <p style={{ fontSize: 14, lineHeight: 1.65, whiteSpace: 'pre-wrap', color: textColor }}>
                          {msg.body}
                        </p>
                      </div>

                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060', paddingLeft: isMe ? 0 : 4, paddingRight: isMe ? 4 : 0 }}>
                        {timeAgo(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Composer / Closed notice */}
          {!isClosed ? (
            <MessageComposer ticketId={id} canSendInternal={isTI} />
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10, padding: '14px 18px', textAlign: 'center',
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#2d4060',
            }}>
              Este chamado está encerrado. Para reabri-lo, altere o status.
            </div>
          )}
        </div>
        </div>{/* end left col */}

        {/* ── Right sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {isTI && (
            <>
              <AssignPanel
                ticketId={id}
                currentAssigneeId={ticket.assigneeId}
                technicians={technicians}
                sharedTechs={collaboratorsList}
                readOnly={isAuxiliar}
              />
              {(!isClosed || isAuxiliar) && (
                <StatusPanel
                  ticketId={id}
                  currentStatus={ticket.status}
                  readOnly={isAuxiliar}
                />
              )}
              {canEdit && (
                <SolutionPanel
                  ticketId={id}
                  solutions={ticket.solutions.map(s => ({
                    id: s.id, title: s.title, body: s.body,
                    createdBy: { name: s.createdBy.name },
                    createdAt: s.createdAt.toISOString(),
                  }))}
                />
              )}
              <TicketAssetActionsPanel
                ticketId={id}
                requesterId={ticket.requesterId}
                requesterName={ticket.requester.name}
                users={allUsers}
                linkedAssets={ticket.movementOrders.flatMap(o =>
                  o.items.map(item => ({
                    orderId: o.id,
                    assetTag: item.asset?.tag ?? '—',
                    assetName: item.asset?.name ?? '—',
                    action: item.action,
                    orderStatus: o.status,
                  }))
                )}
                readOnly={isAuxiliar}
              />
            </>
          )}

          {/* Histórico — visível apenas para TECNICO e ADMIN */}
          {canEdit && (
            <TicketHistoryPanel
              ticketId={id}
              events={ticket.events.map(ev => ({
                id: ev.id,
                type: ev.type,
                payload: ev.payload,
                createdAt: ev.createdAt.toISOString(),
                actor: ev.actor ? { id: ev.actor.id, name: ev.actor.name } : null,
              }))}
            />
          )}

          {/* Ordens de movimentação */}
          {ticket.movementOrders.length > 0 && (
            <div style={{
              background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10, padding: 16,
            }}>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#7a9bbc', letterSpacing: '0.06em', marginBottom: 12 }}>
                ORDENS
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ticket.movementOrders.map(order => (
                  <div key={order.id} style={{
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 7, padding: '10px 12px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#3d5068' }}>{order.id.slice(0, 8)}…</span>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600,
                        color: order.status === 'DONE' ? '#34d399' : order.status === 'IN_PROGRESS' ? '#f59e0b' : '#94a3b8',
                        background: order.status === 'DONE' ? 'rgba(52,211,153,0.1)' : order.status === 'IN_PROGRESS' ? 'rgba(245,158,11,0.1)' : 'rgba(148,163,184,0.08)',
                        padding: '2px 8px', borderRadius: 10,
                      }}>
                        {order.status}
                      </span>
                    </div>
                    {order.items.map(item => (
                      <p key={item.id} style={{ fontSize: 12, color: '#4a6580' }}>• {item.action}{item.asset ? ` — ${item.asset.tag}` : ''}</p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MetaField({ label, value, sub, empty, highlight, accentColor }: {
  label: string; value: string; sub?: string; empty?: boolean; highlight?: boolean; accentColor?: string
}) {
  return (
    <div>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#2d4060', letterSpacing: '0.08em', marginBottom: 4 }}>
        {label.toUpperCase()}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {accentColor && !empty && (
          <div style={{ width: 3, height: 14, borderRadius: 2, background: accentColor, flexShrink: 0 }} />
        )}
        <p style={{
          fontSize: 13, fontWeight: 500,
          color: empty ? '#2d4060' : highlight ? '#fb923c' : '#94a3b8',
          fontStyle: empty ? 'italic' : 'normal',
        }}>
          {value}
        </p>
      </div>
      {sub && <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</p>}
    </div>
  )
}
