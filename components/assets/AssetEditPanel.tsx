'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { updateAsset } from '@/app/(app)/assets/[id]/actions'
import {
  Pencil, X, Check, Loader2,
  Cpu, HardDrive, MemoryStick, Activity,
  DollarSign, Calendar, ShieldCheck,
  Tag, MapPin, Hash, FileText, TrendingDown,
} from 'lucide-react'

type StorageType = 'HDD' | 'SSD_SATA' | 'SSD_NVME'
type CpuBrand   = 'INTEL' | 'AMD' | 'OTHER'
type AssetStatus = 'STOCK' | 'DEPLOYED' | 'MAINTENANCE' | 'DISCARDED' | 'LOANED'

interface AssetData {
  id: string; name: string; location: string | null; serialNumber: string | null
  status: AssetStatus; notes: string | null
  ramGb: number | null; storageType: StorageType | null; storageGb: number | null
  cpuBrand: CpuBrand | null; cpuModel: string | null; cpuGeneration: number | null
  acquisitionCost: string | null; currentValue: string | null
  acquisitionDate: string | null; warrantyUntil: string | null
}

interface Props {
  asset: AssetData; canEdit: boolean
  performanceScore: number | null; performanceLabel: string | null; performanceNotes: string | null
  isComputer?: boolean
}

// ── Config ────────────────────────────────────────────────────────────────────
const statusConfig: Record<AssetStatus, { label: string; color: string; bg: string; border: string }> = {
  STOCK:       { label: 'Estoque',    color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.25)' },
  DEPLOYED:    { label: 'Implantado', color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.3)'   },
  MAINTENANCE: { label: 'Manutenção', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.3)'   },
  DISCARDED:   { label: 'Descartado', color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)'  },
  LOANED:      { label: 'Emprestado', color: '#38bdf8', bg: 'rgba(56,189,248,0.1)',  border: 'rgba(56,189,248,0.3)'   },
}
const perfConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
  BOM:          { color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.25)',  label: 'Bom'           },
  INTERMEDIARIO:{ color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.25)',  label: 'Intermediário' },
  RUIM:         { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)', label: 'Ruim'          },
}
const cpuColors: Record<string, { color: string; bg: string }> = {
  INTEL: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'  },
  AMD:   { color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  OTHER: { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function isoToDateInput(iso: string | null) { return iso ? iso.split('T')[0] : '' }
function fmtBRL(v: string | null) {
  if (!v) return null
  const n = parseFloat(v)
  return isNaN(n) ? null : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function fmtDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('pt-BR')
}
function isExpired(iso: string | null) {
  if (!iso) return false
  return new Date(iso) < new Date()
}

// ── Sub-components ────────────────────────────────────────────────────────────
const iS: React.CSSProperties = {
  background: 'var(--bg-input)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '9px 12px', color: 'var(--text-primary)',
  fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box',
  fontFamily: 'inherit', transition: 'border-color 0.15s',
}
const sS: React.CSSProperties = {
  ...iS, cursor: 'pointer', appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: 30,
}

function FLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.09em', marginBottom: 6 }}>
      {children}
    </p>
  )
}
function FVal({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontFamily: mono ? "'JetBrains Mono', monospace" : 'inherit', lineHeight: 1.3 }}>
      {children}
    </p>
  )
}
function FEmpty() {
  return <p style={{ fontSize: 14, color: 'var(--text-dim)', fontStyle: 'italic' }}>—</p>
}

function CardHeader({ icon, label, accent }: { icon: React.ReactNode; label: string; accent: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
        background: `${accent}18`, border: `1px solid ${accent}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: accent, letterSpacing: '0.1em' }}>
        {label}
      </span>
    </div>
  )
}

const card: React.CSSProperties = {
  background: 'var(--bg-surface)', border: '1px solid var(--border)',
  borderRadius: 16, padding: '22px 24px',
}

function focusIn(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.target.style.borderColor = 'var(--accent-cyan)'
  e.target.style.boxShadow = '0 0 0 3px var(--accent-cyan-dim)'
}
function focusOut(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.target.style.borderColor = 'var(--border)'
  e.target.style.boxShadow = 'none'
}

export default function AssetEditPanel({ asset, canEdit, performanceScore, performanceLabel, performanceNotes, isComputer = false }: Props) {
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState({
    name: asset.name, location: asset.location ?? '',
    serialNumber: asset.serialNumber ?? '', status: asset.status,
    notes: asset.notes ?? '',
    ramGb: asset.ramGb?.toString() ?? '', storageType: asset.storageType ?? '',
    storageGb: asset.storageGb?.toString() ?? '', cpuBrand: asset.cpuBrand ?? '',
    cpuModel: asset.cpuModel ?? '', cpuGeneration: asset.cpuGeneration?.toString() ?? '',
    acquisitionCost: asset.acquisitionCost ?? '', currentValue: asset.currentValue ?? '',
    acquisitionDate: isoToDateInput(asset.acquisitionDate),
    warrantyUntil: isoToDateInput(asset.warrantyUntil),
  })

  function set(key: keyof typeof form, value: string) { setForm(p => ({ ...p, [key]: value })) }

  function handleSave() {
    startTransition(async () => {
      await updateAsset(asset.id, {
        name: form.name || undefined, location: form.location || null,
        serialNumber: form.serialNumber || null, status: form.status as AssetStatus,
        notes: form.notes || null,
        ramGb: form.ramGb ? parseInt(form.ramGb) : null,
        storageType: form.storageType as StorageType | null || null,
        storageGb: form.storageGb ? parseInt(form.storageGb) : null,
        cpuBrand: form.cpuBrand as CpuBrand | null || null,
        cpuModel: form.cpuModel || null, cpuGeneration: form.cpuGeneration ? parseInt(form.cpuGeneration) : null,
        acquisitionCost: form.acquisitionCost ? parseFloat(form.acquisitionCost) : null,
        currentValue: form.currentValue ? parseFloat(form.currentValue) : null,
        acquisitionDate: form.acquisitionDate || null, warrantyUntil: form.warrantyUntil || null,
      })
      setSaved(true); setEditing(false); setTimeout(() => setSaved(false), 2500)
    })
  }
  function handleCancel() {
    setForm({
      name: asset.name, location: asset.location ?? '',
      serialNumber: asset.serialNumber ?? '', status: asset.status, notes: asset.notes ?? '',
      ramGb: asset.ramGb?.toString() ?? '', storageType: asset.storageType ?? '',
      storageGb: asset.storageGb?.toString() ?? '', cpuBrand: asset.cpuBrand ?? '',
      cpuModel: asset.cpuModel ?? '', cpuGeneration: asset.cpuGeneration?.toString() ?? '',
      acquisitionCost: asset.acquisitionCost ?? '', currentValue: asset.currentValue ?? '',
      acquisitionDate: isoToDateInput(asset.acquisitionDate),
      warrantyUntil: isoToDateInput(asset.warrantyUntil),
    })
    setEditing(false)
  }

  const sc  = statusConfig[form.status as AssetStatus] ?? statusConfig.STOCK
  const pc  = performanceLabel ? perfConfig[performanceLabel] : null
  const cpu = form.cpuBrand ? cpuColors[form.cpuBrand] : null

  // Financial derived
  const acqVal = fmtBRL(asset.acquisitionCost)
  const curVal = fmtBRL(asset.currentValue)
  const deprecPct = asset.acquisitionCost && asset.currentValue
    ? Math.round((1 - parseFloat(asset.currentValue) / parseFloat(asset.acquisitionCost)) * 100)
    : null

  const hasHardware = asset.cpuBrand || asset.cpuModel || asset.cpuGeneration || asset.ramGb || asset.storageType || asset.storageGb
  const hasFinancial = asset.acquisitionCost || asset.currentValue || asset.acquisitionDate || asset.warrantyUntil

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 34 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.12em' }}>
          INFORMAÇÕES DO ATIVO
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {saved && !editing && (
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Check size={11} /> Salvo!
            </span>
          )}
          {canEdit && !editing && (
            <Link href={`/assets/${asset.id}/edit`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8,
              background: 'var(--bg-elevated)', border: '1px solid var(--border-hover)',
              color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.12s',
              textDecoration: 'none',
            }}
            onMouseEnter={e => { const t = e.currentTarget; t.style.background = 'var(--accent-cyan-dim)'; t.style.borderColor = 'var(--accent-cyan)'; t.style.color = 'var(--accent-cyan)' }}
            onMouseLeave={e => { const t = e.currentTarget; t.style.background = 'var(--bg-elevated)'; t.style.borderColor = 'var(--border-hover)'; t.style.color = 'var(--text-muted)' }}
            >
              <Pencil size={11} /> EDITAR
            </Link>
          )}
          {canEdit && editing && (
            <>
              <button onClick={handleCancel} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8,
                background: 'var(--bg-elevated)', border: '1px solid var(--border-hover)',
                color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}>
                <X size={11} /> CANCELAR
              </button>
              <button onClick={handleSave} disabled={isPending} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 16px', borderRadius: 8,
                background: 'var(--accent-cyan-dim)', border: '1px solid var(--accent-cyan)',
                color: 'var(--accent-cyan)', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700,
                cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.7 : 1,
              }}>
                {isPending ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={11} />}
                {isPending ? 'SALVANDO...' : 'SALVAR'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          ROW 1: IDENTIFICAÇÃO (full width)
      ════════════════════════════════════════════════════════════════════ */}
      <div style={{ ...card, borderLeft: `3px solid var(--accent-cyan)` }}>
        <CardHeader icon={<Tag size={14} color="var(--accent-cyan)" />} label="IDENTIFICAÇÃO" accent="var(--accent-cyan)" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Nome */}
          <div>
            <FLabel>NOME DO ATIVO</FLabel>
            {editing
              ? <input value={form.name} onChange={e => set('name', e.target.value)} style={iS} onFocus={focusIn} onBlur={focusOut} />
              : <FVal>{asset.name}</FVal>
            }
          </div>

          {/* Status */}
          <div>
            <FLabel>STATUS</FLabel>
            {editing
              ? (
                <select value={form.status} onChange={e => set('status', e.target.value)} style={{ ...sS, color: sc.color }} onFocus={focusIn} onBlur={focusOut}>
                  {Object.entries(statusConfig).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: sc.color, boxShadow: `0 0 6px ${sc.color}`, flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontSize: 15, fontWeight: 700, color: sc.color }}>{sc.label}</span>
                </div>
              )
            }
          </div>

          {/* Localização */}
          <div>
            <FLabel><MapPin size={9} style={{ verticalAlign: 'middle', marginRight: 4 }} />LOCALIZAÇÃO</FLabel>
            {editing
              ? <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Ex.: Sala 204 — 2º Andar" style={iS} onFocus={focusIn} onBlur={focusOut} />
              : (asset.location ? <FVal>{asset.location}</FVal> : <FEmpty />)
            }
          </div>

          {/* Nº de série */}
          <div>
            <FLabel><Hash size={9} style={{ verticalAlign: 'middle', marginRight: 4 }} />Nº DE SÉRIE</FLabel>
            {editing
              ? <input value={form.serialNumber} onChange={e => set('serialNumber', e.target.value)} placeholder="Ex.: SN-2024-001234" style={{ ...iS, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }} onFocus={focusIn} onBlur={focusOut} />
              : (asset.serialNumber ? <FVal mono>{asset.serialNumber}</FVal> : <FEmpty />)
            }
          </div>
        </div>

        {/* Observações — full width */}
        <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
          <FLabel><FileText size={9} style={{ verticalAlign: 'middle', marginRight: 4 }} />OBSERVAÇÕES GERAIS</FLabel>
          {editing
            ? <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Observações sobre o ativo…" style={{ ...iS, resize: 'vertical' } as React.CSSProperties} onFocus={focusIn} onBlur={focusOut} />
            : (asset.notes
                ? <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>{asset.notes}</p>
                : <FEmpty />
              )
          }
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          ROW 2: HARDWARE — só para ativos com isComputer = true
      ════════════════════════════════════════════════════════════════════ */}
      {isComputer && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        {/* PROCESSADOR */}
        <div style={{ ...card, borderLeft: '3px solid #60a5fa' }}>
          <CardHeader icon={<Cpu size={14} color="#60a5fa" />} label="PROCESSADOR" accent="#60a5fa" />

          {/* CPU Brand badge */}
          {!editing && form.cpuBrand && cpu && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 8, marginBottom: 16,
              background: cpu.bg, border: `1px solid ${cpu.color}30`,
            }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 800, color: cpu.color, letterSpacing: '0.05em' }}>
                {form.cpuBrand}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Marca (edit only) */}
            {editing && (
              <div>
                <FLabel>MARCA</FLabel>
                <select value={form.cpuBrand} onChange={e => set('cpuBrand', e.target.value)} style={sS} onFocus={focusIn} onBlur={focusOut}>
                  <option value="">—</option>
                  <option value="INTEL">Intel</option>
                  <option value="AMD">AMD</option>
                  <option value="OTHER">Outro</option>
                </select>
              </div>
            )}

            {/* Modelo */}
            <div>
              <FLabel>MODELO</FLabel>
              {editing
                ? <input value={form.cpuModel} onChange={e => set('cpuModel', e.target.value)} placeholder="Ex.: Core i5-12400" style={iS} onFocus={focusIn} onBlur={focusOut} />
                : (asset.cpuModel ? <FVal>{asset.cpuModel}</FVal> : <FEmpty />)
              }
            </div>

            {/* Geração */}
            <div>
              <FLabel>GERAÇÃO</FLabel>
              {editing
                ? <input type="number" value={form.cpuGeneration} onChange={e => set('cpuGeneration', e.target.value)} placeholder="Ex.: 12" style={iS} min={1} max={20} onFocus={focusIn} onBlur={focusOut} />
                : (asset.cpuGeneration
                    ? (
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontSize: 22, fontWeight: 800, color: '#60a5fa', lineHeight: 1 }}>{asset.cpuGeneration}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>ª geração</span>
                      </div>
                    ) : <FEmpty />
                  )
              }
            </div>
          </div>
        </div>

        {/* MEMÓRIA & ARMAZENAMENTO */}
        <div style={{ ...card, borderLeft: '3px solid #a78bfa' }}>
          <CardHeader icon={<HardDrive size={14} color="#a78bfa" />} label="MEMÓRIA & ARMAZENAMENTO" accent="#a78bfa" />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* RAM */}
            <div>
              <FLabel><MemoryStick size={9} style={{ verticalAlign: 'middle', marginRight: 4 }} />MEMÓRIA RAM</FLabel>
              {editing
                ? <input type="number" value={form.ramGb} onChange={e => set('ramGb', e.target.value)} placeholder="Ex.: 16" style={iS} min={1} onFocus={focusIn} onBlur={focusOut} />
                : (asset.ramGb
                    ? (
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontSize: 22, fontWeight: 800, color: '#a78bfa', lineHeight: 1 }}>{asset.ramGb}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>GB</span>
                      </div>
                    ) : <FEmpty />
                  )
              }
            </div>

            {/* Tipo de armazenamento */}
            <div>
              <FLabel>TIPO DE ARMAZENAMENTO</FLabel>
              {editing
                ? (
                  <select value={form.storageType} onChange={e => set('storageType', e.target.value)} style={sS} onFocus={focusIn} onBlur={focusOut}>
                    <option value="">—</option>
                    <option value="HDD">HDD</option>
                    <option value="SSD_SATA">SSD SATA</option>
                    <option value="SSD_NVME">SSD NVMe</option>
                  </select>
                ) : (asset.storageType
                    ? (
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700,
                        color: '#a78bfa', background: 'rgba(167,139,250,0.1)',
                        border: '1px solid rgba(167,139,250,0.2)', borderRadius: 6,
                        padding: '3px 10px', display: 'inline-block',
                      }}>
                        {asset.storageType.replace('_', ' ')}
                      </span>
                    ) : <FEmpty />
                  )
            }
            </div>

            {/* Capacidade */}
            <div>
              <FLabel>CAPACIDADE</FLabel>
              {editing
                ? <input type="number" value={form.storageGb} onChange={e => set('storageGb', e.target.value)} placeholder="Ex.: 512" style={iS} min={1} onFocus={focusIn} onBlur={focusOut} />
                : (asset.storageGb
                    ? (
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontSize: 22, fontWeight: 800, color: '#a78bfa', lineHeight: 1 }}>
                          {asset.storageGb >= 1024 ? (asset.storageGb / 1024).toFixed(1) : asset.storageGb}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{asset.storageGb >= 1024 ? 'TB' : 'GB'}</span>
                      </div>
                    ) : <FEmpty />
                  )
              }
            </div>
          </div>
        </div>
      </div>}

      {/* ════════════════════════════════════════════════════════════════════
          PERFORMANCE (only if data exists)
      ════════════════════════════════════════════════════════════════════ */}
      {(performanceScore !== null || performanceLabel) && pc && (
        <div style={{ ...card, borderLeft: `3px solid ${pc.color}` }}>
          <CardHeader icon={<Activity size={14} color={pc.color} />} label="PERFORMANCE" accent={pc.color} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
            {/* Score donut-style */}
            <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
              <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle
                  cx="40" cy="40" r="32" fill="none"
                  stroke={pc.color} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - (performanceScore ?? 0) / 100)}`}
                  style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: pc.color, lineHeight: 1 }}>{performanceScore}</span>
                <span style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace" }}>/100</span>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              {/* Label chip */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 8, background: pc.bg, border: `1px solid ${pc.border}`, marginBottom: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: pc.color, boxShadow: `0 0 5px ${pc.color}`, display: 'inline-block' }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: pc.color }}>
                  {pc.label.toUpperCase()}
                </span>
              </div>

              {/* Bar */}
              <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  width: `${performanceScore ?? 0}%`,
                  background: `linear-gradient(90deg, ${pc.color}88, ${pc.color})`,
                  transition: 'width 0.6s ease',
                }} />
              </div>

              {/* Notes */}
              {performanceNotes && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, fontStyle: 'italic' }}>
                  {performanceNotes}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          FINANCEIRO
      ════════════════════════════════════════════════════════════════════ */}
      <div style={{ ...card, borderLeft: '3px solid #34d399' }}>
        <CardHeader icon={<DollarSign size={14} color="#34d399" />} label="FINANCEIRO" accent="#34d399" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          {/* Custo de aquisição */}
          <div>
            <FLabel>CUSTO DE AQUISIÇÃO</FLabel>
            {editing
              ? <input type="number" value={form.acquisitionCost} onChange={e => set('acquisitionCost', e.target.value)} placeholder="Ex.: 2499.90" style={iS} step="0.01" min={0} onFocus={focusIn} onBlur={focusOut} />
              : (acqVal
                  ? <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{acqVal}</p>
                  : <FEmpty />
                )
            }
          </div>

          {/* Valor atual + depreciação */}
          <div>
            <FLabel>VALOR ATUAL</FLabel>
            {editing
              ? <input type="number" value={form.currentValue} onChange={e => set('currentValue', e.target.value)} placeholder="Ex.: 1800.00" style={iS} step="0.01" min={0} onFocus={focusIn} onBlur={focusOut} />
              : (curVal
                  ? (
                    <div>
                      <p style={{ fontSize: 18, fontWeight: 800, color: '#34d399', lineHeight: 1 }}>{curVal}</p>
                      {deprecPct !== null && deprecPct > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5 }}>
                          <TrendingDown size={11} color="#f87171" />
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#f87171' }}>
                            {deprecPct}% depreciado
                          </span>
                        </div>
                      )}
                    </div>
                  ) : <FEmpty />
                )
            }
          </div>

          {/* Data de aquisição */}
          <div>
            <FLabel><Calendar size={9} style={{ verticalAlign: 'middle', marginRight: 4 }} />DATA DE AQUISIÇÃO</FLabel>
            {editing
              ? <input type="date" value={form.acquisitionDate} onChange={e => set('acquisitionDate', e.target.value)} style={{ ...iS, colorScheme: 'dark' } as React.CSSProperties} onFocus={focusIn} onBlur={focusOut} />
              : (asset.acquisitionDate ? <FVal>{fmtDate(asset.acquisitionDate)}</FVal> : <FEmpty />)
            }
          </div>

          {/* Garantia */}
          <div>
            <FLabel><ShieldCheck size={9} style={{ verticalAlign: 'middle', marginRight: 4 }} />GARANTIA ATÉ</FLabel>
            {editing
              ? <input type="date" value={form.warrantyUntil} onChange={e => set('warrantyUntil', e.target.value)} style={{ ...iS, colorScheme: 'dark' } as React.CSSProperties} onFocus={focusIn} onBlur={focusOut} />
              : (asset.warrantyUntil
                  ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FVal>{fmtDate(asset.warrantyUntil)}</FVal>
                      {isExpired(asset.warrantyUntil) && (
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 4, padding: '2px 6px' }}>
                          EXPIRADA
                        </span>
                      )}
                    </div>
                  ) : <FEmpty />
                )
            }
          </div>
        </div>
      </div>
    </div>
  )
}
