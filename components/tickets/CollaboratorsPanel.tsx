'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Technician { id: string; name: string; role: string }
interface Collaborator { userId: string; name: string; addedAt: string }

interface Props {
  ticketId: string
  collaborators: Collaborator[]
  assigneeId: string | null
  technicians: Technician[]
}

const roleLabel: Record<string, string> = {
  TECNICO: 'Técnico', ADMIN: 'Admin', AUXILIAR_TI: 'Auxiliar TI',
}

const AVATAR_COLORS = ['#0ea5e9','#8b5cf6','#f59e0b','#10b981','#f43f5e','#6366f1','#14b8a6','#f97316']
function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}
function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export default function CollaboratorsPanel({ ticketId, collaborators: initial, assigneeId, technicians }: Props) {
  const router = useRouter()
  const [collaborators, setCollaborators] = useState(initial)
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Exclude assignee and already-added collaborators
  const available = technicians.filter(
    t => t.id !== assigneeId && !collaborators.find(c => c.userId === t.id)
  )

  async function handleAdd() {
    if (!selectedId || loading) return
    setLoading(true); setFeedback(null)
    try {
      const res = await fetch(`/api/tickets/${ticketId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedId }),
      })
      const data = await res.json()
      if (data.ok) {
        const tech = technicians.find(t => t.id === selectedId)
        if (tech) setCollaborators(prev => [...prev, { userId: tech.id, name: tech.name, addedAt: new Date().toISOString() }])
        setSelectedId('')
        setFeedback({ type: 'success', msg: 'Colaborador adicionado!' })
        router.refresh()
      } else {
        setFeedback({ type: 'error', msg: data.error?.message ?? 'Erro ao adicionar' })
      }
    } catch { setFeedback({ type: 'error', msg: 'Erro de conexão' }) }
    finally { setLoading(false) }
  }

  async function handleRemove(userId: string) {
    setLoading(true); setFeedback(null)
    try {
      const res = await fetch(`/api/tickets/${ticketId}/collaborators`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()
      if (data.ok) {
        setCollaborators(prev => prev.filter(c => c.userId !== userId))
        setFeedback({ type: 'success', msg: 'Removido.' })
        router.refresh()
      } else {
        setFeedback({ type: 'error', msg: data.error?.message ?? 'Erro ao remover' })
      }
    } catch { setFeedback({ type: 'error', msg: 'Erro de conexão' }) }
    finally { setLoading(false) }
  }

  return (
    <div style={{
      background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#8b5cf6" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#7a9bbc', letterSpacing: '0.06em' }}>
          COLABORADORES
        </span>
      </div>

      {/* Lista atual */}
      {collaborators.length === 0 ? (
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#2d4060' }}>
          Nenhum colaborador ainda.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {collaborators.map(c => {
            const color = avatarColor(c.name)
            return (
              <div key={c.userId} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 10px',
                background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.12)',
                borderRadius: 7,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: `${color}25`, border: `1px solid ${color}50`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color,
                  }}>
                    {initials(c.name)}
                  </div>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{c.name}</span>
                </div>
                <button
                  onClick={() => handleRemove(c.userId)}
                  disabled={loading}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 3,
                    color: '#3d5068', opacity: loading ? 0.4 : 1,
                  }}
                  title="Remover"
                >
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Adicionar */}
      {available.length > 0 && (
        <div style={{ display: 'flex', gap: 6 }}>
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            style={{
              flex: 1, padding: '7px 10px', borderRadius: 7,
              background: '#060d18', border: '1px solid rgba(255,255,255,0.1)',
              color: selectedId ? '#c8d6e5' : '#3d5068',
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
              cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="">Adicionar técnico…</option>
            {available.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} ({roleLabel[t.role] ?? t.role})
              </option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            disabled={!selectedId || loading}
            style={{
              padding: '7px 12px', borderRadius: 7,
              background: selectedId ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${selectedId ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.07)'}`,
              color: selectedId ? '#8b5cf6' : '#2d4060',
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700,
              cursor: !selectedId || loading ? 'not-allowed' : 'pointer',
              opacity: !selectedId || loading ? 0.5 : 1, transition: 'all 0.15s',
            }}
          >
            +
          </button>
        </div>
      )}

      {feedback && (
        <p style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
          color: feedback.type === 'success' ? '#34d399' : '#f87171',
        }}>
          {feedback.msg}
        </p>
      )}
    </div>
  )
}
