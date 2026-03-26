'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createAsset, checkTagUnique, type CreateAssetInput } from '@/app/(app)/assets/new/actions'
import { UserSearchSelect } from './UserSearchSelect'

// ── Tipos ─────────────────────────────────────────────────────────────────────
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
  kind: 'ACCESSORY' | 'DISPOSABLE'
  customFields: CustomFieldDef[]
}

interface UserOption { id: string; name: string }

interface Props {
  categories: Category[]
  users: UserOption[]
  initialTag: string
  locationOptions: string[]
}

// ── Styles ────────────────────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#c8d6e5',
  width: '100%', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
}

const inpFocus: React.CSSProperties = {
  ...inp, border: '1px solid rgba(167,139,250,0.4)',
}

function Field({ label, required, children, hint, span2 }: {
  label: string; required?: boolean; children: React.ReactNode; hint?: string; span2?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: span2 ? 'span 2' : undefined }}>
      <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#3d5068', letterSpacing: '0.08em' }}>
        {label.toUpperCase()}{required && <span style={{ color: '#f87171', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize: 10, color: '#2d4060', lineHeight: 1.4 }}>{hint}</p>}
    </div>
  )
}

function Section({ title, icon, accent, children }: { title: string; icon: string; accent?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#0d1422', border: `1px solid ${accent ? `${accent}20` : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 14, padding: '22px 24px',
      display: 'flex', flexDirection: 'column', gap: 18,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: accent ?? '#3d5068', letterSpacing: '0.1em' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

const STATUS_OPTIONS = [
  { value: 'STOCK',       label: '🗄 Estoque'    },
  { value: 'DEPLOYED',    label: '✅ Implantado' },
  { value: 'MAINTENANCE', label: '🔧 Manutenção' },
  { value: 'LOANED',      label: '🔄 Emprestado' },
]

const kindConfig = {
  ACCESSORY:  { label: 'Acessório',  color: '#a78bfa' },
  DISPOSABLE: { label: 'Consumível', color: '#fb923c' },
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function NewConsumibleForm({ categories, users, initialTag, locationOptions }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Selected kind filter
  const [kindFilter, setKindFilter] = useState<'ALL' | 'ACCESSORY' | 'DISPOSABLE'>('ALL')

  // Form state
  const [tag, setTag]                   = useState(initialTag)
  const [tagOk, setTagOk]               = useState<boolean | null>(null)
  const [tagChecking, setTagChecking]   = useState(false)
  const [name, setName]                 = useState('')
  const [categoryId, setCategoryId]     = useState('')
  const [status, setStatus]             = useState('STOCK')
  const [location, setLocation]         = useState('')
  const [locationCustom, setLocationCustom] = useState('')
  const [assignedUserId, setAssignedUserId] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [notes, setNotes]               = useState('')
  const [acquisitionCost, setAcquisitionCost] = useState('')
  const [acquisitionDate, setAcquisitionDate] = useState('')
  const [warrantyUntil, setWarrantyUntil]     = useState('')
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({})
  const [error, setError]               = useState<string | null>(null)

  const filteredCategories = kindFilter === 'ALL'
    ? categories
    : categories.filter(c => c.kind === kindFilter)

  const selectedCategory = categories.find(c => c.id === categoryId)

  // Reset category when kind filter changes
  useEffect(() => {
    if (categoryId && selectedCategory && kindFilter !== 'ALL') {
      if (selectedCategory.kind !== kindFilter) setCategoryId('')
    }
  }, [kindFilter])

  // Auto-select category if only one matches filter
  useEffect(() => {
    if (filteredCategories.length === 1 && !categoryId) {
      setCategoryId(filteredCategories[0].id)
    }
  }, [kindFilter])

  // Tag uniqueness check (debounced)
  useEffect(() => {
    if (!tag.trim()) { setTagOk(null); return }
    setTagChecking(true)
    const t = setTimeout(async () => {
      const ok = await checkTagUnique(tag.trim())
      setTagOk(ok)
      setTagChecking(false)
    }, 400)
    return () => clearTimeout(t)
  }, [tag])

  const effectiveLocation = location === '__custom__' ? locationCustom : location

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim())    return setError('Nome é obrigatório.')
    if (!categoryId)     return setError('Selecione uma categoria.')
    if (tagOk === false) return setError('Esta tag já está em uso.')

    const input: CreateAssetInput = {
      tag: tag.trim(),
      name: name.trim(),
      categoryId,
      status: status as CreateAssetInput['status'],
      location: effectiveLocation || undefined,
      serialNumber: serialNumber.trim() || undefined,
      assignedToUserId: assignedUserId || undefined,
      notes: notes.trim() || undefined,
      acquisitionCost: acquisitionCost ? parseFloat(acquisitionCost) : undefined,
      acquisitionDate: acquisitionDate || undefined,
      warrantyUntil: warrantyUntil || undefined,
      customFieldValues: Object.keys(customFieldValues).length ? customFieldValues : undefined,
    }

    startTransition(async () => {
      const res = await createAsset(input)
      if (res.ok) {
        router.push(`/consumiveis`)
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Kind selector ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8 }}>
        {(['ALL', 'ACCESSORY', 'DISPOSABLE'] as const).map(k => {
          const isActive = kindFilter === k
          const kc = k !== 'ALL' ? kindConfig[k] : null
          return (
            <button
              key={k}
              type="button"
              onClick={() => setKindFilter(k)}
              style={{
                padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                background: isActive ? (kc ? `${kc.color}15` : 'rgba(255,255,255,0.06)') : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isActive ? (kc ? `${kc.color}40` : 'rgba(255,255,255,0.2)') : 'rgba(255,255,255,0.07)'}`,
                color: isActive ? (kc ? kc.color : '#c8d6e5') : '#3d5068',
                fontFamily: "'JetBrains Mono', monospace",
                transition: 'all 0.1s',
              }}
            >
              {k === 'ALL' ? 'Todos os tipos' : kindConfig[k].label}
            </button>
          )
        })}
      </div>

      {/* ── Identificação ─────────────────────────────────────────────────── */}
      <Section title="IDENTIFICAÇÃO" icon="🏷" accent="#a78bfa">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>

          {/* Nome */}
          <Field label="Nome" required span2={false}>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="Ex: Mouse sem fio Logitech"
              style={inp} required autoFocus
            />
          </Field>

          {/* Categoria */}
          <Field label="Categoria" required>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} style={inp} required>
              <option value="">— selecione —</option>
              {filteredCategories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({kindConfig[c.kind].label})
                </option>
              ))}
            </select>
          </Field>

          {/* Tag */}
          <Field label="Nº Patrimônio" required hint="Identificador único do item">
            <div style={{ position: 'relative' }}>
              <input
                value={tag} onChange={e => setTag(e.target.value.toUpperCase())}
                placeholder="PAT-0001"
                style={{
                  ...inp,
                  paddingRight: 30,
                  border: tagOk === false ? '1px solid rgba(248,113,113,0.5)' : tagOk === true ? '1px solid rgba(52,211,153,0.4)' : inp.border as string,
                }}
                required
              />
              <span style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                fontSize: 12,
              }}>
                {tagChecking ? '…' : tagOk === true ? '✓' : tagOk === false ? '✗' : ''}
              </span>
            </div>
          </Field>

          {/* Serial */}
          <Field label="Número de série" hint="S/N, IMEI ou código do fabricante">
            <input value={serialNumber} onChange={e => setSerialNumber(e.target.value)} placeholder="Ex: SN-00182736" style={inp} />
          </Field>

        </div>
      </Section>

      {/* ── Situação ──────────────────────────────────────────────────────── */}
      <Section title="SITUAÇÃO" icon="📍">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>

          {/* Status */}
          <Field label="Status" required>
            <select value={status} onChange={e => setStatus(e.target.value)} style={inp}>
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>

          {/* Local */}
          <Field label="Local">
            <select value={location} onChange={e => setLocation(e.target.value)} style={inp}>
              <option value="">— nenhum —</option>
              {locationOptions.map(l => <option key={l} value={l}>{l}</option>)}
              <option value="__custom__">Outro (digitar…)</option>
            </select>
            {location === '__custom__' && (
              <input
                value={locationCustom} onChange={e => setLocationCustom(e.target.value)}
                placeholder="Digite o local"
                style={{ ...inp, marginTop: 6 }}
              />
            )}
          </Field>

          {/* Alocado para */}
          <Field label="Alocado para" span2>
            <UserSearchSelect
              users={users}
              value={assignedUserId}
              onChange={setAssignedUserId}
            />
          </Field>

        </div>
      </Section>

      {/* ── Campos personalizados (se a categoria tiver) ───────────────────── */}
      {selectedCategory?.customFields && selectedCategory.customFields.length > 0 && (
        <Section title="INFORMAÇÕES ADICIONAIS" icon="📋" accent="#38bdf8">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
            {selectedCategory.customFields.map(field => (
              <Field key={field.id} label={field.label} required={field.required}>
                {field.fieldType === 'SELECT' ? (
                  <select
                    value={customFieldValues[field.id] ?? ''}
                    onChange={e => setCustomFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                    style={inp}
                    required={field.required}
                  >
                    <option value="">— selecione —</option>
                    {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : field.fieldType === 'BOOLEAN' ? (
                  <select
                    value={customFieldValues[field.id] ?? ''}
                    onChange={e => setCustomFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                    style={inp}
                  >
                    <option value="">—</option>
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                  </select>
                ) : (
                  <input
                    value={customFieldValues[field.id] ?? ''}
                    onChange={e => setCustomFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                    placeholder={field.label}
                    type={field.fieldType === 'NUMBER' ? 'number' : field.fieldType === 'DATE' ? 'date' : 'text'}
                    style={inp}
                    required={field.required}
                  />
                )}
              </Field>
            ))}
          </div>
        </Section>
      )}

      {/* ── Financeiro ────────────────────────────────────────────────────── */}
      <Section title="FINANCEIRO (OPCIONAL)" icon="💰">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px 20px' }}>
          <Field label="Custo de aquisição (R$)">
            <input value={acquisitionCost} onChange={e => setAcquisitionCost(e.target.value)} type="number" step="0.01" min="0" placeholder="0,00" style={inp} />
          </Field>
          <Field label="Data de aquisição">
            <input value={acquisitionDate} onChange={e => setAcquisitionDate(e.target.value)} type="date" style={inp} />
          </Field>
          <Field label="Garantia até">
            <input value={warrantyUntil} onChange={e => setWarrantyUntil(e.target.value)} type="date" style={inp} />
          </Field>
        </div>
      </Section>

      {/* ── Observações ───────────────────────────────────────────────────── */}
      <Section title="OBSERVAÇÕES" icon="📝">
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Informações adicionais, condições, histórico…"
          rows={3}
          style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }}
        />
      </Section>

      {/* ── Erro ──────────────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          padding: '10px 16px', borderRadius: 8,
          background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)',
          fontSize: 13, color: '#f87171',
        }}>
          ⚠ {error}
        </div>
      )}

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', paddingTop: 4 }}>
        <button
          type="submit"
          disabled={isPending || tagOk === false || !name.trim() || !categoryId}
          style={{
            padding: '11px 28px', borderRadius: 9, fontSize: 13, fontWeight: 700,
            cursor: isPending || tagOk === false || !name.trim() || !categoryId ? 'default' : 'pointer',
            background: 'rgba(167,139,250,0.14)', border: '1px solid rgba(167,139,250,0.35)',
            color: '#a78bfa', fontFamily: "'JetBrains Mono', monospace",
            opacity: isPending || tagOk === false || !name.trim() || !categoryId ? 0.5 : 1,
            transition: 'all 0.1s',
          }}
        >
          {isPending ? 'Salvando…' : '+ Cadastrar item'}
        </button>
        <a
          href="/consumiveis"
          style={{
            padding: '11px 18px', borderRadius: 9, fontSize: 12, cursor: 'pointer',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
            color: '#3d5068', fontFamily: "'JetBrains Mono', monospace", textDecoration: 'none',
          }}
        >
          Cancelar
        </a>
      </div>

    </form>
  )
}
