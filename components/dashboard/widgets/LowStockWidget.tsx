import { getLowStockAlerts } from '@/lib/dashboard/fetchers/assets'
import Link from 'next/link'

const MAX_ITEMS = 30
const ROW_HEIGHT = 52

export default async function LowStockWidget() {
  const items = await getLowStockAlerts()
  const fillerCount = Math.max(0, MAX_ITEMS - items.length)

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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, padding: 24 }}>
            <span style={{ fontSize: 36, lineHeight: 1 }}>🎊</span>
            <p style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.5 }}>
              Estoque cheio!<br />Pode relaxar por hoje.
            </p>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-input)' }}>
              <p className="section-label">ITEM · MÍN.</p>
              <p className="section-label">QUANTIDADE</p>
            </div>
            {items.map((cat) => (
              <Link
                key={cat.id}
                href="/consumiveis"
                className="hover-row"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0 16px', height: ROW_HEIGHT,
                  borderBottom: '1px solid var(--border)',
                  gap: 12, overflow: 'hidden', textDecoration: 'none',
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
              </Link>
            ))}
            {Array.from({ length: fillerCount }).map((_, i) => (
              <div
                key={`filler-${i}`}
                style={{
                  display: 'flex', alignItems: 'center',
                  padding: '0 16px', height: ROW_HEIGHT,
                  borderBottom: '1px solid var(--border)',
                  opacity: 0.35,
                }}
              >
                <p style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-dim)' }}>
                  — tudo em ordem —
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
