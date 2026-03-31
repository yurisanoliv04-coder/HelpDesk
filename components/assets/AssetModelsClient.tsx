'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { deleteAssetModel } from '@/app/(app)/settings/actions'

interface HwPart { id: string; brand: string; model: string; scorePoints: number; notes: string | null }

interface ModelRow {
  id: string
  categoryId: string
  categoryName: string
  isComputerCategory: boolean
  name: string
  manufacturer: string | null
  imageData: string | null
  cpuPartId: string | null
  ramPartId: string | null
  storagePartId: string | null
  customDefaults: Record<string, string> | null
  assetCount: number
  cpuPart: HwPart | null
  ramPart: HwPart | null
  storagePart: HwPart | null
}

interface Category { id: string; name: string; isComputer: boolean }

interface Props {
  models: ModelRow[]
  categories: Category[]
}

function scoreFromParts(cpu: HwPart | null, ram: HwPart | null, storage: HwPart | null) {
  const total = Math.min((cpu?.scorePoints ?? 0) + (ram?.scorePoints ?? 0) + (storage?.scorePoints ?? 0), 100)
  const label = total >= 65 ? 'BOM' : total >= 38 ? 'INTERMEDIÁRIO' : 'RUIM'
  const color = label === 'BOM' ? '#10b981' : label === 'INTERMEDIÁRIO' ? '#fbbf24' : '#f87171'
  return { total, label, color }
}

export default function AssetModelsClient({ models, categories }: Props) {
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const filtered = models.filter(m => {
    const q = search.toLowerCase()
    if (filterCat && m.categoryId !== filterCat) return false
    if (q && !`${m.name} ${m.manufacturer ?? ''} ${m.categoryName}`.toLowerCase().includes(q)) return false
    return true
  })

  function handleDelete(id: string) {
    setDeleteError(null)
    startTransition(async () => {
      const res = await deleteAssetModel(id)
      if (!res.ok) setDeleteError(res.error ?? 'Erro ao excluir')
      setDeletingId(null)
    })
  }

  const inp: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 7, padding: '7px 10px', fontSize: 12, color: '#c8d6e5',
    outline: 'none', fontFamily: 'inherit',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#3d5068" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, fabricante, categoria…"
            style={{ ...inp, padding: '7px 28px', width: '100%', boxSizing: 'border-box' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#3d5068', padding: 2 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          style={{ ...inp, minWidth: 160, cursor: 'pointer', color: filterCat ? '#a78bfa' : '#3d5068', background: filterCat ? 'rgba(167,139,250,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${filterCat ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.08)'}` }}
        >
          <option value="">Todas as categorias</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060' }}>
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {deleteError && (
        <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#f87171' }}>
          ⚠️ {deleteError}
        </div>
      )}

      {/* Delete confirm modal */}
      {deletingId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '28px 32px', width: 380, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e2eaf4' }}>Confirmar exclusão</h3>
            {(() => {
              const m = models.find(x => x.id === deletingId)
              return (
                <p style={{ fontSize: 13, color: '#7e9bb5', lineHeight: 1.5 }}>
                  Tem certeza que deseja excluir o modelo <strong style={{ color: '#c8d6e5' }}>{m?.name}</strong>?
                  {m && m.assetCount > 0 && (
                    <span style={{ display: 'block', marginTop: 8, color: '#fbbf24', fontSize: 12 }}>
                      ⚠️ {m.assetCount} ativo{m.assetCount !== 1 ? 's' : ''} vinculado{m.assetCount !== 1 ? 's' : ''} perderão a referência ao modelo.
                    </span>
                  )}
                </p>
              )
            })()}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeletingId(null)} style={{ padding: '8px 18px', borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#7e9bb5', fontSize: 12, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={() => handleDelete(deletingId)} style={{ padding: '8px 18px', borderRadius: 7, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#2d4060', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
          {models.length === 0 ? 'Nenhum modelo cadastrado ainda.' : 'Nenhum modelo encontrado.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {filtered.map(m => {
            const score = m.isComputerCategory && (m.cpuPart || m.ramPart || m.storagePart)
              ? scoreFromParts(m.cpuPart, m.ramPart, m.storagePart)
              : null

            return (
              <div key={m.id} style={{
                background: '#0b1120', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                transition: 'border-color 0.15s',
              }}>
                {/* Image / placeholder */}
                <div style={{
                  height: 120, background: m.imageData ? 'transparent' : 'rgba(255,255,255,0.02)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative',
                  overflow: 'hidden',
                }}>
                  {m.imageData ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.imageData} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 12, boxSizing: 'border-box' }} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: 0.3 }}>
                      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: '#7e9bb5' }}>
                        <rect x="2" y="3" width="20" height="14" rx="2" />
                        <path d="M8 21h8M12 17v4" strokeLinecap="round" />
                      </svg>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3d5068' }}>SEM IMAGEM</span>
                    </div>
                  )}
                  {/* Score badge */}
                  {score && (
                    <div style={{
                      position: 'absolute', top: 8, right: 8,
                      background: `${score.color}18`, border: `1px solid ${score.color}50`,
                      borderRadius: 6, padding: '2px 8px',
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
                      color: score.color,
                    }}>
                      {score.label} · {score.total}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: '#2d4060', letterSpacing: '0.1em', marginBottom: 4 }}>
                      {m.categoryName.toUpperCase()}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#e2eaf4', lineHeight: 1.2 }}>{m.name}</div>
                    {m.manufacturer && (
                      <div style={{ fontSize: 11, color: '#4a6580', marginTop: 2 }}>{m.manufacturer}</div>
                    )}
                  </div>

                  {/* Hardware specs */}
                  {m.isComputerCategory && (m.cpuPart || m.ramPart || m.storagePart) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {m.cpuPart && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: '#2d4060', width: 40 }}>CPU</span>
                          <span style={{ fontSize: 11, color: '#7e9bb5' }}>{m.cpuPart.brand} {m.cpuPart.model}</span>
                        </div>
                      )}
                      {m.ramPart && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: '#2d4060', width: 40 }}>RAM</span>
                          <span style={{ fontSize: 11, color: '#7e9bb5' }}>{m.ramPart.brand} {m.ramPart.model}</span>
                        </div>
                      )}
                      {m.storagePart && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: '#2d4060', width: 40 }}>DISCO</span>
                          <span style={{ fontSize: 11, color: '#7e9bb5' }}>{m.storagePart.brand} {m.storagePart.model}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Asset count + actions */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <Link
                      href={`/assets?modelId=${m.id}`}
                      style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                        color: m.assetCount > 0 ? '#00d9b8' : '#2d4060',
                        textDecoration: 'none',
                      }}
                    >
                      {m.assetCount} ativo{m.assetCount !== 1 ? 's' : ''}
                    </Link>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link
                        href={`/assets/models/${m.id}/edit`}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6,
                          background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.18)',
                          color: '#a78bfa', fontSize: 11, textDecoration: 'none',
                        }}
                      >
                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar
                      </Link>
                      <button
                        onClick={() => { setDeleteError(null); setDeletingId(m.id) }}
                        title={m.assetCount > 0 ? `Excluir (${m.assetCount} ativo(s) ficará(ão) sem modelo)` : 'Excluir modelo'}
                        style={{
                          display: 'flex', alignItems: 'center', padding: '5px 8px', borderRadius: 6,
                          background: 'rgba(248,113,113,0.04)', border: '1px solid rgba(248,113,113,0.15)',
                          color: '#f87171', fontSize: 11, cursor: 'pointer',
                        }}
                      >
                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <polyline points="3 6 5 6 21 6" /><path strokeLinecap="round" d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path strokeLinecap="round" d="M10 11v6M14 11v6M9 6V4h6v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
