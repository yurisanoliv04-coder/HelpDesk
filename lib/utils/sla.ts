import { TicketPriority } from '@prisma/client'
import { prisma } from '@/lib/db/prisma'

export async function computeSlaDeadlines(
  priority: TicketPriority,
  categoryId?: string,
  from = new Date(),
): Promise<{ responseDue: Date | null; resolutionDue: Date | null }> {
  // Busca a política de SLA mais específica (por categoria + prioridade → só prioridade)
  const policy = await prisma.slaPolicy.findFirst({
    where: {
      active: true,
      priority,
      ...(categoryId ? { categoryId } : {}),
    },
    orderBy: { categoryId: 'asc' }, // preferência para SLA específico de categoria
  })

  if (!policy) return { responseDue: null, resolutionDue: null }

  const responseDue = new Date(from.getTime() + policy.responseMinutes * 60 * 1000)
  const resolutionDue = new Date(from.getTime() + policy.resolutionMinutes * 60 * 1000)

  return { responseDue, resolutionDue }
}

export function isSlaWarning(slaResolutionDue: Date | null): boolean {
  if (!slaResolutionDue) return false
  const now = new Date()
  const diffMs = slaResolutionDue.getTime() - now.getTime()
  // Alerta quando falta 30% ou menos do prazo (ou menos de 1h)
  return diffMs > 0 && diffMs <= 60 * 60 * 1000
}
