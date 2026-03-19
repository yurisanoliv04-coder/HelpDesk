'use server'

import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { revalidatePath } from 'next/cache'

async function requireTI() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const role = session.user.role
  if (role === 'COLABORADOR') throw new Error('Forbidden')
  return session
}

// ─── Search available assets (STOCK or DEPLOYED) ──────────────────────────────
export async function searchAssets(query: string) {
  const q = query.trim()
  const assets = await prisma.asset.findMany({
    where: {
      status: { in: ['STOCK', 'DEPLOYED'] },
      ...(q && {
        OR: [
          { tag: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
          { serialNumber: { contains: q, mode: 'insensitive' } },
          { cpuModel: { contains: q, mode: 'insensitive' } },
          { location: { contains: q, mode: 'insensitive' } },
          { category: { name: { contains: q, mode: 'insensitive' } } },
        ],
      }),
    },
    select: {
      id: true,
      tag: true,
      name: true,
      status: true,
      assignedToUserId: true,
      assignedToUser: { select: { name: true } },
      category: { select: { name: true } },
    },
    orderBy: { tag: 'asc' },
    take: 20,
  })
  return assets
}

// ─── Link asset to ticket (check-out or check-in) ────────────────────────────
export async function executeTicketAssetAction(
  ticketId: string,
  assetId: string,
  action: 'ASSIGN_ASSET' | 'REMOVE_ASSET',
  targetUserId?: string,
  notes?: string,
) {
  const session = await requireTI()

  const [ticket, asset] = await Promise.all([
    prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, code: true, requesterId: true },
    }),
    prisma.asset.findUnique({
      where: { id: assetId },
      select: { id: true, status: true, assignedToUserId: true },
    }),
  ])

  if (!ticket) throw new Error('Chamado não encontrado')
  if (!asset) throw new Error('Ativo não encontrado')

  // Determine movement type and new asset state
  let movementType: 'CHECK_OUT' | 'CHECK_IN'
  let newStatus: 'DEPLOYED' | 'STOCK'
  let newAssignedToUserId: string | null

  if (action === 'ASSIGN_ASSET') {
    // Check-out: asset goes to a user
    const toUser = targetUserId ?? ticket.requesterId
    movementType = 'CHECK_OUT'
    newStatus = 'DEPLOYED'
    newAssignedToUserId = toUser

    // Create MovementOrder + item
    const order = await prisma.movementOrder.create({
      data: {
        ticketId,
        actorId: session.user.id,
        status: 'IN_PROGRESS',
        notes: notes ?? null,
        items: {
          create: {
            action: 'ASSIGN_ASSET',
            assetId,
            targetUserId: toUser,
            status: 'PENDING',
          },
        },
      },
    })

    // Execute: update asset + create movement + mark order done
    await prisma.$transaction([
      prisma.asset.update({
        where: { id: assetId },
        data: { status: newStatus, assignedToUserId: newAssignedToUserId },
      }),
      prisma.assetMovement.create({
        data: {
          assetId,
          actorId: session.user.id,
          type: movementType,
          fromUserId: asset.assignedToUserId ?? undefined,
          toUserId: toUser,
          fromStatus: asset.status,
          toStatus: newStatus,
          ticketId,
          orderId: order.id,
          notes: notes ?? null,
        },
      }),
      prisma.movementOrderItem.updateMany({
        where: { orderId: order.id },
        data: { status: 'DONE' },
      }),
      prisma.movementOrder.update({
        where: { id: order.id },
        data: { status: 'DONE', completedAt: new Date() },
      }),
      prisma.ticketEvent.create({
        data: {
          ticketId,
          actorId: session.user.id,
          type: 'MOVEMENT_LINKED',
          payload: {
            description: `Ativo ${asset.id} alocado via chamado`,
            orderId: order.id,
          },
        },
      }),
    ])
  } else {
    // Check-in: return asset to stock
    movementType = 'CHECK_IN'
    newStatus = 'STOCK'
    newAssignedToUserId = null

    const order = await prisma.movementOrder.create({
      data: {
        ticketId,
        actorId: session.user.id,
        status: 'IN_PROGRESS',
        notes: notes ?? null,
        items: {
          create: {
            action: 'REMOVE_ASSET',
            assetId,
            status: 'PENDING',
          },
        },
      },
    })

    await prisma.$transaction([
      prisma.asset.update({
        where: { id: assetId },
        data: { status: 'STOCK', assignedToUserId: null },
      }),
      prisma.assetMovement.create({
        data: {
          assetId,
          actorId: session.user.id,
          type: 'CHECK_IN',
          fromUserId: asset.assignedToUserId ?? undefined,
          fromStatus: asset.status,
          toStatus: 'STOCK',
          ticketId,
          orderId: order.id,
          notes: notes ?? null,
        },
      }),
      prisma.movementOrderItem.updateMany({
        where: { orderId: order.id },
        data: { status: 'DONE' },
      }),
      prisma.movementOrder.update({
        where: { id: order.id },
        data: { status: 'DONE', completedAt: new Date() },
      }),
      prisma.ticketEvent.create({
        data: {
          ticketId,
          actorId: session.user.id,
          type: 'MOVEMENT_LINKED',
          payload: {
            description: `Ativo devolvido ao estoque via chamado`,
            orderId: order.id,
          },
        },
      }),
    ])
  }

  revalidatePath(`/tickets/${ticketId}`)
  revalidatePath('/assets')
  revalidatePath('/movements')
}
