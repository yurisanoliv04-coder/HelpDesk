'use client'

import { createContext, useContext, useState, useCallback, useTransition } from 'react'
import { LogIn, LogOut, Trash2, X } from 'lucide-react'
import { bulkCheckIn, bulkCheckOut, bulkDeleteAssets } from '@/app/(app)/assets/actions'

// ─── Context ──────────────────────────────────────────────────────────────────
interface SelectionCtx {
  selected: Set<string>
  toggle: (id: string) => void
  toggleAll: (ids: string[]) => void
  clearAll: () => void
  isSelected: (id: string) => boolean
}

const Ctx = createContext<SelectionCtx>(null!)

export function useAssetSelection() {
  return useContext(Ctx)
}

// ─── Modal shared styles ──────────────────────────────────────────────────────
function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0d1422',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          width: '100%',
          maxWidth: 460,
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9, fontWeight: 700, color: '#3d5068', letterSpacing: '0.08em',
      }}>
        {label.toUpperCase()}
      </label>
      {children}
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  background: '#0d1422',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: '10px 14px',
  color: '#e2eaf4',
  fontSize: 13,
  fontFamily: "'JetBrains Mono', monospace",
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: '9px 12px',
  fontSize: 13,
  color: '#c8d6e5',
  width: '100%',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

// ─── Bulk Check-in Modal ──────────────────────────────────────────────────────
function BulkCheckInModal({
  count,
  locationOptions,
  onClose,
  onConfirm,
}: {
  count: number
  locationOptions: string[]
  onClose: () => void
  onConfirm: (location: string, notes: string) => void
}) {
  const [location, setLocation] = useState(locationOptions[0] ?? 'Departamento de T.I')
  const [notes, setNotes] = useState('')

  return (
    <Modal onClose={onClose}>
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LogIn size={16} color="#94a3b8" />
        </div>
        <div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em' }}>
            BULK CHECK-IN — {count} {count === 1 ? 'ATIVO' : 'ATIVOS'}
          </p>
          <p style={{ fontSize: 12, color: '#4a6580', marginTop: 2 }}>Devolver ativos ao estoque</p>
        </div>
      </div>
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <ModalField label="Destino">
          <select style={selectStyle} value={location} onChange={e => setLocation(e.target.value)}>
            {locationOptions.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </ModalField>
        <ModalField label="Observações">
          <textarea
            style={{ ...inputStyle, resize: 'vertical', minHeight: 64, lineHeight: 1.5 } as React.CSSProperties}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Informações adicionais..."
          />
        </ModalField>
      </div>
      <div style={{ padding: '14px 24px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#3d5068', fontSize: 13, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace" }}>
          Cancelar
        </button>
        <button
          onClick={() => onConfirm(location, notes)}
          style={{ padding: '9px 22px', borderRadius: 8, background: 'rgba(148,163,184,0.12)', border: '1px solid rgba(148,163,184,0.3)', color: '#94a3b8', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <LogIn size={13} />
          Confirmar Check-in
        </button>
      </div>
    </Modal>
  )
}

// ─── Bulk Check-out Modal ─────────────────────────────────────────────────────
function BulkCheckOutModal({
  count,
  locationOptions,
  technicians,
  onClose,
  onConfirm,
}: {
  count: number
  locationOptions: string[]
  technicians: { id: string; name: string }[]
  onClose: () => void
  onConfirm: (userId: string, location: string, notes: string) => void
}) {
  const [userId, setUserId] = useState(technicians[0]?.id ?? '')
  const [location, setLocation] = useState(locationOptions[0] ?? '')
  const [notes, setNotes] = useState('')

  return (
    <Modal onClose={onClose}>
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LogOut size={16} color="#34d399" />
        </div>
        <div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#34d399', letterSpacing: '0.1em' }}>
            BULK CHECK-OUT — {count} {count === 1 ? 'ATIVO' : 'ATIVOS'}
          </p>
          <p style={{ fontSize: 12, color: '#4a6580', marginTop: 2 }}>Alocar ativos para um usuário</p>
        </div>
      </div>
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <ModalField label="Atribuir a">
          <select style={{ ...selectStyle, background: 'rgba(255,255,255,0.04)', color: '#c8d6e5' }} value={userId} onChange={e => setUserId(e.target.value)}>
            <option value="">— selecionar usuário —</option>
            {technicians.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </ModalField>
        <ModalField label="Local de destino">
          <select style={selectStyle} value={location} onChange={e => setLocation(e.target.value)}>
            {locationOptions.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </ModalField>
        <ModalField label="Observações">
          <textarea
            style={{ ...inputStyle, resize: 'vertical', minHeight: 64, lineHeight: 1.5 } as React.CSSProperties}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Informações adicionais..."
          />
        </ModalField>
      </div>
      <div style={{ padding: '14px 24px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#3d5068', fontSize: 13, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace" }}>
          Cancelar
        </button>
        <button
          onClick={() => onConfirm(userId, location, notes)}
          disabled={!userId}
          style={{ padding: '9px 22px', borderRadius: 8, background: userId ? 'rgba(52,211,153,0.12)' : 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399', fontSize: 13, fontWeight: 700, cursor: userId ? 'pointer' : 'not-allowed', fontFamily: "'JetBrains Mono', monospace", display: 'flex', alignItems: 'center', gap: 8, opacity: userId ? 1 : 0.4 }}
        >
          <LogOut size={13} />
          Confirmar Check-out
        </button>
      </div>
    </Modal>
  )
}

// ─── Bulk Action Bar ──────────────────────────────────────────────────────────
function BulkBar({
  selected,
  clearAll,
  allIds,
  locationOptions,
  technicians,
}: {
  selected: Set<string>
  clearAll: () => void
  allIds: { id: string; tag: string; status: string }[]
  locationOptions: string[]
  technicians: { id: string; name: string }[]
}) {
  const count = selected.size
  const [modal, setModal] = useState<'checkin' | 'checkout' | 'delete' | null>(null)
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<string | null>(null)

  function showFeedback(msg: string) {
    setFeedback(msg)
    setTimeout(() => setFeedback(null), 3000)
  }

  function handleBulkCheckIn(location: string, notes: string) {
    setModal(null)
    startTransition(async () => {
      const result = await bulkCheckIn(Array.from(selected), location, notes)
      if (result.ok) {
        showFeedback(`Check-in realizado em ${result.count} ${result.count === 1 ? 'ativo' : 'ativos'}`)
        clearAll()
      } else {
        showFeedback(`Erro: ${result.error}`)
      }
    })
  }

  function handleBulkCheckOut(userId: string, location: string, notes: string) {
    setModal(null)
    startTransition(async () => {
      const result = await bulkCheckOut(Array.from(selected), userId, location, notes)
      if (result.ok) {
        showFeedback(`Check-out realizado em ${result.count} ${result.count === 1 ? 'ativo' : 'ativos'}`)
        clearAll()
      } else {
        showFeedback(`Erro: ${result.error}`)
      }
    })
  }

  function handleBulkDelete() {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir ${count} ${count === 1 ? 'ativo' : 'ativos'}? Esta ação é irreversível.`
    )
    if (!confirmed) return
    setModal(null)
    startTransition(async () => {
      const result = await bulkDeleteAssets(Array.from(selected))
      if (result.ok) {
        showFeedback(`${result.count} ${result.count === 1 ? 'ativo excluído' : 'ativos excluídos'}`)
        clearAll()
      } else {
        showFeedback(`Erro: ${result.error}`)
      }
    })
  }

  if (count === 0) return null

  const btnBase: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '8px 16px', borderRadius: 8,
    fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
    cursor: isPending ? 'not-allowed' : 'pointer',
    opacity: isPending ? 0.6 : 1,
    transition: 'all 0.1s',
    whiteSpace: 'nowrap',
  }

  return (
    <>
      {/* Modals */}
      {modal === 'checkin' && (
        <BulkCheckInModal
          count={count}
          locationOptions={locationOptions}
          onClose={() => setModal(null)}
          onConfirm={handleBulkCheckIn}
        />
      )}
      {modal === 'checkout' && (
        <BulkCheckOutModal
          count={count}
          locationOptions={locationOptions}
          technicians={technicians}
          onClose={() => setModal(null)}
          onConfirm={handleBulkCheckOut}
        />
      )}

      {/* Fixed bottom bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: 9000,
        background: '#0a1628',
        borderTop: '1px solid rgba(0,217,184,0.3)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
        padding: '14px 24px',
        display: 'flex', alignItems: 'center', gap: 12,
        flexWrap: 'wrap',
      }}>
        {/* Count badge */}
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          minWidth: 100, padding: '8px 14px', borderRadius: 8,
          background: 'rgba(0,217,184,0.12)', border: '1px solid rgba(0,217,184,0.3)',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
          color: '#00d9b8',
        }}>
          {count} {count === 1 ? 'selecionado' : 'selecionados'}
        </span>

        {/* Pending spinner */}
        {isPending && (
          <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #00d9b8', borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite' }} />
        )}

        {/* Feedback message */}
        {feedback && (
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#00d9b8' }}>
            {feedback}
          </span>
        )}

        <div style={{ flex: 1 }} />

        {/* Check-in */}
        <button
          onClick={() => setModal('checkin')}
          disabled={isPending}
          style={{
            ...btnBase,
            background: 'rgba(148,163,184,0.08)',
            border: '1px solid rgba(148,163,184,0.25)',
            color: '#94a3b8',
          }}
        >
          <LogIn size={13} />
          Check-in
        </button>

        {/* Check-out */}
        <button
          onClick={() => setModal('checkout')}
          disabled={isPending}
          style={{
            ...btnBase,
            background: 'rgba(52,211,153,0.08)',
            border: '1px solid rgba(52,211,153,0.25)',
            color: '#34d399',
          }}
        >
          <LogOut size={13} />
          Check-out
        </button>

        {/* Delete */}
        <button
          onClick={handleBulkDelete}
          disabled={isPending}
          style={{
            ...btnBase,
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.25)',
            color: '#f87171',
          }}
        >
          <Trash2 size={13} />
          Excluir
        </button>

        {/* Clear */}
        <button
          onClick={clearAll}
          disabled={isPending}
          style={{
            ...btnBase,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#4a6580',
          }}
        >
          <X size={13} />
          Desmarcar
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AssetSelectionProvider({
  children,
  assetIds,
  locationOptions,
  technicians,
}: {
  children: React.ReactNode
  assetIds: { id: string; tag: string; status: string }[]
  locationOptions: string[]
  technicians: { id: string; name: string }[]
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggle = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback((ids: string[]) => {
    setSelected(prev => {
      const allSelected = ids.every(id => prev.has(id))
      if (allSelected) {
        const next = new Set(prev)
        ids.forEach(id => next.delete(id))
        return next
      } else {
        const next = new Set(prev)
        ids.forEach(id => next.add(id))
        return next
      }
    })
  }, [])

  const clearAll = useCallback(() => setSelected(new Set()), [])

  const isSelected = useCallback((id: string) => selected.has(id), [selected])

  return (
    <Ctx.Provider value={{ selected, toggle, toggleAll, clearAll, isSelected }}>
      {children}
      <BulkBar
        selected={selected}
        clearAll={clearAll}
        allIds={assetIds}
        locationOptions={locationOptions}
        technicians={technicians}
      />
    </Ctx.Provider>
  )
}
