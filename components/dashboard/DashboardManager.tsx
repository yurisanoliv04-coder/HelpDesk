'use client'

import { useState } from 'react'
import { X, Plus, Pencil, Trash2, Star, Copy } from 'lucide-react'
import { SerializedDashboard } from '@/lib/dashboard/types'
import {
  createDashboard,
  renameDashboard,
  deleteDashboard,
  setDefaultDashboard,
} from '@/app/(app)/dashboard/actions'

interface Props {
  dashboards: SerializedDashboard[]
  activeId: string
  onUpdate: (updated: SerializedDashboard[]) => void
  onClose: () => void
}

export default function DashboardManager({ dashboards, activeId, onUpdate, onClose }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    const name = newName.trim() || 'Novo Dashboard'
    setLoading(true)
    try {
      const created = await createDashboard(name)
      onUpdate([...dashboards, created as unknown as SerializedDashboard])
      setNewName('')
    } finally {
      setLoading(false)
    }
  }

  async function handleRename(id: string) {
    if (!editingName.trim()) { setEditingId(null); return }
    setLoading(true)
    try {
      await renameDashboard(id, editingName)
      onUpdate(dashboards.map((d) => d.id === id ? { ...d, name: editingName.trim() } : d))
      setEditingId(null)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (dashboards.length <= 1) return
    if (!confirm('Excluir este dashboard?')) return
    setLoading(true)
    try {
      await deleteDashboard(id)
      let updated = dashboards.filter((d) => d.id !== id)
      // If deleted was default, mark oldest as default
      if (dashboards.find((d) => d.id === id)?.isDefault) {
        updated = updated.map((d, i) => i === 0 ? { ...d, isDefault: true } : d)
      }
      onUpdate(updated)
    } finally {
      setLoading(false)
    }
  }

  async function handleSetDefault(id: string) {
    setLoading(true)
    try {
      await setDefaultDashboard(id)
      onUpdate(dashboards.map((d) => ({ ...d, isDefault: d.id === id })))
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy(id: string, name: string) {
    setLoading(true)
    try {
      const created = await createDashboard(`${name} (cópia)`, id)
      onUpdate([...dashboards, created as unknown as SerializedDashboard])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 12, width: 480, maxHeight: '80vh',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Gerenciar Dashboards</h2>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', cursor: 'pointer' }}>
            <X size={13} />
          </button>
        </div>

        {/* Dashboard list */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
          {dashboards.map((d) => (
            <div
              key={d.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 20px',
                borderBottom: '1px solid var(--border)',
                background: d.id === activeId ? 'rgba(16,185,129,0.04)' : 'transparent',
              }}
            >
              {editingId === d.id ? (
                <input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename(d.id)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  style={{
                    flex: 1, background: 'var(--bg-input)',
                    border: '1px solid rgba(16,185,129,0.4)',
                    borderRadius: 4, padding: '4px 8px',
                    color: 'var(--text-primary)', fontSize: 13,
                  }}
                />
              ) : (
                <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>
                  {d.name}
                  {d.isDefault && (
                    <span style={{ marginLeft: 8, fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: '#10b981' }}>PADRÃO</span>
                  )}
                </span>
              )}

              <div style={{ display: 'flex', gap: 4 }}>
                {/* Set default */}
                {!d.isDefault && (
                  <button
                    onClick={() => handleSetDefault(d.id)}
                    disabled={loading}
                    title="Definir como padrão"
                    style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 4, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', cursor: 'pointer' }}
                  >
                    <Star size={12} />
                  </button>
                )}
                {/* Copy */}
                <button
                  onClick={() => handleCopy(d.id, d.name)}
                  disabled={loading}
                  title="Duplicar"
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 4, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', cursor: 'pointer' }}
                >
                  <Copy size={12} />
                </button>
                {/* Rename */}
                <button
                  onClick={() => { setEditingId(d.id); setEditingName(d.name) }}
                  disabled={loading}
                  title="Renomear"
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 4, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', cursor: 'pointer' }}
                >
                  <Pencil size={12} />
                </button>
                {/* Delete */}
                {dashboards.length > 1 && (
                  <button
                    onClick={() => handleDelete(d.id)}
                    disabled={loading}
                    title="Excluir"
                    style={{ background: 'none', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 4, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171', cursor: 'pointer', opacity: 0.7 }}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Create new */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Nome do novo dashboard..."
            style={{
              flex: 1, background: 'var(--bg-input)',
              border: '1px solid var(--border)', borderRadius: 6,
              padding: '7px 12px', color: 'var(--text-primary)', fontSize: 13,
            }}
          />
          <button
            onClick={handleCreate}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: 6, padding: '7px 14px',
              color: '#10b981', fontSize: 12, cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <Plus size={13} /> Criar
          </button>
        </div>
      </div>
    </div>
  )
}
