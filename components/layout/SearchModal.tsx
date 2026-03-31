'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { UserRole } from '@prisma/client'

interface TicketResult {
  id: string
  code: string
  title: string
  status: string
  priority: string
}

interface AssetResult {
  id: string
  tag: string
  name: string
  status: string
  category: { name: string }
}

interface UserResult {
  id: string
  name: string
  email: string
  role: string
  department: { name: string } | null
}

interface SearchResults {
  tickets: TicketResult[]
  assets: AssetResult[]
  users: UserResult[]
}

// Person detail types
interface PersonAsset  { id: string; tag: string; name: string; status: string; category: { name: string } }
interface PersonTicket { id: string; code: string; title: string; status: string; priority: string; createdAt: string }
interface PersonMovement { id: string; type: string; createdAt: string; asset: { id: string; tag: string; name: string }; fromUser: { name: string } | null; toUser: { name: string } | null }
interface PersonDetail { assets: PersonAsset[]; tickets: PersonTicket[]; movements: PersonMovement[] }

interface Props {
  open: boolean
  onClose: () => void
  onOpen: () => void
  userRole: UserRole
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  OPEN:        { label: 'Aberto',       color: '#38bdf8' },
  IN_PROGRESS: { label: 'Em andamento', color: '#f59e0b' },
  ON_HOLD:     { label: 'Aguardando',   color: '#a78bfa' },
  RESOLVED:    { label: 'Resolvido',    color: '#34d399' },
  DONE:        { label: 'Concluído',    color: '#34d399' },
  CLOSED:      { label: 'Encerrado',    color: '#475569' },
  CANCELED:    { label: 'Cancelado',    color: '#475569' },
}

const ASSET_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  STOCK:       { label: 'Estoque',     color: '#38bdf8' },
  IN_USE:      { label: 'Em uso',      color: '#34d399' },
  DEPLOYED:    { label: 'Implantado',  color: '#34d399' },
  MAINTENANCE: { label: 'Manutenção',  color: '#f59e0b' },
  RETIRED:     { label: 'Aposentado',  color: '#475569' },
  DISCARDED:   { label: 'Descartado',  color: '#f87171' },
  LOANED:      { label: 'Emprestado',  color: '#818cf8' },
}

const MOV_LABELS: Record<string, string> = {
  TRANSFER:    'Transferência',
  MAINTENANCE: 'Manutenção',
  RETURN:      'Devolução',
  LOAN:        'Empréstimo',
  DISPOSAL:    'Descarte',
  PURCHASE:    'Compra',
  ADJUSTMENT:  'Ajuste',
}

const ROLE_LABELS: Record<string, string> = {
  COLABORADOR: 'Colaborador',
  AUXILIAR_TI: 'Auxiliar TI',
  TECNICO:     'Técnico TI',
  ADMIN:       'Admin TI',
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

function timeAgo(iso: string): string {
  const d = Date.now() - new Date(iso).getTime()
  const m = Math.floor(d / 60000)
  if (m < 1)   return 'agora'
  if (m < 60)  return `há ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24)  return `há ${h}h`
  const dy = Math.floor(h / 24)
  if (dy < 30) return `há ${dy}d`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

type FlatResult =
  | { kind: 'ticket'; data: TicketResult }
  | { kind: 'asset';  data: AssetResult }
  | { kind: 'user';   data: UserResult }

export default function SearchModal({ open, onClose, onOpen, userRole }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [cursor, setCursor] = useState(0)
  const [personDetail, setPersonDetail] = useState<{ id: string; data: PersonDetail | null; loading: boolean } | null>(null)
  const personDetailCache = useRef<Record<string, PersonDetail>>({})
  const debouncedQuery = useDebounce(query, 250)

  // Global Ctrl+K
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (open) onClose()
        else onOpen()
      }
      if (e.key === 'Escape' && open) onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose, onOpen])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setResults(null)
      setCursor(0)
      setPersonDetail(null)
    }
  }, [open])

  // Fetch search results
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults(null)
      return
    }
    setLoading(true)
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then(r => r.json())
      .then(data => { setResults(data); setCursor(0) })
      .finally(() => setLoading(false))
  }, [debouncedQuery])

  // Build flat list for keyboard nav
  const flat: FlatResult[] = results ? [
    ...results.tickets.map(d => ({ kind: 'ticket' as const, data: d })),
    ...results.assets.map(d => ({ kind: 'asset' as const, data: d })),
    ...results.users.map(d => ({ kind: 'user' as const, data: d })),
  ] : []

  // Load person detail when cursor is on a user result
  useEffect(() => {
    const item = flat[cursor]
    if (!item || item.kind !== 'user') { setPersonDetail(null); return }
    const userId = item.data.id
    // Check cache
    if (personDetailCache.current[userId]) {
      setPersonDetail({ id: userId, data: personDetailCache.current[userId], loading: false })
      return
    }
    setPersonDetail({ id: userId, data: null, loading: true })
    const t = setTimeout(() => {
      fetch(`/api/search/person-detail?id=${userId}`)
        .then(r => r.json())
        .then((data: PersonDetail) => {
          personDetailCache.current[userId] = data
          setPersonDetail({ id: userId, data, loading: false })
        })
        .catch(() => setPersonDetail({ id: userId, data: null, loading: false }))
    }, 100)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, flat.length])

  const navigate = useCallback((item: FlatResult) => {
    onClose()
    if (item.kind === 'ticket') router.push(`/tickets/${item.data.id}`)
    else if (item.kind === 'asset') router.push(`/assets/${item.data.id}`)
    else router.push(`/settings/usuarios`)
  }, [onClose, router])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, flat.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
    if (e.key === 'Enter' && flat[cursor]) navigate(flat[cursor])
  }

  const totalResults = results ? results.tickets.length + results.assets.length + results.users.length : 0

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '10vh',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxWidth: 620,
          background: '#0d1422',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14,
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Input row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {loading ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3d5068" strokeWidth={2} style={{ flexShrink: 0, animation: 'spin 0.7s linear infinite' }}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#3d5068" strokeWidth={2} style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
            </svg>
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar chamados, ativos, pessoas…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 15, color: '#e2eaf4', fontFamily: 'inherit',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3d5068', padding: 2, lineHeight: 0 }}
              onMouseEnter={e => (e.currentTarget.style.color = '#7e9bb5')}
              onMouseLeave={e => (e.currentTarget.style.color = '#3d5068')}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <kbd style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#2d4060', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>
            Esc
          </kbd>
        </div>

        {/* Results */}
        {!query || query.length < 2 ? (
          <div style={{ padding: '28px 18px', textAlign: 'center', color: '#2d4060', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
            Digite pelo menos 2 caracteres para buscar
          </div>
        ) : loading && !results ? (
          <div style={{ padding: '28px 18px', textAlign: 'center', color: '#2d4060', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
            Buscando…
          </div>
        ) : totalResults === 0 ? (
          <div style={{ padding: '28px 18px', textAlign: 'center', color: '#2d4060', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
            Nenhum resultado para &quot;{query}&quot;
          </div>
        ) : (
          <div style={{ maxHeight: '65vh', overflowY: 'auto', padding: '8px 0' }}>

            {/* Tickets */}
            {results!.tickets.length > 0 && (
              <section>
                <div style={{ padding: '6px 18px 4px', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#2d4060', letterSpacing: '0.1em' }}>
                  CHAMADOS
                </div>
                {results!.tickets.map((t, idx) => {
                  const globalIdx = idx
                  const st = STATUS_LABELS[t.status] ?? { label: t.status, color: '#64748b' }
                  return (
                    <button
                      key={t.id}
                      onClick={() => navigate({ kind: 'ticket', data: t })}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                        padding: '9px 18px', background: cursor === globalIdx ? 'rgba(0,217,184,0.06)' : 'transparent',
                        border: 'none', cursor: 'pointer', textAlign: 'left',
                        borderLeft: `2px solid ${cursor === globalIdx ? 'var(--accent-cyan)' : 'transparent'}`,
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={() => setCursor(globalIdx)}
                    >
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#3d5068" strokeWidth={1.8} style={{ flexShrink: 0 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#00d9b8', flexShrink: 0 }}>{t.code}</span>
                          <span style={{ fontSize: 13, color: '#c8d6e5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: st.color, background: `${st.color}18`, border: `1px solid ${st.color}40`, borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>
                        {st.label}
                      </span>
                    </button>
                  )
                })}
              </section>
            )}

            {/* Assets */}
            {results!.assets.length > 0 && (
              <section>
                <div style={{ padding: '6px 18px 4px', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#2d4060', letterSpacing: '0.1em', marginTop: results!.tickets.length > 0 ? 4 : 0 }}>
                  PATRIMÔNIO
                </div>
                {results!.assets.map((a, idx) => {
                  const globalIdx = results!.tickets.length + idx
                  const st = ASSET_STATUS_LABELS[a.status] ?? { label: a.status, color: '#64748b' }
                  return (
                    <button
                      key={a.id}
                      onClick={() => navigate({ kind: 'asset', data: a })}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                        padding: '9px 18px', background: cursor === globalIdx ? 'rgba(0,217,184,0.06)' : 'transparent',
                        border: 'none', cursor: 'pointer', textAlign: 'left',
                        borderLeft: `2px solid ${cursor === globalIdx ? 'var(--accent-cyan)' : 'transparent'}`,
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={() => setCursor(globalIdx)}
                    >
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#3d5068" strokeWidth={1.8} style={{ flexShrink: 0 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                      </svg>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#fbbf24', flexShrink: 0 }}>{a.tag}</span>
                          <span style={{ fontSize: 13, color: '#c8d6e5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</span>
                        </div>
                        <span style={{ fontSize: 11, color: '#3d5068' }}>{a.category.name}</span>
                      </div>
                      <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: st.color, background: `${st.color}18`, border: `1px solid ${st.color}40`, borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>
                        {st.label}
                      </span>
                    </button>
                  )
                })}
              </section>
            )}

            {/* Users */}
            {results!.users.length > 0 && (
              <section>
                <div style={{ padding: '6px 18px 4px', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#2d4060', letterSpacing: '0.1em', marginTop: (results!.tickets.length + results!.assets.length) > 0 ? 4 : 0 }}>
                  PESSOAS
                </div>
                {results!.users.map((u, idx) => {
                  const globalIdx = results!.tickets.length + results!.assets.length + idx
                  const isActive = cursor === globalIdx
                  const showDetail = isActive && personDetail?.id === u.id
                  return (
                    <div key={u.id}>
                      {/* Person row */}
                      <button
                        onClick={() => navigate({ kind: 'user', data: u })}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                          padding: '9px 18px', background: isActive ? 'rgba(0,217,184,0.06)' : 'transparent',
                          border: 'none', cursor: 'pointer', textAlign: 'left',
                          borderLeft: `2px solid ${isActive ? 'var(--accent-cyan)' : 'transparent'}`,
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={() => setCursor(globalIdx)}
                      >
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#3d5068" strokeWidth={1.8} style={{ flexShrink: 0 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: '#c8d6e5', marginBottom: 2 }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: '#3d5068' }}>{u.email}{u.department ? ` · ${u.department.name}` : ''}</div>
                        </div>
                        <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#64748b', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>
                          {ROLE_LABELS[u.role] ?? u.role}
                        </span>
                      </button>

                      {/* Expanded person detail */}
                      {showDetail && (
                        <div style={{
                          margin: '0 12px 8px',
                          background: '#080f1c',
                          border: '1px solid rgba(0,217,184,0.12)',
                          borderRadius: 10,
                          overflow: 'hidden',
                        }}>
                          {personDetail.loading ? (
                            <div style={{ padding: '16px 18px', textAlign: 'center', color: '#2d4060', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                              Carregando…
                            </div>
                          ) : !personDetail.data ? null : (
                            <>
                              {/* ── Equipamentos ── */}
                              <PersonSection
                                label="EQUIPAMENTOS"
                                count={personDetail.data.assets.length}
                                verMaisHref={`/assets?userId=${u.id}`}
                                empty="Nenhum equipamento atribuído"
                                onNavigate={onClose}
                              >
                                {personDetail.data.assets.map(a => {
                                  const st = ASSET_STATUS_LABELS[a.status] ?? { label: a.status, color: '#64748b' }
                                  return (
                                    <PersonDetailRow
                                      key={a.id}
                                      href={`/assets/${a.id}`}
                                      onNavigate={onClose}
                                      left={<><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#fbbf24' }}>{a.tag}</span> <span style={{ fontSize: 12, color: '#c8d6e5' }}>{a.name}</span></>}
                                      right={<span style={{ fontSize: 10, color: st.color }}>{st.label}</span>}
                                    />
                                  )
                                })}
                              </PersonSection>

                              {/* ── Chamados ── */}
                              <PersonSection
                                label="CHAMADOS"
                                count={personDetail.data.tickets.length}
                                verMaisHref={`/tickets?requester=${u.id}`}
                                empty="Nenhum chamado encontrado"
                                onNavigate={onClose}
                                borderTop
                              >
                                {personDetail.data.tickets.map(t => {
                                  const st = STATUS_LABELS[t.status] ?? { label: t.status, color: '#64748b' }
                                  return (
                                    <PersonDetailRow
                                      key={t.id}
                                      href={`/tickets/${t.id}`}
                                      onNavigate={onClose}
                                      left={<><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#00d9b8' }}>{t.code}</span> <span style={{ fontSize: 12, color: '#c8d6e5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{t.title}</span></>}
                                      right={<><span style={{ fontSize: 10, color: st.color }}>{st.label}</span><span style={{ fontSize: 10, color: '#2d4060', marginLeft: 8 }}>{timeAgo(t.createdAt)}</span></>}
                                    />
                                  )
                                })}
                              </PersonSection>

                              {/* ── Movimentações ── */}
                              <PersonSection
                                label="MOVIMENTAÇÕES"
                                count={personDetail.data.movements.length}
                                verMaisHref={`/movements?q=${encodeURIComponent(u.name)}`}
                                empty="Nenhuma movimentação encontrada"
                                onNavigate={onClose}
                                borderTop
                              >
                                {personDetail.data.movements.map(m => (
                                  <PersonDetailRow
                                    key={m.id}
                                    href={`/assets/${m.asset.id}`}
                                    onNavigate={onClose}
                                    left={<><span style={{ fontSize: 10, color: '#818cf8', fontFamily: "'JetBrains Mono', monospace" }}>{MOV_LABELS[m.type] ?? m.type}</span> <span style={{ fontSize: 12, color: '#c8d6e5' }}>{m.asset.tag} · {m.asset.name}</span></>}
                                    right={<span style={{ fontSize: 10, color: '#2d4060' }}>{timeAgo(m.createdAt)}</span>}
                                  />
                                ))}
                              </PersonSection>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </section>
            )}
          </div>
        )}

        {/* Footer hints */}
        {totalResults > 0 && (
          <div style={{ padding: '8px 18px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 16, alignItems: 'center' }}>
            {[
              { key: '↑↓', label: 'navegar' },
              { key: '↵',  label: 'abrir' },
              { key: 'Esc', label: 'fechar' },
            ].map(h => (
              <span key={h.key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#2d4060', fontFamily: "'JetBrains Mono', monospace" }}>
                <kbd style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3, padding: '1px 5px' }}>{h.key}</kbd>
                {h.label}
              </span>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PersonSection({
  label, count, verMaisHref, empty, onNavigate, children, borderTop,
}: {
  label: string
  count: number
  verMaisHref: string
  empty: string
  onNavigate: () => void
  children: React.ReactNode
  borderTop?: boolean
}) {
  return (
    <div style={{ borderTop: borderTop ? '1px solid rgba(255,255,255,0.05)' : undefined }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px 4px' }}>
        <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: '#2d4060', letterSpacing: '0.1em' }}>
          {label} {count > 0 && <span style={{ color: '#3d5068' }}>({count})</span>}
        </span>
        <a
          href={verMaisHref}
          onClick={e => { e.preventDefault(); onNavigate(); window.location.href = verMaisHref }}
          style={{ fontSize: 10, color: '#3d5068', textDecoration: 'none', fontFamily: "'JetBrains Mono', monospace', display: 'flex', alignItems: 'center', gap: 3" }}
          onMouseEnter={e => (e.currentTarget.style.color = '#00d9b8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#3d5068')}
        >
          ver mais →
        </a>
      </div>
      {count === 0 ? (
        <p style={{ padding: '6px 14px 10px', fontSize: 11, color: '#2d4060', fontFamily: "'JetBrains Mono', monospace" }}>{empty}</p>
      ) : (
        <div style={{ padding: '0 6px 8px' }}>{children}</div>
      )}
    </div>
  )
}

function PersonDetailRow({
  href, onNavigate, left, right,
}: {
  href: string
  onNavigate: () => void
  left: React.ReactNode
  right: React.ReactNode
}) {
  return (
    <a
      href={href}
      onClick={e => { e.preventDefault(); onNavigate(); window.location.href = href }}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        padding: '5px 8px', borderRadius: 6, textDecoration: 'none',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>{left}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>{right}</div>
    </a>
  )
}
