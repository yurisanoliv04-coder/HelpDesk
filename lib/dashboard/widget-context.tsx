'use client'

import { createContext, useContext, ReactNode } from 'react'
import { WidgetInstance } from './types'

// ── Dashboard-wide config context ─────────────────────────────────────────
// Maps all instances so any widget can read its own config via instanceId.
const DashboardConfigCtx = createContext<WidgetInstance[]>([])

export function DashboardConfigProvider({
  instances,
  children,
}: {
  instances: WidgetInstance[]
  children: ReactNode
}) {
  return (
    <DashboardConfigCtx.Provider value={instances}>
      {children}
    </DashboardConfigCtx.Provider>
  )
}

// ── Per-widget instance context ────────────────────────────────────────────
// Set by WidgetShell — allows any child (even deep) to know its instanceId.
const WidgetInstanceCtx = createContext<string>('')

export function WidgetInstanceProvider({
  instanceId,
  children,
}: {
  instanceId: string
  children: ReactNode
}) {
  return (
    <WidgetInstanceCtx.Provider value={instanceId}>
      {children}
    </WidgetInstanceCtx.Provider>
  )
}

// ── Hook: read current widget's config ────────────────────────────────────
export function useWidgetConfig(): Record<string, unknown> {
  const instanceId = useContext(WidgetInstanceCtx)
  const instances  = useContext(DashboardConfigCtx)
  return instances.find((i) => i.instanceId === instanceId)?.config ?? {}
}
