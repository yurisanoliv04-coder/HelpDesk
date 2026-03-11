'use client'

import React, { useState } from 'react'
import { User, Loader2, CheckCircle2 } from 'lucide-react'

interface Technician {
  id: string
  name: string
  role: 'TECNICO' | 'AUXILIAR_TI' | 'ADMIN'
}

interface AssignPanelModernProps {
  technicians: Technician[]
  currentAssignee?: Technician
  onAssign: (technicianId: string) => Promise<void>
  isLoading?: boolean
  disabled?: boolean
}

export function AssignPanelModern({
  technicians,
  currentAssignee,
  onAssign,
  isLoading = false,
  disabled = false,
}: AssignPanelModernProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localLoading, setLocalLoading] = useState(false)

  const handleAssign = async (technicianId: string) => {
    if (localLoading || isLoading) return

    setLocalLoading(true)
    try {
      await onAssign(technicianId)
      setIsOpen(false)
    } finally {
      setLocalLoading(false)
    }
  }

  const getRoleLabel = (role: string) => {
    const labels = {
      TECNICO: 'Técnico',
      AUXILIAR_TI: 'Auxiliar TI',
      ADMIN: 'Administrador',
    }
    return labels[role as keyof typeof labels] || role
  }

  return (
    <div className="space-y-3">
      {/* Current assignee display */}
      {currentAssignee ? (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-2">
            Atribuído a
          </p>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900 dark:text-white">{currentAssignee.name}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{getRoleLabel(currentAssignee.role)}</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[2]" />
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
            Não atribuído
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Este chamado ainda não foi atribuído a nenhum técnico.
          </p>
        </div>
      )}

      {/* Reassign button or dropdown */}
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading || localLoading || disabled}
          className="w-full p-3 px-4 bg-white dark:bg-slate-800 border-2 border-emerald-500 dark:border-emerald-600 text-emerald-600 dark:text-emerald-400 rounded-lg font-medium hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {localLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Atribuindo...</span>
            </>
          ) : (
            <>
              <User size={18} className="stroke-[1.5]" />
              <span>{currentAssignee ? 'Reatribuir' : 'Atribuir técnico'}</span>
            </>
          )}
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="mt-2 absolute right-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg dark:shadow-slate-900/50 z-10 w-80 max-h-96 overflow-y-auto">
            <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Selecione um técnico</p>
            </div>

            <div className="divide-y dark:divide-slate-700">
              {technicians.map(tech => (
                <button
                  key={tech.id}
                  onClick={() => handleAssign(tech.id)}
                  disabled={localLoading || isLoading}
                  className={`
                    w-full p-3 px-4 text-left hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors
                    flex items-center gap-3
                    ${tech.id === currentAssignee?.id ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}
                  `}
                >
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                    <User className="w-4 h-4 text-slate-600 dark:text-slate-400 stroke-[2]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">{tech.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{getRoleLabel(tech.role)}</p>
                  </div>
                  {tech.id === currentAssignee?.id && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[2]" />
                  )}
                </button>
              ))}
            </div>

            {technicians.length === 0 && (
              <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                Nenhum técnico disponível
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info text */}
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
        A atribuição automática alterará o status para "Em atendimento" se estiver em "Em aberto".
      </p>
    </div>
  )
}
