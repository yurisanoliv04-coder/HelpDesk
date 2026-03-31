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

const iStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '7px 12px', fontSize: 13, color: '#c8d6e5',
  outline: 'none', boxSizing: 'border-box',
}

// Column layout: name | code | users | status | actions
const COLS = '1fr 100px 90px 90px 200px'

export default function DepartmentsTab({ departments }: Props) {
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editCode, setEditCode] = useState('')
  const [editError, setEditError] = useState<string | null>(null)

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setCreateError(null); setCreateSuccess(false)
    startTransition(async () => {
      const r = await createDepartment(name, code)
      if (r.ok) { setName(''); setCode(''); setCreateSuccess(true); setTimeout(() => setCreateSuccess(false), 3000) }
      else setCreateError(r.error ?? 'Erro')
    })
  }

  function startEdit(d: Department) {
    setEditingId(d.id); setEditName(d.name); setEditCode(d.code ?? ''); setEditError(null)
  }

  function handleUpdate() {
    setEditError(null)
    startTransition(async () => {
      const r = await updateDepartment(editingId!, editName, editCode)
      if (r.ok) setEditingId(null)
      else setEditError(r.error ?? 'Erro')
    })
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

      {/* ── CREATE FORM ── */}
      <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '18px 22px' }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#3d5068', letterSpacing: '0.1em', marginBottom: 14 }}>NOVO DEPARTAMENTO</p>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: '3 1 200px' }}>
            <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700, letterSpacing: '0.08em' }}>NOME *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Recursos Humanos" style={iStyle} required />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: '1 1 120px' }}>
            <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700, letterSpacing: '0.08em' }}>CÓDIGO</label>
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="Ex: RH" maxLength={10} style={iStyle} />
          </div>
          <button type="submit" disabled={isPending || !name.trim()} style={{
            padding: '9px 22px', borderRadius: 8, height: 38, flexShrink: 0,
            background: 'rgba(0,217,184,0.12)', border: '1px solid rgba(0,217,184,0.3)',
            color: '#00d9b8', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap',
            opacity: !name.trim() ? 0.4 : 1, transition: 'opacity 0.15s',
          }}>+ Adicionar</button>
        </form>
        {createError && <p style={{ fontSize: 12, color: '#f87171', marginTop: 8 }}>⚠ {createError}</p>}
        {createSuccess && <p style={{ fontSize: 12, color: '#34d399', marginTop: 8 }}>✓ Departamento criado com sucesso</p>}
      </div>

      {/* ── DELETE CONFIRM ── */}
      {deletingId && deletingDept && (
        <div style={{ background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: '16px 22px' }}>
          <p style={{ fontSize: 13, color: '#f87171', fontWeight: 600, marginBottom: 6 }}>
            Excluir departamento "{deletingDept.name}"?
          </p>
          {deletingDept._count.users > 0 ? (
            <p style={{ fontSize: 12, color: '#f87171' }}>
              ⚠ Este departamento possui <strong>{deletingDept._count.users}</strong> usuário(s). Reassine-os antes de excluir.
            </p>
          ) : (
            <p style={{ fontSize: 12, color: '#8ba5c0', marginBottom: 12 }}>Esta ação é irreversível.</p>
          )}
          {deleteError && <p style={{ fontSize: 12, color: '#f87171', marginBottom: 8 }}>⚠ {deleteError}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button onClick={handleDelete} disabled={isPending || deletingDept._count.users > 0} style={{
              padding: '7px 18px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171',
              opacity: deletingDept._count.users > 0 ? 0.4 : 1, fontFamily: "'JetBrains Mono', monospace",
            }}>Confirmar exclusão</button>
            <button onClick={() => setDeletingId(null)} disabled={isPending} style={{
              padding: '7px 16px', borderRadius: 7, fontSize: 12, cursor: 'pointer',
              background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#3d5068',
              fontFamily: "'JetBrains Mono', monospace",
            }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* ── LIST ── */}
      <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: COLS, columnGap: 14,
          padding: '0 22px', height: 38, alignItems: 'center',
          borderBottom: '2px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
        }}>
          {['NOME', 'CÓDIGO', 'USUÁRIOS', 'STATUS', 'AÇÕES'].map((h, i) => (
            <div key={i} style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
              color: '#2d4060', letterSpacing: '0.1em',
              textAlign: i >= 2 ? 'center' : 'left',
            }}>{h}</div>
          ))}
        </div>

        {departments.length === 0 ? (
          <div style={{ padding: '48px 22px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#2d4060' }}>
            Nenhum departamento cadastrado
          </div>
        ) : departments.map((d, i) => (
          <div key={d.id} style={{ borderBottom: i < departments.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            {editingId === d.id ? (
              /* ── EDIT ROW ── */
              <div style={{ padding: '12px 22px', background: 'rgba(0,217,184,0.03)', borderLeft: '2px solid rgba(0,217,184,0.3)' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input value={editName} onChange={e => setEditName(e.target.value)}
                    style={{ ...iStyle, flex: '3 1 180px' }} placeholder="Nome" />
                  <input value={editCode} onChange={e => setEditCode(e.target.value.toUpperCase())}
                    style={{ ...iStyle, flex: '1 1 100px' }} maxLength={10} placeholder="Código" />
                  <button onClick={handleUpdate} disabled={isPending || !editName.trim()} style={{
                    padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    background: 'rgba(0,217,184,0.12)', border: '1px solid rgba(0,217,184,0.3)', color: '#00d9b8',
                    fontFamily: "'JetBrains Mono', monospace", flexShrink: 0,
                  }}>✓ Salvar</button>
                  <button onClick={() => setEditingId(null)} disabled={isPending} style={{
                    padding: '7px 12px', borderRadius: 7, fontSize: 12, cursor: 'pointer',
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#3d5068',
                    fontFamily: "'JetBrains Mono', monospace", flexShrink: 0,
                  }}>✕ Cancelar</button>
                </div>
                {editError && <p style={{ fontSize: 11, color: '#f87171', marginTop: 6 }}>⚠ {editError}</p>}
              </div>
            ) : (
              /* ── NORMAL ROW ── */
              <div style={{
                display: 'grid', gridTemplateColumns: COLS, columnGap: 14,
                padding: '13px 22px', alignItems: 'center',
                opacity: d.active ? 1 : 0.5,
                transition: 'background 0.1s',
              }}>
                {/* Name */}
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#c8d6e5' }}>{d.name}</p>
                </div>

                {/* Code */}
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                  color: '#4a6580', textAlign: 'center',
                  background: 'rgba(255,255,255,0.03)', borderRadius: 5,
                  padding: '3px 7px', display: 'inline-block',
                }}>{d.code ?? '—'}</span>

                {/* Users */}
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700,
                  color: '#38bdf8', textAlign: 'center',
                }}>{d._count.users}</span>

                {/* Status */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
                    color: d.active ? '#34d399' : '#f87171',
                    background: d.active ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
                    border: `1px solid ${d.active ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
                    borderRadius: 5, padding: '3px 8px',
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                    {d.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'nowrap' }}>
                  <ActionBtn
                    label="Editar" color="#38bdf8"
                    onClick={() => startEdit(d)} disabled={isPending}
                  />
                  <ActionBtn
                    label={d.active ? 'Desativar' : 'Ativar'}
                    color={d.active ? '#f87171' : '#34d399'}
                    onClick={() => startTransition(() => toggleDepartmentActive(d.id))}
                    disabled={isPending}
                  />
                  <ActionBtn
                    label="Excluir" color="#f87171"
                    onClick={() => { setDeletingId(d.id); setDeleteError(null) }}
                    disabled={isPending}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ActionBtn({ label, color, onClick, disabled }: {
  label: string; color: string; onClick: () => void; disabled: boolean
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '5px 11px', borderRadius: 6, fontSize: 11, fontWeight: 600,
      cursor: disabled ? 'default' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
      background: `${color}15`, border: `1px solid ${color}30`, color,
      fontFamily: "'JetBrains Mono', monospace", transition: 'all 0.1s',
      opacity: disabled ? 0.5 : 1,
    }}>{label}</button>
  )
}
