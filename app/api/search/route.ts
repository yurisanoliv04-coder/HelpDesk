import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() ?? ''

  if (q.length < 2) {
    return NextResponse.json({ tickets: [], assets: [], users: [] })
  }

  const isPrivileged = session.user.role === 'TECNICO' || session.user.role === 'ADMIN'

  const [tickets, assets, users] = await Promise.all([
    prisma.ticket.findMany({
      where: {
        OR: [
          { code: { contains: q, mode: 'insensitive' } },
          { title: { contains: q, mode: 'insensitive' } },
        ],
        // Colaboradores only see their own tickets
        ...(!isPrivileged ? { requesterId: session.user.id } : {}),
      },
      take: 6,
      select: {
        id: true,
        code: true,
        title: true,
        status: true,
        priority: true,
      },
      orderBy: { createdAt: 'desc' },
    }),

    isPrivileged
      ? prisma.asset.findMany({
          where: {
            OR: [
              { tag: { contains: q, mode: 'insensitive' } },
              { name: { contains: q, mode: 'insensitive' } },
              { serialNumber: { contains: q, mode: 'insensitive' } },
            ],
          },
          take: 6,
          select: {
            id: true,
            tag: true,
            name: true,
            status: true,
            category: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
        })
      : Promise.resolve([]),

    isPrivileged
      ? prisma.user.findMany({
          where: {
            active: true,
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          },
          take: 6,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: { select: { name: true } },
          },
          orderBy: { name: 'asc' },
        })
      : Promise.resolve([]),
  ])

  return NextResponse.json({ tickets, assets, users })
}
