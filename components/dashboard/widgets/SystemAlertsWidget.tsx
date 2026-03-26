import { getSystemAlerts, SystemAlert } from '@/lib/dashboard/fetchers/alerts'
import Link from 'next/link'

const CATEGORY_LABELS: Record<SystemAlert['category'], string> = {
  chamados:   'CHAMADOS',
  patrimonio: 'PATRIMÔNIO',
  estoque:    'ESTOQUE',
}

const CATEGORY_COLORS: Record<SystemAlert['category'], string> = {
  chamados:   '#60a5fa', // blue
  patrimonio: '#f87171', // red
  estoque:    '#fb923c', // orange
}

const SEVERITY_DOT: Record<SystemAlert['severity'], { color: string; glow: string }> = {
  critical: { color: '#f87171', glow: 'rgba(248,113,113,0.5)' },
  warning:  { color: '#fb923c', glow: 'rgba(251,146,60,0.5)'  },
  info:     { color: '#60a5fa', glow: 'rgba(96,165,250,0.5)'  },
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

  // Group by category
  const grouped = alerts.reduce<Record<string, SystemAlert[]>>((acc, a) => {
    if (!acc[a.category]) acc[a.category] = []
    acc[a.category].push(a)
    return acc
  }, {})

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', overflowY: 'auto' }}>
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Category header */}
          <div style={{
            fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
            color: CATEGORY_COLORS[category as SystemAlert['category']],
            letterSpacing: '0.08em', fontWeight: 700,
            paddingLeft: 2, marginTop: 4,
          }}>
            {CATEGORY_LABELS[category as SystemAlert['category']]}
          </div>

          {/* Alert rows */}
          {items.map((alert) => {
            const dot = SEVERITY_DOT[alert.severity]
            const isCritical = alert.severity === 'critical'
            return (
              <div
                key={alert.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: isCritical
                    ? 'rgba(248,113,113,0.05)'
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isCritical ? 'rgba(248,113,113,0.15)' : 'var(--border)'}`,
                  borderRadius: 6, padding: '8px 12px',
                }}
              >
                {/* Severity dot */}
                <span style={{
                  width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                  background: dot.color,
                  boxShadow: isCritical ? `0 0 6px ${dot.glow}` : 'none',
                  display: 'inline-block',
                }} />

                {/* Message */}
                <span style={{ flex: 1, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {alert.label}
                </span>

                {/* Link */}
                <Link
                  href={alert.href}
                  style={{
                    flexShrink: 0, fontSize: 11,
                    color: dot.color, opacity: 0.8,
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
      ))}
    </div>
  )
}
