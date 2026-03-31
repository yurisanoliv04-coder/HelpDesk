'use client'

import { useState, useTransition } from 'react'
import { setCategoryTechnicians } from '@/app/(app)/settings/actions'

interface Technician { id: string; name: string; role: string }

interface OpeningRule {
  id: string; ruleType: string; description: string
  config: Record<string, unknown>; active: boolean
}

interface Category {
  id: string; name: string; description?: string | null; active: boolean
  scoringPoints: number
  technicians: { userId: string }[]
  openingRules: OpeningRule[]
  children?: Category[]
}

interface Props {
  categories: Category[]
  allTechnicians: Technician[]
}

const ROLE_META: Record<string, { label: string; color: string }> = {
  ADMIN:       { label: 'Admin',    color: '#f59e0b' },
  TECNICO:     { label: 'Técnico',  color: '#10b981' },
  AUXILIAR_TI: { label: 'Auxiliar', color: '#38bdf8' },
}

function RoleBadge({ role }: { role: string }) {
  const m = ROLE_META[role] ?? { label: role, color: '#8ba5c0' }
  return (
    <span style={{
      fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
      color: m.color, background: `${m.color}18`,
      border: `1px solid ${m.color}30`, borderRadius: 3,
      padding: '1px 5px', flexShrink: 0,
    }}>{m.label.toUpperCase()}</span>
  )
}

function CategoryRow({ cat, allTechnicians, depth = 0 }: {
  cat: Category; allTechnicians: Technician[]; depth?: number
}) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const assignedIds = new Set(cat.technicians.map(t => t.userId))
  const restricted = assignedIds.size > 0
  const assignedTechs = allTechnicians.filter(t => assignedIds.has(t.id))
  const indent = depth * 20

  function toggle(userId: string) {
    const next = new Set(assignedIds)
    if (next.has(userId)) next.delete(userId); else next.add(userId)
    startTransition(async () => { await setCategoryTechnicians(cat.id, [...next]) })
  }

  function clearAll(e: React.MouseEvent) {
    e.stopPropagation()
    startTransition(async () => { await setCategoryTechnicians(cat.id, []) })
  }

  return (
    <div>
      {/* Row */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: `10px 16px 10px ${16 + indent}px`,
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          background: open ? 'rgba(16,185,129,0.025)' : undefined,
          cursor: 'pointer', userSelect: 'none',
        }}
        onClick={() => setOpen(v => !v)}
      >
        {/* Expand caret */}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
          style={{ flexShrink: 0, transition: 'transform 0.15s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>
          <path d="M3 2l4 3-4 3" stroke="#3d5068" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* Name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, color: cat.active ? '#c8d6e5' : '#3d5068', fontWeight: depth === 0 ? 500 : 400 }}>
            {depth > 0 && <span style={{ color: '#1e3048', marginRight: 6 }}>↳</span>}
            {cat.name}
          </p>
          {cat.description && (
            <p style={{ fontSize: 11, color: '#2d4060', marginTop: 1 }}>{cat.description}</p>
          )}
        </div>

        {/* Assignment summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          {restricted ? (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 360 }}>
              {assignedTechs.map(t => (
                <span key={t.id} style={{
                  fontSize: 11, color: '#10b981', background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.2)', borderRadius: 6, padding: '2px 7px',
                }}>{t.name}</span>
              ))}
            </div>
          ) : (
            <span style={{
              fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#2d4060',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 6, padding: '3px 8px',
            }}>TODOS OS TÉCNICOS</span>
          )}
        </div>
      </div>

      {/* Expanded panel */}
      {open && (
        <div
          style={{
            paddingLeft: 16 + indent + 22,
            paddingRight: 16, paddingTop: 14, paddingBottom: 14,
            background: 'rgba(0,0,0,0.18)',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{
              fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
              color: '#3d5068', letterSpacing: '0.08em',
            }}>
              TÉCNICOS AUTORIZADOS
              {restricted
                ? <span style={{ color: '#10b981', marginLeft: 6 }}>● {assignedIds.size} selecionado{assignedIds.size !== 1 ? 's' : ''}</span>
                : <span style={{ color: '#2d4060', marginLeft: 6 }}>● todos</span>}
            </p>
            {restricted && (
              <button
                onClick={clearAll}
                disabled={isPending}
                style={{
                  fontSize: 10, color: '#3d5068', background: 'none', border: 'none',
                  cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
                  opacity: isPending ? 0.5 : 1, textDecoration: 'underline',
                }}
              >
                Limpar restrição
              </button>
            )}
          </div>

          <p style={{ fontSize: 11, color: '#2d4060', marginBottom: 12, lineHeight: 1.5 }}>
            Sem seleção = todos os técnicos podem receber este tipo de chamado.
            Quando restrito, o técnico selecionado aparecerá em destaque no painel de atribuição.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 7 }}>
            {allTechnicians.map(tech => {
              const sel = assignedIds.has(tech.id)
              return (
                <button
                  key={tech.id}
                  onClick={() => toggle(tech.id)}
                  disabled={isPending}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '8px 11px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                    background: sel ? 'rgba(16,185,129,0.07)' : 'rgba(255,255,255,0.025)',
                    border: `1.5px solid ${sel ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.07)'}`,
                    transition: 'all 0.12s', opacity: isPending ? 0.6 : 1,
                  }}
                >
                  {/* Checkbox */}
                  <div style={{
                    width: 15, height: 15, borderRadius: 4, flexShrink: 0,
                    background: sel ? '#10b981' : 'transparent',
                    border: `2px solid ${sel ? '#10b981' : 'rgba(255,255,255,0.18)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.12s',
                  }}>
                    {sel && (
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5l2.5 2.5 4.5-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <p style={{
                    fontSize: 12, flex: 1, minWidth: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    color: sel ? '#e2eaf4' : '#8ba5c0', fontWeight: sel ? 600 : 400,
                  }}>{tech.name}</p>
                  <RoleBadge role={tech.role} />
                </button>
              )
            })}

            {allTechnicians.length === 0 && (
              <p style={{ fontSize: 12, color: '#2d4060', gridColumn: '1 / -1' }}>
                Nenhum técnico ativo encontrado.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Children */}
      {cat.children?.map(child => (
        <CategoryRow key={child.id} cat={child} allTechnicians={allTechnicians} depth={depth + 1} />
      ))}
    </div>
  )
}

export default function CategoryRoutingSection({ categories, allTechnicians }: Props) {
  return (
    <div style={{
      background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
      }}>
        <div>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
            fontWeight: 700, color: '#3d5068', letterSpacing: '0.1em', marginBottom: 6,
          }}>── ESPECIALIZAÇÃO DE TÉCNICOS</p>
          <p style={{ fontSize: 12, color: '#3d5068', lineHeight: 1.5 }}>
            Restrinja quais técnicos recebem chamados de cada categoria. Clique em uma categoria para configurar.
            Sem restrição = todos os técnicos elegíveis são exibidos no painel de atribuição.
          </p>
        </div>
        <span style={{
          fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#2d4060',
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 6, padding: '4px 10px', flexShrink: 0,
        }}>
          {allTechnicians.length} técnico{allTechnicians.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Rows */}
      {categories.map(cat => (
        <CategoryRow key={cat.id} cat={cat} allTechnicians={allTechnicians} />
      ))}

      {categories.length === 0 && (
        <div style={{ padding: '32px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#2d4060' }}>Nenhuma categoria encontrada.</p>
        </div>
      )}
    </div>
  )
}
