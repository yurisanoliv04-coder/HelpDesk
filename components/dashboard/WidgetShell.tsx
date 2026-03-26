'use client'

import { GripVertical, X } from 'lucide-react'
import { WidgetInstance } from '@/lib/dashboard/types'
import { WIDGET_CATALOG } from '@/lib/dashboard/catalog'

interface Props {
  instance:   WidgetInstance
  isEditMode: boolean
  onRemove:   (instanceId: string) => void
  children:   React.ReactNode
}

export default function WidgetShell({ instance, isEditMode, onRemove, children }: Props) {
  const def       = WIDGET_CATALOG.find((w) => w.id === instance.widgetId)
  const isDivider = instance.widgetId === 'divider'

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 10,
        border: isEditMode ? '1.5px dashed rgba(16,185,129,0.25)' : undefined,
        transition: 'border-color 0.12s',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        cursor: isEditMode ? 'grab' : undefined,
      }}
    >
      {/* ── Edit-mode top bar ───────────────────────────────────────────── */}
      {isEditMode && (
        <div
          className="widget-no-drag"
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(8,14,26,0.96)',
            borderBottom: '1px solid rgba(16,185,129,0.18)',
            borderTopLeftRadius: 10, borderTopRightRadius: 10,
            padding: '3px 6px', backdropFilter: 'blur(4px)',
          }}
        >
          {/* Grip — visual hint that the whole widget is draggable */}
          <GripVertical size={13} style={{ color: 'rgba(16,185,129,0.6)', flexShrink: 0 }} />

          {/* Widget label */}
          <span style={{
            fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
            color: 'rgba(16,185,129,0.8)', letterSpacing: '0.06em',
            flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {def?.label ?? instance.widgetId}
          </span>

          {/* Size indicator */}
          <span style={{
            fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
            color: 'rgba(16,185,129,0.35)', flexShrink: 0,
          }}>
            {instance.w}×{instance.h}
          </span>

          {/* Remove button */}
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(instance.instanceId) }}
            title="Remover widget"
            style={{
              background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)',
              borderRadius: 4, color: '#f87171', width: 20, height: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', padding: 0, flexShrink: 0,
            }}
          >
            <X size={11} />
          </button>
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        paddingTop: isEditMode && !isDivider ? 28 : 0,
        pointerEvents: isEditMode ? 'none' : undefined,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}>
        {children}
      </div>
    </div>
  )
}
