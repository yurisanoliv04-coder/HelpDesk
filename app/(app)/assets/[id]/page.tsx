import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight, ArrowLeft, ArrowLeftRight, Repeat2,
  Wrench, CheckCircle2, Trash2, Share2, CornerDownLeft,
  User, MapPin, Hash, Calendar, Shield, Cpu, HardDrive,
  MemoryStick, Activity, type LucideProps,
} from 'lucide-react'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import AssetTabBar from '@/components/assets/AssetTabBar'
import { PaginationBar } from '@/components/ui/PaginationBar'

const HIST_PAGE_SIZE = 20
import AssetEditPanel from '@/components/assets/AssetEditPanel'
import AssetNotesPanel from '@/components/assets/AssetNotesPanel'
import AssetFilesPanel from '@/components/assets/AssetFilesPanel'
import AssetQuickActions from '@/components/assets/AssetQuickActions'
import { format, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ─── Config maps ──────────────────────────────────────────────────────────────
const statusConfig: Record<string, {
  label: string; color: string; bg: string; border: string
  glow: string; dot: string
}> = {
  STOCK:       { label: 'Estoque',    color: '#94a3b8', bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.25)', glow: 'rgba(148,163,184,0.12)', dot: '#94a3b8' },
  DEPLOYED:    { label: 'Implantado', color: '#34d399', bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.30)',  glow: 'rgba(52,211,153,0.10)',  dot: '#34d399' },
  MAINTENANCE: { label: 'Manutenção', color: '#fbbf24', bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.30)',  glow: 'rgba(251,191,36,0.10)',  dot: '#fbbf24' },
  DISCARDED:   { label: 'Descartado', color: '#f87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.30)', glow: 'rgba(248,113,113,0.08)', dot: '#f87171' },
  LOANED:      { label: 'Emprestado', color: '#38bdf8', bg: 'rgba(56,189,248,0.10)',  border: 'rgba(56,189,248,0.30)',  glow: 'rgba(56,189,248,0.08)',  dot: '#38bdf8' },
  IRREGULAR:   { label: 'Irregular',  color: '#f97316', bg: 'rgba(249,115,22,0.10)',  border: 'rgba(249,115,22,0.30)',  glow: 'rgba(249,115,22,0.08)',  dot: '#f97316' },
}

const movementCfg: Record<string, {
  label: string; color: string; borderColor: string; bg: string
  Icon: React.ComponentType<LucideProps>
}> = {
  CREATED:     { label: 'Cadastrado',              color: '#a78bfa', borderColor: 'rgba(167,139,250,0.4)', bg: 'rgba(167,139,250,0.08)', Icon: CheckCircle2   },
  CHECK_IN:    { label: 'Retorno ao estoque',       color: '#94a3b8', borderColor: 'rgba(148,163,184,0.4)', bg: 'rgba(148,163,184,0.06)', Icon: ArrowLeft      },
  CHECK_OUT:   { label: 'Retirada / Alocação',      color: '#34d399', borderColor: 'rgba(52,211,153,0.4)',  bg: 'rgba(52,211,153,0.07)',  Icon: ArrowRight     },
  TRANSFER:    { label: 'Transferência',            color: '#38bdf8', borderColor: 'rgba(56,189,248,0.4)',  bg: 'rgba(56,189,248,0.07)',  Icon: ArrowLeftRight },
  SWAP:        { label: 'Troca',                    color: '#a78bfa', borderColor: 'rgba(167,139,250,0.4)', bg: 'rgba(167,139,250,0.07)', Icon: Repeat2        },
  MAINT_START: { label: 'Enviado p/ manutenção',   color: '#fbbf24', borderColor: 'rgba(251,191,36,0.4)',  bg: 'rgba(251,191,36,0.07)',  Icon: Wrench         },
  MAINT_END:   { label: 'Retorno de manutenção',   color: '#34d399', borderColor: 'rgba(52,211,153,0.4)',  bg: 'rgba(52,211,153,0.07)',  Icon: CheckCircle2   },
  DISCARD:     { label: 'Descartado',               color: '#f87171', borderColor: 'rgba(248,113,113,0.4)', bg: 'rgba(248,113,113,0.07)', Icon: Trash2         },
  LOAN:        { label: 'Empréstimo',               color: '#38bdf8', borderColor: 'rgba(56,189,248,0.4)',  bg: 'rgba(56,189,248,0.07)',  Icon: Share2         },
  RETURN:      { label: 'Devolução',                color: '#f87171', borderColor: 'rgba(248,113,113,0.4)', bg: 'rgba(248,113,113,0.07)', Icon: CornerDownLeft },
  UPDATE:      { label: 'Atualização',              color: '#64748b', borderColor: 'rgba(100,116,139,0.4)', bg: 'rgba(100,116,139,0.06)', Icon: Activity       },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(d: Date | null | undefined) {
  if (!d) return '—'
  return format(d, 'dd/MM/yyyy', { locale: ptBR })
}
function fmtFull(d: Date) {
  return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

const perfColors: Record<string, { color: string; bg: string; border: string }> = {
  RUIM:          { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)' },
  INTERMEDIARIO: { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.25)'  },
  BOM:           { color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.25)'  },
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function AssetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string; page?: string }>
}) {
  const session = await auth()
  if (session?.user.role === 'COLABORADOR' || session?.user.role === 'AUXILIAR_TI') redirect('/dashboard')

  const { id } = await params
  const { tab: rawTab, page: rawPage } = await searchParams
  const histPage = Math.max(1, parseInt(rawPage ?? '1', 10) || 1)
  const VALID_TABS = ['geral', 'historico', 'notas', 'arquivos'] as const
  type TabKey = typeof VALID_TABS[number]
  const activeTab: TabKey = VALID_TABS.includes(rawTab as TabKey) ? (rawTab as TabKey) : 'geral'

  const canEdit = session?.user.role === 'TECNICO' || session?.user.role === 'ADMIN'
  const isAdmin = session?.user.role === 'ADMIN'

  const [asset, activeUsers] = await Promise.all([
    prisma.asset.findUnique({
      where: { id },
      include: {
        category: true,
        assignedToUser: { select: { id: true, name: true } },
        assetNotes: { select: { id: true } },
        assetFiles: { select: { id: true } },
        _count: { select: { movements: true } },
      },
    }),
    prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  if (!asset) notFound()

  const [movements, movementsTotal] = activeTab === 'historico'
    ? await Promise.all([
        prisma.assetMovement.findMany({
          where: { assetId: id },
          include: {
            fromUser: { select: { id: true, name: true } },
            toUser:   { select: { id: true, name: true } },
            actor:    { select: { id: true, name: true } },
            ticket:   { select: { id: true, code: true, title: true } },
            order:    { select: { id: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: HIST_PAGE_SIZE,
          skip: (histPage - 1) * HIST_PAGE_SIZE,
        }),
        prisma.assetMovement.count({ where: { assetId: id } }),
      ])
    : [null, 0]
  const histTotalPages = Math.ceil(movementsTotal / HIST_PAGE_SIZE)

  const notes = activeTab === 'notas'
    ? await prisma.assetNote.findMany({
        where: { assetId: id },
        include: { author: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      })
    : null

  const files = activeTab === 'arquivos'
    ? await prisma.assetFile.findMany({
        where: { assetId: id },
        include: { uploadedBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      })
    : null

  const sc = statusConfig[asset.status] ?? statusConfig.STOCK
  const notesCount = asset.assetNotes.length
  const filesCount = asset.assetFiles.length
  const warrantyExpired = asset.warrantyUntil ? isPast(new Date(asset.warrantyUntil)) : false
  const pc = asset.performanceLabel ? perfColors[asset.performanceLabel] : null

  // Hardware summary for header
  const hwParts: string[] = []
  if (asset.cpuBrand && asset.cpuModel) hwParts.push(`${asset.cpuBrand} ${asset.cpuModel}`)
  else if (asset.cpuModel) hwParts.push(asset.cpuModel)
  if (asset.ramGb) hwParts.push(`${asset.ramGb} GB RAM`)
  if (asset.storageGb && asset.storageType) hwParts.push(`${asset.storageGb} GB ${asset.storageType.replace('_', ' ')}`)

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Breadcrumb + Actions ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/assets" style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
            color: 'var(--text-dim)', textDecoration: 'none', letterSpacing: '0.08em',
            transition: 'color 0.15s',
          }}>
            PATRIMÔNIO
          </Link>
          <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>/</span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
            color: 'var(--accent-cyan)', letterSpacing: '0.08em',
          }}>
            {asset.tag}
          </span>
        </div>
        <AssetQuickActions
          assetId={asset.id}
          assetStatus={asset.status}
          assetName={asset.name}
          isAdmin={isAdmin}
          users={activeUsers}
          variant="detail"
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          HERO CARD — redesigned with visual hierarchy and status color
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${sc.border}`,
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: `0 0 40px ${sc.glow}`,
      }}>
        {/* Status accent bar */}
        <div style={{ height: 4, background: sc.color, opacity: 0.7 }} />

        <div style={{ padding: '28px 32px 24px' }}>
          {/* Top row: icon + identity + stats */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>

            {/* Category icon — status-tinted */}
            <div style={{
              width: 80, height: 80, borderRadius: 18, flexShrink: 0,
              background: sc.bg,
              border: `2px solid ${sc.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 20px ${sc.glow}`,
              position: 'relative',
            }}>
              <CategoryIcon name={asset.category.icon} size={34} color={sc.color} />
            </div>

            {/* Name + chips */}
            <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
              {/* Chips row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                {/* TAG */}
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
                  padding: '4px 12px', borderRadius: 6,
                  background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.22)',
                  color: '#38bdf8', letterSpacing: '0.05em',
                }}>
                  {asset.tag}
                </span>
                {/* STATUS */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 12px', borderRadius: 6,
                  background: sc.bg, border: `1px solid ${sc.border}`,
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700,
                  color: sc.color, letterSpacing: '0.04em',
                }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: sc.dot, boxShadow: `0 0 5px ${sc.dot}`,
                    display: 'inline-block',
                  }} />
                  {sc.label.toUpperCase()}
                </span>
                {/* CATEGORY */}
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                  padding: '4px 12px', borderRadius: 6,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--text-muted)',
                }}>
                  {asset.category.name}
                </span>
                {/* PERFORMANCE */}
                {pc && asset.performanceLabel && (
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700,
                    padding: '4px 12px', borderRadius: 6,
                    background: pc.bg, border: `1px solid ${pc.border}`,
                    color: pc.color,
                  }}>
                    ⚡ {asset.performanceScore}/100 — {
                      asset.performanceLabel === 'BOM' ? 'Bom' :
                      asset.performanceLabel === 'INTERMEDIARIO' ? 'Intermediário' : 'Ruim'
                    }
                  </span>
                )}
              </div>

              {/* Asset name */}
              <h1 style={{
                fontSize: 32, fontWeight: 800, color: 'var(--text-primary)',
                letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 6,
              }}>
                {asset.name}
              </h1>

              {/* Hardware summary line */}
              {hwParts.length > 0 && (
                <p style={{
                  fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Cpu size={13} color="var(--text-dim)" />
                  {hwParts.join('  ·  ')}
                </p>
              )}
            </div>

            {/* Quick stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
              {[
                { value: asset._count?.movements ?? 0, label: 'Movimentos', color: '#38bdf8', tab: 'historico' },
                { value: notesCount,                    label: 'Notas',      color: '#00d9b8', tab: 'notas'    },
                { value: filesCount,                    label: 'Arquivos',   color: '#a78bfa', tab: 'arquivos' },
              ].map(s => (
                <Link
                  key={s.label}
                  href={`/assets/${id}?tab=${s.tab}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 10, padding: '10px 16px', minWidth: 130,
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                >
                  <span style={{ fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums', minWidth: 30, textAlign: 'right' }}>
                    {s.value}
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.06em' }}>
                    {s.label.toUpperCase()}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* ── Divider ── */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '22px 0 20px' }} />

          {/* ── Meta info grid ── */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px 32px' }}>

            {/* Assigned user */}
            {asset.assignedToUser && (
              <MetaField
                Icon={User}
                label="Atribuído a"
                iconColor="#34d399"
              >
                <Link href={`/people/${asset.assignedToUser.id}`} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 15, fontWeight: 600, color: '#34d399',
                  textDecoration: 'none',
                }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#34d399',
                  }}>
                    {asset.assignedToUser.name.slice(0, 2).toUpperCase()}
                  </span>
                  {asset.assignedToUser.name}
                </Link>
              </MetaField>
            )}

            {/* Location */}
            {asset.location && (
              <MetaField Icon={MapPin} label="Localização" iconColor="#38bdf8">
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {asset.location}
                </span>
              </MetaField>
            )}

            {/* Serial number */}
            {asset.serialNumber && (
              <MetaField Icon={Hash} label="Nº de série" iconColor="#a78bfa">
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
                  {asset.serialNumber}
                </span>
              </MetaField>
            )}

            {/* Acquisition date */}
            {asset.acquisitionDate && (
              <MetaField Icon={Calendar} label="Aquisição" iconColor="#fbbf24">
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {fmt(asset.acquisitionDate)}
                </span>
              </MetaField>
            )}

            {/* Warranty */}
            {asset.warrantyUntil && (
              <MetaField Icon={Shield} label="Garantia" iconColor={warrantyExpired ? '#f87171' : '#34d399'}>
                <span style={{ fontSize: 15, fontWeight: 600, color: warrantyExpired ? '#f87171' : '#34d399' }}>
                  {fmt(asset.warrantyUntil)}
                  {warrantyExpired && (
                    <span style={{
                      marginLeft: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                      color: '#f87171', background: 'rgba(248,113,113,0.1)',
                      border: '1px solid rgba(248,113,113,0.25)', borderRadius: 4,
                      padding: '1px 6px', verticalAlign: 'middle',
                    }}>EXPIRADA</span>
                  )}
                </span>
              </MetaField>
            )}
          </div>
        </div>
      </div>

      {/* ── Tab Bar ──────────────────────────────────────────────────────────── */}
      <AssetTabBar
        assetId={id}
        activeTab={activeTab}
        counts={{ notas: notesCount, arquivos: filesCount }}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          TAB: GERAL
      ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'geral' && (
        <AssetEditPanel
          asset={{
            id: asset.id,
            name: asset.name,
            location: asset.location,
            serialNumber: asset.serialNumber,
            status: asset.status as 'STOCK' | 'DEPLOYED' | 'MAINTENANCE' | 'DISCARDED' | 'LOANED',
            notes: asset.notes,
            ramGb: asset.ramGb,
            storageType: asset.storageType as 'HDD' | 'SSD_SATA' | 'SSD_NVME' | null,
            storageGb: asset.storageGb,
            cpuBrand: asset.cpuBrand as 'INTEL' | 'AMD' | 'OTHER' | null,
            cpuModel: asset.cpuModel,
            cpuGeneration: asset.cpuGeneration,
            acquisitionCost: asset.acquisitionCost ? String(asset.acquisitionCost) : null,
            currentValue: asset.currentValue ? String(asset.currentValue) : null,
            acquisitionDate: asset.acquisitionDate ? asset.acquisitionDate.toISOString() : null,
            warrantyUntil: asset.warrantyUntil ? asset.warrantyUntil.toISOString() : null,
          }}
          canEdit={canEdit}
          performanceScore={asset.performanceScore}
          performanceLabel={asset.performanceLabel}
          performanceNotes={asset.performanceNotes}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB: HISTÓRICO — redesigned timeline
      ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'historico' && movements && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {movements.length === 0 && histPage === 1 ? (
            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 16, padding: '60px 24px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ArrowLeftRight size={22} color="var(--text-dim)" />
              </div>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--text-dim)' }}>
                Nenhuma movimentação registrada
              </p>
            </div>
          ) : (
            movements.map((mv, idx) => {
              const cfg = movementCfg[mv.type] ?? movementCfg.TRANSFER
              const { Icon, label, color, borderColor, bg } = cfg
              const isLast = idx === movements.length - 1

              return (
                <div key={mv.id} style={{ position: 'relative', paddingLeft: 48 }}>
                  {/* Timeline line */}
                  {!isLast && (
                    <div style={{
                      position: 'absolute', left: 18, top: 46, bottom: -10,
                      width: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 2,
                    }} />
                  )}
                  {/* Timeline dot */}
                  <div style={{
                    position: 'absolute', left: 0, top: 12,
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: bg, border: `1.5px solid ${borderColor}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 2px 12px ${bg}`,
                  }}>
                    <Icon size={16} color={color} />
                  </div>

                  {/* Card */}
                  <div style={{
                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    borderLeft: `3px solid ${color}`,
                    borderRadius: 12, padding: '16px 20px',
                    transition: 'border-color 0.15s',
                  }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
                          color, background: bg, border: `1px solid ${borderColor}`,
                          borderRadius: 6, padding: '3px 10px',
                        }}>
                          {label.toUpperCase()}
                        </span>
                        {/* Status transition */}
                        {(mv.fromStatus || mv.toStatus) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {mv.fromStatus && (
                              <span style={{
                                fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
                                color: statusConfig[mv.fromStatus]?.color ?? '#94a3b8',
                                padding: '2px 8px', borderRadius: 4,
                                background: statusConfig[mv.fromStatus]?.bg ?? 'rgba(255,255,255,0.04)',
                                border: `1px solid ${statusConfig[mv.fromStatus]?.border ?? 'rgba(255,255,255,0.1)'}`,
                              }}>
                                {statusConfig[mv.fromStatus]?.label ?? mv.fromStatus}
                              </span>
                            )}
                            {mv.fromStatus && mv.toStatus && (
                              <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>→</span>
                            )}
                            {mv.toStatus && (
                              <span style={{
                                fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
                                color: statusConfig[mv.toStatus]?.color ?? '#94a3b8',
                                padding: '2px 8px', borderRadius: 4,
                                background: statusConfig[mv.toStatus]?.bg ?? 'rgba(255,255,255,0.04)',
                                border: `1px solid ${statusConfig[mv.toStatus]?.border ?? 'rgba(255,255,255,0.1)'}`,
                              }}>
                                {statusConfig[mv.toStatus]?.label ?? mv.toStatus}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                        color: 'var(--text-dim)', letterSpacing: '0.04em',
                      }}>
                        {fmtFull(mv.createdAt)}
                      </span>
                    </div>

                    {/* People / locations */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px', marginBottom: mv.notes || mv.ticket || mv.order ? 10 : 0 }}>
                      {mv.fromUser && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.05em' }}>DE</span>
                          <Link href={`/people/${mv.fromUser.id}`} style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', textDecoration: 'none' }}>
                            {mv.fromUser.name}
                          </Link>
                        </div>
                      )}
                      {mv.toUser && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.05em' }}>PARA</span>
                          <Link href={`/people/${mv.toUser.id}`} style={{ fontSize: 13, fontWeight: 600, color, textDecoration: 'none' }}>
                            {mv.toUser.name}
                          </Link>
                        </div>
                      )}
                      {mv.fromLocation && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-dim)' }}>LOCAL DE</span>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{mv.fromLocation}</span>
                        </div>
                      )}
                      {mv.toLocation && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-dim)' }}>LOCAL PARA</span>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{mv.toLocation}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-dim)' }}>POR</span>
                        <Link href={`/people/${mv.actor.id}`} style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
                          {mv.actor.name}
                        </Link>
                      </div>
                    </div>

                    {/* Notes */}
                    {mv.notes && (
                      <div style={{
                        marginTop: 8, padding: '8px 12px', borderRadius: 7,
                        background: 'rgba(255,255,255,0.02)',
                        borderLeft: `2px solid ${borderColor}`,
                        fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.6,
                      }}>
                        {mv.notes}
                      </div>
                    )}

                    {/* Linked entities */}
                    {(mv.ticket || mv.order) && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        {mv.ticket && (
                          <Link href={`/tickets/${mv.ticket.id}`} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '4px 10px', borderRadius: 6,
                            background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.18)',
                            fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
                            color: '#38bdf8', textDecoration: 'none',
                          }}>
                            📋 CHAMADO {mv.ticket.code}
                          </Link>
                        )}
                        {mv.order && (
                          <Link href={`/movements/${mv.order.id}`} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '4px 10px', borderRadius: 6,
                            background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.18)',
                            fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
                            color: '#a78bfa', textDecoration: 'none',
                          }}>
                            📦 ORDEM DE MOVIMENTAÇÃO
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}

          {histTotalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-dim)' }}>
                Página {histPage} de {histTotalPages} · {movementsTotal} registro{movementsTotal !== 1 ? 's' : ''}
              </p>
              <PaginationBar
                page={histPage}
                totalPages={histTotalPages}
                buildHref={p => `/assets/${id}?tab=historico&page=${p}`}
              />
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB: NOTAS
      ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'notas' && notes !== null && (
        <AssetNotesPanel
          assetId={id}
          notes={notes.map(n => ({ ...n, createdAt: n.createdAt }))}
          currentUserId={session!.user.id}
          canEdit={canEdit}
          isAdmin={isAdmin}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB: ARQUIVOS
      ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'arquivos' && files !== null && (
        <AssetFilesPanel
          assetId={id}
          files={files.map(f => ({ ...f, createdAt: f.createdAt }))}
          currentUserId={session!.user.id}
          canEdit={canEdit}
          isAdmin={isAdmin}
        />
      )}

    </div>
  )
}

// ─── MetaField helper component ───────────────────────────────────────────────
function MetaField({
  Icon, label, iconColor, children,
}: {
  Icon: React.ComponentType<LucideProps>
  label: string
  iconColor: string
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 160 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: `${iconColor}14`,
        border: `1px solid ${iconColor}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={14} color={iconColor} />
      </div>
      <div>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 2 }}>
          {label.toUpperCase()}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
