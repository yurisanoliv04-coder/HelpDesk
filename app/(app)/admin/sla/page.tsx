import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'

const priorityLabel: Record<string, string> = {
  LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta', URGENT: 'Urgente',
}

const priorityColor: Record<string, string> = {
  LOW: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
  MEDIUM: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  HIGH: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  URGENT: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
}

function minutesToHuman(min: number) {
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h ${m}min` : `${h}h`
}

export default async function AdminSlaPage() {
  const session = await auth()
  if (session?.user.role !== 'ADMIN') redirect('/dashboard')

  const policies = await prisma.slaPolicy.findMany({
    orderBy: { responseMinutes: 'asc' },
    include: { category: { select: { name: true } } },
  })

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Políticas de SLA</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Prazos de resposta e resolução por prioridade</p>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {policies.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-6 px-6 py-5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              {/* Nome */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {p.name}
                </p>
              </div>

              {/* Prioridade e Categoria */}
              <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
                {p.priority && (
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${priorityColor[p.priority]}`}>
                    {priorityLabel[p.priority]}
                  </span>
                )}
                <span className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  {p.category?.name ?? 'Todas'}
                </span>
              </div>

              {/* Prazos */}
              <div className="hidden md:flex items-center gap-6 flex-shrink-0">
                <div className="text-right">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">1ª Resposta</p>
                  <p className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                    {minutesToHuman(p.responseMinutes)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Resolução</p>
                  <p className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                    {minutesToHuman(p.resolutionMinutes)}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="flex-shrink-0">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold ${p.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${p.active ? 'bg-emerald-500' : 'bg-red-500'}`}
                  />
                  {p.active ? 'Ativa' : 'Inativa'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
