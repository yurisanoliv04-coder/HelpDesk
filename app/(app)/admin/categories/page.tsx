import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'

export default async function AdminCategoriesPage() {
  const session = await auth()
  if (session?.user.role !== 'ADMIN') redirect('/dashboard')

  const categories = await prisma.ticketCategory.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { tickets: true } } },
  })

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Categorias de Chamado</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{categories.length} categorias cadastradas</p>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-6 px-6 py-5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              {/* Nome e Descrição */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {cat.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                  {cat.description ?? '—'}
                </p>
              </div>

              {/* Exige Ordem */}
              <div className="hidden sm:block flex-shrink-0">
                {cat.requiresMovement ? (
                  <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                    Exige Ordem
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                )}
              </div>

              {/* Contagem de Chamados */}
              <div className="hidden md:block flex-shrink-0">
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {cat._count.tickets}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Chamados</p>
                </div>
              </div>

              {/* Status */}
              <div className="flex-shrink-0">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold ${cat.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${cat.active ? 'bg-emerald-500' : 'bg-red-500'}`}
                  />
                  {cat.active ? 'Ativa' : 'Inativa'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
