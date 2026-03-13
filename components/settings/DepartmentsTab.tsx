'use client'

import { useState, useTransition } from 'react'
import {
  createDepartment, updateDepartment,
  deleteDepartment, toggleDepartmentActive,
} from '@/app/(app)/settings/actions'

interface Department {
  id: string
  name: string
  code: string | null
  active: boolean
  _count: { users: number }
}

interface Props { departments: Department[] }

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '6px 10px', fontSize: 13, color: '#c8d6e5',
  outline: 'none', boxSizing: 'border-box',
}

export default function DepartmentsTab({ departments }: Props) {
  const [isPending, startTransition] = useTransition()

  // Create form
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState(false)

  // Edit state: id → { name, code }
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editCode, setEditCode] = useState('')
  const [editError, setEditError] = useState<string | null>(null)

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError(null); setCreateSuccess(false)
    startTransition(async () => {
      const r = await createDepartment(name, code)
      if (r.ok) { setName(''); setCode(''); setCreateSuccess(true); setTimeout(() => setCreateSuccess(false), 3000) }
      else setCreateError(r.error ?? 'Erro')
    })
  }

  function startEdit(d: Department) {
    setEditingId(d.id); setEditName(d.name); setEditCode(d.code ?? ''); setEditError(null)
  }

  function cancelEdit() {
    setEditingId(null); setEditError(null)
  }

  function handleUpdate() {
    setEditError(null)
    startTransition(async () => {
      const r = await updateDepartment(editingId!, editName, editCode)
      if (r.ok) setEditingId(null)
      else setEditError(r.error ?? 'Erro')
    })
  }

  function startDelete(id: string) {
    setDeletingId(id); setDeleteError(null)
  }

  function handleDelete() {
    setDeleteError(null)
    startTransition(async () => {
      const r = await deleteDepartment(deletingId!)
      if (r.ok) setDeletingId(null)
      else setDeleteError(r.error ?? 'Erro')
    })
  }

  const deletingDept = departments.find(d => d.id === deletingId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Create form */}
      <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '18px 20px' }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#3d5068', letterSpacing: '0.1em', marginBottom: 14 }}>NOVO DEPARTAMENTO</p>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: '2 1 180px' }}>
            <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700, letterSpacing: '0.08em' }}>NOME *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Recursos Humanos" style={{ ...inputStyle, padding: '8px 12px' }} required />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: '1 1 100px' }}>
            <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700, letterSpacing: '0.08em' }}>CÓDIGO</label>
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="Ex: RH" maxLength={10} style={{ ...inputStyle, padding: '8px 12px' }} />
          </div>
          <button type="submit" disabled={isPending || !name.trim()} style={{
            padding: '9px 20px', borderRadius: 8, height: 38,
            background: 'rgba(0,217,184,0.12)', border: '1px solid rgba(0,217,184,0.3)',
            color: '#00d9b8', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap', opacity: !name.trim() ? 0.4 : 1,
          }}>+ Adicionar</button>
        </form>
        {createError && <p style={{ fontSize: 12, color: '#f87171', marginTop: 8 }}>⚠ {createError}</p>}
        {createSuccess && <p style={{ fontSize: 12, color: '#34d399', marginTop: 8 }}>✓ Departamento criado com sucesso</p>}
      </div>

      {/* Delete confirmation modal */}
      {deletingId && deletingDept && (
        <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: '16px 20px' }}>
          <p style={{ fontSize: 13, color: '#f87171', fontWeight: 600, marginBottom: 6 }}>
            Excluir departamento "{deletingDept.name}"?
          </p>
          {deletingDept._count.users > 0 ? (
            <p style={{ fontSize: 12, color: '#f87171' }}>
              ⚠ Este departamento possui {deletingDept._count.users} usuário(s). Reassine-os antes de excluir.
            </p>
          ) : (
            <p style={{ fontSize: 12, color: '#8ba5c0', marginBottom: 12 }}>
              Esta ação é irreversível e não pode ser desfeita.
            </p>
          )}
          {deleteError && <p style={{ fontSize: 12, color: '#f87171', marginBottom: 8 }}>⚠ {deleteError}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={handleDelete} disabled={isPending || deletingDept._count.users > 0} style={{
              padding: '6px 16px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171',
              opacity: deletingDept._count.users > 0 ? 0.4 : 1,
              fontFamily: "'JetBrains Mono', monospace",
            }}>Confirmar exclusão</button>
            <button onClick={() => setDeletingId(null)} disabled={isPending} style={{
              padding: '6px 16px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#3d5068',
              fontFamily: "'JetBrains Mono', monospace",
            }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* List */}
      <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 90px 70px 70px 140px',
          columnGap: 10, padding: '0 16px', height: 36, alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)',
        }}>
          {['NOME', 'CÓDIGO', 'USUÁRIOS', 'STATUS', ''].map((h, i) => (
            <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#2d4060', letterSpacing: '0.08em' }}>{h}</div>
          ))}
        </div>

        {departments.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#2d4060' }}>Nenhum departamento cadastrado</div>
        ) : departments.map((d, i) => (
          <div key={d.id}>
            {editingId === d.id ? (
              /* ── EDIT ROW ── */
              <div style={{ padding: '10px 16px', background: 'rgba(0,217,184,0.04)', borderBottom: i < departments.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    value={editName} onChange={e => setEditName(e.target.value)}
                    style={{ ...inputStyle, flex: '2 1 160px' }}
                    placeholder="Nome"
                  />
                  <input
                    value={editCode} onChange={e => setEditCode(e.target.value.toUpperCase())}
                    style={{ ...inputStyle, flex: '0 0 80px' }} maxLength={10}
                    placeholder="Código"
                  />
                  <button onClick={handleUpdate} disabled={isPending || !editName.trim()} style={{
                    padding: '6px 14px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    background: 'rgba(0,217,184,0.12)', border: '1px solid rgba(0,217,184,0.3)', color: '#00d9b8',
                    fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap',
                  }}>Salvar</button>
                  <button onClick={cancelEdit} disabled={isPending} style={{
                    padding: '6px 12px', borderRadius: 7, fontSize: 11, cursor: 'pointer',
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#3d5068',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>Cancelar</button>
                </div>
                {editError && <p style={{ fontSize: 11, color: '#f87171', marginTop: 6 }}>⚠ {editError}</p>}
              </div>
            ) : (
              /* ── NORMAL ROW ── */
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 90px 70px 70px 140px',
                columnGap: 10, padding: '12px 16px', alignItems: 'center',
                borderBottom: i < departments.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                opacity: d.active ? 1 : 0.5,
              }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#c8d6e5' }}>{d.name}</p>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#4a6580' }}>{d.code ?? '—'}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#38bdf8' }}>{d._count.users}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: d.active ? '#34d399' : '#f87171' }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
                  {d.active ? 'Ativo' : 'Inativo'}
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => startEdit(d)} disabled={isPending} title="Editar" style={{
                    padding: '4px 8px', borderRadius: 6, fontSize: 10, cursor: 'pointer',
                    background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)',
                    color: '#38bdf8', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                  }}>Editar</button>
                  <button onClick={() => startTransition(() => toggleDepartmentActive(d.id))} disabled={isPending} style={{
                    padding: '4px 8px', borderRadius: 6, fontSize: 10, cursor: 'pointer',
                    background: d.active ? 'rgba(248,113,113,0.08)' : 'rgba(52,211,153,0.08)',
                    border: `1px solid ${d.active ? 'rgba(248,113,113,0.2)' : 'rgba(52,211,153,0.2)'}`,
                    color: d.active ? '#f87171' : '#34d399',
                    fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                  }}>{d.active ? 'Desativar' : 'Ativar'}</button>
                  <button onClick={() => startDelete(d.id)} disabled={isPending} title="Excluir" style={{
                    padding: '4px 8px', borderRadius: 6, fontSize: 10, cursor: 'pointer',
                    background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)',
                    color: '#f87171', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                  }}>Excluir</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
