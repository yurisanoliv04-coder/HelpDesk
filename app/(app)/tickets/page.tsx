import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { cookies, } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import TicketsToolbar from '@/components/tickets/TicketsToolbar'
import TicketsListView from '@/components/tickets/TicketsListView'

const PlusIcon = () => (
  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; priority?: string; q?: string; assignee?: string; requester?: string; date?: string }>
}) {
  const session = await auth()
  const isCollaborador =
    session?.user.role === 'COLABORADOR' || session?.user.role === 'AUXILIAR_TI'

  const sp       = await searchParams
  const filter   = sp.filter   ?? ''
  const priority = sp.priority ?? ''
  const q        = sp.q?.trim() ?? ''
  const assignee  = sp.assignee  ?? ''   // userId — from TechChart click
  const requester = sp.requester ?? ''   // userId — from search modal
  const date      = sp.date      ?? ''   // YYYY-MM-DD — from WeeklyChart click

  // ── Restore last active filter from cookie (server-side redirect) ──
  // Only when no filter/priority/search/chart-param is explicitly set in the URL
  if (!filter && !priority && !q && !assignee && !requester && !date) {
    const cookieStore = await cookies()
    const saved = cookieStore.get('hd_tickets_filter')?.value
    if (saved && saved !== 'all') {
      if (saved.startsWith('priority:')) {
        redirect(`/tickets?priority=${encodeURIComponent(saved.slice(9))}`)
      } else {
        redirect(`/tickets?filter=${encodeURIComponent(saved)}`)
      }
    }
  }

  const where: any = {}

  if (isCollaborador) where.requesterId = session!.user.id

  // ── Status filter ──────────────────────────────────────────
  if      (filter === 'unassigned')  { where.status = 'OPEN'; where.assigneeId = null }
  else if (filter === 'open')        { where.status = 'OPEN' }
  else if (filter === 'unresolved')  { where.status = { notIn: ['DONE', 'CANCELED'] } }
  else if (filter === 'in_progress') { where.status = 'IN_PROGRESS' }
  else if (filter === 'done')        { where.status = { in: ['DONE', 'CANCELED'] } }
  // 'all' or '': no constraint

  // ── Priority filter ────────────────────────────────────────
  if (priority) where.priority = priority

  // ── Assignee filter (from TechChart click) ─────────────────
  if (assignee) where.assigneeId = assignee

  // ── Requester filter (from search modal) ───────────────────
  if (requester && !isCollaborador) where.requesterId = requester

  // ── Date filter (from WeeklyChart click) ───────────────────
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const start = new Date(date + 'T00:00:00.000Z')
    const end   = new Date(date + 'T23:59:59.999Z')
    where.createdAt = { gte: start, lte: end }
  }

  // ── Full-text search ───────────────────────────────────────
  if (q) {
    const orConditions: any[] = [
      { title:       { contains: q, mode: 'insensitive' } },
      { code:        { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { requester:   { name: { contains: q, mode: 'insensitive' } } },
      { assignee:    { name: { contains: q, mode: 'insensitive' } } },
      { category:    { name: { contains: q, mode: 'insensitive' } } },
      { department:  { name: { contains: q, mode: 'insensitive' } } },
    ]
    // Support "#13" or "13" → match code suffix (HD-2026-000013)
    const numStr = q.startsWith('#') ? q.slice(1) : q
    if (/^\d+$/.test(numStr)) {
      orConditions.push({ code: { endsWith: numStr.padStart(6, '0') } })
    }
    where.OR = orConditions
  }

  const [tickets, technicians] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      take: 300,
      include: {
        category:  { select: { name: true } },
        requester: { select: { name: true } },
        assignee:  { select: { name: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ['TECNICO', 'ADMIN'] }, active: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    }),
  ])

  // Serialize dates for client component
  const serialized = tickets.map(t => ({
    id:            t.id,
    code:          t.code,
    title:         t.title,
    priority:      t.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    status:        t.status  as 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'DONE' | 'CANCELED',
    categoryName:  t.category.name,
    requesterName: t.requester.name,
    assigneeId:    t.assigneeId ?? undefined,
    assigneeName:  t.assignee?.name,
    createdAt:     t.createdAt.toISOString(),
  }))

  // Build active chart-filter label (assignee or date)
  const assigneeName = assignee
    ? (technicians.find(t => t.id === assignee)?.name ?? 'Técnico')
    : null
  const chartFilterLabel = assigneeName
    ? `Técnico: ${assigneeName}`
    : date
    ? `Data: ${date.split('-').reverse().join('/')}`
    : null

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p className="section-label" style={{ marginBottom: 10 }}>SISTEMA / CHAMADOS</p>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', lineHeight: 1 }}>
            Chamados
          </h1>
        </div>
        <Link
          href="/tickets/new"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '9px 18px',
            background: 'var(--accent-cyan-dim)', border: '1px solid var(--accent-cyan)',
            borderRadius: 6, color: 'var(--accent-cyan)', fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace", fontWeight: 500,
            textDecoration: 'none', flexShrink: 0,
          }}
        >
          <PlusIcon /> Novo chamado
        </Link>
      </div>

      {/* ── Active chart filter banner ── */}
      {chartFilterLabel && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 14px',
          background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.2)',
          borderRadius: 6,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8', flexShrink: 0, boxShadow: '0 0 6px rgba(56,189,248,0.6)' }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#38bdf8', flex: 1 }}>
            FILTRO ATIVO — {chartFilterLabel} · {serialized.length} resultado{serialized.length !== 1 ? 's' : ''}
          </span>
          <Link
            href="/tickets"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#38bdf8', opacity: 0.6, textDecoration: 'none' }}
          >
            limpar ✕
          </Link>
        </div>
      )}

      {/* ── Toolbar: search + filters ── */}
      <TicketsToolbar totalCount={serialized.length} />

      {/* ── List / Cards (sort + view + pagination + bulk handled client-side) ── */}
      <TicketsListView
        tickets={serialized}
        technicians={technicians.map(t => ({ id: t.id, name: t.name, role: t.role }))}
      />

    </div>
  )
}
