'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Solution {
  id: string
  title: string
  body: string
  createdBy: { name: string }
  createdAt: string
}

interface Props {
  ticketId: string
  solutions: Solution[]
}

export default function SolutionPanel({ ticketId, solutions: initial }: Props) {
  const router = useRouter()
  const [solutions, setSolutions] = useState(initial)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim() || loading) return
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/tickets/${ticketId}/solution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
      })
      const data = await res.json()
      if (data.ok) {
        setSolutions(prev => [data.data, ...prev])
        setTitle(''); setBody(''); setOpen(false)
        router.refresh()
      } else {
        setError(data.error?.message ?? 'Erro ao salvar solução')
      }
    } catch { setError('Erro de conexão') }
    finally { setLoading(false) }
  }

  return (
    <div style={{
      background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#34d399" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#7a9bbc', letterSpacing: '0.06em' }}>
            SOLUÇÃO
            {solutions.length > 0 && (
              <span style={{
                marginLeft: 6, fontSize: 10, fontWeight: 600,
                background: 'rgba(52,211,153,0.12)', color: '#34d399',
                border: '1px solid rgba(52,211,153,0.25)',
                padding: '1px 6px', borderRadius: 8,
              }}>
                {solutions.length}
              </span>
            )}
          </span>
        </div>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            style={{
              background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)',
              borderRadius: 6, padding: '4px 10px',
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
              color: '#34d399', cursor: 'pointer',
            }}
          >
            + Adicionar
          </button>
        )}
      </div>

      {/* Soluções existentes */}
      {solutions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {solutions.map(s => (
            <div
              key={s.id}
              style={{
                background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.15)',
                borderRadius: 7, padding: '10px 12px', cursor: 'pointer',
              }}
              onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#7dd3b8' }}>
                  {s.title}
                </span>
                <svg
                  width="12" height="12" fill="none" viewBox="0 0 24 24"
                  stroke="#3d5068" strokeWidth={2}
                  style={{ transform: expandedId === s.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {expandedId === s.id && (
                <p style={{ fontSize: 12, color: '#7a9bbc', marginTop: 8, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {s.body}
                </p>
              )}
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060', marginTop: 6 }}>
                {s.createdBy.name}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Formulário */}
      {open && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Título da solução..."
            style={{
              padding: '8px 12px', borderRadius: 7,
              background: '#060d18', border: '1px solid rgba(255,255,255,0.1)',
              color: '#c8d6e5', fontFamily: 'inherit', fontSize: 13, outline: 'none',
            }}
          />
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Descreva como o problema foi resolvido, passos, links relevantes..."
            rows={4}
            style={{
              padding: '8px 12px', borderRadius: 7,
              background: '#060d18', border: '1px solid rgba(255,255,255,0.1)',
              color: '#c8d6e5', fontFamily: 'inherit', fontSize: 13, outline: 'none',
              resize: 'none', lineHeight: 1.6,
            }}
          />
          {error && (
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#f87171' }}>{error}</p>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => { setOpen(false); setTitle(''); setBody(''); setError('') }}
              style={{
                flex: 1, padding: '8px', borderRadius: 7,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                color: '#3d5068', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !body.trim() || loading}
              style={{
                flex: 1, padding: '8px', borderRadius: 7,
                background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)',
                color: '#34d399', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700,
                cursor: !title.trim() || !body.trim() || loading ? 'not-allowed' : 'pointer',
                opacity: !title.trim() || !body.trim() || loading ? 0.4 : 1,
              }}
            >
              {loading ? 'Salvando...' : 'Salvar solução'}
            </button>
          </div>
        </form>
      )}

      {solutions.length === 0 && !open && (
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#2d4060' }}>
          Nenhuma solução registrada ainda.
        </p>
      )}
    </div>
  )
}
