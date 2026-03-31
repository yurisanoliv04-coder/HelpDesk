'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Trash2 } from 'lucide-react'
import { WidgetInstance } from '@/lib/dashboard/types'
import { WIDGET_CATALOG } from '@/lib/dashboard/catalog'
import { WidgetInstanceProvider } from '@/lib/dashboard/widget-context'

interface ContextMenu { x: number; y: number }

interface Props {
  instance:   WidgetInstance
  isEditMode: boolean
  onRemove:   (instanceId: string) => void
  onUpdate:   (updated: WidgetInstance) => void
  children:   React.ReactNode
}

export default function WidgetShell({ instance, isEditMode, onRemove, onUpdate, children }: Props) {
  const def = WIDGET_CATALOG.find((w) => w.id === instance.widgetId)
  const [isHovered, setIsHovered] = useState(false)
  const [ctxMenu, setCtxMenu]     = useState<ContextMenu | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close context menu on outside click or Escape
  useEffect(() => {
    if (!ctxMenu) return
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setCtxMenu(null)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setCtxMenu(null)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [ctxMenu])

  function handleContextMenu(e: React.MouseEvent) {
    if (!isEditMode) return
    e.preventDefault()
    setCtxMenu({ x: e.clientX, y: e.clientY })
  }

  function handleChartTypeChange(typeId: string) {
    onUpdate({ ...instance, config: { ...instance.config, chartType: typeId } })
    setCtxMenu(null)
  }

  const currentChartType = (instance.config?.chartType as string | undefined)
    ?? def?.chartTypes?.[0]?.id

  return (
    <WidgetInstanceProvider instanceId={instance.instanceId}>
      <>
        {/* ── Widget shell ──────────────────────────────────────────────────── */}
        <div
          style={{
            position: 'relative',
            borderRadius: 10,
            border: isEditMode ? '1.5px dashed rgba(16,185,129,0.25)' : undefined,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            cursor: isEditMode ? 'grab' : undefined,
          }}
          onMouseEnter={() => isEditMode && setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onContextMenu={handleContextMenu}
        >
          {/* Hover overlay — fades in on hover in edit mode */}
          {isEditMode && (
            <div
              style={{
                position: 'absolute', inset: 0, zIndex: 20,
                borderRadius: 10,
                background: 'rgba(8,14,26,0.72)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 6,
                opacity: isHovered ? 1 : 0,
                transition: 'opacity 0.15s ease',
                pointerEvents: 'none',
              }}
            >
              <span style={{
                fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                color: 'rgba(16,185,129,0.9)', letterSpacing: '0.08em',
                textAlign: 'center', padding: '0 16px',
              }}>
                {def?.label ?? instance.widgetId}
              </span>
              <span style={{
                fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                color: 'rgba(16,185,129,0.35)',
              }}>
                {instance.w}×{instance.h}
                {def?.chartTypes && (
                  <> · clique direito para opções</>
                )}
              </span>
            </div>
          )}

          {/* Content */}
          <div style={{
            flex: 1,
            pointerEvents: isEditMode ? 'none' : undefined,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}>
            {children}
          </div>
        </div>

        {/* ── Context menu via portal ────────────────────────────────────────── */}
        {ctxMenu && typeof document !== 'undefined' && createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: ctxMenu.y,
              left: ctxMenu.x,
              zIndex: 9999,
              background: 'rgba(8,14,26,0.98)',
              border: '1px solid rgba(16,185,129,0.18)',
              borderRadius: 8,
              padding: 4,
              minWidth: 188,
              boxShadow: '0 8px 28px rgba(0,0,0,0.55)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {/* ── Chart type section ────────────────────────── */}
            {def?.chartTypes && def.chartTypes.length > 1 && (
              <>
                <div style={{
                  padding: '6px 10px 4px',
                  fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                  color: 'rgba(16,185,129,0.4)', letterSpacing: '0.1em',
                }}>
                  TIPO DE GRÁFICO
                </div>
                {def.chartTypes.map((ct) => {
                  const isActive = ct.id === currentChartType
                  return (
                    <button
                      key={ct.id}
                      onClick={() => handleChartTypeChange(ct.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        width: '100%', padding: '6px 10px',
                        background: isActive ? 'rgba(16,185,129,0.1)' : 'transparent',
                        border: 'none', borderRadius: 5,
                        color: isActive ? '#10b981' : '#64748b',
                        fontSize: 12, cursor: 'pointer',
                        fontFamily: "'JetBrains Mono', monospace",
                        textAlign: 'left', transition: 'background 0.1s',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        border: `1.5px solid ${isActive ? '#10b981' : '#334155'}`,
                        background: isActive ? '#10b981' : 'transparent',
                        display: 'inline-block',
                      }} />
                      {ct.label}
                    </button>
                  )
                })}
                {/* Divider */}
                <div style={{
                  margin: '4px 8px',
                  height: 1,
                  background: 'rgba(255,255,255,0.07)',
                }} />
              </>
            )}

            {/* ── Remove ───────────────────────────────────── */}
            <button
              onClick={() => { onRemove(instance.instanceId); setCtxMenu(null) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '7px 10px',
                background: 'transparent',
                border: 'none', borderRadius: 5,
                color: '#f87171', fontSize: 12, cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
                textAlign: 'left', transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(248,113,113,0.12)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <Trash2 size={12} />
              Remover widget
            </button>
          </div>,
          document.body,
        )}
      </>
    </WidgetInstanceProvider>
  )
}
