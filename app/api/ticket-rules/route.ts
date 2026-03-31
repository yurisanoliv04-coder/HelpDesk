import { withAuth } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db/prisma'
import { ok, err } from '@/lib/utils/api'

/**
 * GET /api/ticket-rules?categoryId=xxx
 *
 * Retorna as regras de abertura ativas para uma categoria.
 * Usado pelo formulário de novo chamado para exibir confirmações / avisos
 * ao usuário antes do submit.
 */
export const GET = withAuth(async (req: Request) => {
  const { searchParams } = new URL(req.url)
  const categoryId = searchParams.get('categoryId')

  if (!categoryId) return err('INVALID_INPUT', 'categoryId é obrigatório')

  const rules = await prisma.ticketOpeningRule.findMany({
    where:   { categoryId, active: true },
    orderBy: { sortOrder: 'asc' },
    select:  { id: true, ruleType: true, description: true, config: true },
  })

  return ok(rules)
})
