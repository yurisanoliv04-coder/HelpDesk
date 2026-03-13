'use client'

import { useState, useTransition, useCallback } from 'react'
import { updateCategoryScoringPoints, updateDepartmentScoringPoints } from '@/app/(app)/settings/actions'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubCategory {
  id: string
  name: string
  description: string | null
  active: boolean
  scoringPoints: number
}

interface TicketCategory {
  id: string
  name: string
  description: string | null
  active: boolean
  scoringPoints: number
  children: SubCategory[]
}

interface Department {
  id: string
  name: string
  code: string | null
  active: boolean
  scoringPoints: number
  _count: { users: number }
}

interface SlaPolicy {
  id: string
  name: string
  active: boolean
  priority: string | null
  responseMinutes: number
  resolutionMinutes: number
  category: { name: string } | null
}

interface Props {
  slaPolices: SlaPolicy[]
  ticketCategories: TicketCategory[]
  departments: Department[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const THRESHOLDS = [
  { label: 'URGENTE', min: 70, color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)',  desc: 'Resposta imediata' },
  { label: 'ALTA',    min: 45, color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.2)',   desc: 'Mesmo dia' },
  { label: 'MÉDIA',   min: 20, color: '#38bdf8', bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.2)',   desc: 'Dentro do SLA' },
  { label: 'BAIXA',   min: 0,  color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)',  desc: 'Fila normal' },
]

const PRIORITY_COLOR: Record<string, string> = { LOW: '#94a3b8', MEDIUM: '#38bdf8', HIGH: '#fbbf24', URGENT: '#f87171' }
const PRIORITY_LABEL: Record<string, string> = { LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta', URGENT: 'Urgente' }

function minutesToHuman(min: number) {
  const h = Math.floor(min / 60), m = min % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

// ─── Sub-component: Chevron icon ──────────────────────────────────────────────

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 14 14" fill="none"
      style={{ flexShrink: 0, transition: 'transform 0.18s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
    >
      <path d="M5 3l4 4-4 4" stroke="#3d5068" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Sub-component: editable points input ────────────────────────────────────

function PtsInput({
  id, initialPts, onSave, color = '#00d9b8',
}: {
  id: string; initialPts: number; onSave: (id: string, pts: number) => Promise<void>; color?: string
}) {
  const [pts, setPts] = useState(initialPts)
  const [saving, setSaving] = useState(false)
  const [flash, setFlash] = useState<'ok' | 'err' | null>(null)

  const commit = useCallback(async (value: number) => {
    if (value === initialPts) return
    setSaving(true)
    try {
      await onSave(id, value)
      setFlash('ok'); setTimeout(() => setFlash(null), 1500)
    } catch {
      setFlash('err'); setTimeout(() => setFlash(null), 2000)
    } finally {
      setSaving(false)
    }
  }, [id, initialPts, onSave])

  const ringColor = flash === 'ok' ? '#34d399' : flash === 'err' ? '#f87171' : 'rgba(255,255,255,0.1)'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <input
        type="number"
        value={pts}
        min={0}
        max={100}
        disabled={saving}
        onChange={e => setPts(Number(e.target.value))}
        onBlur={e => commit(Number(e.target.value))}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(pts) } }}
        style={{
          width: 58, textAlign: 'right', padding: '5px 8px',
          background: 'rgba(255,255,255,0.05)', borderRadius: 7,
          border: `1.5px solid ${ringColor}`,
          fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
          color, outline: 'none', transition: 'border-color 0.2s',
          opacity: saving ? 0.5 : 1,
        }}
      />
      <span style={{ fontSize: 11, color: '#2d4060', flexShrink: 0 }}>pts</span>
      {flash === 'ok' && <span style={{ fontSize: 12, color: '#34d399' }}>✓</span>}
      {flash === 'err' && <span style={{ fontSize: 12, color: '#f87171' }}>✗</span>}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TicketSettingsTab({ slaPolices, ticketCategories, departments }: Props) {
  const [, startTransition] = useTransition()

  // Collapsible state: all parents expanded by default
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(ticketCategories.filter(c => c.children.length > 0).map(c => c.id))
  )

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function expandAll() {
    setExpanded(new Set(ticketCategories.filter(c => c.children.length > 0).map(c => c.id)))
  }

  function collapseAll() {
    setExpanded(new Set())
  }

  const saveCategory = useCallback(async (id: string, pts: number) => {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        const r = await updateCategoryScoringPoints(id, pts)
        if (r.ok) resolve(); else reject(new Error(r.error))
      })
    })
  }, [])

  const saveDepartment = useCallback(async (id: string, pts: number) => {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        const r = await updateDepartmentScoringPoints(id, pts)
        if (r.ok) resolve(); else reject(new Error(r.error))
      })
    })
  }, [])

  // Compute max possible score for the legend
  const maxCategoryPts = Math.max(...ticketCategories.flatMap(c => [c.scoringPoints, ...c.children.map(s => s.scoringPoints)]), 0)
  const maxDeptPts = Math.max(...departments.map(d => d.scoringPoints), 0)
  const maxTotal = maxCategoryPts + maxDeptPts

  // Count parents with children (for toolbar)
  const parentsWithChildren = ticketCategories.filter(c => c.children.length > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
      <div style={{
        background: 'rgba(0,217,184,0.04)', border: '1px solid rgba(0,217,184,0.12)',
        borderRadius: 12, padding: '16px 20px', display: 'flex', gap: 14,
      }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>⚡</span>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#c8d6e5', marginBottom: 4 }}>
            Como funciona a prioridade automática
          </p>
          <p style={{ fontSize: 12, color: '#4a6580', lineHeight: 1.7 }}>
            Ao abrir um chamado, o sistema soma a <strong style={{ color: '#8ba5c0' }}>pontuação da categoria</strong> com a{' '}
            <strong style={{ color: '#8ba5c0' }}>pontuação do departamento</strong> do solicitante.
            O total determina a prioridade automaticamente. Edite os valores abaixo — as alterações
            se aplicam imediatamente ao salvar (Enter ou Tab).
          </p>
          {maxTotal > 0 && (
            <p style={{ fontSize: 11, color: '#2d4060', marginTop: 6 }}>
              Pontuação máxima atual: <strong style={{ color: '#00d9b8' }}>{maxTotal} pts</strong>
              {' '}(categoria: {maxCategoryPts} + departamento: {maxDeptPts})
            </p>
          )}
        </div>
      </div>

      {/* ── THRESHOLDS ────────────────────────────────────────────── */}
      <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '18px 20px' }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#3d5068', letterSpacing: '0.1em', marginBottom: 14 }}>
          LIMIARES DE PRIORIDADE
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {THRESHOLDS.map((t, i) => {
            const isFirst = i === 0
            return (
              <div key={t.label} style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: 10, padding: '12px 14px' }}>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: t.color, letterSpacing: '0.06em' }}>{t.label}</p>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 800, color: t.color, margin: '4px 0 2px' }}>
                  {isFirst ? `≥ ${t.min}` : t.min === 0 ? '< 20' : `≥ ${t.min}`}
                </p>
                <p style={{ fontSize: 10, color: '#2d4060' }}>{t.desc}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── SCORING BY CATEGORY ───────────────────────────────────── */}
      <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#3d5068', letterSpacing: '0.1em' }}>
              PONTUAÇÃO POR CATEGORIA
            </p>
            <p style={{ fontSize: 11, color: '#2d4060', marginTop: 3 }}>
              Pontos adicionados quando um chamado é aberto com esta categoria
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {parentsWithChildren.length > 0 && (
              <>
                <button onClick={expandAll} style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 10, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#3d5068', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                }}>▼ Expandir</button>
                <button onClick={collapseAll} style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 10, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#3d5068', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                }}>▶ Recolher</button>
              </>
            )}
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#1e3048' }}>
              {ticketCategories.length} categorias
            </span>
          </div>
        </div>

        {/* Column headers */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 110px',
          padding: '0 20px', height: 32, alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(255,255,255,0.015)',
        }}>
          {['CATEGORIA / SUBCATEGORIA', 'PONTUAÇÃO'].map((h, i) => (
            <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#2d4060', letterSpacing: '0.08em', textAlign: i === 1 ? 'right' : 'left' }}>{h}</div>
          ))}
        </div>

        {ticketCategories.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#2d4060' }}>
            Nenhuma categoria cadastrada. Crie categorias na aba Categorias.
          </div>
        ) : ticketCategories.map((cat, ci) => {
          const isOpen = expanded.has(cat.id)
          const hasChildren = cat.children.length > 0

          return (
            <div key={cat.id} style={{ borderTop: ci > 0 ? '2px solid rgba(255,255,255,0.05)' : 'none' }}>

              {/* Parent category row */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 110px',
                padding: '12px 20px', alignItems: 'center',
                background: 'rgba(255,255,255,0.015)',
                opacity: cat.active ? 1 : 0.45,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Chevron toggle — only shown if has children */}
                  {hasChildren ? (
                    <button
                      onClick={() => toggleExpand(cat.id)}
                      style={{
                        background: 'none', border: 'none', padding: '2px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', flexShrink: 0,
                        borderRadius: 4,
                      }}
                      title={isOpen ? 'Recolher subcategorias' : 'Expandir subcategorias'}
                    >
                      <Chevron open={isOpen} />
                    </button>
                  ) : (
                    <span style={{ width: 18, flexShrink: 0 }} />
                  )}

                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: cat.active ? '#00d9b8' : '#2d4060', flexShrink: 0 }} />

                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#c8d6e5' }}>{cat.name}</p>
                    {cat.description && <p style={{ fontSize: 11, color: '#2d4060', marginTop: 1 }}>{cat.description}</p>}
                  </div>

                  {hasChildren && (
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#1e3048',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 4, padding: '2px 6px', flexShrink: 0, marginLeft: 2,
                    }}>
                      {cat.children.length} sub
                    </span>
                  )}

                  {!cat.active && (
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#f87171',
                      background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
                      borderRadius: 4, padding: '2px 6px', flexShrink: 0,
                    }}>inativa</span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <PtsInput
                    key={`cat-${cat.id}`}
                    id={cat.id} initialPts={cat.scoringPoints}
                    onSave={saveCategory} color="#00d9b8"
                  />
                </div>
              </div>

              {/* Collapsed hint */}
              {hasChildren && !isOpen && (
                <div style={{
                  padding: '6px 20px 6px 56px',
                  borderTop: '1px solid rgba(255,255,255,0.03)',
                  background: 'rgba(255,255,255,0.005)',
                }}>
                  <span style={{ fontSize: 10, color: '#1e3048', fontFamily: "'JetBrains Mono', monospace" }}>
                    {cat.children.length} subcategoria{cat.children.length !== 1 ? 's' : ''} recolhida{cat.children.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {/* Subcategory rows — shown only when expanded */}
              {hasChildren && isOpen && cat.children.map((sub) => (
                <div key={sub.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr 110px',
                  padding: '9px 20px 9px 56px', alignItems: 'center',
                  borderTop: '1px solid rgba(255,255,255,0.03)',
                  background: 'rgba(255,255,255,0.005)',
                  opacity: sub.active ? 1 : 0.4,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ color: '#1e3048', fontSize: 11, flexShrink: 0 }}>└</span>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: '#8ba5c0' }}>{sub.name}</p>
                      {sub.description && <p style={{ fontSize: 10, color: '#2d4060', marginTop: 1 }}>{sub.description}</p>}
                    </div>
                    {!sub.active && (
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#f87171',
                        background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
                        borderRadius: 4, padding: '2px 5px', flexShrink: 0,
                      }}>inativa</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <PtsInput
                      key={`sub-${sub.id}`}
                      id={sub.id} initialPts={sub.scoringPoints}
                      onSave={saveCategory} color="#a78bfa"
                    />
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* ── SCORING BY DEPARTMENT ─────────────────────────────────── */}
      <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#3d5068', letterSpacing: '0.1em' }}>
              PONTUAÇÃO POR DEPARTAMENTO DO SOLICITANTE
            </p>
            <p style={{ fontSize: 11, color: '#2d4060', marginTop: 3 }}>
              Pontos adicionados quando o solicitante pertence a este departamento
            </p>
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#1e3048', flexShrink: 0 }}>
            {departments.length} depts
          </span>
        </div>

        {/* Column headers */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 80px 90px 110px',
          padding: '0 20px', height: 32, alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(255,255,255,0.015)',
        }}>
          {['DEPARTAMENTO', 'CÓDIGO', 'USUÁRIOS', 'PONTUAÇÃO'].map((h, i) => (
            <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#2d4060', letterSpacing: '0.08em', textAlign: i === 3 ? 'right' : 'left' }}>{h}</div>
          ))}
        </div>

        {departments.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#2d4060' }}>
            Nenhum departamento cadastrado.
          </div>
        ) : departments.map((dept, i) => (
          <div key={dept.id} style={{
            display: 'grid', gridTemplateColumns: '1fr 80px 90px 110px',
            padding: '11px 20px', alignItems: 'center',
            borderBottom: i < departments.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            opacity: dept.active ? 1 : 0.45,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: dept.active ? '#38bdf8' : '#2d4060', flexShrink: 0 }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: '#c8d6e5' }}>{dept.name}</p>
            </div>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#3d5068' }}>{dept.code ?? '—'}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#38bdf8' }}>
              {dept._count.users} {dept._count.users === 1 ? 'usuário' : 'usuários'}
            </span>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <PtsInput
                key={`dept-${dept.id}`}
                id={dept.id} initialPts={dept.scoringPoints}
                onSave={saveDepartment} color="#fbbf24"
              />
            </div>
          </div>
        ))}
      </div>

      {/* ── SLA POLICIES ──────────────────────────────────────────── */}
      <div style={{ background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.12)', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10 }}>
        <span style={{ fontSize: 14, flexShrink: 0 }}>ℹ️</span>
        <p style={{ fontSize: 12, color: '#3d5068', lineHeight: 1.6 }}>
          As políticas de SLA definem os prazos de <strong style={{ color: '#8ba5c0' }}>resposta</strong> e{' '}
          <strong style={{ color: '#8ba5c0' }}>resolução</strong> por prioridade. O sistema calcula os prazos ao abrir cada chamado.
        </p>
      </div>

      <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#3d5068', letterSpacing: '0.1em' }}>POLÍTICAS DE SLA</p>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060' }}>{slaPolices.length} políticas</span>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 130px 110px 100px 100px 70px',
          columnGap: 10, padding: '0 16px', height: 36, alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)',
        }}>
          {['NOME', 'CATEGORIA', 'PRIORIDADE', 'RESPOSTA', 'RESOLUÇÃO', 'STATUS'].map((h, i) => (
            <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#2d4060', letterSpacing: '0.08em' }}>{h}</div>
          ))}
        </div>

        {slaPolices.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#2d4060' }}>Nenhuma política cadastrada</div>
        ) : slaPolices.map((s, i) => {
          const pc = s.priority ? PRIORITY_COLOR[s.priority] ?? '#94a3b8' : '#94a3b8'
          return (
            <div key={s.id} style={{
              display: 'grid', gridTemplateColumns: '1fr 130px 110px 100px 100px 70px',
              columnGap: 10, padding: '11px 16px', alignItems: 'center',
              borderBottom: i < slaPolices.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              opacity: s.active ? 1 : 0.5,
            }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#c8d6e5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</p>
              <span style={{ fontSize: 11, color: '#4a6580', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.category?.name ?? '—'}</span>
              {s.priority ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: pc }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: pc }} />{PRIORITY_LABEL[s.priority] ?? s.priority}
                </span>
              ) : <span style={{ fontSize: 11, color: '#2d4060' }}>—</span>}
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#38bdf8' }}>{minutesToHuman(s.responseMinutes)}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#a78bfa' }}>{minutesToHuman(s.resolutionMinutes)}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: s.active ? '#34d399' : '#f87171' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />{s.active ? 'Ativa' : 'Inativa'}
              </span>
            </div>
          )
        })}
      </div>

    </div>
  )
}
