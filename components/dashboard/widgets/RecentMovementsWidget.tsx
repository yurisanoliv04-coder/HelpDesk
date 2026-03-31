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

const MAX_ITEMS = 30
const ROW_HEIGHT = 52

export default async function RecentMovementsWidget() {
  const movements = await getRecentMovements()
  const fillerCount = Math.max(0, MAX_ITEMS - movements.length)

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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, padding: 24 }}>
            <span style={{ fontSize: 36, lineHeight: 1 }}>📦</span>
            <p style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.5 }}>
              Nada se mexeu por aqui.<br />O patrimônio agradece.
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-input)' }}>
              <div style={{ width: 7, flexShrink: 0 }} />
              <p className="section-label" style={{ flex: 1 }}>ATIVO · OPERAÇÃO</p>
              <p className="section-label">TEMPO</p>
            </div>
            <div>
              {movements.map((mov) => {
                const color = movementColor[mov.type] ?? movementColor.DEFAULT
                const timeAgo = formatDistanceToNow(new Date(mov.createdAt), { addSuffix: true, locale: ptBR })
                const dest = mov.toUser?.name ?? mov.toLocation ?? '—'

                return (
                  <div
                    key={mov.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '0 16px', height: ROW_HEIGHT,
                      borderBottom: '1px solid var(--border)',
                      overflow: 'hidden',
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
                    — sem movimentações —
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
