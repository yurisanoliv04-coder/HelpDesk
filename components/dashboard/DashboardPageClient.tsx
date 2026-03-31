'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SerializedDashboard, WidgetInstance } from '@/lib/dashboard/types'
import { WIDGET_CATALOG } from '@/lib/dashboard/catalog'
import { saveDashboardLayout } from '@/app/(app)/dashboard/actions'
import DashboardHeader, { GAP_MIN, GAP_MAX } from './DashboardHeader'
import DashboardGrid from './DashboardGrid'
import WidgetCatalogModal from './WidgetCatalogModal'
import DashboardManager from './DashboardManager'

const DEFAULT_GAP = 8

function loadGap(dashboardId: string): number {
  if (typeof window === 'undefined') return DEFAULT_GAP
  const v = localStorage.getItem(`dashboard:gap:${dashboardId}`)
  if (v === null) return DEFAULT_GAP
  const n = parseInt(v, 10)
  return isNaN(n) ? DEFAULT_GAP : Math.min(GAP_MAX, Math.max(GAP_MIN, n))
}

function saveGap(dashboardId: string, gap: number) {
  localStorage.setItem(`dashboard:gap:${dashboardId}`, String(gap))
}

function uid(): string {
  return `w-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

interface Props {
  initialDashboards: SerializedDashboard[]
  initialActiveId:   string
  isTI:              boolean
  initialSlots:      Record<string, React.ReactNode>
}

export default function DashboardPageClient({
  initialDashboards,
  initialActiveId,
  isTI,
  initialSlots,
}: Props) {
  const router = useRouter()
  const [dashboards, setDashboards] = useState<SerializedDashboard[]>(initialDashboards)
  const [activeId, setActiveId]     = useState(initialActiveId)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isSaving, setIsSaving]     = useState(false)
  const [showCatalog, setShowCatalog] = useState(false)
  const [showManager, setShowManager] = useState(false)
  const [rowGap, setRowGap]           = useState(DEFAULT_GAP)

  const [slots, setSlots] = useState<Record<string, React.ReactNode>>(initialSlots)
  const prevInitialSlotsRef = useRef(initialSlots)
  if (prevInitialSlotsRef.current !== initialSlots) {
    prevInitialSlotsRef.current = initialSlots
    setSlots((prev) => ({ ...prev, ...initialSlots }))
  }

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeDashboard = dashboards.find((d) => d.id === activeId) ?? dashboards[0]
  const [optimisticLayout, setOptimisticLayout] = useState<WidgetInstance[]>(
    () => (activeDashboard?.layout ?? []) as WidgetInstance[],
  )

  useEffect(() => {
    setRowGap(loadGap(activeId))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId])

  function handleGapChange(gap: number) {
    setRowGap(gap)
    saveGap(activeId, gap)
  }

  const editSnapshotRef = useRef<WidgetInstance[]>([])

  function switchDashboard(id: string) {
    const db = dashboards.find((d) => d.id === id)
    if (!db) return
    setActiveId(id)
    setOptimisticLayout((db.layout ?? []) as WidgetInstance[])
    setIsEditMode(false)
    router.push(`?db=${id}`)
  }

  function handleToggleEdit() {
    setIsEditMode((prev) => {
      if (!prev) editSnapshotRef.current = optimisticLayout
      return !prev
    })
  }

  async function handleDiscard() {
    const snapshot = editSnapshotRef.current
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null }
    setOptimisticLayout(snapshot)
    setIsEditMode(false)
    setIsSaving(true)
    try {
      await saveDashboardLayout(activeId, snapshot)
      setDashboards((prev) =>
        prev.map((d) => (d.id === activeId ? { ...d, layout: snapshot } : d)),
      )
      router.refresh()
    } finally {
      setIsSaving(false)
    }
  }

  const scheduleLayoutSave = useCallback(
    (newLayout: WidgetInstance[]) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        setIsSaving(true)
        try {
          await saveDashboardLayout(activeId, newLayout)
          setDashboards((prev) =>
            prev.map((d) => (d.id === activeId ? { ...d, layout: newLayout } : d)),
          )
        } finally {
          setIsSaving(false)
        }
      }, 800)
    },
    [activeId],
  )

  function handleLayoutChange(newInstances: WidgetInstance[]) {
    setOptimisticLayout(newInstances)
    scheduleLayoutSave(newInstances)
  }

  function handleConfigChange(updated: WidgetInstance) {
    setOptimisticLayout((prev) => {
      const next = prev.map((i) => (i.instanceId === updated.instanceId ? updated : i))
      scheduleLayoutSave(next)
      return next
    })
  }

  function handleRemove(instanceId: string) {
    setOptimisticLayout((prev) => {
      const updated = prev.filter((i) => i.instanceId !== instanceId)
      scheduleLayoutSave(updated)
      return updated
    })
  }

  async function handleAddWidget(widgetId: WidgetInstance['widgetId']) {
    const def = WIDGET_CATALOG.find((d) => d.id === widgetId)
    if (!def) return
    const maxY = optimisticLayout.reduce((acc, i) => Math.max(acc, i.y + i.h), 0)
    const newInst: WidgetInstance = {
      instanceId: uid(),
      widgetId,
      x: 0,
      y: maxY,
      w: def.defaultW,
      h: def.defaultH,
    }
    const updated = [...optimisticLayout, newInst]
    setOptimisticLayout(updated)
    await saveDashboardLayout(activeId, updated)
    router.refresh()
  }

  const existingWidgetIds = optimisticLayout.map((i) => i.widgetId)

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <DashboardHeader
        dashboards={dashboards}
        activeId={activeId}
        isEditMode={isEditMode}
        isSaving={isSaving}
        rowGap={rowGap}
        onSwitch={switchDashboard}
        onToggleEdit={handleToggleEdit}
        onDiscard={handleDiscard}
        onAddWidget={() => setShowCatalog(true)}
        onManage={() => setShowManager(true)}
        onGapChange={handleGapChange}
      />

      <DashboardGrid
        instances={optimisticLayout}
        slots={slots}
        isEditMode={isEditMode}
        rowGap={rowGap}
        onLayoutChange={handleLayoutChange}
        onRemove={handleRemove}
        onUpdate={handleConfigChange}
      />

      {showCatalog && (
        <WidgetCatalogModal
          isTI={isTI}
          existingWidgetIds={existingWidgetIds}
          onAdd={handleAddWidget}
          onClose={() => setShowCatalog(false)}
        />
      )}

      {showManager && (
        <DashboardManager
          dashboards={dashboards}
          activeId={activeId}
          onUpdate={(updated) => {
            setDashboards(updated)
            if (!updated.find((d) => d.id === activeId)) {
              switchDashboard(updated[0].id)
            }
          }}
          onClose={() => setShowManager(false)}
        />
      )}
    </div>
  )
}
