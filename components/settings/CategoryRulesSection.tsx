'use client'

import { useState, useTransition } from 'react'
import {
  createOpeningRule,
  updateOpeningRule,
  toggleOpeningRule,
  deleteOpeningRule,
} from '@/app/(app)/settings/actions'

type RuleType =
  | 'CONFIRMATION'
  | 'TIME_RESTRICTION'
  | 'DEPARTMENT_ONLY'
  | 'TEMPERATURE_CHECK'
  | 'WARNING_ONLY'

interface OpeningRule {
  id: string
  ruleType: RuleType
  description: string
  config: Record<string, unknown>
  active: boolean
}

interface Category {
  id: string
  name: string
  description?: string | null
  active: boolean
  scoringPoints: number
  technicians: { userId: string }[]
  openingRules: OpeningRule[]
  children?: Category[]
}

interface Department { id: string; name: string }

interface Props {
  categories: Category[]
  allDepartments: Department[]
}

// ── Rule type metadata ────────────────────────────────────────────────────────

const RULE_META: Record<RuleType, { icon: string; label: string; color: string; hint: string }> = {
  CONFIRMATION:      { icon: '✅', label: 'Confirmação',          color: '#10b981', hint: 'O usuário precisa confirmar uma afirmação antes de abrir o chamado' },
  TIME_RESTRICTION:  { icon: '🕐', label: 'Restrição de Horário',  color: '#f59e0b', hint: 'O chamado só pode ser aberto em dias e horários específicos' },
  DEPARTMENT_ONLY:   { icon: '🏢', label: 'Departamento',          color: '#38bdf8', hint: 'Somente usuários de departamentos selecionados podem abrir' },
  TEMPERATURE_CHECK: { icon: '🌡️', label: 'Temperatura',           color: '#f87171', hint: 'Verifica a temperatura atual via serviço de clima — bloqueia se fora do limite definido' },
  WARNING_ONLY:      { icon: '⚠️', label: 'Aviso',                 color: '#fbbf24', hint: 'Exibe um aviso informativo antes de abrir (não bloqueia)' },
}

const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// ── Config forms ──────────────────────────────────────────────────────────────

const fieldStyle: React.CSSProperties = {
  display: 'block', width: '100%', marginTop: 6, padding: '8px 10px',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 7, fontSize: 12, color: '#c8d6e5', outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
  color: '#3d5068', letterSpacing: '0.08em',
}

function ConfirmationForm({ cfg, set }: { cfg: Record<string, unknown>; set: (c: Record<string, unknown>) => void }) {
  return (
    <div>
      <label style={labelStyle}>MENSAGEM DE CONFIRMAÇÃO</label>
      <textarea
        value={(cfg.message as string) ?? ''}
        onChange={e => set({ ...cfg, message: e.target.value })}
        placeholder='Ex: "Confirmo que a temperatura do ambiente está acima de 25°C"'
        rows={2}
        style={{ ...fieldStyle, resize: 'vertical' }}
      />
      <p style={{ fontSize: 10, color: '#2d4060', marginTop: 4 }}>
        O usuário deverá marcar um checkbox com este texto antes de abrir o chamado.
      </p>
    </div>
  )
}

function TimeRestrictionForm({ cfg, set }: { cfg: Record<string, unknown>; set: (c: Record<string, unknown>) => void }) {
  const startHour = (cfg.startHour as number) ?? 8
  const endHour   = (cfg.endHour   as number) ?? 18
  const days      = (cfg.days      as number[]) ?? [1, 2, 3, 4, 5]

  function toggleDay(i: number) {
    const next = days.includes(i) ? days.filter(d => d !== i) : [...days, i].sort()
    set({ ...cfg, days: next })
  }

  const numInput: React.CSSProperties = {
    ...fieldStyle, width: 72, display: 'inline-block',
    textAlign: 'center', fontFamily: "'JetBrains Mono', monospace",
    fontSize: 14, fontWeight: 700,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end' }}>
        <div>
          <label style={labelStyle}>INÍCIO</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <input type="number" min={0} max={23} value={startHour}
              onChange={e => set({ ...cfg, startHour: Math.min(23, Math.max(0, Number(e.target.value))) })}
              style={numInput} />
            <span style={{ color: '#3d5068', fontSize: 12 }}>h</span>
          </div>
        </div>
        <div>
          <label style={labelStyle}>FIM</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <input type="number" min={0} max={23} value={endHour}
              onChange={e => set({ ...cfg, endHour: Math.min(23, Math.max(0, Number(e.target.value))) })}
              style={numInput} />
            <span style={{ color: '#3d5068', fontSize: 12 }}>h</span>
          </div>
        </div>
        <p style={{ fontSize: 11, color: '#2d4060', marginBottom: 8 }}>
          Horário de Brasília (UTC-3)
        </p>
      </div>
      <div>
        <label style={{ ...labelStyle, display: 'block', marginBottom: 8 }}>DIAS DA SEMANA</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {DAYS_PT.map((d, i) => {
            const sel = days.includes(i)
            return (
              <button key={i} onClick={() => toggleDay(i)}
                style={{
                  width: 38, height: 30, borderRadius: 7, fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer',
                  background: sel ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${sel ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  color: sel ? '#f59e0b' : '#3d5068',
                }}
              >{d}</button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function DepartmentOnlyForm({ cfg, set, allDepartments }: {
  cfg: Record<string, unknown>; set: (c: Record<string, unknown>) => void; allDepartments: Department[]
}) {
  const selectedIds = (cfg.departmentIds as string[]) ?? []

  function toggleDept(id: string) {
    const next = selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id]
    const names = allDepartments.filter(d => next.includes(d.id)).map(d => d.name)
    set({ ...cfg, departmentIds: next, departmentNames: names })
  }

  return (
    <div>
      <label style={{ ...labelStyle, display: 'block', marginBottom: 8 }}>DEPARTAMENTOS PERMITIDOS</label>
      {allDepartments.length === 0 && (
        <p style={{ fontSize: 12, color: '#2d4060' }}>Nenhum departamento cadastrado.</p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 6 }}>
        {allDepartments.map(dept => {
          const sel = selectedIds.includes(dept.id)
          return (
            <button key={dept.id} onClick={() => toggleDept(dept.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 10px', borderRadius: 7, cursor: 'pointer', textAlign: 'left',
                background: sel ? 'rgba(56,189,248,0.07)' : 'rgba(255,255,255,0.025)',
                border: `1.5px solid ${sel ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.07)'}`,
              }}
            >
              <div style={{
                width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                background: sel ? '#38bdf8' : 'transparent',
                border: `2px solid ${sel ? '#38bdf8' : 'rgba(255,255,255,0.18)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {sel && (
                  <svg width="7" height="7" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 5l2.5 2.5 4.5-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span style={{ fontSize: 12, color: sel ? '#e2eaf4' : '#8ba5c0' }}>{dept.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TemperatureCheckForm({ cfg, set }: { cfg: Record<string, unknown>; set: (c: Record<string, unknown>) => void }) {
  const mode = (cfg.mode as string) ?? 'above'
  const temp = (cfg.temp as number) ?? 25

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={{ ...labelStyle, display: 'block', marginBottom: 8 }}>CONDIÇÃO DE BLOQUEIO</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { v: 'above', label: '🔺 Só abre acima de', desc: 'Ex: AC só pode ser pedido se estiver quente' },
            { v: 'below', label: '🔻 Só abre abaixo de', desc: 'Ex: aquecedor só pode ser pedido se estiver frio' },
          ].map(opt => (
            <button key={opt.v} onClick={() => set({ ...cfg, mode: opt.v })}
              style={{
                flex: 1, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                background: mode === opt.v ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1.5px solid ${mode === opt.v ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: mode === opt.v ? '#f87171' : '#3d5068',
              }}
            >
              <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{opt.label}</p>
              <p style={{ fontSize: 10, color: '#2d4060' }}>{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div>
          <label style={labelStyle}>TEMPERATURA (°C)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <input type="number" value={temp}
              onChange={e => set({ ...cfg, temp: Number(e.target.value) })}
              style={{
                width: 72, padding: '7px 10px', textAlign: 'center',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 7, fontSize: 15, fontWeight: 700, color: '#f87171', outline: 'none',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            />
            <span style={{ fontSize: 14, color: '#f87171' }}>°C</span>
          </div>
        </div>
        <p style={{ fontSize: 11, color: '#2d4060', marginTop: 14, lineHeight: 1.5 }}>
          A temperatura é verificada via Open-Meteo (São Paulo) no momento em que o usuário tenta abrir o chamado.
        </p>
      </div>
    </div>
  )
}

function WarningOnlyForm({ cfg, set }: { cfg: Record<string, unknown>; set: (c: Record<string, unknown>) => void }) {
  return (
    <div>
      <label style={labelStyle}>MENSAGEM DE AVISO</label>
      <textarea
        value={(cfg.message as string) ?? ''}
        onChange={e => set({ ...cfg, message: e.target.value })}
        placeholder='Ex: "Este chamado tem SLA de 2 horas. Certifique-se de fornecer todas as informações necessárias."'
        rows={2}
        style={{ ...fieldStyle, resize: 'vertical' }}
      />
      <p style={{ fontSize: 10, color: '#2d4060', marginTop: 4 }}>
        Aparecerá como um banner antes de confirmar a abertura do chamado. Não bloqueia.
      </p>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function defaultConfig(type: RuleType): Record<string, unknown> {
  if (type === 'CONFIRMATION')     return { message: '' }
  if (type === 'TIME_RESTRICTION') return { startHour: 8, endHour: 18, days: [1, 2, 3, 4, 5] }
  if (type === 'DEPARTMENT_ONLY')  return { departmentIds: [], departmentNames: [] }
  if (type === 'TEMPERATURE_CHECK')return { mode: 'above', temp: 25 }
  return { message: '' }
}

function autoDescription(type: RuleType, cfg: Record<string, unknown>): string {
  if (type === 'CONFIRMATION')     return (cfg.message as string) || 'Confirmação requerida pelo usuário'
  if (type === 'WARNING_ONLY')     return (cfg.message as string) || 'Aviso informativo antes da abertura'
  if (type === 'TEMPERATURE_CHECK') {
    const dir = cfg.mode === 'below' ? 'abaixo de' : 'acima de'
    return `Temperatura ${dir} ${cfg.temp ?? 25}°C (verificado via clima)`
  }
  if (type === 'TIME_RESTRICTION') {
    const s = (cfg.startHour as number) ?? 8
    const e = (cfg.endHour   as number) ?? 18
    const ds = (cfg.days as number[]) ?? [1, 2, 3, 4, 5]
    const dNames = DAYS_PT.filter((_, i) => ds.includes(i)).join(', ')
    return `Disponível ${dNames}, das ${s}h às ${e}h`
  }
  if (type === 'DEPARTMENT_ONLY') {
    const names = (cfg.departmentNames as string[]) ?? []
    return names.length ? `Restrito a: ${names.join(', ')}` : 'Somente departamentos selecionados'
  }
  return ''
}

function ConfigForm({ type, cfg, set, allDepartments }: {
  type: RuleType; cfg: Record<string, unknown>
  set: (c: Record<string, unknown>) => void
  allDepartments: Department[]
}) {
  if (type === 'CONFIRMATION')     return <ConfirmationForm     cfg={cfg} set={set} />
  if (type === 'TIME_RESTRICTION') return <TimeRestrictionForm  cfg={cfg} set={set} />
  if (type === 'DEPARTMENT_ONLY')  return <DepartmentOnlyForm   cfg={cfg} set={set} allDepartments={allDepartments} />
  if (type === 'TEMPERATURE_CHECK')return <TemperatureCheckForm cfg={cfg} set={set} />
  return                                  <WarningOnlyForm      cfg={cfg} set={set} />
}

// ── Rule card (existing rule) ─────────────────────────────────────────────────

function RuleCard({ rule, allDepartments }: { rule: OpeningRule; allDepartments: Department[] }) {
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing]        = useState(false)
  const [desc, setDesc]              = useState(rule.description)
  const [cfg, setCfg]                = useState<Record<string, unknown>>(rule.config)
  const meta                         = RULE_META[rule.ruleType]

  function save() {
    const finalDesc = desc.trim() || autoDescription(rule.ruleType, cfg)
    startTransition(async () => {
      const r = await updateOpeningRule(rule.id, finalDesc, cfg)
      if (r.ok) { setEditing(false); setDesc(finalDesc) }
    })
  }

  function cancel() {
    setEditing(false)
    setDesc(rule.description)
    setCfg(rule.config)
  }

  function doToggle() {
    startTransition(async () => { await toggleOpeningRule(rule.id) })
  }

  function doDelete() {
    if (!confirm(`Excluir a regra "${rule.description}"?`)) return
    startTransition(async () => { await deleteOpeningRule(rule.id) })
  }

  return (
    <div style={{
      background: rule.active ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.01)',
      border: `1px solid ${rule.active ? `${meta.color}28` : 'rgba(255,255,255,0.05)'}`,
      borderRadius: 10, overflow: 'hidden',
      opacity: rule.active ? 1 : 0.55,
      transition: 'opacity 0.15s',
    }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
        <span style={{ fontSize: 15, flexShrink: 0 }}>{meta.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 12, color: '#c8d6e5', fontWeight: 500, lineHeight: 1.4 }}>{rule.description}</p>
          <span style={{
            fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
            color: meta.color, background: `${meta.color}12`,
            border: `1px solid ${meta.color}25`, borderRadius: 3,
            padding: '1px 5px', marginTop: 3, display: 'inline-block',
          }}>{meta.label.toUpperCase()}</span>
        </div>
        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
          {/* Active toggle */}
          <button onClick={doToggle} disabled={isPending} title={rule.active ? 'Desativar' : 'Ativar'}
            style={{
              width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12,
              background: rule.active ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
              color: rule.active ? '#10b981' : '#3d5068',
            }}>{rule.active ? '●' : '○'}</button>
          {/* Edit */}
          <button onClick={() => setEditing(v => !v)}
            style={{
              width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12,
              background: editing ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)',
              color: editing ? '#f59e0b' : '#3d5068',
            }}>✏️</button>
          {/* Delete */}
          <button onClick={doDelete} disabled={isPending}
            style={{
              width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12,
              background: 'rgba(248,113,113,0.07)', color: '#f87171',
            }}>✕</button>
        </div>
      </div>

      {/* Edit panel */}
      {editing && (
        <div style={{
          padding: '12px 14px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <ConfigForm type={rule.ruleType} cfg={cfg} set={setCfg} allDepartments={allDepartments} />
          <div>
            <label style={labelStyle}>DESCRIÇÃO (DEIXE EM BRANCO PARA AUTO-GERAR)</label>
            <input value={desc} onChange={e => setDesc(e.target.value)}
              placeholder={autoDescription(rule.ruleType, cfg)}
              style={fieldStyle}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={save} disabled={isPending} style={{
              padding: '7px 18px', borderRadius: 7, border: 'none', cursor: 'pointer',
              background: 'rgba(16,185,129,0.12)', color: '#10b981', fontSize: 12, fontWeight: 600,
              opacity: isPending ? 0.6 : 1,
            }}>Salvar</button>
            <button onClick={cancel} style={{
              padding: '7px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
              background: 'rgba(255,255,255,0.04)', color: '#3d5068', fontSize: 12,
            }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Add rule panel ────────────────────────────────────────────────────────────

function AddRulePanel({ categoryId, allDepartments, onDone }: {
  categoryId: string; allDepartments: Department[]; onDone: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [ruleType, setRuleType]      = useState<RuleType>('CONFIRMATION')
  const [cfg, setCfg]                = useState<Record<string, unknown>>(defaultConfig('CONFIRMATION'))
  const [desc, setDesc]              = useState('')

  function handleTypeChange(t: RuleType) {
    setRuleType(t); setCfg(defaultConfig(t)); setDesc('')
  }

  function handleSave() {
    const finalDesc = desc.trim() || autoDescription(ruleType, cfg)
    startTransition(async () => {
      const r = await createOpeningRule(categoryId, ruleType, finalDesc, cfg)
      if (r.ok) onDone()
    })
  }

  const meta = RULE_META[ruleType]

  return (
    <div style={{
      background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 10, padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      {/* Type pills */}
      <div>
        <p style={{ ...labelStyle, display: 'block', marginBottom: 8 }}>TIPO DE REGRA</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {(Object.keys(RULE_META) as RuleType[]).map(type => {
            const m = RULE_META[type]
            const sel = ruleType === type
            return (
              <button key={type} onClick={() => handleTypeChange(type)} title={m.hint}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
                  background: sel ? `${m.color}18` : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${sel ? `${m.color}50` : 'rgba(255,255,255,0.07)'}`,
                  color: sel ? m.color : '#3d5068',
                }}
              >
                <span>{m.icon}</span><span>{m.label}</span>
              </button>
            )
          })}
        </div>
        <p style={{ fontSize: 11, color: '#2d4060', marginTop: 7 }}>{meta.hint}</p>
      </div>

      {/* Config form */}
      <ConfigForm type={ruleType} cfg={cfg} set={setCfg} allDepartments={allDepartments} />

      {/* Optional description */}
      <div>
        <label style={labelStyle}>DESCRIÇÃO (DEIXE EM BRANCO PARA AUTO-GERAR)</label>
        <input value={desc} onChange={e => setDesc(e.target.value)}
          placeholder={autoDescription(ruleType, cfg) || 'Descrição gerada automaticamente'}
          style={fieldStyle}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleSave} disabled={isPending} style={{
          padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: 'rgba(16,185,129,0.12)', color: '#10b981', fontSize: 12, fontWeight: 600,
          opacity: isPending ? 0.6 : 1,
        }}>Adicionar Regra</button>
        <button onClick={onDone} style={{
          padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: 'rgba(255,255,255,0.04)', color: '#3d5068', fontSize: 12,
        }}>Cancelar</button>
      </div>
    </div>
  )
}

// ── Category row ──────────────────────────────────────────────────────────────

function CategoryRuleRow({ cat, allDepartments, depth = 0 }: {
  cat: Category; allDepartments: Department[]; depth?: number
}) {
  const [open, setOpen]     = useState(false)
  const [adding, setAdding] = useState(false)
  const activeCount = cat.openingRules.filter(r => r.active).length
  const totalCount  = cat.openingRules.length
  const indent = depth * 20

  return (
    <div>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: `10px 16px 10px ${16 + indent}px`,
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          cursor: 'pointer', userSelect: 'none',
          background: open ? 'rgba(245,158,11,0.02)' : undefined,
        }}
        onClick={() => setOpen(v => !v)}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
          style={{ flexShrink: 0, transition: 'transform 0.15s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>
          <path d="M3 2l4 3-4 3" stroke="#3d5068" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, color: cat.active ? '#c8d6e5' : '#3d5068', fontWeight: depth === 0 ? 500 : 400 }}>
            {depth > 0 && <span style={{ color: '#1e3048', marginRight: 6 }}>↳</span>}
            {cat.name}
          </p>
        </div>

        <div onClick={e => e.stopPropagation()}>
          {totalCount > 0 ? (
            <span style={{
              fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
              color: activeCount > 0 ? '#f59e0b' : '#3d5068',
              background: activeCount > 0 ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${activeCount > 0 ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 6, padding: '3px 9px',
            }}>
              {activeCount > 0
                ? `${activeCount} regra${activeCount !== 1 ? 's' : ''} ativa${activeCount !== 1 ? 's' : ''}`
                : `${totalCount} inativa${totalCount !== 1 ? 's' : ''}`}
            </span>
          ) : (
            <span style={{
              fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#1e3048',
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: 6, padding: '3px 9px',
            }}>SEM RESTRIÇÕES</span>
          )}
        </div>
      </div>

      {/* Expanded panel */}
      {open && (
        <div
          style={{
            paddingLeft: 16 + indent + 22,
            paddingRight: 16, paddingTop: 14, paddingBottom: 14,
            background: 'rgba(0,0,0,0.15)',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Existing rules */}
          {cat.openingRules.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {cat.openingRules.map(rule => (
                <RuleCard key={rule.id} rule={rule} allDepartments={allDepartments} />
              ))}
            </div>
          )}

          {/* Add rule */}
          {adding ? (
            <AddRulePanel
              categoryId={cat.id}
              allDepartments={allDepartments}
              onDone={() => setAdding(false)}
            />
          ) : (
            <button
              onClick={() => setAdding(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', borderRadius: 8,
                border: '1px dashed rgba(245,158,11,0.3)',
                background: 'rgba(245,158,11,0.04)', color: '#f59e0b',
                fontSize: 12, cursor: 'pointer', fontWeight: 500,
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
              Adicionar regra de abertura
            </button>
          )}
        </div>
      )}

      {/* Children */}
      {cat.children?.map(child => (
        <CategoryRuleRow key={child.id} cat={child} allDepartments={allDepartments} depth={depth + 1} />
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CategoryRulesSection({ categories, allDepartments }: Props) {
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
          }}>── REGRAS DE ABERTURA DE CHAMADOS</p>
          <p style={{ fontSize: 12, color: '#3d5068', lineHeight: 1.5 }}>
            Defina condições obrigatórias para abrir chamados em categorias específicas.
            Clique em uma categoria para ver e gerenciar suas regras.
          </p>
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'flex-end', flexShrink: 0, maxWidth: 240 }}>
          {(Object.entries(RULE_META) as [RuleType, typeof RULE_META[RuleType]][]).map(([, meta]) => (
            <span key={meta.label} style={{
              fontSize: 9, padding: '2px 7px', borderRadius: 4,
              background: `${meta.color}14`, color: meta.color,
              border: `1px solid ${meta.color}28`,
              fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap',
            }}>
              {meta.icon} {meta.label}
            </span>
          ))}
        </div>
      </div>

      {/* Rows */}
      {categories.map(cat => (
        <CategoryRuleRow key={cat.id} cat={cat} allDepartments={allDepartments} />
      ))}

      {categories.length === 0 && (
        <div style={{ padding: '32px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#2d4060' }}>Nenhuma categoria encontrada.</p>
        </div>
      )}
    </div>
  )
}
