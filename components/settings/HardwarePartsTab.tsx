'use client'

import { useState, useTransition, useCallback } from 'react'
import {
  createHardwarePart,
  updateHardwarePart,
  toggleHardwarePartActive,
  deleteHardwarePart,
  saveCpuGenerationRow,
  createCpuGenerationConfig,
  deleteCpuGenerationConfig,
  type HardwarePartPayload,
  type CpuGenConfigRow,
} from '@/app/(app)/settings/actions'
import type { HardwarePart, HardwarePartType } from '@prisma/client'

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<HardwarePartType, string> = {
  CPU:     'Processador (CPU)',
  RAM:     'Memória RAM',
  STORAGE: 'Armazenamento',
}

const TYPE_ICON: Record<HardwarePartType, string> = {
  CPU: '🔲', RAM: '🧩', STORAGE: '💾',
}

const TYPE_COLOR: Record<HardwarePartType, { text: string; bg: string; border: string }> = {
  CPU:     { text: '#38bdf8', bg: 'rgba(56,189,248,0.06)', border: 'rgba(56,189,248,0.18)' },
  RAM:     { text: '#a78bfa', bg: 'rgba(167,139,250,0.06)', border: 'rgba(167,139,250,0.18)' },
  STORAGE: { text: '#34d399', bg: 'rgba(52,211,153,0.06)', border: 'rgba(52,211,153,0.18)' },
}

const MAX_PTS: Record<HardwarePartType, number> = { CPU: 30, RAM: 40, STORAGE: 30 }
const TYPES: HardwarePartType[] = ['CPU', 'RAM', 'STORAGE']

function ScoreBadge({ pts, type }: { pts: number; type: HardwarePartType }) {
  const max = MAX_PTS[type]
  const isNeg = pts < 0
  const pct = isNeg ? 0 : Math.round((pts / max) * 100)
  const color = isNeg ? '#f87171' : pct >= 80 ? '#34d399' : pct >= 50 ? '#f59e0b' : '#f87171'
  const sign = isNeg ? '' : ''
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 20,
      background: color + '15', border: `1px solid ${color}30`,
      fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color,
    }}>
      {sign}{pts} <span style={{ opacity: 0.5 }}>/ {max}</span>
    </span>
  )
}

// ── Seção de configuração de geração de CPU ───────────────────────────────────

function AdjBadge({ adj }: { adj: number }) {
  const color = adj > 0 ? '#34d399' : adj < 0 ? '#f87171' : '#7a9bbc'
  const sign = adj > 0 ? '+' : ''
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 20,
      background: color + '18', border: `1px solid ${color}35`,
      fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color,
      minWidth: 52, justifyContent: 'center',
    }}>
      {sign}{adj} pts
    </span>
  )
}

function CpuGenConfigSection({ initialRows }: { initialRows: CpuGenConfigRow[] }) {
  const [rows, setRows]           = useState(initialRows)
  const [editId, setEditId]       = useState<string | null>(null)
  const [savedId, setSavedId]     = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [pendingSave, startSave]  = useTransition()
  const [pendingDel,  startDel]   = useTransition()
  const [pendingNew,  startNew]   = useTransition()

  // form de nova faixa
  const [newMinGen, setNewMinGen] = useState(14)
  const [newLabel,  setNewLabel]  = useState('')
  const [newAdj,    setNewAdj]    = useState(0)
  const [newNote,   setNewNote]   = useState('')
  const [newError,  setNewError]  = useState('')

  const updateRow = (id: string, patch: Partial<CpuGenConfigRow>) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r))

  const handleSave = (row: CpuGenConfigRow) => {
    startSave(async () => {
      const res = await saveCpuGenerationRow(row.id, { adj: row.adj, note: row.note ?? '' })
      if (!res.ok) { alert(res.error); return }
      setSavedId(row.id)
      setEditId(null)
      setTimeout(() => setSavedId(null), 2000)
    })
  }

  const handleDelete = (row: CpuGenConfigRow) => {
    if (!confirm(`Excluir a faixa "${row.label}"?`)) return
    startDel(async () => {
      const res = await deleteCpuGenerationConfig(row.id)
      if (!res.ok) { alert(res.error); return }
      setRows(prev => prev.filter(r => r.id !== row.id))
    })
  }

  const handleCreate = () => {
    setNewError('')
    if (!newLabel.trim()) { setNewError('Rótulo é obrigatório'); return }
    startNew(async () => {
      const res = await createCpuGenerationConfig({
        minGen: newMinGen, label: newLabel, adj: newAdj, note: newNote,
      })
      if (!res.ok) { setNewError(res.error ?? 'Erro'); return }
      // reload para pegar o id real do banco
      window.location.reload()
    })
  }

  const inp: React.CSSProperties = {
    background: '#0a1019', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6, padding: '6px 10px', color: '#e2eaf4', fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace", outline: 'none',
  }

  return (
    <div style={{
      background: '#0d1422', border: '1px solid rgba(56,189,248,0.15)',
      borderRadius: 10, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 18px', background: 'rgba(56,189,248,0.04)',
        borderBottom: '1px solid rgba(56,189,248,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', letterSpacing: '0.1em', margin: 0 }}>
            🔲 CPU — AJUSTE POR GERAÇÃO
          </p>
          <p style={{ fontSize: 12, color: '#4a6580', marginTop: 3, marginBottom: 0 }}>
            Bônus/penalidade aplicado <em>sobre</em> a pontuação base do processador, conforme a geração.
          </p>
        </div>
        <button onClick={() => setShowCreate(v => !v)} style={{
          padding: '6px 14px', borderRadius: 6, cursor: 'pointer', flexShrink: 0,
          background: showCreate ? 'rgba(56,189,248,0.12)' : 'transparent',
          border: '1px solid rgba(56,189,248,0.25)', color: '#38bdf8',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700,
        }}>
          {showCreate ? '✕ Cancelar' : '+ Nova faixa'}
        </button>
      </div>

      {/* Formulário de nova faixa */}
      {showCreate && (
        <div style={{
          padding: '16px 18px', borderBottom: '1px solid rgba(56,189,248,0.1)',
          background: 'rgba(56,189,248,0.03)', display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#38bdf8', letterSpacing: '0.1em', margin: 0 }}>
            NOVA FAIXA DE GERAÇÃO
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, color: '#3d5068', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4, letterSpacing: '0.07em' }}>
                GEN. MÍNIMA
              </label>
              <input type="number" min={1} max={30} value={newMinGen}
                onChange={e => setNewMinGen(Number(e.target.value))}
                style={{ ...inp, width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, color: '#3d5068', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4, letterSpacing: '0.07em' }}>
                RÓTULO
              </label>
              <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
                placeholder="ex: ≥ 14ª geração"
                style={{ ...inp, width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 10, color: '#3d5068', fontFamily: "'JetBrains Mono', monospace", marginBottom: 6, letterSpacing: '0.07em' }}>
              AJUSTE — {newAdj > 0 ? '+' : ''}{newAdj} pts
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="range" min={-20} max={15} step={1} value={newAdj}
                onChange={e => setNewAdj(Number(e.target.value))}
                style={{ flex: 1, accentColor: newAdj >= 0 ? '#34d399' : '#f87171' }}
              />
              <input type="number" min={-20} max={15} value={newAdj}
                onChange={e => setNewAdj(Math.max(-20, Math.min(15, Number(e.target.value))))}
                style={{ ...inp, width: 64, textAlign: 'center' }}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 10, color: '#3d5068', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4, letterSpacing: '0.07em' }}>
              OBSERVAÇÃO <span style={{ opacity: 0.5 }}>(opcional)</span>
            </label>
            <input value={newNote} onChange={e => setNewNote(e.target.value)}
              placeholder="ex: Geração de última linha — máximo desempenho"
              style={{ ...inp, width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          {newError && (
            <p style={{ fontSize: 12, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6, padding: '6px 10px', margin: 0 }}>
              {newError}
            </p>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleCreate} disabled={pendingNew} style={{
              padding: '7px 18px', borderRadius: 6, cursor: pendingNew ? 'not-allowed' : 'pointer',
              background: pendingNew ? '#0a5c4e' : '#00d9b8', border: 'none',
              color: '#0a1019', fontSize: 12, fontWeight: 700,
            }}>
              {pendingNew ? 'Salvando...' : 'Criar faixa'}
            </button>
          </div>
        </div>
      )}

      {/* Rows existentes */}
      {rows.map((row, i) => {
        const isEditing = editId === row.id
        const isSaved   = savedId === row.id
        const barPct    = Math.round(((row.adj + 20) / 35) * 100)
        const barColor  = row.adj > 0 ? '#34d399' : row.adj < 0 ? '#f87171' : '#38bdf8'

        return (
          <div key={row.id} style={{
            borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            padding: '14px 18px',
            background: isEditing ? 'rgba(56,189,248,0.03)' : 'transparent',
            transition: 'background 0.15s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Label */}
              <div style={{ flex: '0 0 160px' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>
                  {row.label}
                </span>
              </div>

              {/* Barra / slider */}
              {isEditing ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="range" min={-20} max={15} step={1} value={row.adj}
                    onChange={e => updateRow(row.id, { adj: Number(e.target.value) })}
                    style={{ flex: 1, accentColor: barColor }}
                  />
                  <input type="number" min={-20} max={15} value={row.adj}
                    onChange={e => updateRow(row.id, { adj: Math.max(-20, Math.min(15, Number(e.target.value))) })}
                    style={{ ...inp, width: 64, textAlign: 'center' }}
                  />
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${barPct}%`, height: '100%', borderRadius: 2, background: barColor, transition: 'width 0.2s' }} />
                  </div>
                  <AdjBadge adj={row.adj} />
                </div>
              )}

              {/* Ações */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {isEditing ? (
                  <>
                    <button onClick={() => { setEditId(null); setRows(initialRows) }} style={{
                      padding: '4px 10px', borderRadius: 5, cursor: 'pointer',
                      background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#3d5068', fontSize: 11,
                    }}>Cancelar</button>
                    <button onClick={() => handleSave(row)} disabled={pendingSave} style={{
                      padding: '4px 12px', borderRadius: 5, cursor: pendingSave ? 'not-allowed' : 'pointer',
                      background: pendingSave ? '#0a5c4e' : '#00d9b8', border: 'none',
                      color: '#0a1019', fontSize: 11, fontWeight: 700,
                    }}>{pendingSave ? '...' : 'Salvar'}</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setEditId(row.id)} style={{
                      padding: '4px 10px', borderRadius: 5, cursor: 'pointer',
                      background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                      color: isSaved ? '#34d399' : '#4a6580', fontSize: 11, transition: 'color 0.2s',
                    }}>{isSaved ? '✓ Salvo' : 'Editar'}</button>
                    <button onClick={() => handleDelete(row)} disabled={pendingDel} style={{
                      padding: '4px 8px', borderRadius: 5, cursor: 'pointer',
                      background: 'transparent', border: '1px solid rgba(248,113,113,0.2)',
                      color: '#f87171', fontSize: 11,
                    }}>×</button>
                  </>
                )}
              </div>
            </div>

            {/* Nota */}
            {isEditing ? (
              <div style={{ marginTop: 10 }}>
                <label style={{ display: 'block', fontSize: 10, color: '#3d5068', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4, letterSpacing: '0.07em' }}>
                  OBSERVAÇÃO
                </label>
                <input style={{ ...inp, width: '100%', boxSizing: 'border-box' }}
                  value={row.note ?? ''}
                  onChange={e => updateRow(row.id, { note: e.target.value })}
                  placeholder="Descrição exibida na pontuação do ativo..."
                />
              </div>
            ) : row.note && (
              <p style={{ margin: '4px 0 0', fontSize: 11, color: '#3d5068' }}>{row.note}</p>
            )}
          </div>
        )
      })}

      {/* Footer info */}
      <div style={{
        padding: '10px 18px', background: 'rgba(0,0,0,0.15)',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        display: 'flex', gap: 16, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 11, color: '#2d4060', fontFamily: "'JetBrains Mono', monospace" }}>
          Faixa: <span style={{ color: '#f87171' }}>−20</span> a <span style={{ color: '#34d399' }}>+15</span> pts
        </span>
        <span style={{ fontSize: 11, color: '#2d4060' }}>· Aplicado sobre pontuação base (teto final CPU = 30 pts)</span>
        <span style={{ fontSize: 11, color: '#2d4060' }}>· Geração 0 ou desconhecida = sem ajuste</span>
      </div>
    </div>
  )
}

// ── Modal de criação / edição ─────────────────────────────────────────────────

function PartModal({
  part,
  onClose,
  onSaved,
}: {
  part?: HardwarePart
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!part
  const [type, setType]     = useState<HardwarePartType>(part?.type ?? 'CPU')
  const [brand, setBrand]   = useState(part?.brand ?? '')
  const [model, setModel]   = useState(part?.model ?? '')
  const [score, setScore]   = useState(part?.scorePoints ?? 0)
  const [notes, setNotes]   = useState(part?.notes ?? '')
  const [error, setError]   = useState('')
  const [pending, start]    = useTransition()

  const max = MAX_PTS[type]

  async function submit() {
    setError('')
    const payload: HardwarePartPayload = { type, brand, model, scorePoints: score, notes }
    start(async () => {
      const res = isEdit
        ? await updateHardwarePart(part!.id, payload)
        : await createHardwarePart(payload)
      if (res.ok) { onSaved(); onClose() }
      else {
        const msg = res.error ?? 'Erro desconhecido'
        setError(msg)
        // Se o registro não existe mais, recarrega a página para buscar dados atualizados
        if (msg.includes('Recarregue a página')) {
          setTimeout(() => window.location.reload(), 2000)
        }
      }
    })
  }

  const inp: React.CSSProperties = {
    width: '100%', background: '#0a1019', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6, padding: '8px 12px', color: '#e2eaf4', fontSize: 13,
    fontFamily: "'JetBrains Mono', monospace", outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        width: 460, background: '#0d1422', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12, padding: 28, display: 'flex', flexDirection: 'column', gap: 16,
      }} onClick={e => e.stopPropagation()}>

        <div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3d5068', letterSpacing: '0.1em', marginBottom: 6 }}>
            CONFIGURAÇÕES / HARDWARE
          </p>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#e2eaf4', margin: 0 }}>
            {isEdit ? 'Editar peça' : 'Adicionar peça de hardware'}
          </h2>
        </div>

        {/* Tipo */}
        <div>
          <label style={{ display: 'block', fontSize: 11, color: '#3d5068', fontFamily: "'JetBrains Mono', monospace", marginBottom: 6, letterSpacing: '0.07em' }}>
            TIPO
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {TYPES.map(t => {
              const c = TYPE_COLOR[t]
              const active = type === t
              return (
                <button key={t} disabled={isEdit} onClick={() => { setType(t); setScore(0) }} style={{
                  flex: 1, padding: '8px 4px', borderRadius: 6, cursor: isEdit ? 'not-allowed' : 'pointer',
                  border: active ? `1px solid ${c.border}` : '1px solid rgba(255,255,255,0.07)',
                  background: active ? c.bg : 'transparent',
                  color: active ? c.text : '#3d5068', fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace", transition: 'all 0.1s',
                  opacity: isEdit ? 0.5 : 1,
                }}>
                  {TYPE_ICON[t]} {t}
                </button>
              )
            })}
          </div>
        </div>

        {/* Marca */}
        <div>
          <label style={{ display: 'block', fontSize: 11, color: '#3d5068', fontFamily: "'JetBrains Mono', monospace", marginBottom: 6, letterSpacing: '0.07em' }}>
            MARCA
          </label>
          <input style={inp} value={brand} onChange={e => setBrand(e.target.value)} placeholder="ex: Intel, AMD, Genérico" />
        </div>

        {/* Modelo */}
        <div>
          <label style={{ display: 'block', fontSize: 11, color: '#3d5068', fontFamily: "'JetBrains Mono', monospace", marginBottom: 6, letterSpacing: '0.07em' }}>
            MODELO / DESCRIÇÃO
          </label>
          <input style={inp} value={model} onChange={e => setModel(e.target.value)} placeholder={
            type === 'CPU' ? 'ex: Core i5 (10ª–12ª geração)'
            : type === 'RAM' ? 'ex: 8 GB DDR4'
            : 'ex: SSD NVMe (qualquer capacidade)'
          } />
        </div>

        {/* Pontuação */}
        <div>
          <label style={{ display: 'block', fontSize: 11, color: '#3d5068', fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, letterSpacing: '0.07em' }}>
            PONTUAÇÃO &mdash;{' '}
            <span style={{ color: score < 0 ? '#f87171' : score === 0 ? '#7a9bbc' : '#34d399', fontWeight: 700 }}>
              {score > 0 ? '+' : ''}{score} pts
            </span>
            <span style={{ marginLeft: 8, opacity: 0.5 }}>
              (de −{max} a +{max} pts para {TYPE_LABEL[type]})
            </span>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="range" min={-max} max={max} value={score}
              onChange={e => setScore(Number(e.target.value))}
              style={{ flex: 1, accentColor: score < 0 ? '#f87171' : '#00d9b8' }}
            />
            <input
              type="number" min={-max} max={max} value={score}
              onChange={e => setScore(Math.max(-max, Math.min(max, Number(e.target.value))))}
              style={{ ...inp, width: 60, textAlign: 'center', padding: '6px 8px' }}
            />
          </div>
          {/* Score bar — centro = 0 */}
          <div style={{ marginTop: 8, position: 'relative', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
            {score >= 0 ? (
              <div style={{
                position: 'absolute', left: '50%', height: '100%', borderRadius: 3,
                width: `${(score / max) * 50}%`,
                background: score / max >= 0.8 ? '#34d399' : score / max >= 0.4 ? '#f59e0b' : '#38bdf8',
                transition: 'width 0.2s',
              }} />
            ) : (
              <div style={{
                position: 'absolute', height: '100%', borderRadius: 3,
                right: '50%', width: `${(Math.abs(score) / max) * 50}%`,
                background: '#f87171', transition: 'width 0.2s',
              }} />
            )}
            {/* linha do zero */}
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.15)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
            <span style={{ fontSize: 9, color: '#f87171', fontFamily: "'JetBrains Mono', monospace" }}>−{max}</span>
            <span style={{ fontSize: 9, color: '#4a6580', fontFamily: "'JetBrains Mono', monospace" }}>0</span>
            <span style={{ fontSize: 9, color: '#34d399', fontFamily: "'JetBrains Mono', monospace" }}>+{max}</span>
          </div>
        </div>

        {/* Notas */}
        <div>
          <label style={{ display: 'block', fontSize: 11, color: '#3d5068', fontFamily: "'JetBrains Mono', monospace", marginBottom: 6, letterSpacing: '0.07em' }}>
            OBSERVAÇÕES <span style={{ opacity: 0.5 }}>(opcional)</span>
          </label>
          <input style={inp} value={notes} onChange={e => setNotes(e.target.value)} placeholder="ex: Ideal para ERPs — sem gargalos" />
        </div>

        {error && (
          <p style={{ fontSize: 12, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6, padding: '8px 12px', margin: 0 }}>
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button onClick={onClose} disabled={pending} style={{
            flex: 1, padding: '9px 0', borderRadius: 6, cursor: 'pointer',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
            color: '#3d5068', fontSize: 13,
          }}>
            Cancelar
          </button>
          <button onClick={submit} disabled={pending} style={{
            flex: 2, padding: '9px 0', borderRadius: 6, cursor: pending ? 'not-allowed' : 'pointer',
            background: pending ? '#0a5c4e' : '#00d9b8', border: 'none',
            color: '#0a1019', fontSize: 13, fontWeight: 700,
          }}>
            {pending ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Adicionar peça'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Component principal ───────────────────────────────────────────────────────

export type HardwarePartsTabParts = Pick<
  HardwarePart,
  'id' | 'type' | 'brand' | 'model' | 'scorePoints' | 'notes' | 'active'
>

export default function HardwarePartsTab({
  initialParts,
  initialGenConfigs = [],
}: {
  initialParts: HardwarePartsTabParts[]
  initialGenConfigs?: CpuGenConfigRow[]
}) {
  const [parts, setParts]     = useState(initialParts)
  const [modal, setModal]     = useState<'create' | HardwarePart | null>(null)
  const [filterType, setFilterType] = useState<HardwarePartType | 'ALL'>('ALL')
  const [pending, start]      = useTransition()

  function reload() {
    // Server revalidates — just close modal; data will refresh on next server render.
    // For instant UI feel, we force a full reload.
    window.location.reload()
  }

  async function handleToggle(id: string) {
    start(async () => { await toggleHardwarePartActive(id); reload() })
  }

  async function handleDelete(id: string, model: string) {
    if (!confirm(`Excluir "${model}"? Esta ação não pode ser desfeita.`)) return
    start(async () => {
      const res = await deleteHardwarePart(id)
      if (!res.ok) alert(res.error)
      else reload()
    })
  }

  const filtered = filterType === 'ALL' ? parts : parts.filter(p => p.type === filterType)
  const counts = {
    CPU:     parts.filter(p => p.type === 'CPU').length,
    RAM:     parts.filter(p => p.type === 'RAM').length,
    STORAGE: parts.filter(p => p.type === 'STORAGE').length,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3d5068', letterSpacing: '0.1em' }}>
            ── CATÁLOGO DE HARDWARE
          </p>
          <p style={{ fontSize: 13, color: '#4a6580', marginTop: 4 }}>
            Peças cadastradas definem a pontuação de performance dos ativos.
            {' '}<span style={{ color: '#f59e0b' }}>CPU: 0–30 pts · RAM: 0–40 pts · Armazenamento: 0–30 pts · Total: 100 pts</span>
          </p>
          <p style={{ fontSize: 12, color: '#3d5068', marginTop: 2 }}>
            Classificação: <span style={{ color: '#34d399' }}>≥ 65 → BOM</span>
            {' · '}<span style={{ color: '#f59e0b' }}>≥ 38 → INTERMEDIÁRIO</span>
            {' · '}<span style={{ color: '#f87171' }}>&lt; 38 → RUIM</span>
          </p>
        </div>
        <button onClick={() => setModal('create')} style={{
          padding: '9px 18px', borderRadius: 8, cursor: 'pointer',
          background: '#00d9b8', border: 'none', color: '#0a1019',
          fontSize: 13, fontWeight: 700, flexShrink: 0,
        }}>
          + Nova peça
        </button>
      </div>

      {/* CPU Generation Config */}
      {initialGenConfigs.length > 0 && (
        <CpuGenConfigSection initialRows={initialGenConfigs} />
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6 }}>
        {(['ALL', ...TYPES] as const).map(t => {
          const active = filterType === t
          const c = t === 'ALL' ? { text: '#00d9b8', bg: 'rgba(0,217,184,0.08)', border: 'rgba(0,217,184,0.2)' } : TYPE_COLOR[t]
          const label = t === 'ALL' ? `Todos (${parts.length})` : `${TYPE_ICON[t]} ${t} (${counts[t]})`
          return (
            <button key={t} onClick={() => setFilterType(t)} style={{
              padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
              background: active ? c.bg : 'transparent',
              border: active ? `1px solid ${c.border}` : '1px solid rgba(255,255,255,0.07)',
              color: active ? c.text : '#3d5068',
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
              transition: 'all 0.1s',
            }}>
              {label}
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '110px 1fr 1fr 90px 90px 100px',
          columnGap: 12, padding: '7px 18px',
          background: '#0a1019', borderBottom: '1px solid rgba(255,255,255,0.08)',
          alignItems: 'center',
        }}>
          {['TIPO', 'MARCA', 'MODELO', 'PONTOS', 'STATUS', 'AÇÕES'].map(h => (
            <span key={h} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', letterSpacing: '0.1em' }}>
              {h}
            </span>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p style={{ padding: '40px 20px', textAlign: 'center', color: '#2d4060', fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
            — nenhuma peça cadastrada —
          </p>
        ) : filtered.map((p, i) => {
          const c = TYPE_COLOR[p.type]
          return (
            <div key={p.id} style={{
              display: 'grid', gridTemplateColumns: '110px 1fr 1fr 90px 90px 100px',
              columnGap: 12, padding: '12px 18px', alignItems: 'center',
              borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              opacity: p.active ? 1 : 0.45,
              transition: 'background 0.1s',
            }}>
              {/* Tipo */}
              <div>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '2px 8px', borderRadius: 4,
                  background: c.bg, border: `1px solid ${c.border}`,
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: c.text,
                }}>
                  {TYPE_ICON[p.type]} {p.type}
                </span>
              </div>

              {/* Marca */}
              <span style={{ fontSize: 13, color: '#7a9bbc' }}>{p.brand}</span>

              {/* Modelo */}
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.model}</p>
                {p.notes && (
                  <p style={{ fontSize: 10, color: '#3d5068', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.notes}</p>
                )}
              </div>

              {/* Pontos */}
              <div><ScoreBadge pts={p.scorePoints} type={p.type} /></div>

              {/* Status */}
              <div>
                <button onClick={() => handleToggle(p.id)} disabled={pending} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 10px', borderRadius: 20, cursor: 'pointer',
                  background: p.active ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
                  border: p.active ? '1px solid rgba(52,211,153,0.25)' : '1px solid rgba(248,113,113,0.25)',
                  color: p.active ? '#34d399' : '#f87171',
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                  {p.active ? 'ATIVO' : 'INATIVO'}
                </button>
              </div>

              {/* Ações */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setModal(p as unknown as HardwarePart)} style={{
                  padding: '4px 10px', borderRadius: 5, cursor: 'pointer',
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#4a6580', fontSize: 11,
                }}>
                  Editar
                </button>
                <button onClick={() => handleDelete(p.id, p.model)} disabled={pending} style={{
                  padding: '4px 10px', borderRadius: 5, cursor: 'pointer',
                  background: 'transparent', border: '1px solid rgba(248,113,113,0.2)',
                  color: '#f87171', fontSize: 11,
                }}>
                  ×
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{
        padding: '12px 16px', borderRadius: 8,
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', gap: 24, flexWrap: 'wrap',
      }}>
        <div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', letterSpacing: '0.1em', marginBottom: 4 }}>EXEMPLOS BOM (≥ 65)</p>
          <p style={{ fontSize: 12, color: '#4a6580' }}>i5 gen 10–12 (20) + 16 GB (30) + NVMe (30) = <span style={{ color: '#34d399' }}>80 pts</span></p>
        </div>
        <div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', letterSpacing: '0.1em', marginBottom: 4 }}>EXEMPLOS INTERMEDIÁRIO (38–64)</p>
          <p style={{ fontSize: 12, color: '#4a6580' }}>i3 gen 10 (14) + 8 GB (18) + SSD SATA (22) = <span style={{ color: '#f59e0b' }}>54 pts</span></p>
        </div>
        <div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', letterSpacing: '0.1em', marginBottom: 4 }}>EXEMPLOS RUIM (&lt; 38)</p>
          <p style={{ fontSize: 12, color: '#4a6580' }}>Pentium (5) + 4 GB (5) + HDD (5) = <span style={{ color: '#f87171' }}>15 pts</span></p>
        </div>
      </div>

      {/* Modal */}
      {modal === 'create' && (
        <PartModal onClose={() => setModal(null)} onSaved={reload} />
      )}
      {modal && modal !== 'create' && (
        <PartModal part={modal as HardwarePart} onClose={() => setModal(null)} onSaved={reload} />
      )}
    </div>
  )
}
