'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import {
  createAssetCategory, toggleAssetCategoryActive, updateAssetCategory, deleteAssetCategory,
  createAssetLocation, deleteAssetLocation, updateAssetLocation,
  createAssetCustomFieldDef, updateAssetCustomFieldDef, deleteAssetCustomFieldDef,
  createAssetModel, updateAssetModel, deleteAssetModel,
} from '@/app/(app)/settings/actions'
import type { AssetCustomFieldDefData, AssetModelData } from '@/app/(app)/settings/actions'

type AssetCategoryKind = 'EQUIPMENT' | 'ACCESSORY' | 'DISPOSABLE'

const KIND_OPTIONS: { value: AssetCategoryKind; label: string; color: string }[] = [
  { value: 'EQUIPMENT',  label: 'Equipamento', color: '#38bdf8' },
  { value: 'ACCESSORY',  label: 'Acessório',   color: '#a78bfa' },
  { value: 'DISPOSABLE', label: 'Descartável',  color: '#fb923c' },
]

interface AssetCategory {
  id: string
  name: string
  icon: string | null
  active: boolean
  kind: AssetCategoryKind
  _count: { assets: number }
}

interface Props {
  assetCategories: AssetCategory[]
  locations: string[]
  customFieldDefs: AssetCustomFieldDefData[]
  assetModels: AssetModelData[]
  departments: { id: string; name: string }[]
  totalAssets: number
  lockedKind?: AssetCategoryKind
}

const iStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '7px 10px', fontSize: 13, color: '#c8d6e5',
  outline: 'none', boxSizing: 'border-box',
}

const ICON_OPTIONS = [
  'laptop', 'monitor', 'printer', 'keyboard', 'mouse-pointer', 'headphones',
  'battery', 'network', 'smartphone', 'package', 'cpu', 'hard-drive', 'server', 'tablet', 'camera',
]

const LS_KEY = 'hd_settings_assets_open'

// ── Image compression ──────────────────────────────────────────────────────────
async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      try {
        const MAX = 400
        const scale = Math.min(MAX / img.naturalWidth, MAX / img.naturalHeight, 1)
        const w = Math.round(img.naturalWidth * scale)
        const h = Math.round(img.naturalHeight * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/webp', 0.82))
      } catch (e) { reject(e) } finally { URL.revokeObjectURL(url) }
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')) }
    img.src = url
  })
}

// ── Section accordion card ─────────────────────────────────────────────────────
function SectionCard({
  sectionKey, icon, title, description, count, color, open, onToggle, children,
}: {
  sectionKey: string; icon: string; title: string; description: string; count?: number
  color: string; open: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div style={{
      background: '#0d1422',
      border: `1px solid ${open ? `${color}30` : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.15s',
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14,
          padding: '18px 22px', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{
          width: 42, height: 42, borderRadius: 10, flexShrink: 0,
          background: `${color}14`, border: `1px solid ${color}28`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        }}>{icon}</span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#c8d6e5' }}>{title}</p>
            {count !== undefined && (
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
                color, background: `${color}12`, border: `1px solid ${color}28`,
                borderRadius: 5, padding: '2px 7px',
              }}>{count}</span>
            )}
          </div>
          <p style={{ fontSize: 12, color: '#3d5068', marginTop: 3 }}>{description}</p>
        </div>

        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          style={{
            flexShrink: 0, transition: 'transform 0.2s',
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)', color: '#3d5068',
          }}
        >
          <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px 22px' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ── Small action button ────────────────────────────────────────────────────────
function SmallBtn({ label, color, onClick, disabled }: {
  label: string; color: string; onClick: () => void; disabled: boolean
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600,
      cursor: disabled ? 'default' : 'pointer',
      background: `${color}12`, border: `1px solid ${color}28`, color,
      fontFamily: "'JetBrains Mono', monospace", transition: 'all 0.1s',
      opacity: disabled ? 0.5 : 1, flexShrink: 0, whiteSpace: 'nowrap',
    }}>{label}</button>
  )
}

function CheckboxToggle({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', userSelect: 'none' }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 15, height: 15, borderRadius: 4, flexShrink: 0,
          border: `1px solid ${checked ? '#00d9b8' : 'rgba(255,255,255,0.15)'}`,
          background: checked ? 'rgba(0,217,184,0.2)' : 'rgba(255,255,255,0.03)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.1s',
        }}
      >
        {checked && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#00d9b8" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
      </div>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: checked ? '#c8d6e5' : '#3d5068', fontWeight: 600 }}>{label}</span>
    </label>
  )
}

// ── Alert Config Block ─────────────────────────────────────────────────────────
function AlertConfigBlock({
  trigger, onTrigger, days, onDays,
}: {
  trigger: string; onTrigger: (v: string) => void
  days: string; onDays: (v: string) => void
}) {
  const TRIGGER_OPTIONS = [
    { value: 'CHECK_IN',   label: '🟢 Check-in' },
    { value: 'CHECK_OUT',  label: '🔴 Check-out' },
    { value: 'MAINTENANCE', label: '🔧 Manutenção' },
    { value: 'ANY',        label: '🔔 Qualquer movimentação' },
  ]
  return (
    <div style={{
      background: 'rgba(251,146,60,0.05)', border: '1px solid rgba(251,146,60,0.2)',
      borderRadius: 8, padding: '12px 14px', marginTop: 2,
    }}>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#fb923c', marginBottom: 10, letterSpacing: '0.1em' }}>
        CONFIGURAÇÃO DO ALERTA
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: '1 1 180px' }}>
          <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700 }}>ACIONADO POR</label>
          <select value={trigger} onChange={e => onTrigger(e.target.value)} style={iStyle}>
            {TRIGGER_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: '0 1 120px' }}>
          <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700 }}>DIAS ATÉ ALERTA</label>
          <input
            type="number" min={0} max={3650}
            value={days} onChange={e => onDays(e.target.value)}
            placeholder="Ex: 14"
            style={iStyle}
          />
        </div>
        <p style={{ fontSize: 11, color: '#3d5068', flex: '1 1 200px', paddingBottom: 7, lineHeight: 1.4 }}>
          O sistema alertará <strong style={{ color: '#fb923c' }}>{days || 0} dia(s)</strong> após {
            trigger === 'CHECK_IN' ? 'um check-in'
            : trigger === 'CHECK_OUT' ? 'um check-out'
            : trigger === 'MAINTENANCE' ? 'manutenção'
            : 'qualquer movimentação'
          }.
        </p>
      </div>
    </div>
  )
}

// ── Custom Fields Section ──────────────────────────────────────────────────────
export function CustomFieldsSection({
  assetCategories,
  customFieldDefs,
}: {
  assetCategories: AssetCategory[]
  customFieldDefs: AssetCustomFieldDefData[]
}) {
  const [isPending, startTransition] = useTransition()

  // Create form state
  const [createCatId, setCreateCatId] = useState(assetCategories[0]?.id ?? '')
  const [createLabel, setCreateLabel] = useState('')
  const [createType, setCreateType] = useState<'text' | 'checkbox_group' | 'alert'>('text')
  const [createOptions, setCreateOptions] = useState<string[]>([])
  const [createOptionInput, setCreateOptionInput] = useState('')
  const [createRequired, setCreateRequired] = useState(false)
  const [createIsUnique, setCreateIsUnique] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState(false)
  // Alert-specific create state
  const [createAlertTrigger, setCreateAlertTrigger] = useState('CHECK_IN')
  const [createAlertDays, setCreateAlertDays] = useState('0')

  // Edit state
  const [editId, setEditId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editType, setEditType] = useState<'text' | 'checkbox_group' | 'alert'>('text')
  const [editOptions, setEditOptions] = useState<string[]>([])
  const [editOptionInput, setEditOptionInput] = useState('')
  const [editRequired, setEditRequired] = useState(false)
  const [editIsUnique, setEditIsUnique] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  // Alert-specific edit state
  const [editAlertTrigger, setEditAlertTrigger] = useState('CHECK_IN')
  const [editAlertDays, setEditAlertDays] = useState('0')

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function startEdit(f: AssetCustomFieldDefData) {
    setEditId(f.id)
    setEditLabel(f.label)
    setEditType(f.fieldType)
    setEditOptions([...f.options])
    setEditOptionInput('')
    setEditRequired(f.required)
    setEditIsUnique(f.isUnique)
    setEditError(null)
    setDeleteId(null)
    if (f.fieldType === 'alert') {
      setEditAlertTrigger(f.options[0] ?? 'CHECK_IN')
      setEditAlertDays(f.options[1] ?? '0')
    }
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError(null); setCreateSuccess(false)
    const opts = createType === 'alert'
      ? [createAlertTrigger, createAlertDays]
      : createOptions
    startTransition(async () => {
      const r = await createAssetCustomFieldDef(createCatId, createLabel, createType, opts, createRequired, createIsUnique)
      if (r.ok) {
        setCreateLabel(''); setCreateType('text'); setCreateOptions([]); setCreateOptionInput('')
        setCreateRequired(false); setCreateIsUnique(false)
        setCreateAlertTrigger('CHECK_IN'); setCreateAlertDays('0')
        setCreateSuccess(true); setTimeout(() => setCreateSuccess(false), 3000)
      } else setCreateError(r.error ?? 'Erro')
    })
  }

  function handleUpdate() {
    setEditError(null)
    const opts = editType === 'alert'
      ? [editAlertTrigger, editAlertDays]
      : editOptions
    startTransition(async () => {
      const r = await updateAssetCustomFieldDef(editId!, editLabel, editType, opts, editRequired, editIsUnique)
      if (r.ok) setEditId(null)
      else setEditError(r.error ?? 'Erro')
    })
  }

  function handleDelete(id: string) {
    setDeleteError(null)
    startTransition(async () => {
      const r = await deleteAssetCustomFieldDef(id)
      if (!r.ok) setDeleteError(r.error ?? 'Erro')
      else setDeleteId(null)
    })
  }

  // Group fields by category
  const fieldsByCat: Record<string, AssetCustomFieldDefData[]> = {}
  for (const f of customFieldDefs) {
    if (!fieldsByCat[f.categoryId]) fieldsByCat[f.categoryId] = []
    fieldsByCat[f.categoryId].push(f)
  }

  const catsWithFields = assetCategories.filter(c => fieldsByCat[c.id]?.length)
  const catsWithoutFields = assetCategories.filter(c => !fieldsByCat[c.id]?.length)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Create form */}
      <div style={{
        background: 'rgba(167,139,250,0.04)', border: '1px solid rgba(167,139,250,0.15)',
        borderRadius: 10, padding: '16px 18px',
      }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#a78bfa', letterSpacing: '0.1em', marginBottom: 12 }}>
          NOVO CAMPO PERSONALIZADO
        </p>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700 }}>CATEGORIA *</label>
              <select value={createCatId} onChange={e => setCreateCatId(e.target.value)} style={iStyle}>
                {assetCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ flex: '2 1 180px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700 }}>NOME DO CAMPO *</label>
              <input value={createLabel} onChange={e => setCreateLabel(e.target.value)} placeholder="Ex: Número de Série Adicional" style={iStyle} required />
            </div>
            <div style={{ flex: '0 1 160px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700 }}>TIPO</label>
              <select value={createType} onChange={e => { setCreateType(e.target.value as 'text' | 'checkbox_group' | 'alert'); if (e.target.value !== 'text') setCreateIsUnique(false) }} style={iStyle}>
                <option value="text">Texto livre</option>
                <option value="checkbox_group">Grupo de opções</option>
                <option value="alert">🔔 Alerta programado</option>
              </select>
            </div>
            {createType !== 'alert' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'flex-end', paddingBottom: 2 }}>
                <CheckboxToggle label="Obrigatório" checked={createRequired} onChange={setCreateRequired} />
                {createType === 'text' && <CheckboxToggle label="Único" checked={createIsUnique} onChange={setCreateIsUnique} />}
              </div>
            )}
            <button type="submit" disabled={isPending || !createLabel.trim() || !createCatId} style={{
              padding: '9px 18px', borderRadius: 8, height: 38, flexShrink: 0,
              background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)',
              color: '#a78bfa', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
              opacity: (!createLabel.trim() || !createCatId) ? 0.4 : 1,
            }}>+ Criar</button>
          </div>

          {createType === 'checkbox_group' && (
            <div style={{ paddingLeft: 2 }}>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700, marginBottom: 7 }}>OPÇÕES DO GRUPO</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {createOptions.map((opt, i) => (
                  <span key={i} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '3px 8px', borderRadius: 6,
                    background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)',
                    fontSize: 11, color: '#a78bfa',
                  }}>
                    {opt}
                    <button type="button" onClick={() => setCreateOptions(prev => prev.filter((_, j) => j !== i))} style={{
                      background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: 10, padding: 0,
                    }}>✕</button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={createOptionInput}
                  onChange={e => setCreateOptionInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (createOptionInput.trim()) {
                        setCreateOptions(prev => [...prev, createOptionInput.trim()])
                        setCreateOptionInput('')
                      }
                    }
                  }}
                  placeholder="Nova opção (Enter para adicionar)"
                  style={{ ...iStyle, flex: '1 1 200px' }}
                />
                <button type="button" onClick={() => {
                  if (createOptionInput.trim()) {
                    setCreateOptions(prev => [...prev, createOptionInput.trim()])
                    setCreateOptionInput('')
                  }
                }} style={{
                  padding: '7px 14px', borderRadius: 7, fontSize: 11, cursor: 'pointer',
                  background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)',
                  color: '#a78bfa', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0,
                }}>+ Opção</button>
              </div>
            </div>
          )}

          {createType === 'alert' && (
            <AlertConfigBlock
              trigger={createAlertTrigger} onTrigger={setCreateAlertTrigger}
              days={createAlertDays} onDays={setCreateAlertDays}
            />
          )}
        </form>
        {createError && <p style={{ fontSize: 12, color: '#f87171', marginTop: 8 }}>⚠ {createError}</p>}
        {createSuccess && <p style={{ fontSize: 12, color: '#34d399', marginTop: 8 }}>✓ Campo criado com sucesso</p>}
      </div>

      {/* Delete error banner */}
      {deleteError && (
        <div style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8 }}>
          <p style={{ fontSize: 12, color: '#f87171' }}>⚠ {deleteError}</p>
        </div>
      )}

      {/* Fields grouped by category */}
      {catsWithFields.length === 0 && (
        <div style={{ padding: '28px 0', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#2d4060' }}>
          Nenhum campo personalizado cadastrado
        </div>
      )}

      {catsWithFields.map(cat => (
        <div key={cat.id} style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(167,139,250,0.1)',
          borderRadius: 10, overflow: 'hidden',
        }}>
          <div style={{ padding: '10px 16px', background: 'rgba(167,139,250,0.05)', borderBottom: '1px solid rgba(167,139,250,0.1)' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#a78bfa' }}>
              {cat.name.toUpperCase()}
            </span>
          </div>
          {(fieldsByCat[cat.id] ?? []).map((f, fi) => (
            <div key={f.id} style={{
              borderBottom: fi < (fieldsByCat[cat.id]?.length ?? 0) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              {editId === f.id ? (
                /* Edit inline */
                <div style={{ padding: '12px 16px', background: 'rgba(0,217,184,0.03)', borderLeft: '2px solid rgba(0,217,184,0.3)' }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 8 }}>
                    <input
                      value={editLabel}
                      onChange={e => setEditLabel(e.target.value)}
                      placeholder="Nome do campo"
                      style={{ ...iStyle, flex: '1 1 150px' }}
                    />
                    <select
                      value={editType}
                      onChange={e => { setEditType(e.target.value as 'text' | 'checkbox_group' | 'alert'); if (e.target.value !== 'text') setEditIsUnique(false) }}
                      style={{ ...iStyle, flex: '0 1 160px' }}
                    >
                      <option value="text">Texto livre</option>
                      <option value="checkbox_group">Grupo de opções</option>
                      <option value="alert">🔔 Alerta programado</option>
                    </select>
                    {editType !== 'alert' && (
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <CheckboxToggle label="Obrigatório" checked={editRequired} onChange={setEditRequired} />
                        {editType === 'text' && <CheckboxToggle label="Único" checked={editIsUnique} onChange={setEditIsUnique} />}
                      </div>
                    )}
                    <button onClick={handleUpdate} disabled={isPending || !editLabel.trim()} style={{
                      padding: '7px 14px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      background: 'rgba(0,217,184,0.12)', border: '1px solid rgba(0,217,184,0.3)',
                      color: '#00d9b8', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0,
                    }}>✓ Salvar</button>
                    <button onClick={() => setEditId(null)} disabled={isPending} style={{
                      padding: '7px 10px', borderRadius: 7, fontSize: 11, cursor: 'pointer',
                      background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
                      color: '#3d5068', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0,
                    }}>✕</button>
                  </div>
                  {editType === 'alert' && (
                    <AlertConfigBlock
                      trigger={editAlertTrigger} onTrigger={setEditAlertTrigger}
                      days={editAlertDays} onDays={setEditAlertDays}
                    />
                  )}
                  {editType === 'checkbox_group' && (
                    <div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 7 }}>
                        {editOptions.map((opt, i) => (
                          <span key={i} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '3px 8px', borderRadius: 6,
                            background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)',
                            fontSize: 11, color: '#a78bfa',
                          }}>
                            {opt}
                            <button type="button" onClick={() => setEditOptions(prev => prev.filter((_, j) => j !== i))} style={{
                              background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: 10, padding: 0,
                            }}>✕</button>
                          </span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          value={editOptionInput}
                          onChange={e => setEditOptionInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              if (editOptionInput.trim()) {
                                setEditOptions(prev => [...prev, editOptionInput.trim()])
                                setEditOptionInput('')
                              }
                            }
                          }}
                          placeholder="Nova opção (Enter)"
                          style={{ ...iStyle, flex: '1 1 180px' }}
                        />
                        <button type="button" onClick={() => {
                          if (editOptionInput.trim()) {
                            setEditOptions(prev => [...prev, editOptionInput.trim()])
                            setEditOptionInput('')
                          }
                        }} style={{
                          padding: '7px 12px', borderRadius: 7, fontSize: 11, cursor: 'pointer',
                          background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)',
                          color: '#a78bfa', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0,
                        }}>+ Opção</button>
                      </div>
                    </div>
                  )}
                  {editError && <p style={{ fontSize: 11, color: '#f87171', marginTop: 6 }}>⚠ {editError}</p>}
                </div>
              ) : deleteId === f.id ? (
                /* Delete confirm */
                <div style={{ padding: '10px 16px', background: 'rgba(248,113,113,0.05)', borderLeft: '2px solid rgba(248,113,113,0.3)' }}>
                  <p style={{ fontSize: 12, color: '#f87171', marginBottom: 8 }}>Excluir campo "{f.label}"? Esta ação é irreversível.</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleDelete(f.id)} disabled={isPending} style={{
                      padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>Confirmar</button>
                    <button onClick={() => setDeleteId(null)} style={{
                      padding: '5px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                      background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#3d5068',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>Cancelar</button>
                  </div>
                </div>
              ) : (
                /* View row */
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#c8d6e5' }}>{f.label}</span>
                      {f.fieldType === 'alert' ? (
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
                          color: '#fb923c', background: 'rgba(251,146,60,0.08)',
                          border: '1px solid rgba(251,146,60,0.25)', borderRadius: 4, padding: '2px 6px',
                        }}>🔔 ALERTA</span>
                      ) : (
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
                          color: f.fieldType === 'checkbox_group' ? '#a78bfa' : '#38bdf8',
                          background: f.fieldType === 'checkbox_group' ? 'rgba(167,139,250,0.08)' : 'rgba(56,189,248,0.08)',
                          border: `1px solid ${f.fieldType === 'checkbox_group' ? 'rgba(167,139,250,0.2)' : 'rgba(56,189,248,0.2)'}`,
                          borderRadius: 4, padding: '2px 6px',
                        }}>
                          {f.fieldType === 'checkbox_group' ? 'GRUPO OPÇÕES' : 'TEXTO'}
                        </span>
                      )}
                      {f.fieldType !== 'alert' && f.required && (
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#fb923c', background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: 4, padding: '2px 6px' }}>
                          OBRIGATÓRIO
                        </span>
                      )}
                      {f.fieldType !== 'alert' && f.isUnique && (
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 4, padding: '2px 6px' }}>
                          ÚNICO
                        </span>
                      )}
                    </div>
                    {f.fieldType === 'checkbox_group' && f.options.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
                        {f.options.map((opt, i) => (
                          <span key={i} style={{
                            padding: '2px 7px', borderRadius: 4,
                            background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)',
                            fontSize: 10, color: '#8b7fd4',
                          }}>{opt}</span>
                        ))}
                      </div>
                    )}
                    {f.fieldType === 'alert' && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '2px 8px', borderRadius: 4, fontSize: 10,
                          background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.18)',
                          color: '#fb923c',
                        }}>
                          {f.options[0] === 'CHECK_IN' ? '🟢 Check-in'
                            : f.options[0] === 'CHECK_OUT' ? '🔴 Check-out'
                            : f.options[0] === 'MAINTENANCE' ? '🔧 Manutenção'
                            : f.options[0] === 'ANY' ? '🔔 Qualquer mov.'
                            : f.options[0] ?? '—'}
                        </span>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '2px 8px', borderRadius: 4, fontSize: 10,
                          background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.18)',
                          color: '#fb923c',
                        }}>
                          ⏱ {f.options[1] ?? '0'} dia(s)
                        </span>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    <SmallBtn label="Editar" color="#38bdf8" onClick={() => startEdit(f)} disabled={isPending} />
                    <SmallBtn label="Excluir" color="#f87171" onClick={() => { setDeleteId(f.id); setDeleteError(null) }} disabled={isPending} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* Categories without fields note */}
      {catsWithoutFields.length > 0 && (
        <p style={{ fontSize: 11, color: '#2d4060', fontFamily: "'JetBrains Mono', monospace" }}>
          Sem campos: {catsWithoutFields.map(c => c.name).join(', ')}
        </p>
      )}
    </div>
  )
}

// ── Models Section ─────────────────────────────────────────────────────────────
export function ModelsSection({
  assetCategories,
  assetModels,
}: {
  assetCategories: AssetCategory[]
  assetModels: AssetModelData[]
}) {
  const [isPending, startTransition] = useTransition()

  // Create form
  const [showCreate, setShowCreate] = useState(false)
  const [createCatId, setCreateCatId] = useState(assetCategories[0]?.id ?? '')
  const [createName, setCreateName] = useState('')
  const [createMfg, setCreateMfg] = useState('')
  const [createImage, setCreateImage] = useState<string | null>(null)
  const [createImagePreview, setCreateImagePreview] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const createFileRef = useRef<HTMLInputElement>(null)

  // Edit state
  const [editId, setEditId] = useState<string | null>(null)
  const [editCatId, setEditCatId] = useState('')
  const [editName, setEditName] = useState('')
  const [editMfg, setEditMfg] = useState('')
  const [editImage, setEditImage] = useState<string | null>(null)
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const editFileRef = useRef<HTMLInputElement>(null)

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleCreateImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const compressed = await compressImage(file)
      setCreateImage(compressed)
      setCreateImagePreview(compressed)
    } catch {
      setCreateError('Falha ao processar imagem')
    }
  }

  async function handleEditImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const compressed = await compressImage(file)
      setEditImage(compressed)
      setEditImagePreview(compressed)
    } catch {
      setEditError('Falha ao processar imagem')
    }
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError(null)
    startTransition(async () => {
      const r = await createAssetModel({ categoryId: createCatId, name: createName, manufacturer: createMfg, imageData: createImage })
      if (r.ok) {
        setCreateName(''); setCreateMfg(''); setCreateImage(null); setCreateImagePreview(null)
        if (createFileRef.current) createFileRef.current.value = ''
        setShowCreate(false)
      } else setCreateError(r.error ?? 'Erro')
    })
  }

  function startEdit(m: AssetModelData) {
    setEditId(m.id)
    setEditCatId(m.categoryId)
    setEditName(m.name)
    setEditMfg(m.manufacturer ?? '')
    setEditImage(null)
    setEditImagePreview(m.imageData)
    setEditError(null)
    setDeleteId(null)
  }

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    setEditError(null)
    startTransition(async () => {
      // Pass editImage (new compressed) if changed, else pass current imageData (null means keep existing server-side)
      const r = await updateAssetModel(editId!, { name: editName, manufacturer: editMfg, imageData: editImage })
      if (r.ok) setEditId(null)
      else setEditError(r.error ?? 'Erro')
    })
  }

  function handleDelete(id: string) {
    setDeleteError(null)
    startTransition(async () => {
      const r = await deleteAssetModel(id)
      if (!r.ok) setDeleteError(r.error ?? 'Erro')
      else setDeleteId(null)
    })
  }

  const catMap = Object.fromEntries(assetCategories.map(c => [c.id, c.name]))

  const thumbStyle: React.CSSProperties = {
    width: 64, height: 64, borderRadius: 8, objectFit: 'cover',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
    flexShrink: 0,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => { setShowCreate(v => !v); setCreateError(null) }} style={{
          padding: '8px 18px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
          background: 'rgba(0,217,184,0.1)', border: '1px solid rgba(0,217,184,0.25)',
          color: '#00d9b8', fontFamily: "'JetBrains Mono', monospace",
        }}>{showCreate ? '✕ Cancelar' : '+ Novo Modelo'}</button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div style={{
          background: 'rgba(0,217,184,0.03)', border: '1px solid rgba(0,217,184,0.15)',
          borderRadius: 10, padding: '16px 18px',
        }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#00d9b8', letterSpacing: '0.1em', marginBottom: 12 }}>
            NOVO MODELO
          </p>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 160px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700 }}>CATEGORIA *</label>
                <select value={createCatId} onChange={e => setCreateCatId(e.target.value)} style={iStyle}>
                  {assetCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ flex: '2 1 180px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700 }}>NOME *</label>
                <input value={createName} onChange={e => setCreateName(e.target.value)} placeholder="Ex: ThinkPad E14" style={iStyle} required />
              </div>
              <div style={{ flex: '2 1 180px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700 }}>FABRICANTE</label>
                <input value={createMfg} onChange={e => setCreateMfg(e.target.value)} placeholder="Ex: Lenovo" style={iStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700 }}>IMAGEM</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {createImagePreview ? (
                  <img src={createImagePreview} alt="Preview" style={thumbStyle} />
                ) : (
                  <div style={{ ...thumbStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#2d4060' }}>📦</div>
                )}
                <div>
                  <input ref={createFileRef} type="file" accept="image/*" onChange={handleCreateImageChange} style={{ display: 'none' }} />
                  <button type="button" onClick={() => createFileRef.current?.click()} style={{
                    padding: '6px 14px', borderRadius: 7, fontSize: 11, cursor: 'pointer',
                    background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)',
                    color: '#38bdf8', fontFamily: "'JetBrains Mono', monospace",
                  }}>Selecionar imagem</button>
                  {createImagePreview && (
                    <button type="button" onClick={() => { setCreateImage(null); setCreateImagePreview(null); if (createFileRef.current) createFileRef.current.value = '' }} style={{
                      marginLeft: 8, padding: '6px 10px', borderRadius: 7, fontSize: 11, cursor: 'pointer',
                      background: 'transparent', border: '1px solid rgba(248,113,113,0.2)',
                      color: '#f87171', fontFamily: "'JetBrains Mono', monospace",
                    }}>Remover</button>
                  )}
                  <p style={{ fontSize: 10, color: '#2d4060', marginTop: 5, fontFamily: "'JetBrains Mono', monospace" }}>
                    Máx 400×400px, formato WebP após compressão
                  </p>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button type="submit" disabled={isPending || !createName.trim()} style={{
                padding: '8px 20px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                background: 'rgba(0,217,184,0.12)', border: '1px solid rgba(0,217,184,0.3)',
                color: '#00d9b8', fontFamily: "'JetBrains Mono', monospace",
                opacity: !createName.trim() ? 0.4 : 1,
              }}>✓ Criar Modelo</button>
            </div>
          </form>
          {createError && <p style={{ fontSize: 12, color: '#f87171', marginTop: 8 }}>⚠ {createError}</p>}
        </div>
      )}

      {/* Delete error */}
      {deleteError && (
        <div style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8 }}>
          <p style={{ fontSize: 12, color: '#f87171' }}>⚠ {deleteError}</p>
        </div>
      )}

      {/* Model grid */}
      {assetModels.length === 0 ? (
        <div style={{ padding: '32px 0', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#2d4060' }}>
          Nenhum modelo cadastrado
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {assetModels.map(m => (
            <div key={m.id} style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10, overflow: 'hidden',
            }}>
              {editId === m.id ? (
                /* Edit inline */
                <form onSubmit={handleUpdate} style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(0,217,184,0.03)', borderLeft: '2px solid rgba(0,217,184,0.3)' }}>
                  <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                    <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nome" style={{ ...iStyle, width: '100%' }} required />
                    <input value={editMfg} onChange={e => setEditMfg(e.target.value)} placeholder="Fabricante" style={{ ...iStyle, width: '100%' }} />
                  </div>
                  {/* Image */}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {editImagePreview ? (
                      <img src={editImagePreview} alt="Preview" style={{ width: 56, height: 56, borderRadius: 7, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)' }} />
                    ) : (
                      <div style={{ width: 56, height: 56, borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📦</div>
                    )}
                    <div>
                      <input ref={editFileRef} type="file" accept="image/*" onChange={handleEditImageChange} style={{ display: 'none' }} />
                      <button type="button" onClick={() => editFileRef.current?.click()} style={{
                        padding: '4px 10px', borderRadius: 6, fontSize: 10, cursor: 'pointer',
                        background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)',
                        color: '#38bdf8', fontFamily: "'JetBrains Mono', monospace", display: 'block', marginBottom: 4,
                      }}>Alterar imagem</button>
                      {editImagePreview && (
                        <button type="button" onClick={() => { setEditImage(null); setEditImagePreview(null); if (editFileRef.current) editFileRef.current.value = '' }} style={{
                          padding: '4px 10px', borderRadius: 6, fontSize: 10, cursor: 'pointer',
                          background: 'transparent', border: '1px solid rgba(248,113,113,0.2)',
                          color: '#f87171', fontFamily: "'JetBrains Mono', monospace",
                        }}>Remover imagem</button>
                      )}
                    </div>
                  </div>
                  {editError && <p style={{ fontSize: 11, color: '#f87171' }}>⚠ {editError}</p>}
                  <div style={{ display: 'flex', gap: 7 }}>
                    <button type="submit" disabled={isPending || !editName.trim()} style={{
                      padding: '6px 14px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      background: 'rgba(0,217,184,0.12)', border: '1px solid rgba(0,217,184,0.3)',
                      color: '#00d9b8', fontFamily: "'JetBrains Mono', monospace",
                    }}>✓ Salvar</button>
                    <button type="button" onClick={() => setEditId(null)} style={{
                      padding: '6px 10px', borderRadius: 7, fontSize: 11, cursor: 'pointer',
                      background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
                      color: '#3d5068', fontFamily: "'JetBrains Mono', monospace",
                    }}>✕</button>
                  </div>
                </form>
              ) : deleteId === m.id ? (
                /* Delete confirm */
                <div style={{ padding: '14px 16px', background: 'rgba(248,113,113,0.05)', borderLeft: '2px solid rgba(248,113,113,0.3)' }}>
                  <p style={{ fontSize: 12, color: '#f87171', marginBottom: 8 }}>Excluir "{m.name}"?</p>
                  <div style={{ display: 'flex', gap: 7 }}>
                    <button onClick={() => handleDelete(m.id)} disabled={isPending} style={{
                      padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>Confirmar</button>
                    <button onClick={() => setDeleteId(null)} style={{
                      padding: '5px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                      background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#3d5068',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>Cancelar</button>
                  </div>
                </div>
              ) : (
                /* View card */
                <div style={{ display: 'flex', gap: 12, padding: '14px 14px', alignItems: 'flex-start' }}>
                  {m.imageData ? (
                    <img src={m.imageData} alt={m.name} style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 64, height: 64, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>📦</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#c8d6e5', marginBottom: 3 }}>{m.name}</p>
                    {m.manufacturer && (
                      <p style={{ fontSize: 11, color: '#8ba5c0', marginBottom: 4 }}>{m.manufacturer}</p>
                    )}
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#00d9b8',
                      background: 'rgba(0,217,184,0.08)', border: '1px solid rgba(0,217,184,0.2)',
                      borderRadius: 4, padding: '2px 6px',
                    }}>{catMap[m.categoryId] ?? '—'}</span>
                    <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
                      <SmallBtn label="Editar" color="#38bdf8" onClick={() => startEdit(m)} disabled={isPending} />
                      <SmallBtn label="Excluir" color="#f87171" onClick={() => { setDeleteId(m.id); setDeleteError(null) }} disabled={isPending} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function AssetsSettingsTab({
  assetCategories, locations, customFieldDefs, assetModels, departments, totalAssets, lockedKind,
}: Props) {
  const [isPending, startTransition] = useTransition()

  // Multiple open sections, persisted to localStorage
  const [openSections, setOpenSections] = useState<Set<string>>(() => new Set(['categorias']))

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY)
      if (stored) setOpenSections(new Set(JSON.parse(stored) as string[]))
    } catch {}
  }, [])

  function toggleSection(key: string) {
    setOpenSections(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      try { localStorage.setItem(LS_KEY, JSON.stringify([...next])) } catch {}
      return next
    })
  }

  function expandAll() {
    const all = new Set(['categorias', 'locais', 'campos', 'modelos'])
    setOpenSections(all)
    try { localStorage.setItem(LS_KEY, JSON.stringify([...all])) } catch {}
  }

  function collapseAll() {
    setOpenSections(new Set())
    try { localStorage.setItem(LS_KEY, JSON.stringify([])) } catch {}
  }

  // ── Asset Categories state ──────────────────────────────────────────────────
  const [aName, setAName] = useState('')
  const [aIcon, setAIcon] = useState('')
  const [aKind, setAKind] = useState<AssetCategoryKind>(lockedKind ?? 'EQUIPMENT')
  const [aError, setAError] = useState<string | null>(null)
  const [aSuccess, setASuccess] = useState(false)
  const [editCatId, setEditCatId] = useState<string | null>(null)
  const [editCatName, setEditCatName] = useState('')
  const [editCatIcon, setEditCatIcon] = useState('')
  const [editCatKind, setEditCatKind] = useState<AssetCategoryKind>('EQUIPMENT')
  const [editCatError, setEditCatError] = useState<string | null>(null)
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null)
  const [deleteCatError, setDeleteCatError] = useState<string | null>(null)

  function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault(); setAError(null); setASuccess(false)
    startTransition(async () => {
      const r = await createAssetCategory(aName, aIcon, aKind)
      if (r.ok) { setAName(''); setAIcon(''); setAKind(lockedKind ?? 'EQUIPMENT'); setASuccess(true); setTimeout(() => setASuccess(false), 3000) }
      else setAError(r.error ?? 'Erro')
    })
  }

  function handleUpdateCategory() {
    setEditCatError(null)
    startTransition(async () => {
      const r = await updateAssetCategory(editCatId!, editCatName, editCatIcon, editCatKind)
      if (r.ok) setEditCatId(null)
      else setEditCatError(r.error ?? 'Erro')
    })
  }

  function handleDeleteCategory() {
    setDeleteCatError(null)
    startTransition(async () => {
      const r = await deleteAssetCategory(deleteCatId!)
      if (r.ok) setDeleteCatId(null)
      else setDeleteCatError(r.error ?? 'Erro')
    })
  }

  // ── Locations state ─────────────────────────────────────────────────────────
  const [locName, setLocName] = useState('')
  const [locError, setLocError] = useState<string | null>(null)
  const [locSuccess, setLocSuccess] = useState(false)
  const [confirmDeleteLoc, setConfirmDeleteLoc] = useState<string | null>(null)
  const [editLocOld, setEditLocOld] = useState<string | null>(null)
  const [editLocValue, setEditLocValue] = useState('')
  const [editLocError, setEditLocError] = useState<string | null>(null)

  function handleCreateLocation(e: React.FormEvent) {
    e.preventDefault(); setLocError(null); setLocSuccess(false)
    startTransition(async () => {
      const r = await createAssetLocation(locName)
      if (r.ok) { setLocName(''); setLocSuccess(true); setTimeout(() => setLocSuccess(false), 3000) }
      else setLocError(r.error ?? 'Erro')
    })
  }

  function handleDeleteLocation(name: string) {
    startTransition(async () => {
      await deleteAssetLocation(name)
      setConfirmDeleteLoc(null)
    })
  }

  function startEditLoc(name: string) {
    setEditLocOld(name); setEditLocValue(name); setEditLocError(null)
    setConfirmDeleteLoc(null)
  }

  function handleRenameLocation(e: React.FormEvent) {
    e.preventDefault(); setEditLocError(null)
    if (!editLocOld) return
    startTransition(async () => {
      const r = await updateAssetLocation(editLocOld, editLocValue)
      if (r.ok) setEditLocOld(null)
      else setEditLocError(r.error ?? 'Erro')
    })
  }

  const deletingCat = assetCategories.find(c => c.id === deleteCatId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Toolbar: expand/collapse all */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 2 }}>
        <button onClick={expandAll} style={{
          padding: '4px 12px', borderRadius: 6, fontSize: 10, cursor: 'pointer',
          background: 'transparent', border: '1px solid rgba(255,255,255,0.07)',
          color: '#3d5068', fontFamily: "'JetBrains Mono', monospace",
        }}>Expandir tudo</button>
        <button onClick={collapseAll} style={{
          padding: '4px 12px', borderRadius: 6, fontSize: 10, cursor: 'pointer',
          background: 'transparent', border: '1px solid rgba(255,255,255,0.07)',
          color: '#3d5068', fontFamily: "'JetBrains Mono', monospace",
        }}>Recolher tudo</button>
      </div>

      {/* ── Categorias ──────────────────────────────────────────────────────── */}
      <SectionCard
        sectionKey="categorias"
        icon="🏷️" title="Categorias de Ativo" color="#00d9b8"
        description="Tipos de equipamentos cadastrados no patrimônio"
        count={assetCategories.length}
        open={openSections.has('categorias')}
        onToggle={() => toggleSection('categorias')}
      >
        {/* Create form */}
        <form onSubmit={handleCreateCategory} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 18, paddingBottom: 18, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ flex: '2 1 180px', display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700 }}>NOME *</label>
            <input value={aName} onChange={e => setAName(e.target.value)} placeholder="Ex: Impressora" style={iStyle} required />
          </div>
          <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700 }}>ÍCONE</label>
            <select value={aIcon} onChange={e => setAIcon(e.target.value)} style={iStyle}>
              <option value="">— nenhum —</option>
              {ICON_OPTIONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
            </select>
          </div>
          {!lockedKind && (
            <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700 }}>TIPO</label>
              <select value={aKind} onChange={e => setAKind(e.target.value as AssetCategoryKind)} style={iStyle}>
                {KIND_OPTIONS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
              </select>
            </div>
          )}
          <button type="submit" disabled={isPending || !aName.trim()} style={{
            padding: '9px 22px', borderRadius: 8, height: 38, flexShrink: 0,
            background: 'rgba(0,217,184,0.12)', border: '1px solid rgba(0,217,184,0.3)',
            color: '#00d9b8', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            fontFamily: "'JetBrains Mono', monospace", opacity: !aName.trim() ? 0.4 : 1,
          }}>+ Adicionar</button>
        </form>
        {aError && <p style={{ fontSize: 12, color: '#f87171', marginBottom: 10 }}>⚠ {aError}</p>}
        {aSuccess && <p style={{ fontSize: 12, color: '#34d399', marginBottom: 10 }}>✓ Categoria criada com sucesso</p>}

        {/* Delete confirm banner */}
        {deleteCatId && deletingCat && (
          <div style={{ background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 14 }}>
            <p style={{ fontSize: 13, color: '#f87171', fontWeight: 600, marginBottom: 4 }}>Excluir "{deletingCat.name}"?</p>
            <p style={{ fontSize: 12, color: '#8ba5c0', marginBottom: 8 }}>
              {deletingCat._count.assets > 0
                ? `⚠ Possui ${deletingCat._count.assets} ativo(s). Reassine-os antes de excluir.`
                : 'Esta ação é irreversível.'}
            </p>
            {deleteCatError && <p style={{ fontSize: 12, color: '#f87171', marginBottom: 8 }}>⚠ {deleteCatError}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleDeleteCategory} disabled={isPending || deletingCat._count.assets > 0} style={{
                padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171',
                opacity: deletingCat._count.assets > 0 ? 0.4 : 1, fontFamily: "'JetBrains Mono', monospace",
              }}>Confirmar exclusão</button>
              <button onClick={() => setDeleteCatId(null)} disabled={isPending} style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#3d5068',
                fontFamily: "'JetBrains Mono', monospace",
              }}>Cancelar</button>
            </div>
          </div>
        )}

        {/* Category list */}
        {assetCategories.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#2d4060' }}>
            Nenhuma categoria cadastrada
          </div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
            {assetCategories.map((c, i) => (
              editCatId === c.id ? (
                <div key={c.id} style={{
                  padding: '10px 16px',
                  background: 'rgba(0,217,184,0.03)', borderLeft: '2px solid rgba(0,217,184,0.3)',
                  borderBottom: i < assetCategories.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      value={editCatName}
                      onChange={e => setEditCatName(e.target.value)}
                      placeholder="Nome"
                      style={{ ...iStyle, flex: '1 1 140px' }}
                    />
                    <select
                      value={editCatIcon}
                      onChange={e => setEditCatIcon(e.target.value)}
                      style={{ ...iStyle, flex: '0 0 130px' }}
                    >
                      <option value="">— nenhum —</option>
                      {ICON_OPTIONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                    </select>
                    <select
                      value={editCatKind}
                      onChange={e => setEditCatKind(e.target.value as AssetCategoryKind)}
                      style={{ ...iStyle, flex: '0 0 130px' }}
                    >
                      {KIND_OPTIONS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
                    </select>
                    <button onClick={handleUpdateCategory} disabled={isPending || !editCatName.trim()} style={{
                      padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      background: 'rgba(0,217,184,0.12)', border: '1px solid rgba(0,217,184,0.3)',
                      color: '#00d9b8', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0,
                    }}>✓ Salvar</button>
                    <button onClick={() => setEditCatId(null)} disabled={isPending} style={{
                      padding: '6px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                      background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
                      color: '#3d5068', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0,
                    }}>✕</button>
                  </div>
                  {editCatError && <p style={{ fontSize: 11, color: '#f87171', marginTop: 6 }}>⚠ {editCatError}</p>}
                </div>
              ) : (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  borderBottom: i < assetCategories.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  opacity: c.active ? 1 : 0.5,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#c8d6e5' }}>{c.name}</p>
                      {c.icon && (
                        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                          <CategoryIcon name={c.icon} size={14} color="#4a6580" />
                        </span>
                      )}
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#38bdf8',
                        background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)',
                        borderRadius: 4, padding: '1px 6px',
                      }}>{c._count.assets} ativos</span>
                      {(() => {
                        const kc = KIND_OPTIONS.find(k => k.value === (c.kind ?? 'EQUIPMENT'))
                        return kc ? (
                          <span style={{
                            fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
                            color: kc.color, background: `${kc.color}12`,
                            border: `1px solid ${kc.color}30`,
                            borderRadius: 4, padding: '1px 6px',
                          }}>{kc.label}</span>
                        ) : null
                      })()}
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
                        color: c.active ? '#34d399' : '#f87171',
                        background: c.active ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
                        border: `1px solid ${c.active ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
                        borderRadius: 4, padding: '1px 6px',
                      }}>{c.active ? 'Ativa' : 'Inativa'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    <SmallBtn
                      label="Editar" color="#38bdf8"
                      onClick={() => { setEditCatId(c.id); setEditCatName(c.name); setEditCatIcon(c.icon ?? ''); setEditCatKind(c.kind ?? 'EQUIPMENT'); setEditCatError(null) }}
                      disabled={isPending}
                    />
                    <SmallBtn
                      label={c.active ? 'Desativar' : 'Ativar'}
                      color={c.active ? '#f87171' : '#34d399'}
                      onClick={() => startTransition(() => toggleAssetCategoryActive(c.id))}
                      disabled={isPending}
                    />
                    <SmallBtn
                      label="Excluir" color="#f87171"
                      onClick={() => { setDeleteCatId(c.id); setDeleteCatError(null) }}
                      disabled={isPending}
                    />
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </SectionCard>

      {/* ── Locais ──────────────────────────────────────────────────────────── */}
      <SectionCard
        sectionKey="locais"
        icon="📍" title="Locais" color="#38bdf8"
        description="Locais físicos onde os ativos são instalados (usado nos filtros)"
        count={locations.length + departments.length}
        open={openSections.has('locais')}
        onToggle={() => toggleSection('locais')}
      >
        {/* Explanatory note */}
        <div style={{
          padding: '10px 14px', borderRadius: 8, marginBottom: 16,
          background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.12)',
        }}>
          <p style={{ fontSize: 11, color: '#5a8db0', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.5 }}>
            ℹ Ativos atribuídos a usuários de um departamento herdam automaticamente o departamento como local.
            Os locais dos departamentos aparecem como opção de filtro mas não precisam de cadastro manual.
          </p>
        </div>

        {/* Auto-linked department locations */}
        {departments.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#2d4060', letterSpacing: '0.1em', marginBottom: 8 }}>
              LOCAIS DE DEPARTAMENTO (automáticos)
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {departments.map(d => (
                <span key={d.id} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 7,
                  background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.12)',
                  fontSize: 11, color: '#4a7d9a',
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  🏢 {d.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Custom locations */}
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#2d4060', letterSpacing: '0.1em', marginBottom: 10 }}>
          LOCAIS PERSONALIZADOS
        </p>
        <form onSubmit={handleCreateLocation} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700 }}>NOME DO LOCAL *</label>
            <input
              value={locName}
              onChange={e => setLocName(e.target.value)}
              placeholder="Ex: Sala do Servidor, Andar 2..."
              style={iStyle}
              required
            />
          </div>
          <button type="submit" disabled={isPending || !locName.trim()} style={{
            padding: '9px 22px', borderRadius: 8, height: 38, flexShrink: 0,
            background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)',
            color: '#38bdf8', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            fontFamily: "'JetBrains Mono', monospace", opacity: !locName.trim() ? 0.4 : 1,
          }}>+ Adicionar</button>
        </form>
        {locError && <p style={{ fontSize: 12, color: '#f87171', marginBottom: 10 }}>⚠ {locError}</p>}
        {locSuccess && <p style={{ fontSize: 12, color: '#34d399', marginBottom: 10 }}>✓ Local adicionado</p>}

        {locations.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#2d4060' }}>
            Nenhum local personalizado cadastrado
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {locations.map(loc => (
              <div key={loc}>
                {editLocOld === loc ? (
                  /* ── Modo edição inline ── */
                  <form onSubmit={handleRenameLocation} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      value={editLocValue}
                      onChange={e => setEditLocValue(e.target.value)}
                      autoFocus
                      required
                      style={{ ...iStyle, flex: 1, padding: '5px 10px' }}
                    />
                    <button type="submit" disabled={isPending || !editLocValue.trim()} style={{
                      padding: '5px 14px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)',
                      color: '#38bdf8', fontFamily: "'JetBrains Mono', monospace",
                    }}>✓ Salvar</button>
                    <button type="button" onClick={() => setEditLocOld(null)} style={{
                      padding: '5px 10px', borderRadius: 7, fontSize: 11, cursor: 'pointer',
                      background: 'none', border: '1px solid rgba(255,255,255,0.08)', color: '#3d5068',
                    }}>✕</button>
                    {editLocError && <span style={{ fontSize: 11, color: '#f87171' }}>{editLocError}</span>}
                  </form>
                ) : (
                  /* ── Modo normal ── */
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px 5px 12px', borderRadius: 8,
                    background: confirmDeleteLoc === loc ? 'rgba(248,113,113,0.08)' : 'rgba(56,189,248,0.06)',
                    border: `1px solid ${confirmDeleteLoc === loc ? 'rgba(248,113,113,0.3)' : 'rgba(56,189,248,0.2)'}`,
                    transition: 'all 0.15s',
                  }}>
                    <span style={{ fontSize: 12, color: confirmDeleteLoc === loc ? '#f87171' : '#38bdf8', flex: 1 }}>
                      📍 {loc}
                    </span>
                    {confirmDeleteLoc === loc ? (
                      <>
                        <button onClick={() => handleDeleteLocation(loc)} disabled={isPending}
                          style={{ fontSize: 10, cursor: 'pointer', background: 'none', border: 'none', color: '#f87171', padding: '0 4px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
                          ✓ Excluir
                        </button>
                        <button onClick={() => setConfirmDeleteLoc(null)}
                          style={{ fontSize: 10, cursor: 'pointer', background: 'none', border: 'none', color: '#3d5068', padding: '0 2px' }}>
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Editar */}
                        <button onClick={() => startEditLoc(loc)} disabled={isPending} title="Renomear"
                          style={{
                            width: 22, height: 22, borderRadius: 5, cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontSize: 10,
                            background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.18)',
                            color: '#38bdf8',
                          }}>✎</button>
                        {/* Excluir */}
                        <button onClick={() => setConfirmDeleteLoc(loc)} disabled={isPending} title="Excluir"
                          style={{
                            width: 22, height: 22, borderRadius: 5, cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontSize: 10,
                            background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.18)',
                            color: '#f87171',
                          }}>✕</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ── Campos Personalizados ────────────────────────────────────────────── */}
      <SectionCard
        sectionKey="campos"
        icon="⚙️" title="Campos Personalizados" color="#a78bfa"
        description="Campos adicionais por categoria, exibidos no formulário de cadastro de ativo"
        count={customFieldDefs.length}
        open={openSections.has('campos')}
        onToggle={() => toggleSection('campos')}
      >
        <CustomFieldsSection
          assetCategories={assetCategories}
          customFieldDefs={customFieldDefs}
        />
      </SectionCard>

      {/* ── Modelos ──────────────────────────────────────────────────────────── */}
      <SectionCard
        sectionKey="modelos"
        icon="📦" title="Modelos de Equipamento" color="#fbbf24"
        description="Modelos predefinidos com imagem e fabricante para facilitar o cadastro de ativos"
        count={assetModels.length}
        open={openSections.has('modelos')}
        onToggle={() => toggleSection('modelos')}
      >
        <ModelsSection
          assetCategories={assetCategories}
          assetModels={assetModels}
        />
      </SectionCard>

    </div>
  )
}
