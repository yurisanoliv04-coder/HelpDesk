'use client'

import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts'
import { useRouter } from 'next/navigation'
import { useWidgetConfig } from '@/lib/dashboard/widget-context'

export interface TechChartData {
  id: string
  name: string
  count: number
}

const COLORS = ['#38bdf8', '#22d3ee', '#34d399', '#a78bfa', '#f59e0b', '#f87171']

// ── Tooltip ───────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number; name?: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  const name = payload[0].name ?? label
  return (
    <div style={{
      background: '#111927', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 6, padding: '8px 12px',
    }}>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#64748b', marginBottom: 4 }}>
        {name}
      </p>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: '#38bdf8' }}>
        {val} ativo{val !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

// ── Custom pie label ───────────────────────────────────────────────────────
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, name, value }: {
  cx: number; cy: number; midAngle: number
  innerRadius: number; outerRadius: number
  name: string; value: number
}) {
  if (value === 0) return null
  const RADIAN = Math.PI / 180
  const r = innerRadius + (outerRadius - innerRadius) * 1.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="#64748b" textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={10} fontFamily="'JetBrains Mono', monospace">
      {name.split(' ')[0]} ({value})
    </text>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────
interface TechChartProps {
  data: TechChartData[]
}

export function TechChart({ data }: TechChartProps) {
  const config    = useWidgetConfig()
  const chartType = (config.chartType as string | undefined) ?? 'bar_h'
  const router    = useRouter()

  function goToTech(entry: TechChartData) {
    if (entry.count === 0) return
    router.push(`/tickets?assignee=${entry.id}`)
  }

  const header = (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 16, flexShrink: 0,
    }}>
      <p className="section-label">── CARGA POR TÉCNICO</p>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#2d4060' }}>
        abertos + em atend.
      </p>
    </div>
  )

  const shell = (content: React.ReactNode) => (
    <div style={{
      background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 8, padding: '20px 20px 12px',
      height: '100%', display: 'flex', flexDirection: 'column',
    }}>
      {header}
      <div style={{ flex: 1, minHeight: 0 }}>{content}</div>
    </div>
  )

  if (data.length === 0) {
    return shell(
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#2d4060' }}>
        — sem técnicos cadastrados —
      </p>
    )
  }

  const chartData = data.map((d, i) => ({
    ...d,
    shortName: d.name.split(' ')[0],
    fill: d.count === 0 ? 'rgba(255,255,255,0.06)' : COLORS[i % COLORS.length],
  }))

  const barStyle = { cursor: 'pointer' }

  // ── Barras Horizontais (default) ─────────────────────────────────────────
  if (chartType === 'bar_h') {
    return shell(
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" barSize={16}
          margin={{ top: 0, right: 24, bottom: 0, left: 0 }}>
          <XAxis type="number" allowDecimals={false} domain={[0, 'auto']}
            tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fill: '#3d5068' }}
            axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="shortName" width={64}
            tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fill: '#64748b' }}
            axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="count" radius={[0, 3, 3, 0]} minPointSize={2}
            style={barStyle}
            onClick={(entry: TechChartData) => goToTech(entry)}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )
  }

  // ── Barras Verticais ─────────────────────────────────────────────────────
  if (chartType === 'bar_v') {
    return shell(
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} barSize={28}
          margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
          <XAxis dataKey="shortName"
            tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fill: '#64748b' }}
            axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false}
            tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fill: '#3d5068' }}
            axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="count" radius={[3, 3, 0, 0]} minPointSize={2}
            style={barStyle}
            onClick={(entry: TechChartData) => goToTech(entry)}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )
  }

  // ── Pizza ─────────────────────────────────────────────────────────────────
  return shell(
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          dataKey="count"
          nameKey="shortName"
          cx="50%"
          cy="50%"
          outerRadius="65%"
          innerRadius="30%"
          labelLine={false}
          label={PieLabel}
          style={barStyle}
          onClick={(entry: TechChartData) => goToTech(entry)}
        >
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.fill} fillOpacity={entry.count === 0 ? 0.2 : 0.85}
              stroke="rgba(8,14,26,0.8)" strokeWidth={1.5} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  )
}
