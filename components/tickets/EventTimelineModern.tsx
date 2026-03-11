'use client'

import React from 'react'
import {
  MessageCircle,
  CheckCircle2,
  User,
  Zap,
  RotateCcw,
  AlertCircle,
  Clock,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface EventTimelineItem {
  id: string
  type: 'COMMENTED' | 'ASSIGNED' | 'STATUS_CHANGED' | 'CLOSED' | 'REOPENED' | 'CREATED'
  actorName: string
  description: string
  createdAt: Date
  isInternal?: boolean
}

interface EventTimelineModernProps {
  events: EventTimelineItem[]
  isLoading?: boolean
}

const eventConfig = {
  COMMENTED: {
    icon: MessageCircle,
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    label: 'Comentário',
  },
  ASSIGNED: {
    icon: User,
    color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    label: 'Atribuído',
  },
  STATUS_CHANGED: {
    icon: Zap,
    color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    label: 'Status alterado',
  },
  CLOSED: {
    icon: CheckCircle2,
    color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    label: 'Fechado',
  },
  REOPENED: {
    icon: RotateCcw,
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    label: 'Reaberth',
  },
  CREATED: {
    icon: AlertCircle,
    color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    label: 'Criado',
  },
}

export function EventTimelineModern({
  events,
  isLoading = false,
}: EventTimelineModernProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400">
        <Clock size={32} className="mx-auto mb-2 opacity-30" />
        <p>Nenhum evento registrado</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => {
        const config = eventConfig[event.type]
        const Icon = config.icon
        const timeAgo = formatDistanceToNow(new Date(event.createdAt), {
          addSuffix: true,
          locale: ptBR,
        })

        return (
          <div key={event.id} className="flex gap-4 pb-4">
            {/* Timeline line */}
            {index < events.length - 1 && (
              <div className="absolute left-[27px] top-[52px] w-0.5 h-12 bg-gradient-to-b from-slate-300 dark:from-slate-600 to-slate-100 dark:to-slate-700" />
            )}

            {/* Icon */}
            <div className={`relative p-2 rounded-lg ${config.color} flex-shrink-0`}>
              <Icon size={18} className="stroke-[2]" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {event.actorName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{config.label}</p>
              </div>

              <p className="text-sm text-slate-700 dark:text-slate-300 mb-1">{event.description}</p>

              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">{timeAgo}</p>
                {event.isInternal && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 text-xs text-purple-700 dark:text-purple-400 font-medium">
                    <Lock size={12} className="stroke-[2]" />
                    Interno
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Icon component placeholder
function Lock({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}
