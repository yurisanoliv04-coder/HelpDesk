'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'

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
  { key: 'NONE',          color: '#1e3a52', label: 'Sem pontuação' },
] as const

// ── Custom Tooltip ──────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ dataKey: string; name: string; fill: string; value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, p) => s + (p.value || 0), 0)
  return (
    <div style={{
      background: '#0d1d30', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 10, padding: '12px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      minWidth: 180,
    }}>
      <p style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
        fontWeight: 700, color: '#00d9b8', marginBottom: 8,
      }}>
        {label}
      </p>
      {[...payload].reverse().map(p => p.value > 0 ? (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.fill, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: '#8ba5c0', flex: 1 }}>{p.name}</span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12, fontWeight: 700, color: p.fill,
          }}>{p.value}</span>
        </div>
      ) : null)}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 6, paddingTop: 6,
        display: 'flex', justifyContent: 'space-between',
      }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3d5068' }}>
          TOTAL
        </span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12, fontWeight: 700, color: '#c8d6e5',
        }}>{total}</span>
      </div>
    </div>
  )
}

// ── Custom Legend ───────────────────────────────────────────────────────────
function CustomLegend({ payload }: { payload?: Array<{ value: string; color: string }> }) {
  if (!payload?.length) return null
  return (
    <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', paddingTop: 12 }}>
      {payload.map(entry => (
        <div key={entry.value} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: entry.color, flexShrink: 0 }} />
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9, color: '#3d5068', letterSpacing: '0.04em',
          }}>
            {entry.value.toUpperCase()}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function AssetsDeptChart({ data }: { data: DeptStat[] }) {
  if (data.length === 0) return null

  const grandTotal = data.reduce((s, d) => s + d.BOM + d.INTERMEDIARIO + d.RUIM + d.NONE, 0)

  // Truncate long department names for axis labels
  const chartData = data.map(d => ({
    ...d,
    name: d.name.length > 13 ? d.name.slice(0, 12) + '…' : d.name,
    fullName: d.name,
  }))

  return (
    <div style={{
      background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: '20px 24px',
    }}>

      {/* Header */}
      <div style={{ marginBottom: 4 }}>
        <p style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
          fontWeight: 700, color: '#3d5068', letterSpacing: '0.1em',
        }}>
          DISTRIBUIÇÃO DE ATIVOS IMPLANTADOS
        </p>
        <p style={{ fontSize: 12, color: '#2d4060', marginTop: 4 }}>
          {grandTotal} ativo{grandTotal !== 1 ? 's' : ''} em{' '}
          {data.length} departamento{data.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Recharts stacked bar chart */}
      <ResponsiveContainer width="100%" height={230}>
        <BarChart
          data={chartData}
          barCategoryGap="35%"
          margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, fill: '#3d5068',
            }}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            tickLine={false}
          />
          <YAxis
            tick={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9, fill: '#2d4060',
            }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          />
          <Legend content={<CustomLegend />} />

          {SEGS.map(seg => (
            <Bar
              key={seg.key}
              dataKey={seg.key}
              name={seg.label}
              stackId="a"
              fill={seg.color}
              fillOpacity={0.85}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
