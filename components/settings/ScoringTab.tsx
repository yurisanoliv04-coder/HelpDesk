'use client'

import { useState, useTransition } from 'react'
import { recalculateAllScores, saveComputerScoringConfig } from '@/app/(app)/settings/actions'
import type { ComputerScoringConfig, RamTier, StorageTier, CpuTier, CpuGenTier } from '@/lib/scoring/computer'

interface Props {
  totalAssets: number
  initialConfig: ComputerScoringConfig
}

const thresholds = [
  { label: 'BOM',          pts: '≥ 60',    color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)',  desc: 'Atende bem o dia-a-dia sem ressalvas' },
  { label: 'INTERMEDIÁRIO', pts: '35 – 59', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.2)',  desc: 'Funcional, mas com alguma limitação' },
  { label: 'RUIM',         pts: '< 35',    color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)', desc: 'Impacto visível na produtividade' },
]

const inputN: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 6, padding: '4px 8px', fontSize: 12, color: '#c8d6e5',
  outline: 'none', width: 60, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace",
}
const inputS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 6, padding: '4px 8px', fontSize: 12, color: '#c8d6e5',
  outline: 'none', flex: 1, fontFamily: "'JetBrains Mono', monospace",
}

export default function ScoringTab({ totalAssets, initialConfig }: Props) {
  const [isPending, startTransition] = useTransition()
  const [calcResult, setCalcResult] = useState<{ ok: boolean; updated: number; error?: string } | null>(null)
  const [saveResult, setSaveResult] = useState<{ ok: boolean; error?: string } | null>(null)

  const [config, setConfig] = useState<ComputerScoringConfig>(initialConfig)
  const [hasChanges, setHasChanges] = useState(false)

  function updateConfig(next: ComputerScoringConfig) {
    setConfig(next); setHasChanges(true); setSaveResult(null)
  }

  // RAM tier edit
  function setRamPts(idx: number, pts: number) {
    const ram = config.ram.map((r, i) => i === idx ? { ...r, pts } : r)
    updateConfig({ ...config, ram })
  }
  function addRamTier() {
    updateConfig({ ...config, ram: [...config.ram, { label: 'Nova faixa', minGb: 0, pts: 0 }] })
  }
  function removeRamTier(idx: number) {
    updateConfig({ ...config, ram: config.ram.filter((_, i) => i !== idx) })
  }
  function setRamLabel(idx: number, label: string) {
    const ram = config.ram.map((r, i) => i === idx ? { ...r, label } : r)
    updateConfig({ ...config, ram })
  }
  function setRamMinGb(idx: number, minGb: number) {
    const ram = config.ram.map((r, i) => i === idx ? { ...r, minGb } : r)
    updateConfig({ ...config, ram })
  }

  // Storage tier edit
  function setStoragePts(idx: number, pts: number) {
    const storage = config.storage.map((s, i) => i === idx ? { ...s, pts } : s)
    updateConfig({ ...config, storage })
  }
  function addStorageTier() {
    updateConfig({ ...config, storage: [...config.storage, { type: 'HDD', label: 'Nova faixa', pts: 0 }] })
  }
  function removeStorageTier(idx: number) {
    updateConfig({ ...config, storage: config.storage.filter((_, i) => i !== idx) })
  }
  function setStorageLabel(idx: number, label: string) {
    const storage = config.storage.map((s, i) => i === idx ? { ...s, label } : s)
    updateConfig({ ...config, storage })
  }

  // CPU tier edit
  function setCpuPts(idx: number, pts: number) {
    const cpu = config.cpu.map((c, i) => i === idx ? { ...c, pts } : c)
    updateConfig({ ...config, cpu })
  }
  function addCpuTier() {
    updateConfig({ ...config, cpu: [...config.cpu, { patterns: [''], label: 'Novo modelo', pts: 0 }] })
  }
  function removeCpuTier(idx: number) {
    updateConfig({ ...config, cpu: config.cpu.filter((_, i) => i !== idx) })
  }
  function setCpuLabel(idx: number, label: string) {
    const cpu = config.cpu.map((c, i) => i === idx ? { ...c, label } : c)
    updateConfig({ ...config, cpu })
  }

  // CPU gen edit
  function setCpuGenAdj(idx: number, adj: number) {
    const cpuGen = config.cpuGen.map((g, i) => i === idx ? { ...g, adj } : g)
    updateConfig({ ...config, cpuGen })
  }
  function setCpuGenLabel(idx: number, label: string) {
    const cpuGen = config.cpuGen.map((g, i) => i === idx ? { ...g, label } : g)
    updateConfig({ ...config, cpuGen })
  }

  function handleSaveConfig() {
    setSaveResult(null)
    startTransition(async () => {
      const r = await saveComputerScoringConfig(config)
      setSaveResult(r)
      if (r.ok) setHasChanges(false)
    })
  }

  function handleRecalculate() {
    setCalcResult(null)
    startTransition(async () => {
      const r = await recalculateAllScores()
      setCalcResult(r)
    })
  }

  const sectionCard = (color: string): React.CSSProperties => ({
    background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '18px 20px',
  })
  const headerLabel = (color: string): React.CSSProperties => ({
    fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
    color, letterSpacing: '0.08em',
  })
  const addBtn: React.CSSProperties = {
    padding: '4px 12px', borderRadius: 6, fontSize: 10, cursor: 'pointer',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#3d5068', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
  }
  const delBtn: React.CSSProperties = {
    padding: '2px 7px', borderRadius: 5, fontSize: 10, cursor: 'pointer',
    background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', color: '#f87171',
    flexShrink: 0,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Thresholds (static) */}
      <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '20px 22px' }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#3d5068', letterSpacing: '0.1em', marginBottom: 14 }}>CLASSIFICAÇÃO DE QUALIDADE</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {thresholds.map(t => (
            <div key={t.label} style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: t.color, letterSpacing: '0.08em' }}>{t.label}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 800, color: t.color }}>{t.pts}</span>
              </div>
              <p style={{ fontSize: 11, color: '#3d5068', lineHeight: 1.4 }}>{t.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Unsaved changes banner */}
      {hasChanges && (
        <div style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontSize: 12, color: '#fbbf24' }}>⚠ Há alterações não salvas na configuração de pontuação.</span>
          <button onClick={handleSaveConfig} disabled={isPending} style={{
            padding: '7px 18px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24',
            fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap', flexShrink: 0,
          }}>Salvar configuração</button>
        </div>
      )}
      {saveResult && (
        <p style={{ fontSize: 12, color: saveResult.ok ? '#34d399' : '#f87171', textAlign: 'center' }}>
          {saveResult.ok ? '✓ Configuração salva com sucesso' : `⚠ ${saveResult.error}`}
        </p>
      )}

      {/* Criteria grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>

        {/* RAM card */}
        <div style={sectionCard('#38bdf8')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>🧠</span>
              <div>
                <p style={headerLabel('#38bdf8')}>MEMÓRIA RAM</p>
                <p style={{ fontSize: 10, color: '#2d4060', marginTop: 1 }}>{config.maxRamPts} pontos máx</p>
              </div>
            </div>
            <button style={addBtn} onClick={addRamTier}>+ Faixa</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {config.ram.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input value={r.label} onChange={e => setRamLabel(i, e.target.value)} style={{ ...inputS, minWidth: 0 }} title="Rótulo" />
                <input type="number" value={r.minGb} onChange={e => setRamMinGb(i, Number(e.target.value))} style={{ ...inputN, width: 50 }} title="GB mín" min={0} />
                <input type="number" value={r.pts} onChange={e => setRamPts(i, Number(e.target.value))} style={inputN} title="Pontos" min={0} max={config.maxRamPts} />
                <span style={{ fontSize: 10, color: '#2d4060', flexShrink: 0 }}>pts</span>
                <button style={delBtn} onClick={() => removeRamTier(i)} title="Remover">✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* Storage card */}
        <div style={sectionCard('#a78bfa')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>💾</span>
              <div>
                <p style={headerLabel('#a78bfa')}>ARMAZENAMENTO</p>
                <p style={{ fontSize: 10, color: '#2d4060', marginTop: 1 }}>{config.maxStoragePts} pontos máx</p>
              </div>
            </div>
            <button style={addBtn} onClick={addStorageTier}>+ Faixa</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {config.storage.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input value={s.label} onChange={e => setStorageLabel(i, e.target.value)} style={{ ...inputS, minWidth: 0 }} />
                <input type="number" value={s.pts} onChange={e => setStoragePts(i, Number(e.target.value))} style={inputN} min={0} max={config.maxStoragePts} />
                <span style={{ fontSize: 10, color: '#2d4060', flexShrink: 0 }}>pts</span>
                <button style={delBtn} onClick={() => removeStorageTier(i)} title="Remover">✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* CPU card */}
        <div style={sectionCard('#34d399')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>⚙️</span>
              <div>
                <p style={headerLabel('#34d399')}>PROCESSADOR (CPU)</p>
                <p style={{ fontSize: 10, color: '#2d4060', marginTop: 1 }}>{config.maxCpuPts} pontos máx</p>
              </div>
            </div>
            <button style={addBtn} onClick={addCpuTier}>+ Modelo</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {config.cpu.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input value={c.label} onChange={e => setCpuLabel(i, e.target.value)} style={{ ...inputS, minWidth: 0 }} />
                <input type="number" value={c.pts} onChange={e => setCpuPts(i, Number(e.target.value))} style={inputN} min={0} max={config.maxCpuPts} />
                <span style={{ fontSize: 10, color: '#2d4060', flexShrink: 0 }}>pts</span>
                <button style={delBtn} onClick={() => removeCpuTier(i)} title="Remover">✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* CPU Generation card */}
        <div style={sectionCard('#fbbf24')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 16 }}>📅</span>
            <div>
              <p style={headerLabel('#fbbf24')}>GERAÇÃO DO PROCESSADOR</p>
              <p style={{ fontSize: 10, color: '#2d4060', marginTop: 1 }}>Ajuste aplicado sobre pontuação do modelo</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {config.cpuGen.map((g, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input value={g.label} onChange={e => setCpuGenLabel(i, e.target.value)} style={{ ...inputS, minWidth: 0 }} />
                <input type="number" value={g.adj} onChange={e => setCpuGenAdj(i, Number(e.target.value))} style={{ ...inputN, color: g.adj > 0 ? '#34d399' : g.adj < 0 ? '#f87171' : '#94a3b8' }} />
                <span style={{ fontSize: 10, color: '#2d4060', flexShrink: 0 }}>pts</span>
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
            Aplica os critérios atuais (salvos) a todos os {totalAssets} ativos com dados de hardware cadastrados.
          </p>
          {calcResult && (
            <p style={{ fontSize: 12, marginTop: 8, color: calcResult.ok ? '#34d399' : '#f87171' }}>
              {calcResult.ok ? `✓ ${calcResult.updated} ativos recalculados com sucesso` : `⚠ Erro: ${calcResult.error}`}
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
