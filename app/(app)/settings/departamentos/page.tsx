import { prisma } from '@/lib/db/prisma'
import DepartmentsTab from '@/components/settings/DepartmentsTab'
import SettingsSubHeader from '@/components/settings/SettingsSubHeader'

export default async function DepartamentosPage() {
  const departments = await prisma.department.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { users: true } } },
  })

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SettingsSubHeader
        title="Departamentos"
        description="Gerencie setores e a pontuação associada a cada departamento."
        accent="#818cf8"
      />
      <DepartmentsTab
        departments={departments as Parameters<typeof DepartmentsTab>[0]['departments']}
      />
    </div>
  )
}
