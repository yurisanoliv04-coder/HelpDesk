'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createConsumível } from '@/app/(app)/consumiveis/novo/actions'
import { getPurchaseSuggestion } from '@/app/(app)/assets/new/actions'
import { UserSearchSelect } from './UserSearchSelect'
import type { AssetCategoryKind } from '@prisma/client'

// ── tipos ─────────────────────────────────────────────────────────────────────
type Kind = 'ACCESSORY' | 'DISPOSABLE'

interface ItemRow { id: string; categoryId: string; quantity: number }

interface CustomFieldDef {
  id: string; label: string; fieldType: string
  options: string[]; sortOrder: number; required: boolean
}
interface Category {
  id: string; name: string; icon: string | null
  kind: AssetCategoryKind; customFields: CustomFieldDef[]
}
interface UserOption { id: string; name: string }
interface Props {
  categories: Category[]
  users: UserOption[]
  locationOptions: string[]
}

// ── helpers ───────────────────────────────────────────────────────────────────
function genId() { return Math.random().toString(36).slice(2, 10) }
function blankRow(): ItemRow { return { id: genId(), categoryId: '', quantity: 1 } }

// ── paleta dos tipos ──────────────────────────────────────────────────────────
const KIND_META: Record<Kind, { label: string; desc: string; icon: string; color: string; glow: string; border: string; bg: string }> = {
  ACCESSORY:  { label: 'Acessório',  desc: 'Mouse, teclado, headset…', icon: '🖱',  color: '#a78bfa', glow: '167,139,250', border: 'rgba(167,139,250,0.35)', bg: 'rgba(167,139,250,0.08)' },
  DISPOSABLE: { label: 'Consumível', desc: 'Cartucho, papel, toner…', icon: '📦', color: '#fb923c', glow: '251,146,60',  border: 'rgba(251,146,60,0.35)',  bg: 'rgba(251,146,60,0.08)'  },
}

const STATUS_OPTIONS = [
  { value: 'STOCK',       label: 'Estoque',    icon: '🗄️' },
  { value: 'DEPLOYED',    label: 'Implantado', icon: '✅' },
  { value: 'MAINTENANCE', label: 'Manutenção', icon: '🔧' },
  { value: 'LOANED',      label: 'Emprestado', icon: '📤' },
]

// ── estilos compartilhados ────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#c8d6e5',
  width: '100%', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
}

function Field({ label, required, children, hint }: {
  label: string; required?: boolean; children: React.ReactNode; hint?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#3d5068', letterSpacing: '0.08em' }}>
        {label.toUpperCase()}{required && <span style={{ color: '#f87171', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize: 10, color: '#2d4060', lineHeight: 1.4 }}>{hint}</p>}
    </div>
  )
}

function Card({ title, icon, accent, children }: {
  title: string; icon: string; accent?: string; children: React.ReactNode
}) {
  return (
    <div style={{
      background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, overflow: 'hidden',
    }}>
      {accent && <div style={{ height: 2, background: accent }} />}
      <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 14 }}>{icon}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#3d5068', letterSpacing: '0.1em' }}>
            {title}
          </span>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── componente principal ──────────────────────────────────────────────────────
export default function NovoConsumívelForm({ categories, users, locationOptions }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // tipo
  const [kind, setKind]       = useState<Kind | null>(null)
  const [kindOpen, setKindOpen] = useState(true)

  // lista de itens (categoria + quantidade)
  const [items, setItems] = useState<ItemRow[]>([blankRow()])

  // campos comuns
  const [status, setStatus]         = useState('STOCK')
  const [location, setLocation]     = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [notes, setNotes]           = useState('')
  const [acqCost, setAcqCost]       = useState('')
  const [acqDate, setAcqDate]       = useState('')
  const [warranty, setWarranty]     = useState('')
  const [customValues, setCustomValues] = useState<Record<string, string>>({})
  const [error, setError]           = useState<string | null>(null)
  // modo de cadastro em lote
  const [regMode, setRegMode]       = useState<'individual' | 'coletivo'>('individual')

  // sugestão de compra (só para item único)
  const [purchaseSuggestion, setPurchaseSuggestion] = useState<{
    acquisitionCost: string; acquisitionDate: string | null
  } | null>(null)
  const [suggestionDismissed, setSuggestionDismissed] = useState(false)

  // ── derivados ──────────────────────────────────────────────────────────────
  const filteredCats  = kind ? categories.filter(c => c.kind === kind) : []
  const km            = kind ? KIND_META[kind] : null
  const isSingle      = items.length === 1
  const selectedCat   = isSingle && items[0].categoryId
    ? filteredCats.find(c => c.id === items[0].categoryId) ?? null
    : null
  const validItems    = items.filter(i => i.categoryId && i.quantity > 0)
  const totalUnits    = validItems.reduce((s, i) => s + i.quantity, 0)
  const hasBulk       = validItems.some(i => i.quantity > 1)
  const canSubmit     = !!kind && validItems.length > 0

  // ── gerenciar linhas ───────────────────────────────────────────────────────
  function addItem() {
    setItems(prev => [...prev, blankRow()])
  }
  function removeItem(id: string) {
    setItems(prev => prev.length > 1 ? prev.filter(i => i.id !== id) : prev)
  }
  function updateItem(id: string, patch: Partial<Omit<ItemRow, 'id'>>) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i))
  }

  // ── tipo ───────────────────────────────────────────────────────────────────
  function handleKindSelect(k: Kind) {
    setKind(k)
    setKindOpen(false)
    setItems([blankRow()])
    setCustomValues({})
    setPurchaseSuggestion(null)
    setSuggestionDismissed(false)
  }

  // ── categoria (por linha) ──────────────────────────────────────────────────
  async function handleCatChange(itemId: string, catId: string) {
    updateItem(itemId, { categoryId: catId })
    setCustomValues({})
    setSuggestionDismissed(false)
    setPurchaseSuggestion(null)

    // sugestão de compra apenas para item único
    if (!catId || !isSingle) return
    const suggestion = await getPurchaseSuggestion(catId)
    if (!suggestion) return
    setPurchaseSuggestion(suggestion)
    setAcqCost(prev => prev || suggestion.acquisitionCost)
    setAcqDate(prev => prev || (suggestion.acquisitionDate ?? ''))
  }

  function handleCustom(fieldId: string, value: string) {
    setCustomValues(prev => ({ ...prev, [fieldId]: value }))
  }

  // ── submit ─────────────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!kind)              return setError('Selecione o tipo do item.')
    if (validItems.length === 0) return setError('Selecione ao menos uma categoria.')

    startTransition(async () => {
      let lastId: string | null = null
      let count = 0

      if (regMode === 'coletivo') {
        // Modo coletivo: 1 registro por tipo de item, com campo quantity
        for (const item of validItems) {
          const r = await createConsumível({
            categoryId: item.categoryId,
            kind,
            status: status as 'STOCK',
            quantity: item.quantity,
            location: location || undefined,
            assignedToUserId: assignedTo || undefined,
            notes: notes || undefined,
            acquisitionCost: acqCost ? parseFloat(acqCost) : undefined,
            acquisitionDate: acqDate || undefined,
            warrantyUntil: warranty || undefined,
            customFieldValues: (isSingle && Object.keys(customValues).length) ? customValues : undefined,
          })
          if (!r.ok) { setError(r.error); return }
          lastId = r.id
          count++
        }
      } else {
        // Modo individual: 1 registro por unidade (comportamento original)
        for (const item of validItems) {
          for (let q = 0; q < item.quantity; q++) {
            const r = await createConsumível({
              categoryId: item.categoryId,
              kind,
              status: status as 'STOCK',
              location: location || undefined,
              assignedToUserId: assignedTo || undefined,
              notes: notes || undefined,
              acquisitionCost: acqCost ? parseFloat(acqCost) : undefined,
              acquisitionDate: acqDate || undefined,
              warrantyUntil: warranty || undefined,
              customFieldValues: (isSingle && Object.keys(customValues).length) ? customValues : undefined,
            })
            if (!r.ok) { setError(r.error); return }
            lastId = r.id
            count++
          }
        }
      }

      if (count === 1 && lastId) router.push(`/assets/${lastId}`)
      else router.push('/consumiveis')
    })
  }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

        {/* ══ COLUNA ESQUERDA ═══════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <Card title="IDENTIFICAÇÃO" icon="🏷" accent={km?.color}>

            {/* ── Tipo ── */}
            <div style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10, overflow: 'hidden',
            }}>
              <button
                type="button"
                onClick={() => setKindOpen(o => !o)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '11px 14px', background: 'transparent', border: 'none',
                  cursor: 'pointer', gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#3d5068', letterSpacing: '0.08em' }}>
                    TIPO DE ITEM *
                  </span>
                  {kind && km ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '2px 8px', borderRadius: 5,
                      background: km.bg, border: `1px solid ${km.border}`,
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: km.color,
                    }}>
                      {km.icon} {km.label}
                    </span>
                  ) : (
                    <span style={{ fontSize: 10, color: '#f87171', fontFamily: "'JetBrains Mono', monospace" }}>
                      — não selecionado
                    </span>
                  )}
                </div>
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#3d5068" strokeWidth={2.2}
                  style={{ transform: kindOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.18s', flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {kindOpen && (
                <div style={{ padding: '0 14px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {(Object.entries(KIND_META) as [Kind, typeof KIND_META[Kind]][]).map(([k, meta]) => {
                    const isSelected = kind === k
                    return (
                      <button
                        key={k} type="button" onClick={() => handleKindSelect(k)}
                        style={{
                          padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                          background: isSelected ? meta.bg : 'rgba(255,255,255,0.03)',
                          border: `1.5px solid ${isSelected ? meta.border : 'rgba(255,255,255,0.08)'}`,
                          boxShadow: isSelected ? `0 0 16px rgba(${meta.glow},0.12)` : 'none',
                          transition: 'all 0.14s', textAlign: 'left',
                          display: 'flex', flexDirection: 'column', gap: 6,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 32, height: 32, borderRadius: 8, fontSize: 16, flexShrink: 0,
                            background: isSelected ? `rgba(${meta.glow},0.15)` : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${isSelected ? meta.border : 'rgba(255,255,255,0.06)'}`,
                          }}>
                            {meta.icon}
                          </span>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: isSelected ? meta.color : '#8ba5c0', lineHeight: 1.2 }}>
                              {meta.label}
                            </p>
                            {isSelected && (
                              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: meta.color, opacity: 0.7, marginTop: 1, letterSpacing: '0.05em' }}>
                                SELECIONADO
                              </p>
                            )}
                          </div>
                        </div>
                        <p style={{ fontSize: 11, color: '#3d5068', lineHeight: 1.4 }}>{meta.desc}</p>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ── Itens (categoria + quantidade) ── */}
            <Field label="Itens" required>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

                {/* Cabeçalho das colunas */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 88px 28px', gap: 6 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', letterSpacing: '0.06em' }}>
                    CATEGORIA
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', letterSpacing: '0.06em', textAlign: 'center' }}>
                    QTD.
                  </span>
                  <span />
                </div>

                {/* Linhas de itens */}
                {items.map((item) => (
                  <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 88px 28px', gap: 6, alignItems: 'center' }}>
                    {/* Categoria */}
                    {!kind ? (
                      <div style={{ ...inp, color: '#2d4060', fontStyle: 'italic', cursor: 'not-allowed', fontSize: 12 }}>
                        Tipo primeiro…
                      </div>
                    ) : (
                      <select
                        value={item.categoryId}
                        onChange={e => handleCatChange(item.id, e.target.value)}
                        style={{ ...inp, cursor: 'pointer', fontSize: 12 }}
                      >
                        <option value="">Selecione…</option>
                        {filteredCats.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    )}

                    {/* Quantidade */}
                    <input
                      type="number" min="1" max="999"
                      value={item.quantity}
                      onChange={e => updateItem(item.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                      style={{ ...inp, textAlign: 'center', paddingLeft: 8, paddingRight: 8, fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}
                    />

                    {/* Remover */}
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      title="Remover linha"
                      style={{
                        width: 28, height: 34, borderRadius: 7, border: 'none',
                        background: items.length === 1 ? 'transparent' : 'rgba(248,113,113,0.08)',
                        color: items.length === 1 ? '#1e3048' : '#f87171',
                        cursor: items.length === 1 ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, lineHeight: 1, flexShrink: 0,
                        transition: 'background 0.12s, color 0.12s',
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}

                {/* Botão adicionar linha */}
                {kind && (
                  <button
                    type="button"
                    onClick={addItem}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                      background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)',
                      color: '#3d5068', fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                      transition: 'border-color 0.12s, color 0.12s',
                    }}
                  >
                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Adicionar outro tipo
                  </button>
                )}

                {/* Aviso sem categorias */}
                {kind && filteredCats.length === 0 && (
                  <p style={{ fontSize: 11, color: '#f87171' }}>
                    Nenhuma categoria de {km?.label.toLowerCase()} cadastrada.{' '}
                    <a href={`/settings/${kind === 'ACCESSORY' ? 'acessorios' : 'descartaveis'}`}
                      target="_blank" rel="noreferrer"
                      style={{ color: km?.color, textDecoration: 'none' }}>
                      Criar categoria →
                    </a>
                  </p>
                )}
              </div>
            </Field>

            {/* Preview do que será cadastrado */}
            {validItems.length > 0 && (
              <div style={{
                background: km ? km.bg : 'rgba(255,255,255,0.03)',
                border: `1px solid ${km ? km.border : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 8, padding: '10px 14px',
              }}>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: km?.color ?? '#3d5068', letterSpacing: '0.08em', marginBottom: 8 }}>
                  ITENS A CADASTRAR
                </p>
                {validItems.map((item) => {
                  const cat = filteredCats.find(c => c.id === item.categoryId)
                  if (!cat) return null
                  return (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: '#c8d6e5' }}>{cat.name}</span>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                        fontWeight: 700, color: km?.color ?? '#c8d6e5',
                        background: km ? `rgba(${km.glow},0.12)` : 'rgba(255,255,255,0.06)',
                        padding: '2px 8px', borderRadius: 5,
                      }}>
                        × {item.quantity}
                      </span>
                    </div>
                  )
                })}
                {totalUnits > 1 && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3d5068' }}>TOTAL</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#c8d6e5' }}>
                      {totalUnits} unidades
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ── Modo de registro (só aparece quando qty > 1) ── */}
            {hasBulk && (
              <div style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#3d5068', letterSpacing: '0.08em' }}>
                    MODO DE CADASTRO
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {/* Individual */}
                  <button
                    type="button"
                    onClick={() => setRegMode('individual')}
                    style={{
                      padding: '12px 14px', borderRadius: 9, cursor: 'pointer', textAlign: 'left',
                      background: regMode === 'individual' ? 'rgba(56,189,248,0.09)' : 'rgba(255,255,255,0.03)',
                      border: `1.5px solid ${regMode === 'individual' ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.07)'}`,
                      transition: 'all 0.14s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <span style={{ fontSize: 15 }}>🔢</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: regMode === 'individual' ? '#38bdf8' : '#7a9bbc' }}>
                        Individual
                      </span>
                      {regMode === 'individual' && (
                        <span style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#38bdf8', flexShrink: 0 }} />
                      )}
                    </div>
                    <p style={{ fontSize: 10, color: '#2d4060', lineHeight: 1.5, fontFamily: "'JetBrains Mono', monospace" }}>
                      {totalUnits} registros separados — cada unidade rastreável individualmente
                    </p>
                  </button>

                  {/* Coletivo */}
                  <button
                    type="button"
                    onClick={() => setRegMode('coletivo')}
                    style={{
                      padding: '12px 14px', borderRadius: 9, cursor: 'pointer', textAlign: 'left',
                      background: regMode === 'coletivo' ? 'rgba(251,191,36,0.09)' : 'rgba(255,255,255,0.03)',
                      border: `1.5px solid ${regMode === 'coletivo' ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.07)'}`,
                      transition: 'all 0.14s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <span style={{ fontSize: 15 }}>📦</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: regMode === 'coletivo' ? '#fbbf24' : '#7a9bbc' }}>
                        Coletivo
                      </span>
                      {regMode === 'coletivo' && (
                        <span style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#fbbf24', flexShrink: 0 }} />
                      )}
                    </div>
                    <p style={{ fontSize: 10, color: '#2d4060', lineHeight: 1.5, fontFamily: "'JetBrains Mono', monospace" }}>
                      {validItems.length} {validItems.length === 1 ? 'registro' : 'registros'} com quantidade — lote exibido como ×{totalUnits}
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Observações */}
            <Field label="Observações">
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Informações adicionais sobre o item…"
                rows={3}
                style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }}
              />
            </Field>
          </Card>

          {/* Campos personalizados — só para item único */}
          {selectedCat && selectedCat.customFields.length > 0 && (
            <Card title="CAMPOS PERSONALIZADOS" icon="📋" accent={km?.color}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
                {selectedCat.customFields.map(f => (
                  <Field key={f.id} label={f.label} required={f.required}>
                    {f.fieldType === 'SELECT' ? (
                      <select value={customValues[f.id] ?? ''} onChange={e => handleCustom(f.id, e.target.value)} style={{ ...inp, cursor: 'pointer' }} required={f.required}>
                        <option value="">Selecione…</option>
                        {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : f.fieldType === 'BOOLEAN' ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        {['true', 'false'].map(v => (
                          <button key={v} type="button" onClick={() => handleCustom(f.id, v)} style={{
                            flex: 1, padding: '8px', borderRadius: 7, cursor: 'pointer',
                            background: customValues[f.id] === v ? (v === 'true' ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.1)') : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${customValues[f.id] === v ? (v === 'true' ? '#34d399' : '#f87171') : 'rgba(255,255,255,0.08)'}`,
                            color: customValues[f.id] === v ? (v === 'true' ? '#34d399' : '#f87171') : '#3d5068',
                            fontSize: 12, fontWeight: 600,
                          }}>
                            {v === 'true' ? 'Sim' : 'Não'}
                          </button>
                        ))}
                      </div>
                    ) : f.fieldType === 'DATE' ? (
                      <input type="date" value={customValues[f.id] ?? ''} onChange={e => handleCustom(f.id, e.target.value)} style={inp} required={f.required} />
                    ) : f.fieldType === 'NUMBER' ? (
                      <input type="number" value={customValues[f.id] ?? ''} onChange={e => handleCustom(f.id, e.target.value)} style={inp} required={f.required} />
                    ) : (
                      <input type="text" value={customValues[f.id] ?? ''} onChange={e => handleCustom(f.id, e.target.value)} style={inp} required={f.required} />
                    )}
                  </Field>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* ══ COLUNA DIREITA ════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <Card title="SITUAÇÃO" icon="📍">
            <Field label="Status" required>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {STATUS_OPTIONS.map(opt => {
                  const active = status === opt.value
                  return (
                    <button key={opt.value} type="button" onClick={() => setStatus(opt.value)} style={{
                      padding: '9px 10px', borderRadius: 8, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 7,
                      background: active ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.03)',
                      border: `1.5px solid ${active ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.07)'}`,
                      transition: 'all 0.1s',
                    }}>
                      <span style={{ fontSize: 14 }}>{opt.icon}</span>
                      <span style={{ fontSize: 11, fontWeight: active ? 700 : 400, color: active ? '#a78bfa' : '#4a6580' }}>
                        {opt.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </Field>

            <Field label="Alocado para">
              <UserSearchSelect users={users} value={assignedTo} onChange={setAssignedTo} />
            </Field>

            <Field label="Local">
              <select value={location} onChange={e => setLocation(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                <option value="">— nenhum —</option>
                {locationOptions.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>
          </Card>

          <Card title="AQUISIÇÃO" icon="💰">
            {/* Sugestão de compra (item único) */}
            {purchaseSuggestion && !suggestionDismissed && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 10, padding: '8px 12px', borderRadius: 8, marginBottom: 8,
                background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.22)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={{ fontSize: 13, flexShrink: 0 }}>🛒</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#fbbf24', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Compra recente encontrada
                    <span style={{ color: '#a87a10', marginLeft: 6, fontWeight: 400 }}>
                      — R$ {purchaseSuggestion.acquisitionCost}
                      {purchaseSuggestion.acquisitionDate && ` · ${new Date(purchaseSuggestion.acquisitionDate + 'T12:00:00').toLocaleDateString('pt-BR')}`}
                    </span>
                  </span>
                </div>
                <button type="button" onClick={() => setSuggestionDismissed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b4c00', padding: '2px 4px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <Field label="Custo de aquisição">
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#3d5068' }}>R$</span>
                <input type="number" min="0" step="0.01" value={acqCost} onChange={e => setAcqCost(e.target.value)} placeholder="0,00" style={{ ...inp, paddingLeft: 32 }} />
              </div>
            </Field>
            <Field label="Data de aquisição">
              <input type="date" value={acqDate} onChange={e => setAcqDate(e.target.value)} style={inp} />
            </Field>
            <Field label="Garantia até">
              <input type="date" value={warranty} onChange={e => setWarranty(e.target.value)} style={inp} />
            </Field>
          </Card>

          {error && (
            <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', fontSize: 13, color: '#f87171' }}>
              ⚠ {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="submit"
              disabled={isPending || !canSubmit}
              style={{
                flex: 1, padding: '12px', borderRadius: 9, fontSize: 13, fontWeight: 700,
                cursor: isPending || !canSubmit ? 'not-allowed' : 'pointer',
                background: !canSubmit ? 'rgba(255,255,255,0.04)' : 'rgba(167,139,250,0.14)',
                border: `1.5px solid ${!canSubmit ? 'rgba(255,255,255,0.07)' : 'rgba(167,139,250,0.38)'}`,
                color: !canSubmit ? '#2d4060' : '#a78bfa',
                transition: 'all 0.12s',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {isPending
                ? `Salvando…`
                : !hasBulk || regMode === 'individual'
                  ? (totalUnits <= 1 ? '+ Cadastrar item' : `+ Cadastrar ${totalUnits} itens`)
                  : `+ Cadastrar lote (×${totalUnits})`}
            </button>
            <a href="/consumiveis" style={{
              padding: '12px 18px', borderRadius: 9, fontSize: 12, fontWeight: 600,
              background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
              color: '#3d5068', textDecoration: 'none', display: 'flex', alignItems: 'center',
              fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap',
            }}>
              Cancelar
            </a>
          </div>
        </div>

      </div>
    </form>
  )
}
