import { withAuth } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db/prisma'
import { ok, err } from '@/lib/utils/api'
import { broadcastToUser } from '@/lib/realtime/clients'

type Visibility = 'PUBLIC' | 'TECHNICIANS' | 'AUTHOR'

export const POST = withAuth(
  async (req: Request, ctx: { params: Promise<{ id: string }> }, session: any) => {
    const { id } = await ctx.params
    let body: { body?: string; isNote?: boolean; visibility?: Visibility }
    try { body = await req.json() } catch { return err('INVALID_INPUT', 'Body inválido') }

    const msgBody = body.body?.trim()
    if (!msgBody) return err('INVALID_INPUT', 'Mensagem não pode ser vazia')

    const ticket = await prisma.ticket.findUnique({ where: { id } })
    if (!ticket) return err('NOT_FOUND', 'Chamado não encontrado', 404)
    if (ticket.status === 'CANCELED') return err('INVALID_STATE', 'Chamado cancelado não aceita mensagens')

    const isTI = ['TECNICO', 'ADMIN', 'AUXILIAR_TI'].includes(session.user.role)
    const isOwner = ticket.requesterId === session.user.id || ticket.openedById === session.user.id
    if (!isTI && !isOwner) return err('FORBIDDEN', 'Sem permissão', 403)

    // Non-TI users can only send PUBLIC messages
    const isNote = isTI ? (body.isNote ?? false) : false
    let visibility: Visibility = body.visibility ?? 'PUBLIC'
    if (!isTI) visibility = 'PUBLIC'
    // Notes can only be PUBLIC or TECHNICIANS, never AUTHOR
    if (isNote && visibility === 'AUTHOR') visibility = 'TECHNICIANS'
    // Valid visibility values
    if (!['PUBLIC', 'TECHNICIANS', 'AUTHOR'].includes(visibility)) visibility = 'PUBLIC'

    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        authorId: session.user.id,
        body: msgBody,
        isNote,
        visibility,
      },
      include: { author: { select: { id: true, name: true, role: true } } },
    })

    await prisma.ticketEvent.create({
      data: {
        ticketId: id,
        actorId: session.user.id,
        type: isNote ? 'NOTE_ADDED' : 'COMMENTED',
        payload: {
          description: isNote
            ? `Nota adicionada (${visibility === 'PUBLIC' ? 'visível a todos' : 'apenas técnicos'})`
            : `Mensagem adicionada (${
                visibility === 'PUBLIC' ? 'pública'
                : visibility === 'TECHNICIANS' ? 'apenas técnicos'
                : 'somente autor'
              })`,
        },
      },
    })

    // SSE notifications — only for PUBLIC messages
    if (visibility === 'PUBLIC') {
      if (isTI && ticket.requesterId !== session.user.id) {
        broadcastToUser(ticket.requesterId, {
          type: 'ticket_message',
          payload: { ticketId: id, code: ticket.code, title: ticket.title, authorName: session.user.name ?? 'Técnico' },
        })
      }
      if (!isTI && ticket.assigneeId && ticket.assigneeId !== session.user.id) {
        broadcastToUser(ticket.assigneeId, {
          type: 'ticket_message',
          payload: { ticketId: id, code: ticket.code, title: ticket.title, authorName: session.user.name ?? 'Solicitante' },
        })
      }
    } else if (visibility === 'TECHNICIANS' || isNote) {
      if (ticket.assigneeId && ticket.assigneeId !== session.user.id) {
        broadcastToUser(ticket.assigneeId, {
          type: 'ticket_internal_note',
          payload: { ticketId: id, code: ticket.code, title: ticket.title, authorName: session.user.name ?? 'Técnico' },
        })
      }
    }

    return ok(message, 201)
  },
)
