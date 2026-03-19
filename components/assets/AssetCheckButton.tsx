'use client'

import { useState, useTransition, useEffect } from 'react'
import { LogIn, LogOut } from 'lucide-react'
import { checkInAsset, checkOutAsset } from '@/app/(app)/assets/[id]/actions'

interface UserOption {
  id: string
  name: string
}

interface Props {
  assetId: string
  assetTag: string
  assetStatus: string
  users: UserOption[]
  locationOptions: string[]
}

// ─── Overlay portal-like modal ────────────────────────────────────────────────
function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: '#0d1422',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          width: '100%',
          maxWidth: 440,
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9, fontWeight: 700,
        color: '#3d5068', letterSpacing: '0.08em',
      }}>
        {label.toUpperCase()}
      </label>
      {children}
    </div>
  )
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

// ─── Check-out Modal ──────────────────────────────────────────────────────────
function CheckOutModal({
  assetId,
  assetTag,
  users,
  locationOptions,
  onClose,
}: {
  assetId: string
  assetTag: string
  users: UserOption[]
  locationOptions: string[]
  onClose: () => void
}) {
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id ?? '')
  const [location, setLocation] = useState(locationOptions[0] ?? '')
  const [notes, setNotes] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    if (!selectedUserId) return
    startTransition(async () => {
      await checkOutAsset(assetId, selectedUserId, location || undefined, notes || undefined)
      onClose()
    })
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

  return (
    <Modal onClose={onClose}>
      {/* Header */}
      <div style={{
        padding: '20px 24px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9, flexShrink: 0,
          background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <LogOut size={16} color="#34d399" />
        </div>
        <div>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, fontWeight: 700, color: '#34d399', letterSpacing: '0.1em',
          }}>
            CHECK-OUT — {assetTag}
          </p>
          <p style={{ fontSize: 12, color: '#4a6580', marginTop: 2 }}>
            Alocar ativo para um usuário
          </p>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <ModalField label="Atribuir a">
          <select
            style={inputStyle}
            value={selectedUserId}
            onChange={e => setSelectedUserId(e.target.value)}
          >
            {users.length === 0 ? (
              <option value="">Nenhum usuário disponível</option>
            ) : (
              <>
                <option value="">— selecionar usuário —</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </>
            )}
          </select>
        </ModalField>

        <ModalField label="Local de destino">
          <select
            style={selectStyle}
            value={location}
            onChange={e => setLocation(e.target.value)}
          >
            {locationOptions.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </ModalField>

        <ModalField label="Observações">
          <textarea
            style={{ ...inputStyle, resize: 'vertical', minHeight: 72, lineHeight: 1.5 }}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Informações adicionais..."
          />
        </ModalField>
      </div>

      {/* Footer */}
      <div style={{
        padding: '14px 24px 20px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', gap: 10, justifyContent: 'flex-end',
      }}>
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          style={{
            padding: '9px 20px', borderRadius: 8,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#3d5068', fontSize: 13, cursor: 'pointer',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isPending || !selectedUserId}
          style={{
            padding: '9px 22px', borderRadius: 8,
            background: isPending || !selectedUserId ? 'rgba(52,211,153,0.06)' : 'rgba(52,211,153,0.12)',
            border: '1px solid rgba(52,211,153,0.3)',
            color: '#34d399', fontSize: 13, fontWeight: 700,
            cursor: isPending || !selectedUserId ? 'not-allowed' : 'pointer',
            fontFamily: "'JetBrains Mono', monospace",
            opacity: !selectedUserId ? 0.5 : 1,
            display: 'flex', alignItems: 'center', gap: 8,
            transition: 'all 0.12s',
          }}
        >
          {isPending ? (
            <>
              <div style={{ width: 11, height: 11, borderRadius: '50%', border: '2px solid #34d399', borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite' }} />
              Confirmando...
            </>
          ) : (
            <>
              <LogOut size={13} />
              Confirmar Check-out
            </>
          )}
        </button>
      </div>
    </Modal>
  )
}

// ─── Check-in Modal ───────────────────────────────────────────────────────────
function CheckInModal({
  assetId,
  assetTag,
  locationOptions,
  onClose,
}: {
  assetId: string
  assetTag: string
  locationOptions: string[]
  onClose: () => void
}) {
  const [destination, setDestination] = useState(locationOptions[0] ?? 'Departamento de T.I')
  const [notes, setNotes] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      await checkInAsset(assetId, destination || undefined, notes || undefined)
      onClose()
    })
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

  return (
    <Modal onClose={onClose}>
      {/* Header */}
      <div style={{
        padding: '20px 24px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9, flexShrink: 0,
          background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <LogIn size={16} color="#94a3b8" />
        </div>
        <div>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em',
          }}>
            CHECK-IN — {assetTag}
          </p>
          <p style={{ fontSize: 12, color: '#4a6580', marginTop: 2 }}>
            Devolver ativo ao estoque
          </p>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <ModalField label="Destino">
          <select
            style={selectStyle}
            value={destination}
            onChange={e => setDestination(e.target.value)}
          >
            {locationOptions.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </ModalField>

        <ModalField label="Observações">
          <textarea
            style={{ ...inputStyle, resize: 'vertical', minHeight: 72, lineHeight: 1.5 }}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Informações adicionais..."
          />
        </ModalField>
      </div>

      {/* Footer */}
      <div style={{
        padding: '14px 24px 20px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', gap: 10, justifyContent: 'flex-end',
      }}>
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          style={{
            padding: '9px 20px', borderRadius: 8,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#3d5068', fontSize: 13, cursor: 'pointer',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isPending}
          style={{
            padding: '9px 22px', borderRadius: 8,
            background: isPending ? 'rgba(148,163,184,0.06)' : 'rgba(148,163,184,0.12)',
            border: '1px solid rgba(148,163,184,0.3)',
            color: '#94a3b8', fontSize: 13, fontWeight: 700,
            cursor: isPending ? 'not-allowed' : 'pointer',
            fontFamily: "'JetBrains Mono', monospace",
            display: 'flex', alignItems: 'center', gap: 8,
            transition: 'all 0.12s',
          }}
        >
          {isPending ? (
            <>
              <div style={{ width: 11, height: 11, borderRadius: '50%', border: '2px solid #94a3b8', borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite' }} />
              Confirmando...
            </>
          ) : (
            <>
              <LogIn size={13} />
              Confirmar Check-in
            </>
          )}
        </button>
      </div>
    </Modal>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function AssetCheckButton({ assetId, assetTag, assetStatus, users, locationOptions }: Props) {
  const [modal, setModal] = useState<'checkin' | 'checkout' | null>(null)

  const isStock    = assetStatus === 'STOCK'
  const isDeployed = assetStatus === 'DEPLOYED'

  // Only relevant for STOCK or DEPLOYED
  if (!isStock && !isDeployed) return null

  return (
    <>
      {/* Check-in button (DEPLOYED → STOCK) */}
      {isDeployed && (
        <button
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()
            setModal('checkin')
          }}
          title="Check-in: devolver ao estoque"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 9px', borderRadius: 6,
            background: 'rgba(148,163,184,0.07)',
            border: '1px solid rgba(148,163,184,0.18)',
            color: '#64748b', fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.12s',
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(148,163,184,0.14)'
            e.currentTarget.style.color = '#94a3b8'
            e.currentTarget.style.borderColor = 'rgba(148,163,184,0.35)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(148,163,184,0.07)'
            e.currentTarget.style.color = '#64748b'
            e.currentTarget.style.borderColor = 'rgba(148,163,184,0.18)'
          }}
        >
          <LogIn size={10} />
          Check-in
        </button>
      )}

      {/* Check-out button (STOCK → DEPLOYED) */}
      {isStock && (
        <button
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()
            setModal('checkout')
          }}
          title="Check-out: alocar para usuário"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 9px', borderRadius: 6,
            background: 'rgba(52,211,153,0.07)',
            border: '1px solid rgba(52,211,153,0.22)',
            color: '#34d399', fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.12s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(52,211,153,0.14)'
            e.currentTarget.style.borderColor = 'rgba(52,211,153,0.4)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(52,211,153,0.07)'
            e.currentTarget.style.borderColor = 'rgba(52,211,153,0.22)'
          }}
        >
          <LogOut size={10} />
          Check-out
        </button>
      )}

      {/* Modals */}
      {modal === 'checkin' && (
        <CheckInModal
          assetId={assetId}
          assetTag={assetTag}
          locationOptions={locationOptions}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'checkout' && (
        <CheckOutModal
          assetId={assetId}
          assetTag={assetTag}
          users={users}
          locationOptions={locationOptions}
          onClose={() => setModal(null)}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
