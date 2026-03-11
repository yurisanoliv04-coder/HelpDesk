'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Visibility = 'PUBLIC' | 'TECHNICIANS' | 'AUTHOR'

interface Props {
  ticketId: string
  canSendInternal: boolean
}

const visibilityOptions: { value: Visibility; label: string; desc: string; color: string; bg: string; border: string }[] = [
  { value: 'PUBLIC',      label: 'Todos',          desc: 'Visível para todos',                color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)' },
  { value: 'TECHNICIANS', label: 'Técnicos',        desc: 'Apenas equipe TI',                  color: '#38bdf8', bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.25)' },
  { value: 'AUTHOR',      label: 'Somente eu',      desc: 'Apenas você pode ver',              color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.25)' },
]

export default function MessageComposer({ ticketId, canSendInternal }: Props) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [isNote, setIsNote] = useState(false)
  const [visibility, setVisibility] = useState<Visibility>('PUBLIC')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim() || loading) return
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/tickets/${ticketId}/message`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: body.trim(), isNote, visibility }),
      })
      const data = await res.json()
      if (data.ok) {
        setBody('')
        router.refresh()
        textareaRef.current?.focus()
      } else {
        setError(data.error?.message ?? 'Erro ao enviar')
      }
    } catch { setError('Erro de conexão. Tente novamente.') }
    finally { setLoading(false) }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSubmit(e as any) }
  }

  // Notes can only be PUBLIC or TECHNICIANS
  const validOptions = isNote
    ? visibilityOptions.filter(o => o.value !== 'AUTHOR')
    : visibilityOptions
  const activeVis = visibilityOptions.find(o => o.value === visibility)!
  const noteColor = visibility === 'PUBLIC' ? '#94a3b8' : '#38bdf8'
  const noteBg = visibility === 'PUBLIC' ? 'rgba(148,163,184,0.06)' : 'rgba(56,189,248,0.06)'
  const noteBorder = visibility === 'PUBLIC' ? 'rgba(148,163,184,0.15)' : 'rgba(56,189,248,0.15)'

  return (
    <form onSubmit={handleSubmit} style={{
      background: isNote ? noteBg : '#0d1422',
      border: `1px solid ${isNote ? noteBorder : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 10, overflow: 'hidden', transition: 'all 0.2s',
    }}>
      {/* Note banner */}
      {isNote && (
        <div style={{
          padding: '8px 14px 6px',
          display: 'flex', alignItems: 'center', gap: 6,
          borderBottom: `1px solid ${noteBorder}`,
        }}>
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke={noteColor} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
            color: noteColor, letterSpacing: '0.08em',
          }}>
            NOTA — {visibility === 'PUBLIC' ? 'VISÍVEL A TODOS' : 'APENAS TÉCNICOS'}
          </span>
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={body}
        onChange={e => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isNote ? 'Escreva uma nota...' : 'Escreva uma mensagem... (Ctrl+Enter para enviar)'}
        rows={3}
        style={{
          width: '100%', padding: '12px 14px',
          background: 'transparent', border: 'none', outline: 'none',
          color: '#c8d6e5', fontFamily: 'inherit', fontSize: 14,
          resize: 'none', lineHeight: 1.6, boxSizing: 'border-box',
        }}
      />

      <div style={{
        padding: '8px 14px 12px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Note toggle — TI only */}
          {canSendInternal && (
            <button
              type="button"
              onClick={() => {
                const next = !isNote; setIsNote(next)
                if (next && visibility === 'AUTHOR') setVisibility('TECHNICIANS')
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 6,
                background: isNote ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isNote ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.08)'}`,
                color: isNote ? '#38bdf8' : '#3d5068',
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Nota
            </button>
          )}

          {/* Visibility selector — TI only */}
          {canSendInternal && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {validOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setVisibility(opt.value)}
                  title={opt.desc}
                  style={{
                    padding: '4px 9px', borderRadius: 6,
                    background: visibility === opt.value ? opt.bg : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${visibility === opt.value ? opt.border : 'rgba(255,255,255,0.06)'}`,
                    color: visibility === opt.value ? opt.color : '#2d4060',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
                    cursor: 'pointer', transition: 'all 0.12s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {!canSendInternal && (
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#2d4060' }}>
              Ctrl+Enter para enviar
            </span>
          )}
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={!body.trim() || loading}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '7px 16px', borderRadius: 7,
            background: isNote ? activeVis.bg : 'rgba(0,217,184,0.1)',
            border: `1px solid ${isNote ? activeVis.border : 'rgba(0,217,184,0.28)'}`,
            color: isNote ? activeVis.color : '#00d9b8',
            fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
            cursor: !body.trim() || loading ? 'not-allowed' : 'pointer',
            opacity: !body.trim() || loading ? 0.4 : 1, transition: 'opacity 0.15s',
          }}
        >
          {loading ? (
            <>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }}/>
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" style={{ opacity: 0.75 }}/>
              </svg>
              Enviando...
            </>
          ) : (
            <>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              {isNote ? 'Salvar nota' : 'Enviar'}
            </>
          )}
        </button>
      </div>

      {error && (
        <div style={{
          margin: '0 14px 12px', padding: '7px 12px',
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
          borderRadius: 7, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#f87171',
        }}>
          {error}
        </div>
      )}
    </form>
  )
}
