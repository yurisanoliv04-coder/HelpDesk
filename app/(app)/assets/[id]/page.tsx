import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, HardDrive, Cpu, CircleCheck, Clock, AlertCircle } from 'lucide-react'
import { AssetPerformanceCard } from '@/components/assets/AssetPerformanceCard'

const statusLabel: Record<string, string> = {
  STOCK: 'Estoque', DEPLOYED: 'Implantado', MAINTENANCE: 'Manutenção',
  DISCARDED: 'Descartado', LOANED: 'Emprestado',
}
const statusConfig: Record<string, { bg: string; text: string; icon: string }> = {
  STOCK: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', icon: '◇' },
  DEPLOYED: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', icon: '✓' },
  MAINTENANCE: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', icon: '⚙' },
  DISCARDED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: '✕' },
  LOANED: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: '↔' },
}
const movementLabel: Record<string, string> = {
  CHECK_IN: 'Entrada', CHECK_OUT: 'Saída', TRANSFER: 'Transferência',
  SWAP: 'Troca', MAINT_START: 'Início Manutenção', MAINT_END: 'Fim Manutenção',
  DISCARD: 'Descarte', LOAN: 'Empréstimo', RETURN: 'Devolução',
}
const movementColorMap: Record<string, string> = {
  CHECK_IN: 'text-emerald-600 dark:text-emerald-400',
  CHECK_OUT: 'text-blue-600 dark:text-blue-400',
  TRANSFER: 'text-purple-600 dark:text-purple-400',
  SWAP: 'text-amber-600 dark:text-amber-400',
  MAINT_START: 'text-orange-600 dark:text-orange-400',
  MAINT_END: 'text-emerald-600 dark:text-emerald-400',
  DISCARD: 'text-red-600 dark:text-red-400',
  LOAN: 'text-blue-600 dark:text-blue-400',
  RETURN: 'text-emerald-600 dark:text-emerald-400',
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(date)
}

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (session?.user.role === 'COLABORADOR') redirect('/assets')

  const { id } = await params

  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      category: true,
      assignedToUser: { select: { id: true, name: true } },
      movements: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          fromUser: { select: { name: true } },
          toUser: { select: { name: true } },
          actor: { select: { name: true } },
          ticket: { select: { code: true } },
        },
      },
    },
  })

  if (!asset) notFound()

  const statusInfo = statusConfig[asset.status]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link href="/assets" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 transition-colors">
            <ArrowLeft size={16} />
            Patrimônio
          </Link>
          <span className="text-slate-400 dark:text-slate-600">/</span>
          <span className="font-mono text-slate-700 dark:text-slate-300">{asset.tag}</span>
        </div>

        {/* Header Card */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
          <div className="p-8">
            <div className="flex items-start justify-between gap-6 flex-wrap mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-mono text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                    {asset.tag}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                    <span>{statusInfo.icon}</span>
                    {statusLabel[asset.status]}
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{asset.name}</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">{asset.category.name}</p>
              </div>
              {asset.assignedToUser && (
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                  <p className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Usuário atual</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{asset.assignedToUser.name}</p>
                </div>
              )}
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
              <MetaField label="Localização" value={asset.location ?? '—'} icon={<MapPin size={16} />} />
              <MetaField label="Nº de série" value={asset.serialNumber ?? '—'} icon={<HardDrive size={16} />} />
              <MetaField label="Data de aquisição" value={asset.acquisitionDate ? formatDate(asset.acquisitionDate) : '—'} icon={<Clock size={16} />} />
              <MetaField label="Status" value={statusLabel[asset.status]} icon={<CircleCheck size={16} />} />
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Performance */}
          <div className="lg:col-span-1">
            <AssetPerformanceCard
              score={asset.performanceScore}
              label={asset.performanceLabel as any}
              notes={asset.performanceNotes || undefined}
            />
          </div>

          {/* Right column - Specs and Financial */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hardware Specs */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <Cpu size={20} className="text-slate-700 dark:text-slate-300" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Especificações de Hardware</h2>
              </div>
              {!asset.ramGb && !asset.cpuModel && !asset.storageType ? (
                <p className="text-slate-500 dark:text-slate-400 text-sm">Nenhuma especificação cadastrada.</p>
              ) : (
                <div className="space-y-3">
                  {asset.ramGb && <SpecRow label="Memória" value={`${asset.ramGb} GB RAM`} />}
                  {asset.cpuModel && (
                    <SpecRow
                      label="Processador"
                      value={`${asset.cpuBrand ? asset.cpuBrand + ' ' : ''}${asset.cpuModel}${asset.cpuGeneration ? ` Gen ${asset.cpuGeneration}` : ''}`}
                    />
                  )}
                  {asset.storageType && (
                    <SpecRow
                      label="Armazenamento"
                      value={`${asset.storageType.replace('_', ' ')}${asset.storageGb ? ` — ${asset.storageGb} GB` : ''}`}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Financial Info */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-5">Informações Financeiras</h2>
              {!asset.acquisitionCost && !asset.currentValue && !asset.warrantyUntil && !asset.notes ? (
                <p className="text-slate-500 dark:text-slate-400 text-sm">Nenhuma informação cadastrada.</p>
              ) : (
                <div className="space-y-4">
                  {asset.acquisitionCost && (
                    <SpecRow label="Custo de aquisição" value={`R$ ${Number(asset.acquisitionCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                  )}
                  {asset.currentValue && (
                    <SpecRow label="Valor atual" value={`R$ ${Number(asset.currentValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                  )}
                  {asset.warrantyUntil && (
                    <SpecRow label="Garantia até" value={formatDate(asset.warrantyUntil)} />
                  )}
                  {asset.notes && (
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold mb-2">Observações</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{asset.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Movements History */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
            Histórico de Movimentações
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">({asset.movements.length})</span>
          </h2>
          {asset.movements.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-slate-500 dark:text-slate-400">
              <AlertCircle size={18} className="mr-2" />
              <p className="text-sm">Nenhuma movimentação registrada.</p>
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-slate-200 dark:divide-slate-700">
              {asset.movements.map((m, idx) => (
                <div key={m.id} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="flex-shrink-0 pt-0.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${movementColorMap[m.type] || 'text-slate-400'} bg-current opacity-60`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                      <p className="font-medium text-slate-900 dark:text-white text-sm">
                        {movementLabel[m.type] ?? m.type}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {m.fromUser && <span>{m.fromUser.name}</span>}
                        {m.fromUser && m.toUser && <span> → </span>}
                        {m.toUser && <span>{m.toUser.name}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>por {m.actor.name}</span>
                      {m.ticket && (
                        <>
                          <span>·</span>
                          <Link href={`/tickets/${m.ticketId}`} className="font-mono text-blue-600 dark:text-blue-400 hover:underline">
                            {m.ticket.code}
                          </Link>
                        </>
                      )}
                      <span>·</span>
                      <span>{formatDate(m.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MetaField({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
        {icon && <span className="text-slate-500 dark:text-slate-500">{icon}</span>}
        {label}
      </p>
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  )
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-900 dark:text-slate-100">{value}</span>
    </div>
  )
}
