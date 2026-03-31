'use client'

import Link from 'next/link'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeakAsset {
  id: string
  tag: string
  name: string
  cpuModel: string | null
  ramGb: number | null
  storageGb: number | null
  performanceScore: number | null
  performanceLabel: string | null
  location: string | null
  assignedToUser: { name: string } | null
  category: { name: string }
}

interface ReportsClientProps {
  ticketsByStatus: { status: string; count: number }[]
  ticketsByPriority: { priority: string; count: number }[]
  ticketsByCategory: { name: string; count: number }[]
  assetsByStatus: { status: string; count: number }[]
  assetsByPerformance: { label: string; count: number }[]
  thisMonthCount: number
  lastMonthCount: number
  trend: { month: string; criados: number; resolvidos: number }[]
  techActivity: { name: string; count: number }[]
  auxActivity: { name: string; count: number }[]
  weakAssets: WeakAsset[]
  totalAssets: number
  totalMovements: number
}

// ─── Color maps ───────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#38bdf8', IN_PROGRESS: '#f59e0b', ON_HOLD: '#a78bfa',
  DONE: '#34d399', CANCELED: '#64748b',
}
const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Aberto', IN_PROGRESS: 'Em atendimento', ON_HOLD: 'Aguardando',
  DONE: 'Concluído', CANCELED: 'Cancelado',
}
const PRIORITY_COLORS: Record<string, string> = {
  URGENT: '#f87171', HIGH: '#fb923c', MEDIUM: '#fbbf24', LOW: '#475569',
}
const PRIORITY_LABELS: Record<string, string> = {
  URGENT: 'Urgente', HIGH: 'Alta', MEDIUM: 'Média', LOW: 'Baixa',
}
const ASSET_STATUS_COLORS: Record<string, string> = {
  STOCK: '#38bdf8', DEPLOYED: '#34d399', MAINTENANCE: '#f59e0b',
  DISCARDED: '#64748b', LOANED: '#a78bfa',
}
const ASSET_STATUS_LABELS: Record<string, string> = {
  STOCK: 'Estoque', DEPLOYED: 'Implantado', MAINTENANCE: 'Manutenção',
  DISCARDED: 'Descartado', LOANED: 'Emprestado',
}
const PERF_COLORS: Record<string, string> = {
  BOM: '#34d399', INTERMEDIARIO: '#f59e0b', RUIM: '#f87171',
}
const PERF_LABELS: Record<string, string> = {
  BOM: 'Bom', INTERMEDIARIO: 'Intermediário', RUIM: 'Ruim',
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#0a1628',
      border: '1px solid rgba(0,217,184,0.2)',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 12,
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      {label && <p style={{ color: '#4a6580', marginBottom: 6 }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? '#e2eaf4', fontWeight: 600 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

// ─── Section separator ────────────────────────────────────────────────────────

function SectionDivider() {
  return (
    <div style={{
      height: 1,
      background: 'linear-gradient(90deg, rgba(0,217,184,0.15) 0%, rgba(0,217,184,0.04) 60%, transparent 100%)',
      margin: '4px 0',
    }} />
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.12em',
      color: '#00d9b8',
      marginBottom: 16,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      <span style={{ opacity: 0.4 }}>──</span>
      {children}
    </p>
  )
}

// ─── Donut center label ───────────────────────────────────────────────────────

function DonutLabel({ total }: { total: number }) {
  return (
    <text
      x="50%" y="50%"
      textAnchor="middle" dominantBaseline="central"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      <tspan x="50%" dy="-6" style={{ fontSize: 22, fontWeight: 700, fill: '#e2eaf4' }}>
        {total}
      </tspan>
      <tspan x="50%" dy="18" style={{ fontSize: 10, fill: '#4a6580' }}>total</tspan>
    </text>
  )
}

// ─── Score bar ────────────────────────────────────────────────────────────────

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = label === 'RUIM' ? '#f87171' : label === 'INTERMEDIARIO' ? '#f59e0b' : '#34d399'
  const pct = Math.max(0, Math.min(100, score))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        flex: 1, height: 5, background: 'rgba(255,255,255,0.06)',
        borderRadius: 3, overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 3,
          background: `linear-gradient(90deg, ${color}80, ${color})`,
          transition: 'width 0.6s ease',
        }} />
      </div>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10, fontWeight: 700, color, minWidth: 26, textAlign: 'right',
      }}>{score}</span>
    </div>
  )
}

// ─── Performance quality card ─────────────────────────────────────────────────

function PerfCard({ label, count, total }: { label: string; count: number; total: number }) {
  const color = PERF_COLORS[label] ?? '#64748b'
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div style={{
      background: '#0d1422',
      border: `1px solid ${color}22`,
      borderRadius: 10,
      padding: '16px 20px',
      flex: 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
          color,
          background: `${color}15`,
          border: `1px solid ${color}30`,
          borderRadius: 4, padding: '2px 7px',
        }}>
          {PERF_LABELS[label] ?? label}
        </span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11, color: '#4a6580',
        }}>{pct}%</span>
      </div>
      <p style={{ fontSize: 32, fontWeight: 700, color: '#e2eaf4', lineHeight: 1, marginBottom: 8 }}>{count}</p>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 2,
          background: `linear-gradient(90deg, ${color}50, ${color})`,
        }} />
      </div>
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  title, value, sub, accent, glow,
}: {
  title: string
  value: number
  sub?: React.ReactNode
  accent?: string
  glow?: boolean
}) {
  const color = accent ?? '#00d9b8'
  return (
    <div style={{
      background: '#0d1422',
      border: `1px solid ${glow ? color + '30' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 12,
      padding: '20px 24px',
      boxShadow: glow ? `0 0 24px ${color}12` : undefined,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${color}60, transparent)`,
      }} />
      <p style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
        color: '#4a6580', marginBottom: 10,
      }}>
        {title.toUpperCase()}
      </p>
      <p style={{ fontSize: 38, fontWeight: 700, color: '#e2eaf4', lineHeight: 1, marginBottom: 6 }}>
        {value}
      </p>
      {sub && <div style={{ fontSize: 12, color: '#4a6580' }}>{sub}</div>}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ReportsClient({
  ticketsByStatus,
  ticketsByPriority,
  ticketsByCategory,
  assetsByStatus,
  assetsByPerformance,
  thisMonthCount,
  lastMonthCount,
  trend,
  techActivity,
  auxActivity,
  weakAssets,
  totalAssets,
  totalMovements,
}: ReportsClientProps) {
  const openTickets = ticketsByStatus.find((s) => s.status === 'OPEN')?.count ?? 0
  const weakCount = weakAssets.filter((a) => a.performanceLabel === 'RUIM').length
  const delta = lastMonthCount > 0
    ? Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100)
    : null
  const perfTotal = assetsByPerformance.reduce((acc, p) => acc + p.count, 0)
  const recommendations = weakAssets

  // Bar chart data for categories (add gradient defs)
  const categoryData = ticketsByCategory.map((c) => ({ name: c.name, count: c.count }))

  return (
    <div style={{
      width: '100%',
      display: 'flex', flexDirection: 'column', gap: 32,
      color: '#e2eaf4',
    }}>

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div>
        <p style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
          color: '#4a6580', marginBottom: 10,
        }}>
          SISTEMA / RELATÓRIOS
        </p>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.01em', lineHeight: 1 }}>
          Relatórios
        </h1>
        <p style={{ fontSize: 14, color: '#3d5068', marginTop: 8 }}>
          Visão consolidada do sistema — chamados, patrimônio e desempenho da equipe
        </p>
      </div>

      <SectionDivider />

      {/* ── KPI Strip ──────────────────────────────────────────────────────── */}
      <section>
        <SectionTitle>INDICADORES DO MÊS</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <KpiCard
            title="Chamados no mês"
            value={thisMonthCount}
            accent="#00d9b8"
            sub={
              delta !== null ? (
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                  color: delta >= 0 ? '#34d399' : '#f87171',
                }}>
                  {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}% vs mês anterior
                </span>
              ) : (
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#4a6580' }}>
                  sem dados anteriores
                </span>
              )
            }
          />
          <KpiCard
            title="Chamados em aberto"
            value={openTickets}
            accent="#38bdf8"
            glow
            sub={
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#38bdf8' }}>
                aguardando atendimento
              </span>
            }
          />
          <KpiCard
            title="Total de ativos"
            value={totalAssets}
            accent="#a78bfa"
            sub={
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#4a6580' }}>
                {totalMovements} movimentações no mês
              </span>
            }
          />
          <KpiCard
            title="Ativos com problemas"
            value={weakCount}
            accent="#f87171"
            glow={weakCount > 0}
            sub={
              weakCount > 0 ? (
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#f87171' }}>
                  classificados como RUIM
                </span>
              ) : (
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#34d399' }}>
                  parque em boas condições
                </span>
              )
            }
          />
        </div>
      </section>

      <SectionDivider />

      {/* ── Trend area chart ───────────────────────────────────────────────── */}
      <section>
        <SectionTitle>EVOLUÇÃO DOS CHAMADOS</SectionTitle>
        <div style={{
          background: '#0d1422',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12, padding: '20px 20px 8px',
        }}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#3d5068', fontFamily: "'JetBrains Mono', monospace" }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#3d5068', fontFamily: "'JetBrains Mono', monospace" }}
                axisLine={false} tickLine={false} allowDecimals={false}
              />
              <Tooltip content={<DarkTooltip />} />
              <Legend
                wrapperStyle={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11, color: '#4a6580', paddingTop: 8,
                }}
              />
              <Line
                type="monotone" dataKey="criados" name="Criados"
                stroke="#38bdf8" strokeWidth={2}
                dot={false} activeDot={{ r: 4, fill: '#38bdf8' }}
              />
              <Line
                type="monotone" dataKey="resolvidos" name="Resolvidos"
                stroke="#34d399" strokeWidth={2}
                dot={false} activeDot={{ r: 4, fill: '#34d399' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ── Status + Priority donuts ────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Status donut */}
        <div style={{
          background: '#0d1422',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12, padding: '20px',
        }}>
          <SectionTitle>CHAMADOS POR STATUS</SectionTitle>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ flexShrink: 0 }}>
              <PieChart width={200} height={200}>
                <Pie
                  data={ticketsByStatus.map((s) => ({
                    name: STATUS_LABELS[s.status] ?? s.status,
                    value: s.count,
                    fill: STATUS_COLORS[s.status] ?? '#64748b',
                  }))}
                  cx={100} cy={100}
                  innerRadius={55} outerRadius={85}
                  dataKey="value" paddingAngle={2} strokeWidth={0}
                >
                  {ticketsByStatus.map((s, i) => (
                    <Cell key={i} fill={STATUS_COLORS[s.status] ?? '#64748b'} />
                  ))}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
                <DonutLabel total={ticketsByStatus.reduce((a, s) => a + s.count, 0)} />
              </PieChart>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ticketsByStatus.map((s) => (
                <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: STATUS_COLORS[s.status] ?? '#64748b',
                    boxShadow: `0 0 6px ${STATUS_COLORS[s.status] ?? '#64748b'}60`,
                  }} />
                  <span style={{ flex: 1, fontSize: 12, color: '#94a3b8' }}>
                    {STATUS_LABELS[s.status] ?? s.status}
                  </span>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12, fontWeight: 700,
                    color: STATUS_COLORS[s.status] ?? '#64748b',
                  }}>
                    {s.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Priority donut */}
        <div style={{
          background: '#0d1422',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12, padding: '20px',
        }}>
          <SectionTitle>CHAMADOS POR PRIORIDADE</SectionTitle>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ flexShrink: 0 }}>
              <PieChart width={200} height={200}>
                <Pie
                  data={ticketsByPriority.map((p) => ({
                    name: PRIORITY_LABELS[p.priority] ?? p.priority,
                    value: p.count,
                    fill: PRIORITY_COLORS[p.priority] ?? '#64748b',
                  }))}
                  cx={100} cy={100}
                  innerRadius={55} outerRadius={85}
                  dataKey="value" paddingAngle={2} strokeWidth={0}
                >
                  {ticketsByPriority.map((p, i) => (
                    <Cell key={i} fill={PRIORITY_COLORS[p.priority] ?? '#64748b'} />
                  ))}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
                <DonutLabel total={ticketsByPriority.reduce((a, p) => a + p.count, 0)} />
              </PieChart>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ticketsByPriority.map((p) => (
                <div key={p.priority} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: PRIORITY_COLORS[p.priority] ?? '#64748b',
                    boxShadow: `0 0 6px ${PRIORITY_COLORS[p.priority] ?? '#64748b'}60`,
                  }} />
                  <span style={{ flex: 1, fontSize: 12, color: '#94a3b8' }}>
                    {PRIORITY_LABELS[p.priority] ?? p.priority}
                  </span>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12, fontWeight: 700,
                    color: PRIORITY_COLORS[p.priority] ?? '#64748b',
                  }}>
                    {p.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <SectionDivider />

      {/* ── Team activity ──────────────────────────────────────────────────── */}
      <section>
        <SectionTitle>ATIVIDADE DA EQUIPE</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Técnicos */}
          <div style={{
            background: '#0d1422',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: '20px',
          }}>
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
              color: '#4a6580', marginBottom: 14,
            }}>TÉCNICOS MAIS ATIVOS</p>
            {techActivity.length === 0 ? (
              <p style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12, color: '#2d4060',
                padding: '24px 0', textAlign: 'center',
              }}>— sem dados —</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(180, techActivity.length * 36 + 20)}>
                <BarChart data={techActivity} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category" dataKey="name" width={130}
                    tick={{ fontSize: 11, fill: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}
                    axisLine={false} tickLine={false}
                  />
                  <Tooltip content={<DarkTooltip />} />
                  <Bar dataKey="count" name="Eventos" fill="#38bdf8" radius={[0, 4, 4, 0]} label={{
                    position: 'right', fill: '#38bdf8',
                    fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                  }} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Auxiliares */}
          <div style={{
            background: '#0d1422',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: '20px',
          }}>
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
              color: '#4a6580', marginBottom: 14,
            }}>AUXILIARES MAIS ATIVOS</p>
            {auxActivity.length === 0 ? (
              <p style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12, color: '#2d4060',
                padding: '24px 0', textAlign: 'center',
              }}>— sem dados —</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(180, auxActivity.length * 36 + 20)}>
                <BarChart data={auxActivity} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category" dataKey="name" width={130}
                    tick={{ fontSize: 11, fill: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}
                    axisLine={false} tickLine={false}
                  />
                  <Tooltip content={<DarkTooltip />} />
                  <Bar dataKey="count" name="Eventos" fill="#a78bfa" radius={[0, 4, 4, 0]} label={{
                    position: 'right', fill: '#a78bfa',
                    fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                  }} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ── Top categories ─────────────────────────────────────────────────── */}
      <section>
        <SectionTitle>TOP CATEGORIAS DE CHAMADO</SectionTitle>
        <div style={{
          background: '#0d1422',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12, padding: '20px',
        }}>
          {categoryData.length === 0 ? (
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12, color: '#2d4060',
              padding: '24px 0', textAlign: 'center',
            }}>— sem dados —</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(200, categoryData.length * 36 + 40)}>
              <BarChart data={categoryData} layout="vertical" margin={{ left: 0, right: 50, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category" dataKey="name" width={200}
                  tick={{ fontSize: 12, fill: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="count" name="Chamados" fill="#00d9b8" radius={[0, 4, 4, 0]} label={{
                  position: 'right', fill: '#00d9b8',
                  fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <SectionDivider />

      {/* ── Patrimônio section ─────────────────────────────────────────────── */}
      <section>
        <SectionTitle>PATRIMÔNIO</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, alignItems: 'start' }}>
          {/* Asset status donut */}
          <div style={{
            background: '#0d1422',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: '20px',
          }}>
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
              color: '#4a6580', marginBottom: 12,
            }}>ATIVOS POR STATUS</p>
            <PieChart width={220} height={180}>
              <Pie
                data={assetsByStatus.map((a) => ({
                  name: ASSET_STATUS_LABELS[a.status] ?? a.status,
                  value: a.count,
                }))}
                cx={110} cy={90}
                innerRadius={50} outerRadius={78}
                dataKey="value" paddingAngle={2} strokeWidth={0}
              >
                {assetsByStatus.map((a, i) => (
                  <Cell key={i} fill={ASSET_STATUS_COLORS[a.status] ?? '#64748b'} />
                ))}
              </Pie>
              <Tooltip content={<DarkTooltip />} />
              <DonutLabel total={totalAssets} />
            </PieChart>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {assetsByStatus.map((a) => (
                <div key={a.status} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: ASSET_STATUS_COLORS[a.status] ?? '#64748b',
                  }} />
                  <span style={{ flex: 1, fontSize: 11, color: '#64748b' }}>
                    {ASSET_STATUS_LABELS[a.status] ?? a.status}
                  </span>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11, fontWeight: 700,
                    color: ASSET_STATUS_COLORS[a.status] ?? '#64748b',
                  }}>{a.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Performance quality cards */}
          <div style={{
            background: '#0d1422',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: '20px',
          }}>
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
              color: '#4a6580', marginBottom: 16,
            }}>QUALIDADE DO PARQUE DE MÁQUINAS</p>
            <div style={{ display: 'flex', gap: 12 }}>
              {['BOM', 'INTERMEDIARIO', 'RUIM'].map((lbl) => {
                const found = assetsByPerformance.find((p) => p.label === lbl)
                return (
                  <PerfCard
                    key={lbl}
                    label={lbl}
                    count={found?.count ?? 0}
                    total={perfTotal}
                  />
                )
              })}
            </div>
            {perfTotal === 0 && (
              <p style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12, color: '#2d4060', marginTop: 12,
              }}>
                Nenhum ativo com specs cadastradas ainda.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Recommendations ────────────────────────────────────────────────── */}
      {recommendations.length > 0 && (
        <>
          <SectionDivider />
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{
                fontSize: 16, lineHeight: 1,
                filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.6))',
              }}>⚠</span>
              <SectionTitle>RECOMENDAÇÕES DO SISTEMA</SectionTitle>
            </div>
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11, color: '#4a6580', marginBottom: 20, marginTop: -8,
            }}>
              equipamentos abaixo do desempenho mínimo recomendado
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recommendations.map((asset) => {
                const isRuim = asset.performanceLabel === 'RUIM'
                const isInter = asset.performanceLabel === 'INTERMEDIARIO'
                const accentColor = isRuim ? '#f87171' : '#f59e0b'
                const score = asset.performanceScore ?? 0
                const urgencyText = isRuim && score < 30
                  ? 'Substituição urgente recomendada'
                  : isRuim
                  ? 'Substituição recomendada'
                  : 'Upgrade de componentes recomendado'
                const subRecs: string[] = []
                if ((asset.ramGb ?? 0) < 8) subRecs.push('• Memória insuficiente para uso moderno')
                if ((asset.storageGb ?? 999) < 128) subRecs.push('• Armazenamento abaixo do mínimo')
                if (!asset.cpuModel) subRecs.push('• Dados de CPU não cadastrados')

                return (
                  <div key={asset.id} style={{
                    display: 'flex',
                    background: isRuim ? 'rgba(248,113,113,0.04)' : 'rgba(245,158,11,0.04)',
                    border: `1px solid ${accentColor}20`,
                    borderRadius: 10,
                    overflow: 'hidden',
                  }}>
                    {/* Left accent bar */}
                    <div style={{
                      width: 4, flexShrink: 0,
                      background: `linear-gradient(180deg, ${accentColor}, ${accentColor}60)`,
                    }} />

                    <div style={{ flex: 1, padding: '16px 18px', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                      {/* Main info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <span style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 12, fontWeight: 700, color: accentColor,
                          }}>
                            {asset.tag}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#e2eaf4' }}>
                            {asset.name}
                          </span>
                          <span style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 9, color: '#4a6580',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: 3, padding: '1px 6px',
                          }}>
                            {asset.category.name}
                          </span>
                        </div>

                        {/* Spec badges */}
                        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                          {asset.cpuModel && (
                            <span style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 10, color: '#64748b',
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.07)',
                              borderRadius: 4, padding: '2px 8px',
                            }}>
                              CPU: {asset.cpuModel}
                            </span>
                          )}
                          {asset.ramGb != null && (
                            <span style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 10,
                              color: (asset.ramGb ?? 0) < 8 ? '#f87171' : '#64748b',
                              background: 'rgba(255,255,255,0.04)',
                              border: `1px solid ${(asset.ramGb ?? 0) < 8 ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.07)'}`,
                              borderRadius: 4, padding: '2px 8px',
                            }}>
                              RAM: {asset.ramGb}GB
                            </span>
                          )}
                          {asset.storageGb != null && (
                            <span style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 10,
                              color: (asset.storageGb ?? 999) < 128 ? '#f87171' : '#64748b',
                              background: 'rgba(255,255,255,0.04)',
                              border: `1px solid ${(asset.storageGb ?? 999) < 128 ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.07)'}`,
                              borderRadius: 4, padding: '2px 8px',
                            }}>
                              {asset.storageGb}GB storage
                            </span>
                          )}
                        </div>

                        {/* Score bar */}
                        <div style={{ marginBottom: 8 }}>
                          <ScoreBar score={score} label={asset.performanceLabel ?? ''} />
                        </div>

                        {/* User + location */}
                        <p style={{
                          fontSize: 11, color: '#4a6580',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}>
                          Usuário: {asset.assignedToUser?.name ?? '—'}
                          {asset.location ? ` · Local: ${asset.location}` : ''}
                        </p>

                        {/* Sub-recommendations */}
                        {subRecs.length > 0 && (
                          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {subRecs.map((r, i) => (
                              <p key={i} style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 10, color: '#f87171', opacity: 0.8,
                              }}>{r}</p>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: urgency badge + link */}
                      <div style={{
                        flexShrink: 0, display: 'flex', flexDirection: 'column',
                        alignItems: 'flex-end', gap: 10, minWidth: 180,
                      }}>
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                          color: accentColor,
                          background: `${accentColor}15`,
                          border: `1px solid ${accentColor}30`,
                          borderRadius: 4, padding: '3px 8px',
                        }}>
                          {isRuim && score < 30 ? 'URGENTE' : isRuim ? 'ATENÇÃO' : 'MELHORIA'}
                        </span>
                        <p style={{
                          fontSize: 12, color: '#94a3b8',
                          textAlign: 'right', lineHeight: 1.4, maxWidth: 180,
                        }}>
                          {urgencyText}
                        </p>
                        <Link
                          href={`/assets/${asset.id}`}
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 11, color: '#00d9b8',
                            textDecoration: 'none',
                            background: 'rgba(0,217,184,0.08)',
                            border: '1px solid rgba(0,217,184,0.2)',
                            borderRadius: 5, padding: '5px 12px',
                            marginTop: 4, display: 'inline-block',
                          }}
                        >
                          Ver ativo →
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </>
      )}

    </div>
  )
}
