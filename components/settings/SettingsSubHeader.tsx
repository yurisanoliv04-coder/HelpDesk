import Link from 'next/link'

interface Props {
  title: string
  description: string
  accent?: string
}

export default function SettingsSubHeader({ title, description, accent = '#00d9b8' }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 4 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Link
            href="/settings"
            style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060',
              letterSpacing: '0.1em', textDecoration: 'none', transition: 'color 0.1s',
            }}
            className="settings-back-link"
          >
            CONFIGURAÇÕES
          </Link>
          <span style={{ color: '#1e3048', fontSize: 10 }}>/</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: accent, letterSpacing: '0.1em' }}>
            {title.toUpperCase()}
          </span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e2eaf4', letterSpacing: '-0.01em', lineHeight: 1 }}>
          {title}
        </h1>
        <p style={{ fontSize: 13, color: '#3d5068', marginTop: 6 }}>{description}</p>
      </div>
      <Link
        href="/settings"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 8,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600,
          color: '#3d5068', textDecoration: 'none', transition: 'all 0.1s',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Voltar
      </Link>
      <style>{`.settings-back-link:hover { color: #c8d6e5 !important; }`}</style>
    </div>
  )
}
