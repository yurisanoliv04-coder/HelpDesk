/**
 * SVG thumbnail previews for the widget catalog modal.
 * Simple geometric illustrations — purely visual, no data.
 */

const C = {
  bg:      '#0b1523',
  border:  'rgba(255,255,255,0.06)',
  emerald: '#10b981',
  blue:    '#38bdf8',
  amber:   '#fbbf24',
  red:     '#f87171',
  purple:  '#a78bfa',
  muted:   'rgba(255,255,255,0.08)',
  dim:     'rgba(255,255,255,0.12)',
}

// ── Reusable SVG wrapper ──────────────────────────────────────────────────
function Preview({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="100%"
      height="80"
      viewBox="0 0 240 80"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block', borderRadius: 6, background: C.bg }}
    >
      {children}
    </svg>
  )
}

// ── Individual previews ───────────────────────────────────────────────────
function KpiCards() {
  const cards = [
    { x: 6,   color: C.blue,   value: '4'  },
    { x: 64,  color: C.amber,  value: '2'  },
    { x: 122, color: C.emerald,value: '17' },
    { x: 180, color: C.red,    value: '1'  },
  ]
  return (
    <Preview>
      {cards.map((c) => (
        <g key={c.x}>
          <rect x={c.x} y="10" width="52" height="60" rx="5" fill={C.muted} />
          <rect x={c.x} y="10" width="52" height="3"  rx="2" fill={c.color} />
          <text x={c.x + 26} y="46" textAnchor="middle" fill={c.color}
            fontSize="18" fontWeight="700" fontFamily="monospace">
            {c.value}
          </text>
          <rect x={c.x + 8} y="58" width="36" height="5" rx="2" fill={C.dim} />
        </g>
      ))}
    </Preview>
  )
}

function ListRows() {
  return (
    <Preview>
      {[12, 27, 42, 57].map((y, i) => (
        <g key={y}>
          <rect x="8" y={y} width="224" height="10" rx="3" fill={C.muted} />
          <rect x="8" y={y} width={i === 0 ? 48 : i === 1 ? 32 : i === 2 ? 40 : 28}
            height="10" rx="3"
            fill={i === 0 ? C.blue : i === 1 ? C.amber : i === 2 ? C.emerald : C.dim} />
        </g>
      ))}
    </Preview>
  )
}

function LineChartPreview() {
  const pts1 = '8,60 40,52 72,44 104,48 136,38 168,30 200,36 232,24'
  const pts2 = '8,68 40,60 72,56 104,62 136,54 168,62 200,58 232,50'
  return (
    <Preview>
      <polyline points={pts1} fill="none" stroke={C.emerald} strokeWidth="2" strokeLinejoin="round" />
      <polyline points={pts2} fill="none" stroke={C.blue}    strokeWidth="2" strokeLinejoin="round" />
      {[8, 40, 72, 104, 136, 168, 200, 232].map((x, i) => (
        <circle key={x} cx={x} cy={[60,52,44,48,38,30,36,24][i]} r="2.5" fill={C.emerald} />
      ))}
    </Preview>
  )
}

function AreaChartPreview() {
  const line  = '8,55 50,42 92,50 134,34 176,40 218,28 232,28'
  const area  = `8,55 50,42 92,50 134,34 176,40 218,28 232,28 232,72 8,72`
  return (
    <Preview>
      <polygon points={area} fill={`${C.emerald}28`} />
      <polyline points={line} fill="none" stroke={C.emerald} strokeWidth="2" strokeLinejoin="round" />
    </Preview>
  )
}

function BarVerticalPreview() {
  const bars = [
    { x: 16,  h: 30, color: C.emerald },
    { x: 52,  h: 50, color: C.blue    },
    { x: 88,  h: 40, color: C.emerald },
    { x: 124, h: 60, color: C.blue    },
    { x: 160, h: 35, color: C.emerald },
    { x: 196, h: 25, color: C.blue    },
  ]
  return (
    <Preview>
      <line x1="8" y1="72" x2="232" y2="72" stroke={C.dim} strokeWidth="1" />
      {bars.map((b) => (
        <rect key={b.x} x={b.x} y={72 - b.h} width="28" height={b.h} rx="3"
          fill={b.color} fillOpacity="0.8" />
      ))}
    </Preview>
  )
}

function BarHorizontalPreview() {
  const bars = [
    { y: 10, w: 160, color: C.blue    },
    { y: 26, w: 110, color: C.blue    },
    { y: 42, w:  80, color: C.blue    },
    { y: 58, w:  40, color: C.blue    },
  ]
  return (
    <Preview>
      {bars.map((b) => (
        <g key={b.y}>
          <rect x="36" y={b.y} width="190" height="10" rx="3" fill={C.muted} />
          <rect x="36" y={b.y} width={b.w}  height="10" rx="3"
            fill={b.color} fillOpacity="0.75" />
          <rect x="6"  y={b.y + 2} width="26" height="6" rx="2" fill={C.dim} />
        </g>
      ))}
    </Preview>
  )
}

function PieChartPreview() {
  // Simple wedges using SVG arcs
  const cx = 120, cy = 40, r = 32
  // Angles in radians: emerald 40%, blue 30%, amber 20%, red 10%
  const slices = [
    { pct: 0.40, color: C.emerald },
    { pct: 0.30, color: C.blue    },
    { pct: 0.20, color: C.amber   },
    { pct: 0.10, color: C.red     },
  ]
  let angle = -Math.PI / 2
  const paths: string[] = []
  for (const s of slices) {
    const start = angle
    const end   = angle + s.pct * 2 * Math.PI
    const x1 = cx + r * Math.cos(start)
    const y1 = cy + r * Math.sin(start)
    const x2 = cx + r * Math.cos(end)
    const y2 = cy + r * Math.sin(end)
    const large = s.pct > 0.5 ? 1 : 0
    paths.push(`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`)
    angle = end
  }
  return (
    <Preview>
      {paths.map((d, i) => (
        <path key={i} d={d} fill={slices[i].color} fillOpacity="0.85"
          stroke={C.bg} strokeWidth="1.5" />
      ))}
      {/* Donut hole */}
      <circle cx={cx} cy={cy} r={14} fill={C.bg} />
    </Preview>
  )
}

function StackedBarPreview() {
  const cols = [
    { x: 20,  bom: 30, mid: 15, bad: 10 },
    { x: 68,  bom: 20, mid: 20, bad: 5  },
    { x: 116, bom: 40, mid: 10, bad: 8  },
    { x: 164, bom: 15, mid: 25, bad: 15 },
  ]
  return (
    <Preview>
      <line x1="8" y1="72" x2="232" y2="72" stroke={C.dim} strokeWidth="1" />
      {cols.map((c) => {
        const baseY = 72
        return (
          <g key={c.x}>
            <rect x={c.x} y={baseY - c.bom - c.mid - c.bad} width="40" height={c.bad}
              rx="0" fill={C.red}    fillOpacity="0.8" />
            <rect x={c.x} y={baseY - c.bom - c.mid} width="40" height={c.mid}
              fill={C.amber}  fillOpacity="0.8" />
            <rect x={c.x} y={baseY - c.bom} width="40" height={c.bom}
              rx="0" fill={C.emerald} fillOpacity="0.8" />
          </g>
        )
      })}
    </Preview>
  )
}

function CalendarPreview() {
  const cells = []
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 7; col++) {
      const x = 12 + col * 32
      const y = 16 + row * 12
      const isToday = row === 2 && col === 4
      cells.push({ x, y, isToday })
    }
  }
  return (
    <Preview>
      {/* Day headers */}
      {['D','S','T','Q','Q','S','S'].map((d, i) => (
        <text key={d+i} x={16 + i * 32} y={10} textAnchor="middle"
          fill={C.dim} fontSize="6" fontFamily="monospace">{d}</text>
      ))}
      {cells.map((c, i) => (
        <rect key={i} x={c.x - 10} y={c.y} width="20" height="8" rx="2"
          fill={c.isToday ? C.emerald : C.muted}
          fillOpacity={c.isToday ? 0.9 : 0.6} />
      ))}
    </Preview>
  )
}

function AlertsPreview() {
  return (
    <Preview>
      {[
        { y: 8,  color: C.red,    w: 180 },
        { y: 28, color: C.amber,  w: 120 },
        { y: 48, color: C.blue,   w: 150 },
      ].map((a) => (
        <g key={a.y}>
          <rect x="8" y={a.y} width="224" height="18" rx="4"
            fill={`${a.color}18`} stroke={`${a.color}30`} strokeWidth="1" />
          <circle cx="22" cy={a.y + 9} r="4" fill={a.color} />
          <rect x="34" y={a.y + 5} width={a.w} height="6" rx="2"
            fill={a.color} fillOpacity="0.4" />
        </g>
      ))}
    </Preview>
  )
}

function DividerPreview() {
  return (
    <Preview>
      <line x1="20" y1="40" x2="220" y2="40" stroke={C.emerald}
        strokeWidth="1.5" strokeDasharray="4 3" />
      <rect x="96" y="33" width="48" height="14" rx="3" fill={C.bg} />
      <rect x="100" y="36" width="40" height="8" rx="2" fill={C.muted} />
    </Preview>
  )
}

function WeatherPreview() {
  return (
    <Preview>
      {/* Sun */}
      <circle cx="80" cy="35" r="18" fill="#fbbf2430" stroke="#fbbf24" strokeWidth="1.5" />
      <circle cx="80" cy="35" r="10" fill="#fbbf2460" />
      {/* Rays */}
      {[0,45,90,135,180,225,270,315].map((deg, i) => {
        const r = Math.PI * deg / 180
        const x1 = 80 + 14 * Math.cos(r), y1 = 35 + 14 * Math.sin(r)
        const x2 = 80 + 20 * Math.cos(r), y2 = 35 + 20 * Math.sin(r)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
      })}
      {/* Temp */}
      <text x="136" y="30" fontSize="22" fontFamily="monospace" fill="white" fontWeight="bold">23°</text>
      {/* Desc */}
      <rect x="128" y="38" width="70" height="8" rx="2" fill={C.muted} />
      {/* Stats row */}
      <rect x="16" y="60" width="208" height="14" rx="3" fill={C.muted} />
      <rect x="22" y="64" width="44" height="6" rx="2" fill={C.dim} />
      <rect x="98" y="64" width="44" height="6" rx="2" fill={C.dim} />
      <rect x="174" y="64" width="44" height="6" rx="2" fill={C.dim} />
    </Preview>
  )
}

function GenericPreview() {
  return (
    <Preview>
      <rect x="16" y="16" width="208" height="48" rx="6" fill={C.muted} />
      <text x="120" y="45" textAnchor="middle" fill={C.dim}
        fontSize="12" fontFamily="monospace">⊞</text>
    </Preview>
  )
}

// ── Public map: widgetId → preview component ─────────────────────────────
const PREVIEW_MAP: Record<string, () => JSX.Element> = {
  tickets_open_kpis:    KpiCards,
  assets_kpis:          KpiCards,
  tickets_my:           ListRows,
  tickets_recent:       ListRows,
  assets_low_stock:     ListRows,
  assets_movements:     ListRows,
  messages_recent:      ListRows,
  purchases_pending:    ListRows,
  tickets_weekly_chart: LineChartPreview,
  tickets_tech_chart:   BarHorizontalPreview,
  assets_dept_chart:    StackedBarPreview,
  system_alerts:        AlertsPreview,
  calendar:             CalendarPreview,
  divider:              DividerPreview,
  weather:              WeatherPreview,
}

export function WidgetPreview({ widgetId }: { widgetId: string }) {
  const Comp = PREVIEW_MAP[widgetId] ?? GenericPreview
  return <Comp />
}
