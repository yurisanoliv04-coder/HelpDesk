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
  day: string
  done: number
  open: number
  isToday: boolean
}

export async function getWeeklyData(): Promise<WeeklyChartPoint[]> {
  const now = new Date()
  const start30 = startOfDay(subDays(now, 29))

  const [created, closed] = await Promise.all([
    prisma.ticket.findMany({
      where: { createdAt: { gte: start30 } },
      select: { createdAt: true },
    }),
    prisma.ticket.findMany({
      where: {
        status: { in: ['DONE', 'CANCELED'] },
        closedAt: { gte: start30, not: null },
      },
      select: { closedAt: true },
    }),
  ])

  const dayMap: Record<string, { done: number; open: number }> = {}
  for (let i = 29; i >= 0; i--) {
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

  return Array.from({ length: 30 }, (_, i) => {
    const idx = 29 - i
    const d = subDays(now, idx)
    const key = format(d, 'yyyy-MM-dd')
    const dayNum = parseInt(format(d, 'd'), 10)
    const label = dayNum === 1
      ? `1/${format(d, 'MMM', { locale: ptBR })}`
      : format(d, 'd')
    return {
      day: label,
      done: dayMap[key].done,
      open: dayMap[key].open,
      isToday: idx === 0,
    }
  })
}

export interface TechChartPoint {
  name: string
  count: number
}

export async function getTechData(): Promise<TechChartPoint[]> {
  const grouped = await prisma.ticket.groupBy({
    by: ['assigneeId'],
    where: { status: { in: ['OPEN', 'IN_PROGRESS'] }, assigneeId: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 6,
  })

  if (grouped.length === 0) return []

  const ids = grouped.map((g) => g.assigneeId!).filter(Boolean)
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  })
  const nameMap = Object.fromEntries(users.map((u) => [u.id, u.name]))

  return grouped.map((g) => ({
    name: nameMap[g.assigneeId!] ?? 'Desconhecido',
    count: g._count.id,
  }))
}
