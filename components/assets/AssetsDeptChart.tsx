'use client'

import { useEffect, useState } from 'react'

export interface DeptStat {
  name: string
  BOM: number
  INTERMEDIARIO: number
  RUIM: number
  NONE: number
}

const SEGMENTS = [
  { key: 'BOM',          color: '#34d399', label: 'Bom'           },
  { key: 'INTERMEDIARIO',color: '#fbbf24', label: 'Intermediário'  },
  { key: 'RUIM',         color: '#f87171', label: 'Ruim'          },
  { key: 'NONE',         color: '#2d4060', label: 'Sem pontuação' },
] as const

export default function AssetsDeptChart({ data }: { data: DeptStat[] }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t) }, [])

  if (data.length === 0) return null

  const maxTotal    = Math.max(...data.map(d => d.BOM + d.INTERMEDIARIO + d.RUIM + d.NONE), 1)
  const grandTotal  = data.reduce((s, d) => s + d.BOM + d.INTERMEDIARIO + d.RUIM + d.NONE, 0)

  return (
    <div style={{
      background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: '20px 24px',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
            color: '#3d5068', letterSpacing: '0.1em',
          }}>
            DISTRIBUIÇÃO DE ATIVOS IMPLANTADOS
          </p>
          <p style={{ fontSize: 12, color: '#2d4060', marginTop: 4 }}>
            {grandTotal} ativo{grandTotal !== 1 ? 's' : ''} alocado{grandTotal !== 1 ? 's' : ''} em {data.length} departamento{data.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          {SEGMENTS.map(seg => (
            <div key={seg.key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', letterSpacing: '0.05em' }}>
                {seg.label.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.map(dept => {
          const total = dept.BOM + dept.INTERMEDIARIO + dept.RUIM + dept.NONE
          const pct   = (n: number) => total > 0 ? (n / maxTotal) * 100 : 0

          return (
            <div key={dept.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#8ba5c0' }}>{dept.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {SEGMENTS.filter(s => dept[s.key as keyof DeptStat] as number > 0).map(seg => (
                    <span key={seg.key} style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: seg.color,
                    }}>
                      {dept[seg.key as keyof DeptStat] as number} {seg.label.split(' ')[0].toLowerCase()}
                    </span>
                  ))}
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                    fontWeight: 700, color: '#4a6580', marginLeft: 4,
                  }}>
                    {total}
                  </span>
                </div>
              </div>

              {/* Stacked bar */}
              <div style={{
                height: 16, borderRadius: 6, overflow: 'hidden',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', position: 'relative',
              }}>
                {SEGMENTS.map(seg => {
                  const w = pct(dept[seg.key as keyof DeptStat] as number)
                  return w > 0 ? (
                    <div
                      key={seg.key}
                      title={`${seg.label}: ${dept[seg.key as keyof DeptStat]}`}
                      style={{
                        height: '100%',
                        width: mounted ? `${w}%` : '0%',
                        background: seg.color,
                        transition: 'width 0.55s cubic-bezier(0.4,0,0.2,1)',
                        flexShrink: 0,
                        opacity: 0.82,
                      }}
                    />
                  ) : null
                })}

                {/* % fill indicator on track */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `linear-gradient(90deg, transparent ${mounted ? (total / maxTotal) * 100 : 0}%, rgba(255,255,255,0.015) ${mounted ? (total / maxTotal) * 100 : 0}%)`,
                  pointerEvents: 'none',
                }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Scale hint */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#1e3048' }}>0</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#1e3048' }}>
          máx {maxTotal} ativo{maxTotal !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
