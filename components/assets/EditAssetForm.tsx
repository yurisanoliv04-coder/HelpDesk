'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { updateAssetFull, checkTagUniqueForEdit, type UpdateAssetInput } from '@/app/(app)/assets/[id]/actions'
import { UserSearchSelect } from './UserSearchSelect'
import { PartSearchSelect } from './PartSearchSelect'
import { SearchSelect } from './SearchSelect'

// ── Tipos ──────────────────────────────────────────────────────────────────────
interface CustomFieldDef {
  id: string
  label: string
  fieldType: string
  options: string[]
  sortOrder: number
  required: boolean
  isUnique: boolean
}

interface Category {
  id: string
  name: string
  icon: string | null
  isComputer: boolean
  customFields: CustomFieldDef[]
}

interface UserOption { id: string; name: string }
export interface HwPart { id: string; brand: string; model: string; scorePoints: number; notes: string | null }

interface InitialValues {
  tag: string; name: string; categoryId: string; status: string
  location: string; serialNumber: string; assignedToUserId: string; notes: string
  // Catálogo
  cpuPartId: string; ramPartId: string; storagePartId: string
  // Legado (descrição)
  ramGb: string; storageType: string; storageGb: string
  cpuBrand: string; cpuModel: string; cpuGeneration: string
  // Financeiro
  acquisitionCost: string; currentValue: string; acquisitionDate: string; warrantyUntil: string
  // Campos personalizados
  initialCustomValues: Record<string, string>
}

interface Props {
  assetId: string
  categories: Category[]
  users: UserOption[]
  initialValues: InitialValues
  locationOptions: string[]
  hwCpuParts: HwPart[]
  hwRamParts: HwPart[]
  hwStorageParts: HwPart[]
}

// ── Shared styles ──────────────────────────────────────────────────────────────
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

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#3d5068', letterSpacing: '0.1em' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>{children}</div>
}

// ── Options ────────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: 'STOCK', label: 'Estoque' },
  { value: 'DEPLOYED', label: 'Implantado' },
  { value: 'MAINTENANCE', label: 'Manutenção' },
  { value: 'LOANED', label: 'Emprestado' },
  { value: 'DISCARDED', label: 'Descartado' },
]
// Auto-deriva capacidade (GB) do model da peça (ex: "512 GB" → 512, "1 TB" → 1000)
function parseStorageGbFromModel(model: string): number | undefined {
  const tb = model.match(/(\d+(?:\.\d+)?)\s*TB/i)
  if (tb) return Math.round(parseFloat(tb[1]) * 1000)
  const gb = model.match(/(\d+)\s*GB/i)
  if (gb) return parseInt(gb[1])
  return undefined
}

// Auto-deriva o tipo de armazenamento da brand da peça (ex: "SSD SATA" → "SSD_SATA")
function brandToStorageType(brand: string): 'HDD' | 'SSD_SATA' | 'SSD_NVME' | undefined {
  if (brand === 'HDD') return 'HDD'
  if (brand === 'SSD SATA') return 'SSD_SATA'
  if (brand === 'SSD NVMe') return 'SSD_NVME'
  return undefined
}

// ── Ajuste de geração (espelho client-side do lib/scoring/computer.ts) ────────
function cpuGenAdj(gen: string): { pts: number; label: string } {
  const g = parseInt(gen) || 0
  if (g <= 0)  return { pts: 0,  label: '' }
  if (g >= 13) return { pts: +4, label: `+4 pts (${g}ª geração — recente)` }
  if (g >= 10) return { pts: +2, label: `+2 pts (${g}ª geração — moderna)` }
  if (g >= 6)  return { pts:  0, label: `0 pts (${g}ª geração — neutra)` }
  if (g >= 4)  return { pts: -4, label: `-4 pts (${g}ª geração — envelhecendo)` }
  return         { pts: -8, label: `-8 pts (${g}ª geração — obsoleto)` }
}

// ── Score Card (catálogo) ──────────────────────────────────────────────────────
function ScoreCard({ cpuPart, ramPart, storagePart, cpuGeneration }: {
  cpuPart?: HwPart | null
  ramPart?: HwPart | null
  storagePart?: HwPart | null
  cpuGeneration: string
}) {
  const genAdj      = cpuPart ? cpuGenAdj(cpuGeneration) : { pts: 0, label: '' }
  const cpuPts      = cpuPart ? Math.min(Math.max(0, (cpuPart.scorePoints) + genAdj.pts), 30) : 0
  const ramPts      = ramPart?.scorePoints     ?? 0
  const storagePts  = storagePart?.scorePoints ?? 0
  const hasData = !!(cpuPart || ramPart || storagePart)
  const total = Math.min(cpuPts + ramPts + storagePts, 100)
  const label = total >= 65 ? 'BOM' : total >= 38 ? 'INTERMEDIÁRIO' : 'RUIM'
  const labelColor = label === 'BOM' ? '#10b981' : label === 'INTERMEDIÁRIO' ? '#fbbf24' : '#f87171'

  const notes = [
    cpuPart?.notes,
    genAdj.label || undefined,
    ramPart?.notes,
    storagePart?.notes,
  ].filter(Boolean) as string[]

  function Bar({ pts, max }: { pts: number; max: number }) {
    const pct = max > 0 ? Math.round((pts / max) * 100) : 0
    const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#fbbf24' : pct > 0 ? '#f87171' : '#1e3048'
    return (
      <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width 0.25s ease', borderRadius: 2 }} />
      </div>
    )
  }

  return (
    <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>🎯</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#3d5068', letterSpacing: '0.1em' }}>PONTUAÇÃO DE PERFORMANCE</span>
        </div>
        {hasData && (
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: labelColor, background: `${labelColor}18`, border: `1px solid ${labelColor}40`, padding: '2px 8px', borderRadius: 5, letterSpacing: '0.06em' }}>
            {label}
          </span>
        )}
      </div>

      {!hasData ? (
        <p style={{ fontSize: 11, color: '#2d4060', textAlign: 'center', padding: '16px 0', fontFamily: "'JetBrains Mono', monospace" }}>
          Selecione as peças de hardware<br />para ver a pontuação em tempo real
        </p>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {[
              { icon: '💾', label: 'RAM', pts: ramPts, max: 40 },
              { icon: '💿', label: 'DISCO', pts: storagePts, max: 30 },
              { icon: '⚙️', label: 'CPU', pts: cpuPts, max: 30 },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3d5068', width: 68 }}>{row.icon} {row.label}</span>
                <Bar pts={row.pts} max={row.max} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#7e9bb5', minWidth: 42, textAlign: 'right' }}>
                  {row.pts}<span style={{ color: '#2d4060', fontSize: 10 }}>/{row.max}</span>
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#c8d6e5', fontWeight: 700, width: 68 }}>🏆 TOTAL</span>
              <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${total}%`, background: labelColor, transition: 'width 0.25s ease', borderRadius: 3 }} />
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: labelColor, minWidth: 42, textAlign: 'right' }}>
                {total}<span style={{ fontSize: 10, color: '#2d4060', fontWeight: 400 }}>/100</span>
              </span>
            </div>
          </div>

          {notes.length > 0 && (
            <div style={{ marginTop: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', letterSpacing: '0.08em', marginBottom: 2 }}>OBSERVAÇÕES</p>
              {notes.map((note, i) => (
                <p key={i} style={{ fontSize: 10, color: '#3d5068', lineHeight: 1.5 }}>• {note}</p>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}


// ── Main form ──────────────────────────────────────────────────────────────────
export default function EditAssetForm({
  assetId, categories, users, initialValues, locationOptions,
  hwCpuParts, hwRamParts, hwStorageParts,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Campos personalizados
  const [customValues, setCustomValues] = useState<Record<string, string>>(initialValues.initialCustomValues)

  // Tag — validação de unicidade
  const [tagError,    setTagError]    = useState<string | null>(null)
  const [tagChecking, setTagChecking] = useState(false)
  const tagDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Identificação
  const [tag,              setTag]              = useState(initialValues.tag)
  const [name,             setName]             = useState(initialValues.name)
  const [categoryId,       setCategoryId]       = useState(initialValues.categoryId)
  const [status,           setStatus]           = useState(initialValues.status)
  const [location,         setLocation]         = useState(initialValues.location)
  const [serialNumber,     setSerialNumber]     = useState(initialValues.serialNumber)
  const [assignedToUserId, setAssignedToUserId] = useState(initialValues.assignedToUserId)
  const [notes,            setNotes]            = useState(initialValues.notes)

  // Hardware — catálogo
  const [cpuPartId,     setCpuPartId]     = useState(initialValues.cpuPartId)
  const [ramPartId,     setRamPartId]     = useState(initialValues.ramPartId)
  const [storagePartId, setStoragePartId] = useState(initialValues.storagePartId)

  // Hardware — legado (descrição)
  const [cpuGeneration, setCpuGeneration] = useState(initialValues.cpuGeneration)

  // Financeiro
  const [acquisitionCost, setAcquisitionCost] = useState(initialValues.acquisitionCost)
  const [currentValue,    setCurrentValue]    = useState(initialValues.currentValue)
  const [acquisitionDate, setAcquisitionDate] = useState(initialValues.acquisitionDate)
  const [warrantyUntil,   setWarrantyUntil]   = useState(initialValues.warrantyUntil)

  // Partes selecionadas (para score card em tempo real)
  const selectedCpu     = hwCpuParts.find(p => p.id === cpuPartId)     ?? null
  const selectedRam     = hwRamParts.find(p => p.id === ramPartId)     ?? null
  const selectedStorage = hwStorageParts.find(p => p.id === storagePartId) ?? null

  // Categoria selecionada + flags
  const selectedCategory     = categories.find(c => c.id === categoryId)
  const isComputer           = selectedCategory?.isComputer ?? false
  const categoryCustomFields = selectedCategory?.customFields ?? []

  // Validação de unicidade de tag (debounced, excluindo o próprio ativo)
  useEffect(() => {
    if (tagDebounce.current) clearTimeout(tagDebounce.current)
    if (!tag.trim()) { setTagError(null); setTagChecking(false); return }
    // Se não mudou em relação ao valor original, não precisa checar
    if (tag.trim().toUpperCase() === initialValues.tag.toUpperCase()) {
      setTagError(null); setTagChecking(false); return
    }
    setTagChecking(true)
    tagDebounce.current = setTimeout(async () => {
      const unique = await checkTagUniqueForEdit(tag.trim(), assetId)
      setTagChecking(false)
      setTagError(unique ? null : 'Tag já está em uso por outro ativo')
    }, 400)
    return () => { if (tagDebounce.current) clearTimeout(tagDebounce.current) }
  }, [tag])

  function handleCategoryChange(newCatId: string) {
    setCategoryId(newCatId)
    setCustomValues({})
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Deriva campos legados da peça selecionada para manter histórico
    const cpuPart     = selectedCpu
    const ramPart     = selectedRam
    const storagePart = selectedStorage

    const input: UpdateAssetInput = {
      tag: tag.trim(), name: name.trim(), categoryId,
      status: status as UpdateAssetInput['status'],
      location: location || undefined,
      serialNumber: serialNumber || undefined,
      assignedToUserId: assignedToUserId || undefined,
      notes: notes || undefined,
      // Catálogo
      cpuPartId: cpuPartId || undefined,
      ramPartId: ramPartId || undefined,
      storagePartId: storagePartId || undefined,
      // Legado derivado automaticamente das peças selecionadas
      cpuModel: cpuPart ? `${cpuPart.brand} ${cpuPart.model}` : undefined,
      cpuBrand: cpuPart ? (cpuPart.brand.toUpperCase().includes('INTEL') ? 'INTEL' : cpuPart.brand.toUpperCase().includes('AMD') ? 'AMD' : 'OTHER') as UpdateAssetInput['cpuBrand'] : undefined,
      cpuGeneration: cpuGeneration ? parseInt(cpuGeneration) : undefined,
      storageGb: storagePart ? parseStorageGbFromModel(storagePart.model) : undefined,
      storageType: storagePart ? brandToStorageType(storagePart.brand) : undefined,
      // Financeiro
      acquisitionCost: acquisitionCost ? parseFloat(acquisitionCost.replace(',', '.')) : undefined,
      currentValue:    currentValue    ? parseFloat(currentValue.replace(',', '.'))    : undefined,
      acquisitionDate: acquisitionDate || undefined,
      warrantyUntil:   warrantyUntil   || undefined,
      // Campos personalizados
      customFieldValues: customValues,
    }

    startTransition(async () => {
      const result = await updateAssetFull(assetId, input)
      if (result.ok) router.push(`/assets/${assetId}`)
      else setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {error && (
        <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <p style={{ fontSize: 13, color: '#f87171' }}>{error}</p>
        </div>
      )}

      {/* ── 2-column layout ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

        {/* LEFT: Identificação + Financeiro */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          <Section title="IDENTIFICAÇÃO" icon="🏷️">
            <Grid2>
              <Field label="Tag / Patrimônio" required hint={tagChecking ? 'Verificando disponibilidade...' : tagError ?? 'Identificador único no inventário'}>
                <input
                  style={{ ...inp, borderColor: tagError ? 'rgba(248,113,113,0.5)' : undefined, boxShadow: tagError ? '0 0 0 2px rgba(248,113,113,0.08)' : undefined }}
                  value={tag}
                  onChange={e => setTag(e.target.value.toUpperCase())}
                  placeholder="PAT-0001"
                  maxLength={20}
                  required
                />
              </Field>
              <Field label="Categoria" required>
                <SearchSelect
                  options={categories.map(c => ({ value: c.id, label: c.name, icon: c.icon ?? undefined }))}
                  value={categoryId}
                  onChange={handleCategoryChange}
                  placeholder="— selecione —"
                  required
                />
              </Field>
            </Grid2>

            <Field label="Nome do ativo" required>
              <input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Dell Latitude 5520 — João Silva" maxLength={120} required />
            </Field>

            <Grid2>
              <Field label="Situação">
                <SearchSelect
                  options={STATUS_OPTIONS}
                  value={status}
                  onChange={setStatus}
                  placeholder="— selecione —"
                />
              </Field>
              <Field label="Nº de Série">
                <input style={inp} value={serialNumber} onChange={e => setSerialNumber(e.target.value)} placeholder="Ex: SN-XXXX-0000" />
              </Field>
            </Grid2>

            <Grid2>
              <Field label="Localização">
                <SearchSelect
                  options={[
                    ...locationOptions.map(loc => ({ value: loc, label: loc })),
                  ]}
                  value={location}
                  onChange={setLocation}
                  placeholder="— não informado —"
                  clearable
                />
              </Field>
              <Field label="Atribuído a">
                <UserSearchSelect users={users} value={assignedToUserId} onChange={setAssignedToUserId} />
              </Field>
            </Grid2>

            <Field label="Observações">
              <textarea style={{ ...inp, resize: 'vertical', minHeight: 72, lineHeight: 1.5 }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Informações adicionais sobre este ativo..." />
            </Field>
          </Section>

          {categoryCustomFields.length > 0 && (
            <Section title="CAMPOS PERSONALIZADOS" icon="🔧">
              {categoryCustomFields.map(field => (
                <Field key={field.id} label={field.label} required={field.required} hint={field.isUnique ? 'Valor deve ser único entre todos os ativos' : undefined}>
                  {field.fieldType === 'checkbox_group' ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', padding: '4px 0' }}>
                      {field.options.map(opt => {
                        const selected = (customValues[field.id] ?? '').split(',').filter(Boolean)
                        const checked = selected.includes(opt)
                        return (
                          <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
                            <div
                              onClick={() => {
                                const next = checked ? selected.filter(x => x !== opt) : [...selected, opt]
                                setCustomValues(prev => ({ ...prev, [field.id]: next.join(',') }))
                              }}
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
                            <span style={{ fontSize: 12, color: checked ? '#c8d6e5' : '#7e9bb5' }}>{opt}</span>
                          </label>
                        )
                      })}
                    </div>
                  ) : (
                    <input
                      style={inp}
                      type="text"
                      value={customValues[field.id] ?? ''}
                      onChange={e => setCustomValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                      required={field.required}
                    />
                  )}
                </Field>
              ))}
            </Section>
          )}
        </div>

        {/* RIGHT: Hardware + Score + Financeiro */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {isComputer && (
            <Section title="HARDWARE" icon="💻">
              <Field label="Processador (CPU)" hint="Selecione a peça mais próxima das características do equipamento">
                <PartSearchSelect
                  parts={hwCpuParts}
                  value={cpuPartId}
                  onChange={setCpuPartId}
                  placeholder="— selecione o processador —"
                />
              </Field>

              <Grid2>
                <Field label="Geração do processador" hint="Apenas o número (ex: 11 para 11ª geração)">
                  <input style={inp} type="number" min="1" max="25" value={cpuGeneration} onChange={e => setCpuGeneration(e.target.value)} placeholder="Ex: 11" />
                </Field>
                <Field label="Memória RAM">
                  <PartSearchSelect
                    parts={hwRamParts}
                    value={ramPartId}
                    onChange={setRamPartId}
                    placeholder="— selecione a RAM —"
                  />
                </Field>
              </Grid2>

              <Field label="Armazenamento">
                <PartSearchSelect
                  parts={hwStorageParts}
                  value={storagePartId}
                  onChange={setStoragePartId}
                  placeholder="— selecione o armazenamento —"
                />
              </Field>
            </Section>
          )}

          {isComputer && (
            <ScoreCard cpuPart={selectedCpu} ramPart={selectedRam} storagePart={selectedStorage} cpuGeneration={cpuGeneration} />
          )}

          <Section title="FINANCEIRO" icon="💰">
            <Grid2>
              <Field label="Custo de aquisição (R$)">
                <input style={inp} type="text" inputMode="decimal" value={acquisitionCost} onChange={e => setAcquisitionCost(e.target.value)} placeholder="Ex: 3500,00" />
              </Field>
              <Field label="Valor atual (R$)">
                <input style={inp} type="text" inputMode="decimal" value={currentValue} onChange={e => setCurrentValue(e.target.value)} placeholder="Ex: 2100,00" />
              </Field>
            </Grid2>
            <Grid2>
              <Field label="Data de aquisição">
                <input style={inp} type="date" value={acquisitionDate} onChange={e => setAcquisitionDate(e.target.value)} />
              </Field>
              <Field label="Garantia até">
                <input style={inp} type="date" value={warrantyUntil} onChange={e => setWarrantyUntil(e.target.value)} />
              </Field>
            </Grid2>
          </Section>
        </div>
      </div>

      {/* ── Actions ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
        <button type="button" onClick={() => router.push(`/assets/${assetId}`)} disabled={isPending} style={{ padding: '10px 22px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#3d5068', fontSize: 13, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace" }}>
          Cancelar
        </button>
        <button type="submit" disabled={isPending || !name.trim() || !tag.trim() || !categoryId || !!tagError || tagChecking} style={{ padding: '10px 28px', borderRadius: 8, background: isPending ? 'rgba(0,217,184,0.07)' : 'rgba(0,217,184,0.12)', border: '1px solid rgba(0,217,184,0.3)', color: '#00d9b8', fontSize: 13, fontWeight: 700, cursor: (isPending || !!tagError || tagChecking) ? 'not-allowed' : 'pointer', fontFamily: "'JetBrains Mono', monospace", display: 'flex', alignItems: 'center', gap: 8, opacity: (!name.trim() || !tag.trim() || !categoryId || !!tagError || tagChecking) ? 0.5 : 1, transition: 'all 0.1s' }}>
          {isPending ? (
            <><div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #00d9b8', borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite' }} />Salvando...</>
          ) : (
            <><svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Salvar alterações</>
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.4); cursor: pointer; }
        input::placeholder, textarea::placeholder { color: #2d4060; }
        input:focus, textarea:focus {
          border-color: rgba(0,217,184,0.35) !important;
          box-shadow: 0 0 0 2px rgba(0,217,184,0.08);
        }
      `}</style>
    </form>
  )
}
