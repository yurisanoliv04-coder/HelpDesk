'use client'

import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

export interface WeeklyChartData {
  day: string      // day-of-month label e.g. '1', '10', '30'
  done: number     // tickets concluídos
  open: number     // tickets não concluídos
  isToday: boolean
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ dataKey: string; value: number; color: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const done = payload.find((p) => p.dataKey === 'done')?.value ?? 0
  const open = payload.find((p) => p.dataKey === 'open')?.value ?? 0
  return (
    <div style={{
      background: '#0b111c',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 6,
      padding: '8px 12px',
    }}>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3d5068', marginBottom: 6 }}>
        dia {label}
      </p>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#34d399', marginBottom: 2 }}>
        ✓ Concluídos: {done}
      </p>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#38bdf8' }}>
        ○ Abertos: {open}
      </p>
    </div>
  )
}

interface WeeklyChartProps {
  data: WeeklyChartData[]
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const todayLabel = data.find((d) => d.isToday)?.day

  return (
    <div style={{
      background: '#0d1422',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 8,
      padding: '18px 20px 12px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p className="section-label">── CHAMADOS / 30 DIAS</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3d5068' }}>
            <span style={{ width: 16, height: 1.5, background: '#34d399', display: 'inline-block', borderRadius: 2 }} />
            concluídos
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3d5068' }}>
            <span style={{ width: 16, height: 1.5, background: '#38bdf8', display: 'inline-block', borderRadius: 2 }} />
            abertos no dia
          </span>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060' }}>
            últimos 30 dias
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={130}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
          <XAxis
            dataKey="day"
            interval={1}
            tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fill: '#2d4060' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fill: '#2d4060' }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }}
          />
          {todayLabel && (
            <ReferenceLine
              x={todayLabel}
              stroke="rgba(255,255,255,0.08)"
              strokeDasharray="3 3"
            />
          )}
          <Line
            dataKey="done"
            stroke="#34d399"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: '#34d399', strokeWidth: 0 }}
          />
          <Line
            dataKey="open"
            stroke="#38bdf8"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: '#38bdf8', strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
