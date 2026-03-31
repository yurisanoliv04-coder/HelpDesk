import { withAuth } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db/prisma'
import { ok, err, generateTicketCode } from '@/lib/utils/api'
import { broadcastEvent } from '@/lib/realtime/clients'
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
  // IDs de regras de abertura já confirmadas pelo cliente (CONFIRMATION / WARNING_ONLY)
  confirmedRuleIds: z.array(z.string()).optional(),
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

    const { title, description, categoryId, priority, requesterId, departmentId, confirmedRuleIds } = parsed.data

    // Verificar se a categoria existe
    const category = await prisma.ticketCategory.findUnique({ where: { id: categoryId } })
    if (!category) return err('NOT_FOUND', 'Categoria não encontrada', 404)
    if (!category.active) return err('INVALID_STATE', 'Categoria inativa')

    const isTI = ['TECNICO', 'ADMIN', 'AUXILIAR_TI'].includes(session.user.role)

    // ── Validar regras de abertura (server-side) ──────────────────────────────
    const activeRules = await prisma.ticketOpeningRule.findMany({
      where: { categoryId, active: true },
    })

    if (activeRules.length > 0) {
      const nowHour = new Date().getHours()  // UTC-3 approximated; refine with timezone lib if needed
      const nowDay  = new Date().getDay()
      const requesterDeptId = session.user.departmentId as string | undefined

      for (const rule of activeRules) {
        const cfg = rule.config as Record<string, unknown>

        if (rule.ruleType === 'TIME_RESTRICTION') {
          const startHour = (cfg.startHour as number) ?? 8
          const endHour   = (cfg.endHour   as number) ?? 18
          const days      = (cfg.days      as number[]) ?? [1, 2, 3, 4, 5]
          if (!days.includes(nowDay) || nowHour < startHour || nowHour >= endHour) {
            const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
            const allowed  = days.map(d => dayNames[d]).join(', ')
            return err('RULE_VIOLATION', `Esta categoria só aceita chamados das ${startHour}h às ${endHour}h (${allowed}).`)
          }
        }

        if (rule.ruleType === 'DEPARTMENT_ONLY') {
          const allowed = (cfg.departmentIds as string[]) ?? []
          if (allowed.length > 0 && !isTI && (!requesterDeptId || !allowed.includes(requesterDeptId))) {
            const names = (cfg.departmentNames as string[]) ?? []
            return err('RULE_VIOLATION', `Esta categoria é restrita aos departamentos: ${names.join(', ')}.`)
          }
        }

        if (rule.ruleType === 'CONFIRMATION' || rule.ruleType === 'WARNING_ONLY') {
          const confirmed = confirmedRuleIds ?? []
          if (!confirmed.includes(rule.id) && rule.ruleType === 'CONFIRMATION') {
            return err('RULE_VIOLATION', `Confirmação obrigatória: "${cfg.message ?? 'Regra não confirmada'}".`)
          }
        }
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

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
