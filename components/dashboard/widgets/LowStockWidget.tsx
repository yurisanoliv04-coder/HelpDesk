import { getLowStockAlerts } from '@/lib/dashboard/fetchers/assets'
import Link from 'next/link'

export default async function LowStockWidget() {
  const items = await getLowStockAlerts()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p className="section-label">── ESTOQUE BAIXO</p>
        <Link href="/consumiveis" style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-cyan)', opacity: 0.75, textDecoration: 'none' }}>
          gerenciar →
        </Link>
      </div>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', flex: 1 }}>
        {items.length === 0 ? (
          <p style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
            — estoque dentro do limite —
          </p>
        ) : (
          <div>
            {items.map((cat, i) => (
              <div
                key={cat.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 16px',
                  borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
                  gap: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cat.name}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
                    mín: {cat.stockMinQty} unid.
                  </p>
                </div>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13, fontWeight: 700,
                  color: cat.stockQuantity === 0 ? '#f87171' : '#fbbf24',
                }}>
                  {cat.stockQuantity === 0 ? 'SEM ESTOQUE' : `${cat.stockQuantity} unid.`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
