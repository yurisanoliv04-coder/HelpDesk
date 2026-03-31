'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { updatePurchase } from '../../actions'
import type { PurchaseData } from '../../actions'

const iStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#c8d6e5',
  outline: 'none', boxSizing: 'border-box', width: '100%',
}

const labelStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060',
  fontWeight: 700, marginBottom: 5, display: 'block',
}

const cardStyle: React.CSSProperties = {
  background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 12, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14,
}

const sectionLabelStyle = (color: string): React.CSSProperties => ({
  fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
  color, letterSpacing: '0.1em', marginBottom: 4,
})

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      try {
        const MAX = 800
        const scale = Math.min(MAX / img.naturalWidth, MAX / img.naturalHeight, 1)
        const w = Math.round(img.naturalWidth * scale)
        const h = Math.round(img.naturalHeight * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/webp', 0.85))
      } catch (e) { reject(e) } finally { URL.revokeObjectURL(url) }
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Falha ao carregar imagem')) }
    img.src = url
  })
}

type Category = { id: string; name: string; kind: string }
type User = { id: string; name: string }

export default function EditPurchaseForm({
  purchase,
  categories,
  users,
}: {
  purchase: PurchaseData
  categories: Category[]
  users: User[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(purchase.title)
  const [supplier, setSupplier] = useState(purchase.supplier ?? '')
  const [quantity, setQuantity] = useState(String(purchase.quantity))
  const [unitPrice, setUnitPrice] = useState(purchase.unitPrice != null ? String(purchase.unitPrice) : '')
  const [invoiceNumber, setInvoiceNumber] = useState(purchase.invoiceNumber ?? '')
  const [purchaseDate, setPurchaseDate] = useState(purchase.purchaseDate ? purchase.purchaseDate.slice(0, 10) : '')
  const [categoryId, setCategoryId] = useState(purchase.categoryId ?? '')
  const [status, setStatus] = useState<'PENDING' | 'RECEIVED' | 'CANCELED'>(purchase.status)
  const [notes, setNotes] = useState(purchase.notes ?? '')
  const [specifications, setSpecifications] = useState(purchase.specifications ?? '')
  const [imageData, setImageData] = useState<string | null>(purchase.imageData ?? null)
  const [imagePreview, setImagePreview] = useState<string | null>(purchase.imageData ?? null)
  const [buyerId, setBuyerId] = useState(purchase.buyerId ?? '')
  const [orderedById, setOrderedById] = useState(purchase.orderedById ?? '')
  const [deferAsset, setDeferAsset] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imgError, setImgError] = useState<string | null>(null)

  const selectedCat = categories.find(c => c.id === categoryId)
  const isEquipment = selectedCat?.kind === 'EQUIPMENT'
  const isStock = selectedCat?.kind === 'ACCESSORY' || selectedCat?.kind === 'DISPOSABLE'
  const wasReceived = purchase.status === 'RECEIVED'
  const willBeReceived = status === 'RECEIVED' && !wasReceived
  const totalPrice = unitPrice && quantity ? parseFloat(unitPrice) * parseInt(quantity || '1') : null

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImgError(null)
    try {
      const compressed = await compressImage(file)
      setImageData(compressed)
      setImagePreview(URL.createObjectURL(file))
    } catch { setImgError('Falha ao processar imagem') }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!title.trim()) { setError('Título é obrigatório'); return }

    startTransition(async () => {
      const r = await updatePurchase(purchase.id, {
        title, supplier, quantity: parseInt(quantity) || 1,
        unitPrice: unitPrice ? parseFloat(unitPrice) : undefined,
        invoiceNumber, purchaseDate: purchaseDate || undefined,
        categoryId: categoryId || undefined,
        status, notes, specifications,
        imageData: imageData ?? undefined,
        buyerId: buyerId || undefined,
        orderedById: orderedById || undefined,
        deferAsset: (isEquipment && willBeReceived) ? deferAsset : undefined,
      })
      if (r.ok) {
        if (r.redirectTo) router.push(r.redirectTo)
        else router.push('/consumiveis/compras')
      } else {
        setError(r.error ?? 'Erro ao salvar')
      }
    })
  }

  const kindChip = selectedCat ? (
    <span style={{
      fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
      padding: '2px 7px', borderRadius: 4,
      color: isEquipment ? '#38bdf8' : isStock && selectedCat.kind === 'ACCESSORY' ? '#a78bfa' : '#fb923c',
      background: isEquipment ? 'rgba(56,189,248,0.08)' : isStock && selectedCat.kind === 'ACCESSORY' ? 'rgba(167,139,250,0.08)' : 'rgba(251,146,60,0.08)',
      border: isEquipment ? '1px solid rgba(56,189,248,0.2)' : isStock && selectedCat.kind === 'ACCESSORY' ? '1px solid rgba(167,139,250,0.2)' : '1px solid rgba(251,146,60,0.2)',
    }}>
      {isEquipment ? 'PATRIMÔNIO' : selectedCat.kind === 'ACCESSORY' ? 'ACESSÓRIO' : 'CONSUMÍVEL'}
    </span>
  ) : null

  return (
    <form onSubmit={handleSubmit}>
      {wasReceived && (
        <div style={{
          marginBottom: 16, padding: '10px 14px',
          background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)',
          borderRadius: 8,
        }}>
          <p style={{ fontSize: 12, color: '#fbbf24' }}>
            ⚠ Esta compra já foi marcada como <strong>Recebida</strong>. O estoque/patrimônio já foi atualizado. Alterar o status não desfará as movimentações anteriores.
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>

        {/* CARD 1: Identificação */}
        <div style={cardStyle}>
          <p style={sectionLabelStyle('#34d399')}>IDENTIFICAÇÃO DO ITEM</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={labelStyle}>ITEM / DESCRIÇÃO *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} style={iStyle} required />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={labelStyle}>FORNECEDOR / LOJA</label>
            <input value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Ex: Amazon, Kabum" style={iStyle} />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={labelStyle}>QUANTIDADE</label>
              <input type="number" min={1} value={quantity} onChange={e => setQuantity(e.target.value)} style={iStyle} />
            </div>
            <div style={{ flex: '2', display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={labelStyle}>PREÇO UNITÁRIO (R$)</label>
              <input type="number" min={0} step={0.01} value={unitPrice} onChange={e => setUnitPrice(e.target.value)} placeholder="0,00" style={iStyle} />
            </div>
          </div>

          {totalPrice != null && totalPrice > 0 && (
            <div style={{
              padding: '10px 12px', borderRadius: 8,
              background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700 }}>TOTAL</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#34d399' }}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice)}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={labelStyle}>Nº NF / PEDIDO</label>
              <input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="NF-e ou nº do pedido" style={iStyle} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={labelStyle}>DATA DA COMPRA</label>
              <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} style={iStyle} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={labelStyle}>STATUS DO PEDIDO</label>
            <select value={status} onChange={e => setStatus(e.target.value as 'PENDING' | 'RECEIVED' | 'CANCELED')} style={iStyle}>
              <option value="PENDING">🟡 Pendente</option>
              <option value="RECEIVED">🟢 Recebido</option>
              <option value="CANCELED">🔴 Cancelado</option>
            </select>
          </div>
        </div>

        {/* CARD 2: Responsáveis + Categoria */}
        <div style={cardStyle}>
          <p style={sectionLabelStyle('#a78bfa')}>RESPONSÁVEIS</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={labelStyle}>RESPONSÁVEL PELA COMPRA</label>
            <p style={{ fontSize: 11, color: '#3d5068', marginBottom: 4 }}>Pessoa que efetuou o pagamento / aprovação</p>
            <select value={buyerId} onChange={e => setBuyerId(e.target.value)} style={iStyle}>
              <option value="">— Não informado —</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={labelStyle}>REALIZADOR DO PEDIDO</label>
            <p style={{ fontSize: 11, color: '#3d5068', marginBottom: 4 }}>Pessoa que fez o pedido / solicitação</p>
            <select value={orderedById} onChange={e => setOrderedById(e.target.value)} style={iStyle}>
              <option value="">— Não informado —</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          <div style={{
            marginTop: 4, padding: '14px', borderRadius: 10,
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <p style={sectionLabelStyle('#38bdf8')}>CATEGORIA & AUTOMAÇÃO</p>
            <p style={{ fontSize: 11, color: '#3d5068', marginBottom: 12, lineHeight: 1.5 }}>
              Ao receber o item, o estoque ou patrimônio será atualizado automaticamente.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
              <label style={labelStyle}>
                CATEGORIA DO ITEM {kindChip && <span style={{ marginLeft: 6 }}>{kindChip}</span>}
              </label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} style={iStyle}>
                <option value="">— Nenhuma (sem automação) —</option>
                {['EQUIPMENT', 'ACCESSORY', 'DISPOSABLE'].map(kind => {
                  const cats = categories.filter(c => c.kind === kind)
                  if (!cats.length) return null
                  const groupLabel = kind === 'EQUIPMENT' ? '🖥 Patrimônio' : kind === 'ACCESSORY' ? '🖱 Acessórios' : '📦 Consumíveis'
                  return (
                    <optgroup key={kind} label={groupLabel}>
                      {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </optgroup>
                  )
                })}
              </select>
            </div>

            {/* Automation preview — only when transitioning to RECEIVED */}
            {categoryId && willBeReceived && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {isStock && (
                  <div style={{
                    padding: '8px 10px', borderRadius: 7, fontSize: 11, lineHeight: 1.5,
                    background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.18)', color: '#34d399',
                  }}>
                    ✅ O estoque de <strong>{selectedCat?.name}</strong> será incrementado em <strong>{quantity || 1} unidade(s)</strong>.
                  </div>
                )}
                {isEquipment && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700 }}>
                      AÇÃO PARA PATRIMÔNIO
                    </p>
                    <label style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer',
                      padding: '10px 12px', borderRadius: 8,
                      background: deferAsset ? 'rgba(251,191,36,0.06)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${deferAsset ? 'rgba(251,191,36,0.22)' : 'rgba(255,255,255,0.08)'}`,
                    }}>
                      <input type="radio" name="assetAction" checked={deferAsset} onChange={() => setDeferAsset(true)} style={{ marginTop: 2, accentColor: '#fbbf24' }} />
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#fbbf24', marginBottom: 2 }}>⏳ Deixar para depois</p>
                        <p style={{ fontSize: 11, color: '#3d5068', lineHeight: 1.4 }}>
                          Cria {quantity || 1} ativo(s) com status <strong style={{ color: '#f87171' }}>IRREGULAR</strong> em Patrimônio.
                        </p>
                      </div>
                    </label>
                    <label style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer',
                      padding: '10px 12px', borderRadius: 8,
                      background: !deferAsset ? 'rgba(56,189,248,0.06)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${!deferAsset ? 'rgba(56,189,248,0.22)' : 'rgba(255,255,255,0.08)'}`,
                    }}>
                      <input type="radio" name="assetAction" checked={!deferAsset} onChange={() => setDeferAsset(false)} style={{ marginTop: 2, accentColor: '#38bdf8' }} />
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#38bdf8', marginBottom: 2 }}>📋 Cadastrar agora</p>
                        <p style={{ fontSize: 11, color: '#3d5068', lineHeight: 1.4 }}>
                          Salva e redireciona para o cadastro completo do ativo.
                        </p>
                      </div>
                    </label>
                  </div>
                )}
              </div>
            )}

            {wasReceived && categoryId && (
              <div style={{
                padding: '8px 10px', borderRadius: 7, fontSize: 11,
                background: 'rgba(100,116,139,0.06)', border: '1px solid rgba(100,116,139,0.18)', color: '#64748b',
              }}>
                ℹ️ Compra já recebida — estoque/patrimônio já foram atualizados.
              </div>
            )}
          </div>
        </div>

        {/* CARD 3: Especificações & Notas */}
        <div style={cardStyle}>
          <p style={sectionLabelStyle('#a78bfa')}>ESPECIFICAÇÕES & NOTAS</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={labelStyle}>ESPECIFICAÇÕES TÉCNICAS</label>
            <textarea value={specifications} onChange={e => setSpecifications(e.target.value)} rows={5} style={{ ...iStyle, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={labelStyle}>NOTAS ADICIONAIS</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ ...iStyle, resize: 'vertical' }} />
          </div>
        </div>

        {/* CARD 4: Foto */}
        <div style={cardStyle}>
          <p style={sectionLabelStyle('#38bdf8')}>FOTO (OPCIONAL)</p>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
          {imagePreview ? (
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Preview" style={{ width: 140, height: 110, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }} />
                <button
                  type="button"
                  onClick={() => { setImageData(null); setImagePreview(null); if (fileRef.current) fileRef.current.value = '' }}
                  style={{
                    position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%',
                    background: 'rgba(248,113,113,0.85)', border: 'none', color: '#fff',
                    fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >✕</button>
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#3d5068', lineHeight: 1.5, marginBottom: 8 }}>Foto adicionada.</p>
                <button type="button" onClick={() => fileRef.current?.click()} style={{
                  padding: '5px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                  background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)',
                  color: '#38bdf8', fontFamily: "'JetBrains Mono', monospace",
                }}>Trocar foto</button>
              </div>
            </div>
          ) : (
            <button
              type="button" onClick={() => fileRef.current?.click()}
              style={{
                width: '100%', height: 110, borderRadius: 8,
                background: 'rgba(56,189,248,0.03)', border: '1px dashed rgba(56,189,248,0.18)',
                cursor: 'pointer', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="#3d5068" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, color: '#2d4060' }}>ADICIONAR FOTO</span>
            </button>
          )}
          {imgError && <p style={{ fontSize: 11, color: '#f87171' }}>⚠ {imgError}</p>}
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8 }}>
          <p style={{ fontSize: 12, color: '#f87171' }}>⚠ {error}</p>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button
          type="submit"
          disabled={isPending || !title.trim()}
          style={{
            padding: '11px 28px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            background: !title.trim() ? 'rgba(52,211,153,0.04)' : 'rgba(52,211,153,0.12)',
            border: '1px solid rgba(52,211,153,0.3)', color: '#34d399',
            fontFamily: "'JetBrains Mono', monospace", opacity: !title.trim() ? 0.5 : 1,
          }}
        >
          {isPending ? 'Salvando...' : isEquipment && willBeReceived && !deferAsset ? '→ Salvar & Cadastrar ativo' : '✓ Salvar alterações'}
        </button>
        <a
          href="/consumiveis/compras"
          style={{
            padding: '11px 20px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
            color: '#3d5068', fontFamily: "'JetBrains Mono', monospace",
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
          }}
        >Cancelar</a>
      </div>
    </form>
  )
}
