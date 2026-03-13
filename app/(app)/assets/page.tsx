import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Laptop, Monitor, Printer, Keyboard, MousePointer,
  Headphones, Battery, Network, Smartphone, Package,
  Cpu, HardDrive, Server, Tablet, Camera, type LucideProps,
} from 'lucide-react'
import AssetQuickActions from '@/components/assets/AssetQuickActions'

// Map DB icon name → Lucide component
const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  laptop:          Laptop,
  monitor:         Monitor,
  printer:         Printer,
  keyboard:        Keyboard,
  'mouse-pointer': MousePointer,
  headphones:      Headphones,
  battery:         Battery,
  network:         Network,
  smartphone:      Smartphone,
  package:         Package,
  cpu:             Cpu,
  'hard-drive':    HardDrive,
  server:          Server,
  tablet:          Tablet,
  camera:          Camera,
}

function CategoryIcon({ name }: { name: string | null }) {
  if (!name) return <Package size={16} color="#3d5068" />
  const Icon = iconMap[name]
  if (Icon) return <Icon size={16} color="#3d5068" />
  // Fallback: if it's an emoji or unknown string, render as text
  return <span style={{ fontSize: 15, lineHeight: 1 }}>{name}</span>
}

// ── Status config ──────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  STOCK:       { label: 'Estoque',    color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', dot: '#64748b' },
  DEPLOYED:    { label: 'Implantado', color: '#34d399', bg: 'rgba(52,211,153,0.08)',  dot: '#34d399' },
  MAINTENANCE: { label: 'Manutenção', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  dot: '#fbbf24' },
  DISCARDED:   { label: 'Descartado', color: '#f87171', bg: 'rgba(248,113,113,0.08)', dot: '#f87171' },
  LOANED:      { label: 'Emprestado', color: '#38bdf8', bg: 'rgba(56,189,248,0.08)',  dot: '#38bdf8' },
}

const perfConfig: Record<string, { label: string; color: string; track: string }> = {
  BOM:          { label: 'Bom',          color: '#34d399', track: 'rgba(52,211,153,0.15)'  },
  INTERMEDIARIO:{ label: 'Intermediário', color: '#fbbf24', track: 'rgba(251,191,36,0.15)'  },
  RUIM:         { label: 'Ruim',         color: '#f87171', track: 'rgba(248,113,113,0.15)' },
}

// Grid columns — shared between header and rows
const GRID = '44px minmax(200px,1fr) 100px 130px 160px 140px 110px 120px 32px'

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; performance?: string; q?: string; location?: string; userId?: string }>
}) {
  const session = await auth()
  const role = session?.user.role
  if (role === 'COLABORADOR' || role === 'AUXILIAR_TI') redirect('/dashboard')

  const sp = await searchParams
  const where: Record<string, unknown> = {}
  if (sp.status)      where.status             = sp.status
  if (sp.performance) where.performanceLabel   = sp.performance
  if (sp.location)    where.location           = sp.location
  if (sp.userId)      where.assignedToUserId   = sp.userId

  const isAdmin = role === 'ADMIN'

  // Fetch assets + global counts + active users (for quick actions)
  const [assets, counts, filteredUser, activeUsers] = await Promise.all([
    prisma.asset.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 150,
      include: {
        category:       true,
        assignedToUser: { select: { id: true, name: true } },
      },
    }),
    prisma.asset.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
    sp.userId
      ? prisma.user.findUnique({ where: { id: sp.userId }, select: { name: true } })
      : Promise.resolve(null),
    prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  const ruimCount = await prisma.asset.count({ where: { performanceLabel: 'RUIM' } })

  const countMap = Object.fromEntries(counts.map(c => [c.status, c._count._all]))
  const totalCount = Object.values(countMap).reduce((a, b) => a + b, 0)

  const activeFilter = sp.status ?? sp.performance ?? sp.location ?? sp.userId ?? null
  const activeFilterLabel = sp.userId
    ? `Ativos de ${filteredUser?.name ?? 'usuário'}`
    : sp.location
    ? `Local: ${sp.location}`
    : null

  const statusFilters = [
    { key: null,          label: 'Todos',       href: '/assets',                       count: totalCount },
    { key: 'DEPLOYED',    label: 'Implantados', href: '/assets?status=DEPLOYED',       count: countMap.DEPLOYED ?? 0 },
    { key: 'STOCK',       label: 'Estoque',     href: '/assets?status=STOCK',          count: countMap.STOCK ?? 0 },
    { key: 'MAINTENANCE', label: 'Manutenção',  href: '/assets?status=MAINTENANCE',    count: countMap.MAINTENANCE ?? 0 },
    { key: 'LOANED',      label: 'Emprestados', href: '/assets?status=LOANED',         count: countMap.LOANED ?? 0 },
    { key: 'DISCARDED',   label: 'Descartados', href: '/assets?status=DISCARDED',      count: countMap.DISCARDED ?? 0 },
    { key: 'RUIM',        label: '⚠ Ruins',     href: '/assets?performance=RUIM',      count: ruimCount },
  ]

  const statCards = [
    { label: 'Total de Ativos', value: totalCount,               color: '#00d9b8', bg: 'rgba(0,217,184,0.07)',   border: 'rgba(0,217,184,0.18)',   icon: '📦' },
    { label: 'Implantados',     value: countMap.DEPLOYED ?? 0,   color: '#34d399', bg: 'rgba(52,211,153,0.07)',  border: 'rgba(52,211,153,0.18)',  icon: '✅' },
    { label: 'Em Estoque',      value: countMap.STOCK ?? 0,      color: '#94a3b8', bg: 'rgba(148,163,184,0.07)', border: 'rgba(148,163,184,0.18)', icon: '🗄️' },
    { label: 'Manutenção',      value: countMap.MAINTENANCE ?? 0,color: '#fbbf24', bg: 'rgba(251,191,36,0.07)',  border: 'rgba(251,191,36,0.18)',  icon: '🔧' },
    { label: 'Ruins',           value: ruimCount,                 color: '#f87171', bg: 'rgba(248,113,113,0.07)', border: 'rgba(248,113,113,0.18)', icon: '⚠️' },
  ]

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
              color: '#2d4060', letterSpacing: '0.1em',
            }}>
              SISTEMA
            </span>
            <span style={{ color: '#1e3048', fontSize: 10 }}>/</span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
              color: '#00d9b8', letterSpacing: '0.1em',
            }}>
              PATRIMÔNIO
            </span>
          </div>
          <h1 style={{
            fontSize: 28, fontWeight: 700, color: '#e2eaf4',
            letterSpacing: '-0.01em', lineHeight: 1,
          }}>
            Gestão de Patrimônio
          </h1>
          <p style={{ fontSize: 13, color: '#3d5068', marginTop: 6 }}>
            {assets.length} {assets.length === 1 ? 'ativo encontrado' : 'ativos encontrados'}
            {activeFilterLabel ? (
              <span style={{ color: '#00d9b8' }}> · {activeFilterLabel}</span>
            ) : activeFilter ? (
              <span style={{ color: '#2d4060' }}> com filtro ativo</span>
            ) : null}
          </p>
        </div>

        <Link
          href="/assets/new"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 8,
            background: 'rgba(0,217,184,0.12)',
            border: '1px solid rgba(0,217,184,0.3)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12, fontWeight: 700,
            color: '#00d9b8', textDecoration: 'none',
            whiteSpace: 'nowrap', flexShrink: 0,
            boxShadow: '0 0 20px rgba(0,217,184,0.06)',
          }}
        >
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Novo ativo
        </Link>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {statCards.map(s => (
          <div key={s.label} style={{
            background: s.bg,
            border: `1px solid ${s.border}`,
            borderRadius: 12, padding: '16px 18px',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: `${s.bg}`,
              border: `1px solid ${s.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>
              {s.icon}
            </div>
            <div>
              <p style={{
                fontSize: 26, fontWeight: 700,
                color: s.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
              }}>
                {s.value}
              </p>
              <p style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                color: '#3d5068', marginTop: 3, fontWeight: 600,
                letterSpacing: '0.05em',
              }}>
                {s.label.toUpperCase()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filtros ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {statusFilters.map(f => {
          const isActive = activeFilter === f.key
          return (
            <Link
              key={f.href}
              href={f.href}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 7,
                background: isActive ? 'rgba(0,217,184,0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isActive ? 'rgba(0,217,184,0.35)' : 'rgba(255,255,255,0.07)'}`,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11, fontWeight: isActive ? 700 : 500,
                color: isActive ? '#00d9b8' : '#3d5068',
                textDecoration: 'none',
                transition: 'all 0.12s',
              }}
            >
              {f.label}
              <span style={{
                fontSize: 10,
                color: isActive ? '#00d9b8' : '#2d4060',
                background: isActive ? 'rgba(0,217,184,0.15)' : 'rgba(255,255,255,0.05)',
                padding: '1px 6px', borderRadius: 5,
              }}>
                {f.count}
              </span>
            </Link>
          )
        })}
      </div>

      {/* ── Tabela ───────────────────────────────────────────────────────── */}
      <div style={{
        background: '#0d1422',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12, overflow: 'hidden',
      }}>

        {/* Cabeçalho da tabela */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: GRID,
          columnGap: 8,
          padding: '0 20px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(255,255,255,0.02)',
          alignItems: 'center',
          height: 38,
        }}>
          {/* icon col — blank */}
          <div />

          <div style={thStyle}>NOME DO ATIVO</div>
          <div style={{ ...thStyle, textAlign: 'right' as const }}>Nº</div>
          <div style={thStyle}>CATEGORIA</div>
          <div style={thStyle}>ALOCADO PARA</div>
          <div style={thStyle}>LOCAL</div>
          <div style={thStyle}>PERFORMANCE</div>
          <div style={thStyle}>SITUAÇÃO</div>
          {/* arrow col — blank */}
          <div />
        </div>

        {/* Linhas */}
        {assets.length === 0 ? (
          <div style={{
            padding: '60px 24px', textAlign: 'center',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13, color: '#2d4060',
          }}>
            — nenhum ativo encontrado —
          </div>
        ) : (
          assets.map((asset, i) => {
            const st   = statusConfig[asset.status] ?? statusConfig.STOCK
            const perf = asset.performanceLabel ? perfConfig[asset.performanceLabel] : null
            const score = asset.performanceScore
            const locationHref = asset.location
              ? `/assets?location=${encodeURIComponent(asset.location)}`
              : null
            const userHref = asset.assignedToUser
              ? `/people/${asset.assignedToUser.id}`
              : null

            return (
              <div
                key={asset.id}
                className="hover-row"
                style={{
                  position: 'relative',
                  display: 'grid',
                  gridTemplateColumns: GRID,
                  columnGap: 8,
                  padding: '0 20px',
                  alignItems: 'center',
                  minHeight: 52,
                  borderBottom: i < assets.length - 1
                    ? '1px solid rgba(255,255,255,0.04)'
                    : 'none',
                  transition: 'background 0.1s',
                }}
              >
                {/* Overlay link — cobre a linha toda e leva ao detalhe do ativo */}
                <Link
                  href={`/assets/${asset.id}`}
                  aria-label={`Ver detalhes de ${asset.name}`}
                  style={{ position: 'absolute', inset: 0, zIndex: 0 }}
                />

                {/* Category icon */}
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    pointerEvents: 'none',
                  }}>
                    <CategoryIcon name={asset.category.icon} />
                  </div>
                </div>

                {/* Nome + serial */}
                <div style={{ position: 'relative', zIndex: 1, paddingRight: 12, minWidth: 0, pointerEvents: 'none' }}>
                  <p style={{
                    fontSize: 13, fontWeight: 600, color: '#c8d6e5',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    lineHeight: 1.3,
                  }}>
                    {asset.name}
                  </p>
                  {asset.serialNumber && (
                    <p style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10, color: '#2d4060',
                      marginTop: 2, lineHeight: 1,
                    }}>
                      S/N: {asset.serialNumber}
                    </p>
                  )}
                </div>

                {/* Nº do ativo (tag) */}
                <div style={{ position: 'relative', zIndex: 1, textAlign: 'right' as const, paddingRight: 12, pointerEvents: 'none' }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12, fontWeight: 600,
                    color: '#4a6580',
                  }}>
                    {asset.tag}
                  </span>
                </div>

                {/* Categoria */}
                <div style={{ position: 'relative', zIndex: 1, paddingRight: 10, pointerEvents: 'none' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '3px 9px', borderRadius: 5,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10, color: '#4a6580',
                    whiteSpace: 'nowrap',
                  }}>
                    {asset.category.name}
                  </span>
                </div>

                {/* Alocado para — link interativo */}
                <div style={{ position: 'relative', zIndex: 1, paddingRight: 10 }}>
                  {asset.assignedToUser && userHref ? (
                    <Link
                      href={userHref}
                      title={`Ver todos os ativos de ${asset.assignedToUser.name}`}
                      style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none' }}
                      className="interactive-cell"
                    >
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        background: 'rgba(0,217,184,0.12)',
                        border: '1px solid rgba(0,217,184,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 8, fontWeight: 700, color: '#00d9b8',
                        }}>
                          {asset.assignedToUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <span style={{
                        fontSize: 12, color: '#7a9bbc',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {asset.assignedToUser.name.split(' ').slice(0, 2).join(' ')}
                      </span>
                    </Link>
                  ) : (
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10, color: '#1e3048', fontStyle: 'italic',
                    }}>
                      não alocado
                    </span>
                  )}
                </div>

                {/* Local — link interativo */}
                <div style={{ position: 'relative', zIndex: 1, paddingRight: 10 }}>
                  {asset.location && locationHref ? (
                    <Link
                      href={locationHref}
                      title={`Ver todos os ativos em ${asset.location}`}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}
                      className="interactive-cell"
                    >
                      <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#3d5068" strokeWidth={2} style={{ flexShrink: 0 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span style={{
                        fontSize: 12, color: '#4a6580',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {asset.location}
                      </span>
                    </Link>
                  ) : (
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10, color: '#1e3048',
                    }}>—</span>
                  )}
                </div>

                {/* Performance score */}
                <div style={{ position: 'relative', zIndex: 1, paddingRight: 12, pointerEvents: 'none' }}>
                  {perf && score !== null ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 9, fontWeight: 700,
                          color: perf.color, letterSpacing: '0.05em',
                        }}>
                          {perf.label.toUpperCase()}
                        </span>
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 10, color: perf.color,
                        }}>
                          {score}
                        </span>
                      </div>
                      <div style={{
                        height: 3, borderRadius: 2,
                        background: perf.track,
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%', borderRadius: 2,
                          width: `${score}%`,
                          background: perf.color,
                        }} />
                      </div>
                    </div>
                  ) : (
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10, color: '#1e3048',
                    }}>—</span>
                  )}
                </div>

                {/* Situação */}
                <div style={{ position: 'relative', zIndex: 1, pointerEvents: 'none' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 10px', borderRadius: 6,
                    background: st.bg,
                    border: `1px solid ${st.dot}22`,
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: st.dot, flexShrink: 0,
                      boxShadow: `0 0 5px ${st.dot}88`,
                    }} />
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10, fontWeight: 700, color: st.color,
                      whiteSpace: 'nowrap',
                    }}>
                      {st.label}
                    </span>
                  </span>
                </div>

                {/* Quick actions */}
                <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <AssetQuickActions
                    assetId={asset.id}
                    assetStatus={asset.status}
                    assetName={asset.name}
                    isAdmin={isAdmin}
                    users={activeUsers}
                    variant="row"
                  />
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      {assets.length > 0 && (
        <p style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
          color: '#1e3048', textAlign: 'center',
        }}>
          Exibindo {assets.length} de {totalCount} ativos · clique em qualquer linha para ver detalhes
        </p>
      )}
    </div>
  )
}

// ── Shared header cell style ─────────────────────────────────────────────
const thStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 9, fontWeight: 700,
  color: '#2d4060', letterSpacing: '0.08em',
  whiteSpace: 'nowrap',
}
