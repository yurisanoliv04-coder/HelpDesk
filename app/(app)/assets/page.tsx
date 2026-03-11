import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const PlusIcon = () => (
  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)

const statusConfig: Record<string, { label: string; color: string; glow: string }> = {
  STOCK:       { label: 'Estoque',    color: '#64748b', glow: 'transparent' },
  DEPLOYED:    { label: 'Implantado', color: '#34d399', glow: 'rgba(52,211,153,0.4)' },
  MAINTENANCE: { label: 'Manutenção', color: '#f59e0b', glow: 'rgba(245,158,11,0.4)' },
  DISCARDED:   { label: 'Descartado', color: '#f87171', glow: 'rgba(248,113,113,0.4)' },
  LOANED:      { label: 'Emprestado', color: '#38bdf8', glow: 'rgba(56,189,248,0.4)' },
}

const perfConfig: Record<string, { label: string; color: string; bar: string }> = {
  BOM:          { label: 'Bom',          color: '#34d399', bar: '#34d399' },
  INTERMEDIARIO:{ label: 'Intermediário', color: '#f59e0b', bar: '#f59e0b' },
  RUIM:         { label: 'Ruim',         color: '#f87171', bar: '#f87171' },
}

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: { status?: string; performance?: string }
}) {
  const session = await auth()

  if (session?.user.role === 'COLABORADOR') {
    redirect('/dashboard')
  }

  const sp = await searchParams
  const where: any = {}
  if (sp.status)      where.status           = sp.status
  if (sp.performance) where.performanceLabel = sp.performance

  const assets = await prisma.asset.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: 100,
    include: {
      category: true,
      assignedToUser: { select: { name: true } },
    },
  })

  const filters = [
    { label: 'TODOS',          href: '/assets' },
    { label: 'ESTOQUE',        href: '/assets?status=STOCK' },
    { label: 'IMPLANTADOS',    href: '/assets?status=DEPLOYED' },
    { label: 'MANUTENÇÃO',     href: '/assets?status=MAINTENANCE' },
    { label: 'RUINS',          href: '/assets?performance=RUIM' },
    { label: 'INTERMEDIÁRIOS', href: '/assets?performance=INTERMEDIARIO' },
    { label: 'BONS',           href: '/assets?performance=BOM' },
  ]

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p className="section-label" style={{ marginBottom: 10 }}>SISTEMA / PATRIMÔNIO</p>
          <h1 style={{
            fontSize: 30, fontWeight: 700,
            color: '#e2e8f0', letterSpacing: '-0.01em', lineHeight: 1,
          }}>
            Patrimônio
          </h1>
          <p style={{ fontSize: 14, color: '#3d5068', marginTop: 8 }}>
            {assets.length} {assets.length === 1 ? 'ativo encontrado' : 'ativos encontrados'}
          </p>
        </div>

        <Link
          href="/assets/new"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '9px 18px',
            background: 'rgba(0,217,184,0.1)',
            border: '1px solid rgba(0,217,184,0.25)',
            borderRadius: 6,
            color: '#00d9b8',
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 500,
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <PlusIcon />
          Novo ativo
        </Link>
      </div>

      {/* ── Filtros rápidos ──────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
        {filters.map((f) => (
          <Link key={f.href} href={f.href} className="filter-chip">
            {f.label}
          </Link>
        ))}
      </div>

      {/* ── Lista de ativos ──────────────────────────────────── */}
      <div style={{
        background: '#0d1422',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 8, overflow: 'hidden',
      }}>
        {assets.length === 0 ? (
          <p style={{
            padding: '60px 24px', textAlign: 'center',
            color: '#2d4060', fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            — nenhum ativo encontrado —
          </p>
        ) : (
          <div>
            {assets.map((asset, i) => {
              const st   = statusConfig[asset.status]
              const perf = asset.performanceLabel ? perfConfig[asset.performanceLabel] : null

              return (
                <Link
                  key={asset.id}
                  href={`/assets/${asset.id}`}
                  className="hover-row"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '13px 20px',
                    borderBottom: i < assets.length - 1
                      ? '1px solid rgba(255,255,255,0.05)'
                      : 'none',
                    textDecoration: 'none',
                    transition: 'background 0.12s',
                  }}
                >
                  {/* Tag + Name */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12, fontWeight: 600, color: '#00d9b8',
                      marginBottom: 3,
                    }}>
                      {asset.tag}
                    </p>
                    <p style={{
                      fontSize: 14, color: '#cbd5e1',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {asset.name}
                    </p>
                  </div>

                  {/* Category */}
                  <div className="hidden sm:block" style={{ flexShrink: 0 }}>
                    <span style={{
                      display: 'inline-flex',
                      padding: '3px 10px',
                      borderRadius: 3,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      fontSize: 12, color: '#64748b',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {asset.category.name}
                    </span>
                  </div>

                  {/* Assigned user */}
                  <div className="hidden lg:block" style={{ flexShrink: 0, width: 140 }}>
                    <p style={{ fontSize: 13, color: '#64748b' }}>
                      {asset.assignedToUser?.name || '—'}
                    </p>
                  </div>

                  {/* Performance score bar */}
                  {perf && asset.performanceScore !== null ? (
                    <div className="hidden xl:flex"
                      style={{ flexShrink: 0, width: 100, alignItems: 'center', gap: 8 }}
                    >
                      <div style={{
                        flex: 1, height: 4, borderRadius: 2,
                        background: 'rgba(255,255,255,0.07)',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%', borderRadius: 2,
                          width: `${asset.performanceScore}%`,
                          background: perf.bar,
                        }} />
                      </div>
                      <span style={{
                        fontSize: 12, color: perf.color,
                        fontFamily: "'JetBrains Mono', monospace",
                        flexShrink: 0,
                      }}>
                        {asset.performanceScore}
                      </span>
                    </div>
                  ) : (
                    <div className="hidden xl:block" style={{ flexShrink: 0, width: 100 }}>
                      <span style={{ fontSize: 12, color: '#2d4060', fontFamily: "'JetBrains Mono', monospace" }}>
                        sem score
                      </span>
                    </div>
                  )}

                  {/* Status dot */}
                  <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
                      background: st.color,
                      boxShadow: st.glow !== 'transparent' ? `0 0 6px ${st.glow}` : 'none',
                    }} />
                    <span style={{
                      fontSize: 12, color: st.color,
                      fontFamily: "'JetBrains Mono', monospace",
                      whiteSpace: 'nowrap',
                    }}>
                      {st.label}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
