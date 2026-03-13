'use client'

// Read-only overview of SLA policies — full CRUD can be added later
interface SlaPolicy {
  id: string; name: string; active: boolean
  priority: string | null; responseMinutes: number; resolutionMinutes: number
  category: { name: string } | null
}

interface Props { slaPolices: SlaPolicy[] }

function minutesToHuman(min: number) {
  const h = Math.floor(min / 60), m = min % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

const PRIORITY_COLOR: Record<string, string> = {
  LOW: '#94a3b8', MEDIUM: '#38bdf8', HIGH: '#fbbf24', URGENT: '#f87171',
}
const PRIORITY_LABEL: Record<string, string> = {
  LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta', URGENT: 'Urgente',
}

export default function TicketSettingsTab({ slaPolices }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Info banner */}
      <div style={{ background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10 }}>
        <span style={{ fontSize: 14, flexShrink: 0 }}>ℹ️</span>
        <p style={{ fontSize: 12, color: '#3d5068', lineHeight: 1.5 }}>
          As políticas de SLA definem os prazos de <strong style={{ color: '#8ba5c0' }}>resposta</strong> (primeiro atendimento) e <strong style={{ color: '#8ba5c0' }}>resolução</strong> por combinação de categoria e prioridade. O sistema calcula automaticamente os prazos ao abrir cada chamado.
        </p>
      </div>

      {/* SLA table */}
      <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#3d5068', letterSpacing: '0.1em' }}>POLÍTICAS DE SLA</p>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060' }}>{slaPolices.length} políticas</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 110px 110px 70px', columnGap: 10, padding: '0 16px', height: 36, alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          {['NOME', 'CATEGORIA', 'PRIORIDADE', 'RESPOSTA', 'RESOLUÇÃO', 'STATUS'].map((h, i) => (
            <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#2d4060', letterSpacing: '0.08em' }}>{h}</div>
          ))}
        </div>
        {slaPolices.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#2d4060' }}>Nenhuma política cadastrada</div>
        ) : slaPolices.map((s, i) => {
          const pc = s.priority ? PRIORITY_COLOR[s.priority] : '#94a3b8'
          return (
            <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 110px 110px 70px', columnGap: 10, padding: '11px 16px', alignItems: 'center', borderBottom: i < slaPolices.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', opacity: s.active ? 1 : 0.5 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#c8d6e5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</p>
              <span style={{ fontSize: 11, color: '#4a6580', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.category?.name ?? '—'}</span>
              {s.priority ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: pc }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: pc }} />{PRIORITY_LABEL[s.priority]}
                </span>
              ) : <span style={{ fontSize: 11, color: '#2d4060' }}>—</span>}
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#38bdf8' }}>{minutesToHuman(s.responseMinutes)}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#a78bfa' }}>{minutesToHuman(s.resolutionMinutes)}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: s.active ? '#34d399' : '#f87171', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />{s.active ? 'Ativa' : 'Inativa'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
