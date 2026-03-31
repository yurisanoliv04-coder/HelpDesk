import { prisma } from '@/lib/db/prisma'
import { format, subDays, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface TicketKpis {
  open: number
  unassigned: number
  urgent: number
  inProgress: number
}

export async function getTicketKpis(): Promise<TicketKpis> {
  const [open, unassigned, urgent, inProgress] = await Promise.all([
    prisma.ticket.count({ where: { status: 'OPEN' } }),
    prisma.ticket.count({ where: { status: 'OPEN', assigneeId: null } }),
    prisma.ticket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] }, priority: 'URGENT' } }),
    prisma.ticket.count({ where: { status: 'IN_PROGRESS' } }),
  ])
  return { open, unassigned, urgent, inProgress }
}

export interface MyTicket {
  id: string
  code: string
  title: string
  priority: string
  status: string
  createdAt: Date
  category: { name: string }
}

export async function getMyTickets(userId: string, isCollaborador: boolean): Promise<MyTicket[]> {
  return prisma.ticket.findMany({
    where: isCollaborador
      ? { requesterId: userId, status: { in: ['OPEN', 'IN_PROGRESS', 'ON_HOLD'] } }
      : { assigneeId: userId, status: { in: ['OPEN', 'IN_PROGRESS', 'ON_HOLD'] } },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    take: 5,
    select: {
      id: true, code: true, title: true,
      priority: true, status: true, createdAt: true,
      category: { select: { name: true } },
    },
  })
}

export interface RecentTicket {
  id: string
  code: string
  title: string
  priority: string
  status: string
  createdAt: Date
  category: { name: string }
  requester: { name: string }
  assignee: { name: string } | null
}

export async function getRecentTickets(): Promise<RecentTicket[]> {
  return prisma.ticket.findMany({
    where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
    orderBy: { createdAt: 'desc' },
    take: 6,
    select: {
      id: true, code: true, title: true,
      priority: true, status: true, createdAt: true,
      category: { select: { name: true } },
      requester: { select: { name: true } },
      assignee: { select: { name: true } },
    },
  })
}

export interface WeeklyChartPoint {
  day: string    // display label e.g. '15' or '1/mar'
  date: string   // full date YYYY-MM-DD — used for navigation
  done: number
  open: number
  isToday: boolean
}

const CHART_DAYS = 60  // 60 days fetched — allows 30-day panning in the chart

export async function getWeeklyData(): Promise<WeeklyChartPoint[]> {
  const now = new Date()
  const startDate = startOfDay(subDays(now, CHART_DAYS - 1))

  const [created, closed] = await Promise.all([
    prisma.ticket.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true },
    }),
    prisma.ticket.findMany({
      where: {
        status: { in: ['DONE', 'CANCELED'] },
        closedAt: { gte: startDate, not: null },
      },
      select: { closedAt: true },
    }),
  ])

  const dayMap: Record<string, { done: number; open: number }> = {}
  for (let i = CHART_DAYS - 1; i >= 0; i--) {
    const key = format(subDays(now, i), 'yyyy-MM-dd')
    dayMap[key] = { done: 0, open: 0 }
  }

  created.forEach((t) => {
    const key = format(t.createdAt, 'yyyy-MM-dd')
    if (dayMap[key]) dayMap[key].open++
  })
  closed.forEach((t) => {
    if (!t.closedAt) return
    const key = format(t.closedAt, 'yyyy-MM-dd')
    if (dayMap[key]) dayMap[key].done++
  })

  return Array.from({ length: CHART_DAYS }, (_, i) => {
    const idx = (CHART_DAYS - 1) - i
    const d = subDays(now, idx)
    const key = format(d, 'yyyy-MM-dd')
    const dayNum = parseInt(format(d, 'd'), 10)
    const label = dayNum === 1
      ? `1/${format(d, 'MMM', { locale: ptBR })}`
      : format(d, 'd')
    return {
      day: label,
      date: key,
      done: dayMap[key].done,
      open: dayMap[key].open,
      isToday: idx === 0,
    }
  })
}

export interface TechChartPoint {
  id: string    // userId — used for navigation
  name: string
  count: number
}

export async function getTechData(): Promise<TechChartPoint[]> {
  // Fetch ALL technicians regardless of active ticket count
  const [technicians, grouped] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ['AUXILIAR_TI', 'TECNICO', 'ADMIN'] } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.ticket.groupBy({
      by: ['assigneeId'],
      where: { status: { in: ['OPEN', 'IN_PROGRESS'] }, assigneeId: { not: null } },
      _count: { id: true },
    }),
  ])

  const countMap = Object.fromEntries(grouped.map((g) => [g.assigneeId!, g._count.id]))

  return technicians
    .map((u) => ({ id: u.id, name: u.name, count: countMap[u.id] ?? 0 }))
    .sort((a, b) => b.count - a.count)
}
