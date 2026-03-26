import { auth } from '@/lib/auth/config'
import { getRecentMessages } from '@/lib/dashboard/fetchers/messages'
import { AvatarInitials } from '@/components/dashboard/AvatarInitials'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

function shortCode(code: string) {
  return `#${parseInt(code.split('-').pop() ?? '0', 10)}`
}

export default async function RecentMessagesWidget() {
  const session = await auth()
  const userId = session!.user.id
  const messages = await getRecentMessages(userId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <p className="section-label" style={{ marginBottom: 14 }}>── MENSAGENS RECENTES</p>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', flex: 1 }}>
        {messages.length === 0 ? (
          <p style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
            — sem mensagens recentes —
          </p>
        ) : (
          <div>
            {messages.map((msg, i) => {
              const timeAgo = formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: ptBR })
              const snippet = msg.body.length > 55 ? msg.body.slice(0, 55) + '…' : msg.body

              return (
                <Link
                  key={msg.id}
                  href={`/tickets/${msg.ticket.id}`}
                  className="hover-row"
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px',
                    borderBottom: i < messages.length - 1 ? '1px solid var(--border)' : 'none',
                    textDecoration: 'none',
                  }}
                >
                  <AvatarInitials name={msg.author.name} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
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
                    <p style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.4 }}>
                      {snippet}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
