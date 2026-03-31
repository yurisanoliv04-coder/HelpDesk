import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TabSaverLink } from '@/components/ui/TabSaverLink'
import { getPurchases } from './actions'
import PurchasesClient from './PurchasesClient'
import PurchasesFilters from './PurchasesFilters'
import PurchasesPagination from './PurchasesPagination'
import SetComprasCookie from './SetComprasCookie'

export const dynamic = 'force-dynamic'

export default async function ComprasPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string; q?: string; categoryId?: string
    dateFrom?: string; dateTo?: string
    supplier?: string; minTotal?: string; maxTotal?: string
    page?: string
  }>
}) {
  const session = await auth()
  const role = session?.user?.role
  if (role === 'COLABORADOR' || role === 'AUXILIAR_TI') redirect('/dashboard')

  const sp = await searchParams

  const currentPage = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)

  const [purchasePage, categories, counts] = await Promise.all([
    getPurchases({
      status:     sp.status,
      q:          sp.q,
      categoryId: sp.categoryId,
      dateFrom:   sp.dateFrom,
      dateTo:     sp.dateTo,
      supplier:   sp.supplier,
      minTotal:   sp.minTotal,
      maxTotal:   sp.maxTotal,
      page:       currentPage,
      pageSize:   20,
    }),
    prisma.assetCategory.findMany({
      select: { id: true, name: true, kind: true },
      orderBy: { name: 'asc' },
    }),
    Promise.all([
      prisma.purchase.count(),
      prisma.purchase.count({ where: { status: 'PENDING' } }),
      prisma.purchase.count({ where: { status: 'RECEIVED' } }),
      prisma.purchase.count({ where: { status: 'CANCELED' } }),
    ]),
  ])

  const { data: purchases, total: filteredTotal, totalPages } = purchasePage
  const [total, pending, received, canceled] = counts

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Sets/maintains cookie so returning to this section remembers Compras */}
      <SetComprasCookie />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060', letterSpacing: '0.1em' }}>SISTEMA</span>
            <span style={{ color: '#1e3048', fontSize: 10 }}>/</span>
            <Link href="/consumiveis" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#a78bfa', letterSpacing: '0.1em', textDecoration: 'none' }}>ACESSÓRIOS & CONSUMÍVEIS</Link>
            <span style={{ color: '#1e3048', fontSize: 10 }}>/</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#34d399', letterSpacing: '0.1em' }}>COMPRAS</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e2eaf4', letterSpacing: '-0.01em', lineHeight: 1 }}>
            Compras
          </h1>
          <p style={{ fontSize: 13, color: '#3d5068', marginTop: 6 }}>
            {filteredTotal} {filteredTotal === 1 ? 'registro encontrado' : 'registros encontrados'}
          </p>
        </div>

        <Link
          href="/consumiveis/compras/nova"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 8,
            background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.28)',
            fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
            color: '#34d399', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nova compra
        </Link>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Total', value: total, color: '#34d399', glow: '52,211,153', href: '/consumiveis/compras' },
          { label: 'Pendentes', value: pending, color: '#fbbf24', glow: '251,191,36', href: '/consumiveis/compras?status=PENDING' },
          { label: 'Recebidos', value: received, color: '#34d399', glow: '52,211,153', href: '/consumiveis/compras?status=RECEIVED' },
          { label: 'Cancelados', value: canceled, color: '#f87171', glow: '248,113,113', href: '/consumiveis/compras?status=CANCELED' },
        ].map(s => {
          const isActive = (sp.status === 'PENDING' && s.label === 'Pendentes')
            || (sp.status === 'RECEIVED' && s.label === 'Recebidos')
            || (sp.status === 'CANCELED' && s.label === 'Cancelados')
            || (!sp.status && s.label === 'Total')
          return (
            <Link key={s.label} href={s.href} style={{
              background: isActive ? `rgba(${s.glow},0.11)` : `rgba(${s.glow},0.05)`,
              border: `1.5px solid ${isActive ? s.color : `rgba(${s.glow},0.18)`}`,
              borderRadius: 12, padding: '16px 18px',
              display: 'flex', alignItems: 'center', gap: 14,
              textDecoration: 'none', transition: 'all 0.12s', position: 'relative', overflow: 'hidden',
            }}>
              {isActive && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: s.color, borderRadius: '12px 12px 0 0' }} />}
              <div>
                <p style={{ fontSize: 26, fontWeight: 700, color: s.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{s.value}</p>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: isActive ? s.color : '#3d5068', marginTop: 3, fontWeight: 600, letterSpacing: '0.05em' }}>
                  {s.label.toUpperCase()}
                </p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Kind tabs row — links back to main consumiveis + this page active */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[
          { label: 'Todos',       href: '/consumiveis',                   qs: '',                   active: false },
          { label: 'Acessórios',  href: '/consumiveis?kind=ACCESSORY',    qs: 'kind=ACCESSORY',     active: false },
          { label: 'Consumíveis', href: '/consumiveis?kind=DISPOSABLE',   qs: 'kind=DISPOSABLE',    active: false },
          { label: '🛒 Compras',  href: '/consumiveis/compras',           qs: '__compras__',        active: true  },
        ].map(t => (
          <TabSaverLink
            key={t.label}
            href={t.href}
            cookieKey="hd_consumiveis_filter"
            cookieValue={t.qs}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '6px 14px', borderRadius: 8,
              background: t.active ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${t.active ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.07)'}`,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11, fontWeight: t.active ? 700 : 500,
              color: t.active ? '#34d399' : '#3d5068',
              textDecoration: 'none', transition: 'all 0.1s',
            }}
          >
            {t.label}
          </TabSaverLink>
        ))}
      </div>

      {/* Filters */}
      <PurchasesFilters categories={categories} />

      {/* Client-side interactive list */}
      <PurchasesClient
        purchases={purchases}
        categories={categories}
        activeStatus={sp.status}
        activeQ={sp.q}
      />

      {/* Pagination */}
      <PurchasesPagination
        page={currentPage}
        totalPages={totalPages}
        total={filteredTotal}
        pageSize={20}
      />
    </div>
  )
}
