import { withAuth } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db/prisma'
import { ok, err } from '@/lib/utils/api'
import { broadcastEvent } from '@/lib/realtime/clients'
import { z } from 'zod'

const PRIORITY_LEVEL: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, URGENT: 4 }

const PatchTicketSchema = z.object({
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(5).optional(),
})

export const PATCH = withAuth(
  async (req: Request, ctx: { params: Promise<{ id: string }> }, session: any) => {
    const { id } = await ctx.params

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return err('INVALID_INPUT', 'Body inválido')
    }

    const parsed = PatchTicketSchema.safeParse(body)
    if (!parsed.success) {
      return err('INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Dados inválidos')
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { requester: { select: { name: true } } },
    })
    if (!ticket) return err('NOT_FOUND', 'Chamado não encontrado', 404)

    const oldPriority = ticket.priority
    const newPriority = parsed.data.priority
    const isEscalation =
      newPriority !== undefined &&
      PRIORITY_LEVEL[newPriority] > PRIORITY_LEVEL[oldPriority]

    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        ...(newPriority ? { priority: newPriority } : {}),
        ...(parsed.data.title ? { title: parsed.data.title } : {}),
        ...(parsed.data.description ? { description: parsed.data.description } : {}),
      },
    })

    if (newPriority && newPriority !== oldPriority) {
      await prisma.ticketEvent.create({
        data: {
          ticketId: id,
          actorId: session.user.id,
          type: 'PRIORITY_CHANGED',
          payload: {
            description: `Prioridade alterada de ${oldPriority} para ${newPriority}`,
            oldPriority,
            newPriority,
          },
        },
      })
    }

    if (isEscalation) {
      broadcastEvent({
        type: 'ticket_priority_escalated',
        payload: {
          ticketId: ticket.id,
          code: ticket.code,
          title: ticket.title,
          oldPriority,
          newPriority,
          requesterName: ticket.requester?.name ?? '',
        },
        targetRoles: ['ADMIN', 'TECNICO'],
      })
    }

    return ok(updated)
  },
  { roles: ['ADMIN', 'TECNICO', 'AUXILIAR_TI'] },
)
