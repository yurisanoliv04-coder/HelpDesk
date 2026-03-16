'use client'

import { useEffect, useState } from 'react'

export interface DeptStat {
  name: string
  BOM: number
  INTERMEDIARIO: number
  RUIM: number
  NONE: number
}

const SEGS = [
  { key: 'BOM',           color: '#34d399', label: 'Bom'           },
  { key: 'INTERMEDIARIO', color: '#fbbf24', label: 'Intermediário'  },
  { key: 'RUIM',          color: '#f87171', label: 'Ruim'          },
  { key: 'NONE',          color: '#334155', label: 'Sem pontuação' },
] as const

const MAX_H = 148 // max column height in px

// Shorten long department names for the axis label
function shortName(name: string) {
  const words = name.split(' ')
  if (words.length <= 2) return name
  // Keep first word + abbreviated rest
  return words[0] + '\n' + words.slice(1).join(' ')
}

export default function AssetsDeptChart({ data }: { data: DeptStat[] }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(t)
  }, [])

  if (data.length === 0) return null

  const maxTotal   = Math.max(...data.map(d => d.BOM + d.INTERMEDIARIO + d.RUIM + d.NONE), 1)
  const grandTotal = data.reduce((s, d) => s + d.BOM + d.INTERMEDIARIO + d.RUIM + d.NONE, 0)

  return (
    <div style={{
      background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: '20px 24px',
    }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#3d5068', letterSpacing: '0.1em' }}>
            DISTRIBUIÇÃO DE ATIVOS IMPLANTADOS
          </p>
          <p style={{ fontSize: 12, color: '#2d4060', marginTop: 4 }}>
            {grandTotal} ativo{grandTotal !== 1 ? 's' : ''} em {data.length} departamento{data.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {SEGS.map(seg => (
            <div key={seg.key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', letterSpacing: '0.04em' }}>
                {seg.label.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Column chart ───────────────────────────────────────────────── */}
      {/* Wrapper: chart area + baseline */}
      <div style={{ position: 'relative' }}>

        {/* Horizontal grid lines */}
        {[1, 0.75, 0.5, 0.25].map(frac => (
          <div key={frac} style={{
            position: 'absolute', left: 0, right: 0,
            bottom: 38 + (frac * MAX_H),
            height: 1,
            background: 'rgba(255,255,255,0.04)',
            pointerEvents: 'none',
          }}>
            <span style={{
              position: 'absolute', right: 'calc(100% + 6px)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 8, color: '#1e3048',
              transform: 'translateY(-50%)',
              whiteSpace: 'nowrap',
            }}>
              {Math.round(frac * maxTotal)}
            </span>
          </div>
        ))}

        {/* Columns */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, paddingBottom: 38 }}>
          {data.map(dept => {
            const total = dept.BOM + dept.INTERMEDIARIO + dept.RUIM + dept.NONE
            const barH  = maxTotal > 0 ? (total / maxTotal) * MAX_H : 0

            return (
              <div key={dept.name} style={{
                flex: '1 1 48px', minWidth: 44, maxWidth: 90,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}>
                {/* Value + % above */}
                <div style={{ marginBottom: 6, textAlign: 'center' }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 14, fontWeight: 800, color: '#c8d6e5', display: 'block',
                  }}>
                    {total}
                  </span>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 8, color: '#2d4060',
                  }}>
                    {grandTotal > 0 ? Math.round(total / grandTotal * 100) : 0}%
                  </span>
                </div>

                {/* Stacked column */}
                <div style={{
                  width: '100%', maxWidth: 56,
                  height: mounted ? barH : 2,
                  display: 'flex', flexDirection: 'column',
                  borderRadius: '5px 5px 0 0',
                  overflow: 'hidden',
                  transition: 'height 0.6s cubic-bezier(0.34, 1.2, 0.64, 1)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderBottom: 'none',
                }}>
                  {SEGS.map(seg => {
                    const count = dept[seg.key as keyof DeptStat] as number
                    return count > 0 ? (
                      <div key={seg.key} style={{
                        flex: count,
                        background: seg.color,
                        opacity: 0.82,
                        minHeight: 3,
                      }} />
                    ) : null
                  })}
                </div>

                {/* Baseline */}
                <div style={{
                  width: '100%', maxWidth: 56, height: 2,
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '0 0 2px 2px',
                }} />

                {/* Dept name */}
                <div style={{
                  marginTop: 8, textAlign: 'center',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9, color: '#3d5068', lineHeight: 1.4,
                  letterSpacing: '0.02em',
                  maxWidth: 72, wordBreak: 'break-word',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                } as React.CSSProperties}
                  title={dept.name}
                >
                  {dept.name}
                </div>

                {/* Performance mini-pills */}
                {total > 0 && (
                  <div style={{ display: 'flex', gap: 2, marginTop: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {SEGS.filter(s => (dept[s.key as keyof DeptStat] as number) > 0 && s.key !== 'NONE').map(seg => (
                      <span key={seg.key} style={{
                        fontSize: 8, fontFamily: "'JetBrains Mono', monospace",
                        color: seg.color, background: `${seg.color}18`,
                        borderRadius: 3, padding: '1px 4px',
                      }}>
                        {dept[seg.key as keyof DeptStat] as number}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
