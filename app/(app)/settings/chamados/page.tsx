import { prisma } from '@/lib/db/prisma'
import TicketSettingsTab from '@/components/settings/TicketSettingsTab'
import SettingsSubHeader from '@/components/settings/SettingsSubHeader'

export default async function ChamadosPage() {
  const [slaPolices, ticketCategories, departments, allTechnicians] = await Promise.all([
    prisma.slaPolicy.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, active: true,
        priority: true, responseMinutes: true, resolutionMinutes: true,
        category: { select: { name: true } },
      },
    }),
    prisma.ticketCategory.findMany({
      where: { parentId: null },
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, description: true, active: true, scoringPoints: true,
        technicians: { select: { userId: true } },
        openingRules: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, ruleType: true, description: true, config: true, active: true },
        },
        children: {
          orderBy: { name: 'asc' },
          select: {
            id: true, name: true, description: true, active: true, scoringPoints: true,
            technicians: { select: { userId: true } },
            openingRules: {
              orderBy: { sortOrder: 'asc' },
              select: { id: true, ruleType: true, description: true, config: true, active: true },
            },
          },
        },
      },
    }),
    prisma.department.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, code: true, active: true, scoringPoints: true,
        _count: { select: { users: true } },
      },
    }),
    prisma.user.findMany({
      where: { active: true, role: { in: ['TECNICO', 'ADMIN', 'AUXILIAR_TI'] } },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, role: true },
    }),
  ])

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SettingsSubHeader
        title="Chamados"
        description="Configure políticas de SLA, pontuação por categoria e prioridade."
        accent="#f59e0b"
      />
      <TicketSettingsTab
        slaPolices={slaPolices as Parameters<typeof TicketSettingsTab>[0]['slaPolices']}
        ticketCategories={ticketCategories as Parameters<typeof TicketSettingsTab>[0]['ticketCategories']}
        departments={departments as Parameters<typeof TicketSettingsTab>[0]['departments']}
        allTechnicians={allTechnicians as Parameters<typeof TicketSettingsTab>[0]['allTechnicians']}
      />
    </div>
  )
}
