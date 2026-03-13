'use client'

import { useState, useTransition } from 'react'
import {
  createTicketScoringRule, updateTicketScoringRule,
  deleteTicketScoringRule, toggleTicketScoringRuleActive,
} from '@/app/(app)/settings/actions'

interface SlaPolicy {
  id: string; name: string; active: boolean
  priority: string | null; responseMinutes: number; resolutionMinutes: number
  category: { name: string } | null
}

interface ScoringRule {
  id: string; criterion: string; value: string; label: string; points: number; active: boolean
}

interface Props {
  slaPolices: SlaPolicy[]
  scoringRules: ScoringRule[]
}

function minutesToHuman(min: number) {
  const h = Math.floor(min / 60), m = min % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

const PRIORITY_COLOR: Record<string, string> = {
  LOW: '#94a3b8', MEDIUM: '#38bdf8', HIGH: '#fbbf24', URGENT: '#f87171',
}
const PRIORITY_LABEL: Record<string, string> = {
  LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta', URGENT: 'Urgente',
}

const CRITERIA = [
  { value: 'IMPACT',          label: 'Impacto',           color: '#f87171', desc: 'Gravidade do problema reportado' },
  { value: 'AFFECTED_USERS',  label: 'Usuários afetados', color: '#fbbf24', desc: 'Quantidade de pessoas impactadas' },
]

const SCORING_THRESHOLDS = [
  { label: 'URGENTE', min: 60, color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' },
  { label: 'ALTA',    min: 40, color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.2)'  },
  { label: 'MÉDIA',   min: 20, color: '#38bdf8', bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.2)'  },
  { label: 'BAIXA',   min: 0,  color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)' },
]

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 7, padding: '6px 10px', fontSize: 12, color: '#c8d6e5',
  outline: 'none', boxSizing: 'border-box',
}

export default function TicketSettingsTab({ slaPolices, scoringRules }: Props) {
  const [isPending, startTransition] = useTransition()

  // New rule form
  const [newCriterion, setNewCriterion] = useState('IMPACT')
  const [newValue, setNewValue] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newPoints, setNewPoints] = useState(10)
  const [createError, setCreateError] = useState<string | null>(null)

  // Edit state
  const [editId, setEditId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editPoints, setEditPoints] = useState(0)
  const [editError, setEditError] = useState<string | null>(null)

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null)

  function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setCreateError(null)
    startTransition(async () => {
      const r = await createTicketScoringRule(newCriterion, newValue, newLabel, newPoints)
      if (r.ok) { setNewValue(''); setNewLabel(''); setNewPoints(10) }
      else setCreateError(r.error ?? 'Erro')
    })
  }

  function startEdit(rule: ScoringRule) {
    setEditId(rule.id); setEditLabel(rule.label); setEditPoints(rule.points); setEditError(null)
  }

  function handleUpdate() {
    setEditError(null)
    startTransition(async () => {
      const r = await updateTicketScoringRule(editId!, editLabel, editPoints)
      if (r.ok) setEditId(null)
      else setEditError(r.error ?? 'Erro')
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteTicketScoringRule(deleteId!)
      setDeleteId(null)
    })
  }

  // Group rules by criterion
  const rulesByCriterion = CRITERIA.map(c => ({
    ...c,
    rules: scoringRules.filter(r => r.criterion === c.value).sort((a, b) => b.points - a.points),
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── TICKET PRIORITY SCORING ─────────────────────────────────── */}
      <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '20px 22px' }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#3d5068', letterSpacing: '0.1em', marginBottom: 4 }}>PONTUAÇÃO AUTOMÁTICA DE PRIORIDADE</p>
        <p style={{ fontSize: 12, color: '#3d5068', marginBottom: 16 }}>
          Ao abrir um chamado, o sistema soma pontos por critério e determina a prioridade automaticamente.
        </p>

        {/* Thresholds */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 18 }}>
          {SCORING_THRESHOLDS.map(t => (
            <div key={t.label} style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: t.color }}>{t.label}</p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 800, color: t.color, marginTop: 2 }}>
                {t.min === 0 ? '< 20' : `≥ ${t.min}`}
              </p>
              <p style={{ fontSize: 10, color: '#2d4060', marginTop: 2 }}>pontos</p>
            </div>
          ))}
        </div>

        {/* Rules by criterion */}
        {rulesByCriterion.map(group => (
          <div key={group.value} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: group.color, letterSpacing: '0.08em' }}>
                {group.label.toUpperCase()}
              </span>
              <span style={{ fontSize: 11, color: '#2d4060' }}>— {group.desc}</span>
            </div>
            {group.rules.length === 0 ? (
              <p style={{ fontSize: 11, color: '#2d4060', fontStyle: 'italic', marginLeft: 12 }}>Nenhuma regra cadastrada para este critério</p>
            ) : group.rules.map((rule, ri) => (
              editId === rule.id ? (
                <div key={rule.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 12px', background: 'rgba(0,217,184,0.04)', borderRadius: 8, marginBottom: 4 }}>
                  <input value={editLabel} onChange={e => setEditLabel(e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder="Rótulo" />
                  <input type="number" value={editPoints} onChange={e => setEditPoints(Number(e.target.value))} style={{ ...inputStyle, width: 70, textAlign: 'right' }} min={0} />
                  <span style={{ fontSize: 10, color: '#2d4060' }}>pts</span>
                  <button onClick={handleUpdate} disabled={isPending} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: 'rgba(0,217,184,0.12)', border: '1px solid rgba(0,217,184,0.3)', color: '#00d9b8', fontFamily: "'JetBrains Mono', monospace" }}>Salvar</button>
                  <button onClick={() => setEditId(null)} disabled={isPending} style={{ padding: '5px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#3d5068', fontFamily: "'JetBrains Mono', monospace" }}>✕</button>
                  {editError && <span style={{ fontSize: 11, color: '#f87171' }}>⚠ {editError}</span>}
                </div>
              ) : deleteId === rule.id ? (
                <div key={rule.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 12px', background: 'rgba(248,113,113,0.06)', borderRadius: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: '#f87171', flex: 1 }}>Excluir "{rule.label}"?</span>
                  <button onClick={handleDelete} disabled={isPending} style={{ padding: '4px 12px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer', background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontFamily: "'JetBrains Mono', monospace" }}>Confirmar</button>
                  <button onClick={() => setDeleteId(null)} disabled={isPending} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 10, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#3d5068', fontFamily: "'JetBrains Mono', monospace" }}>Cancelar</button>
                </div>
              ) : (
                <div key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 8, marginBottom: 3, opacity: rule.active ? 1 : 0.5, background: 'rgba(255,255,255,0.01)' }}>
                  <span style={{ flex: 1, fontSize: 12, color: '#8ba5c0' }}>{rule.label}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: group.color }}>{rule.points} pts</span>
                  <button onClick={() => startEdit(rule)} disabled={isPending} style={{ padding: '3px 8px', borderRadius: 5, fontSize: 9, cursor: 'pointer', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', color: '#38bdf8', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>Editar</button>
                  <button onClick={() => startTransition(() => toggleTicketScoringRuleActive(rule.id))} disabled={isPending} style={{ padding: '3px 8px', borderRadius: 5, fontSize: 9, cursor: 'pointer', background: rule.active ? 'rgba(248,113,113,0.08)' : 'rgba(52,211,153,0.08)', border: `1px solid ${rule.active ? 'rgba(248,113,113,0.2)' : 'rgba(52,211,153,0.2)'}`, color: rule.active ? '#f87171' : '#34d399', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{rule.active ? 'Desativar' : 'Ativar'}</button>
                  <button onClick={() => setDeleteId(rule.id)} disabled={isPending} style={{ padding: '3px 8px', borderRadius: 5, fontSize: 9, cursor: 'pointer', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', color: '#f87171', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>✕</button>
                </div>
              )
            ))}
          </div>
        ))}

        {/* Create rule form */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14, marginTop: 4 }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#2d4060', letterSpacing: '0.08em', marginBottom: 10 }}>NOVA REGRA DE PONTUAÇÃO</p>
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '0 0 130px' }}>
              <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700 }}>CRITÉRIO</label>
              <select value={newCriterion} onChange={e => setNewCriterion(e.target.value)} style={inputStyle}>
                {CRITERIA.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '0 0 110px' }}>
              <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700 }}>ID DO VALOR</label>
              <input value={newValue} onChange={e => setNewValue(e.target.value.toUpperCase().replace(/\s/g, '_'))} placeholder="EX_PROD_DOWN" style={inputStyle} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 160px' }}>
              <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700 }}>RÓTULO VISÍVEL</label>
              <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Ex: Sistema em produção parado" style={inputStyle} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '0 0 70px' }}>
              <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700 }}>PONTOS</label>
              <input type="number" value={newPoints} onChange={e => setNewPoints(Number(e.target.value))} min={0} max={100} style={{ ...inputStyle, textAlign: 'right' }} />
            </div>
            <button type="submit" disabled={isPending || !newValue.trim() || !newLabel.trim()} style={{
              padding: '7px 16px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              background: 'rgba(0,217,184,0.12)', border: '1px solid rgba(0,217,184,0.3)', color: '#00d9b8',
              fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap',
              opacity: !newValue.trim() || !newLabel.trim() ? 0.4 : 1,
            }}>+ Adicionar regra</button>
          </form>
          {createError && <p style={{ fontSize: 11, color: '#f87171', marginTop: 8 }}>⚠ {createError}</p>}
        </div>
      </div>

      {/* ── SLA POLICIES (read-only) ─────────────────────────────────── */}
      <div style={{ background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10 }}>
        <span style={{ fontSize: 14, flexShrink: 0 }}>ℹ️</span>
        <p style={{ fontSize: 12, color: '#3d5068', lineHeight: 1.5 }}>
          As políticas de SLA definem os prazos de <strong style={{ color: '#8ba5c0' }}>resposta</strong> e <strong style={{ color: '#8ba5c0' }}>resolução</strong> por combinação de categoria e prioridade. O sistema calcula automaticamente os prazos ao abrir cada chamado.
        </p>
      </div>

      <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#3d5068', letterSpacing: '0.1em' }}>POLÍTICAS DE SLA</p>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060' }}>{slaPolices.length} políticas</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 110px 110px 70px', columnGap: 10, padding: '0 16px', height: 36, alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          {['NOME', 'CATEGORIA', 'PRIORIDADE', 'RESPOSTA', 'RESOLUÇÃO', 'STATUS'].map((h, i) => (
            <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#2d4060', letterSpacing: '0.08em' }}>{h}</div>
          ))}
        </div>
        {slaPolices.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#2d4060' }}>Nenhuma política cadastrada</div>
        ) : slaPolices.map((s, i) => {
          const pc = s.priority ? PRIORITY_COLOR[s.priority] : '#94a3b8'
          return (
            <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 110px 110px 70px', columnGap: 10, padding: '11px 16px', alignItems: 'center', borderBottom: i < slaPolices.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', opacity: s.active ? 1 : 0.5 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#c8d6e5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</p>
              <span style={{ fontSize: 11, color: '#4a6580', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.category?.name ?? '—'}</span>
              {s.priority ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: pc }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: pc }} />{PRIORITY_LABEL[s.priority]}
                </span>
              ) : <span style={{ fontSize: 11, color: '#2d4060' }}>—</span>}
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#38bdf8' }}>{minutesToHuman(s.responseMinutes)}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#a78bfa' }}>{minutesToHuman(s.resolutionMinutes)}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: s.active ? '#34d399' : '#f87171', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />{s.active ? 'Ativa' : 'Inativa'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
