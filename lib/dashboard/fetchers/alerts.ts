import { prisma } from '@/lib/db/prisma'

export interface SystemAlert {
  id: string
  category: 'chamados' | 'patrimonio' | 'estoque'
  severity: 'critical' | 'warning' | 'info'
  label: string
  count: number
  href: string
}

export async function getSystemAlerts(): Promise<SystemAlert[]> {
  const [
    urgentUnassigned,
    urgentInProgress,
    assetsRuim,
    assetsIntermediario,
    lowStockCategories,
  ] = await Promise.all([
    // Chamados urgentes sem técnico
    prisma.ticket.count({
      where: { priority: 'URGENT', status: 'OPEN', assigneeId: null },
    }),
    // Chamados urgentes em andamento (lembrete)
    prisma.ticket.count({
      where: { priority: 'URGENT', status: 'IN_PROGRESS' },
    }),
    // Equipamentos com score RUIM
    prisma.asset.count({ where: { performanceLabel: 'RUIM' } }),
    // Equipamentos com score INTERMEDIÁRIO
    prisma.asset.count({ where: { performanceLabel: 'INTERMEDIARIO' } }),
    // Categorias de estoque abaixo do mínimo
    prisma.assetCategory.findMany({
      where: {
        kind: { in: ['ACCESSORY', 'DISPOSABLE'] },
        active: true,
        stockMinQty: { gt: 0 },
      },
      select: { stockQuantity: true, stockMinQty: true },
    }),
  ])

  const lowStock = lowStockCategories.filter(
    (c) => c.stockQuantity <= c.stockMinQty,
  ).length

  const alerts: SystemAlert[] = []

  if (urgentUnassigned > 0) {
    alerts.push({
      id: 'urgent_unassigned',
      category: 'chamados',
      severity: 'critical',
      label: urgentUnassigned === 1
        ? '1 chamado urgente sem técnico atribuído'
        : `${urgentUnassigned} chamados urgentes sem técnico atribuído`,
      count: urgentUnassigned,
      href: '/tickets?priority=URGENT&status=OPEN',
    })
  }

  if (urgentInProgress > 0) {
    alerts.push({
      id: 'urgent_in_progress',
      category: 'chamados',
      severity: 'warning',
      label: urgentInProgress === 1
        ? '1 chamado urgente em atendimento'
        : `${urgentInProgress} chamados urgentes em atendimento`,
      count: urgentInProgress,
      href: '/tickets?priority=URGENT&status=IN_PROGRESS',
    })
  }

  if (assetsRuim > 0) {
    alerts.push({
      id: 'assets_ruim',
      category: 'patrimonio',
      severity: 'critical',
      label: assetsRuim === 1
        ? '1 equipamento com score Ruim — necessita atenção'
        : `${assetsRuim} equipamentos com score Ruim — necessitam atenção`,
      count: assetsRuim,
      href: '/assets?performance=RUIM',
    })
  }

  if (assetsIntermediario > 0) {
    alerts.push({
      id: 'assets_intermediario',
      category: 'patrimonio',
      severity: 'warning',
      label: assetsIntermediario === 1
        ? '1 equipamento com score Intermediário'
        : `${assetsIntermediario} equipamentos com score Intermediário`,
      count: assetsIntermediario,
      href: '/assets?performance=INTERMEDIARIO',
    })
  }

  if (lowStock > 0) {
    alerts.push({
      id: 'low_stock',
      category: 'estoque',
      severity: 'warning',
      label: lowStock === 1
        ? '1 categoria de acessório abaixo do estoque mínimo'
        : `${lowStock} categorias de acessórios abaixo do estoque mínimo`,
      count: lowStock,
      href: '/assets?tab=accessories&filter=low_stock',
    })
  }

  return alerts
}
