'use client'

import React, { useState } from 'react'
import { AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react'

type Status = 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'DONE' | 'CANCELED'

interface StatusPanelModernProps {
  currentStatus: Status
  onStatusChange: (status: Status) => Promise<void>
  isLoading?: boolean
  disabled?: boolean
}

const statusOptions: Array<{
  value: Status
  label: string
  icon: React.ReactNode
  description: string
  color: string
  bgColor: string
  hoverColor: string
  darkColor: string
  darkBgColor: string
}> = [
  {
    value: 'OPEN',
    label: 'Em aberto',
    icon: <AlertCircle size={18} className="stroke-[1.5]" />,
    description: 'Não atribuído ou não iniciado',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    hoverColor: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
    darkColor: 'dark:text-blue-400',
    darkBgColor: 'dark:bg-blue-900/20',
  },
  {
    value: 'IN_PROGRESS',
    label: 'Em atendimento',
    icon: <Clock size={18} className="stroke-[1.5]" />,
    description: 'Técnico está trabalhando',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    hoverColor: 'hover:bg-amber-100 dark:hover:bg-amber-900/30',
    darkColor: 'dark:text-amber-400',
    darkBgColor: 'dark:bg-amber-900/20',
  },
  {
    value: 'ON_HOLD',
    label: 'Aguardando',
    icon: <Clock size={18} className="stroke-[1.5]" />,
    description: 'Aguardando informações',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    hoverColor: 'hover:bg-purple-100 dark:hover:bg-purple-900/30',
    darkColor: 'dark:text-purple-400',
    darkBgColor: 'dark:bg-purple-900/20',
  },
  {
    value: 'DONE',
    label: 'Concluído',
    icon: <CheckCircle2 size={18} className="stroke-[1.5]" />,
    description: 'Problema resolvido',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    hoverColor: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/30',
    darkColor: 'dark:text-emerald-400',
    darkBgColor: 'dark:bg-emerald-900/20',
  },
  {
    value: 'CANCELED',
    label: 'Cancelado',
    icon: <AlertCircle size={18} className="stroke-[1.5]" />,
    description: 'Chamado encerrado',
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-50 dark:bg-slate-800',
    hoverColor: 'hover:bg-slate-100 dark:hover:bg-slate-700',
    darkColor: 'dark:text-slate-400',
    darkBgColor: 'dark:bg-slate-800',
  },
]

export function StatusPanelModern({
  currentStatus,
  onStatusChange,
  isLoading = false,
  disabled = false,
}: StatusPanelModernProps) {
  const [localLoading, setLocalLoading] = useState(false)

  const handleStatusChange = async (newStatus: Status) => {
    if (newStatus === currentStatus || isLoading || localLoading || disabled) return

    setLocalLoading(true)
    try {
      await onStatusChange(newStatus)
    } finally {
      setLocalLoading(false)
    }
  }

  const current = statusOptions.find(s => s.value === currentStatus)

  return (
    <div className="space-y-4">
      {/* Current status display */}
      <div className={`p-4 rounded-lg border ${current?.bgColor} border-slate-200 dark:border-slate-700`}>
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Status atual</p>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${current?.bgColor}`}>
            <div className={current?.color}>{current?.icon}</div>
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">{current?.label}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{current?.description}</p>
          </div>
        </div>
      </div>

      {/* Status options */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Alterar para</p>
        <div className="grid grid-cols-1 gap-2">
          {statusOptions.map(status => (
            <button
              key={status.value}
              onClick={() => handleStatusChange(status.value)}
              disabled={
                status.value === currentStatus ||
                isLoading ||
                localLoading ||
                disabled
              }
              className={`
                relative p-3 rounded-lg border-2 transition-all duration-200
                flex items-center gap-3
                ${
                  status.value === currentStatus
                    ? `${status.bgColor} border-${status.value === 'OPEN' ? 'blue' : status.value === 'IN_PROGRESS' ? 'amber' : status.value === 'ON_HOLD' ? 'purple' : status.value === 'DONE' ? 'emerald' : 'slate'}-300 dark:border-${status.value === 'OPEN' ? 'blue' : status.value === 'IN_PROGRESS' ? 'amber' : status.value === 'ON_HOLD' ? 'purple' : status.value === 'DONE' ? 'emerald' : 'slate'}-800 cursor-default`
                    : `border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:${status.hoverColor} hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer`
                }
              `}
            >
              <div className={`p-2 rounded ${status.bgColor}`}>
                <div className={status.color}>{status.icon}</div>
              </div>

              <div className="text-left flex-1">
                <p className="font-medium text-sm text-slate-900 dark:text-white">{status.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{status.description}</p>
              </div>

              {/* Loading or checkmark */}
              {localLoading && status.value === currentStatus ? (
                <Loader2 className="animate-spin text-emerald-500 dark:text-emerald-400" size={18} />
              ) : status.value === currentStatus ? (
                <div className="w-5 h-5 rounded-full bg-emerald-500 dark:bg-emerald-500 flex items-center justify-center">
                  <CheckCircle2 size={16} className="text-white" />
                </div>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* Info text */}
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
        Alterar o status do chamado afetará as notificações enviadas ao solicitante.
      </p>
    </div>
  )
}
