// tickets page
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { TicketRowModern } from '@/components/tickets/TicketRowModern'
import { TicketCardModern } from '@/components/tickets/TicketCardModern'

// ── helpers ──────────────────────────────────────────────────
function buildUrl(
  base: Record<string, string | undefined>,
  overrides: Record<string, string | undefined>,
) {
  const merged = { ...base, ...overrides }
  const params = new URLSearchParams()
  Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v) })
  const q = params.toString()
  return `/tickets${q ? `?${q}` : ''}`
}

// ── icons ────────────────────────────────────────────────────
const PlusIcon = () => (
  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)
const ListIcon = () => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)
const GridIcon = () => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
)
const SortDescIcon = () => (
  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9M3 12h5m13 0l-4 4m0 0l-4-4m4 4V4" />
  </svg>
)
const SortAscIcon = () => (
  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9M3 12h5m0-8l4-4m0 0l4 4m-4-4v16" />
  </svg>
)

// ── page ─────────────────────────────────────────────────────
export default async function TicketsPage({
  searchParams,
}: {
  searchParams: { filter?: string; priority?: string; status?: string; sort?: string; view?: string }
}) {
  const session = await auth()
  const isCollaborador =
    session?.user.role === 'COLABORADOR' || session?.user.role === 'AUXILIAR_TI'

  const sp = await searchParams
  const where: any = {}

  if (isCollaborador) where.requesterId = session!.user.id
  if (sp.priority)              where.priority   = sp.priority
  if (sp.status)                where.status     = sp.status
  if (sp.filter === 'unassigned')  { where.status = 'OPEN'; where.assigneeId = null }
  if (sp.filter === 'open')        where.status = 'OPEN'
  if (sp.filter === 'in_progress') where.status = 'IN_PROGRESS'

  const sortDir = sp.sort === 'oldest' ? 'asc' : 'desc'
  const isCards = sp.view === 'cards'

  const tickets = await prisma.ticket.findMany({
    where,
    orderBy: [{ createdAt: sortDir }],
    take: 50,
    include: {
      category: { select: { name: true } },
      requester: { select: { name: true } },
      assignee:  { select: { name: true } },
    },
  })

  const baseParams = {
    filter: sp.filter, priority: sp.priority, status: sp.status,
    sort: sp.sort, view: sp.view,
  }

  const filters = [
    { label: 'TODOS',           key: undefined,       filterVal: undefined },
    { label: 'NÃO ATRIBUÍDOS',  key: 'filter',        filterVal: 'unassigned' },
    { label: 'ABERTOS',         key: 'filter',        filterVal: 'open' },
    { label: 'EM ATENDIMENTO',  key: 'filter',        filterVal: 'in_progress' },
    { label: 'URGENTES',        key: 'priority',      filterVal: 'URGENT' },
  ]

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p className="section-label" style={{ marginBottom: 10 }}>SISTEMA / CHAMADOS</p>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.01em', lineHeight: 1 }}>
            Chamados
          </h1>
          <p style={{ fontSize: 14, color: '#3d5068', marginTop: 8 }}>
            {tickets.length} {tickets.length === 1 ? 'chamado encontrado' : 'chamados encontrados'}
          </p>
        </div>
        <Link
          href="/tickets/new"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '9px 18px',
            background: 'rgba(0,217,184,0.1)', border: '1px solid rgba(0,217,184,0.25)',
            borderRadius: 6, color: '#00d9b8', fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace", fontWeight: 500,
            textDecoration: 'none', flexShrink: 0,
          }}
        >
          <PlusIcon /> Novo chamado
        </Link>
      </div>

      {/* ── Toolbar: filtros + sort + view ─────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' as const }}>

        {/* Filtros rápidos */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
          {filters.map((f) => {
            const isActive =
              !f.filterVal
                ? !sp.filter && !sp.priority
                : (f.key === 'filter' ? sp.filter === f.filterVal : sp.priority === f.filterVal)
            const href = f.filterVal
              ? buildUrl({ ...baseParams, filter: f.key === 'filter' ? f.filterVal : undefined, priority: f.key === 'priority' ? f.filterVal : undefined }, {})
              : buildUrl({ sort: sp.sort, view: sp.view }, {})
            return (
              <Link key={f.label} href={href} className="filter-chip"
                style={isActive ? { borderColor: 'rgba(0,217,184,0.5)', color: '#00d9b8', background: 'rgba(0,217,184,0.08)' } : {}}>
                {f.label}
              </Link>
            )
          })}
        </div>

        {/* Sort + View toggle */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          {/* Sort buttons */}
          <div style={{ display: 'flex', gap: 0, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, overflow: 'hidden' }}>
            {[
              { label: 'Mais recente', sort: undefined, Icon: SortDescIcon },
              { label: 'Mais antigo',  sort: 'oldest',  Icon: SortAscIcon  },
            ].map(({ label, sort, Icon }) => {
              const active = (sort === undefined ? !sp.sort || sp.sort !== 'oldest' : sp.sort === sort)
              return (
                <Link
                  key={label}
                  href={buildUrl({ ...baseParams }, { sort })}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '6px 12px',
                    background: active ? 'rgba(0,217,184,0.1)' : 'transparent',
                    color: active ? '#00d9b8' : '#3d5068',
                    fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                    textDecoration: 'none', transition: 'background 0.12s, color 0.12s',
                    borderRight: sort === undefined ? '1px solid rgba(255,255,255,0.07)' : 'none',
                  }}
                >
                  <Icon /> {label}
                </Link>
              )
            })}
          </div>

          {/* View toggle */}
          <div style={{ display: 'flex', gap: 0, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, overflow: 'hidden' }}>
            {[
              { view: undefined,  Icon: ListIcon, title: 'Lista' },
              { view: 'cards',    Icon: GridIcon, title: 'Cards' },
            ].map(({ view, Icon, title }) => {
              const active = view === undefined ? !isCards : isCards
              return (
                <Link
                  key={title}
                  href={buildUrl({ ...baseParams }, { view })}
                  title={title}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 34, height: 34,
                    background: active ? 'rgba(0,217,184,0.1)' : 'transparent',
                    color: active ? '#00d9b8' : '#3d5068',
                    textDecoration: 'none', transition: 'background 0.12s, color 0.12s',
                    borderRight: view === undefined ? '1px solid rgba(255,255,255,0.07)' : 'none',
                  }}
                >
                  <Icon />
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Conteúdo ───────────────────────────────────────── */}
      {tickets.length === 0 ? (
        <div style={{ padding: '60px 24px', textAlign: 'center', color: '#2d4060', fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
          — nenhum chamado encontrado —
        </div>
      ) : isCards ? (

        /* ── Visualização em Cards ── */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 12,
        }}>
          {tickets.map((ticket) => {
            return (
              <TicketCardModern
                key={ticket.id}
                id={ticket.id}
                code={ticket.code}
                title={ticket.title}
                priority={ticket.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'}
                status={ticket.status as 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'DONE' | 'CANCELED'}
                categoryName={ticket.category.name}
                requesterName={ticket.requester.name}
                assigneeName={ticket.assignee?.name}
                createdAt={ticket.createdAt}
              />
            )
          })}
        </div>

      ) : (

        /* ── Visualização em Lista ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Cabeçalho das colunas */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px 0 23px', gap: 20, marginBottom: 2 }}>
            <div style={{ flexShrink: 0, width: 76 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060', letterSpacing: '0.08em' }}>#ID</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060', letterSpacing: '0.08em' }}>TÍTULO</span>
            </div>
            <div style={{ flexShrink: 0, width: 140 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060', letterSpacing: '0.08em' }}>TÉCNICO</span>
            </div>
            <div style={{ flexShrink: 0, width: 120 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060', letterSpacing: '0.08em' }}>STATUS</span>
            </div>
          </div>

          {tickets.map((ticket) => (
            <TicketRowModern
              key={ticket.id}
              id={ticket.id}
              code={ticket.code}
              title={ticket.title}
              requesterName={ticket.requester?.name || 'Desconhecido'}
              priority={ticket.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'}
              status={ticket.status as 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'DONE' | 'CANCELED'}
              assigneeId={ticket.assigneeId || undefined}
              assigneeName={ticket.assignee?.name}
              createdAt={ticket.createdAt}
            />
          ))}
        </div>
      )}

    </div>
  )
}
