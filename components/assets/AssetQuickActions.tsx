'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MoreVertical, LogIn, LogOut, Copy, Trash2, User } from 'lucide-react'
import {
  checkInAsset,
  checkOutAsset,
  cloneAsset,
  deleteAsset,
} from '@/app/(app)/assets/[id]/actions'

// NOTE: check-in/check-out on variant="row" is handled by AssetCheckButton inline.
// This component still exposes them for variant="detail" (asset detail page).

interface UserOption {
  id: string
  name: string
}

interface Props {
  assetId: string
  assetStatus: string
  assetName: string
  isAdmin: boolean
  users: UserOption[]
  variant?: 'row' | 'detail'
}

type Step = 'closed' | 'menu' | 'checkout' | 'delete-confirm'

export default function AssetQuickActions({
  assetId,
  assetStatus,
  assetName,
  isAdmin,
  users,
  variant = 'row',
}: Props) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('closed')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [isPending, startTransition] = useTransition()

  function open(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setStep(s => s === 'closed' ? 'menu' : 'closed')
  }

  function handleCheckIn(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setStep('closed')
    startTransition(async () => {
      await checkInAsset(assetId)
    })
  }

  function handleCheckoutStep(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setSelectedUserId(users[0]?.id ?? '')
    setStep('checkout')
  }

  function handleCheckOut(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!selectedUserId) return
    setStep('closed')
    startTransition(async () => {
      await checkOutAsset(assetId, selectedUserId)
    })
  }

  function handleClone(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setStep('closed')
    startTransition(async () => {
      const newId = await cloneAsset(assetId)
      router.push(`/assets/${newId}`)
    })
  }

  function handleDeleteStep(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setStep('delete-confirm')
  }

  function handleDeleteConfirm(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setStep('closed')
    startTransition(async () => {
      await deleteAsset(assetId)
      router.push('/assets')
    })
  }

  const isStock = assetStatus === 'STOCK'

  // Trigger button styles differ by variant
  const triggerSize = variant === 'detail' ? 32 : 24

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
    >
      {/* Trigger */}
      <button
        onClick={open}
        disabled={isPending}
        title="Ações rápidas"
        style={{
          width: triggerSize,
          height: triggerSize,
          borderRadius: variant === 'detail' ? 8 : 5,
          background: step !== 'closed' ? 'rgba(0,217,184,0.1)' : 'transparent',
          border: `1px solid ${step !== 'closed' ? 'rgba(0,217,184,0.3)' : 'rgba(255,255,255,0.07)'}`,
          color: step !== 'closed' ? '#00d9b8' : '#2d4060',
          cursor: isPending ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.12s',
          flexShrink: 0,
        }}
        onMouseEnter={e => {
          if (step === 'closed') {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
            e.currentTarget.style.color = '#8ba5c0'
          }
        }}
        onMouseLeave={e => {
          if (step === 'closed') {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
            e.currentTarget.style.color = '#2d4060'
          }
        }}
      >
        {isPending ? (
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            border: '1.5px solid #00d9b8', borderTopColor: 'transparent',
            animation: 'spin 0.6s linear infinite',
          }} />
        ) : (
          <MoreVertical size={variant === 'detail' ? 14 : 12} />
        )}
      </button>

      {/* Backdrop to close on outside click */}
      {step !== 'closed' && (
        <div
          onClick={e => { e.preventDefault(); e.stopPropagation(); setStep('closed') }}
          style={{
            position: 'fixed', inset: 0,
            zIndex: 9998,
            pointerEvents: 'all',
          }}
        />
      )}

      {/* Dropdown panel */}
      {step !== 'closed' && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 4,
            background: '#0d1422',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)',
            zIndex: 9999,
            minWidth: 200,
            overflow: 'hidden',
            pointerEvents: 'all',
          }}
        >
          {/* ── MENU ── */}
          {step === 'menu' && (
            <>
              <div style={{ padding: '8px 12px 6px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', letterSpacing: '0.1em', fontWeight: 700 }}>
                  AÇÕES RÁPIDAS
                </p>
              </div>
              <div style={{ padding: '4px 0' }}>
                {/* Check-in / Check-out only shown in detail variant (row uses inline AssetCheckButton) */}
                {variant === 'detail' && !isStock && (
                  <MenuButton
                    icon={<LogIn size={13} />}
                    label="Check-in"
                    desc="Devolver ao estoque"
                    color="#94a3b8"
                    onClick={handleCheckIn}
                  />
                )}
                {variant === 'detail' && (
                  <MenuButton
                    icon={<LogOut size={13} />}
                    label="Check-out"
                    desc="Alocar para usuário"
                    color="#34d399"
                    onClick={handleCheckoutStep}
                  />
                )}
                {/* Clone */}
                <MenuButton
                  icon={<Copy size={13} />}
                  label="Clonar modelo"
                  desc="Criar cópia deste ativo"
                  color="#a78bfa"
                  onClick={handleClone}
                />
                {/* Delete — admin only */}
                {isAdmin && (
                  <>
                    <div style={{ margin: '4px 12px', borderTop: '1px solid rgba(255,255,255,0.05)' }} />
                    <MenuButton
                      icon={<Trash2 size={13} />}
                      label="Excluir ativo"
                      desc="Ação irreversível"
                      color="#f87171"
                      onClick={handleDeleteStep}
                    />
                  </>
                )}
              </div>
            </>
          )}

          {/* ── CHECK-OUT: user picker ── */}
          {step === 'checkout' && (
            <div style={{ padding: 14 }}>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#00d9b8', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 10 }}>
                CHECK-OUT — ALOCAR PARA
              </p>
              {users.length === 0 ? (
                <p style={{ fontSize: 12, color: '#3d5068', fontStyle: 'italic', marginBottom: 10 }}>
                  Nenhum usuário disponível
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12, maxHeight: 180, overflowY: 'auto' }}>
                  {users.map(u => (
                    <button
                      key={u.id}
                      onClick={e => { e.preventDefault(); e.stopPropagation(); setSelectedUserId(u.id) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '7px 10px', borderRadius: 7,
                        background: selectedUserId === u.id ? 'rgba(0,217,184,0.1)' : 'transparent',
                        border: `1px solid ${selectedUserId === u.id ? 'rgba(0,217,184,0.3)' : 'rgba(255,255,255,0.05)'}`,
                        cursor: 'pointer', textAlign: 'left', width: '100%',
                        transition: 'all 0.1s',
                      }}
                    >
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        background: selectedUserId === u.id ? 'rgba(0,217,184,0.15)' : 'rgba(255,255,255,0.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <User size={10} color={selectedUserId === u.id ? '#00d9b8' : '#3d5068'} />
                      </div>
                      <span style={{ fontSize: 12, color: selectedUserId === u.id ? '#00d9b8' : '#8ba5c0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={e => { e.preventDefault(); e.stopPropagation(); setStep('menu') }}
                  style={cancelBtnStyle}
                >
                  Voltar
                </button>
                <button
                  onClick={handleCheckOut}
                  disabled={!selectedUserId}
                  style={{
                    ...confirmBtnStyle,
                    opacity: selectedUserId ? 1 : 0.4,
                    cursor: selectedUserId ? 'pointer' : 'not-allowed',
                  }}
                >
                  Confirmar
                </button>
              </div>
            </div>
          )}

          {/* ── DELETE CONFIRM ── */}
          {step === 'delete-confirm' && (
            <div style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Trash2 size={13} color="#f87171" />
                </div>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#f87171', letterSpacing: '0.1em', fontWeight: 700 }}>
                  EXCLUIR ATIVO
                </p>
              </div>
              <p style={{ fontSize: 12, color: '#8ba5c0', lineHeight: 1.5, marginBottom: 12 }}>
                Tem certeza que deseja excluir <strong style={{ color: '#c8d6e5' }}>{assetName}</strong>? Esta ação é irreversível e remove todos os arquivos e histórico.
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={e => { e.preventDefault(); e.stopPropagation(); setStep('menu') }}
                  style={cancelBtnStyle}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  style={{ ...confirmBtnStyle, background: 'rgba(248,113,113,0.15)', borderColor: 'rgba(248,113,113,0.35)', color: '#f87171' }}
                >
                  Excluir
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────
function MenuButton({
  icon, label, desc, color, onClick,
}: {
  icon: React.ReactNode
  label: string
  desc: string
  color: string
  onClick: (e: React.MouseEvent) => void
}) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '8px 14px',
        background: hover ? `${color}10` : 'transparent',
        border: 'none', cursor: 'pointer',
        textAlign: 'left', transition: 'background 0.1s',
      }}
    >
      <span style={{ color: hover ? color : '#3d5068', transition: 'color 0.1s', flexShrink: 0 }}>{icon}</span>
      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: hover ? color : '#8ba5c0', lineHeight: 1.2, transition: 'color 0.1s' }}>{label}</p>
        <p style={{ fontSize: 10, color: '#2d4060', lineHeight: 1.2, marginTop: 1 }}>{desc}</p>
      </div>
    </button>
  )
}

const cancelBtnStyle: React.CSSProperties = {
  flex: 1, padding: '7px 0', borderRadius: 7,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#3d5068', fontSize: 12, cursor: 'pointer',
  fontFamily: "'JetBrains Mono', monospace",
  transition: 'all 0.1s',
}

const confirmBtnStyle: React.CSSProperties = {
  flex: 1, padding: '7px 0', borderRadius: 7,
  background: 'rgba(0,217,184,0.12)',
  border: '1px solid rgba(0,217,184,0.3)',
  color: '#00d9b8', fontSize: 12, cursor: 'pointer',
  fontFamily: "'JetBrains Mono', monospace",
  fontWeight: 700, transition: 'all 0.1s',
}
