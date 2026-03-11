import { withAuth } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db/prisma'
import { ok, err } from '@/lib/utils/api'
import { broadcastToUser } from '@/app/api/realtime/route'

export const POST = withAuth(
  async (req: Request, ctx: { params: Promise<{ id: string }> }, session: any) => {
    const { id } = await ctx.params
    let body: { technicianId?: string }
    try {
      body = await req.json()
    } catch {
      return err('INVALID_INPUT', 'Body inválido')
    }

    const { technicianId } = body
    if (!technicianId) return err('INVALID_INPUT', 'technicianId é obrigatório')

    const ticket = await prisma.ticket.findUnique({ where: { id } })
    if (!ticket) return err('NOT_FOUND', 'Chamado não encontrado', 404)

    if (ticket.status === 'DONE' || ticket.status === 'CANCELED') {
      return err('INVALID_STATE', 'Não é possível atribuir um chamado encerrado')
    }

    const technician = await prisma.user.findUnique({
      where: { id: technicianId },
      select: { id: true, name: true, role: true },
    })
    if (!technician) return err('NOT_FOUND', 'Técnico não encontrado', 404)
    if (!['TECNICO', 'ADMIN', 'AUXILIAR_TI'].includes(technician.role)) {
      return err('INVALID_INPUT', 'Usuário não tem perfil de técnico')
    }

    const wasOpen = ticket.status === 'OPEN'

    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        assigneeId: technicianId,
        status: wasOpen ? 'IN_PROGRESS' : ticket.status,
      },
    })

    // Evento de atribuição
    await prisma.ticketEvent.create({
      data: {
        ticketId: id,
        actorId: session.user.id,
        type: 'ASSIGNED',
        payload: { description: `Atribuído a ${technician.name}` },
      },
    })

    // Evento de mudança de status (se mudou)
    if (wasOpen) {
      await prisma.ticketEvent.create({
        data: {
          ticketId: id,
          actorId: session.user.id,
          type: 'STATUS_CHANGED',
          payload: { description: 'Status alterado de Aberto para Em atendimento' },
        },
      })
    }

    // Notificar solicitante via SSE
    if (ticket.requesterId !== session.user.id) {
      broadcastToUser(ticket.requesterId, {
        type: 'ticket_assigned',
        payload: {
          ticketId: id,
          code: ticket.code,
          title: ticket.title,
          technicianName: technician.name,
        },
      })
    }

    // Notificar o técnico atribuído (se for diferente do autor da ação)
    if (technicianId !== session.user.id) {
      broadcastToUser(technicianId, {
        type: 'ticket_assigned_to_you',
        payload: {
          ticketId: id,
          code: ticket.code,
          title: ticket.title,
        },
      })
    }

    return ok(updated)
  },
  { roles: ['ADMIN', 'TECNICO', 'AUXILIAR_TI'] },
)
