'use client'

import { useState, useTransition } from 'react'
import {
  createTicketCategory, createTicketSubcategory,
  updateTicketCategory, deleteTicketCategory,
  toggleTicketCategoryActive,
  createAssetCategory, toggleAssetCategoryActive,
} from '@/app/(app)/settings/actions'

interface TicketCategory {
  id: string; name: string; description: string | null
  active: boolean; _count: { tickets: number }
  children: Array<{ id: string; name: string; description: string | null; active: boolean; _count: { tickets: number } }>
}
interface AssetCategory {
  id: string; name: string; icon: string | null
  active: boolean; _count: { assets: number }
}
interface Props { ticketCategories: TicketCategory[]; assetCategories: AssetCategory[] }

const iStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '7px 10px', fontSize: 13, color: '#c8d6e5',
  outline: 'none', boxSizing: 'border-box',
}
const ICON_OPTIONS = ['laptop', 'monitor', 'printer', 'keyboard', 'mouse-pointer', 'headphones', 'battery', 'network', 'smartphone', 'package', 'cpu', 'hard-drive', 'server', 'tablet', 'camera']

// ── Chevron SVG ────────────────────────────────────────────────────────────────
function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transition: 'transform 0.2s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0 }}>
      <path d="M4 2.5L7.5 6L4 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color,
      background: `${color}12`, border: `1px solid ${color}25`,
      borderRadius: 5, padding: '2px 7px', flexShrink: 0, letterSpacing: '0.05em',
    }}>{label}</span>
  )
}

export default function CategoriesTab({ ticketCategories, assetCategories }: Props) {
  const [sub, setSub] = useState<'chamados' | 'ativos'>('chamados')
  const [isPending, startTransition] = useTransition()

  // Expanded/collapsed per parent (default: all expanded)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(ticketCategories.map(c => c.id)))

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  function expandAll() { setExpanded(new Set(ticketCategories.map(c => c.id))) }
  function collapseAll() { setExpanded(new Set()) }

  // Ticket create form
  const [tName, setTName] = useState(''); const [tDesc, setTDesc] = useState('')
  const [tError, setTError] = useState<string | null>(null); const [tSuccess, setTSuccess] = useState(false)

  // Asset create form
  const [aName, setAName] = useState(''); const [aIcon, setAIcon] = useState('')
  const [aError, setAError] = useState<string | null>(null); const [aSuccess, setASuccess] = useState(false)

  // Inline edit
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState(''); const [editDesc, setEditDesc] = useState('')
  const [editError, setEditError] = useState<string | null>(null)

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Subcategory form
  const [subParentId, setSubParentId] = useState<string | null>(null)
  const [subName, setSubName] = useState(''); const [subDesc, setSubDesc] = useState('')
  const [subError, setSubError] = useState<string | null>(null)

  function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault(); setTError(null); setTSuccess(false)
    startTransition(async () => {
      const r = await createTicketCategory(tName, tDesc)
      if (r.ok) { setTName(''); setTDesc(''); setTSuccess(true); setTimeout(() => setTSuccess(false), 3000) }
      else setTError(r.error ?? 'Erro')
    })
  }

  function handleCreateAsset(e: React.FormEvent) {
    e.preventDefault(); setAError(null); setASuccess(false)
    startTransition(async () => {
      const r = await createAssetCategory(aName, aIcon)
      if (r.ok) { setAName(''); setAIcon(''); setASuccess(true); setTimeout(() => setASuccess(false), 3000) }
      else setAError(r.error ?? 'Erro')
    })
  }

  function startEdit(id: string, name: string, desc: string | null) {
    setEditId(id); setEditName(name); setEditDesc(desc ?? ''); setEditError(null)
  }

  function handleUpdate() {
    setEditError(null)
    startTransition(async () => {
      const r = await updateTicketCategory(editId!, editName, editDesc)
      if (r.ok) setEditId(null)
      else setEditError(r.error ?? 'Erro')
    })
  }

  function handleDelete() {
    setDeleteError(null)
    startTransition(async () => {
      const r = await deleteTicketCategory(deleteId!)
      if (r.ok) setDeleteId(null)
      else setDeleteError(r.error ?? 'Erro')
    })
  }

  function handleCreateSub() {
    setSubError(null)
    startTransition(async () => {
      const r = await createTicketSubcategory(subParentId!, subName, subDesc)
      if (r.ok) {
        setSubParentId(null); setSubName(''); setSubDesc('')
        // auto-expand parent
        setExpanded(prev => new Set([...prev, subParentId!]))
      } else setSubError(r.error ?? 'Erro')
    })
  }

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: '7px 18px', borderRadius: 7, fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer',
    background: active ? 'rgba(0,217,184,0.12)' : 'transparent',
    border: `1px solid ${active ? 'rgba(0,217,184,0.3)' : 'rgba(255,255,255,0.07)'}`,
    color: active ? '#00d9b8' : '#3d5068', fontFamily: "'JetBrains Mono', monospace", transition: 'all 0.1s',
  })

  const allCats = ticketCategories.flatMap(c => [c, ...c.children])
  const deletingCat = allCats.find(c => c.id === deleteId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <button style={tabBtn(sub === 'chamados')} onClick={() => setSub('chamados')}>Chamados</button>
        <button style={tabBtn(sub === 'ativos')} onClick={() => setSub('ativos')}>Ativos / Patrimônio</button>
      </div>

      {/* ══════════════════════════════════════ CHAMADOS ══════════════════════════════════════ */}
      {sub === 'chamados' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Create form */}
          <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '18px 22px' }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#3d5068', letterSpacing: '0.1em', marginBottom: 14 }}>NOVA CATEGORIA DE CHAMADO</p>
            <form onSubmit={handleCreateTicket} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700 }}>NOME *</label>
                <input value={tName} onChange={e => setTName(e.target.value)} placeholder="Ex: Suporte de Hardware" style={iStyle} required />
              </div>
              <div style={{ flex: '2 1 240px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700 }}>DESCRIÇÃO</label>
                <input value={tDesc} onChange={e => setTDesc(e.target.value)} placeholder="Breve descrição" style={iStyle} />
              </div>
              <button type="submit" disabled={isPending || !tName.trim()} style={{
                padding: '9px 22px', borderRadius: 8, height: 38, flexShrink: 0,
                background: 'rgba(0,217,184,0.12)', border: '1px solid rgba(0,217,184,0.3)',
                color: '#00d9b8', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace", opacity: !tName.trim() ? 0.4 : 1,
              }}>+ Adicionar</button>
            </form>
            {tError && <p style={{ fontSize: 12, color: '#f87171', marginTop: 8 }}>⚠ {tError}</p>}
            {tSuccess && <p style={{ fontSize: 12, color: '#34d399', marginTop: 8 }}>✓ Categoria criada</p>}
          </div>

          {/* Delete confirm */}
          {deleteId && deletingCat && (
            <div style={{ background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: '14px 20px' }}>
              <p style={{ fontSize: 13, color: '#f87171', fontWeight: 600, marginBottom: 6 }}>Excluir "{deletingCat.name}"?</p>
              <p style={{ fontSize: 12, color: '#8ba5c0', marginBottom: 10 }}>
                {deletingCat._count.tickets > 0 ? `⚠ Possui ${deletingCat._count.tickets} chamado(s) vinculado(s). Não é possível excluir.` : 'Esta ação é irreversível.'}
              </p>
              {deleteError && <p style={{ fontSize: 12, color: '#f87171', marginBottom: 8 }}>⚠ {deleteError}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleDelete} disabled={isPending || deletingCat._count.tickets > 0} style={{ padding: '6px 16px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', opacity: deletingCat._count.tickets > 0 ? 0.4 : 1, fontFamily: "'JetBrains Mono', monospace" }}>Confirmar exclusão</button>
                <button onClick={() => setDeleteId(null)} disabled={isPending} style={{ padding: '6px 14px', borderRadius: 7, fontSize: 11, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#3d5068', fontFamily: "'JetBrains Mono', monospace" }}>Cancelar</button>
              </div>
            </div>
          )}

          {/* List */}
          <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>

            {/* List toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#2d4060', letterSpacing: '0.1em' }}>
                {ticketCategories.length} CATEGORIAS
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={expandAll} style={{ padding: '3px 10px', borderRadius: 5, fontSize: 10, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,255,255,0.07)', color: '#3d5068', fontFamily: "'JetBrains Mono', monospace" }}>
                  Expandir tudo
                </button>
                <button onClick={collapseAll} style={{ padding: '3px 10px', borderRadius: 5, fontSize: 10, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,255,255,0.07)', color: '#3d5068', fontFamily: "'JetBrains Mono', monospace" }}>
                  Recolher tudo
                </button>
              </div>
            </div>

            {ticketCategories.length === 0 ? (
              <div style={{ padding: '48px 22px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#2d4060' }}>Nenhuma categoria cadastrada</div>
            ) : ticketCategories.map((cat, ci) => {
              const isOpen = expanded.has(cat.id)
              const isLast = ci === ticketCategories.length - 1

              return (
                <div key={cat.id} style={{ borderBottom: isLast ? 'none' : '2px solid rgba(255,255,255,0.05)' }}>

                  {/* ── PARENT ROW ── */}
                  {editId === cat.id ? (
                    <EditRow
                      name={editName} desc={editDesc} setName={setEditName} setDesc={setEditDesc}
                      error={editError} onSave={handleUpdate} onCancel={() => setEditId(null)}
                      isPending={isPending} isParent
                    />
                  ) : (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 0,
                      padding: '14px 20px',
                      background: cat.active ? 'rgba(255,255,255,0.015)' : 'transparent',
                      opacity: cat.active ? 1 : 0.5,
                      cursor: 'default',
                    }}>
                      {/* Collapse toggle */}
                      <button
                        onClick={() => toggleExpand(cat.id)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                          color: '#3d5068', display: 'flex', alignItems: 'center', marginRight: 8, flexShrink: 0,
                        }}
                        title={isOpen ? 'Recolher' : 'Expandir'}
                      >
                        <Chevron open={isOpen} />
                      </button>

                      {/* Name + meta */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#c8d6e5' }}>{cat.name}</p>
                          {cat.children.length > 0 && (
                            <Chip label={`${cat.children.length} subs`} color="#a78bfa" />
                          )}
                          <Chip label={`${cat._count.tickets} chamados`} color="#38bdf8" />
                          <Chip label={cat.active ? 'Ativa' : 'Inativa'} color={cat.active ? '#34d399' : '#f87171'} />
                        </div>
                        {cat.description && (
                          <p style={{ fontSize: 11, color: '#3d5068', marginTop: 3 }}>{cat.description}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 5, flexShrink: 0, marginLeft: 12 }}>
                        <CatBtn label="+ Sub" color="#a78bfa" onClick={() => { setSubParentId(cat.id); setSubName(''); setSubDesc(''); setSubError(null) }} disabled={isPending} />
                        <CatBtn label="Editar" color="#38bdf8" onClick={() => startEdit(cat.id, cat.name, cat.description)} disabled={isPending} />
                        <CatBtn label={cat.active ? 'Desativar' : 'Ativar'} color={cat.active ? '#f87171' : '#34d399'} onClick={() => startTransition(() => toggleTicketCategoryActive(cat.id))} disabled={isPending} />
                        <CatBtn label="Excluir" color="#f87171" onClick={() => { setDeleteId(cat.id); setDeleteError(null) }} disabled={isPending} />
                      </div>
                    </div>
                  )}

                  {/* ── SUBCATEGORY FORM ── */}
                  {subParentId === cat.id && (
                    <div style={{ padding: '12px 20px 12px 56px', background: 'rgba(167,139,250,0.04)', borderTop: '1px solid rgba(167,139,250,0.12)' }}>
                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#a78bfa', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8 }}>
                        NOVA SUBCATEGORIA EM "{cat.name.toUpperCase()}"
                      </p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <input value={subName} onChange={e => setSubName(e.target.value)} placeholder="Nome da subcategoria" style={{ ...iStyle, flex: '1 1 160px' }} />
                        <input value={subDesc} onChange={e => setSubDesc(e.target.value)} placeholder="Descrição (opcional)" style={{ ...iStyle, flex: '2 1 200px' }} />
                        <button onClick={handleCreateSub} disabled={isPending || !subName.trim()} style={{ padding: '7px 16px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0, opacity: !subName.trim() ? 0.4 : 1 }}>Criar</button>
                        <button onClick={() => setSubParentId(null)} disabled={isPending} style={{ padding: '7px 12px', borderRadius: 7, fontSize: 11, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#3d5068', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>✕</button>
                      </div>
                      {subError && <p style={{ fontSize: 11, color: '#f87171', marginTop: 6 }}>⚠ {subError}</p>}
                    </div>
                  )}

                  {/* ── CHILDREN (shown when expanded) ── */}
                  {isOpen && cat.children.length > 0 && (
                    <div style={{ background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      {cat.children.map((child, ci2) => (
                        editId === child.id ? (
                          <EditRow
                            key={child.id}
                            name={editName} desc={editDesc} setName={setEditName} setDesc={setEditDesc}
                            error={editError} onSave={handleUpdate} onCancel={() => setEditId(null)}
                            isPending={isPending} isParent={false}
                          />
                        ) : (
                          <div key={child.id} style={{
                            display: 'flex', alignItems: 'center', gap: 0,
                            padding: '10px 20px 10px 56px',
                            borderBottom: ci2 < cat.children.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                            opacity: child.active ? 1 : 0.45,
                          }}>
                            <span style={{ color: '#1e3048', fontSize: 14, marginRight: 10, flexShrink: 0, lineHeight: 1 }}>└</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <p style={{ fontSize: 13, fontWeight: 500, color: '#8ba5c0' }}>{child.name}</p>
                                <Chip label={`${child._count.tickets}`} color="#38bdf8" />
                                <Chip label={child.active ? 'Ativa' : 'Inativa'} color={child.active ? '#34d399' : '#f87171'} />
                              </div>
                              {child.description && (
                                <p style={{ fontSize: 11, color: '#2d4060', marginTop: 2 }}>{child.description}</p>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: 5, flexShrink: 0, marginLeft: 12 }}>
                              <CatBtn label="Editar" color="#38bdf8" onClick={() => startEdit(child.id, child.name, child.description)} disabled={isPending} />
                              <CatBtn label={child.active ? 'Desativar' : 'Ativar'} color={child.active ? '#f87171' : '#34d399'} onClick={() => startTransition(() => toggleTicketCategoryActive(child.id))} disabled={isPending} />
                              <CatBtn label="Excluir" color="#f87171" onClick={() => { setDeleteId(child.id); setDeleteError(null) }} disabled={isPending} />
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  )}

                  {/* Collapsed indicator */}
                  {!isOpen && cat.children.length > 0 && (
                    <div style={{ padding: '5px 20px 5px 56px', background: 'rgba(167,139,250,0.03)' }}>
                      <span style={{ fontSize: 10, color: '#2d4060', fontFamily: "'JetBrains Mono', monospace" }}>
                        {cat.children.length} subcategoria(s) recolhida(s) — clique em ▶ para expandir
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════ ATIVOS ══════════════════════════════════════ */}
      {sub === 'ativos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '18px 22px' }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#3d5068', letterSpacing: '0.1em', marginBottom: 14 }}>NOVA CATEGORIA DE ATIVO</p>
            <form onSubmit={handleCreateAsset} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
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
              <button type="submit" disabled={isPending || !aName.trim()} style={{ padding: '9px 22px', borderRadius: 8, height: 38, flexShrink: 0, background: 'rgba(0,217,184,0.12)', border: '1px solid rgba(0,217,184,0.3)', color: '#00d9b8', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", opacity: !aName.trim() ? 0.4 : 1 }}>+ Adicionar</button>
            </form>
            {aError && <p style={{ fontSize: 12, color: '#f87171', marginTop: 8 }}>⚠ {aError}</p>}
            {aSuccess && <p style={{ fontSize: 12, color: '#34d399', marginTop: 8 }}>✓ Categoria criada</p>}
          </div>
          <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px 80px 100px', columnGap: 14, padding: '0 20px', height: 38, alignItems: 'center', borderBottom: '2px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              {['NOME', 'ÍCONE', 'ATIVOS', 'STATUS', 'AÇÃO'].map((h, i) => (
                <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#2d4060', letterSpacing: '0.1em' }}>{h}</div>
              ))}
            </div>
            {assetCategories.length === 0 ? (
              <div style={{ padding: '48px 22px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#2d4060' }}>Nenhuma categoria cadastrada</div>
            ) : assetCategories.map((c, i) => (
              <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px 80px 100px', columnGap: 14, padding: '13px 20px', alignItems: 'center', borderBottom: i < assetCategories.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', opacity: c.active ? 1 : 0.5 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#c8d6e5' }}>{c.name}</p>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#4a6580' }}>{c.icon ?? '—'}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: '#38bdf8' }}>{c._count.assets}</span>
                <Chip label={c.active ? 'Ativa' : 'Inativa'} color={c.active ? '#34d399' : '#f87171'} />
                <button onClick={() => startTransition(() => toggleAssetCategoryActive(c.id))} disabled={isPending} style={{ padding: '5px 10px', borderRadius: 6, fontSize: 10, cursor: 'pointer', background: c.active ? 'rgba(248,113,113,0.08)' : 'rgba(52,211,153,0.08)', border: `1px solid ${c.active ? 'rgba(248,113,113,0.2)' : 'rgba(52,211,153,0.2)'}`, color: c.active ? '#f87171' : '#34d399', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                  {c.active ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function CatBtn({ label, color, onClick, disabled }: {
  label: string; color: string; onClick: () => void; disabled: boolean
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: disabled ? 'default' : 'pointer',
      background: `${color}12`, border: `1px solid ${color}28`, color,
      fontFamily: "'JetBrains Mono', monospace", transition: 'all 0.1s', opacity: disabled ? 0.5 : 1,
      flexShrink: 0, whiteSpace: 'nowrap',
    }}>{label}</button>
  )
}

function EditRow({ name, desc, setName, setDesc, error, onSave, onCancel, isPending, isParent }: {
  name: string; desc: string; setName: (v: string) => void; setDesc: (v: string) => void
  error: string | null; onSave: () => void; onCancel: () => void; isPending: boolean; isParent: boolean
}) {
  const iStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 7, padding: '7px 10px', fontSize: 13, color: '#c8d6e5', outline: 'none', boxSizing: 'border-box',
  }
  return (
    <div style={{ padding: `12px 20px 12px ${isParent ? 20 : 56}px`, background: 'rgba(0,217,184,0.03)', borderLeft: '2px solid rgba(0,217,184,0.3)' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome" style={{ ...iStyle, flex: '1 1 160px' }} />
        <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descrição" style={{ ...iStyle, flex: '2 1 200px' }} />
        <button onClick={onSave} disabled={isPending || !name.trim()} style={{ padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'rgba(0,217,184,0.12)', border: '1px solid rgba(0,217,184,0.3)', color: '#00d9b8', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>✓ Salvar</button>
        <button onClick={onCancel} disabled={isPending} style={{ padding: '7px 12px', borderRadius: 7, fontSize: 12, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#3d5068', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>✕</button>
      </div>
      {error && <p style={{ fontSize: 11, color: '#f87171', marginTop: 6 }}>⚠ {error}</p>}
    </div>
  )
}
