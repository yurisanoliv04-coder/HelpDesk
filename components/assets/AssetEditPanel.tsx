'use client'

import { useState, useTransition } from 'react'
import { updateAsset } from '@/app/(app)/assets/[id]/actions'
import {
  Pencil, X, Check, Loader2,
  MapPin, Tag, Hash, FileText,
  Cpu, HardDrive, MemoryStick,
  DollarSign, Calendar, ShieldCheck,
  Activity,
} from 'lucide-react'

type StorageType = 'HDD' | 'SSD_SATA' | 'SSD_NVME'
type CpuBrand = 'INTEL' | 'AMD' | 'OTHER'
type AssetStatus = 'STOCK' | 'DEPLOYED' | 'MAINTENANCE' | 'DISCARDED' | 'LOANED'

interface AssetData {
  id: string
  name: string
  location: string | null
  serialNumber: string | null
  status: AssetStatus
  notes: string | null
  // Hardware
  ramGb: number | null
  storageType: StorageType | null
  storageGb: number | null
  cpuBrand: CpuBrand | null
  cpuModel: string | null
  cpuGeneration: number | null
  // Financial
  acquisitionCost: string | null
  currentValue: string | null
  acquisitionDate: string | null // ISO string
  warrantyUntil: string | null   // ISO string
}

interface Props {
  asset: AssetData
  canEdit: boolean
  performanceScore: number | null
  performanceLabel: string | null
  performanceNotes: string | null
}

const statusConfig: Record<AssetStatus, { label: string; color: string; bg: string; border: string }> = {
  STOCK:       { label: 'Estoque',    color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' },
  DEPLOYED:    { label: 'Implantado', color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.2)'  },
  MAINTENANCE: { label: 'Manutenção', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.2)'  },
  DISCARDED:   { label: 'Descartado', color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)' },
  LOANED:      { label: 'Emprestado', color: '#38bdf8', bg: 'rgba(56,189,248,0.1)',  border: 'rgba(56,189,248,0.2)'  },
}

const perfConfig: Record<string, { color: string; label: string }> = {
  BOM:          { color: '#34d399', label: 'Bom' },
  INTERMEDIARIO:{ color: '#fbbf24', label: 'Intermediário' },
  RUIM:         { color: '#f87171', label: 'Ruim' },
}

function isoToDateInput(iso: string | null) {
  if (!iso) return ''
  return iso.split('T')[0]
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700, color: '#2d4060', letterSpacing: '0.1em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 7, padding: '8px 11px', color: '#c8d6e5',
  fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box',
  fontFamily: 'inherit', transition: 'border-color 0.15s',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%233d5068' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: 28,
}

export default function AssetEditPanel({ asset, canEdit, performanceScore, performanceLabel, performanceNotes }: Props) {
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  // Form state mirrors the asset fields
  const [form, setForm] = useState({
    name: asset.name,
    location: asset.location ?? '',
    serialNumber: asset.serialNumber ?? '',
    status: asset.status,
    notes: asset.notes ?? '',
    ramGb: asset.ramGb?.toString() ?? '',
    storageType: asset.storageType ?? '',
    storageGb: asset.storageGb?.toString() ?? '',
    cpuBrand: asset.cpuBrand ?? '',
    cpuModel: asset.cpuModel ?? '',
    cpuGeneration: asset.cpuGeneration?.toString() ?? '',
    acquisitionCost: asset.acquisitionCost ?? '',
    currentValue: asset.currentValue ?? '',
    acquisitionDate: isoToDateInput(asset.acquisitionDate),
    warrantyUntil: isoToDateInput(asset.warrantyUntil),
  })

  function set(key: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    startTransition(async () => {
      await updateAsset(asset.id, {
        name:          form.name || undefined,
        location:      form.location || null,
        serialNumber:  form.serialNumber || null,
        status:        form.status as AssetStatus,
        notes:         form.notes || null,
        ramGb:         form.ramGb ? parseInt(form.ramGb) : null,
        storageType:   form.storageType as StorageType | null || null,
        storageGb:     form.storageGb ? parseInt(form.storageGb) : null,
        cpuBrand:      form.cpuBrand as CpuBrand | null || null,
        cpuModel:      form.cpuModel || null,
        cpuGeneration: form.cpuGeneration ? parseInt(form.cpuGeneration) : null,
        acquisitionCost: form.acquisitionCost ? parseFloat(form.acquisitionCost) : null,
        currentValue:    form.currentValue ? parseFloat(form.currentValue) : null,
        acquisitionDate: form.acquisitionDate || null,
        warrantyUntil:   form.warrantyUntil || null,
      })
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  function handleCancel() {
    // Reset form to original asset values
    setForm({
      name: asset.name,
      location: asset.location ?? '',
      serialNumber: asset.serialNumber ?? '',
      status: asset.status,
      notes: asset.notes ?? '',
      ramGb: asset.ramGb?.toString() ?? '',
      storageType: asset.storageType ?? '',
      storageGb: asset.storageGb?.toString() ?? '',
      cpuBrand: asset.cpuBrand ?? '',
      cpuModel: asset.cpuModel ?? '',
      cpuGeneration: asset.cpuGeneration?.toString() ?? '',
      acquisitionCost: asset.acquisitionCost ?? '',
      currentValue: asset.currentValue ?? '',
      acquisitionDate: isoToDateInput(asset.acquisitionDate),
      warrantyUntil: isoToDateInput(asset.warrantyUntil),
    })
    setEditing(false)
  }

  const sc = statusConfig[form.status as AssetStatus] ?? statusConfig.STOCK

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Section header ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#2d4060', letterSpacing: '0.1em' }}>
          INFORMAÇÕES DO ATIVO
        </span>
        {canEdit && !editing && (
          <button
            onClick={() => setEditing(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 7,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
              color: '#8ba5c0', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.12s',
            }}
            onMouseEnter={e => { const t = e.currentTarget; t.style.background = 'rgba(0,217,184,0.1)'; t.style.borderColor = 'rgba(0,217,184,0.25)'; t.style.color = '#00d9b8' }}
            onMouseLeave={e => { const t = e.currentTarget; t.style.background = 'rgba(255,255,255,0.04)'; t.style.borderColor = 'rgba(255,255,255,0.09)'; t.style.color = '#8ba5c0' }}
          >
            <Pencil size={10} /> EDITAR
          </button>
        )}
        {canEdit && editing && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleCancel}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: '#8ba5c0', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, cursor: 'pointer' }}
            >
              <X size={10} /> CANCELAR
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 7, background: 'rgba(0,217,184,0.15)', border: '1px solid rgba(0,217,184,0.3)', color: '#00d9b8', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.6 : 1 }}
            >
              {isPending ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={10} />}
              {isPending ? 'SALVANDO...' : 'SALVAR'}
            </button>
          </div>
        )}
        {saved && !editing && (
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Check size={10} /> SALVO
          </span>
        )}
      </div>

      {/* ── Informações básicas ──────────────────────────────────────────── */}
      <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px 24px' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700, color: '#1e3048', letterSpacing: '0.12em', marginBottom: 16 }}>
          ── IDENTIFICAÇÃO
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="NOME DO ATIVO">
            {editing ? (
              <input value={form.name} onChange={e => set('name', e.target.value)} style={inputStyle}
                onFocus={e => { e.target.style.borderColor = 'rgba(0,217,184,0.3)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }} />
            ) : (
              <span style={{ fontSize: 13, color: '#c8d6e5' }}>{asset.name}</span>
            )}
          </Field>

          <Field label="STATUS">
            {editing ? (
              <select value={form.status} onChange={e => set('status', e.target.value)} style={{ ...selectStyle, color: sc.color }}>
                {Object.entries(statusConfig).map(([k, v]) => (
                  <option key={k} value={k} style={{ color: '#c8d6e5', background: '#0d1422' }}>{v.label}</option>
                ))}
              </select>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 5, background: sc.bg, border: `1px solid ${sc.border}`, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: sc.color, width: 'fit-content' }}>
                {sc.label}
              </span>
            )}
          </Field>

          <Field label="LOCALIZAÇÃO">
            {editing ? (
              <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Ex.: Sala 204 — 2º Andar"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = 'rgba(0,217,184,0.3)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }} />
            ) : (
              <span style={{ fontSize: 13, color: asset.location ? '#c8d6e5' : '#2d4060' }}>{asset.location || '—'}</span>
            )}
          </Field>

          <Field label="Nº DE SÉRIE">
            {editing ? (
              <input value={form.serialNumber} onChange={e => set('serialNumber', e.target.value)} placeholder="Ex.: SN-2024-001234"
                style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
                onFocus={e => { e.target.style.borderColor = 'rgba(0,217,184,0.3)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }} />
            ) : (
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: asset.serialNumber ? '#c8d6e5' : '#2d4060' }}>{asset.serialNumber || '—'}</span>
            )}
          </Field>
        </div>

        {/* Notes */}
        <div style={{ marginTop: 14 }}>
          <Field label="OBSERVAÇÕES GERAIS">
            {editing ? (
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Observações sobre o ativo…"
                style={{ ...inputStyle, resize: 'vertical' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(0,217,184,0.3)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }} />
            ) : (
              <span style={{ fontSize: 13, color: asset.notes ? '#c8d6e5' : '#2d4060', fontStyle: asset.notes ? 'normal' : 'italic' }}>
                {asset.notes || 'Nenhuma observação'}
              </span>
            )}
          </Field>
        </div>
      </div>

      {/* ── Hardware ─────────────────────────────────────────────────────── */}
      <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Cpu size={13} color="#3d5068" />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700, color: '#1e3048', letterSpacing: '0.12em' }}>
            ── HARDWARE
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>

          <Field label="CPU — MARCA">
            {editing ? (
              <select value={form.cpuBrand} onChange={e => set('cpuBrand', e.target.value)} style={selectStyle}>
                <option value="" style={{ color: '#c8d6e5', background: '#0d1422' }}>—</option>
                <option value="INTEL" style={{ color: '#c8d6e5', background: '#0d1422' }}>Intel</option>
                <option value="AMD" style={{ color: '#c8d6e5', background: '#0d1422' }}>AMD</option>
                <option value="OTHER" style={{ color: '#c8d6e5', background: '#0d1422' }}>Outro</option>
              </select>
            ) : (
              <span style={{ fontSize: 13, color: asset.cpuBrand ? '#c8d6e5' : '#2d4060' }}>{asset.cpuBrand || '—'}</span>
            )}
          </Field>

          <Field label="CPU — MODELO">
            {editing ? (
              <input value={form.cpuModel} onChange={e => set('cpuModel', e.target.value)} placeholder="Ex.: Core i5-10400"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = 'rgba(0,217,184,0.3)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }} />
            ) : (
              <span style={{ fontSize: 13, color: asset.cpuModel ? '#c8d6e5' : '#2d4060' }}>{asset.cpuModel || '—'}</span>
            )}
          </Field>

          <Field label="CPU — GERAÇÃO">
            {editing ? (
              <input type="number" value={form.cpuGeneration} onChange={e => set('cpuGeneration', e.target.value)} placeholder="Ex.: 10"
                style={inputStyle} min={1} max={20}
                onFocus={e => { e.target.style.borderColor = 'rgba(0,217,184,0.3)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }} />
            ) : (
              <span style={{ fontSize: 13, color: asset.cpuGeneration ? '#c8d6e5' : '#2d4060' }}>
                {asset.cpuGeneration ? `${asset.cpuGeneration}ª geração` : '—'}
              </span>
            )}
          </Field>

          <Field label="MEMÓRIA RAM (GB)">
            {editing ? (
              <input type="number" value={form.ramGb} onChange={e => set('ramGb', e.target.value)} placeholder="Ex.: 16"
                style={inputStyle} min={1}
                onFocus={e => { e.target.style.borderColor = 'rgba(0,217,184,0.3)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }} />
            ) : (
              <span style={{ fontSize: 13, color: asset.ramGb ? '#c8d6e5' : '#2d4060' }}>
                {asset.ramGb ? `${asset.ramGb} GB` : '—'}
              </span>
            )}
          </Field>

          <Field label="TIPO DE ARMAZENAMENTO">
            {editing ? (
              <select value={form.storageType} onChange={e => set('storageType', e.target.value)} style={selectStyle}>
                <option value="" style={{ color: '#c8d6e5', background: '#0d1422' }}>—</option>
                <option value="HDD" style={{ color: '#c8d6e5', background: '#0d1422' }}>HDD</option>
                <option value="SSD_SATA" style={{ color: '#c8d6e5', background: '#0d1422' }}>SSD SATA</option>
                <option value="SSD_NVME" style={{ color: '#c8d6e5', background: '#0d1422' }}>SSD NVMe</option>
              </select>
            ) : (
              <span style={{ fontSize: 13, color: asset.storageType ? '#c8d6e5' : '#2d4060' }}>
                {asset.storageType ? asset.storageType.replace('_', ' ') : '—'}
              </span>
            )}
          </Field>

          <Field label="CAPACIDADE (GB)">
            {editing ? (
              <input type="number" value={form.storageGb} onChange={e => set('storageGb', e.target.value)} placeholder="Ex.: 512"
                style={inputStyle} min={1}
                onFocus={e => { e.target.style.borderColor = 'rgba(0,217,184,0.3)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }} />
            ) : (
              <span style={{ fontSize: 13, color: asset.storageGb ? '#c8d6e5' : '#2d4060' }}>
                {asset.storageGb ? `${asset.storageGb} GB` : '—'}
              </span>
            )}
          </Field>
        </div>

        {/* Performance (read-only) */}
        {(performanceScore !== null || performanceLabel) && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Activity size={13} color="#3d5068" />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', letterSpacing: '0.08em' }}>
                PERFORMANCE
              </span>
              {performanceLabel && (
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
                  color: perfConfig[performanceLabel]?.color ?? '#94a3b8',
                  padding: '2px 7px', borderRadius: 4,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                }}>
                  {performanceScore}/100 — {perfConfig[performanceLabel]?.label ?? performanceLabel}
                </span>
              )}
            </div>
            {performanceNotes && (
              <p style={{ fontSize: 11, color: '#5a7a9a', marginTop: 8, fontStyle: 'italic', borderLeft: '2px solid rgba(255,255,255,0.06)', paddingLeft: 8 }}>
                {performanceNotes}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Financeiro ───────────────────────────────────────────────────── */}
      <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <DollarSign size={13} color="#3d5068" />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700, color: '#1e3048', letterSpacing: '0.12em' }}>
            ── FINANCEIRO
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

          <Field label="CUSTO DE AQUISIÇÃO (R$)">
            {editing ? (
              <input type="number" value={form.acquisitionCost} onChange={e => set('acquisitionCost', e.target.value)} placeholder="Ex.: 2499.90"
                style={inputStyle} step="0.01" min={0}
                onFocus={e => { e.target.style.borderColor = 'rgba(0,217,184,0.3)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }} />
            ) : (
              <span style={{ fontSize: 13, color: asset.acquisitionCost ? '#c8d6e5' : '#2d4060' }}>
                {asset.acquisitionCost ? `R$ ${parseFloat(asset.acquisitionCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
              </span>
            )}
          </Field>

          <Field label="VALOR ATUAL (R$)">
            {editing ? (
              <input type="number" value={form.currentValue} onChange={e => set('currentValue', e.target.value)} placeholder="Ex.: 1800.00"
                style={inputStyle} step="0.01" min={0}
                onFocus={e => { e.target.style.borderColor = 'rgba(0,217,184,0.3)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }} />
            ) : (
              <span style={{ fontSize: 13, color: asset.currentValue ? '#c8d6e5' : '#2d4060' }}>
                {asset.currentValue ? `R$ ${parseFloat(asset.currentValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
              </span>
            )}
          </Field>

          <Field label="DATA DE AQUISIÇÃO">
            {editing ? (
              <input type="date" value={form.acquisitionDate} onChange={e => set('acquisitionDate', e.target.value)}
                style={{ ...inputStyle, colorScheme: 'dark' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(0,217,184,0.3)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }} />
            ) : (
              <span style={{ fontSize: 13, color: asset.acquisitionDate ? '#c8d6e5' : '#2d4060' }}>
                {asset.acquisitionDate ? new Date(asset.acquisitionDate).toLocaleDateString('pt-BR') : '—'}
              </span>
            )}
          </Field>

          <Field label="GARANTIA ATÉ">
            {editing ? (
              <input type="date" value={form.warrantyUntil} onChange={e => set('warrantyUntil', e.target.value)}
                style={{ ...inputStyle, colorScheme: 'dark' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(0,217,184,0.3)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }} />
            ) : (
              <span style={{ fontSize: 13, color: asset.warrantyUntil ? '#c8d6e5' : '#2d4060' }}>
                {asset.warrantyUntil ? new Date(asset.warrantyUntil).toLocaleDateString('pt-BR') : '—'}
              </span>
            )}
          </Field>
        </div>
      </div>
    </div>
  )
}
