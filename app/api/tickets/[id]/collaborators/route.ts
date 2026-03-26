import { withAuth } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db/prisma'
import { ok, err } from '@/lib/utils/api'
import { broadcastEvent } from '@/lib/realtime/clients'

// POST /api/tickets/[id]/collaborators  — add collaborator
export const POST = withAuth(
  async (req: Request, ctx: { params: Promise<{ id: string }> }, session: any) => {
    const isTI = ['TECNICO', 'ADMIN', 'AUXILIAR_TI'].includes(session.user.role)
    if (!isTI) return err('FORBIDDEN', 'Sem permissão', 403)

    const { id } = await ctx.params
    let body: { userId?: string }
    try { body = await req.json() } catch { return err('INVALID_INPUT', 'Body inválido') }

    if (!body.userId) return err('INVALID_INPUT', 'userId obrigatório')

    const [ticket, targetUser] = await Promise.all([
      prisma.ticket.findUnique({ where: { id } }),
      prisma.user.findUnique({ where: { id: body.userId }, select: { id: true, name: true, role: true } }),
    ])
    if (!ticket) return err('NOT_FOUND', 'Chamado não encontrado', 404)
    if (!targetUser) return err('NOT_FOUND', 'Usuário não encontrado', 404)

    const isTIRole = ['TECNICO', 'ADMIN', 'AUXILIAR_TI'].includes(targetUser.role)
    if (!isTIRole) return err('INVALID_INPUT', 'Somente técnicos podem ser colaboradores')

    // Evita duplicata silenciosamente
    const existing = await prisma.ticketCollaborator.findUnique({
      where: { ticketId_userId: { ticketId: id, userId: body.userId } },
    })
    if (existing) return ok({ alreadyExists: true })

    await prisma.ticketCollaborator.create({
      data: { ticketId: id, userId: body.userId },
    })

    await prisma.ticketEvent.create({
      data: {
        ticketId: id,
        actorId: session.user.id,
        type: 'COLLABORATOR_ADDED',
        payload: { description: `${targetUser.name} adicionado como colaborador` },
      },
    })

    broadcastEvent({
      type: 'ticket_assigned',
      payload: { ticketId: id, code: ticket.code, title: ticket.title },
      targetRoles: ['TECNICO', 'ADMIN', 'AUXILIAR_TI'],
    })

    return ok({ userId: body.userId, name: targetUser.name }, 201)
  },
)

// DELETE /api/tickets/[id]/collaborators  — remove collaborator
export const DELETE = withAuth(
  async (req: Request, ctx: { params: Promise<{ id: string }> }, session: any) => {
    const isTI = ['TECNICO', 'ADMIN', 'AUXILIAR_TI'].includes(session.user.role)
    if (!isTI) return err('FORBIDDEN', 'Sem permissão', 403)

    const { id } = await ctx.params
    let body: { userId?: string }
    try { body = await req.json() } catch { return err('INVALID_INPUT', 'Body inválido') }
    if (!body.userId) return err('INVALID_INPUT', 'userId obrigatório')

    const ticket = await prisma.ticket.findUnique({ where: { id }, select: { id: true, code: true, title: true } })
    if (!ticket) return err('NOT_FOUND', 'Chamado não encontrado', 404)

    const targetUser = await prisma.user.findUnique({ where: { id: body.userId }, select: { name: true } })

    await prisma.ticketCollaborator.deleteMany({
      where: { ticketId: id, userId: body.userId },
    })

    await prisma.ticketEvent.create({
      data: {
        ticketId: id,
        actorId: session.user.id,
        type: 'COLLABORATOR_REMOVED',
        payload: { description: `${targetUser?.name ?? 'Técnico'} removido como colaborador` },
      },
    })

    return ok({ removed: true })
  },
)
