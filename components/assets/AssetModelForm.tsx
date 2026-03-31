'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createAssetModel, updateAssetModel } from '@/app/(app)/settings/actions'
import { PartSearchSelect } from './PartSearchSelect'
import type { HwPart } from './EditAssetForm'

interface Category { id: string; name: string; isComputer: boolean }

interface InitialValues {
  categoryId: string
  name: string
  manufacturer: string
  imageData: string | null
  cpuPartId: string
  ramPartId: string
  storagePartId: string
  customDefaults: Record<string, string> | null
}

interface Props {
  mode: 'create' | 'edit'
  modelId?: string
  initialValues?: InitialValues
  categories: Category[]
  hwCpuParts: HwPart[]
  hwRamParts: HwPart[]
  hwStorageParts: HwPart[]
}

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

function cpuGenAdj(gen: string): { pts: number; label: string } {
  const g = parseInt(gen) || 0
  if (g <= 0)  return { pts: 0,  label: '' }
  if (g >= 13) return { pts: +4, label: `+4 pts (${g}ª geração — recente)` }
  if (g >= 10) return { pts: +2, label: `+2 pts (${g}ª geração — moderna)` }
  if (g >= 6)  return { pts:  0, label: `0 pts (${g}ª geração — neutra)` }
  if (g >= 4)  return { pts: -4, label: `-4 pts (${g}ª geração — envelhecendo)` }
  return         { pts: -8, label: `-8 pts (${g}ª geração — obsoleto)` }
}

function ScorePreview({ cpuPart, ramPart, storagePart }: {
  cpuPart?: HwPart | null; ramPart?: HwPart | null; storagePart?: HwPart | null
}) {
  const total = Math.min((cpuPart?.scorePoints ?? 0) + (ramPart?.scorePoints ?? 0) + (storagePart?.scorePoints ?? 0), 100)
  const label = total >= 65 ? 'BOM' : total >= 38 ? 'INTERMEDIÁRIO' : 'RUIM'
  const color = label === 'BOM' ? '#10b981' : label === 'INTERMEDIÁRIO' ? '#fbbf24' : '#f87171'
  const hasData = !!(cpuPart || ramPart || storagePart)

  if (!hasData) return (
    <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: '10px 14px', fontSize: 11, color: '#2d4060', fontFamily: "'JetBrains Mono', monospace", textAlign: 'center' }}>
      Selecione as peças para ver a pontuação estimada
    </div>
  )

  return (
    <div style={{ background: `${color}0a`, border: `1px solid ${color}30`, borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3d5068' }}>PERFORMANCE ESTIMADA</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color }}>
          {label}
        </span>
      </div>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color }}>
        {total}<span style={{ fontSize: 10, color: '#3d5068', fontWeight: 400 }}>/100</span>
      </span>
    </div>
  )
}

export default function AssetModelForm({
  mode, modelId, initialValues, categories, hwCpuParts, hwRamParts, hwStorageParts,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const def = initialValues
  const [categoryId, setCategoryId] = useState(def?.categoryId ?? categories[0]?.id ?? '')
  const [name,         setName]         = useState(def?.name ?? '')
  const [manufacturer, setManufacturer] = useState(def?.manufacturer ?? '')
  const [cpuPartId,    setCpuPartId]    = useState(def?.cpuPartId ?? '')
  const [ramPartId,    setRamPartId]    = useState(def?.ramPartId ?? '')
  const [storagePartId,setStoragePartId]= useState(def?.storagePartId ?? '')
  const [imageData,    setImageData]    = useState<string | null>(def?.imageData ?? null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedCat      = categories.find(c => c.id === categoryId)
  const isComputer       = selectedCat?.isComputer ?? false
  const selectedCpu      = hwCpuParts.find(p => p.id === cpuPartId) ?? null
  const selectedRam      = hwRamParts.find(p => p.id === ramPartId) ?? null
  const selectedStorage  = hwStorageParts.find(p => p.id === storagePartId) ?? null

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setImageData(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleCategoryChange(newCatId: string) {
    setCategoryId(newCatId)
    if (!categories.find(c => c.id === newCatId)?.isComputer) {
      setCpuPartId('')
      setRamPartId('')
      setStoragePartId('')
    }
  }

  const canSubmit = !isPending && !!name.trim() && !!categoryId

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      if (mode === 'create') {
        const res = await createAssetModel({
          categoryId,
          name: name.trim(),
          manufacturer: manufacturer.trim() || undefined,
          imageData: imageData || null,
          cpuPartId: cpuPartId || null,
          ramPartId: ramPartId || null,
          storagePartId: storagePartId || null,
        })
        if (res.ok) router.push('/assets/models')
        else setError(res.error ?? 'Erro ao criar modelo')
      } else {
        const res = await updateAssetModel(modelId!, {
          categoryId,
          name: name.trim(),
          manufacturer: manufacturer.trim() || undefined,
          imageData,
          cpuPartId: cpuPartId || null,
          ramPartId: ramPartId || null,
          storagePartId: storagePartId || null,
        })
        if (res.ok) router.push('/assets/models')
        else setError(res.error ?? 'Erro ao atualizar modelo')
      }
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Section title="IDENTIFICAÇÃO" icon="🏷️">
            <Grid2>
              <Field label="Categoria" required>
                <select
                  value={categoryId}
                  onChange={e => handleCategoryChange(e.target.value)}
                  style={{ ...inp, cursor: 'pointer' }}
                  required
                >
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Fabricante">
                <input style={inp} value={manufacturer} onChange={e => setManufacturer(e.target.value)} placeholder="Ex: Dell, HP, Lenovo…" />
              </Field>
            </Grid2>
            <Field label="Nome do modelo" required>
              <input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Latitude 5520, EliteBook 840…" maxLength={120} required />
            </Field>
          </Section>

          {/* Image upload */}
          <Section title="IMAGEM" icon="🖼️">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {imageData ? (
                <div style={{ position: 'relative', width: '100%', height: 180, background: 'rgba(255,255,255,0.02)', borderRadius: 10, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageData} alt="preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: 12 }} />
                  <button
                    type="button"
                    onClick={() => setImageData(null)}
                    style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 6, background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{ border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 10, padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                >
                  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#2d4060" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060' }}>Clique para selecionar imagem</span>
                  <span style={{ fontSize: 10, color: '#1e3048' }}>PNG, JPG, WebP — máx. 2 MB</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImage}
                style={{ display: 'none' }}
              />
              {!imageData && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ ...inp, textAlign: 'center', cursor: 'pointer', color: '#3d5068', fontSize: 12, background: 'rgba(255,255,255,0.02)', width: 'auto', padding: '8px 14px', borderRadius: 8 }}
                >
                  Selecionar arquivo
                </button>
              )}
            </div>
          </Section>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {isComputer && (
            <Section title="HARDWARE PADRÃO" icon="💻">
              <p style={{ fontSize: 11, color: '#3d5068', lineHeight: 1.5 }}>
                Ao criar um ativo baseado neste modelo, esses componentes serão preenchidos automaticamente.
              </p>

              <Field label="Processador (CPU)" hint="Componente padrão deste modelo">
                <PartSearchSelect
                  parts={hwCpuParts}
                  value={cpuPartId}
                  onChange={setCpuPartId}
                  placeholder="— opcional —"
                  clearable
                />
              </Field>

              <Field label="Memória RAM">
                <PartSearchSelect
                  parts={hwRamParts}
                  value={ramPartId}
                  onChange={setRamPartId}
                  placeholder="— opcional —"
                  clearable
                />
              </Field>

              <Field label="Armazenamento">
                <PartSearchSelect
                  parts={hwStorageParts}
                  value={storagePartId}
                  onChange={setStoragePartId}
                  placeholder="— opcional —"
                  clearable
                />
              </Field>

              <ScorePreview cpuPart={selectedCpu} ramPart={selectedRam} storagePart={selectedStorage} />
            </Section>
          )}

          {!isComputer && (
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: 14, padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
              <span style={{ fontSize: 24, opacity: 0.4 }}>💻</span>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060' }}>
                HARDWARE PADRÃO
              </p>
              <p style={{ fontSize: 12, color: '#1e3048', lineHeight: 1.5 }}>
                Disponível apenas para categorias de equipamentos do tipo computador.<br />
                Marque "É computador" na categoria para ativar.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
        <button type="button" onClick={() => router.push('/assets/models')} disabled={isPending} style={{ padding: '10px 22px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#3d5068', fontSize: 13, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace" }}>
          Cancelar
        </button>
        <button type="submit" disabled={!canSubmit} style={{ padding: '10px 28px', borderRadius: 8, background: canSubmit ? 'rgba(0,217,184,0.12)' : 'rgba(0,217,184,0.04)', border: `1px solid ${canSubmit ? 'rgba(0,217,184,0.3)' : 'rgba(0,217,184,0.12)'}`, color: canSubmit ? '#00d9b8' : '#2d4060', fontSize: 13, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'not-allowed', fontFamily: "'JetBrains Mono', monospace", display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.1s' }}>
          {isPending ? (
            <><div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #00d9b8', borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite' }} />Salvando...</>
          ) : (
            <><svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>{mode === 'create' ? 'Criar modelo' : 'Salvar alterações'}</>
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: #2d4060; }
        input:focus, select:focus, textarea:focus {
          border-color: rgba(0,217,184,0.35) !important;
          box-shadow: 0 0 0 2px rgba(0,217,184,0.08);
        }
      `}</style>
    </form>
  )
}
