'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CategoryIcon } from '@/components/ui/CategoryIcon'

type Category = {
  id: string
  name: string
  description: string | null
  icon: string | null
  defaultPriority: string
}
type User = {
  id: string
  name: string
  email: string
  role: string
  department: { name: string } | null
}
type Solution = {
  id: string
  title: string
  body: string
  categoryId: string
  createdBy: { name: string }
  createdAt: string
}
type AssetInfo = {
  id: string
  tag: string
  name: string
  category: { name: string; icon: string | null }
}

interface Props {
  categories: Category[]
  users: User[]
  solutions: Solution[]
  currentUserId: string
  isTI: boolean
  isAux?: boolean
  assetsByUser?: Record<string, AssetInfo[]>
}

const PRIORITIES = [
  { value: 'LOW',    label: 'Baixa',   color: '#475569', bg: 'rgba(71,85,105,0.12)',   border: 'rgba(71,85,105,0.3)',   desc: 'Sem urgência' },
  { value: 'MEDIUM', label: 'Média',   color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.3)',  desc: 'Impacto moderado' },
  { value: 'HIGH',   label: 'Alta',    color: '#fb923c', bg: 'rgba(251,146,60,0.1)',   border: 'rgba(251,146,60,0.3)',  desc: 'Impacto significativo' },
  { value: 'URGENT', label: 'Urgente', color: '#f87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.3)', desc: 'Bloqueia o trabalho' },
]

const priorityLabel: Record<string, { label: string; color: string }> = {
  LOW:    { label: 'Baixa',   color: '#475569' },
  MEDIUM: { label: 'Média',   color: '#fbbf24' },
  HIGH:   { label: 'Alta',    color: '#fb923c' },
  URGENT: { label: 'Urgente', color: '#f87171' },
}

export default function NewTicketForm({ categories, users, solutions, currentUserId, isTI, isAux, assetsByUser }: Props) {
  const router = useRouter()

  const [categoryId, setCategoryId] = useState('')
  const [priority, setPriority]     = useState('MEDIUM')
  const [title, setTitle]           = useState('')
  const [description, setDescription] = useState('')
  const [requesterId, setRequesterId] = useState(currentUserId)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [solutionExpanded, setSolutionExpanded] = useState<string | null>(null)

  const selectedCategory = categories.find(c => c.id === categoryId)

  // When AUXILIAR_TI selects a category, auto-set priority from category default
  function handleCategorySelect(cat: Category) {
    setCategoryId(cat.id)
    setSolutionExpanded(null)
    if (isAux) setPriority(cat.defaultPriority)
  }

  const matchedSolutions = categoryId
    ? solutions.filter(s => s.categoryId === categoryId)
    : []

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !description.trim() || !categoryId) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim(),
        categoryId,
        priority,
      }
      // Only TI (non-aux) can send a different requesterId
      if (isTI && !isAux && requesterId !== currentUserId) {
        body.requesterId = requesterId
      }
      // AUXILIAR_TI always sends requesterId (for the user they're opening on behalf of)
      if (isAux && requesterId !== currentUserId) {
        body.requesterId = requesterId
      }

      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.ok) {
        router.push(`/tickets/${data.data.id}`)
      } else {
        setError(data.error?.message ?? 'Erro ao criar chamado.')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const selectedPriority = PRIORITIES.find(p => p.value === priority) ?? PRIORITIES[1]

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Problemas comuns ──────────────────────────────────── */}
      {matchedSolutions.length > 0 && (
        <div style={{
          background: 'rgba(0,217,184,0.04)', border: '1px solid rgba(0,217,184,0.2)',
          borderRadius: 10, padding: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#00d9b8" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#00d9b8', letterSpacing: '0.06em' }}>
              PROBLEMAS COMUNS — {selectedCategory?.name.toUpperCase()}
            </span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
              color: '#3d5068', background: 'rgba(0,217,184,0.1)', border: '1px solid rgba(0,217,184,0.2)',
              padding: '1px 6px', borderRadius: 10,
            }}>
              {matchedSolutions.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {matchedSolutions.map(sol => (
              <div key={sol.id} style={{
                background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 8, overflow: 'hidden',
              }}>
                <button
                  type="button"
                  onClick={() => setSolutionExpanded(solutionExpanded === sol.id ? null : sol.id)}
                  style={{
                    width: '100%', padding: '10px 14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'none', border: 'none', cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>{sol.title}</span>
                  <svg
                    width="12" height="12" fill="none" viewBox="0 0 24 24"
                    stroke="#3d5068" strokeWidth={2}
                    style={{ transition: 'transform 0.15s', transform: solutionExpanded === sol.id ? 'rotate(180deg)' : 'none', flexShrink: 0 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {solutionExpanded === sol.id && (
                  <div style={{ padding: '0 14px 14px' }}>
                    <p style={{ fontSize: 13, color: '#4a6580', whiteSpace: 'pre-wrap', lineHeight: 1.65, marginBottom: 10 }}>
                      {sol.body}
                    </p>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060' }}>
                      por {sol.createdBy.name}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060', marginTop: 10 }}>
            Consulte as soluções acima antes de abrir o chamado.
          </p>
        </div>
      )}

      {/* ── Categoria ─────────────────────────────────────────── */}
      <FormBlock label="Categoria" required>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
          {categories.map(cat => {
            const active = categoryId === cat.id
            const defPrio = priorityLabel[cat.defaultPriority]
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat)}
                style={{
                  padding: '10px 14px', borderRadius: 8, textAlign: 'left',
                  background: active ? 'rgba(0,217,184,0.1)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${active ? 'rgba(0,217,184,0.35)' : 'rgba(255,255,255,0.07)'}`,
                  cursor: 'pointer', transition: 'all 0.12s',
                }}
              >
                {cat.icon && (
                  <span style={{ display: 'block', marginBottom: 4 }}>
                    <CategoryIcon name={cat.icon} size={18} color={active ? '#00d9b8' : '#3d5068'} />
                  </span>
                )}
                <span style={{
                  fontSize: 13, fontWeight: 600,
                  color: active ? '#00d9b8' : '#7a9bbc', display: 'block',
                }}>
                  {cat.name}
                </span>
                {cat.description && (
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: active ? '#3d9e8e' : '#2d4060', display: 'block', marginTop: 3 }}>
                    {cat.description}
                  </span>
                )}
                {/* Show default priority hint for aux users */}
                {isAux && defPrio && (
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                    color: defPrio.color, display: 'block', marginTop: 4, opacity: 0.8,
                  }}>
                    ● {defPrio.label}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </FormBlock>

      {/* ── Prioridade (TI only, hidden for AUXILIAR_TI) ────────── */}
      {!isAux && (
        <FormBlock label="Prioridade" required>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {PRIORITIES.map(p => {
              const active = priority === p.value
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  style={{
                    padding: '10px 8px', borderRadius: 8, textAlign: 'center',
                    background: active ? p.bg : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${active ? p.border : 'rgba(255,255,255,0.07)'}`,
                    cursor: 'pointer', transition: 'all 0.12s',
                  }}
                >
                  <span style={{
                    display: 'block', width: 8, height: 8, borderRadius: '50%',
                    background: p.color, margin: '0 auto 6px',
                  }} />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: active ? p.color : '#3d5068', display: 'block' }}>
                    {p.label}
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: active ? p.color + 'aa' : '#1e3048', display: 'block', marginTop: 2 }}>
                    {p.desc}
                  </span>
                </button>
              )
            })}
          </div>
        </FormBlock>
      )}

      {/* Auto-priority indicator for AUXILIAR_TI */}
      {isAux && categoryId && (
        <div style={{
          padding: '10px 14px', borderRadius: 8,
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3d5068' }}>
            PRIORIDADE AUTOMÁTICA:
          </span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
            color: priorityLabel[priority]?.color ?? '#fbbf24',
          }}>
            ● {priorityLabel[priority]?.label ?? 'Média'}
          </span>
        </div>
      )}

      {/* ── Solicitante ───────────────────────────────────────── */}
      {/* For TI (non-aux): full user list */}
      {isTI && !isAux && (
        <FormBlock label="Solicitante">
          <select
            value={requesterId}
            onChange={e => setRequesterId(e.target.value)}
            style={selectStyle}
          >
            {users.map(u => (
              <option key={u.id} value={u.id} style={{ background: '#060d18' }}>
                {u.name}{u.id === currentUserId ? ' (você)' : ''}{u.department ? ` — ${u.department.name}` : ''}
              </option>
            ))}
          </select>
        </FormBlock>
      )}

      {/* For AUXILIAR_TI: department-filtered user dropdown + assets */}
      {isAux && (
        <FormBlock label="Para quem é o chamado?" required>
          <select
            value={requesterId}
            onChange={e => setRequesterId(e.target.value)}
            style={selectStyle}
          >
            {users.map(u => (
              <option key={u.id} value={u.id} style={{ background: '#060d18' }}>
                {u.name}{u.id === currentUserId ? ' (você)' : ''}
              </option>
            ))}
          </select>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
            color: '#2d4060', marginTop: 6,
          }}>
            Exibindo apenas usuários do seu departamento.
          </p>

          {/* Assets panel — shown when a user is selected and has assets */}
          {assetsByUser && requesterId && (assetsByUser[requesterId]?.length ?? 0) > 0 && (
            <div style={{
              marginTop: 14,
              paddingTop: 14,
              borderTop: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#00d9b8" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18" />
                </svg>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                  fontWeight: 700, color: '#00d9b8', letterSpacing: '0.06em',
                }}>
                  EQUIPAMENTOS VINCULADOS
                </span>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                  color: '#3d5068', background: 'rgba(0,217,184,0.1)',
                  border: '1px solid rgba(0,217,184,0.2)',
                  padding: '1px 6px', borderRadius: 8,
                }}>
                  {assetsByUser[requesterId].length}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {assetsByUser[requesterId].map(asset => (
                  <div
                    key={asset.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      padding: '6px 10px', borderRadius: 8,
                      background: 'rgba(0,217,184,0.05)',
                      border: '1px solid rgba(0,217,184,0.15)',
                    }}
                  >
                    <CategoryIcon name={asset.category.icon} size={14} color="#00d9b8" />
                    <div>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                        fontWeight: 700, color: '#00d9b8', display: 'block', lineHeight: 1.2,
                      }}>
                        {asset.tag}
                      </span>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                        color: '#3d5068', display: 'block', lineHeight: 1.2,
                      }}>
                        {asset.name.length > 22 ? asset.name.slice(0, 22) + '…' : asset.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                color: '#1e3048', marginTop: 8,
              }}>
                Equipamentos atribuídos a este colaborador para referência.
              </p>
            </div>
          )}

          {/* No assets message */}
          {assetsByUser && requesterId && (assetsByUser[requesterId]?.length ?? 0) === 0 && (
            <div style={{
              marginTop: 14, paddingTop: 14,
              borderTop: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#2d4060" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                color: '#2d4060', fontStyle: 'italic',
              }}>
                Nenhum equipamento vinculado a este usuário.
              </span>
            </div>
          )}
        </FormBlock>
      )}

      {/* ── Título ────────────────────────────────────────────── */}
      <FormBlock label="Título" required hint="Descreva o problema em uma frase curta">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Ex: Computador não liga ao pressionar o botão"
          maxLength={200}
          style={{
            ...inputStyle,
            borderColor: title.length > 180 ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.1)',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: title.length > 180 ? '#f87171' : '#2d4060' }}>
            {title.length}/200
          </span>
        </div>
      </FormBlock>

      {/* ── Descrição ─────────────────────────────────────────── */}
      <FormBlock label="Descrição" required hint="Inclua o que aconteceu, quando começou e o que já tentou">
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder={`Exemplo:\n— O problema acontece desde ontem às 14h\n— Já tentei reiniciar o computador\n— O erro que aparece é: "..."`}
          rows={6}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </FormBlock>

      {/* ── Error ─────────────────────────────────────────────── */}
      {error && (
        <div style={{
          padding: '10px 14px',
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
          borderRadius: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#f87171',
        }}>
          {error}
        </div>
      )}

      {/* ── Botões ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
        <a
          href={isAux ? '/aux' : '/tickets'}
          style={{
            padding: '10px 20px', borderRadius: 8,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
            color: '#3d5068', textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
          }}
        >
          Cancelar
        </a>
        <button
          type="submit"
          disabled={loading || !title.trim() || !description.trim() || !categoryId}
          style={{
            padding: '10px 24px', borderRadius: 8,
            background: 'rgba(0,217,184,0.15)', border: `1px solid ${selectedPriority.border}`,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
            color: '#00d9b8', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: (loading || !title.trim() || !description.trim() || !categoryId) ? 0.4 : 1,
            display: 'inline-flex', alignItems: 'center', gap: 8,
            transition: 'opacity 0.15s',
          }}
        >
          {loading ? (
            <>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }}/>
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" style={{ opacity: 0.75 }}/>
              </svg>
              Abrindo chamado...
            </>
          ) : (
            <>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Abrir chamado
            </>
          )}
        </button>
      </div>
    </form>
  )
}

// ── Shared styles ──────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  background: '#060d18', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, color: '#c8d6e5',
  fontFamily: 'inherit', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', lineHeight: 1.6,
}

const selectStyle: React.CSSProperties = {
  ...inputStyle, cursor: 'pointer',
}

function FormBlock({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode
}) {
  return (
    <div style={{
      background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10, padding: '16px 18px',
    }}>
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#7a9bbc', letterSpacing: '0.06em' }}>
          {label.toUpperCase()}
          {required && <span style={{ color: '#f87171', marginLeft: 4 }}>*</span>}
        </span>
        {hint && (
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060', marginLeft: 10 }}>
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}
