import { withAuth } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db/prisma'
import { ok, err } from '@/lib/utils/api'
import { broadcastToUser } from '@/app/api/realtime/route'

const VALID_STATUSES = ['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'DONE', 'CANCELED']

const statusLabel: Record<string, string> = {
  OPEN: 'Aberto',
  IN_PROGRESS: 'Em atendimento',
  ON_HOLD: 'Aguardando',
  DONE: 'Concluído',
  CANCELED: 'Cancelado',
}

export const POST = withAuth(
  async (req: Request, ctx: { params: Promise<{ id: string }> }, session: any) => {
    const { id } = await ctx.params
    let body: { status?: string }
    try {
      body = await req.json()
    } catch {
      return err('INVALID_INPUT', 'Body inválido')
    }

    const { status } = body
    if (!status || !VALID_STATUSES.includes(status)) {
      return err('INVALID_INPUT', `Status inválido. Valores aceitos: ${VALID_STATUSES.join(', ')}`)
    }

    const ticket = await prisma.ticket.findUnique({ where: { id } })
    if (!ticket) return err('NOT_FOUND', 'Chamado não encontrado', 404)

    if (ticket.status === status) {
      return err('INVALID_STATE', 'Chamado já está neste status')
    }

    const isTI = ['TECNICO', 'ADMIN', 'AUXILIAR_TI'].includes(session.user.role)
    if (!isTI) return err('FORBIDDEN', 'Sem permissão para alterar status', 403)

    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        status,
        closedAt: status === 'DONE' || status === 'CANCELED' ? new Date() : null,
        // Se reabrir, limpa closedAt
        ...(status === 'OPEN' || status === 'IN_PROGRESS' ? { closedAt: null } : {}),
      },
    })

    const fromLabel = statusLabel[ticket.status] ?? ticket.status
    const toLabel = statusLabel[status] ?? status

    await prisma.ticketEvent.create({
      data: {
        ticketId: id,
        actorId: session.user.id,
        type: status === 'DONE' ? 'CLOSED' : status === 'OPEN' ? 'REOPENED' : 'STATUS_CHANGED',
        payload: { description: `Status alterado de ${fromLabel} para ${toLabel}` },
      },
    })

    // Notificar solicitante sobre mudança de status relevante
    const notifiableStatuses = ['DONE', 'CANCELED', 'ON_HOLD']
    if (notifiableStatuses.includes(status) && ticket.requesterId !== session.user.id) {
      broadcastToUser(ticket.requesterId, {
        type: 'ticket_status_changed',
        payload: {
          ticketId: id,
          code: ticket.code,
          title: ticket.title,
          newStatus: toLabel,
        },
      })
    }

    return ok(updated)
  },
  { roles: ['ADMIN', 'TECNICO', 'AUXILIAR_TI'] },
)
