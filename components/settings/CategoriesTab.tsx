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

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '7px 10px', fontSize: 13, color: '#c8d6e5',
  outline: 'none', boxSizing: 'border-box',
}
const ICON_OPTIONS = ['laptop', 'monitor', 'printer', 'keyboard', 'mouse-pointer', 'headphones', 'battery', 'network', 'smartphone', 'package', 'cpu', 'hard-drive', 'server', 'tablet', 'camera']

export default function CategoriesTab({ ticketCategories, assetCategories }: Props) {
  const [sub, setSub] = useState<'chamados' | 'ativos'>('chamados')
  const [isPending, startTransition] = useTransition()

  // ── Ticket create form ──
  const [tName, setTName] = useState(''); const [tDesc, setTDesc] = useState('')
  const [tError, setTError] = useState<string | null>(null); const [tSuccess, setTSuccess] = useState(false)

  // ── Asset create form ──
  const [aName, setAName] = useState(''); const [aIcon, setAIcon] = useState('')
  const [aError, setAError] = useState<string | null>(null); const [aSuccess, setASuccess] = useState(false)

  // ── Inline edit state ──
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState(''); const [editDesc, setEditDesc] = useState('')
  const [editError, setEditError] = useState<string | null>(null)

  // ── Delete confirm ──
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // ── Subcategory inline form ──
  const [subFormParentId, setSubFormParentId] = useState<string | null>(null)
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
      const r = await createTicketSubcategory(subFormParentId!, subName, subDesc)
      if (r.ok) { setSubFormParentId(null); setSubName(''); setSubDesc('') }
      else setSubError(r.error ?? 'Erro')
    })
  }

  const subTabStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 16px', borderRadius: 7, fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer',
    background: active ? 'rgba(0,217,184,0.12)' : 'transparent',
    border: `1px solid ${active ? 'rgba(0,217,184,0.3)' : 'rgba(255,255,255,0.07)'}`,
    color: active ? '#00d9b8' : '#3d5068', fontFamily: "'JetBrains Mono', monospace", transition: 'all 0.1s',
  })

  // Find all ticket cats flat (parents + children) for delete check
  const allTicketCats = ticketCategories.flatMap(c => [c, ...c.children])
  const deletingCat = allTicketCats.find(c => c.id === deleteId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <button style={subTabStyle(sub === 'chamados')} onClick={() => setSub('chamados')}>Chamados</button>
        <button style={subTabStyle(sub === 'ativos')} onClick={() => setSub('ativos')}>Ativos / Patrimônio</button>
      </div>

      {/* ── CHAMADOS ── */}
      {sub === 'chamados' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Create form */}
          <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '18px 20px' }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#3d5068', letterSpacing: '0.1em', marginBottom: 14 }}>NOVA CATEGORIA DE CHAMADO</p>
            <form onSubmit={handleCreateTicket} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700, letterSpacing: '0.08em' }}>NOME *</label>
                <input value={tName} onChange={e => setTName(e.target.value)} placeholder="Ex: Suporte de Hardware" style={{ ...inputStyle, padding: '8px 12px' }} required />
              </div>
              <div style={{ flex: '2 1 240px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700, letterSpacing: '0.08em' }}>DESCRIÇÃO</label>
                <input value={tDesc} onChange={e => setTDesc(e.target.value)} placeholder="Breve descrição" style={{ ...inputStyle, padding: '8px 12px' }} />
              </div>
              <button type="submit" disabled={isPending || !tName.trim()} style={{
                padding: '9px 20px', borderRadius: 8, height: 38,
                background: 'rgba(0,217,184,0.12)', border: '1px solid rgba(0,217,184,0.3)',
                color: '#00d9b8', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap', opacity: !tName.trim() ? 0.4 : 1,
              }}>+ Adicionar</button>
            </form>
            {tError && <p style={{ fontSize: 12, color: '#f87171', marginTop: 8 }}>⚠ {tError}</p>}
            {tSuccess && <p style={{ fontSize: 12, color: '#34d399', marginTop: 8 }}>✓ Categoria criada com sucesso</p>}
          </div>

          {/* Delete confirm */}
          {deleteId && deletingCat && (
            <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: '14px 18px' }}>
              <p style={{ fontSize: 13, color: '#f87171', fontWeight: 600, marginBottom: 6 }}>Excluir categoria "{deletingCat.name}"?</p>
              <p style={{ fontSize: 12, color: '#8ba5c0', marginBottom: 10 }}>
                {deletingCat._count.tickets > 0
                  ? `⚠ Esta categoria possui ${deletingCat._count.tickets} chamado(s). Não é possível excluir.`
                  : 'Esta ação é irreversível.'}
              </p>
              {deleteError && <p style={{ fontSize: 12, color: '#f87171', marginBottom: 8 }}>⚠ {deleteError}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleDelete} disabled={isPending || deletingCat._count.tickets > 0} style={{
                  padding: '5px 14px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171',
                  opacity: deletingCat._count.tickets > 0 ? 0.4 : 1, fontFamily: "'JetBrains Mono', monospace",
                }}>Confirmar exclusão</button>
                <button onClick={() => setDeleteId(null)} disabled={isPending} style={{
                  padding: '5px 12px', borderRadius: 7, fontSize: 11, cursor: 'pointer',
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#3d5068',
                  fontFamily: "'JetBrains Mono', monospace",
                }}>Cancelar</button>
              </div>
            </div>
          )}

          {/* List */}
          <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
            {ticketCategories.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#2d4060' }}>Nenhuma categoria cadastrada</div>
            ) : ticketCategories.map((c, ci) => (
              <div key={c.id}>
                {/* ── PARENT ROW ── */}
                {editId === c.id ? (
                  <EditRow name={editName} desc={editDesc} setName={setEditName} setDesc={setEditDesc}
                    error={editError} onSave={handleUpdate} onCancel={() => setEditId(null)} isPending={isPending}
                    isLast={ci === ticketCategories.length - 1 && c.children.length === 0} indent={0} />
                ) : (
                  <CategoryRow
                    id={c.id} name={c.name} description={c.description} active={c.active}
                    ticketCount={c._count.tickets} indent={0}
                    isLast={ci === ticketCategories.length - 1 && c.children.length === 0 && subFormParentId !== c.id}
                    hasChildren={c.children.length > 0}
                    onEdit={() => startEdit(c.id, c.name, c.description)}
                    onDelete={() => { setDeleteId(c.id); setDeleteError(null) }}
                    onToggle={() => startTransition(() => toggleTicketCategoryActive(c.id))}
                    onAddSub={() => { setSubFormParentId(c.id); setSubName(''); setSubDesc(''); setSubError(null) }}
                    isPending={isPending}
                  />
                )}

                {/* ── SUBCATEGORY FORM ── */}
                {subFormParentId === c.id && (
                  <div style={{ padding: '10px 16px 10px 36px', background: 'rgba(0,217,184,0.03)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#00d9b8', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8 }}>NOVA SUBCATEGORIA DE "{c.name.toUpperCase()}"</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <input value={subName} onChange={e => setSubName(e.target.value)} placeholder="Nome da subcategoria" style={{ ...inputStyle, flex: '1 1 160px' }} />
                      <input value={subDesc} onChange={e => setSubDesc(e.target.value)} placeholder="Descrição (opcional)" style={{ ...inputStyle, flex: '2 1 200px' }} />
                      <button onClick={handleCreateSub} disabled={isPending || !subName.trim()} style={{
                        padding: '6px 14px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        background: 'rgba(0,217,184,0.12)', border: '1px solid rgba(0,217,184,0.3)', color: '#00d9b8',
                        fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap', opacity: !subName.trim() ? 0.4 : 1,
                      }}>Criar</button>
                      <button onClick={() => setSubFormParentId(null)} disabled={isPending} style={{
                        padding: '6px 10px', borderRadius: 7, fontSize: 11, cursor: 'pointer',
                        background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#3d5068',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>✕</button>
                    </div>
                    {subError && <p style={{ fontSize: 11, color: '#f87171', marginTop: 6 }}>⚠ {subError}</p>}
                  </div>
                )}

                {/* ── CHILDREN ROWS ── */}
                {c.children.map((child, ci2) => (
                  editId === child.id ? (
                    <EditRow key={child.id} name={editName} desc={editDesc} setName={setEditName} setDesc={setEditDesc}
                      error={editError} onSave={handleUpdate} onCancel={() => setEditId(null)} isPending={isPending}
                      isLast={ci2 === c.children.length - 1 && ci === ticketCategories.length - 1} indent={1} />
                  ) : (
                    <CategoryRow key={child.id}
                      id={child.id} name={child.name} description={child.description} active={child.active}
                      ticketCount={child._count.tickets} indent={1}
                      isLast={ci2 === c.children.length - 1 && ci === ticketCategories.length - 1 && subFormParentId !== c.id}
                      hasChildren={false}
                      onEdit={() => startEdit(child.id, child.name, child.description)}
                      onDelete={() => { setDeleteId(child.id); setDeleteError(null) }}
                      onToggle={() => startTransition(() => toggleTicketCategoryActive(child.id))}
                      onAddSub={null}
                      isPending={isPending}
                    />
                  )
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ATIVOS ── */}
      {sub === 'ativos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '18px 20px' }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#3d5068', letterSpacing: '0.1em', marginBottom: 14 }}>NOVA CATEGORIA DE ATIVO</p>
            <form onSubmit={handleCreateAsset} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '2 1 180px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700, letterSpacing: '0.08em' }}>NOME *</label>
                <input value={aName} onChange={e => setAName(e.target.value)} placeholder="Ex: Impressora" style={{ ...inputStyle, padding: '8px 12px' }} required />
              </div>
              <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700, letterSpacing: '0.08em' }}>ÍCONE</label>
                <select value={aIcon} onChange={e => setAIcon(e.target.value)} style={{ ...inputStyle, padding: '8px 10px' }}>
                  <option value="">— nenhum —</option>
                  {ICON_OPTIONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                </select>
              </div>
              <button type="submit" disabled={isPending || !aName.trim()} style={{
                padding: '9px 20px', borderRadius: 8, height: 38,
                background: 'rgba(0,217,184,0.12)', border: '1px solid rgba(0,217,184,0.3)',
                color: '#00d9b8', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap', opacity: !aName.trim() ? 0.4 : 1,
              }}>+ Adicionar</button>
            </form>
            {aError && <p style={{ fontSize: 12, color: '#f87171', marginTop: 8 }}>⚠ {aError}</p>}
            {aSuccess && <p style={{ fontSize: 12, color: '#34d399', marginTop: 8 }}>✓ Categoria criada com sucesso</p>}
          </div>
          <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 70px 70px 90px', columnGap: 10, padding: '0 16px', height: 36, alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              {['NOME', 'ÍCONE', 'ATIVOS', 'STATUS', ''].map((h, i) => (
                <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#2d4060', letterSpacing: '0.08em' }}>{h}</div>
              ))}
            </div>
            {assetCategories.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#2d4060' }}>Nenhuma categoria cadastrada</div>
            ) : assetCategories.map((c, i) => (
              <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 70px 70px 90px', columnGap: 10, padding: '11px 16px', alignItems: 'center', borderBottom: i < assetCategories.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', opacity: c.active ? 1 : 0.5 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#c8d6e5' }}>{c.name}</p>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#4a6580' }}>{c.icon ?? '—'}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#38bdf8' }}>{c._count.assets}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: c.active ? '#34d399' : '#f87171', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />{c.active ? 'Ativa' : 'Inativa'}
                </span>
                <button onClick={() => startTransition(() => toggleAssetCategoryActive(c.id))} disabled={isPending} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 10, cursor: 'pointer', background: c.active ? 'rgba(248,113,113,0.08)' : 'rgba(52,211,153,0.08)', border: `1px solid ${c.active ? 'rgba(248,113,113,0.2)' : 'rgba(52,211,153,0.2)'}`, color: c.active ? '#f87171' : '#34d399', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
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

function CategoryRow({
  id, name, description, active, ticketCount, indent, isLast, hasChildren,
  onEdit, onDelete, onToggle, onAddSub, isPending,
}: {
  id: string; name: string; description: string | null; active: boolean
  ticketCount: number; indent: number; isLast: boolean; hasChildren: boolean
  onEdit: () => void; onDelete: () => void; onToggle: () => void
  onAddSub: (() => void) | null; isPending: boolean
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 0,
      padding: `10px 16px 10px ${16 + indent * 20}px`,
      borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
      opacity: active ? 1 : 0.5,
      background: indent > 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
    }}>
      {indent > 0 && (
        <span style={{ marginRight: 6, color: '#2d4060', fontSize: 12 }}>└</span>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ fontSize: 13, fontWeight: indent === 0 ? 600 : 500, color: indent === 0 ? '#c8d6e5' : '#8ba5c0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name}
          </p>
          {hasChildren && (
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', background: 'rgba(255,255,255,0.04)', borderRadius: 4, padding: '1px 5px' }}>
              com subs
            </span>
          )}
        </div>
        {description && (
          <p style={{ fontSize: 11, color: '#2d4060', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{description}</p>
        )}
      </div>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#38bdf8', marginRight: 12, flexShrink: 0 }}>{ticketCount}</span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: active ? '#34d399' : '#f87171', display: 'flex', alignItems: 'center', gap: 4, marginRight: 12, flexShrink: 0, minWidth: 46 }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />{active ? 'Ativa' : 'Inativa'}
      </span>
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {onAddSub && (
          <button onClick={onAddSub} disabled={isPending} title="Adicionar subcategoria" style={{
            padding: '3px 8px', borderRadius: 5, fontSize: 10, cursor: 'pointer',
            background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa',
            fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
          }}>+ Sub</button>
        )}
        <button onClick={onEdit} disabled={isPending} style={{
          padding: '3px 8px', borderRadius: 5, fontSize: 10, cursor: 'pointer',
          background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', color: '#38bdf8',
          fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
        }}>Editar</button>
        <button onClick={onToggle} disabled={isPending} style={{
          padding: '3px 8px', borderRadius: 5, fontSize: 10, cursor: 'pointer',
          background: active ? 'rgba(248,113,113,0.08)' : 'rgba(52,211,153,0.08)',
          border: `1px solid ${active ? 'rgba(248,113,113,0.2)' : 'rgba(52,211,153,0.2)'}`,
          color: active ? '#f87171' : '#34d399', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
        }}>{active ? 'Desativar' : 'Ativar'}</button>
        <button onClick={onDelete} disabled={isPending} style={{
          padding: '3px 8px', borderRadius: 5, fontSize: 10, cursor: 'pointer',
          background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', color: '#f87171',
          fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
        }}>Excluir</button>
      </div>
    </div>
  )
}

function EditRow({
  name, desc, setName, setDesc, error, onSave, onCancel, isPending, isLast, indent,
}: {
  name: string; desc: string; setName: (v: string) => void; setDesc: (v: string) => void
  error: string | null; onSave: () => void; onCancel: () => void; isPending: boolean
  isLast: boolean; indent: number
}) {
  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 7, padding: '6px 10px', fontSize: 13, color: '#c8d6e5', outline: 'none', boxSizing: 'border-box',
  }
  return (
    <div style={{
      padding: `10px 16px 10px ${16 + indent * 20}px`,
      background: 'rgba(0,217,184,0.03)',
      borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome" style={{ ...inputStyle, flex: '1 1 160px' }} />
        <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descrição" style={{ ...inputStyle, flex: '2 1 200px' }} />
        <button onClick={onSave} disabled={isPending || !name.trim()} style={{
          padding: '6px 14px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer',
          background: 'rgba(0,217,184,0.12)', border: '1px solid rgba(0,217,184,0.3)', color: '#00d9b8',
          fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap',
        }}>Salvar</button>
        <button onClick={onCancel} disabled={isPending} style={{
          padding: '6px 10px', borderRadius: 7, fontSize: 11, cursor: 'pointer',
          background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#3d5068',
          fontFamily: "'JetBrains Mono', monospace",
        }}>✕</button>
      </div>
      {error && <p style={{ fontSize: 11, color: '#f87171', marginTop: 6 }}>⚠ {error}</p>}
    </div>
  )
}
