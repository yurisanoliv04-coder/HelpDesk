import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const movementLabel: Record<string, string> = {
  CHECK_IN: 'Entrada (Check-in)',
  CHECK_OUT: 'Saída (Check-out)',
  TRANSFER: 'Transferência',
  SWAP: 'Troca',
  MAINT_START: 'Início de Manutenção',
  MAINT_END: 'Fim de Manutenção',
  DISCARD: 'Descarte',
  LOAN: 'Empréstimo',
  RETURN: 'Devolução',
}

const movementColor: Record<string, string> = {
  CHECK_IN: 'bg-green-100 text-green-700',
  CHECK_OUT: 'bg-blue-100 text-blue-700',
  TRANSFER: 'bg-purple-100 text-purple-700',
  SWAP: 'bg-orange-100 text-orange-700',
  MAINT_START: 'bg-yellow-100 text-yellow-700',
  MAINT_END: 'bg-teal-100 text-teal-700',
  DISCARD: 'bg-red-100 text-red-600',
  LOAN: 'bg-indigo-100 text-indigo-700',
  RETURN: 'bg-slate-100 text-slate-700',
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(date)
}

export default async function MovementsPage() {
  const session = await auth()
  if (session?.user.role === 'COLABORADOR') redirect('/dashboard')

  const movements = await prisma.assetMovement.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      asset: { select: { tag: true, name: true } },
      fromUser: { select: { name: true } },
      toUser: { select: { name: true } },
      actor: { select: { name: true } },
      ticket: { select: { code: true } },
    },
  })

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Movimentações</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Histórico patrimonial auditável</p>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
        {movements.length === 0 ? (
          <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-sm">
            Nenhuma movimentação registrada ainda.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {movements.map((m) => {
              const actorInitials = m.actor.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)

              return (
                <div
                  key={m.id}
                  className="flex items-center gap-6 px-6 py-5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                >
                  {/* Data e Tipo */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      {formatDate(m.createdAt)}
                    </p>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${movementColor[m.type] ?? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
                    >
                      {movementLabel[m.type] ?? m.type}
                    </span>
                  </div>

                  {/* Ativo */}
                  <div className="hidden sm:block flex-1">
                    <Link
                      href={`/assets/${m.assetId}`}
                      className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 mb-1 block"
                    >
                      {m.asset.tag}
                    </Link>
                    <p className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-[180px] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {m.asset.name}
                    </p>
                  </div>

                  {/* De → Para */}
                  <div className="hidden md:block flex-1">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Movimentação</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      <span>{m.fromUser?.name ?? m.fromLocation ?? '—'}</span>
                      <span className="mx-1.5">→</span>
                      <span>{m.toUser?.name ?? m.toLocation ?? '—'}</span>
                    </p>
                  </div>

                  {/* Executor com Avatar */}
                  <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-white">{actorInitials}</span>
                    </div>
                    <span className="text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {m.actor.name}
                    </span>
                  </div>

                  {/* Chamado */}
                  <div className="hidden xl:block flex-shrink-0">
                    {m.ticket ? (
                      <Link
                        href={`/tickets/${m.ticketId}`}
                        className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {m.ticket.code}
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
