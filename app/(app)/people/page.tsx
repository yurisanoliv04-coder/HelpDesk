import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { TabSaverLink } from '@/components/ui/TabSaverLink'
import { PaginationBar } from '@/components/ui/PaginationBar'

const PAGE_SIZE = 30

const roleLabel: Record<string, string> = {
  COLABORADOR: 'Colaborador',
  AUXILIAR_TI: 'Auxiliar TI',
  TECNICO:     'Técnico TI',
  ADMIN:       'Admin TI',
}
const roleColor: Record<string, { text: string; bg: string; border: string }> = {
  COLABORADOR: { text: '#94a3b8', bg: 'rgba(148,163,184,0.1)',  border: 'rgba(148,163,184,0.2)'  },
  AUXILIAR_TI: { text: '#818cf8', bg: 'rgba(129,140,248,0.1)',  border: 'rgba(129,140,248,0.2)'  },
  TECNICO:     { text: '#00d9b8', bg: 'rgba(0,217,184,0.1)',    border: 'rgba(0,217,184,0.2)'    },
  ADMIN:       { text: '#f87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.2)'  },
}

const GRID = '44px minmax(200px,1fr) 150px 140px 70px 80px 90px 28px'

const thStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 9, fontWeight: 700,
  color: '#2d4060', letterSpacing: '0.08em',
  whiteSpace: 'nowrap',
}

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ dept?: string; role?: string; q?: string; page?: string }>
}) {
  const session = await auth()
  const role = session?.user.role
  if (role === 'COLABORADOR' || role === 'AUXILIAR_TI') redirect('/dashboard')

  const sp = await searchParams

  // Restaura o último filtro de departamento quando não há parâmetro na URL
  if (!sp.dept && !sp.role && !sp.q) {
    const cookieStore = await cookies()
    const saved = cookieStore.get('hd_people_filter')?.value
    if (saved) redirect(`/people?${decodeURIComponent(saved)}`)
  }

  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)
  const skip = (page - 1) * PAGE_SIZE

  const where: Record<string, unknown> = {}
  if (sp.dept) where.departmentId = sp.dept
  if (sp.role) where.role = sp.role

  const [users, totalCount, activeCount, departments, roleCounts] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
      take: PAGE_SIZE,
      skip,
      include: {
        department: { select: { id: true, name: true } },
        _count: {
          select: {
            ticketsAsRequester: true,
            assignedAssets: { where: { status: 'DEPLOYED' } },
            systemAccesses: { where: { status: 'OK' } },
          },
        },
      },
    }),
    prisma.user.count({ where }),
    prisma.user.count({ where: { ...where, active: true } }),
    prisma.department.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
  ])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const roleMap    = Object.fromEntries(roleCounts.map(r => [r.role, r._count._all]))

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060', letterSpacing: '0.1em' }}>SISTEMA</span>
            <span style={{ color: '#1e3048', fontSize: 10 }}>/</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#00d9b8', letterSpacing: '0.1em' }}>PESSOAS</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e2eaf4', letterSpacing: '-0.01em', lineHeight: 1 }}>
            Gestão de Pessoas
          </h1>
          <p style={{ fontSize: 13, color: '#3d5068', marginTop: 6 }}>
            {totalCount} {totalCount === 1 ? 'usuário cadastrado' : 'usuários cadastrados'}
            {sp.dept || sp.role ? <span style={{ color: '#2d4060' }}> com filtro ativo</span> : null}
          </p>
        </div>

        {role === 'ADMIN' && (
          <Link
            href="/admin/users/new"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 8,
              background: 'rgba(0,217,184,0.12)', border: '1px solid rgba(0,217,184,0.3)',
              fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
              color: '#00d9b8', textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Novo usuário
          </Link>
        )}
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {[
          { label: 'Total', value: totalCount, color: '#00d9b8', bg: 'rgba(0,217,184,0.07)', border: 'rgba(0,217,184,0.18)', icon: '👥' },
          { label: 'Ativos', value: activeCount, color: '#34d399', bg: 'rgba(52,211,153,0.07)', border: 'rgba(52,211,153,0.18)', icon: '✅' },
          { label: 'Técnicos TI', value: (roleMap.TECNICO ?? 0) + (roleMap.AUXILIAR_TI ?? 0), color: '#818cf8', bg: 'rgba(129,140,248,0.07)', border: 'rgba(129,140,248,0.18)', icon: '🔧' },
          { label: 'Colaboradores', value: roleMap.COLABORADOR ?? 0, color: '#94a3b8', bg: 'rgba(148,163,184,0.07)', border: 'rgba(148,163,184,0.18)', icon: '🏢' },
          { label: 'Inativos', value: totalCount - activeCount, color: '#f87171', bg: 'rgba(248,113,113,0.07)', border: 'rgba(248,113,113,0.18)', icon: '⚠️' },
        ].map(s => (
          <div key={s.label} style={{
            background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12,
            padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: s.bg, border: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              {s.icon}
            </div>
            <div>
              <p style={{ fontSize: 26, fontWeight: 700, color: s.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{s.value}</p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3d5068', marginTop: 3, fontWeight: 600, letterSpacing: '0.05em' }}>{s.label.toUpperCase()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filtros por departamento ──────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[{ id: null, name: 'Todos' }, ...departments].map(dept => {
          const isActive = (dept.id === null && !sp.dept) || dept.id === sp.dept
          const href = dept.id ? `/people?dept=${dept.id}${sp.role ? '&role=' + sp.role : ''}` : `/people${sp.role ? '?role=' + sp.role : ''}`
          const filterValue = dept.id
            ? `dept=${dept.id}${sp.role ? '&role=' + sp.role : ''}`
            : (sp.role ? `role=${sp.role}` : '')
          return (
            <TabSaverLink
              key={dept.id ?? 'all'}
              href={href}
              cookieKey="hd_people_filter"
              cookieValue={filterValue}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 7,
                background: isActive ? 'rgba(0,217,184,0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isActive ? 'rgba(0,217,184,0.35)' : 'rgba(255,255,255,0.07)'}`,
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                fontWeight: isActive ? 700 : 500, color: isActive ? '#00d9b8' : '#3d5068',
                textDecoration: 'none',
              }}
            >
              {dept.name}
            </TabSaverLink>
          )
        })}
      </div>

      {/* ── Tabela ───────────────────────────────────────────────────────── */}
      <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>

        {/* Cabeçalho */}
        <div style={{
          display: 'grid', gridTemplateColumns: GRID, columnGap: 8,
          padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(255,255,255,0.02)', alignItems: 'center', height: 38,
        }}>
          <div />
          <div style={thStyle}>NOME · E-MAIL</div>
          <div style={thStyle}>DEPARTAMENTO</div>
          <div style={thStyle}>CARGO</div>
          <div style={{ ...thStyle, textAlign: 'center' as const }}>ATIVOS</div>
          <div style={{ ...thStyle, textAlign: 'center' as const }}>CHAMADOS</div>
          <div style={thStyle}>STATUS</div>
          <div />
        </div>

        {/* Linhas */}
        {users.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#2d4060' }}>
            — nenhum usuário encontrado —
          </div>
        ) : users.map((user, i) => {
          const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
          const rc = roleColor[user.role] ?? roleColor.COLABORADOR

          return (
            <div
              key={user.id}
              className="hover-row"
              style={{
                position: 'relative', display: 'grid', gridTemplateColumns: GRID, columnGap: 8,
                padding: '0 20px', alignItems: 'center', minHeight: 56,
                borderBottom: i < users.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                transition: 'background 0.1s',
                opacity: user.active ? 1 : 0.5,
              }}
            >
              {/* Overlay link */}
              <Link href={`/people/${user.id}`} aria-label={`Ver perfil de ${user.name}`} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

              {/* Avatar */}
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: rc.bg, border: `1px solid ${rc.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: rc.text }}>
                    {initials}
                  </span>
                </div>
              </div>

              {/* Nome + email */}
              <div style={{ position: 'relative', zIndex: 1, paddingRight: 12, minWidth: 0, pointerEvents: 'none' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#c8d6e5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                  {user.name}
                </p>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </p>
              </div>

              {/* Departamento */}
              <div style={{ position: 'relative', zIndex: 1, paddingRight: 10, pointerEvents: 'none' }}>
                <span style={{ fontSize: 12, color: '#4a6580', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                  {user.department?.name ?? '—'}
                </span>
              </div>

              {/* Cargo */}
              <div style={{ position: 'relative', zIndex: 1, paddingRight: 10, pointerEvents: 'none' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '3px 9px', borderRadius: 5,
                  background: rc.bg, border: `1px solid ${rc.border}`,
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: rc.text, whiteSpace: 'nowrap',
                }}>
                  {roleLabel[user.role]}
                </span>
              </div>

              {/* Ativos */}
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
                  color: user._count.assignedAssets > 0 ? '#34d399' : '#1e3048',
                }}>
                  {user._count.assignedAssets}
                </span>
              </div>

              {/* Chamados */}
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
                  color: user._count.ticketsAsRequester > 0 ? '#38bdf8' : '#1e3048',
                }}>
                  {user._count.ticketsAsRequester}
                </span>
              </div>

              {/* Status */}
              <div style={{ position: 'relative', zIndex: 1, pointerEvents: 'none' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 10px', borderRadius: 6,
                  background: user.active ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
                  border: `1px solid ${user.active ? '#34d39922' : '#f8717122'}`,
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                    background: user.active ? '#34d399' : '#f87171',
                    boxShadow: `0 0 5px ${user.active ? '#34d39988' : '#f8717188'}`,
                  }} />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: user.active ? '#34d399' : '#f87171' }}>
                    {user.active ? 'Ativo' : 'Inativo'}
                  </span>
                </span>
              </div>

              {/* Arrow */}
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#2d4060" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          )
        })}
      </div>

      {totalCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#1e3048' }}>
            Página {page} de {totalPages} · {totalCount} usuário{totalCount !== 1 ? 's' : ''} no total
          </p>
          <PaginationBar
            page={page}
            totalPages={totalPages}
            buildHref={p => {
              const params = new URLSearchParams()
              if (sp.dept) params.set('dept', sp.dept)
              if (sp.role) params.set('role', sp.role)
              if (sp.q) params.set('q', sp.q)
              params.set('page', String(p))
              return `/people?${params.toString()}`
            }}
          />
        </div>
      )}
    </div>
  )
}
