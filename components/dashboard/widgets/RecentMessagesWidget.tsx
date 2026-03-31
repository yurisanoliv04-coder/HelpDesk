import { auth } from '@/lib/auth/config'
import { getRecentMessages } from '@/lib/dashboard/fetchers/messages'
import { AvatarInitials } from '@/components/dashboard/AvatarInitials'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

function shortCode(code: string) {
  return `#${parseInt(code.split('-').pop() ?? '0', 10)}`
}

const MAX_ITEMS = 30
const ROW_HEIGHT = 70

export default async function RecentMessagesWidget() {
  const session = await auth()
  const userId = session!.user.id
  const messages = await getRecentMessages(userId)
  const fillerCount = Math.max(0, MAX_ITEMS - messages.length)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p className="section-label">── MENSAGENS RECENTES</p>
        <Link href="/tickets" style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-cyan)', opacity: 0.75, textDecoration: 'none' }}>
          ver todos →
        </Link>
      </div>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', flex: 1 }}>
        {messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, padding: 24 }}>
            <span style={{ fontSize: 36, lineHeight: 1 }}>🤫</span>
            <p style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.5 }}>
              Caixa vazia.<br />Que paz de espírito.
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg-input)' }}>
              <div style={{ width: 32, flexShrink: 0 }} />
              <p className="section-label" style={{ flex: 1 }}>AUTOR · CHAMADO</p>
              <p className="section-label">TEMPO</p>
            </div>
            <div>
              {messages.map((msg) => {
                const timeAgo = formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: ptBR })
                const snippet = msg.body.length > 55 ? msg.body.slice(0, 55) + '…' : msg.body

                return (
                  <Link
                    key={msg.id}
                    href={`/tickets/${msg.ticket.id}`}
                    className="hover-row"
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '0 14px', height: ROW_HEIGHT,
                      borderBottom: '1px solid var(--border)',
                      textDecoration: 'none', overflow: 'hidden',
                      alignContent: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', height: '100%', flexShrink: 0 }}>
                      <AvatarInitials name={msg.author.name} size={32} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6, marginBottom: 2 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {msg.author.name}
                        </p>
                        <p style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                          {timeAgo}
                        </p>
                      </div>
                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--accent-cyan)', opacity: 0.7, marginBottom: 3 }}>
                        {shortCode(msg.ticket.code)}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {snippet}
                      </p>
                    </div>
                  </Link>
                )
              })}
              {Array.from({ length: fillerCount }).map((_, i) => (
                <div
                  key={`filler-${i}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '0 14px', height: ROW_HEIGHT,
                    borderBottom: '1px solid var(--border)',
                    opacity: 0.35,
                  }}
                >
                  <div style={{ width: 32, flexShrink: 0 }} />
                  <p style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-dim)' }}>
                    — sem mais mensagens —
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
