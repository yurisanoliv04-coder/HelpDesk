'use client'

import { useState, useTransition } from 'react'
import { recalculateAllScores } from '@/app/(app)/settings/actions'

interface Props { totalAssets: number }

const criteria = [
  {
    title: 'Memória RAM', subtitle: '40 pontos máx', color: '#38bdf8', icon: '🧠',
    rows: [
      { label: '≥ 16 GB', pts: 40, note: 'Ideal — sem restrições' },
      { label: '8 GB',    pts: 30, note: 'Confortável, pequeno bônus ao upgrade para 16 GB' },
      { label: '4 GB',    pts: 12, note: 'Limitado para ERP + navegador + e-mail simultâneos' },
      { label: '< 4 GB',  pts:  0, note: 'Inviável para uso corporativo' },
    ],
  },
  {
    title: 'Armazenamento', subtitle: '30 pontos máx', color: '#a78bfa', icon: '💾',
    rows: [
      { label: 'SSD NVMe',  pts: 30, note: 'Máximo desempenho' },
      { label: 'SSD SATA',  pts: 28, note: 'Praticamente idêntico para tarefas de escritório' },
      { label: 'HDD',       pts:  5, note: 'Penalidade severa — substituição recomendada' },
    ],
  },
  {
    title: 'Processador (CPU)', subtitle: '30 pontos máx', color: '#34d399', icon: '⚙️',
    rows: [
      { label: 'i9 / Ryzen 9', pts: 28, note: 'Superdimensionado, mas ótimo' },
      { label: 'i7 / Ryzen 7', pts: 26, note: 'Excelente para escritório' },
      { label: 'i5 / Ryzen 5', pts: 24, note: 'Ponto ideal para contabilidade/ERP' },
      { label: 'i3 / Ryzen 3', pts: 20, note: 'Suficiente para tarefas típicas' },
      { label: 'Celeron / Pentium / Athlon', pts: 8, note: 'Pode travar em ERPs pesados' },
    ],
  },
]

const genBonus = [
  { label: '≥ 10ª geração', adj: '+2 pts', note: 'Bônus simbólico — geração recente' },
  { label: '6ª–9ª geração', adj: '±0 pts', note: 'Ainda adequado, sem penalidade' },
  { label: '4ª–5ª geração', adj: '−5 pts', note: 'Envelhecendo — planeje substituição' },
  { label: '≤ 3ª geração',  adj: '−12 pts', note: 'Obsoleto — risco de incompatibilidade' },
]

const thresholds = [
  { label: 'BOM',          pts: '≥ 60',    color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)',  desc: 'Atende bem o dia-a-dia sem ressalvas' },
  { label: 'INTERMEDIÁRIO', pts: '35 – 59', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.2)',  desc: 'Funcional, mas com alguma limitação' },
  { label: 'RUIM',         pts: '< 35',    color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)', desc: 'Impacto visível na produtividade' },
]

export default function ScoringTab({ totalAssets }: Props) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; updated: number; error?: string } | null>(null)

  function handleRecalculate() {
    setResult(null)
    startTransition(async () => {
      const r = await recalculateAllScores()
      setResult(r)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Thresholds */}
      <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '20px 22px' }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#3d5068', letterSpacing: '0.1em', marginBottom: 14 }}>CLASSIFICAÇÃO DE QUALIDADE</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {thresholds.map(t => (
            <div key={t.label} style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: t.color, letterSpacing: '0.08em' }}>{t.label}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 800, color: t.color }}>{t.pts}</span>
              </div>
              <p style={{ fontSize: 11, color: '#3d5068', lineHeight: 1.4 }}>{t.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Criteria grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {criteria.map(c => (
          <div key={c.title} style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: 16 }}>{c.icon}</span>
              <div>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: c.color, letterSpacing: '0.08em' }}>{c.title.toUpperCase()}</p>
                <p style={{ fontSize: 10, color: '#2d4060', marginTop: 1 }}>{c.subtitle}</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {c.rows.map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#8ba5c0', fontWeight: 600 }}>{r.label}</p>
                    <p style={{ fontSize: 10, color: '#2d4060', marginTop: 2, lineHeight: 1.3 }}>{r.note}</p>
                  </div>
                  <div style={{ flexShrink: 0, background: `${c.color}15`, border: `1px solid ${c.color}30`, borderRadius: 6, padding: '3px 8px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: c.color, whiteSpace: 'nowrap' }}>
                    {r.pts} pts
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* CPU generation card */}
        <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 16 }}>📅</span>
            <div>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#fbbf24', letterSpacing: '0.08em' }}>GERAÇÃO DO PROCESSADOR</p>
              <p style={{ fontSize: 10, color: '#2d4060', marginTop: 1 }}>Ajuste aplicado sobre pontuação do modelo</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {genBonus.map(g => (
              <div key={g.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#8ba5c0', fontWeight: 600 }}>{g.label}</p>
                  <p style={{ fontSize: 10, color: '#2d4060', marginTop: 2, lineHeight: 1.3 }}>{g.note}</p>
                </div>
                <span style={{ flexShrink: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: g.adj.startsWith('+') ? '#34d399' : g.adj.startsWith('−') ? '#f87171' : '#94a3b8' }}>
                  {g.adj}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recalculate action */}
      <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#c8d6e5' }}>Recalcular pontuações</p>
          <p style={{ fontSize: 12, color: '#3d5068', marginTop: 3 }}>
            Aplica os critérios atuais a todos os {totalAssets} ativos com dados de hardware cadastrados.
          </p>
          {result && (
            <p style={{ fontSize: 12, marginTop: 8, color: result.ok ? '#34d399' : '#f87171' }}>
              {result.ok ? `✓ ${result.updated} ativos recalculados com sucesso` : `⚠ Erro: ${result.error}`}
            </p>
          )}
        </div>
        <button
          onClick={handleRecalculate}
          disabled={isPending}
          style={{
            padding: '10px 22px', borderRadius: 9, flexShrink: 0,
            background: 'rgba(0,217,184,0.1)', border: '1px solid rgba(0,217,184,0.25)',
            color: '#00d9b8', fontSize: 13, fontWeight: 700, cursor: isPending ? 'not-allowed' : 'pointer',
            fontFamily: "'JetBrains Mono', monospace",
            display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.1s',
            opacity: isPending ? 0.6 : 1,
          }}
        >
          {isPending ? (
            <><div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #00d9b8', borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite' }} />Recalculando...</>
          ) : '⟳ Recalcular agora'}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
