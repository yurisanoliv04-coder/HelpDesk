import { prisma } from '@/lib/db/prisma'

export interface RecentMessage {
  id: string
  body: string
  createdAt: Date
  author: { name: string }
  ticket: { id: string; code: string; title: string }
}

export async function getRecentMessages(userId: string): Promise<RecentMessage[]> {
  return prisma.ticketMessage.findMany({
    where: {
      isNote: false,
      visibility: 'PUBLIC',
      authorId: { not: userId },
      ticket: { OR: [{ requesterId: userId }, { assigneeId: userId }] },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true, body: true, createdAt: true,
      author: { select: { name: true } },
      ticket: { select: { id: true, code: true, title: true } },
    },
  })
}
