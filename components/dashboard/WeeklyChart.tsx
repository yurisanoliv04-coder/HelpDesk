'use client'

import React, { useState } from 'react'
import {
  LineChart, Line,
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useRouter } from 'next/navigation'
import { useWidgetConfig } from '@/lib/dashboard/widget-context'

export interface WeeklyChartData {
  day: string
  date: string   // YYYY-MM-DD for navigation
  done: number
  open: number
  isToday: boolean
}

const WINDOW   = 30  // days shown at once
const PAN_STEP = 7   // days per arrow press

// ── Tooltip ───────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ dataKey: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const done = payload.find((p) => p.dataKey === 'done')?.value ?? 0
  const open = payload.find((p) => p.dataKey === 'open')?.value ?? 0
  return (
    <div style={{
      background: '#0b111c', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 6, padding: '8px 12px',
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

// ── Nav arrow button ──────────────────────────────────────────────────────
function NavBtn({ dir, onClick, disabled }: { dir: 'left' | 'right'; onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 22, height: 22, borderRadius: 4, border: 'none',
        background: disabled ? 'transparent' : 'rgba(255,255,255,0.05)',
        color: disabled ? '#1e3045' : '#3d5068',
        cursor: disabled ? 'default' : 'pointer',
        fontSize: 12, lineHeight: 1, flexShrink: 0,
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      {dir === 'left' ? '‹' : '›'}
    </button>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────
export function WeeklyChart({ data }: { data: WeeklyChartData[] }) {
  const config    = useWidgetConfig()
  const chartType = (config.chartType as string | undefined) ?? 'line'
  const router    = useRouter()

  // offset=0 → most recent WINDOW days; offset=N → N days back in time
  const maxOffset = Math.max(0, data.length - WINDOW)
  const [offset, setOffset] = useState(0)

  const start   = data.length - WINDOW - offset
  const visible = data.slice(Math.max(0, start), start + WINDOW)

  const todayLabel = visible.find((d) => d.isToday)?.day
  const isPresent  = offset === 0

  function handleChartClick(payload: { activePayload?: Array<{ payload: WeeklyChartData }> } | null) {
    const date = payload?.activePayload?.[0]?.payload?.date
    if (date) router.push(`/tickets?date=${date}`)
  }

  function goBack()    { setOffset((o) => Math.min(o + PAN_STEP, maxOffset)) }
  function goForward() { setOffset((o) => Math.max(o - PAN_STEP, 0)) }

  // Range label shown in header
  const rangeLabel = isPresent
    ? 'últimos 30 dias'
    : (() => {
        const first = visible[0]
        const last  = visible[visible.length - 1]
        return `${first?.day} → ${last?.day}`
      })()

  const legend = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <NavBtn dir="left"  onClick={goBack}    disabled={offset >= maxOffset} />
      <NavBtn dir="right" onClick={goForward} disabled={offset <= 0} />
      <span style={{ display: 'flex', alignItems: 'center', gap: 6,
        fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3d5068' }}>
        <span style={{ width: 16, height: 1.5, background: '#34d399', display: 'inline-block', borderRadius: 2 }} />
        concluídos
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6,
        fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3d5068' }}>
        <span style={{ width: 16, height: 1.5, background: '#38bdf8', display: 'inline-block', borderRadius: 2 }} />
        abertos no dia
      </span>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060' }}>
        {rangeLabel}
      </p>
    </div>
  )

  const xAxis = (
    <XAxis dataKey="day" interval={1}
      tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fill: '#2d4060' }}
      axisLine={false} tickLine={false} />
  )
  const yAxis = (
    <YAxis allowDecimals={false}
      tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fill: '#2d4060' }}
      axisLine={false} tickLine={false} width={28} />
  )
  const tooltip = <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />
  const refLine = todayLabel
    ? <ReferenceLine x={todayLabel} stroke="rgba(255,255,255,0.12)" strokeDasharray="3 3" label={{ value: 'hoje', position: 'insideTopRight', fontSize: 8, fill: 'rgba(255,255,255,0.2)', fontFamily: "'JetBrains Mono', monospace" }} />
    : null

  const shell = (chart: React.ReactNode) => (
    <div style={{
      background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 8, padding: '18px 20px 12px',
      height: '100%', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexShrink: 0 }}>
        <p className="section-label">── CHAMADOS / 30 DIAS</p>
        {legend}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>{chart}</div>
    </div>
  )

  const chartStyle = { cursor: 'pointer' }

  // ── Linha (default) ──────────────────────────────────────────────────────
  if (chartType === 'line') {
    return shell(
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={visible} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}
          style={chartStyle} onClick={handleChartClick}>
          {xAxis}{yAxis}{tooltip}{refLine}
          <Line dataKey="done" stroke="#34d399" strokeWidth={1.5} dot={false}
            activeDot={{ r: 4, fill: '#34d399', strokeWidth: 0, cursor: 'pointer' }} />
          <Line dataKey="open" stroke="#38bdf8" strokeWidth={1.5} dot={false}
            activeDot={{ r: 4, fill: '#38bdf8', strokeWidth: 0, cursor: 'pointer' }} />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  // ── Área ─────────────────────────────────────────────────────────────────
  if (chartType === 'area') {
    return shell(
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={visible} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}
          style={chartStyle} onClick={handleChartClick}>
          <defs>
            <linearGradient id="gradDone" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#34d399" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradOpen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
            </linearGradient>
          </defs>
          {xAxis}{yAxis}{tooltip}{refLine}
          <Area dataKey="done" stroke="#34d399" strokeWidth={1.5} fill="url(#gradDone)" dot={false}
            activeDot={{ r: 4, fill: '#34d399', strokeWidth: 0, cursor: 'pointer' }} />
          <Area dataKey="open" stroke="#38bdf8" strokeWidth={1.5} fill="url(#gradOpen)" dot={false}
            activeDot={{ r: 4, fill: '#38bdf8', strokeWidth: 0, cursor: 'pointer' }} />
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  // ── Barras Verticais ─────────────────────────────────────────────────────
  return shell(
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={visible} barSize={6} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}
        style={chartStyle} onClick={handleChartClick}>
        {xAxis}{yAxis}{tooltip}{refLine}
        <Bar dataKey="done" fill="#34d399" fillOpacity={0.8} radius={[2, 2, 0, 0]}
          style={{ cursor: 'pointer' }} />
        <Bar dataKey="open" fill="#38bdf8" fillOpacity={0.8} radius={[2, 2, 0, 0]}
          style={{ cursor: 'pointer' }} />
      </BarChart>
    </ResponsiveContainer>
  )
}
