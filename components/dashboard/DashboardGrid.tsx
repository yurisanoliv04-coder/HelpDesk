'use client'

import React, { useState, useCallback } from 'react'
import ReactGridLayout from 'react-grid-layout/legacy'
import { Layout, LayoutItem } from 'react-grid-layout'
import { WidgetInstance } from '@/lib/dashboard/types'
import { WIDGET_CATALOG } from '@/lib/dashboard/catalog'
import { DashboardConfigProvider } from '@/lib/dashboard/widget-context'
import WidgetShell from './WidgetShell'

// ── Grid constants ─────────────────────────────────────────────────────────────
const COLS       = 12
const ROW_HEIGHT = 20   // px per row unit — fine-grained for precise alignment
const COL_GAP    = 8    // horizontal gap — fixed

interface Props {
  instances:      WidgetInstance[]
  slots:          Record<string, React.ReactNode>
  isEditMode:     boolean
  rowGap:         number
  onLayoutChange: (newInstances: WidgetInstance[]) => void
  onRemove:       (id: string) => void
  onUpdate:       (updated: WidgetInstance) => void
}

function toRGLLayout(instances: WidgetInstance[]): LayoutItem[] {
  return instances.map((inst) => {
    const def = WIDGET_CATALOG.find((d) => d.id === inst.widgetId)
    return {
      i:    inst.instanceId,
      x:    inst.x,
      y:    inst.y,
      w:    inst.w,
      h:    inst.h,
      minW: def?.minW ?? 2,
      minH: def?.minH ?? 1,
    }
  })
}

export default function DashboardGrid({
  instances,
  slots,
  isEditMode,
  rowGap,
  onLayoutChange,
  onRemove,
  onUpdate,
}: Props) {
  const [containerWidth, setContainerWidth] = useState(1200)
  const containerRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  function handleInteractionEnd(newLayout: Layout) {
    const updated = instances.map((inst) => {
      const item = (newLayout as LayoutItem[]).find((l) => l.i === inst.instanceId)
      if (!item) return inst
      return { ...inst, x: item.x, y: item.y, w: item.w, h: item.h }
    })
    onLayoutChange(updated)
  }

  const layout = toRGLLayout(instances)

  return (
    <DashboardConfigProvider instances={instances}>
      <div
        ref={containerRef}
        className={isEditMode ? 'dash-edit-mode' : ''}
        style={{ width: '100%' }}
      >
        <ReactGridLayout
          layout={layout}
          cols={COLS}
          rowHeight={ROW_HEIGHT}
          width={containerWidth}
          margin={[COL_GAP, rowGap]}
          containerPadding={[0, 0]}
          isDraggable={isEditMode}
          isResizable={isEditMode}
          compactType="vertical"
          preventCollision={false}
          draggableCancel=".widget-no-drag"
          resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
          onDragStop={(newLayout) => handleInteractionEnd(newLayout)}
          onResizeStop={(newLayout) => handleInteractionEnd(newLayout)}
          style={{ minHeight: 200 }}
        >
          {instances.map((inst) => (
            <div key={inst.instanceId} style={{ height: '100%' }}>
              <WidgetShell
                instance={inst}
                isEditMode={isEditMode}
                onRemove={onRemove}
                onUpdate={onUpdate}
              >
                {slots[inst.instanceId] ?? null}
              </WidgetShell>
            </div>
          ))}
        </ReactGridLayout>
      </div>
    </DashboardConfigProvider>
  )
}
