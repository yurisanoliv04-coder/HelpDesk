import { getPendingPurchasesSummary } from '@/lib/dashboard/fetchers/purchases'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

export default async function PurchasesPendingWidget() {
  const { count, items } = await getPendingPurchasesSummary()

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
          <p style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
            — sem compras pendentes —
          </p>
        ) : (
          <>
            {count > items.length && (
              <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-input)' }}>
                <p style={{ fontSize: 11, color: '#fbbf24', fontFamily: "'JetBrains Mono', monospace" }}>
                  {count} compras aguardando recebimento
                </p>
              </div>
            )}
            <div>
              {items.map((p, i) => {
                const timeAgo = formatDistanceToNow(new Date(p.createdAt), { addSuffix: true, locale: ptBR })
                return (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 16px',
                      borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
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
                      {p.unitPrice && (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                          R$ {Number(p.unitPrice).toFixed(2)}
                        </p>
                      )}
                      <p style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
                        {timeAgo}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
