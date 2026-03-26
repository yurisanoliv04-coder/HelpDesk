import { getRecentMovements } from '@/lib/dashboard/fetchers/assets'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

const movementLabel: Record<string, string> = {
  CREATED: 'Criado', CHECK_IN: 'Entrada', CHECK_OUT: 'Saída',
  TRANSFER: 'Transferência', SWAP: 'Substituição',
  MAINT_START: 'Manutenção', MAINT_END: 'Retorno',
  DISCARD: 'Descarte', LOAN: 'Empréstimo', RETURN: 'Devolução', UPDATE: 'Atualização',
}
const movementColor: Record<string, string> = {
  CHECK_IN: '#34d399', CHECK_OUT: '#f59e0b', TRANSFER: '#38bdf8',
  MAINT_START: '#f87171', MAINT_END: '#34d399', DISCARD: '#94a3b8',
  CREATED: '#a78bfa', DEFAULT: '#64748b',
}

export default async function RecentMovementsWidget() {
  const movements = await getRecentMovements()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p className="section-label">── MOVIMENTAÇÕES RECENTES</p>
        <Link href="/movements" style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-cyan)', opacity: 0.75, textDecoration: 'none' }}>
          ver todas →
        </Link>
      </div>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', flex: 1 }}>
        {movements.length === 0 ? (
          <p style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
            — sem movimentações —
          </p>
        ) : (
          <div>
            {movements.map((mov, i) => {
              const color = movementColor[mov.type] ?? movementColor.DEFAULT
              const timeAgo = formatDistanceToNow(new Date(mov.createdAt), { addSuffix: true, locale: ptBR })
              const dest = mov.toUser?.name ?? mov.toLocation ?? '—'

              return (
                <div
                  key={mov.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 16px',
                    borderBottom: i < movements.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 5px ${color}90` }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {mov.asset.name}
                      <span style={{ color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}> [{mov.asset.tag}]</span>
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                      {movementLabel[mov.type] ?? mov.type} → {dest}
                    </p>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                    {timeAgo}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
