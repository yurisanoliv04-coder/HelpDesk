'use client'

import { X } from 'lucide-react'
import { getAvailableWidgets } from '@/lib/dashboard/catalog'
import { WidgetId, WidgetDef } from '@/lib/dashboard/types'
import { WidgetPreview } from './WidgetPreview'

// Simple icon text fallback since lucide names are strings
function IconLabel({ name }: { name: string }) {
  return (
    <span style={{
      fontSize: 18,
      fontFamily: "'JetBrains Mono', monospace",
      color: '#10b981',
    }}>
      ⊞
    </span>
  )
}

// Widget IDs that can be added multiple times (layout helpers)
const MULTI_ALLOWED = new Set(['divider'])

const GROUPS: { label: string; ids: string[] }[] = [
  {
    label: 'Chamados',
    ids: ['tickets_open_kpis', 'tickets_my', 'tickets_recent', 'tickets_weekly_chart', 'tickets_tech_chart'],
  },
  {
    label: 'Patrimônio',
    ids: ['assets_kpis', 'assets_dept_chart', 'assets_low_stock', 'assets_movements', 'purchases_pending'],
  },
  {
    label: 'Alertas',
    ids: ['system_alerts'],
  },
  {
    label: 'Geral',
    ids: ['weather', 'messages_recent', 'calendar'],
  },
  {
    label: 'Layout',
    ids: ['divider'],
  },
]

interface Props {
  isTI: boolean
  existingWidgetIds: string[]
  onAdd: (widgetId: WidgetId) => void
  onClose: () => void
}

export default function WidgetCatalogModal({ isTI, existingWidgetIds, onAdd, onClose }: Props) {
  const available = getAvailableWidgets(isTI)

  function handleAdd(def: WidgetDef) {
    onAdd(def.id)
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          width: '90%', maxWidth: 720,
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
              Adicionar Widget
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
              Clique em um widget para adicioná-lo ao dashboard
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 6, width: 30, height: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-dim)', cursor: 'pointer',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>
          {GROUPS.map((group) => {
            const groupWidgets = group.ids
              .map((id) => available.find((w) => w.id === id))
              .filter(Boolean) as WidgetDef[]

            if (groupWidgets.length === 0) return null

            return (
              <div key={group.label} style={{ marginBottom: 28 }}>
                <p className="section-label" style={{ marginBottom: 12 }}>── {group.label.toUpperCase()}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                  {groupWidgets.map((def) => {
                    const alreadyAdded = !MULTI_ALLOWED.has(def.id) && existingWidgetIds.includes(def.id)
                    return (
                      <button
                        key={def.id}
                        onClick={() => !alreadyAdded && handleAdd(def)}
                        disabled={alreadyAdded}
                        style={{
                          background: alreadyAdded
                            ? 'rgba(255,255,255,0.02)'
                            : 'var(--bg-input)',
                          border: `1px solid ${alreadyAdded ? 'transparent' : 'var(--border)'}`,
                          borderRadius: 8, padding: '14px 16px',
                          cursor: alreadyAdded ? 'default' : 'pointer',
                          textAlign: 'left',
                          opacity: alreadyAdded ? 0.4 : 1,
                          transition: 'border-color 0.15s, background 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          if (!alreadyAdded) {
                            e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'
                            e.currentTarget.style.background = 'rgba(16,185,129,0.04)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!alreadyAdded) {
                            e.currentTarget.style.borderColor = 'var(--border)'
                            e.currentTarget.style.background = 'var(--bg-input)'
                          }
                        }}
                      >
                        {/* SVG preview thumbnail */}
                        <div style={{ marginBottom: 10, borderRadius: 6, overflow: 'hidden',
                          opacity: alreadyAdded ? 0.5 : 1 }}>
                          <WidgetPreview widgetId={def.id} />
                        </div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                          {def.label}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.4 }}>
                          {def.description}
                        </p>
                        {def.chartTypes && (
                          <p style={{ fontSize: 10, color: 'rgba(16,185,129,0.5)', marginTop: 6,
                            fontFamily: "'JetBrains Mono', monospace" }}>
                            {def.chartTypes.length} tipos de gráfico
                          </p>
                        )}
                        {alreadyAdded && (
                          <p style={{ fontSize: 10, color: '#10b981', marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>
                            ✓ já adicionado
                          </p>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
