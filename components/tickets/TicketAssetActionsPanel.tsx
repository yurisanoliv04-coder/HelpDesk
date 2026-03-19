'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { Search, Package, LogIn, LogOut, User, Loader2, Check, X, Plus } from 'lucide-react'
import { searchAssets, executeTicketAssetAction } from '@/app/(app)/tickets/[id]/actions'

interface AssetOption {
  id: string
  tag: string
  name: string
  status: string
  assignedToUserId: string | null
  assignedToUser: { name: string } | null
  category: { name: string } | null
}

interface UserOption {
  id: string
  name: string
}

interface LinkedAsset {
  orderId: string
  assetTag: string
  assetName: string
  action: string
  orderStatus: string
}

interface Props {
  ticketId: string
  requesterId: string
  requesterName: string
  users: UserOption[]
  linkedAssets: LinkedAsset[]
}

type Action = 'ASSIGN_ASSET' | 'REMOVE_ASSET'

const actionLabel: Record<string, string> = {
  ASSIGN_ASSET: 'Alocado', REMOVE_ASSET: 'Devolvido',
  SEND_MAINTENANCE: 'Manutenção', RETURN_STOCK: 'Devolvido', DISCARD_ASSET: 'Descartado',
}

export default function TicketAssetActionsPanel({ ticketId, requesterId, users, linkedAssets }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [query, setQuery] = useState('')
  const [assets, setAssets] = useState<AssetOption[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<AssetOption | null>(null)
  const [action, setAction] = useState<Action>('ASSIGN_ASSET')
  const [targetUserId, setTargetUserId] = useState(requesterId)
  const [notes, setNotes] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load assets when form opens
  useEffect(() => {
    if (!showForm) return
    searchAssets('').then(setAssets)
  }, [showForm])

  // Debounced asset search
  useEffect(() => {
    if (!showForm) return
    if (searchRef.current) clearTimeout(searchRef.current)
    searchRef.current = setTimeout(async () => {
      setSearching(true)
      try { setAssets(await searchAssets(query)) }
      finally { setSearching(false) }
    }, 300)
    return () => { if (searchRef.current) clearTimeout(searchRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  function openForm() {
    setShowForm(true)
    setSelectedAsset(null)
    setQuery('')
    setDone(false)
    setError(null)
  }

  function closeForm() {
    setShowForm(false)
    setSelectedAsset(null)
    setQuery('')
    setError(null)
  }

  function handleSelectAsset(asset: AssetOption) {
    setSelectedAsset(asset)
    setAction(asset.status === 'DEPLOYED' ? 'REMOVE_ASSET' : 'ASSIGN_ASSET')
    setTargetUserId(requesterId)
    setError(null)
  }

  function handleExecute() {
    if (!selectedAsset) return
    setError(null)
    startTransition(async () => {
      try {
        await executeTicketAssetAction(
          ticketId,
          selectedAsset.id,
          action,
          action === 'ASSIGN_ASSET' ? targetUserId : undefined,
          notes.trim() || undefined,
        )
        setDone(true)
        setShowForm(false)
        setSelectedAsset(null)
        setNotes('')
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erro ao executar ação')
      }
    })
  }

  const execColor = action === 'ASSIGN_ASSET' ? '#34d399' : '#94a3b8'

  return (
    <div style={{
      background: '#0d1422',
      border: `1px solid ${showForm ? 'rgba(0,217,184,0.2)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 10,
      overflow: 'hidden',
      transition: 'border-color 0.15s',
    }}>
      {/* Header row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '13px 16px',
        borderBottom: (showForm || linkedAssets.length > 0) ? '1px solid rgba(255,255,255,0.06)' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 6,
            background: 'rgba(0,217,184,0.08)', border: '1px solid rgba(0,217,184,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Package size={12} color="#00d9b8" />
          </div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#7a9bbc', letterSpacing: '0.06em' }}>
            ATIVOS DO CHAMADO
          </p>
          {linkedAssets.length > 0 && (
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
              background: 'rgba(0,217,184,0.08)', border: '1px solid rgba(0,217,184,0.18)',
              color: '#00d9b8', borderRadius: 10, padding: '1px 7px',
            }}>
              {linkedAssets.length}
            </span>
          )}
        </div>

        {!showForm ? (
          <button
            onClick={openForm}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 11px', borderRadius: 7,
              background: 'rgba(0,217,184,0.08)', border: '1px solid rgba(0,217,184,0.2)',
              color: '#00d9b8', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,217,184,0.14)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,217,184,0.08)' }}
          >
            <Plus size={11} /> Adicionar
          </button>
        ) : (
          <button
            onClick={closeForm}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 26, height: 26, borderRadius: 6,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              color: '#3d5068', cursor: 'pointer',
            }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Linked assets list (collapsed state) */}
      {!showForm && linkedAssets.length > 0 && (
        <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {linkedAssets.map((la, i) => (
            <div key={`${la.orderId}-${i}`} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 10px', borderRadius: 7,
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                background: la.orderStatus === 'DONE' ? '#34d399' : '#f59e0b',
              }} />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#c8d6e5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {la.assetTag}
                  <span style={{ fontWeight: 400, color: '#3d5068', marginLeft: 6 }}>{la.assetName}</span>
                </p>
              </div>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
                color: la.orderStatus === 'DONE' ? '#34d399' : '#f59e0b',
                background: la.orderStatus === 'DONE' ? 'rgba(52,211,153,0.08)' : 'rgba(245,158,11,0.08)',
                border: `1px solid ${la.orderStatus === 'DONE' ? 'rgba(52,211,153,0.2)' : 'rgba(245,158,11,0.2)'}`,
                borderRadius: 4, padding: '2px 6px', flexShrink: 0,
              }}>
                {actionLabel[la.action] ?? la.action}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Success banner (after form closes) */}
      {done && !showForm && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, margin: '0 16px 12px',
          background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
          borderRadius: 7, padding: '7px 11px',
        }}>
          <Check size={11} color="#34d399" />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#34d399' }}>Movimentação registrada</span>
        </div>
      )}

      {/* ── Form (expanded) ── */}
      {showForm && (
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
              borderRadius: 7, padding: '7px 11px',
            }}>
              <X size={11} color="#f87171" />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#f87171' }}>{error}</span>
            </div>
          )}

          {/* Asset selection */}
          {!selectedAsset ? (
            <>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#2d4060', display: 'flex' }}>
                  {searching ? <Loader2 size={12} style={{ animation: 'spin 0.6s linear infinite' }} /> : <Search size={12} />}
                </span>
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Tag, nome, categoria..."
                  autoFocus
                  style={{
                    width: '100%', padding: '7px 8px 7px 28px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    borderRadius: 7, color: '#c8d6e5', fontSize: 12,
                    fontFamily: "'JetBrains Mono', monospace", outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 190, overflowY: 'auto' }}>
                {assets.length === 0 && !searching && (
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#2d4060', textAlign: 'center', padding: '10px 0' }}>
                    Nenhum ativo disponível
                  </p>
                )}
                {assets.map(a => (
                  <button
                    key={a.id}
                    onClick={() => handleSelectAsset(a)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '7px 10px', borderRadius: 7,
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.1s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,217,184,0.06)'; e.currentTarget.style.borderColor = 'rgba(0,217,184,0.18)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)' }}
                  >
                    <div style={{
                      width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                      background: a.status === 'STOCK' ? '#34d399' : '#38bdf8',
                    }} />
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#c8d6e5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.tag}
                        <span style={{ fontWeight: 400, color: '#4a6580', marginLeft: 6 }}>{a.name}</span>
                      </p>
                      <p style={{ fontSize: 10, color: '#3d5068', marginTop: 1 }}>
                        {a.status === 'DEPLOYED' && a.assignedToUser ? `Alocado — ${a.assignedToUser.name}` : 'Em estoque'}
                        {a.category ? ` · ${a.category.name}` : ''}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Selected asset chip */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(0,217,184,0.06)', border: '1px solid rgba(0,217,184,0.18)',
                borderRadius: 8, padding: '8px 11px',
              }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: selectedAsset.status === 'STOCK' ? '#34d399' : '#38bdf8' }} />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#00d9b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedAsset.tag}
                    <span style={{ fontWeight: 400, color: '#3d5068', marginLeft: 6 }}>{selectedAsset.name}</span>
                  </p>
                </div>
                <button onClick={() => setSelectedAsset(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3d5068', padding: 2, display: 'flex' }}>
                  <X size={12} />
                </button>
              </div>

              {/* Action tabs */}
              <div style={{ display: 'flex', gap: 6 }}>
                <ActionTab active={action === 'ASSIGN_ASSET'} onClick={() => setAction('ASSIGN_ASSET')} icon={<LogOut size={11} />} label="Alocar" color="#34d399" />
                <ActionTab active={action === 'REMOVE_ASSET'} onClick={() => setAction('REMOVE_ASSET')} icon={<LogIn size={11} />} label="Devolver" color="#94a3b8" />
              </div>

              {/* User picker */}
              {action === 'ASSIGN_ASSET' && (
                <div>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3d5068', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <User size={10} /> ALOCAR PARA
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 140, overflowY: 'auto' }}>
                    {[...users].sort((a, b) => (a.id === requesterId ? -1 : b.id === requesterId ? 1 : 0)).map(u => (
                      <button
                        key={u.id}
                        onClick={() => setTargetUserId(u.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '6px 10px', borderRadius: 7,
                          background: targetUserId === u.id ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${targetUserId === u.id ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.05)'}`,
                          cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.1s',
                        }}
                      >
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                          background: targetUserId === u.id ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.05)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 800,
                          color: targetUserId === u.id ? '#34d399' : '#3d5068',
                        }}>
                          {u.name.slice(0, 1).toUpperCase()}
                        </div>
                        <span style={{ fontSize: 12, color: targetUserId === u.id ? '#34d399' : '#8ba5c0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u.name}
                        </span>
                        {u.id === requesterId && (
                          <span style={{
                            fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
                            color: '#00d9b8', background: 'rgba(0,217,184,0.1)',
                            border: '1px solid rgba(0,217,184,0.2)', borderRadius: 4, padding: '1px 5px', flexShrink: 0,
                          }}>solicitante</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Observações (opcional)"
                rows={2}
                style={{
                  width: '100%', padding: '7px 10px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 7, color: '#94a3b8', fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace", outline: 'none',
                  resize: 'none', boxSizing: 'border-box',
                }}
              />

              {/* Execute */}
              <button
                onClick={handleExecute}
                disabled={isPending}
                style={{
                  width: '100%', padding: '9px 0', borderRadius: 8,
                  background: isPending ? 'rgba(255,255,255,0.03)' : `${execColor}18`,
                  border: `1px solid ${isPending ? 'rgba(255,255,255,0.06)' : `${execColor}40`}`,
                  color: isPending ? '#2d4060' : execColor,
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  transition: 'all 0.12s',
                }}
              >
                {isPending
                  ? <><Loader2 size={12} style={{ animation: 'spin 0.6s linear infinite' }} /> Executando...</>
                  : <>{action === 'ASSIGN_ASSET' ? <LogOut size={12} /> : <LogIn size={12} />} {action === 'ASSIGN_ASSET' ? 'Alocar ativo' : 'Devolver ao estoque'}</>
                }
              </button>
            </>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function ActionTab({ active, onClick, icon, label, color }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string; color: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '6px 0', borderRadius: 7,
        background: active ? `${color}14` : 'rgba(255,255,255,0.02)',
        border: `1px solid ${active ? `${color}35` : 'rgba(255,255,255,0.06)'}`,
        color: active ? color : '#3d5068',
        fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: active ? 700 : 400,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        transition: 'all 0.1s',
      }}
    >
      {icon} {label}
    </button>
  )
}
