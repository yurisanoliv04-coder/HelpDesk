'use server'

import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { revalidatePath } from 'next/cache'

async function requireTI() {
  const session = await auth()
  if (!['TECNICO', 'ADMIN', 'AUXILIAR_TI'].includes(session?.user.role ?? '')) {
    throw new Error('Não autorizado')
  }
}

export async function bulkAssignTickets(ids: string[], assigneeId: string | null) {
  await requireTI()
  await prisma.ticket.updateMany({
    where: { id: { in: ids } },
    data: { assigneeId },
  })
  revalidatePath('/tickets')
}

export async function bulkUpdateTicketStatus(ids: string[], status: string) {
  await requireTI()
  const isClosed = ['DONE', 'CANCELED'].includes(status)
  await prisma.ticket.updateMany({
    where: { id: { in: ids } },
    data: {
      status: status as any,
      closedAt: isClosed ? new Date() : null,
    },
  })
  revalidatePath('/tickets')
}
