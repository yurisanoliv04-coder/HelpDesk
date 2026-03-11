import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'

const roleLabel: Record<string, string> = {
  COLABORADOR: 'Colaborador', AUXILIAR_TI: 'Auxiliar TI',
  TECNICO: 'Técnico', ADMIN: 'Admin TI',
}

export default async function AdminUsersPage() {
  const session = await auth()
  if (session?.user.role !== 'ADMIN') redirect('/dashboard')

  const users = await prisma.user.findMany({
    orderBy: { name: 'asc' },
    include: { department: { select: { name: true } } },
  })

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Usuários</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{users.length} usuários cadastrados</p>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {users.map((user) => {
            const userInitials = user.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)

            const roleColors: Record<string, string> = {
              COLABORADOR: 'from-slate-400 to-slate-600',
              AUXILIAR_TI: 'from-blue-400 to-blue-600',
              TECNICO: 'from-purple-400 to-purple-600',
              ADMIN: 'from-orange-400 to-orange-600',
            }

            return (
              <div
                key={user.id}
                className="flex items-center gap-6 px-6 py-5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                {/* Avatar e Nome */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${roleColors[user.role]} flex items-center justify-center flex-shrink-0`}
                  >
                    <span className="text-xs font-bold text-white">{userInitials}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {user.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{user.email}</p>
                  </div>
                </div>

                {/* Perfil */}
                <div className="hidden sm:block flex-shrink-0">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {roleLabel[user.role]}
                  </span>
                </div>

                {/* Departamento */}
                <div className="hidden md:block flex-1">
                  <span className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {user.department?.name ?? '—'}
                  </span>
                </div>

                {/* Status */}
                <div className="flex-shrink-0">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold ${user.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${user.active ? 'bg-emerald-500' : 'bg-red-500'}`}
                    />
                    {user.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
