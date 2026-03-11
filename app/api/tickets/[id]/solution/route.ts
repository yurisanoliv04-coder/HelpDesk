import { withAuth } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db/prisma'
import { ok, err } from '@/lib/utils/api'

// POST /api/tickets/[id]/solution
export const POST = withAuth(
  async (req: Request, ctx: { params: Promise<{ id: string }> }, session: any) => {
    const isTI = ['TECNICO', 'ADMIN'].includes(session.user.role)
    if (!isTI) return err('FORBIDDEN', 'Apenas técnicos podem adicionar soluções', 403)

    const { id } = await ctx.params
    let body: { title?: string; body?: string }
    try { body = await req.json() } catch { return err('INVALID_INPUT', 'Body inválido') }

    const title = body.title?.trim()
    const solutionBody = body.body?.trim()
    if (!title || title.length < 3) return err('INVALID_INPUT', 'Título deve ter ao menos 3 caracteres')
    if (!solutionBody || solutionBody.length < 10) return err('INVALID_INPUT', 'Descrição deve ter ao menos 10 caracteres')

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: { id: true, categoryId: true, status: true },
    })
    if (!ticket) return err('NOT_FOUND', 'Chamado não encontrado', 404)

    const solution = await prisma.ticketSolution.create({
      data: {
        ticketId: id,
        categoryId: ticket.categoryId,
        title,
        body: solutionBody,
        createdById: session.user.id,
      },
      include: {
        createdBy: { select: { name: true } },
      },
    })

    await prisma.ticketEvent.create({
      data: {
        ticketId: id,
        actorId: session.user.id,
        type: 'SOLUTION_ADDED',
        payload: { description: `Solução adicionada: "${title}"` },
      },
    })

    return ok(solution, 201)
  },
)

// GET /api/tickets/[id]/solution — lista soluções do chamado
export const GET = withAuth(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }, _session: any) => {
    const { id } = await ctx.params
    const solutions = await prisma.ticketSolution.findMany({
      where: { ticketId: id },
      include: { createdBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return ok(solutions)
  },
)
