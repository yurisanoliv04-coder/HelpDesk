import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import UsersTab from '@/components/settings/UsersTab'
import SettingsSubHeader from '@/components/settings/SettingsSubHeader'

export default async function UsuariosPage() {
  const session = await auth()

  const [users, departments] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
      select: {
        id: true, name: true, email: true, role: true, active: true,
        department: { select: { id: true, name: true } },
      },
    }),
    prisma.department.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ])

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SettingsSubHeader
        title="Usuários"
        description="Gerencie contas, funções e departamentos dos colaboradores."
        accent="#38bdf8"
      />
      <UsersTab
        users={users as Parameters<typeof UsersTab>[0]['users']}
        departments={departments}
        currentUserId={session!.user.id}
      />
    </div>
  )
}
