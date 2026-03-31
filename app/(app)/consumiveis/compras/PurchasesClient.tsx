'use client'

import { useState, useTransition } from 'react'
import type { PurchaseData } from './actions'
import { deletePurchase } from './actions'

const STATUS_CFG = {
  PENDING:  { label: 'Pendente',  color: '#fbbf24', bg: 'rgba(251,191,36,0.09)',  border: 'rgba(251,191,36,0.25)'  },
  RECEIVED: { label: 'Recebido', color: '#34d399', bg: 'rgba(52,211,153,0.09)',  border: 'rgba(52,211,153,0.25)'  },
  CANCELED: { label: 'Cancelado',color: '#f87171', bg: 'rgba(248,113,113,0.09)', border: 'rgba(248,113,113,0.25)' },
}

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

function fmtCurrency(v: number | null) {
  if (v == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export default function PurchasesClient({
  purchases,
  categories,
  activeStatus,
  activeQ,
}: {
  purchases: PurchaseData[]
  categories: { id: string; name: string; kind?: string }[]
  activeStatus?: string
  activeQ?: string
}) {
  const [isPending, startTransition] = useTransition()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [expandId, setExpandId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleDelete(id: string) {
    startTransition(async () => {
      const r = await deletePurchase(id)
      if (!r.ok) setError(r.error ?? 'Erro')
      else setDeleteId(null)
    })
  }

  if (purchases.length === 0) {
    return (
      <div style={{
        padding: '60px 0', textAlign: 'center',
        fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#2d4060',
      }}>
        Nenhuma compra registrada ainda.{' '}
        <a href="/consumiveis/compras/nova" style={{ color: '#34d399', textDecoration: 'none' }}>Registrar agora →</a>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {error && (
        <div style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8 }}>
          <p style={{ fontSize: 12, color: '#f87171' }}>⚠ {error}</p>
        </div>
      )}

      {purchases.map(p => {
        const sc = STATUS_CFG[p.status]
        const isDel = deleteId === p.id
        const isExpanded = expandId === p.id

        return (
          <div key={p.id} style={{
            background: '#0d1422',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, overflow: 'hidden',
          }}>
            {isDel ? (
              /* ── Delete confirm ── */
              <div style={{ padding: '14px 20px', background: 'rgba(248,113,113,0.04)', borderLeft: '3px solid rgba(248,113,113,0.3)' }}>
                <p style={{ fontSize: 13, color: '#f87171', marginBottom: 10 }}>Excluir &quot;{p.title}&quot;? Esta ação é irreversível.</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleDelete(p.id)} disabled={isPending} style={{
                    padding: '6px 16px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>Confirmar</button>
                  <button onClick={() => setDeleteId(null)} style={{
                    padding: '6px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#3d5068',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>Cancelar</button>
                </div>
              </div>
            ) : (
              /* ── View row ── */
              <div>
                {/* Main row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px' }}>
                  {/* Status dot */}
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: sc.color, boxShadow: `0 0 6px ${sc.color}66`,
                  }} />

                  {/* Title + meta */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#c8d6e5' }}>{p.title}</span>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
                        color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`,
                        borderRadius: 4, padding: '2px 7px',
                      }}>{sc.label.toUpperCase()}</span>
                      {p.categoryName && (
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3d5068',
                          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                          borderRadius: 4, padding: '2px 7px',
                        }}>{p.categoryName}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      {p.supplier && <span style={{ fontSize: 11, color: '#3d5068' }}>🏪 {p.supplier}</span>}
                      <span style={{ fontSize: 11, color: '#3d5068' }}>📦 Qtd: {p.quantity}</span>
                      {p.unitPrice != null && (
                        <span style={{ fontSize: 11, color: '#3d5068' }}>
                          💰 {fmtCurrency(p.unitPrice)} /un
                          {p.quantity > 1 && <span style={{ color: '#a78bfa' }}> = {fmtCurrency(p.unitPrice * p.quantity)}</span>}
                        </span>
                      )}
                      {p.invoiceNumber && <span style={{ fontSize: 11, color: '#3d5068' }}>🧾 NF {p.invoiceNumber}</span>}
                      {p.purchaseDate && <span style={{ fontSize: 11, color: '#3d5068' }}>📅 {fmt(p.purchaseDate)}</span>}
                      {p.buyerName && <span style={{ fontSize: 11, color: '#3d5068' }}>👤 {p.buyerName}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                    {(p.notes || p.specifications || p.imageData || p.buyerName || p.orderedByName) && (
                      <button
                        onClick={() => setExpandId(isExpanded ? null : p.id)}
                        style={{
                          padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                          background: isExpanded ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isExpanded ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.07)'}`,
                          color: isExpanded ? '#a78bfa' : '#3d5068',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {isExpanded ? '▲' : '▼'} Detalhes
                      </button>
                    )}
                    <a
                      href={`/consumiveis/compras/${p.id}/editar`}
                      style={{
                        padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                        background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)',
                        color: '#38bdf8', fontFamily: "'JetBrains Mono', monospace",
                        textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
                      }}
                    >Editar</a>
                    <button onClick={() => { setDeleteId(p.id); setError(null) }} disabled={isPending} style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                      background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
                      color: '#f87171', fontFamily: "'JetBrains Mono', monospace",
                    }}>Excluir</button>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div style={{
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    padding: '14px 20px',
                    display: 'flex', gap: 20, flexWrap: 'wrap',
                    background: 'rgba(255,255,255,0.01)',
                  }}>
                    {p.imageData && (
                      <div style={{ flexShrink: 0 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.imageData}
                          alt="Foto da compra"
                          style={{ width: 140, height: 140, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}
                        />
                      </div>
                    )}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 200 }}>
                      {(p.buyerName || p.orderedByName) && (
                        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                          {p.buyerName && (
                            <div>
                              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700, marginBottom: 3 }}>RESPONSÁVEL PELA COMPRA</p>
                              <p style={{ fontSize: 12, color: '#8fa3ba' }}>{p.buyerName}</p>
                            </div>
                          )}
                          {p.orderedByName && (
                            <div>
                              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700, marginBottom: 3 }}>REALIZADOR DO PEDIDO</p>
                              <p style={{ fontSize: 12, color: '#8fa3ba' }}>{p.orderedByName}</p>
                            </div>
                          )}
                        </div>
                      )}
                      {p.specifications && (
                        <div>
                          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700, marginBottom: 5 }}>ESPECIFICAÇÕES</p>
                          <p style={{ fontSize: 12, color: '#8fa3ba', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{p.specifications}</p>
                        </div>
                      )}
                      {p.notes && (
                        <div>
                          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700, marginBottom: 5 }}>NOTAS</p>
                          <p style={{ fontSize: 12, color: '#8fa3ba', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{p.notes}</p>
                        </div>
                      )}
                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#1e3048', marginTop: 'auto' }}>
                        Criado por {p.createdByName} · {fmt(p.createdAt)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
