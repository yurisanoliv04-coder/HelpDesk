import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { formatDistanceToNow, subDays, format, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { CalendarWidget } from '@/components/dashboard/CalendarWidget'
import { WeeklyChart, WeeklyChartData } from '@/components/dashboard/WeeklyChart'
import { TechChart, TechChartData } from '@/components/dashboard/TechChart'
import { AvatarInitials } from '@/components/dashboard/AvatarInitials'

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getDashboardStats() {
  const [
    openTickets, unassignedTickets, urgentTickets, inProgressTickets,
    totalAssets, deployedAssets, stockAssets, maintenanceAssets, ruimAssets,
  ] = await Promise.all([
    prisma.ticket.count({ where: { status: 'OPEN' } }),
    prisma.ticket.count({ where: { status: 'OPEN', assigneeId: null } }),
    prisma.ticket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] }, priority: 'URGENT' } }),
    prisma.ticket.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.asset.count(),
    prisma.asset.count({ where: { status: 'DEPLOYED' } }),
    prisma.asset.count({ where: { status: 'STOCK' } }),
    prisma.asset.count({ where: { status: 'MAINTENANCE' } }),
    prisma.asset.count({ where: { performanceLabel: 'RUIM' } }),
  ])
  return {
    openTickets, unassignedTickets, urgentTickets, inProgressTickets,
    totalAssets, deployedAssets, stockAssets, maintenanceAssets, ruimAssets,
  }
}

async function getWeeklyData(): Promise<WeeklyChartData[]> {
  const now = new Date()
  const start30 = startOfDay(subDays(now, 29))

  // Single query — all tickets from the last 30 days
  const tickets = await prisma.ticket.findMany({
    where: { createdAt: { gte: start30 } },
    select: { createdAt: true, status: true },
  })

  // Build a map: 'yyyy-MM-dd' → { done, open }
  const dayMap: Record<string, { done: number; open: number }> = {}
  for (let i = 29; i >= 0; i--) {
    const key = format(subDays(now, i), 'yyyy-MM-dd')
    dayMap[key] = { done: 0, open: 0 }
  }
  tickets.forEach((t) => {
    const key = format(t.createdAt, 'yyyy-MM-dd')
    if (!dayMap[key]) return
    if (t.status === 'DONE') dayMap[key].done++
    else dayMap[key].open++
  })

  return Array.from({ length: 30 }, (_, i) => {
    const idx = 29 - i
    const d = subDays(now, idx)
    const key = format(d, 'yyyy-MM-dd')
    const dayNum = parseInt(format(d, 'd'), 10)
    // On the 1st of a month, show "1/MMM" (e.g. "1/mar") for context
    const label = dayNum === 1
      ? `1/${format(d, 'MMM', { locale: ptBR })}`
      : format(d, 'd')
    return {
      day: label,
      done: dayMap[key].done,
      open: dayMap[key].open,
      isToday: idx === 0,
    }
  })
}

async function getTechData(userId: string): Promise<TechChartData[]> {
  const grouped = await prisma.ticket.groupBy({
    by: ['assigneeId'],
    where: { status: { in: ['OPEN', 'IN_PROGRESS'] }, assigneeId: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 6,
  })

  if (grouped.length === 0) return []

  const ids = grouped.map((g) => g.assigneeId!).filter(Boolean)
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  })
  const nameMap = Object.fromEntries(users.map((u) => [u.id, u.name]))

  return grouped.map((g) => ({
    name: nameMap[g.assigneeId!] ?? 'Desconhecido',
    count: g._count.id,
  }))
}

// ─── Visual helpers ────────────────────────────────────────────────────────────

/** "HD-2026-000013" → "#13" */
function shortCode(code: string): string {
  return `#${parseInt(code.split('-').pop() ?? '0', 10)}`
}

/** Retorna cor e label com base em quantas horas o chamado está aberto */
function ageInfo(createdAt: Date): { color: string; label: string } {
  const hours = (Date.now() - createdAt.getTime()) / 3_600_000
  const fmt = (h: number) =>
    h < 1 ? `${Math.round(h * 60)}m`
    : h < 48 ? `${Math.round(h)}h`
    : `${Math.round(h / 24)}d`
  if (hours < 4)  return { color: '#38bdf8', label: fmt(hours) }   // azul  — novo
  if (hours < 48) return { color: '#f59e0b', label: fmt(hours) }   // âmbar — envelhecendo
  return            { color: '#f87171', label: fmt(hours) }         // vermelho — antigo
}

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth()
  const userId = session!.user.id
  const isCollaborador = session?.user.role === 'COLABORADOR' || session?.user.role === 'AUXILIAR_TI'
  const isTI = !isCollaborador

  const [stats, weeklyData, techData, myTickets, recentMessages, recentTickets] =
    await Promise.all([
      getDashboardStats(),
      getWeeklyData(),
      isTI ? getTechData(userId) : Promise.resolve([]),
      // My tickets
      prisma.ticket.findMany({
        where: isCollaborador
          ? { requesterId: userId, status: { in: ['OPEN', 'IN_PROGRESS', 'ON_HOLD'] } }
          : { assigneeId: userId, status: { in: ['OPEN', 'IN_PROGRESS', 'ON_HOLD'] } },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        take: 5,
        include: { category: { select: { name: true } } },
      }),
      // Recent messages on my tickets (from others)
      prisma.ticketMessage.findMany({
        where: {
          isNote: false,
          visibility: 'PUBLIC',
          authorId: { not: userId },
          ticket: { OR: [{ requesterId: userId }, { assigneeId: userId }] },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          author: { select: { name: true } },
          ticket: { select: { id: true, code: true, title: true } },
        },
      }),
      // System recent tickets (open/in_progress)
      prisma.ticket.findMany({
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: {
          category: { select: { name: true } },
          requester: { select: { name: true } },
          assignee:  { select: { name: true } },
        },
      }),
    ])

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div>
        <p className="section-label" style={{ marginBottom: 10 }}>SISTEMA / DASHBOARD</p>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.01em', lineHeight: 1 }}>
          Visão Geral
        </h1>
        <p style={{ fontSize: 14, color: '#3d5068', marginTop: 8 }}>
          Indicadores em tempo real do sistema de chamados e patrimônio
        </p>
      </div>

      {/* ── KPIs Chamados ───────────────────────────────────────────────────── */}
      <section>
        <p className="section-label" style={{ marginBottom: 14 }}>── CHAMADOS</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <DashboardCard title="Não atribuídos" value={stats.unassignedTickets} icon="inbox" color="red" href="/tickets?filter=unassigned" />
          <DashboardCard title="Em aberto" value={stats.openTickets} icon="alert" color="blue" href="/tickets?filter=open" />
          <DashboardCard title="Em atendimento" value={stats.inProgressTickets} icon="clock" color="amber" href="/tickets?filter=in_progress" />
          <DashboardCard title="Urgentes ativos" value={stats.urgentTickets} icon="zap" color="red" href="/tickets?priority=URGENT" />
        </div>
      </section>

      {/* ── KPIs Patrimônio ─────────────────────────────────────────────────── */}
      {isTI && (
        <section>
          <p className="section-label" style={{ marginBottom: 14 }}>── PATRIMÔNIO</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <DashboardCard title="Total de ativos" value={stats.totalAssets} icon="package" color="cyan" href="/assets" />
            <DashboardCard title="Implantados" value={stats.deployedAssets} icon="trending" color="blue" href="/assets?status=DEPLOYED" />
            <DashboardCard title="Em estoque" value={stats.stockAssets} icon="package" color="purple" href="/assets?status=STOCK" />
            <DashboardCard title="Em manutenção" value={stats.maintenanceAssets} icon="alert" color="amber" href="/assets?status=MAINTENANCE" />
          </div>
          {stats.ruimAssets > 0 && (
            <div style={{
              marginTop: 12,
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'rgba(248,113,113,0.06)',
              border: '1px solid rgba(248,113,113,0.18)',
              borderRadius: 6, padding: '10px 16px',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f87171', boxShadow: '0 0 6px rgba(248,113,113,0.6)', flexShrink: 0, display: 'inline-block' }} />
              <span style={{ fontSize: 13, color: '#f87171' }}>
                <strong>{stats.ruimAssets}</strong>{' '}
                {stats.ruimAssets === 1 ? 'equipamento classificado como' : 'equipamentos classificados como'}{' '}
                <strong>Ruim</strong> — necessitam atenção
              </span>
              <Link href="/assets?performance=RUIM" style={{ marginLeft: 'auto', fontSize: 11, color: '#f87171', opacity: 0.8, fontFamily: "'JetBrains Mono', monospace" }}>
                ver lista →
              </Link>
            </div>
          )}
        </section>
      )}

      {/* ── Gráfico semanal (full width) ────────────────────────────────────── */}
      <WeeklyChart data={weeklyData} />

      {/* ── 2-column layout ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 308px', gap: 20, alignItems: 'start' }}>

        {/* LEFT column ──────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Meus Chamados */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <p className="section-label">
                ── {isCollaborador ? 'MEUS CHAMADOS' : 'ATRIBUÍDOS A MIM'}
              </p>
              <Link href="/tickets" style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#00d9b8', opacity: 0.75, textDecoration: 'none' }}>
                ver todos →
              </Link>
            </div>

            <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, overflow: 'hidden' }}>
              {myTickets.length === 0 ? (
                <p style={{ padding: '32px 20px', textAlign: 'center', color: '#2d4060', fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
                  — nenhum chamado ativo —
                </p>
              ) : (<>
                {/* ── Cabeçalho das colunas ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '7px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#0a1019' }}>
                  <div style={{ width: 3, flexShrink: 0 }} />
                  <p className="section-label" style={{ width: 76, flexShrink: 0 }}>#ID</p>
                  <p className="section-label" style={{ flex: 1 }}>TÍTULO</p>
                  <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <p className="section-label" style={{ width: 44, textAlign: 'center' }}>TEMPO</p>
                    <div style={{ width: 7 }} />
                    <p className="section-label" style={{ width: 112 }}>STATUS</p>
                  </div>
                </div>
                {/* ── Linhas ── */}
                <div>
                  {myTickets.map((ticket, i) => (
                    <Link
                      key={ticket.id}
                      href={`/tickets/${ticket.id}`}
                      className="hover-row"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '11px 18px',
                        borderBottom: i < myTickets.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                        textDecoration: 'none', transition: 'background 0.12s',
                      }}
                    >
                      <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: priorityBar[ticket.priority], flexShrink: 0 }} />
                      <div style={{ width: 76, flexShrink: 0 }}>
                        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: '#00d9b8' }}>{shortCode(ticket.code)}</p>
                        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: priorityBar[ticket.priority], opacity: 0.9, marginTop: 1, letterSpacing: '0.05em' }}>
                          {ticket.priority === 'URGENT' ? 'URGENTE' : ticket.priority === 'HIGH' ? 'ALTA' : ticket.priority === 'MEDIUM' ? 'MÉDIA' : 'BAIXA'}
                        </p>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ticket.title}
                        </p>
                        <p style={{ fontSize: 11, color: '#3d5068', marginTop: 2 }}>{ticket.category.name}</p>
                      </div>
                      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                        {(() => { const a = ageInfo(ticket.createdAt); return (
                          <span style={{
                            background: a.color + '18', color: a.color,
                            border: `1px solid ${a.color}35`,
                            display: 'inline-block', width: 44, textAlign: 'center',
                            padding: '2px 0', borderRadius: 20,
                            fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                            letterSpacing: '0.03em',
                          }}>{a.label}</span>
                        )})()}
                        <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: statusDot[ticket.status], boxShadow: `0 0 5px ${statusDot[ticket.status]}90`, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: statusDot[ticket.status], fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap', width: 112, display: 'inline-block' }}>
                          {statusLabel[ticket.status]}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </>)}
            </div>
          </section>

          {/* Gráfico de carga por técnico (só TI) */}
          {isTI && <TechChart data={techData} />}

          {/* Chamados Recentes do sistema */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <p className="section-label">── CHAMADOS RECENTES</p>
              <Link href="/tickets" style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#00d9b8', opacity: 0.75, textDecoration: 'none' }}>
                ver todos →
              </Link>
            </div>

            <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, overflow: 'hidden' }}>
              {recentTickets.length === 0 ? (
                <p style={{ padding: '40px 20px', textAlign: 'center', color: '#2d4060', fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
                  Nenhum chamado aberto no momento.
                </p>
              ) : (<>
                {/* ── Cabeçalho das colunas ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '7px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#0a1019' }}>
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
                {/* ── Linhas ── */}
                <div>
                  {recentTickets.map((ticket, i) => (
                    <Link
                      key={ticket.id}
                      href={`/tickets/${ticket.id}`}
                      className="hover-row"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14, padding: '11px 18px',
                        borderBottom: i < recentTickets.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                        textDecoration: 'none', transition: 'background 0.12s',
                      }}
                    >
                      <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: priorityBar[ticket.priority], flexShrink: 0 }} />
                      <div style={{ width: 76, flexShrink: 0 }}>
                        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: '#00d9b8' }}>{shortCode(ticket.code)}</p>
                        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: priorityBar[ticket.priority], opacity: 0.9, marginTop: 1, letterSpacing: '0.05em' }}>
                          {ticket.priority === 'URGENT' ? 'URGENTE' : ticket.priority === 'HIGH' ? 'ALTA' : ticket.priority === 'MEDIUM' ? 'MÉDIA' : 'BAIXA'}
                        </p>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.title}</p>
                        <p style={{ fontSize: 11, color: '#3d5068', marginTop: 3 }}>
                          {ticket.requester.name} · {ticket.category.name}
                        </p>
                      </div>
                      <div style={{ flexShrink: 0, width: 130 }}>
                        {ticket.assignee ? (
                          <p style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.assignee.name}</p>
                        ) : (
                          <p style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#f87171', opacity: 0.7 }}>não atribuído</p>
                        )}
                      </div>
                      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                        {(() => { const a = ageInfo(ticket.createdAt); return (
                          <span style={{
                            background: a.color + '18', color: a.color,
                            border: `1px solid ${a.color}35`,
                            display: 'inline-block', width: 44, textAlign: 'center',
                            padding: '2px 0', borderRadius: 20,
                            fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                            letterSpacing: '0.03em',
                          }}>{a.label}</span>
                        )})()}
                        <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: statusDot[ticket.status], boxShadow: `0 0 5px ${statusDot[ticket.status]}90`, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: statusDot[ticket.status], fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap', width: 112, display: 'inline-block' }}>
                          {statusLabel[ticket.status]}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </>)}
            </div>
          </section>

        </div>

        {/* RIGHT column ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Calendar */}
          <CalendarWidget userId={userId} />

          {/* Mensagens recentes */}
          <section>
            <p className="section-label" style={{ marginBottom: 14 }}>── MENSAGENS RECENTES</p>

            <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, overflow: 'hidden' }}>
              {recentMessages.length === 0 ? (
                <p style={{ padding: '28px 16px', textAlign: 'center', color: '#2d4060', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
                  — sem mensagens recentes —
                </p>
              ) : (
                <div>
                  {recentMessages.map((msg, i) => {
                    const timeAgo = formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: ptBR })
                    const snippet = msg.body.length > 55 ? msg.body.slice(0, 55) + '…' : msg.body

                    return (
                      <Link
                        key={msg.id}
                        href={`/tickets/${msg.ticket.id}`}
                        className="hover-row"
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px',
                          borderBottom: i < recentMessages.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                          textDecoration: 'none', transition: 'background 0.12s',
                        }}
                      >
                        <AvatarInitials name={msg.author.name} size={32} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6, marginBottom: 2 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {msg.author.name}
                            </p>
                            <p style={{ fontSize: 10, color: '#2d4060', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                              {timeAgo}
                            </p>
                          </div>
                          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#00d9b8', opacity: 0.7, marginBottom: 3 }}>
                            {shortCode(msg.ticket.code)}
                          </p>
                          <p style={{ fontSize: 12, color: '#4d6075', lineHeight: 1.4 }}>
                            {snippet}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </section>

        </div>
      </div>

    </div>
  )
}
