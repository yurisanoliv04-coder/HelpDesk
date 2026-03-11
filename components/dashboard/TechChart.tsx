'use client'

import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

export interface TechChartData {
  name: string   // technician name
  count: number  // open + in_progress tickets
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#111927',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 6,
      padding: '8px 12px',
    }}>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#64748b', marginBottom: 4 }}>
        {label}
      </p>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: '#38bdf8' }}>
        {payload[0].value} ativo{payload[0].value !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

interface TechChartProps {
  data: TechChartData[]
}

export function TechChart({ data }: TechChartProps) {
  if (data.length === 0) {
    return (
      <div style={{
        background: '#0d1422',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 8,
        padding: '20px',
      }}>
        <p className="section-label" style={{ marginBottom: 16 }}>── CARGA POR TÉCNICO</p>
        <p style={{ fontSize: 13, color: '#2d4060', fontFamily: "'JetBrains Mono', monospace" }}>
          — sem dados —
        </p>
      </div>
    )
  }

  // Truncate names to fit axis
  const chartData = data.map((d) => ({
    ...d,
    shortName: d.name.split(' ')[0], // first name only
  }))

  return (
    <div style={{
      background: '#0d1422',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 8,
      padding: '20px 20px 12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p className="section-label">── CARGA POR TÉCNICO</p>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#2d4060' }}>
          abertos + em atend.
        </p>
      </div>

      <ResponsiveContainer width="100%" height={Math.max(100, data.length * 36)}>
        <BarChart
          data={chartData}
          layout="vertical"
          barSize={18}
          margin={{ top: 0, right: 24, bottom: 0, left: 0 }}
        >
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fill: '#3d5068' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="shortName"
            width={64}
            tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="count" radius={[0, 3, 3, 0]}>
            {chartData.map((_, i) => (
              <Cell
                key={i}
                fill={i === 0 ? '#38bdf8' : `rgba(56,189,248,${0.6 - i * 0.08})`}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
