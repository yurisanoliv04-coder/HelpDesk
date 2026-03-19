import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { ReportsNoSSR } from '@/components/reports/ReportsNoSSR'

const PT_MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

async function getReportData() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const [
    ticketsByStatus,
    ticketsByPriority,
    ticketsByCategoryRaw,
    assetsByStatus,
    assetsByPerformance,
    thisMonthCount,
    lastMonthCount,
    trendTickets,
    eventsByActorRaw,
    weakAssets,
    totalAssets,
    totalMovements,
  ] = await Promise.all([
    prisma.ticket.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.ticket.groupBy({ by: ['priority'], _count: { id: true } }),
    prisma.ticket.groupBy({
      by: ['categoryId'],
      _count: { id: true },
      orderBy: { _count: { categoryId: 'desc' } },
      take: 8,
    }),
    prisma.asset.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.asset.groupBy({
      by: ['performanceLabel'],
      _count: { id: true },
      where: { performanceLabel: { not: null } },
    }),
    prisma.ticket.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.ticket.count({ where: { createdAt: { gte: lastMonthStart, lt: startOfMonth } } }),
    prisma.ticket.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, status: true },
    }),
    prisma.ticketEvent.groupBy({
      by: ['actorId'],
      _count: { id: true },
      where: { actorId: { not: null } },
      orderBy: { _count: { id: 'desc' } },
      take: 30,
    }),
    prisma.asset.findMany({
      where: {
        performanceLabel: { in: ['RUIM', 'INTERMEDIARIO'] },
        status: { in: ['DEPLOYED', 'STOCK'] },
      },
      select: {
        id: true,
        tag: true,
        name: true,
        cpuModel: true,
        ramGb: true,
        storageGb: true,
        performanceScore: true,
        performanceLabel: true,
        location: true,
        assignedToUser: { select: { name: true } },
        category: { select: { name: true } },
      },
      orderBy: { performanceScore: 'asc' },
      take: 20,
    }),
    prisma.asset.count(),
    prisma.assetMovement.count({ where: { createdAt: { gte: startOfMonth } } }),
  ])

  // Resolve category names
  const categoryIds = ticketsByCategoryRaw.map((t) => t.categoryId)
  const categories = await prisma.ticketCategory.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true },
  })
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))

  const ticketsByCategory = ticketsByCategoryRaw.map((t) => ({
    name: categoryMap[t.categoryId] ?? 'Desconhecida',
    count: t._count.id,
  }))

  // Resolve actor names/roles for team activity
  const actorIds = eventsByActorRaw.map((e) => e.actorId).filter(Boolean) as string[]
  const actors = await prisma.user.findMany({
    where: { id: { in: actorIds } },
    select: { id: true, name: true, role: true },
  })
  const actorMap = Object.fromEntries(actors.map((u) => [u.id, u]))

  const techActivity = eventsByActorRaw
    .filter((e) => {
      const u = actorMap[e.actorId!]
      return u && (u.role === 'TECNICO' || u.role === 'ADMIN')
    })
    .slice(0, 8)
    .map((e) => ({
      name: actorMap[e.actorId!]?.name ?? 'Desconhecido',
      count: e._count.id,
    }))

  const auxActivity = eventsByActorRaw
    .filter((e) => {
      const u = actorMap[e.actorId!]
      return u && u.role === 'AUXILIAR_TI'
    })
    .slice(0, 8)
    .map((e) => ({
      name: actorMap[e.actorId!]?.name ?? 'Desconhecido',
      count: e._count.id,
    }))

  // Build 6-month trend
  const trend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const m = d.getMonth()
    const y = d.getFullYear()
    const items = trendTickets.filter(
      (t) => t.createdAt.getMonth() === m && t.createdAt.getFullYear() === y
    )
    return {
      month: PT_MONTHS[m],
      criados: items.length,
      resolvidos: items.filter((t) => ['DONE', 'CANCELED'].includes(t.status)).length,
    }
  })

  return {
    ticketsByStatus: ticketsByStatus.map((s) => ({ status: s.status, count: s._count.id })),
    ticketsByPriority: ticketsByPriority.map((p) => ({ priority: p.priority, count: p._count.id })),
    ticketsByCategory,
    assetsByStatus: assetsByStatus.map((a) => ({ status: a.status, count: a._count.id })),
    assetsByPerformance: assetsByPerformance.map((p) => ({
      label: p.performanceLabel ?? 'SEM_DADOS',
      count: p._count.id,
    })),
    thisMonthCount,
    lastMonthCount,
    trend,
    techActivity,
    auxActivity,
    weakAssets,
    totalAssets,
    totalMovements,
  }
}

export default async function ReportsPage() {
  const session = await auth()
  if (session?.user.role === 'COLABORADOR') redirect('/dashboard')

  const data = await getReportData()

  return (
    <ReportsNoSSR
      ticketsByStatus={data.ticketsByStatus}
      ticketsByPriority={data.ticketsByPriority}
      ticketsByCategory={data.ticketsByCategory}
      assetsByStatus={data.assetsByStatus}
      assetsByPerformance={data.assetsByPerformance}
      thisMonthCount={data.thisMonthCount}
      lastMonthCount={data.lastMonthCount}
      trend={data.trend}
      techActivity={data.techActivity}
      auxActivity={data.auxActivity}
      weakAssets={data.weakAssets}
      totalAssets={data.totalAssets}
      totalMovements={data.totalMovements}
    />
  )
}
