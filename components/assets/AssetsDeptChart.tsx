'use client'

import { useRef, useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
} from 'recharts'
import { useRouter } from 'next/navigation'
import { useWidgetConfig } from '@/lib/dashboard/widget-context'

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

// ── Min pixels per department column ────────────────────────────────────────
const MIN_COL_PX = 120

// ── Pie chart variant ────────────────────────────────────────────────────────
function PieVariant({ data }: { data: DeptStat[] }) {
  const router = useRouter()

  // Aggregate totals per quality score across all locations
  const totals = SEGS.map((s) => ({
    name:   s.label,
    segKey: s.key,   // BOM | INTERMEDIARIO | RUIM | NONE — used for nav
    value:  data.reduce((sum, d) => sum + d[s.key], 0),
    color:  s.color,
  })).filter((s) => s.value > 0)

  const grand = totals.reduce((s, t) => s + t.value, 0)

  return (
    <div style={{
      background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: '20px 24px',
      height: '100%', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ marginBottom: 4, flexShrink: 0 }}>
        <p style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
          fontWeight: 700, color: '#3d5068', letterSpacing: '0.1em',
        }}>
          DISTRIBUIÇÃO DE ATIVOS POR LOCAL
        </p>
        <p style={{ fontSize: 12, color: '#2d4060', marginTop: 4 }}>
          {grand} ativo{grand !== 1 ? 's' : ''} · por qualidade
        </p>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <PieChart width={300} height={300} style={{ margin: '0 auto', cursor: 'pointer' }}>
          <Pie data={totals} dataKey="value" nameKey="name"
            cx="50%" cy="50%" outerRadius="65%" innerRadius="35%"
            stroke="rgba(8,14,26,0.8)" strokeWidth={2}
            onClick={(entry: { name: string; segKey: string }) => {
              if (entry.segKey === 'NONE') return
              router.push(`/assets?performance=${encodeURIComponent(entry.segKey)}`)
            }}>
            {totals.map((t, i) => (
              <Cell key={i} fill={t.color} fillOpacity={0.85} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#0d1d30', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
            }}
            itemStyle={{ color: '#c8d6e5' }}
          />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </div>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function AssetsDeptChart({ data }: { data: DeptStat[] }) {
  const config    = useWidgetConfig()
  const chartType = (config.chartType as string | undefined) ?? 'bar_stacked'
  const router    = useRouter()

  function handleBarClick(payload: { activeLabel?: string } | null) {
    const loc = payload?.activeLabel
    if (loc) router.push(`/assets?location=${encodeURIComponent(loc)}`)
  }

  const wrapperRef  = useRef<HTMLDivElement>(null)
  const chartAreaRef = useRef<HTMLDivElement>(null)
  const [wrapperW, setWrapperW] = useState(0)
  const [chartH,   setChartH]   = useState(250)

  // Measure available width for horizontal scroll logic
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    setWrapperW(el.clientWidth)
    const ro = new ResizeObserver(([entry]) => setWrapperW(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Measure available height so the chart fills it
  useEffect(() => {
    const el = chartAreaRef.current
    if (!el) return
    setChartH(el.clientHeight)
    const ro = new ResizeObserver(([entry]) => setChartH(entry.contentRect.height))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  if (data.length === 0) return null

  // Pizza mode handled by separate component
  if (chartType === 'pie') return <PieVariant data={data} />

  const grandTotal = data.reduce((s, d) => s + d.BOM + d.INTERMEDIARIO + d.RUIM + d.NONE, 0)
  const chartWidth  = Math.max(wrapperW, data.length * MIN_COL_PX)
  const maxLabelLen = data.length > 12 ? 7 : data.length > 7 ? 10 : 14
  const chartData   = data.map(d => ({
    ...d,
    name:     d.name.length > maxLabelLen ? d.name.slice(0, maxLabelLen - 1) + '…' : d.name,
    fullName: d.name,
  }))

  return (
    <div style={{
      background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: '20px 24px',
      height: '100%', display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 4, flexShrink: 0 }}>
        <p style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
          fontWeight: 700, color: '#3d5068', letterSpacing: '0.1em',
        }}>
          DISTRIBUIÇÃO DE ATIVOS POR LOCAL
        </p>
        <p style={{ fontSize: 12, color: '#2d4060', marginTop: 4 }}>
          {grandTotal} ativo{grandTotal !== 1 ? 's' : ''} em{' '}
          {data.length} local{data.length !== 1 ? 'is' : ''}
        </p>
      </div>

      {/* Chart area — fills remaining height */}
      <div ref={chartAreaRef} style={{ flex: 1, minHeight: 0 }}>
        {/* Horizontal scroll wrapper */}
        <div
          ref={wrapperRef}
          style={{
            height: '100%',
            overflowX: chartWidth > wrapperW ? 'auto' : 'visible',
            overflowY: 'visible',
          }}
        >
          {wrapperW > 0 && (
            <BarChart
              width={chartWidth}
              height={Math.max(120, chartH)}
              data={chartData}
              barCategoryGap="30%"
              margin={{ top: 8, right: 16, left: -12, bottom: 0 }}
              style={{ cursor: 'pointer' }}
              onClick={handleBarClick}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fill: '#3d5068' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fill: '#2d4060' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Legend content={<CustomLegend />} />
              {SEGS.map(seg => (
                <Bar
                  key={seg.key}
                  dataKey={seg.key}
                  name={seg.label}
                  stackId={chartType === 'bar_stacked' ? 'a' : undefined}
                  fill={seg.color}
                  fillOpacity={0.85}
                  radius={chartType === 'bar_grouped' ? [2, 2, 0, 0] : undefined}
                />
              ))}
            </BarChart>
          )}
        </div>
      </div>
    </div>
  )
}
