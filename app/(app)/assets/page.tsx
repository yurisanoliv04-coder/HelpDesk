import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { TabSaverLink } from '@/components/ui/TabSaverLink'
import { Suspense } from 'react'
import { Pencil } from 'lucide-react'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import AssetQuickActions from '@/components/assets/AssetQuickActions'
import AssetCheckButton from '@/components/assets/AssetCheckButton'
import AssetsFilters from '@/components/assets/AssetsFilters'
import AssetsDeptChart, { type DeptStat } from '@/components/assets/AssetsDeptChart'
import { AssetSelectionProvider } from '@/components/assets/AssetSelectionProvider'
import { AssetSelectCheckbox } from '@/components/assets/AssetSelectCheckbox'
import { AssetSelectAll } from '@/components/assets/AssetSelectAll'
import { PaginationBar } from '@/components/ui/PaginationBar'

const PAGE_SIZE = 50


// ── Status config ──────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  STOCK:       { label: 'Estoque',    color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', dot: '#64748b' },
  DEPLOYED:    { label: 'Implantado', color: '#34d399', bg: 'rgba(52,211,153,0.08)',  dot: '#34d399' },
  MAINTENANCE: { label: 'Manutenção', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  dot: '#fbbf24' },
  DISCARDED:   { label: 'Descartado', color: '#f87171', bg: 'rgba(248,113,113,0.08)', dot: '#f87171' },
  LOANED:      { label: 'Emprestado', color: '#38bdf8', bg: 'rgba(56,189,248,0.08)',  dot: '#38bdf8' },
  IRREGULAR:   { label: 'Irregular',  color: '#f97316', bg: 'rgba(249,115,22,0.08)',  dot: '#f97316' },
}

const perfConfig: Record<string, { label: string; color: string; track: string }> = {
  BOM:          { label: 'Bom',          color: '#34d399', track: 'rgba(52,211,153,0.15)'  },
  INTERMEDIARIO:{ label: 'Intermediário', color: '#fbbf24', track: 'rgba(251,191,36,0.15)'  },
  RUIM:         { label: 'Ruim',         color: '#f87171', track: 'rgba(248,113,113,0.15)' },
}

// Grid columns — shared between header and rows
// checkbox | icon | name | tag | category | assigned | location | performance | status | action | edit | menu
const GRID = '36px 44px minmax(160px,1fr) minmax(140px,1.2fr) 100px 130px 150px 130px 110px 100px 90px 28px 28px'

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; performance?: string; q?: string; location?: string; userId?: string; categoryId?: string; modelId?: string; page?: string }>
}) {
  const session = await auth()
  const role = session?.user.role
  if (role === 'COLABORADOR' || role === 'AUXILIAR_TI') redirect('/dashboard')

  const sp = await searchParams

  // Restaura o último filtro ativo quando o usuário chega sem nenhum parâmetro
  if (!sp.status && !sp.performance && !sp.q && !sp.location && !sp.userId && !sp.categoryId && !sp.modelId) {
    const cookieStore = await cookies()
    const saved = cookieStore.get('hd_assets_filter')?.value
    if (saved) redirect(`/assets?${decodeURIComponent(saved)}`)
  }

  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)
  const skip = (page - 1) * PAGE_SIZE

  const isAdmin = role === 'ADMIN'

  // Pré-busca IDs de categorias de patrimônio (exclui ACCESSORY e DISPOSABLE)
  // groupBy não suporta filtros de relação — precisa de IDs escalares
  const patrimonioCats = await prisma.assetCategory.findMany({
    where: { kind: { notIn: ['ACCESSORY', 'DISPOSABLE'] } },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
  const patrimonioCatIds = patrimonioCats.map(c => c.id)

  // Exclui acessórios e consumíveis — esses ficam em /consumiveis
  const where: Record<string, unknown> = {
    categoryId: { in: patrimonioCatIds },
  }
  if (sp.status)      where.status           = sp.status
  if (sp.performance) where.performanceLabel = sp.performance
  if (sp.location)    where.location         = sp.location
  if (sp.userId)      where.assignedToUserId = sp.userId
  if (sp.categoryId)  where.categoryId       = sp.categoryId
  if (sp.modelId)     where.modelId          = sp.modelId
  if (sp.q) {
    const q = sp.q
    where.OR = [
      { name:         { contains: q, mode: 'insensitive' } },
      { tag:          { contains: q, mode: 'insensitive' } },
      { serialNumber: { contains: q, mode: 'insensitive' } },
      { location:     { contains: q, mode: 'insensitive' } },
      { notes:        { contains: q, mode: 'insensitive' } },
      { cpuModel:     { contains: q, mode: 'insensitive' } },
      { category:     { name: { contains: q, mode: 'insensitive' } } },
      { assignedToUser: { name: { contains: q, mode: 'insensitive' } } },
      { movements: { some: {
        OR: [
          { notes:      { contains: q, mode: 'insensitive' } },
          { toLocation: { contains: q, mode: 'insensitive' } },
          { actor:      { name: { contains: q, mode: 'insensitive' } } },
        ],
      }}},
    ]
  }

  const [
    assets,
    filteredTotal,
    counts,
    perfCounts,
    filteredUser,
    activeUsers,
    locationRows,
    deployedForChart,
    departments,
  ] = await Promise.all([
    prisma.asset.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: PAGE_SIZE,
      skip,
      include: {
        category:       true,
        assignedToUser: { select: { id: true, name: true } },
        model:          { select: { id: true, name: true, manufacturer: true, imageData: true } },
      },
    }),
    prisma.asset.count({ where }),
    prisma.asset.groupBy({ by: ['status'],           where: { categoryId: { in: patrimonioCatIds } }, _count: { _all: true } }),
    prisma.asset.groupBy({ by: ['performanceLabel'], where: { categoryId: { in: patrimonioCatIds } }, _count: { _all: true } }),
    sp.userId
      ? prisma.user.findUnique({ where: { id: sp.userId }, select: { name: true } })
      : Promise.resolve(null),
    prisma.user.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.asset.findMany({
      select: { location: true }, distinct: ['location'],
      where: { categoryId: { in: patrimonioCatIds }, location: { not: null } }, orderBy: { location: 'asc' },
    }),
    prisma.asset.findMany({
      where: { categoryId: { in: patrimonioCatIds }, location: { not: null } },
      select: { performanceLabel: true, location: true },
    }),
    prisma.department.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ])

  const locationOptions = [
    'Departamento de T.I',
    'Estoque T.I',
    ...departments.map(d => d.name),
  ].filter((v, i, a) => a.indexOf(v) === i)

  // ── Count maps ─────────────────────────────────────────────────────────
  const countMap  = Object.fromEntries(counts.map(c => [c.status, c._count._all]))
  const perfMap: Record<string, number> = {}
  for (const p of perfCounts) {
    if (p.performanceLabel) perfMap[p.performanceLabel] = p._count._all
  }
  const totalCount = Object.values(countMap).reduce((a, b) => a + b, 0)
  const totalPages = Math.ceil(filteredTotal / PAGE_SIZE)

  // ── Location chart data ─────────────────────────────────────────────────
  const locMap: Record<string, DeptStat> = {}
  for (const asset of deployedForChart) {
    const loc = asset.location ?? 'Sem local'
    if (!locMap[loc]) locMap[loc] = { name: loc, BOM: 0, INTERMEDIARIO: 0, RUIM: 0, NONE: 0 }
    const perf = asset.performanceLabel
    if (perf === 'BOM') locMap[loc].BOM++
    else if (perf === 'INTERMEDIARIO') locMap[loc].INTERMEDIARIO++
    else if (perf === 'RUIM') locMap[loc].RUIM++
    else locMap[loc].NONE++
  }
  const deptChartData = Object.values(locMap)
    .sort((a, b) => (b.BOM + b.INTERMEDIARIO + b.RUIM + b.NONE) - (a.BOM + a.INTERMEDIARIO + a.RUIM + a.NONE))

  // ── Active filter label ─────────────────────────────────────────────────
  const perfLabelMap: Record<string, string> = { BOM: 'Bom', INTERMEDIARIO: 'Intermediário', RUIM: 'Ruim' }
  const activeFilterLabel = sp.userId
    ? `Ativos de ${filteredUser?.name ?? 'usuário'}`
    : sp.location
    ? `Local: ${sp.location}`
    : sp.performance
    ? `Performance: ${perfLabelMap[sp.performance] ?? sp.performance}`
    : null

  // ── Stat cards (interactive) ────────────────────────────────────────────
  const activeCardKey = sp.performance === 'RUIM' ? 'RUIM' : (sp.status ?? 'ALL')

  const statCards = [
    { key: 'ALL',         label: 'Total de Ativos', value: totalCount,                color: '#00d9b8', bg: 'rgba(0,217,184,0.07)',    border: 'rgba(0,217,184,0.18)',   glowRgb: '0,217,184',   icon: '📦', href: '/assets' },
    { key: 'DEPLOYED',    label: 'Implantados',     value: countMap.DEPLOYED ?? 0,    color: '#34d399', bg: 'rgba(52,211,153,0.07)',   border: 'rgba(52,211,153,0.18)',  glowRgb: '52,211,153',  icon: '✅', href: '/assets?status=DEPLOYED' },
    { key: 'STOCK',       label: 'Em Estoque',      value: countMap.STOCK ?? 0,       color: '#94a3b8', bg: 'rgba(148,163,184,0.07)',  border: 'rgba(148,163,184,0.18)', glowRgb: '148,163,184', icon: '🗄️', href: '/assets?status=STOCK' },
    { key: 'MAINTENANCE', label: 'Manutenção',      value: countMap.MAINTENANCE ?? 0, color: '#fbbf24', bg: 'rgba(251,191,36,0.07)',   border: 'rgba(251,191,36,0.18)',  glowRgb: '251,191,36',  icon: '🔧', href: '/assets?status=MAINTENANCE' },
    { key: 'RUIM',        label: 'Ruins',           value: perfMap.RUIM ?? 0,          color: '#f87171', bg: 'rgba(248,113,113,0.07)',  border: 'rgba(248,113,113,0.18)', glowRgb: '248,113,113', icon: '⚠️', href: '/assets?performance=RUIM' },
  ]

  // ── Status filter chips ─────────────────────────────────────────────────
  const statusFilters = [
    { key: null,          label: 'Todos',       href: '/assets',                       count: totalCount },
    { key: 'DEPLOYED',    label: 'Implantados', href: '/assets?status=DEPLOYED',       count: countMap.DEPLOYED ?? 0 },
    { key: 'STOCK',       label: 'Estoque',     href: '/assets?status=STOCK',          count: countMap.STOCK ?? 0 },
    { key: 'MAINTENANCE', label: 'Manutenção',  href: '/assets?status=MAINTENANCE',    count: countMap.MAINTENANCE ?? 0 },
    { key: 'LOANED',      label: 'Emprestados', href: '/assets?status=LOANED',         count: countMap.LOANED ?? 0 },
    { key: 'DISCARDED',   label: 'Descartados', href: '/assets?status=DISCARDED',      count: countMap.DISCARDED ?? 0 },
    { key: 'IRREGULAR',   label: 'Irregulares', href: '/assets?status=IRREGULAR',      count: countMap.IRREGULAR ?? 0 },
  ]
  const activeStatusChip = sp.status ?? null

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060', letterSpacing: '0.1em' }}>SISTEMA</span>
            <span style={{ color: '#1e3048', fontSize: 10 }}>/</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#00d9b8', letterSpacing: '0.1em' }}>PATRIMÔNIO</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e2eaf4', letterSpacing: '-0.01em', lineHeight: 1 }}>
            Gestão de Patrimônio
          </h1>
          <p style={{ fontSize: 13, color: '#3d5068', marginTop: 6 }}>
            {filteredTotal} {filteredTotal === 1 ? 'ativo encontrado' : 'ativos encontrados'}
            {activeFilterLabel ? (
              <span style={{ color: '#00d9b8' }}> · {activeFilterLabel}</span>
            ) : Object.keys(where).length > 0 ? (
              <span style={{ color: '#2d4060' }}> com filtros ativos</span>
            ) : null}
          </p>
        </div>

        <Link
          href="/assets/new"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 8,
            background: 'rgba(0,217,184,0.12)', border: '1px solid rgba(0,217,184,0.3)',
            fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
            color: '#00d9b8', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
            boxShadow: '0 0 20px rgba(0,217,184,0.06)',
          }}
        >
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Novo ativo
        </Link>
      </div>

      {/* ── Stat cards (interactive) ──────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {statCards.map(s => {
          const isActive = activeCardKey === s.key
          // cookieValue = query string sem o "/assets?" prefixo; '' para "Todos"
          const filterValue = s.href.includes('?') ? s.href.split('?')[1] : ''
          return (
            <TabSaverLink
              key={s.key}
              href={s.href}
              cookieKey="hd_assets_filter"
              cookieValue={filterValue}
              style={{
                background: isActive ? `rgba(${s.glowRgb},0.11)` : s.bg,
                border: `1.5px solid ${isActive ? s.color : s.border}`,
                borderRadius: 12, padding: '16px 18px',
                display: 'flex', alignItems: 'center', gap: 14,
                textDecoration: 'none',
                boxShadow: isActive ? `0 0 22px rgba(${s.glowRgb},0.15)` : 'none',
                transition: 'all 0.12s',
                position: 'relative', overflow: 'hidden',
              }}
            >
              {isActive && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                  background: s.color,
                  borderRadius: '12px 12px 0 0',
                }} />
              )}
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: s.bg, border: `1px solid ${s.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>
                {s.icon}
              </div>
              <div>
                <p style={{
                  fontSize: 26, fontWeight: 700, color: s.color,
                  lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                }}>
                  {s.value}
                </p>
                <p style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                  color: isActive ? s.color : '#3d5068', marginTop: 3,
                  fontWeight: 600, letterSpacing: '0.05em',
                }}>
                  {s.label.toUpperCase()}
                </p>
              </div>
            </TabSaverLink>
          )
        })}
      </div>

      {/* ── Status chips ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {statusFilters.map(f => {
          const isActive = activeStatusChip === f.key
          const filterValue = f.href.includes('?') ? f.href.split('?')[1] : ''
          return (
            <TabSaverLink
              key={f.href}
              href={f.href}
              cookieKey="hd_assets_filter"
              cookieValue={filterValue}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 7,
                background: isActive ? 'rgba(0,217,184,0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isActive ? 'rgba(0,217,184,0.35)' : 'rgba(255,255,255,0.07)'}`,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11, fontWeight: isActive ? 700 : 500,
                color: isActive ? '#00d9b8' : '#3d5068',
                textDecoration: 'none',
              }}
            >
              {f.label}
              <span style={{
                fontSize: 10, color: isActive ? '#00d9b8' : '#2d4060',
                background: isActive ? 'rgba(0,217,184,0.15)' : 'rgba(255,255,255,0.05)',
                padding: '1px 6px', borderRadius: 5,
              }}>
                {f.count}
              </span>
            </TabSaverLink>
          )
        })}
      </div>

      {/* ── Advanced filters (client) ─────────────────────────────────────── */}
      <Suspense fallback={<div style={{ height: 72 }} />}>
        <AssetsFilters
          locations={locationRows.map(l => l.location!)}
          categories={patrimonioCats}
          perfCounts={{ BOM: perfMap.BOM ?? 0, INTERMEDIARIO: perfMap.INTERMEDIARIO ?? 0, RUIM: perfMap.RUIM ?? 0 }}
        />
      </Suspense>

      {/* ── Department chart ──────────────────────────────────────────────── */}
      <div style={{ height: 260 }}>
        <AssetsDeptChart data={deptChartData} />
      </div>

      {/* ── Tabela ───────────────────────────────────────────────────────── */}
      <AssetSelectionProvider
        assetIds={assets.map(a => ({ id: a.id, tag: a.tag, status: a.status }))}
        locationOptions={locationOptions}
        technicians={activeUsers}
      >
      <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>

        {/* Cabeçalho da tabela */}
        <div style={{
          display: 'grid', gridTemplateColumns: GRID, columnGap: 8,
          padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(255,255,255,0.02)', alignItems: 'center', height: 38,
        }}>
          {/* Select-all checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AssetSelectAll allIds={assets.map(a => a.id)} />
          </div>
          <div />
          <div style={thStyle}>NOME DO ATIVO</div>
          <div style={thStyle}>MODELO</div>
          <div style={{ ...thStyle, textAlign: 'right' as const }}>Nº</div>
          <div style={thStyle}>CATEGORIA</div>
          <div style={thStyle}>ALOCADO PARA</div>
          <div style={thStyle}>LOCAL</div>
          <div style={thStyle}>PERFORMANCE</div>
          <div style={thStyle}>SITUAÇÃO</div>
          <div style={thStyle}>AÇÃO</div>
          <div />
          <div />
        </div>

        {/* Linhas */}
        {assets.length === 0 ? (
          <div style={{
            padding: '60px 24px', textAlign: 'center',
            fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#2d4060',
          }}>
            — nenhum ativo encontrado —
          </div>
        ) : assets.map((asset, i) => {
          const st   = statusConfig[asset.status] ?? statusConfig.STOCK
          const perf = asset.performanceLabel ? perfConfig[asset.performanceLabel] : null
          const score = asset.performanceScore
          const locationHref = asset.location ? `/assets?location=${encodeURIComponent(asset.location)}` : null

          return (
            <div
              key={asset.id}
              className="hover-row"
              style={{
                position: 'relative', display: 'grid', gridTemplateColumns: GRID,
                columnGap: 8, padding: '0 20px', alignItems: 'center', minHeight: 52,
                borderBottom: i < assets.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                transition: 'background 0.1s',
              }}
            >
              <Link href={`/assets/${asset.id}`} aria-label={`Ver detalhes de ${asset.name}`} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

              {/* Checkbox */}
              <div style={{ position: 'relative', zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AssetSelectCheckbox assetId={asset.id} />
              </div>

              {/* Imagem do modelo / ícone de categoria */}
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {asset.model?.imageData
                    ? <img
                        src={asset.model.imageData}
                        alt={asset.model.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 3 }}
                      />
                    : <CategoryIcon name={asset.category.icon} />
                  }
                </div>
              </div>

              {/* Nome + serial */}
              <div style={{ position: 'relative', zIndex: 1, paddingRight: 12, minWidth: 0, pointerEvents: 'none' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#c8d6e5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                  {asset.name}
                </p>
                {asset.serialNumber && (
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060', marginTop: 2 }}>
                    S/N: {asset.serialNumber}
                  </p>
                )}
              </div>

              {/* Modelo */}
              <div style={{ position: 'relative', zIndex: 1, paddingRight: 12, minWidth: 0, pointerEvents: 'none' }}>
                {asset.model ? (
                  <>
                    {asset.model.manufacturer && (
                      <p style={{ fontSize: 10, color: '#4a6580', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3, marginBottom: 1 }}>
                        {asset.model.manufacturer}
                      </p>
                    )}
                    <p style={{ fontSize: 12, fontWeight: 500, color: '#7ab3d9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                      {asset.model.name}
                    </p>
                  </>
                ) : (
                  <span style={{ fontSize: 11, color: '#2d3f55' }}>—</span>
                )}
              </div>

              {/* Tag */}
              <div style={{ position: 'relative', zIndex: 1, textAlign: 'right' as const, paddingRight: 12, pointerEvents: 'none' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: '#4a6580' }}>
                  {asset.tag}
                </span>
              </div>

              {/* Categoria */}
              <div style={{ position: 'relative', zIndex: 1, paddingRight: 10, pointerEvents: 'none' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 5,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#4a6580', whiteSpace: 'nowrap',
                }}>
                  {asset.category.name}
                </span>
              </div>

              {/* Alocado para */}
              <div style={{ position: 'relative', zIndex: 1, paddingRight: 10 }}>
                {asset.assignedToUser ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, background: 'rgba(0,217,184,0.12)', border: '1px solid rgba(0,217,184,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700, color: '#00d9b8' }}>
                        {asset.assignedToUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: '#7a9bbc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {asset.assignedToUser.name.split(' ').slice(0, 2).join(' ')}
                    </span>
                  </div>
                ) : (
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#1e3048', fontStyle: 'italic' }}>não alocado</span>
                )}
              </div>

              {/* Local */}
              <div style={{ position: 'relative', zIndex: 1, paddingRight: 10 }}>
                {asset.location && locationHref ? (
                  <Link href={locationHref} style={{ display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none' }} className="interactive-cell">
                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#3d5068" strokeWidth={2} style={{ flexShrink: 0 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span style={{ fontSize: 12, color: '#4a6580', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.location}</span>
                  </Link>
                ) : (
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#1e3048' }}>—</span>
                )}
              </div>

              {/* Performance */}
              <div style={{ position: 'relative', zIndex: 1, paddingRight: 12, pointerEvents: 'none' }}>
                {perf && score !== null ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: perf.color, letterSpacing: '0.05em' }}>
                        {perf.label.toUpperCase()}
                      </span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: perf.color }}>{score}</span>
                    </div>
                    <div style={{ height: 3, borderRadius: 2, background: perf.track, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 2, width: `${score}%`, background: perf.color }} />
                    </div>
                  </div>
                ) : (
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#1e3048' }}>—</span>
                )}
              </div>

              {/* Situação */}
              <div style={{ position: 'relative', zIndex: 1, pointerEvents: 'none' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6,
                  background: st.bg, border: `1px solid ${st.dot}22`,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot, flexShrink: 0, boxShadow: `0 0 5px ${st.dot}88` }} />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: st.color, whiteSpace: 'nowrap' }}>
                    {st.label}
                  </span>
                </span>
              </div>

              {/* Check-in / Check-out inline button */}
              <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center' }}>
                <AssetCheckButton
                  assetId={asset.id}
                  assetTag={asset.tag}
                  assetStatus={asset.status}
                  users={activeUsers}
                  locationOptions={locationOptions}
                />
              </div>

              {/* Edit button */}
              <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Link
                  href={`/assets/${asset.id}/edit`}
                  title="Editar ativo"
                  style={{
                    width: 24, height: 24, borderRadius: 6,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.07)',
                    color: '#3d5068',
                    transition: 'all 0.12s',
                    textDecoration: 'none',
                  }}
                  className="edit-btn"
                >
                  <Pencil size={11} />
                </Link>
              </div>

              {/* Quick actions (⋮ menu — clone, delete) */}
              <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <AssetQuickActions
                  assetId={asset.id} assetStatus={asset.status} assetName={asset.name}
                  isAdmin={isAdmin} users={activeUsers} variant="row"
                />
              </div>
            </div>
          )
        })}
      </div>
      </AssetSelectionProvider>

      {/* Footer */}
      {filteredTotal > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#1e3048' }}>
            Página {page} de {totalPages} · {filteredTotal} ativo{filteredTotal !== 1 ? 's' : ''} · clique na linha para ver detalhes
          </p>
          <PaginationBar
            page={page}
            totalPages={totalPages}
            buildHref={p => {
              const params = new URLSearchParams()
              if (sp.status)      params.set('status', sp.status)
              if (sp.performance) params.set('performance', sp.performance)
              if (sp.q)           params.set('q', sp.q)
              if (sp.location)    params.set('location', sp.location)
              if (sp.userId)      params.set('userId', sp.userId)
              if (sp.categoryId)  params.set('categoryId', sp.categoryId)
              params.set('page', String(p))
              return `/assets?${params.toString()}`
            }}
          />
        </div>
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
