import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import AssetQuickActions from '@/components/assets/AssetQuickActions'
import AssetCheckButton from '@/components/assets/AssetCheckButton'
import { AssetSelectionProvider } from '@/components/assets/AssetSelectionProvider'
import { AssetSelectCheckbox } from '@/components/assets/AssetSelectCheckbox'
import { AssetSelectAll } from '@/components/assets/AssetSelectAll'
import { PaginationBar } from '@/components/ui/PaginationBar'
import { TabSaverLink } from '@/components/ui/TabSaverLink'
import { UrlStateSaver } from '@/components/ui/UrlStateSaver'
import ConsumiveisFilters from '@/components/assets/ConsumiveisFilters'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  STOCK:       { label: 'Estoque',    color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', dot: '#64748b' },
  DEPLOYED:    { label: 'Implantado', color: '#34d399', bg: 'rgba(52,211,153,0.08)',  dot: '#34d399' },
  MAINTENANCE: { label: 'Manutenção', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  dot: '#fbbf24' },
  DISCARDED:   { label: 'Descartado', color: '#f87171', bg: 'rgba(248,113,113,0.08)', dot: '#f87171' },
  LOANED:      { label: 'Emprestado', color: '#38bdf8', bg: 'rgba(56,189,248,0.08)',  dot: '#38bdf8' },
}

const kindConfig = {
  ACCESSORY:  { label: 'Acessório',   color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',  border: 'rgba(167,139,250,0.25)' },
  DISPOSABLE: { label: 'Consumível',  color: '#fb923c', bg: 'rgba(251,146,60,0.1)',   border: 'rgba(251,146,60,0.25)'  },
}

// checkbox | icon | name | tag | category | kind | assigned | location | status | action | edit | menu
const GRID = '36px 44px minmax(180px,1fr) 90px 140px 100px 150px 130px 110px 90px 28px 28px'

type Kind = 'ACCESSORY' | 'DISPOSABLE'

export default async function ConsumiveisPage({
  searchParams,
}: {
  searchParams: Promise<{
    kind?: string; status?: string; q?: string;
    categoryId?: string; page?: string; location?: string
  }>
}) {
  const session = await auth()
  const role = session?.user.role
  if (role === 'COLABORADOR' || role === 'AUXILIAR_TI') redirect('/dashboard')

  const sp = await searchParams

  // ── Tab memory: redirect to last visited sub-section ──────────────────────
  // "__compras__" sentinel = user was on the Compras sub-page
  // any other non-empty value = URL query-string for the list page (kind/status/…)
  const hasAnyFilter = sp.kind || sp.status || sp.q || sp.categoryId || sp.location
  if (!hasAnyFilter) {
    const cookieStore = await cookies()
    const saved = cookieStore.get('hd_consumiveis_filter')?.value
    if (saved === '__compras__') redirect('/consumiveis/compras')
    else if (saved && saved !== '') redirect(`/consumiveis?${decodeURIComponent(saved)}`)
  }

  const page  = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)
  const skip  = (page - 1) * PAGE_SIZE
  const isAdmin = role === 'ADMIN'

  const activeKind = (sp.kind as Kind | undefined) ?? null   // null = todos

  // ── pre-fetch categories (groupBy não suporta filtros de relação) ─────────
  const assetCategories = await prisma.assetCategory.findMany({
    where: { kind: { in: ['ACCESSORY', 'DISPOSABLE'] } },
    select: { id: true, name: true, kind: true },
    orderBy: { name: 'asc' },
  })
  const consumCatIds = assetCategories.map(c => c.id)

  // ── where clause ──────────────────────────────────────────────────────────
  const where: Record<string, unknown> = {
    category: {
      kind: activeKind
        ? activeKind
        : { in: ['ACCESSORY', 'DISPOSABLE'] },
    },
  }
  if (sp.status)     where.status     = sp.status
  if (sp.categoryId) where.categoryId = sp.categoryId
  if (sp.location)   where.location   = sp.location
  if (sp.q) {
    const q = sp.q
    where.OR = [
      { name:         { contains: q, mode: 'insensitive' } },
      { tag:          { contains: q, mode: 'insensitive' } },
      { serialNumber: { contains: q, mode: 'insensitive' } },
      { location:     { contains: q, mode: 'insensitive' } },
      { notes:        { contains: q, mode: 'insensitive' } },
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
    statusCounts,
    accCount,
    dispCount,
    activeUsers,
    locationRows,
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
      },
    }),
    prisma.asset.count({ where }),
    // groupBy usa filtro escalar (categoryId) — filtros de relação não são
    // suportados em groupBy pelo Prisma
    prisma.asset.groupBy({
      by: ['status'],
      where: { categoryId: { in: consumCatIds } },
      _count: { _all: true },
    }),
    prisma.asset.count({ where: { category: { kind: 'ACCESSORY' } } }),
    prisma.asset.count({ where: { category: { kind: 'DISPOSABLE' } } }),
    prisma.user.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.asset.findMany({
      where: { category: { kind: { in: ['ACCESSORY', 'DISPOSABLE'] } }, location: { not: null } },
      select: { location: true }, distinct: ['location'],
      orderBy: { location: 'asc' },
    }),
    prisma.department.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ])

  const totalAll = accCount + dispCount
  const countMap = Object.fromEntries(statusCounts.map(c => [c.status, c._count._all]))
  const totalPages = Math.ceil(filteredTotal / PAGE_SIZE)

  const locationOptions = [
    'Departamento de T.I', 'Estoque T.I',
    ...departments.map(d => d.name),
  ].filter((v, i, a) => a.indexOf(v) === i)

  // ── stat cards ──────────────────────────────────────────────────────────
  const statCards = [
    { key: null,        label: 'Total',       value: totalAll,             color: '#a78bfa', glowRgb: '167,139,250', icon: '🧩', href: '/consumiveis' },
    { key: 'ACCESSORY', label: 'Acessórios',  value: accCount,             color: '#a78bfa', glowRgb: '167,139,250', icon: '🖱', href: '/consumiveis?kind=ACCESSORY' },
    { key: 'DISPOSABLE',label: 'Consumíveis', value: dispCount,            color: '#fb923c', glowRgb: '251,146,60',  icon: '📦', href: '/consumiveis?kind=DISPOSABLE' },
    { key: '__DEPLOYED',label: 'Implantados', value: countMap.DEPLOYED ?? 0, color: '#34d399', glowRgb: '52,211,153',  icon: '✅', href: '/consumiveis?status=DEPLOYED' },
    { key: '__STOCK',   label: 'Em Estoque',  value: countMap.STOCK ?? 0,    color: '#94a3b8', glowRgb: '148,163,184', icon: '🗄️', href: '/consumiveis?status=STOCK' },
  ]

  // ── tab chips ─────────────────────────────────────────────────────────
  const kindTabs = [
    { key: null,         label: 'Todos',      count: totalAll,  href: '/consumiveis' },
    { key: 'ACCESSORY',  label: 'Acessórios', count: accCount,  href: '/consumiveis?kind=ACCESSORY' },
    { key: 'DISPOSABLE', label: 'Consumíveis',count: dispCount, href: '/consumiveis?kind=DISPOSABLE' },
  ]

  // ── status chips ──────────────────────────────────────────────────────
  const statusFilters = [
    { key: null,          label: 'Todos',       count: filteredTotal,          href: baseHref(sp, null, null) },
    { key: 'DEPLOYED',    label: 'Implantados', count: countMap.DEPLOYED ?? 0, href: baseHref(sp, 'status', 'DEPLOYED') },
    { key: 'STOCK',       label: 'Estoque',     count: countMap.STOCK ?? 0,    href: baseHref(sp, 'status', 'STOCK') },
    { key: 'MAINTENANCE', label: 'Manutenção',  count: countMap.MAINTENANCE ?? 0, href: baseHref(sp, 'status', 'MAINTENANCE') },
    { key: 'LOANED',      label: 'Emprestados', count: countMap.LOANED ?? 0,   href: baseHref(sp, 'status', 'LOANED') },
    { key: 'DISCARDED',   label: 'Descartados', count: countMap.DISCARDED ?? 0, href: baseHref(sp, 'status', 'DISCARDED') },
  ]

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Salva automaticamente os filtros ativos no cookie ao renderizar */}
      <Suspense fallback={null}>
        <UrlStateSaver cookieKey="hd_consumiveis_filter" watchParams={['kind', 'status', 'categoryId', 'location']} />
      </Suspense>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060', letterSpacing: '0.1em' }}>SISTEMA</span>
            <span style={{ color: '#1e3048', fontSize: 10 }}>/</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#a78bfa', letterSpacing: '0.1em' }}>ACESSÓRIOS & CONSUMÍVEIS</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e2eaf4', letterSpacing: '-0.01em', lineHeight: 1 }}>
            Acessórios & Consumíveis
          </h1>
          <p style={{ fontSize: 13, color: '#3d5068', marginTop: 6 }}>
            {filteredTotal} {filteredTotal === 1 ? 'item encontrado' : 'itens encontrados'}
          </p>
        </div>

        <Link
          href="/consumiveis/novo"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 8,
            background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.28)',
            fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
            color: '#a78bfa', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Novo item
        </Link>
      </div>

      {/* ── Stat cards ────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {statCards.map(s => {
          const isActive = activeKind === s.key || (s.key === null && !activeKind && !sp.status)
            || (s.key === '__DEPLOYED' && sp.status === 'DEPLOYED')
            || (s.key === '__STOCK'    && sp.status === 'STOCK')
          return (
            <Link
              key={String(s.key)}
              href={s.href}
              style={{
                background: isActive ? `rgba(${s.glowRgb},0.11)` : `rgba(${s.glowRgb},0.05)`,
                border: `1.5px solid ${isActive ? s.color : `rgba(${s.glowRgb},0.18)`}`,
                borderRadius: 12, padding: '16px 18px',
                display: 'flex', alignItems: 'center', gap: 14,
                textDecoration: 'none',
                boxShadow: isActive ? `0 0 22px rgba(${s.glowRgb},0.12)` : 'none',
                transition: 'all 0.12s', position: 'relative', overflow: 'hidden',
              }}
            >
              {isActive && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                  background: s.color, borderRadius: '12px 12px 0 0',
                }} />
              )}
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: `rgba(${s.glowRgb},0.1)`, border: `1px solid rgba(${s.glowRgb},0.2)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>
                {s.icon}
              </div>
              <div>
                <p style={{ fontSize: 26, fontWeight: 700, color: s.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {s.value}
                </p>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: isActive ? s.color : '#3d5068', marginTop: 3, fontWeight: 600, letterSpacing: '0.05em' }}>
                  {s.label.toUpperCase()}
                </p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* ── Kind tabs + status chips ───────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Kind tabs */}
        <div style={{ display: 'flex', gap: 6 }}>
          {kindTabs.map(t => {
            const isActive = activeKind === t.key
            const kc = t.key ? kindConfig[t.key as Kind] : null
            const filterQs = t.href.includes('?') ? t.href.split('?')[1] : ''
            return (
              <TabSaverLink
                key={String(t.key)}
                href={t.href}
                cookieKey="hd_consumiveis_filter"
                cookieValue={filterQs}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '6px 14px', borderRadius: 8,
                  background: isActive ? (kc ? kc.bg : 'rgba(167,139,250,0.1)') : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isActive ? (kc ? kc.border : 'rgba(167,139,250,0.3)') : 'rgba(255,255,255,0.07)'}`,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11, fontWeight: isActive ? 700 : 500,
                  color: isActive ? (kc ? kc.color : '#a78bfa') : '#3d5068',
                  textDecoration: 'none', transition: 'all 0.1s',
                }}
              >
                {t.label}
                <span style={{
                  fontSize: 10, padding: '1px 6px', borderRadius: 5,
                  background: isActive ? (kc ? `${kc.color}18` : 'rgba(167,139,250,0.15)') : 'rgba(255,255,255,0.05)',
                  color: isActive ? (kc ? kc.color : '#a78bfa') : '#2d4060',
                }}>
                  {t.count}
                </span>
              </TabSaverLink>
            )
          })}
          {/* Compras tab — saves sentinel so returning to section goes back here */}
          <TabSaverLink
            href="/consumiveis/compras"
            cookieKey="hd_consumiveis_filter"
            cookieValue="__compras__"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '6px 14px', borderRadius: 8,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11, fontWeight: 500,
              color: '#3d5068',
              textDecoration: 'none', transition: 'all 0.1s',
            }}
          >
            🛒 Compras
          </TabSaverLink>
        </div>

        {/* Status chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {statusFilters.map(f => {
            const isActive = (sp.status ?? null) === f.key
            const filterQs = f.href.includes('?') ? f.href.split('?')[1] : ''
            return (
              <TabSaverLink
                key={String(f.key)}
                href={f.href}
                cookieKey="hd_consumiveis_filter"
                cookieValue={filterQs}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 11px', borderRadius: 6,
                  background: isActive ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isActive ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11, fontWeight: isActive ? 700 : 400,
                  color: isActive ? '#a78bfa' : '#2d4060',
                  textDecoration: 'none',
                }}
              >
                {f.label}
                <span style={{
                  fontSize: 10, padding: '1px 5px', borderRadius: 4,
                  background: isActive ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)',
                  color: isActive ? '#a78bfa' : '#1e3048',
                }}>
                  {f.count}
                </span>
              </TabSaverLink>
            )
          })}
        </div>
      </div>

      {/* ── Barra de busca + filtros ───────────────────────────────────────── */}
      <Suspense fallback={null}>
        <ConsumiveisFilters
          categories={assetCategories}
          locations={locationRows.map(l => l.location!)}
        />
      </Suspense>

      {/* ── Tabela ────────────────────────────────────────────────────────── */}
      <AssetSelectionProvider
        assetIds={assets.map(a => ({ id: a.id, tag: a.tag, status: a.status }))}
        locationOptions={locationOptions}
        technicians={activeUsers}
      >
        <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>

          {/* Cabeçalho */}
          <div style={{
            display: 'grid', gridTemplateColumns: GRID, columnGap: 8,
            padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(255,255,255,0.02)', alignItems: 'center', height: 38,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AssetSelectAll allIds={assets.map(a => a.id)} />
            </div>
            <div />
            <div style={thStyle}>NOME</div>
            <div style={{ ...thStyle, textAlign: 'right' as const }}>Nº</div>
            <div style={thStyle}>CATEGORIA</div>
            <div style={thStyle}>TIPO</div>
            <div style={thStyle}>ALOCADO PARA</div>
            <div style={thStyle}>LOCAL</div>
            <div style={thStyle}>SITUAÇÃO</div>
            <div style={thStyle}>AÇÃO</div>
            <div />
            <div />
          </div>

          {/* Linhas */}
          {assets.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#2d4060' }}>
              — nenhum item encontrado —
            </div>
          ) : assets.map((asset, i) => {
            const st  = statusConfig[asset.status] ?? statusConfig.STOCK
            const kc  = kindConfig[asset.category.kind as Kind] ?? kindConfig.ACCESSORY
            const locationHref = asset.location ? `/consumiveis?location=${encodeURIComponent(asset.location)}` : null

            return (
              <div
                key={asset.id}
                className="hover-row"
                style={{
                  position: 'relative', display: 'grid', gridTemplateColumns: GRID,
                  columnGap: 8, padding: '0 20px', alignItems: 'center', minHeight: 50,
                  borderBottom: i < assets.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  transition: 'background 0.1s',
                }}
              >
                <Link href={`/assets/${asset.id}`} aria-label={`Ver ${asset.name}`} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

                {/* Checkbox */}
                <div style={{ position: 'relative', zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AssetSelectCheckbox assetId={asset.id} />
                </div>

                {/* Ícone */}
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: `${kc.bg}`, border: `1px solid ${kc.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CategoryIcon name={asset.category.icon} color={kc.color} />
                  </div>
                </div>

                {/* Nome */}
                <div style={{ position: 'relative', zIndex: 1, paddingRight: 12, minWidth: 0, pointerEvents: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#c8d6e5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3, minWidth: 0 }}>
                      {asset.name}
                    </p>
                    {asset.quantity > 1 && (
                      <span style={{
                        flexShrink: 0, fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 10, fontWeight: 700, color: '#fbbf24',
                        background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.28)',
                        padding: '1px 7px', borderRadius: 5, lineHeight: 1.6, whiteSpace: 'nowrap',
                      }}>
                        ×{asset.quantity}
                      </span>
                    )}
                  </div>
                  {asset.serialNumber && (
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060', marginTop: 2 }}>
                      S/N: {asset.serialNumber}
                    </p>
                  )}
                </div>

                {/* Tag */}
                <div style={{ position: 'relative', zIndex: 1, textAlign: 'right' as const, paddingRight: 12, pointerEvents: 'none' }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: '#4a6580' }}>{asset.tag}</span>
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

                {/* Kind badge */}
                <div style={{ position: 'relative', zIndex: 1, pointerEvents: 'none' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 5,
                    background: kc.bg, border: `1px solid ${kc.border}`,
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: kc.color, whiteSpace: 'nowrap', fontWeight: 700,
                  }}>
                    {kc.label}
                  </span>
                </div>

                {/* Alocado para */}
                <div style={{ position: 'relative', zIndex: 1, paddingRight: 10 }}>
                  {asset.assignedToUser ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700, color: '#a78bfa' }}>
                          {asset.assignedToUser.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
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

                {/* Status */}
                <div style={{ position: 'relative', zIndex: 1, pointerEvents: 'none' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, background: st.bg, border: `1px solid ${st.dot}22` }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot, flexShrink: 0, boxShadow: `0 0 5px ${st.dot}88` }} />
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: st.color, whiteSpace: 'nowrap' }}>{st.label}</span>
                  </span>
                </div>

                {/* Check-in/out */}
                <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center' }}>
                  <AssetCheckButton
                    assetId={asset.id} assetTag={asset.tag}
                    assetStatus={asset.status} users={activeUsers}
                    locationOptions={locationOptions}
                  />
                </div>

                {/* Editar */}
                <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Link href={`/assets/${asset.id}/edit`} title="Editar" className="edit-btn" style={{
                    width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.07)', color: '#3d5068', textDecoration: 'none', transition: 'all 0.12s',
                  }}>
                    <Pencil size={11} />
                  </Link>
                </div>

                {/* Menu */}
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

      {/* Paginação */}
      {filteredTotal > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#1e3048' }}>
            Página {page} de {totalPages} · {filteredTotal} item{filteredTotal !== 1 ? 's' : ''}
          </p>
          <PaginationBar
            page={page} totalPages={totalPages}
            buildHref={p => {
              const params = new URLSearchParams()
              if (sp.kind)       params.set('kind', sp.kind)
              if (sp.status)     params.set('status', sp.status)
              if (sp.q)          params.set('q', sp.q)
              if (sp.location)   params.set('location', sp.location)
              if (sp.categoryId) params.set('categoryId', sp.categoryId)
              params.set('page', String(p))
              return `/consumiveis?${params.toString()}`
            }}
          />
        </div>
      )}
    </div>
  )
}

// ── Helper: monta href preservando kind ao trocar status ─────────────────────
function baseHref(
  sp: { kind?: string; status?: string; q?: string; location?: string; categoryId?: string },
  key: string | null,
  value: string | null,
): string {
  const p = new URLSearchParams()
  if (sp.kind)       p.set('kind', sp.kind)
  if (sp.q)          p.set('q', sp.q)
  if (sp.location)   p.set('location', sp.location)
  if (sp.categoryId) p.set('categoryId', sp.categoryId)
  if (key && value)  p.set(key, value)
  const qs = p.toString()
  return qs ? `/consumiveis?${qs}` : '/consumiveis'
}

// ── Shared header cell style ─────────────────────────────────────────────────
const thStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 9, fontWeight: 700,
  color: '#2d4060', letterSpacing: '0.08em',
  whiteSpace: 'nowrap',
}
