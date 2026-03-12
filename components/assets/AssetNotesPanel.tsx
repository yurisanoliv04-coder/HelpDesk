'use client'

import { useState, useTransition, useRef } from 'react'
import { addAssetNote, deleteAssetNote } from '@/app/(app)/assets/[id]/actions'
import { Trash2, StickyNote, Send } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Note {
  id: string
  body: string
  createdAt: Date
  author: { id: string; name: string }
}

interface Props {
  assetId: string
  notes: Note[]
  currentUserId: string
  canEdit: boolean
  isAdmin: boolean
}

function fmtRelative(d: Date) {
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Agora mesmo'
  if (mins < 60) return `${mins} min atrás`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h atrás`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d atrás`
  return format(new Date(d), 'dd/MM/yyyy', { locale: ptBR })
}

function fmtFull(d: Date) {
  return format(new Date(d), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
}

export default function AssetNotesPanel({ assetId, notes: initialNotes, currentUserId, canEdit, isAdmin }: Props) {
  const [notes, setNotes] = useState(initialNotes)
  const [body, setBody] = useState('')
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleAdd() {
    if (!body.trim() || isPending) return
    const trimmed = body.trim()
    setBody('')
    textareaRef.current?.focus()

    startTransition(async () => {
      await addAssetNote(assetId, trimmed)
      setNotes(prev => [{
        id: 'optimistic-' + Date.now(),
        body: trimmed,
        createdAt: new Date(),
        author: { id: currentUserId, name: 'Você' },
      }, ...prev])
    })
  }

  function handleDelete(noteId: string) {
    setDeletingId(noteId)
    startTransition(async () => {
      await deleteAssetNote(assetId, noteId)
      setNotes(prev => prev.filter(n => n.id !== noteId))
      setDeletingId(null)
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Composer */}
      {canEdit && (
        <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 20px' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#2d4060', letterSpacing: '0.1em', marginBottom: 10 }}>
            NOVA NOTA
          </div>
          <textarea
            ref={textareaRef}
            value={body}
            onChange={e => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escreva uma nota sobre este ativo… (Ctrl+Enter para enviar)"
            rows={3}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px',
              color: '#c8d6e5', fontSize: 13, lineHeight: 1.6, resize: 'vertical',
              outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.15s',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(0,217,184,0.3)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button
              onClick={handleAdd}
              disabled={!body.trim() || isPending}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 7,
                background: body.trim() && !isPending ? 'rgba(0,217,184,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${body.trim() && !isPending ? 'rgba(0,217,184,0.3)' : 'rgba(255,255,255,0.07)'}`,
                color: body.trim() && !isPending ? '#00d9b8' : '#2d4060',
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
                cursor: body.trim() && !isPending ? 'pointer' : 'not-allowed', transition: 'all 0.15s',
              }}
            >
              <Send size={11} />
              {isPending ? 'SALVANDO...' : 'ADICIONAR NOTA'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {notes.length === 0 ? (
        <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <StickyNote size={28} color="#1e3048" />
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#1e3048', fontStyle: 'italic' }}>Nenhuma nota registrada</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notes.map(note => {
            const canDelete = isAdmin || note.author.id === currentUserId
            const isDeleting = deletingId === note.id
            return (
              <div key={note.id} style={{
                background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12, padding: '16px 20px',
                opacity: isDeleting ? 0.4 : 1, transition: 'opacity 0.2s',
                borderLeft: '3px solid rgba(0,217,184,0.25)',
                minWidth: 0, overflow: 'hidden',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, background: 'rgba(0,217,184,0.1)', border: '1px solid rgba(0,217,184,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#00d9b8' }}>
                        {note.author.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#8ba5c0' }}>
                      {note.author.id === currentUserId ? 'Você' : note.author.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', cursor: 'default' }} title={fmtFull(note.createdAt)}>
                      {fmtRelative(note.createdAt)}
                    </span>
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(note.id)}
                        disabled={isDeleting}
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 5, background: 'transparent', border: '1px solid transparent', color: '#2d4060', cursor: 'pointer', transition: 'all 0.12s' }}
                        onMouseEnter={e => { const t = e.currentTarget; t.style.background = 'rgba(248,113,113,0.1)'; t.style.borderColor = 'rgba(248,113,113,0.2)'; t.style.color = '#f87171' }}
                        onMouseLeave={e => { const t = e.currentTarget; t.style.background = 'transparent'; t.style.borderColor = 'transparent'; t.style.color = '#2d4060' }}
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
                <p style={{ fontSize: 13, color: '#c8d6e5', lineHeight: 1.65, whiteSpace: 'pre-wrap', overflowWrap: 'break-word', wordBreak: 'break-word', minWidth: 0 }}>{note.body}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
