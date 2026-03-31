import { getSystemAlerts, SystemAlert } from '@/lib/dashboard/fetchers/alerts'
import Link from 'next/link'

// Visual style per category: filled = patrimônio/chamados, outlined = estoque
const CARD_STYLE: Record<SystemAlert['category'], 'filled' | 'outlined'> = {
  chamados:   'filled',
  patrimonio: 'filled',
  estoque:    'outlined',
}

const SEVERITY_COLOR: Record<SystemAlert['severity'], { dot: string; glow: string; bg: string; border: string }> = {
  critical: {
    dot:    '#f87171',
    glow:   'rgba(248,113,113,0.55)',
    bg:     'rgba(248,113,113,0.10)',
    border: 'rgba(248,113,113,0.30)',
  },
  warning: {
    dot:    '#fb923c',
    glow:   'rgba(251,146,60,0.45)',
    bg:     'rgba(251,146,60,0.08)',
    border: 'rgba(251,146,60,0.25)',
  },
  info: {
    dot:    '#60a5fa',
    glow:   'rgba(96,165,250,0.4)',
    bg:     'rgba(96,165,250,0.06)',
    border: 'rgba(96,165,250,0.20)',
  },
}

export default async function SystemAlertsWidget() {
  const alerts = await getSystemAlerts()

  if (alerts.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 10, height: '100%', minHeight: 80,
        color: '#10b981',
      }}>
        <span style={{ fontSize: 22 }}>✓</span>
        <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
          Tudo em ordem — nenhum alerta ativo
        </span>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 5,
      height: '100%', overflowY: 'auto',
    }}>
      {alerts.map((alert) => {
        const c       = SEVERITY_COLOR[alert.severity]
        const filled  = CARD_STYLE[alert.category] === 'filled'

        return (
          <div
            key={alert.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              borderRadius: 6, padding: '8px 12px',
              background: filled ? c.bg : 'transparent',
              border:     `1px solid ${filled ? c.border : 'rgba(255,255,255,0.07)'}`,
            }}
          >
            {/* Severity dot */}
            <span style={{
              width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
              background: c.dot,
              boxShadow: filled ? `0 0 6px ${c.glow}` : 'none',
              display: 'inline-block',
            }} />

            {/* Message */}
            <span style={{
              flex: 1, fontSize: 12, lineHeight: 1.4,
              color: filled ? 'var(--text-muted)' : 'rgba(148,163,184,0.6)',
            }}>
              {alert.label}
            </span>

            {/* Link */}
            <Link
              href={alert.href}
              style={{
                flexShrink: 0, fontSize: 11,
                color: c.dot,
                opacity: filled ? 0.85 : 0.5,
                fontFamily: "'JetBrains Mono', monospace",
                textDecoration: 'none',
              }}
            >
              ver →
            </Link>
          </div>
        )
      })}
    </div>
  )
}
