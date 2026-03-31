'use client'

import { useState } from 'react'
import { Plus, Settings2, Check, ChevronDown, Undo2, AlignVerticalSpaceBetween } from 'lucide-react'
import { SerializedDashboard } from '@/lib/dashboard/types'
import ThemePicker from '@/components/theme/ThemePicker'

export const GAP_MIN  = 0
export const GAP_MAX  = 40
export const GAP_STEP = 4

interface Props {
  dashboards:   SerializedDashboard[]
  activeId:     string
  isEditMode:   boolean
  isSaving:     boolean
  rowGap:       number
  onSwitch:     (id: string) => void
  onToggleEdit: () => void
  onDiscard:    () => void
  onAddWidget:  () => void
  onManage:     () => void
  onGapChange:  (gap: number) => void
}

export default function DashboardHeader({
  dashboards,
  activeId,
  isEditMode,
  isSaving,
  rowGap,
  onSwitch,
  onToggleEdit,
  onDiscard,
  onAddWidget,
  onManage,
  onGapChange,
}: Props) {
  const [showDropdown, setShowDropdown] = useState(false)
  const active = dashboards.find((d) => d.id === activeId)

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
      {/* Left: Title + breadcrumb */}
      <div>
        <p className="section-label" style={{ marginBottom: 10 }}>SISTEMA / DASHBOARD</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', lineHeight: 1 }}>
            {active?.name ?? 'Dashboard'}
          </h1>
          {isSaving && (
            <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-dim)', opacity: 0.7 }}>
              salvando...
            </span>
          )}
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-dim)', marginTop: 8 }}>
          Indicadores em tempo real do sistema de chamados e patrimônio
        </p>
      </div>

      {/* Right: controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {/* Theme picker */}
        <ThemePicker inline />

        {/* Dashboard switcher */}
        {dashboards.length > 1 && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDropdown((v) => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '6px 12px',
                color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {active?.name}
              <ChevronDown size={12} />
            </button>

            {showDropdown && (
              <div style={{
                position: 'absolute', top: '110%', right: 0, zIndex: 100,
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                borderRadius: 8, minWidth: 160, overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}>
                {dashboards.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => { onSwitch(d.id); setShowDropdown(false) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      width: '100%', padding: '9px 14px',
                      background: d.id === activeId ? 'rgba(16,185,129,0.06)' : 'transparent',
                      border: 'none', cursor: 'pointer',
                      color: d.id === activeId ? '#10b981' : 'var(--text-muted)',
                      fontSize: 13, textAlign: 'left',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {d.id === activeId && <Check size={12} />}
                    <span style={{ flex: 1 }}>{d.name}</span>
                    {d.isDefault && (
                      <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-dim)', opacity: 0.7 }}>
                        PADRÃO
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Manage dashboards button */}
        <button
          onClick={onManage}
          title="Gerenciar dashboards"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 6, width: 32, height: 32,
            color: 'var(--text-dim)', cursor: 'pointer',
          }}
        >
          <Settings2 size={14} />
        </button>

        {/* Edit mode toggle */}
        {isEditMode ? (
          <>
            {/* Gap control */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 6, padding: '4px 8px',
            }}>
              <AlignVerticalSpaceBetween size={12} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
              <button
                onClick={() => onGapChange(Math.max(GAP_MIN, rowGap - GAP_STEP))}
                disabled={rowGap <= GAP_MIN}
                title="Reduzir espaçamento entre widgets"
                style={{
                  background: 'none', border: 'none', color: 'var(--text-dim)',
                  cursor: rowGap <= GAP_MIN ? 'default' : 'pointer',
                  fontSize: 14, lineHeight: 1, padding: '0 2px',
                  opacity: rowGap <= GAP_MIN ? 0.3 : 1,
                }}
              >−</button>
              <span style={{
                fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                color: 'var(--text-muted)', minWidth: 20, textAlign: 'center',
              }}>{rowGap}</span>
              <button
                onClick={() => onGapChange(Math.min(GAP_MAX, rowGap + GAP_STEP))}
                disabled={rowGap >= GAP_MAX}
                title="Aumentar espaçamento entre widgets"
                style={{
                  background: 'none', border: 'none', color: 'var(--text-dim)',
                  cursor: rowGap >= GAP_MAX ? 'default' : 'pointer',
                  fontSize: 14, lineHeight: 1, padding: '0 2px',
                  opacity: rowGap >= GAP_MAX ? 0.3 : 1,
                }}
              >+</button>
            </div>

            <button
              onClick={onAddWidget}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: 6, padding: '6px 12px',
                color: '#10b981', fontSize: 12, cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <Plus size={13} /> Adicionar widget
            </button>
            <button
              onClick={onDiscard}
              title="Desfaz todas as alterações feitas nesta sessão de edição"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
                borderRadius: 6, padding: '6px 12px',
                color: '#f87171', fontSize: 12, cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <Undo2 size={13} /> Descartar
            </button>
            <button
              onClick={onToggleEdit}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#10b981', border: 'none',
                borderRadius: 6, padding: '6px 14px',
                color: '#0d1422', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <Check size={13} /> Concluir edição
            </button>
          </>
        ) : (
          <button
            onClick={onToggleEdit}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 6, padding: '6px 12px',
              color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Personalizar
          </button>
        )}
      </div>

      {/* Close dropdown when clicking outside */}
      {showDropdown && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99 }}
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  )
}
