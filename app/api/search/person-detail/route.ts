import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = session.user.role
  if (role !== 'TECNICO' && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')?.trim()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const [assets, tickets, movements] = await Promise.all([
    // All assets currently assigned to this person
    prisma.asset.findMany({
      where: { assignedToUserId: id },
      select: {
        id: true,
        tag: true,
        name: true,
        status: true,
        category: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),

    // Last 3 tickets opened by or assigned to this person
    prisma.ticket.findMany({
      where: {
        OR: [
          { requesterId: id },
          { assigneeId: id },
        ],
      },
      take: 3,
      select: {
        id: true,
        code: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),

    // Last 4 movements related to this person
    prisma.assetMovement.findMany({
      where: {
        OR: [
          { fromUserId: id },
          { toUserId: id },
          { actorId: id },
        ],
      },
      take: 4,
      select: {
        id: true,
        type: true,
        createdAt: true,
        asset: { select: { id: true, tag: true, name: true } },
        fromUser: { select: { name: true } },
        toUser: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return NextResponse.json({ assets, tickets, movements })
}
