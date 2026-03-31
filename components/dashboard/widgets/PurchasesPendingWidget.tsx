import { getPendingPurchasesSummary } from '@/lib/dashboard/fetchers/purchases'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

const MAX_ITEMS = 30
const ROW_HEIGHT = 52

export default async function PurchasesPendingWidget() {
  const { count, items } = await getPendingPurchasesSummary()
  const fillerCount = Math.max(0, MAX_ITEMS - items.length)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p className="section-label">── COMPRAS PENDENTES</p>
        <Link href="/consumiveis/compras" style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-cyan)', opacity: 0.75, textDecoration: 'none' }}>
          ver todas →
        </Link>
      </div>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', flex: 1 }}>
        {items.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, padding: 24 }}>
            <span style={{ fontSize: 36, lineHeight: 1 }}>🛒</span>
            <p style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.5 }}>
              Nenhuma compra pendente.<br />Milagre!
            </p>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-input)' }}>
              <div style={{ width: 7, flexShrink: 0 }} />
              <p className="section-label" style={{ flex: 1 }}>ITEM · CATEGORIA</p>
              <p className="section-label">VALOR · TEMPO</p>
            </div>
            {count > items.length && (
              <div style={{ padding: '7px 16px', borderBottom: '1px solid var(--border)', background: 'rgba(251,191,36,0.05)' }}>
                <p style={{ fontSize: 11, color: '#fbbf24', fontFamily: "'JetBrains Mono', monospace" }}>
                  {count} compras aguardando recebimento
                </p>
              </div>
            )}
            {items.map((p) => {
              const timeAgo = formatDistanceToNow(new Date(p.createdAt), { addSuffix: true, locale: ptBR })
              return (
                <Link
                  key={p.id}
                  href="/consumiveis/compras"
                  className="hover-row"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '0 16px', height: ROW_HEIGHT,
                    borderBottom: '1px solid var(--border)',
                    overflow: 'hidden', textDecoration: 'none',
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fbbf24', flexShrink: 0, boxShadow: '0 0 5px rgba(251,191,36,0.5)' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.title}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                      {p.quantity} unid.{p.category ? ` · ${p.category.name}` : ''}
                    </p>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    {p.unitPrice != null && (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                        R$ {Number(p.unitPrice).toFixed(2)}
                      </p>
                    )}
                    <p style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
                      {timeAgo}
                    </p>
                  </div>
                </Link>
              )
            })}
            {Array.from({ length: fillerCount }).map((_, i) => (
              <div
                key={`filler-${i}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '0 16px', height: ROW_HEIGHT,
                  borderBottom: '1px solid var(--border)',
                  opacity: 0.35,
                }}
              >
                <div style={{ width: 7, flexShrink: 0 }} />
                <p style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-dim)' }}>
                  — nenhuma compra pendente —
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
