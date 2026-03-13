'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createAsset, type CreateAssetInput } from '@/app/(app)/assets/new/actions'

interface Category {
  id: string
  name: string
  icon: string | null
}

interface UserOption {
  id: string
  name: string
}

interface Props {
  categories: Category[]
  users: UserOption[]
  initialTag: string
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, required, children, hint }: {
  label: string
  required?: boolean
  children: React.ReactNode
  hint?: string
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

// ── Input / Select styles ─────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: '9px 12px',
  fontSize: 13,
  color: '#c8d6e5',
  width: '100%',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

// ── Section card ──────────────────────────────────────────────────────────────
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
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
      {children}
    </div>
  )
}

// ── Status options ────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: 'STOCK',       label: 'Estoque',    color: '#94a3b8' },
  { value: 'DEPLOYED',    label: 'Implantado', color: '#34d399' },
  { value: 'MAINTENANCE', label: 'Manutenção', color: '#fbbf24' },
  { value: 'LOANED',      label: 'Emprestado', color: '#38bdf8' },
]

const RAM_OPTIONS = [
  { value: '', label: '— não informado —' },
  { value: '2', label: '2 GB' },
  { value: '4', label: '4 GB' },
  { value: '8', label: '8 GB' },
  { value: '16', label: '16 GB' },
  { value: '32', label: '32 GB' },
  { value: '64', label: '64 GB' },
]

const STORAGE_TYPE_OPTIONS = [
  { value: '', label: '— não informado —' },
  { value: 'HDD', label: 'HDD' },
  { value: 'SSD_SATA', label: 'SSD SATA' },
  { value: 'SSD_NVME', label: 'SSD NVMe' },
]

const STORAGE_GB_OPTIONS = [
  { value: '', label: '— não informado —' },
  { value: '120', label: '120 GB' },
  { value: '240', label: '240 GB' },
  { value: '256', label: '256 GB' },
  { value: '480', label: '480 GB' },
  { value: '500', label: '500 GB' },
  { value: '512', label: '512 GB' },
  { value: '1000', label: '1 TB' },
  { value: '2000', label: '2 TB' },
]

const CPU_BRAND_OPTIONS = [
  { value: '', label: '— não informado —' },
  { value: 'INTEL', label: 'Intel' },
  { value: 'AMD', label: 'AMD' },
  { value: 'OTHER', label: 'Outro' },
]

// ── Main form ─────────────────────────────────────────────────────────────────
export default function NewAssetForm({ categories, users, initialTag }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [tag, setTag] = useState(initialTag)
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [status, setStatus] = useState('STOCK')
  const [location, setLocation] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [assignedToUserId, setAssignedToUserId] = useState('')
  const [notes, setNotes] = useState('')

  // Hardware
  const [ramGb, setRamGb] = useState('')
  const [storageType, setStorageType] = useState('')
  const [storageGb, setStorageGb] = useState('')
  const [cpuBrand, setCpuBrand] = useState('')
  const [cpuModel, setCpuModel] = useState('')
  const [cpuGeneration, setCpuGeneration] = useState('')

  // Financial
  const [acquisitionCost, setAcquisitionCost] = useState('')
  const [currentValue, setCurrentValue] = useState('')
  const [acquisitionDate, setAcquisitionDate] = useState('')
  const [warrantyUntil, setWarrantyUntil] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const input: CreateAssetInput = {
      tag: tag.trim(),
      name: name.trim(),
      categoryId,
      status: status as CreateAssetInput['status'],
      location: location || undefined,
      serialNumber: serialNumber || undefined,
      assignedToUserId: assignedToUserId || undefined,
      notes: notes || undefined,
      ramGb: ramGb ? parseInt(ramGb) : undefined,
      storageType: storageType as CreateAssetInput['storageType'] || undefined,
      storageGb: storageGb ? parseInt(storageGb) : undefined,
      cpuBrand: cpuBrand as CreateAssetInput['cpuBrand'] || undefined,
      cpuModel: cpuModel || undefined,
      cpuGeneration: cpuGeneration ? parseInt(cpuGeneration) : undefined,
      acquisitionCost: acquisitionCost ? parseFloat(acquisitionCost.replace(',', '.')) : undefined,
      currentValue: currentValue ? parseFloat(currentValue.replace(',', '.')) : undefined,
      acquisitionDate: acquisitionDate || undefined,
      warrantyUntil: warrantyUntil || undefined,
    }

    startTransition(async () => {
      const result = await createAsset(input)
      if (result.ok) {
        router.push(`/assets/${result.id}`)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Error banner */}
      {error && (
        <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <p style={{ fontSize: 13, color: '#f87171' }}>{error}</p>
        </div>
      )}

      {/* ── IDENTIFICAÇÃO ─────────────────────────────────────────── */}
      <Section title="IDENTIFICAÇÃO" icon="🏷️">
        <Grid2>
          <Field label="Tag / Patrimônio" required hint="Identificador único no inventário">
            <input
              style={inputStyle}
              value={tag}
              onChange={e => setTag(e.target.value.toUpperCase())}
              placeholder="PAT-0001"
              maxLength={20}
              required
            />
          </Field>
          <Field label="Categoria" required>
            <select
              style={inputStyle}
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              required
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
        </Grid2>

        <Field label="Nome do ativo" required>
          <input
            style={inputStyle}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Dell Latitude 5520 — João Silva"
            maxLength={120}
            required
          />
        </Field>

        <Grid2>
          <Field label="Situação">
            <select style={inputStyle} value={status} onChange={e => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Nº de Série">
            <input
              style={inputStyle}
              value={serialNumber}
              onChange={e => setSerialNumber(e.target.value)}
              placeholder="Ex: SN-XXXX-0000"
            />
          </Field>
        </Grid2>

        <Grid2>
          <Field label="Localização">
            <input
              style={inputStyle}
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Ex: Sala Fiscal — Mesa 03"
            />
          </Field>
          <Field label="Atribuído a">
            <select style={inputStyle} value={assignedToUserId} onChange={e => setAssignedToUserId(e.target.value)}>
              <option value="">— nenhum —</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </Field>
        </Grid2>

        <Field label="Observações">
          <textarea
            style={{ ...inputStyle, resize: 'vertical', minHeight: 72, lineHeight: 1.5 }}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Informações adicionais sobre este ativo..."
          />
        </Field>
      </Section>

      {/* ── HARDWARE ──────────────────────────────────────────────── */}
      <Section title="HARDWARE" icon="💻">
        <Grid2>
          <Field label="Marca do processador">
            <select style={inputStyle} value={cpuBrand} onChange={e => setCpuBrand(e.target.value)}>
              {CPU_BRAND_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Modelo do processador" hint="Ex: Core i5-11th, Ryzen 5 5600">
            <input
              style={inputStyle}
              value={cpuModel}
              onChange={e => setCpuModel(e.target.value)}
              placeholder="Ex: Core i5-11th"
            />
          </Field>
        </Grid2>

        <Grid2>
          <Field label="Geração do processador" hint="Apenas o número (ex: 11 para 11ª geração)">
            <input
              style={inputStyle}
              type="number"
              min="1"
              max="20"
              value={cpuGeneration}
              onChange={e => setCpuGeneration(e.target.value)}
              placeholder="Ex: 11"
            />
          </Field>
          <Field label="Memória RAM">
            <select style={inputStyle} value={ramGb} onChange={e => setRamGb(e.target.value)}>
              {RAM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
        </Grid2>

        <Grid2>
          <Field label="Tipo de armazenamento">
            <select style={inputStyle} value={storageType} onChange={e => setStorageType(e.target.value)}>
              {STORAGE_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Capacidade de armazenamento">
            <select style={inputStyle} value={storageGb} onChange={e => setStorageGb(e.target.value)}>
              {STORAGE_GB_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
        </Grid2>

        <div style={{ background: 'rgba(0,217,184,0.05)', border: '1px solid rgba(0,217,184,0.1)', borderRadius: 8, padding: '10px 14px' }}>
          <p style={{ fontSize: 11, color: '#3d5068', lineHeight: 1.5 }}>
            💡 A pontuação de performance será calculada automaticamente ao salvar com base nas configurações de hardware informadas.
          </p>
        </div>
      </Section>

      {/* ── FINANCEIRO ────────────────────────────────────────────── */}
      <Section title="FINANCEIRO" icon="💰">
        <Grid2>
          <Field label="Custo de aquisição (R$)">
            <input
              style={inputStyle}
              type="text"
              inputMode="decimal"
              value={acquisitionCost}
              onChange={e => setAcquisitionCost(e.target.value)}
              placeholder="Ex: 3500,00"
            />
          </Field>
          <Field label="Valor atual (R$)">
            <input
              style={inputStyle}
              type="text"
              inputMode="decimal"
              value={currentValue}
              onChange={e => setCurrentValue(e.target.value)}
              placeholder="Ex: 2100,00"
            />
          </Field>
        </Grid2>

        <Grid2>
          <Field label="Data de aquisição">
            <input
              style={inputStyle}
              type="date"
              value={acquisitionDate}
              onChange={e => setAcquisitionDate(e.target.value)}
            />
          </Field>
          <Field label="Garantia até">
            <input
              style={inputStyle}
              type="date"
              value={warrantyUntil}
              onChange={e => setWarrantyUntil(e.target.value)}
            />
          </Field>
        </Grid2>
      </Section>

      {/* ── Actions ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
        <button
          type="button"
          onClick={() => router.push('/assets')}
          disabled={isPending}
          style={{
            padding: '10px 22px', borderRadius: 8,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#3d5068', fontSize: 13, cursor: 'pointer',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending || !name.trim() || !tag.trim() || !categoryId}
          style={{
            padding: '10px 28px', borderRadius: 8,
            background: isPending ? 'rgba(0,217,184,0.07)' : 'rgba(0,217,184,0.12)',
            border: '1px solid rgba(0,217,184,0.3)',
            color: '#00d9b8', fontSize: 13, fontWeight: 700, cursor: isPending ? 'not-allowed' : 'pointer',
            fontFamily: "'JetBrains Mono', monospace",
            display: 'flex', alignItems: 'center', gap: 8,
            opacity: (!name.trim() || !tag.trim() || !categoryId) ? 0.5 : 1,
            transition: 'all 0.1s',
          }}
        >
          {isPending ? (
            <>
              <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #00d9b8', borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite' }} />
              Salvando...
            </>
          ) : (
            <>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Criar ativo
            </>
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.4); cursor: pointer; }
        select option { background: #0d1422; color: #c8d6e5; }
        input::placeholder, textarea::placeholder { color: #2d4060; }
        input:focus, select:focus, textarea:focus {
          border-color: rgba(0,217,184,0.35) !important;
          box-shadow: 0 0 0 2px rgba(0,217,184,0.08);
        }
      `}</style>
    </form>
  )
}
