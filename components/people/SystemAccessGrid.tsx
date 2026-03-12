'use client'

import { useState, useTransition } from 'react'
import { upsertSystemAccess } from '@/app/(app)/people/[id]/actions'

type SystemKey =
  | 'DISCORD' | 'INUV' | 'ONVIO' | 'TRELLO' | 'CLASSROOM'
  | 'WINDOWS' | 'DOMINIO' | 'ONECODE' | 'MATTERMOST' | 'CHAT_ITA'

type AccessStatus = 'OK' | 'PENDING' | 'NA'

interface AccessEntry {
  system: SystemKey
  status: AccessStatus
  notes: string | null
}

interface Props {
  userId: string
  accesses: AccessEntry[]
  canEdit: boolean
}

const systemMeta: Record<SystemKey, { label: string; icon: string; desc: string }> = {
  DISCORD:     { label: 'Discord',       icon: '💬', desc: 'Comunicação da equipe' },
  INUV:        { label: 'Inuv',          icon: '🔵', desc: 'Plataforma colaborativa' },
  ONVIO:       { label: 'Onvio',         icon: '📂', desc: 'Gestão contábil/fiscal' },
  TRELLO:      { label: 'Trello',        icon: '📋', desc: 'Gerenciamento de tarefas' },
  CLASSROOM:   { label: 'Classroom',     icon: '🎓', desc: 'Plataforma de aprendizado' },
  WINDOWS:     { label: 'Windows',       icon: '🖥️', desc: 'Conta de usuário local' },
  DOMINIO:     { label: 'Domínio (AD)',  icon: '🔑', desc: 'Active Directory / rede' },
  ONECODE:     { label: 'OneCode',       icon: '⚙️', desc: 'Sistema ERP' },
  MATTERMOST:  { label: 'Mattermost',    icon: '📡', desc: 'Chat corporativo' },
  CHAT_ITA:    { label: 'Chat Ita',      icon: '💼', desc: 'Chat interno Itamarathy' },
}

const statusCycle: AccessStatus[] = ['PENDING', 'OK', 'NA']

const statusStyle: Record<AccessStatus, { color: string; bg: string; border: string; label: string; dot: string }> = {
  OK:      { color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.25)',  label: 'OK',      dot: '#34d399' },
  PENDING: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)',  label: 'Pendente', dot: '#fbbf24' },
  NA:      { color: '#3d5068', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.07)', label: 'N/A',     dot: '#3d5068' },
}

export default function SystemAccessGrid({ userId, accesses, canEdit }: Props) {
  const [isPending, startTransition] = useTransition()

  // Local state map: system → { status, notes }
  const [state, setState] = useState<Record<SystemKey, { status: AccessStatus; notes: string }>>(() => {
    const map = {} as Record<SystemKey, { status: AccessStatus; notes: string }>
    const allSystems = Object.keys(systemMeta) as SystemKey[]
    for (const sys of allSystems) {
      const found = accesses.find(a => a.system === sys)
      map[sys] = { status: found?.status ?? 'PENDING', notes: found?.notes ?? '' }
    }
    return map
  })

  const [editingNotes, setEditingNotes] = useState<SystemKey | null>(null)
  const [notesInput, setNotesInput] = useState('')

  function cycleStatus(sys: SystemKey) {
    if (!canEdit) return
    const current = state[sys].status
    const idx = statusCycle.indexOf(current)
    const next = statusCycle[(idx + 1) % statusCycle.length]

    setState(prev => ({ ...prev, [sys]: { ...prev[sys], status: next } }))

    startTransition(async () => {
      await upsertSystemAccess(userId, sys, next, state[sys].notes)
    })
  }

  function openNotesEdit(sys: SystemKey) {
    if (!canEdit) return
    setEditingNotes(sys)
    setNotesInput(state[sys].notes)
  }

  function saveNotes(sys: SystemKey) {
    setState(prev => ({ ...prev, [sys]: { ...prev[sys], notes: notesInput } }))
    setEditingNotes(null)

    startTransition(async () => {
      await upsertSystemAccess(userId, sys, state[sys].status, notesInput)
    })
  }

  const allSystems = Object.keys(systemMeta) as SystemKey[]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', letterSpacing: '0.1em', fontWeight: 700 }}>
            ACESSOS AOS SISTEMAS
          </span>
          {isPending && (
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#fbbf24' }}>
              SALVANDO...
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {(['OK', 'PENDING', 'NA'] as AccessStatus[]).map(s => (
            <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusStyle[s].dot, display: 'inline-block' }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3d5068' }}>{statusStyle[s].label}</span>
            </span>
          ))}
          {canEdit && (
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', marginLeft: 4 }}>
              clique para alternar
            </span>
          )}
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {allSystems.map(sys => {
          const meta = systemMeta[sys]
          const { status, notes } = state[sys]
          const st = statusStyle[status]
          const isEditingThis = editingNotes === sys

          return (
            <div
              key={sys}
              style={{
                background: '#0d1422',
                border: `1px solid ${st.border}`,
                borderRadius: 10, padding: '12px 14px',
                display: 'flex', flexDirection: 'column', gap: 8,
                transition: 'border-color 0.15s',
              }}
            >
              {/* Top row: icon + label + status toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>{meta.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#c8d6e5', lineHeight: 1.2 }}>{meta.label}</p>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', marginTop: 2 }}>{meta.desc}</p>
                </div>
                {/* Status badge — clickable to cycle */}
                <button
                  onClick={() => cycleStatus(sys)}
                  disabled={!canEdit || isPending}
                  title={canEdit ? 'Clique para alterar' : undefined}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 6,
                    background: st.bg, border: `1px solid ${st.border}`,
                    cursor: canEdit ? 'pointer' : 'default',
                    transition: 'all 0.12s',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot, boxShadow: `0 0 5px ${st.dot}88` }} />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: st.color }}>
                    {st.label}
                  </span>
                </button>
              </div>

              {/* Notes row */}
              {isEditingThis ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    autoFocus
                    value={notesInput}
                    onChange={e => setNotesInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveNotes(sys); if (e.key === 'Escape') setEditingNotes(null) }}
                    placeholder="usuário / observação..."
                    style={{
                      flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 5, padding: '4px 8px',
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#c8d6e5',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => saveNotes(sys)}
                    style={{
                      padding: '4px 10px', borderRadius: 5,
                      background: 'rgba(0,217,184,0.15)', border: '1px solid rgba(0,217,184,0.3)',
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#00d9b8',
                      cursor: 'pointer',
                    }}
                  >
                    OK
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => openNotesEdit(sys)}
                  disabled={!canEdit}
                  style={{
                    textAlign: 'left', background: 'none', border: 'none', padding: '2px 0',
                    cursor: canEdit ? 'text' : 'default', width: '100%',
                  }}
                >
                  {notes ? (
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#4a6580' }}>
                      {notes}
                    </span>
                  ) : (
                    canEdit && (
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#1e3048', fontStyle: 'italic' }}>
                        + usuário / observação
                      </span>
                    )
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
