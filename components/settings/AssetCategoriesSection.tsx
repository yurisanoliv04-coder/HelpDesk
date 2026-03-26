'use client'

import { useState, useTransition } from 'react'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import {
  createAssetCategory, toggleAssetCategoryActive,
  updateAssetCategory, deleteAssetCategory,
  getAssetCategoryDeleteImpact,
} from '@/app/(app)/settings/actions'
import type { CategoryDeleteImpact } from '@/app/(app)/settings/actions'

type AssetCategoryKind = 'EQUIPMENT' | 'ACCESSORY' | 'DISPOSABLE'

const KIND_OPTIONS: { value: AssetCategoryKind; label: string; color: string }[] = [
  { value: 'EQUIPMENT',  label: 'Equipamento', color: '#38bdf8' },
  { value: 'ACCESSORY',  label: 'Acessório',   color: '#a78bfa' },
  { value: 'DISPOSABLE', label: 'Consumível',  color: '#fb923c' },
]

const ICON_OPTIONS = [
  'laptop', 'monitor', 'printer', 'keyboard', 'mouse-pointer', 'headphones',
  'battery', 'network', 'smartphone', 'package', 'cpu', 'hard-drive', 'server', 'tablet', 'camera',
]

interface AssetCategory {
  id: string
  name: string
  icon: string | null
  active: boolean
  kind: AssetCategoryKind
  stockQuantity: number
  stockMinQty: number
  _count: { assets: number }
}

interface Props {
  assetCategories: AssetCategory[]
  lockedKind?: AssetCategoryKind
}

const iStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '7px 10px', fontSize: 13, color: '#c8d6e5',
  outline: 'none', boxSizing: 'border-box',
}

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

function ImpactLine({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: 5, background: `${color}18`, border: `1px solid ${color}30`, fontSize: 11, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 12, color: '#8ba5c0' }}>
        <strong style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</strong>{' '}{label}
      </span>
    </div>
  )
}

/** Badge de quantidade — tamanho maior, com alerta se abaixo do mínimo */
function StockBadge({ qty, minQty }: { qty: number; minQty: number }) {
  const isAlert = minQty > 0 && qty <= minQty
  const isEmpty = qty === 0

  const col = isEmpty ? '#f87171' : isAlert ? '#fbbf24' : '#34d399'
  const lbl = isEmpty ? 'sem estoque' : qty === 1 ? '1 unid.' : `${qty} unid.`

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700,
      color: col, background: `${col}14`, border: `1px solid ${col}35`,
      borderRadius: 6, padding: '3px 10px', lineHeight: 1.4,
    }}>
      {isAlert && !isEmpty && (
        <span title={`Estoque abaixo do mínimo (${minQty} unid.)`} style={{ fontSize: 12 }}>⚠</span>
      )}
      {isEmpty && <span style={{ fontSize: 12 }}>✕</span>}
      {lbl}
      {isAlert && !isEmpty && (
        <span style={{ fontSize: 9, color: '#fbbf24', opacity: 0.75, fontWeight: 400 }}>mín. {minQty}</span>
      )}
    </span>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function AssetCategoriesSection({ assetCategories, lockedKind }: Props) {
  const [isPending, startTransition] = useTransition()

  const hasStock = lockedKind === 'ACCESSORY' || lockedKind === 'DISPOSABLE'

  // ── create form ──
  const [aName, setAName] = useState('')
  const [aIcon, setAIcon] = useState('')
  const [aKind, setAKind] = useState<AssetCategoryKind>(lockedKind ?? 'EQUIPMENT')
  const [aError, setAError] = useState<string | null>(null)
  const [aSuccess, setASuccess] = useState(false)

  // ── inline edit ──
  const [editCatId, setEditCatId] = useState<string | null>(null)
  const [editCatName, setEditCatName] = useState('')
  const [editCatIcon, setEditCatIcon] = useState('')
  const [editCatKind, setEditCatKind] = useState<AssetCategoryKind>('EQUIPMENT')
  const [editCatStock, setEditCatStock] = useState('')
  const [editCatMinQty, setEditCatMinQty] = useState('')
  const [editCatError, setEditCatError] = useState<string | null>(null)

  // ── delete flow ──
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null)
  const [deleteImpact, setDeleteImpact] = useState<CategoryDeleteImpact | null>(null)
  const [deleteImpactLoading, setDeleteImpactLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const deletingCat = assetCategories.find(c => c.id === deleteCatId)

  function openEdit(c: AssetCategory) {
    setEditCatId(c.id)
    setEditCatName(c.name)
    setEditCatIcon(c.icon ?? '')
    setEditCatKind(c.kind ?? 'EQUIPMENT')
    setEditCatStock(String(c.stockQuantity))
    setEditCatMinQty(String(c.stockMinQty))
    setEditCatError(null)
  }

  function handleOpenDelete(catId: string) {
    setDeleteCatId(catId)
    setDeleteImpact(null)
    setDeleteError(null)
    setDeleteImpactLoading(true)
    getAssetCategoryDeleteImpact(catId).then(r => {
      setDeleteImpactLoading(false)
      if (r.ok && r.data) setDeleteImpact(r.data)
      else setDeleteError(r.error ?? 'Não foi possível carregar o impacto')
    })
  }

  function handleCancelDelete() {
    setDeleteCatId(null)
    setDeleteImpact(null)
    setDeleteError(null)
  }

  function handleDelete(force: boolean) {
    setDeleteError(null)
    startTransition(async () => {
      const r = await deleteAssetCategory(deleteCatId!, force)
      if (r.ok) handleCancelDelete()
      else setDeleteError(r.error ?? 'Erro ao excluir')
    })
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setAError(null); setASuccess(false)
    startTransition(async () => {
      const r = await createAssetCategory(aName, aIcon, aKind)
      if (r.ok) { setAName(''); setAIcon(''); setAKind(lockedKind ?? 'EQUIPMENT'); setASuccess(true); setTimeout(() => setASuccess(false), 3000) }
      else setAError(r.error ?? 'Erro')
    })
  }

  function handleUpdate() {
    setEditCatError(null)
    const isStock = editCatKind === 'ACCESSORY' || editCatKind === 'DISPOSABLE'
    const stockQty   = isStock ? parseInt(editCatStock,  10) || 0 : undefined
    const stockMin   = isStock ? parseInt(editCatMinQty, 10) || 0 : undefined
    startTransition(async () => {
      const r = await updateAssetCategory(editCatId!, editCatName, editCatIcon, editCatKind, stockQty, stockMin)
      if (r.ok) setEditCatId(null)
      else setEditCatError(r.error ?? 'Erro')
    })
  }

  const hasAssets = (deleteImpact?.assetCount ?? 0) > 0
  const hasOther  = (deleteImpact?.modelCount ?? 0) + (deleteImpact?.fieldCount ?? 0) > 0

  // ── categorias com alerta de estoque baixo ──
  const alertCount = assetCategories.filter(c =>
    c.stockMinQty > 0 && c.stockQuantity <= c.stockMinQty
  ).length

  const isEditStock = editCatKind === 'ACCESSORY' || editCatKind === 'DISPOSABLE' ||
                      lockedKind === 'ACCESSORY' || lockedKind === 'DISPOSABLE'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Banner de alertas de estoque baixo ──────────────────────────── */}
      {hasStock && alertCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.28)',
          borderRadius: 10, padding: '10px 16px',
        }}>
          <span style={{ fontSize: 18 }}>⚠</span>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', lineHeight: 1.2 }}>
              {alertCount === 1 ? '1 categoria' : `${alertCount} categorias`} com estoque abaixo do mínimo
            </p>
            <p style={{ fontSize: 11, color: '#7a6030', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
              Clique em Editar para atualizar as quantidades.
            </p>
          </div>
        </div>
      )}

      {/* ── Formulário criar ─────────────────────────────────────────────── */}
      <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '18px 22px' }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#3d5068', letterSpacing: '0.1em', marginBottom: 14 }}>
          NOVA CATEGORIA
        </p>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
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
        {aError   && <p style={{ fontSize: 12, color: '#f87171', marginTop: 8 }}>⚠ {aError}</p>}
        {aSuccess && <p style={{ fontSize: 12, color: '#34d399', marginTop: 8 }}>✓ Categoria criada com sucesso</p>}
      </div>

      {/* ── Painel de exclusão ───────────────────────────────────────────── */}
      {deleteCatId && deletingCat && (
        <div style={{ background: 'rgba(248,113,113,0.04)', border: '1px solid rgba(248,113,113,0.22)', borderRadius: 12, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)', fontSize: 14, flexShrink: 0 }}>🗑</span>
            <div>
              <p style={{ fontSize: 13, color: '#f87171', fontWeight: 700, lineHeight: 1.2 }}>Excluir categoria "{deletingCat.name}"?</p>
              <p style={{ fontSize: 11, color: '#5a7a96', marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>Esta ação é irreversível.</p>
            </div>
          </div>
          {deleteImpactLoading && <p style={{ fontSize: 12, color: '#3d5068', fontFamily: "'JetBrains Mono', monospace" }}>Calculando impacto…</p>}
          {deleteImpact && (
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
              <p style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#3d5068', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 2 }}>O QUE SERÁ EXCLUÍDO PERMANENTEMENTE</p>
              {deleteImpact.assetCount === 0 && deleteImpact.modelCount === 0 && deleteImpact.fieldCount === 0 && deleteImpact.movementCount === 0 ? (
                <p style={{ fontSize: 12, color: '#34d399' }}>✓ Nenhum dado vinculado. Exclusão segura.</p>
              ) : (<>
                {deleteImpact.assetCount    > 0 && <ImpactLine icon="📦" value={deleteImpact.assetCount}    label={deleteImpact.assetCount    === 1 ? 'ativo registrado'      : 'ativos registrados'}      color="#f87171" />}
                {deleteImpact.movementCount > 0 && <ImpactLine icon="🔄" value={deleteImpact.movementCount} label={deleteImpact.movementCount  === 1 ? 'movimentação de ativo' : 'movimentações de ativos'} color="#fb923c" />}
                {deleteImpact.modelCount    > 0 && <ImpactLine icon="🖥"  value={deleteImpact.modelCount}    label={deleteImpact.modelCount    === 1 ? 'modelo de equipamento' : 'modelos de equipamento'}  color="#fbbf24" />}
                {deleteImpact.fieldCount    > 0 && <ImpactLine icon="📋" value={deleteImpact.fieldCount}    label={deleteImpact.fieldCount    === 1 ? 'campo personalizado'   : 'campos personalizados'}   color="#a78bfa" />}
              </>)}
            </div>
          )}
          {deleteError && <p style={{ fontSize: 12, color: '#f87171' }}>⚠ {deleteError}</p>}
          {deleteImpact && (
            <div style={{ display: 'flex', gap: 8 }}>
              {(hasAssets || hasOther) ? (
                <button onClick={() => handleDelete(true)} disabled={isPending} style={{ padding: '6px 16px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: isPending ? 'default' : 'pointer', background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.4)', color: '#f87171', fontFamily: "'JetBrains Mono', monospace", opacity: isPending ? 0.5 : 1 }}>
                  ⚠ Excluir mesmo assim
                </button>
              ) : (
                <button onClick={() => handleDelete(false)} disabled={isPending} style={{ padding: '6px 16px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: isPending ? 'default' : 'pointer', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontFamily: "'JetBrains Mono', monospace", opacity: isPending ? 0.5 : 1 }}>
                  Confirmar exclusão
                </button>
              )}
              <button onClick={handleCancelDelete} disabled={isPending} style={{ padding: '6px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#3d5068', fontFamily: "'JetBrains Mono', monospace" }}>
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Lista ────────────────────────────────────────────────────────── */}
      {assetCategories.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#2d4060' }}>
          Nenhuma categoria cadastrada
        </div>
      ) : (
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
          {assetCategories.map((c, i) => (
            <div key={c.id} style={{
              borderBottom: i < assetCategories.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}>
              {editCatId === c.id ? (
                /* ── form de edição inline ── */
                <div style={{ padding: '14px 16px', background: 'rgba(0,217,184,0.03)', borderLeft: '2px solid rgba(0,217,184,0.3)' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    {/* nome */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 140px' }}>
                      <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3d5068', fontWeight: 700 }}>NOME</label>
                      <input value={editCatName} onChange={e => setEditCatName(e.target.value)} placeholder="Nome" style={iStyle} />
                    </div>
                    {/* ícone */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '0 0 130px' }}>
                      <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3d5068', fontWeight: 700 }}>ÍCONE</label>
                      <select value={editCatIcon} onChange={e => setEditCatIcon(e.target.value)} style={iStyle}>
                        <option value="">— nenhum —</option>
                        {ICON_OPTIONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                      </select>
                    </div>
                    {/* tipo */}
                    {!lockedKind && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '0 0 130px' }}>
                        <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3d5068', fontWeight: 700 }}>TIPO</label>
                        <select value={editCatKind} onChange={e => setEditCatKind(e.target.value as AssetCategoryKind)} style={iStyle}>
                          {KIND_OPTIONS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
                        </select>
                      </div>
                    )}
                    {/* estoque — só para ACCESSORY / DISPOSABLE */}
                    {isEditStock && (<>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '0 0 80px' }}>
                        <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3d5068', fontWeight: 700 }}>ESTOQUE</label>
                        <input
                          type="number" min="0" step="1"
                          value={editCatStock}
                          onChange={e => setEditCatStock(e.target.value)}
                          style={{ ...iStyle, textAlign: 'center' as const }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '0 0 80px' }}>
                        <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#fbbf24', fontWeight: 700 }}>MÍN. ⚠</label>
                        <input
                          type="number" min="0" step="1"
                          value={editCatMinQty}
                          onChange={e => setEditCatMinQty(e.target.value)}
                          placeholder="0"
                          style={{ ...iStyle, textAlign: 'center' as const, borderColor: 'rgba(251,191,36,0.25)' }}
                        />
                      </div>
                    </>)}
                    {/* ações */}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', paddingBottom: 1 }}>
                      <button onClick={handleUpdate} disabled={isPending || !editCatName.trim()} style={{ padding: '7px 16px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: 'rgba(0,217,184,0.12)', border: '1px solid rgba(0,217,184,0.3)', color: '#00d9b8', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0, height: 36 }}>✓ Salvar</button>
                      <button onClick={() => setEditCatId(null)} disabled={isPending} style={{ padding: '7px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#3d5068', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0, height: 36 }}>✕</button>
                    </div>
                  </div>
                  {isEditStock && (
                    <p style={{ fontSize: 10, color: '#4a6070', marginTop: 8, fontFamily: "'JetBrains Mono', monospace" }}>
                      ⚠ Mín. = Alerta quando estoque atingir ou ficar abaixo desse número. Use 0 para desativar.
                    </p>
                  )}
                  {editCatError && <p style={{ fontSize: 11, color: '#f87171', marginTop: 6 }}>⚠ {editCatError}</p>}
                </div>
              ) : (
                /* ── linha normal ── */
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
                  opacity: c.active ? 1 : 0.5,
                  background: deleteCatId === c.id ? 'rgba(248,113,113,0.04)' : 'transparent',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {c.icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}><CategoryIcon name={c.icon} size={15} color="#4a6580" /></span>}
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#c8d6e5' }}>{c.name}</p>

                      {/* badge de ativos — EQUIPMENT */}
                      {!hasStock && (
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#38bdf8', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 5, padding: '2px 8px' }}>
                          {c._count.assets} ativos
                        </span>
                      )}

                      {/* badge de estoque grande — ACCESSORY / DISPOSABLE */}
                      {hasStock && (
                        <StockBadge qty={c.stockQuantity} minQty={c.stockMinQty} />
                      )}

                      {/* kind badge (quando não bloqueado) */}
                      {!lockedKind && (() => {
                        const kc = KIND_OPTIONS.find(k => k.value === (c.kind ?? 'EQUIPMENT'))
                        return kc ? <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: kc.color, background: `${kc.color}12`, border: `1px solid ${kc.color}30`, borderRadius: 4, padding: '1px 6px' }}>{kc.label}</span> : null
                      })()}

                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: c.active ? '#34d399' : '#f87171', background: c.active ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)', border: `1px solid ${c.active ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`, borderRadius: 4, padding: '1px 6px' }}>
                        {c.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    <SmallBtn label="Editar" color="#38bdf8" onClick={() => openEdit(c)} disabled={isPending} />
                    <SmallBtn label={c.active ? 'Desativar' : 'Ativar'} color={c.active ? '#f87171' : '#34d399'} onClick={() => startTransition(() => toggleAssetCategoryActive(c.id))} disabled={isPending} />
                    <SmallBtn label="Excluir" color="#f87171" onClick={() => handleOpenDelete(c.id)} disabled={isPending} />
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
