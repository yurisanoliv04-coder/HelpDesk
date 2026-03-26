'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Technician { id: string; name: string; role: string }
interface SharedTech  { userId: string; name: string }

interface AssignPanelProps {
  ticketId: string
  currentAssigneeId?: string | null
  technicians: Technician[]
  sharedTechs?: SharedTech[]
  readOnly?: boolean
}

const AVATAR_COLORS = ['#0ea5e9','#8b5cf6','#f59e0b','#10b981','#f43f5e','#6366f1','#14b8a6','#f97316']
function avatarColor(name: string) {
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}
function initials(name: string) { return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() }

export default function AssignPanel({ ticketId, currentAssigneeId, technicians, sharedTechs: initialShared = [], readOnly = false }: AssignPanelProps) {
  const router = useRouter()
  const [selectedId, setSelectedId]   = useState(currentAssigneeId ?? '')
  const [shared, setShared]           = useState<SharedTech[]>(initialShared)
  const [loading, setLoading]         = useState<'assign' | 'add' | string | null>(null)
  const [feedback, setFeedback]       = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const isSame      = selectedId === currentAssigneeId
  const selectedTech = technicians.find(t => t.id === selectedId)
  const alreadyShared = shared.some(s => s.userId === selectedId)
  const isAssignee  = selectedId === currentAssigneeId

  async function handleAssign() {
    if (!selectedId || loading) return
    setLoading('assign'); setFeedback(null)
    try {
      const res  = await fetch(`/api/tickets/${ticketId}/assign`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicianId: selectedId }),
      })
      const data = await res.json()
      if (data.ok) { setFeedback({ type: 'success', msg: 'Técnico atribuído!' }); router.refresh() }
      else setFeedback({ type: 'error', msg: data.error?.message ?? 'Erro ao atribuir' })
    } catch { setFeedback({ type: 'error', msg: 'Erro de conexão' }) }
    finally { setLoading(null) }
  }

  async function handleAdd() {
    if (!selectedId || loading || alreadyShared || isAssignee) return
    setLoading('add'); setFeedback(null)
    try {
      const res  = await fetch(`/api/tickets/${ticketId}/collaborators`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedId }),
      })
      const data = await res.json()
      if (data.ok) {
        if (selectedTech) setShared(prev => [...prev, { userId: selectedTech.id, name: selectedTech.name }])
        setFeedback({ type: 'success', msg: `${selectedTech?.name} adicionado!` })
        router.refresh()
      } else {
        setFeedback({ type: 'error', msg: data.error?.message ?? 'Erro ao adicionar' })
      }
    } catch { setFeedback({ type: 'error', msg: 'Erro de conexão' }) }
    finally { setLoading(null) }
  }

  async function handleRemoveShared(userId: string) {
    setLoading(userId); setFeedback(null)
    try {
      const res  = await fetch(`/api/tickets/${ticketId}/collaborators`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()
      if (data.ok) { setShared(prev => prev.filter(s => s.userId !== userId)); router.refresh() }
      else setFeedback({ type: 'error', msg: data.error?.message ?? 'Erro ao remover' })
    } catch { setFeedback({ type: 'error', msg: 'Erro de conexão' }) }
    finally { setLoading(null) }
  }

  const canAdd = selectedId && !alreadyShared && !isAssignee

  const assigneeTech = technicians.find(t => t.id === currentAssigneeId)

  // ── Read-only view (AUXILIAR_TI) ────────────────────────────────────────
  if (readOnly) {
    return (
      <div style={{
        background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#38bdf8" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#7a9bbc', letterSpacing: '0.06em' }}>
            TÉCNICO RESPONSÁVEL
          </span>
        </div>

        {/* Current assignee display */}
        {assigneeTech ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '9px 12px',
            background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.18)',
            borderRadius: 8,
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: 6, flexShrink: 0,
              background: `${avatarColor(assigneeTech.name)}22`,
              border: `1px solid ${avatarColor(assigneeTech.name)}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 800,
              color: avatarColor(assigneeTech.name),
            }}>
              {initials(assigneeTech.name)}
            </div>
            <div>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: '#38bdf8' }}>
                {assigneeTech.name}
              </p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3d5068', marginTop: 1 }}>
                {assigneeTech.role === 'ADMIN' ? 'Administrador' : 'Técnico'}
              </p>
            </div>
          </div>
        ) : (
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#3d5068', textAlign: 'center', padding: '6px 0' }}>
            Não atribuído
          </p>
        )}

        {/* Shared techs (read-only, no remove button) */}
        {shared.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {shared.map(s => {
              const color = avatarColor(s.name)
              return (
                <div key={s.userId} style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '5px 9px',
                  background: `${color}0d`, border: `1px solid ${color}25`, borderRadius: 7,
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 5,
                    background: `${color}22`, border: `1px solid ${color}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 800, color,
                  }}>
                    {initials(s.name)}
                  </div>
                  <span style={{ fontSize: 12, color: '#7a9bbc' }}>{s.name}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ── Editable view (TECNICO / ADMIN) ─────────────────────────────────────
  return (
    <div style={{
      background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#38bdf8" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#7a9bbc', letterSpacing: '0.06em' }}>
          TÉCNICO RESPONSÁVEL
        </span>
      </div>

      {/* Dropdown + botão "+" */}
      <div style={{ display: 'flex', gap: 6 }}>
        <select
          value={selectedId}
          onChange={e => { setSelectedId(e.target.value); setFeedback(null) }}
          style={{
            flex: 1, fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
            background: '#060d18', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 7, padding: '8px 12px', color: selectedId ? '#c8d6e5' : '#3d5068',
            outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="">— Selecione um técnico —</option>
          {technicians.map(t => (
            <option key={t.id} value={t.id} style={{ background: '#060d18' }}>
              {t.name}{t.role === 'ADMIN' ? ' (Admin)' : ''}
            </option>
          ))}
        </select>

        {/* + adiciona como técnico compartilhado */}
        <button
          onClick={handleAdd}
          disabled={!canAdd || !!loading}
          title={
            !selectedId      ? 'Selecione um técnico'
            : isAssignee     ? 'Já é o responsável'
            : alreadyShared  ? 'Já adicionado'
            : 'Compartilhar chamado com este técnico'
          }
          style={{
            width: 34, height: 34, flexShrink: 0, borderRadius: 7,
            background: canAdd ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${canAdd ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.07)'}`,
            color: canAdd ? '#38bdf8' : '#2d4060',
            fontSize: 18, fontWeight: 300, lineHeight: 1,
            cursor: !canAdd || !!loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
            opacity: loading === 'add' ? 0.5 : 1,
          }}
        >
          +
        </button>
      </div>

      {/* Técnicos compartilhados */}
      {shared.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {shared.map(s => {
            const color = avatarColor(s.name)
            return (
              <div key={s.userId} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '5px 9px',
                background: `${color}0d`, border: `1px solid ${color}25`, borderRadius: 7,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 5,
                    background: `${color}22`, border: `1px solid ${color}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 800, color,
                  }}>
                    {initials(s.name)}
                  </div>
                  <span style={{ fontSize: 12, color: '#7a9bbc' }}>{s.name}</span>
                </div>
                <button
                  onClick={() => handleRemoveShared(s.userId)}
                  disabled={!!loading}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, color: '#2d4060', opacity: loading === s.userId ? 0.4 : 1 }}
                  title="Remover"
                >
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Botão atribuir responsável */}
      <button
        onClick={handleAssign}
        disabled={!selectedId || !!loading || isSame}
        style={{
          width: '100%', padding: '9px 0',
          background: isSame && selectedId ? 'rgba(56,189,248,0.06)' : 'rgba(56,189,248,0.15)',
          border: `1px solid ${isSame && selectedId ? 'rgba(56,189,248,0.15)' : 'rgba(56,189,248,0.35)'}`,
          borderRadius: 7, color: '#38bdf8',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
          cursor: (!selectedId || !!loading || isSame) ? 'not-allowed' : 'pointer',
          opacity: !selectedId || loading === 'assign' ? 0.4 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        {loading === 'assign' ? 'Atribuindo...' : isSame && selectedId ? `Responsável: ${selectedTech?.name ?? ''}` : 'Definir como responsável'}
      </button>

      {feedback && (
        <p style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textAlign: 'center',
          color: feedback.type === 'success' ? '#34d399' : '#f87171',
        }}>
          {feedback.msg}
        </p>
      )}
    </div>
  )
}
