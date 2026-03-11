import { withAuth } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db/prisma'
import { ok, err, generateTicketCode } from '@/lib/utils/api'
import { broadcastEvent } from '@/app/api/realtime/route'
import { z } from 'zod'

const CreateTicketSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(5),
  categoryId: z.string().min(1),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  // requesterId: quem está solicitando. Omitir = sessão atual.
  // AUXILIAR_TI pode abrir chamado em nome de outro usuário.
  requesterId: z.string().optional(),
  departmentId: z.string().optional(),
})

export const POST = withAuth(
  async (req: Request, _ctx: unknown, session: any) => {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return err('INVALID_INPUT', 'Body inválido')
    }

    const parsed = CreateTicketSchema.safeParse(body)
    if (!parsed.success) {
      return err('INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Dados inválidos')
    }

    const { title, description, categoryId, priority, requesterId, departmentId } = parsed.data

    // Verificar se a categoria existe
    const category = await prisma.ticketCategory.findUnique({ where: { id: categoryId } })
    if (!category) return err('NOT_FOUND', 'Categoria não encontrada', 404)
    if (!category.active) return err('INVALID_STATE', 'Categoria inativa')

    const isTI = ['TECNICO', 'ADMIN', 'AUXILIAR_TI'].includes(session.user.role)

    // Colaboradores só podem abrir chamados para si mesmos
    const finalRequesterId = isTI && requesterId ? requesterId : session.user.id
    const openedById = session.user.id

    // Verificar se o solicitante existe
    if (finalRequesterId !== session.user.id) {
      const requester = await prisma.user.findUnique({ where: { id: finalRequesterId } })
      if (!requester) return err('NOT_FOUND', 'Solicitante não encontrado', 404)
    }

    // Gerar código único (baseado no último ticket)
    const lastTicket = await prisma.ticket.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { code: true },
    })
    const lastSeq = lastTicket ? parseInt(lastTicket.code.split('-').pop() ?? '0', 10) : 0
    const code = generateTicketCode(lastSeq + 1)

    // Buscar departamento do solicitante se não informado
    let resolvedDepartmentId = departmentId
    if (!resolvedDepartmentId) {
      const requester = await prisma.user.findUnique({
        where: { id: finalRequesterId },
        select: { departmentId: true },
      })
      resolvedDepartmentId = requester?.departmentId ?? undefined
    }

    const ticket = await prisma.ticket.create({
      data: {
        code,
        title,
        description,
        priority,
        status: 'OPEN',
        categoryId,
        requesterId: finalRequesterId,
        openedById,
        departmentId: resolvedDepartmentId,
      },
      include: {
        category: { select: { name: true } },
        requester: { select: { name: true } },
      },
    })

    // Evento de criação
    await prisma.ticketEvent.create({
      data: {
        ticketId: ticket.id,
        actorId: session.user.id,
        type: 'CREATED',
        payload: { description: 'Chamado aberto' },
      },
    })

    // Notificação SSE → técnicos/admin/auxiliar TI
    broadcastEvent({
      type: 'ticket_created',
      payload: {
        ticketId: ticket.id,
        code: ticket.code,
        title: ticket.title,
        priority: ticket.priority,
        categoryName: ticket.category.name,
        requesterName: ticket.requester.name,
        openedByName: session.user.name ?? 'Usuário',
      },
      targetRoles: ['TECNICO', 'ADMIN', 'AUXILIAR_TI'],
    })

    return ok(ticket, 201)
  },
)
