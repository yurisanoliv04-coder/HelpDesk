import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const roleLabel: Record<string, string> = {
  COLABORADOR: 'Colaborador',
  AUXILIAR_TI: 'Auxiliar TI',
  TECNICO: 'Técnico',
  ADMIN: 'Admin TI',
}

const roleColor: Record<string, string> = {
  COLABORADOR: 'bg-slate-100 text-slate-600',
  AUXILIAR_TI: 'bg-blue-100 text-blue-700',
  TECNICO: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-orange-100 text-orange-700',
}

export default async function PeoplePage() {
  const session = await auth()
  if (session?.user.role === 'COLABORADOR') redirect('/dashboard')

  const users = await prisma.user.findMany({
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
    include: {
      department: { select: { name: true } },
      _count: {
        select: {
          ticketsAsRequester: true,
          assignedAssets: true,
        },
      },
    },
  })

  return (
    <div className="w-full space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Pessoas</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{users.length} usuários cadastrados</p>
        </div>
        {session?.user.role === 'ADMIN' && (
          <Link
            href="/admin/users/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Novo usuário
          </Link>
        )}
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

            return (
              <div
                key={user.id}
                className="flex items-center gap-6 px-6 py-5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                {/* Avatar e Nome */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
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
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${roleColor[user.role]} dark:${roleColor[user.role]}`}>
                    {roleLabel[user.role]}
                  </span>
                </div>

                {/* Departamento */}
                <div className="hidden md:block flex-shrink-0">
                  <span className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {user.department?.name ?? '—'}
                  </span>
                </div>

                {/* Chamados e Ativos */}
                <div className="hidden lg:flex gap-6 flex-shrink-0">
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {user._count.ticketsAsRequester}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Chamados</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {user._count.assignedAssets}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Ativos</p>
                  </div>
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
