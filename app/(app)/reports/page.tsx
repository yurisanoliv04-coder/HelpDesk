import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'

async function getReportData() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    ticketsThisMonth,
    ticketsByStatus,
    ticketsByPriority,
    ticketsByCategory,
    assetsByStatus,
    assetsByPerformance,
    recentMovements,
    topRequesters,
  ] = await Promise.all([
    prisma.ticket.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.ticket.groupBy({ by: ['status'], _count: true }),
    prisma.ticket.groupBy({ by: ['priority'], _count: true }),
    prisma.ticket.groupBy({
      by: ['categoryId'],
      _count: true,
      orderBy: { _count: { categoryId: 'desc' } },
      take: 5,
    }),
    prisma.asset.groupBy({ by: ['status'], _count: true }),
    prisma.asset.groupBy({ by: ['performanceLabel'], _count: true }),
    prisma.assetMovement.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.ticket.groupBy({
      by: ['requesterId'],
      _count: true,
      orderBy: { _count: { requesterId: 'desc' } },
      take: 5,
    }),
  ])

  const categories = await prisma.ticketCategory.findMany({ select: { id: true, name: true } })
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))

  const requesters = await prisma.user.findMany({
    where: { id: { in: topRequesters.map((r) => r.requesterId) } },
    select: { id: true, name: true },
  })
  const requesterMap = Object.fromEntries(requesters.map((u) => [u.id, u.name]))

  return {
    ticketsThisMonth,
    ticketsByStatus,
    ticketsByPriority,
    ticketsByCategory: ticketsByCategory.map((t) => ({
      name: categoryMap[t.categoryId] ?? 'Desconhecida',
      count: t._count,
    })),
    assetsByStatus,
    assetsByPerformance,
    recentMovements,
    topRequesters: topRequesters.map((r) => ({
      name: requesterMap[r.requesterId] ?? 'Desconhecido',
      count: r._count,
    })),
  }
}

const statusLabel: Record<string, string> = {
  OPEN: 'Aberto', IN_PROGRESS: 'Em atendimento', ON_HOLD: 'Aguardando',
  DONE: 'Concluído', CANCELED: 'Cancelado',
}
const priorityLabel: Record<string, string> = {
  LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta', URGENT: 'Urgente',
}
const assetStatusLabel: Record<string, string> = {
  STOCK: 'Estoque', DEPLOYED: 'Implantado', MAINTENANCE: 'Manutenção',
  DISCARDED: 'Descartado', LOANED: 'Emprestado',
}
const perfLabel: Record<string, string> = {
  BOM: 'Bom', INTERMEDIARIO: 'Intermediário', RUIM: 'Ruim',
}

export default async function ReportsPage() {
  const session = await auth()
  if (session?.user.role === 'COLABORADOR') redirect('/dashboard')

  const data = await getReportData()

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Relatórios</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Visão consolidada do sistema</p>
      </div>

      {/* Chamados do mês */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400">Chamados no mês</p>
          <p className="text-4xl font-bold text-slate-900 dark:text-white mt-2">{data.ticketsThisMonth}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Mês corrente</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400">Movimentações no mês</p>
          <p className="text-4xl font-bold text-slate-900 dark:text-white mt-2">{data.recentMovements}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Entradas, saídas, trocas</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400">Ativos no parque</p>
          <p className="text-4xl font-bold text-slate-900 dark:text-white mt-2">
            {data.assetsByStatus.reduce((acc, a) => acc + a._count, 0)}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Total cadastrado</p>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chamados por status */}
        <ReportCard title="Chamados por Status">
          {data.ticketsByStatus.map((s) => (
            <Row key={s.status} label={statusLabel[s.status] ?? s.status} value={s._count} />
          ))}
        </ReportCard>

        {/* Chamados por prioridade */}
        <ReportCard title="Chamados por Prioridade">
          {data.ticketsByPriority.map((p) => (
            <Row key={p.priority} label={priorityLabel[p.priority] ?? p.priority} value={p._count} />
          ))}
        </ReportCard>

        {/* Top categorias */}
        <ReportCard title="Top Categorias de Chamado">
          {data.ticketsByCategory.length === 0
            ? <p className="text-slate-400 text-sm">Sem dados</p>
            : data.ticketsByCategory.map((c) => (
                <Row key={c.name} label={c.name} value={c.count} />
              ))}
        </ReportCard>

        {/* Ativos por status */}
        <ReportCard title="Ativos por Status">
          {data.assetsByStatus.map((a) => (
            <Row key={a.status} label={assetStatusLabel[a.status] ?? a.status} value={a._count} />
          ))}
        </ReportCard>

        {/* Performance do parque */}
        <ReportCard title="Qualidade do Parque de Máquinas">
          {data.assetsByPerformance.filter((p) => p.performanceLabel).map((p) => (
            <Row key={p.performanceLabel} label={perfLabel[p.performanceLabel!] ?? p.performanceLabel!} value={p._count} />
          ))}
          {data.assetsByPerformance.every((p) => !p.performanceLabel) && (
            <p className="text-slate-400 text-sm">Nenhum ativo com specs cadastradas</p>
          )}
        </ReportCard>

        {/* Top solicitantes */}
        <ReportCard title="Maiores Solicitantes">
          {data.topRequesters.length === 0
            ? <p className="text-slate-400 text-sm">Sem dados</p>
            : data.topRequesters.map((r) => (
                <Row key={r.name} label={r.name} value={r.count} />
              ))}
        </ReportCard>
      </div>
    </div>
  )
}

function ReportCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wider">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-600 dark:text-slate-400">{label}</span>
      <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{value}</span>
    </div>
  )
}
