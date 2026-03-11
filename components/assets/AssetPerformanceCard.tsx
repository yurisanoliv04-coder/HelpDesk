'use client'

import React from 'react'
import { Activity, Zap, AlertTriangle } from 'lucide-react'

interface AssetPerformanceCardProps {
  score?: number | null
  label?: 'RUIM' | 'INTERMEDIARIO' | 'BOM' | null
  notes?: string
}

export function AssetPerformanceCard({
  score = null,
  label = null,
  notes,
}: AssetPerformanceCardProps) {
  if (score === null || !label) {
    return (
      <div className="relative overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
        <div className="flex items-center justify-center py-8">
          <Activity size={24} className="text-slate-300 dark:text-slate-600 opacity-50" />
          <p className="text-sm text-slate-500 dark:text-slate-400 ml-2">Sem informações de desempenho</p>
        </div>
      </div>
    )
  }

  const scoreConfig = {
    BOM: {
      bg: 'from-emerald-50 to-emerald-100/50 dark:from-emerald-900/30 dark:to-emerald-800/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      textColor: 'text-emerald-900 dark:text-emerald-100',
      labelColor: 'text-emerald-700 dark:text-emerald-300',
      accent: 'bg-emerald-500',
      icon: <Activity size={20} className="stroke-[1.5]" />,
      description: 'Equipamento em bom estado',
    },
    INTERMEDIARIO: {
      bg: 'from-amber-50 to-amber-100/50 dark:from-amber-900/30 dark:to-amber-800/20',
      border: 'border-amber-200 dark:border-amber-800',
      textColor: 'text-amber-900 dark:text-amber-100',
      labelColor: 'text-amber-700 dark:text-amber-300',
      accent: 'bg-amber-500',
      icon: <AlertTriangle size={20} className="stroke-[1.5]" />,
      description: 'Equipamento requer atenção',
    },
    RUIM: {
      bg: 'from-red-50 to-red-100/50 dark:from-red-900/30 dark:to-red-800/20',
      border: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-900 dark:text-red-100',
      labelColor: 'text-red-700 dark:text-red-300',
      accent: 'bg-red-500',
      icon: <Zap size={20} className="stroke-[1.5]" />,
      description: 'Equipamento em mau estado',
    },
  }

  const config = scoreConfig[label]

  // Generate color classes for the bar
  const getBarColor = () => {
    if (score >= 80) return 'bg-emerald-500 dark:bg-emerald-500'
    if (score >= 50) return 'bg-amber-500 dark:bg-amber-500'
    return 'bg-red-500 dark:bg-red-500'
  }

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${config.bg} border ${config.border} rounded-2xl p-6`}>
      {/* Icon header */}
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg bg-white dark:bg-slate-700/50`}>
          <div className={config.labelColor}>{config.icon}</div>
        </div>
        <p className={`text-xs font-bold uppercase tracking-wider ${config.labelColor}`}>
          {label === 'INTERMEDIARIO' ? 'Intermediário' : label}
        </p>
      </div>

      {/* Score display */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-2">
          <p className={`text-4xl font-bold ${config.textColor}`}>{score}</p>
          <p className={`text-sm font-medium ${config.labelColor}`}>/ 100</p>
        </div>
        <p className={`text-sm ${config.labelColor}`}>{config.description}</p>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-white dark:bg-slate-700/50 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full ${getBarColor()} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Notes if available */}
      {notes && (
        <div className="pt-4 border-t border-white/20 dark:border-slate-600/50">
          <p className={`text-xs font-semibold uppercase tracking-wider ${config.labelColor} mb-2`}>
            Recomendações
          </p>
          <p className={`text-sm leading-relaxed ${config.textColor}`}>
            {notes}
          </p>
        </div>
      )}
    </div>
  )
}
