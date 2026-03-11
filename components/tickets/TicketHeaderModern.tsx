'use client'

import React from 'react'
import { ArrowLeft, AlertCircle, Clock, Zap, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Status = 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'DONE' | 'CANCELED'
type Priority = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE'

interface TicketHeaderModernProps {
  code: string
  title: string
  status: Status
  priority: Priority
  category: string
  createdAt: Date
}

const statusConfig = {
  OPEN: { label: 'Em aberto', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: AlertCircle },
  IN_PROGRESS: { label: 'Em atendimento', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  ON_HOLD: { label: 'Aguardando', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Clock },
  DONE: { label: 'Concluído', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  CANCELED: { label: 'Cancelado', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: AlertCircle },
}

const priorityConfig = {
  BAIXA: { label: 'Baixa', color: 'bg-blue-100 text-blue-700', icon: null },
  MEDIA: { label: 'Média', color: 'bg-amber-100 text-amber-700', icon: null },
  ALTA: { label: 'Alta', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  URGENTE: { label: 'Urgente', color: 'bg-red-200 text-red-800', icon: Zap },
}

export function TicketHeaderModern({
  code,
  title,
  status,
  priority,
  category,
  createdAt,
}: TicketHeaderModernProps) {
  const statusInfo = statusConfig[status]
  const priorityInfo = priorityConfig[priority]
  const StatusIcon = statusInfo.icon
  const timeAgo = formatDistanceToNow(new Date(createdAt), {
    addSuffix: true,
    locale: ptBR,
  })

  return (
    <div className="space-y-4">
      {/* Back button and breadcrumb */}
      <Link href="/tickets" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors font-medium text-sm">
        <ArrowLeft size={16} className="stroke-[2]" />
        <span>Voltar para Chamados</span>
      </Link>

      {/* Main header card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-4">
          {/* Left side - Code and Title */}
          <div className="flex-1 min-w-0">
            {/* Code and category */}
            <div className="flex items-center gap-3 mb-3">
              <span className="font-mono text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
                {code}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                {category}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-slate-900 mb-2 leading-tight">
              {title}
            </h1>

            {/* Time info */}
            <p className="text-sm text-slate-600">
              Aberto {timeAgo}
            </p>
          </div>

          {/* Right side - Status and Priority badges */}
          <div className="flex flex-col gap-2">
            {/* Status badge */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${statusInfo.color} font-medium text-sm`}>
              <StatusIcon size={16} className="stroke-[2]" />
              <span>{statusInfo.label}</span>
            </div>

            {/* Priority badge */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${priorityInfo.color} font-semibold text-sm`}>
              {priorityInfo.icon && <priorityInfo.icon size={16} className="stroke-[2]" />}
              <span>{priorityInfo.label}</span>
            </div>
          </div>
        </div>

        {/* Bottom decoration line */}
        <div className="h-1 bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full mt-4" />
      </div>
    </div>
  )
}
