import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight, ArrowLeft, ArrowLeftRight, Repeat2,
  Wrench, CheckCircle2, Trash2, Share2, CornerDownLeft,
  User, type LucideProps,
} from 'lucide-react'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import AssetTabBar from '@/components/assets/AssetTabBar'
import { PaginationBar } from '@/components/ui/PaginationBar'

const HIST_PAGE_SIZE = 20
import AssetEditPanel from '@/components/assets/AssetEditPanel'
import AssetNotesPanel from '@/components/assets/AssetNotesPanel'
import AssetFilesPanel from '@/components/assets/AssetFilesPanel'
import AssetQuickActions from '@/components/assets/AssetQuickActions'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ─── Config maps ──────────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  STOCK:       { label: 'Estoque',    color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' },
  DEPLOYED:    { label: 'Implantado', color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.2)'  },
  MAINTENANCE: { label: 'Manutenção', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.2)'  },
  DISCARDED:   { label: 'Descartado', color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)' },
  LOANED:      { label: 'Emprestado', color: '#38bdf8', bg: 'rgba(56,189,248,0.1)',  border: 'rgba(56,189,248,0.2)'  },
}
const movementCfg: Record<string, { label: string; color: string; borderColor: string; Icon: React.ComponentType<LucideProps> }> = {
  CHECK_IN:    { label: 'Retorno ao estoque',      color: '#94a3b8', borderColor: 'rgba(148,163,184,0.3)', Icon: ArrowLeft      },
  CHECK_OUT:   { label: 'Retirada / Alocação',     color: '#34d399', borderColor: 'rgba(52,211,153,0.3)',  Icon: ArrowRight     },
  TRANSFER:    { label: 'Transferência',           color: '#38bdf8', borderColor: 'rgba(56,189,248,0.3)',  Icon: ArrowLeftRight },
  SWAP:        { label: 'Troca',                   color: '#a78bfa', borderColor: 'rgba(167,139,250,0.3)', Icon: Repeat2        },
  MAINT_START: { label: 'Enviado p/ manutenção',  color: '#fbbf24', borderColor: 'rgba(251,191,36,0.3)',  Icon: Wrench         },
  MAINT_END:   { label: 'Retorno de manutenção',  color: '#34d399', borderColor: 'rgba(52,211,153,0.3)',  Icon: CheckCircle2   },
  DISCARD:     { label: 'Descartado',              color: '#f87171', borderColor: 'rgba(248,113,113,0.3)', Icon: Trash2         },
  LOAN:        { label: 'Empréstimo',              color: '#38bdf8', borderColor: 'rgba(56,189,248,0.3)',  Icon: Share2         },
  RETURN:      { label: 'Devolução',               color: '#f87171', borderColor: 'rgba(248,113,113,0.3)', Icon: CornerDownLeft },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(d: Date | null | undefined) {
  if (!d) return '—'
  return format(d, 'dd/MM/yyyy', { locale: ptBR })
}
function fmtFull(d: Date) {
  return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
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

  // ── Base query ─────────────────────────────────────────────────────────────
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

  // ── Tab-specific data ──────────────────────────────────────────────────────
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

  // ── Derived ────────────────────────────────────────────────────────────────
  const sc = statusConfig[asset.status] ?? statusConfig.STOCK
  const notesCount = asset.assetNotes.length
  const filesCount = asset.assetFiles.length

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link href="/assets" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060', textDecoration: 'none', letterSpacing: '0.1em' }}>
            PATRIMÔNIO
          </Link>
          <span style={{ color: '#1e3048', fontSize: 10 }}>/</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#00d9b8', letterSpacing: '0.1em' }}>
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

      {/* ── Header card ──────────────────────────────────────────────────── */}
      <div style={{
        background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, padding: '28px 32px',
        display: 'flex', alignItems: 'flex-start', gap: 24,
      }}>
        {/* Category icon */}
        <div style={{
          width: 72, height: 72, borderRadius: 16, flexShrink: 0,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 20px rgba(0,0,0,0.3)',
        }}>
          <CategoryIcon name={asset.category.icon} size={28} />
        </div>

        {/* Name + badges + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e2eaf4', lineHeight: 1 }}>
              {asset.name}
            </h1>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700,
              padding: '3px 10px', borderRadius: 5,
              background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', color: '#38bdf8',
            }}>
              {asset.tag}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 5,
              background: sc.bg, border: `1px solid ${sc.border}`,
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: sc.color,
            }}>
              {sc.label}
            </span>
          </div>

          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#3d5068', marginTop: 6 }}>
            {asset.category.name}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px 24px', marginTop: 20 }}>
            {asset.location && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', letterSpacing: '0.08em', fontWeight: 700 }}>LOCALIZAÇÃO</span>
                <span style={{ fontSize: 13, color: '#c8d6e5' }}>{asset.location}</span>
              </div>
            )}
            {asset.serialNumber && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', letterSpacing: '0.08em', fontWeight: 700 }}>Nº DE SÉRIE</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#c8d6e5' }}>{asset.serialNumber}</span>
              </div>
            )}
            {asset.acquisitionDate && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', letterSpacing: '0.08em', fontWeight: 700 }}>AQUISIÇÃO</span>
                <span style={{ fontSize: 13, color: '#c8d6e5' }}>{fmt(asset.acquisitionDate)}</span>
              </div>
            )}
            {asset.warrantyUntil && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', letterSpacing: '0.08em', fontWeight: 700 }}>GARANTIA ATÉ</span>
                <span style={{ fontSize: 13, color: new Date(asset.warrantyUntil) < new Date() ? '#f87171' : '#c8d6e5' }}>
                  {fmt(asset.warrantyUntil)}
                </span>
              </div>
            )}
            {asset.assignedToUser && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', letterSpacing: '0.08em', fontWeight: 700 }}>ATRIBUÍDO A</span>
                <Link href={`/people/${asset.assignedToUser.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#00d9b8', textDecoration: 'none' }}>
                  <User size={11} />
                  {asset.assignedToUser.name}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
          {[
            { value: asset._count?.movements ?? 0,     label: 'Movimentos', color: '#38bdf8' },
            { value: notesCount,                        label: 'Notas',      color: '#00d9b8' },
            { value: filesCount,                        label: 'Arquivos',   color: '#a78bfa' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '14px 18px', textAlign: 'center' }}>
              <p style={{ fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{s.value}</p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3d5068', marginTop: 4, letterSpacing: '0.05em' }}>{s.label.toUpperCase()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab Bar ──────────────────────────────────────────────────────── */}
      <AssetTabBar
        assetId={id}
        activeTab={activeTab}
        counts={{ notas: notesCount, arquivos: filesCount }}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          TAB: GERAL (specs + edit)
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
          TAB: HISTÓRICO (movements)
      ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'historico' && movements && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {movements.length === 0 && histPage === 1 ? (
            <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <ArrowLeftRight size={28} color="#1e3048" />
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#1e3048', fontStyle: 'italic' }}>
                Nenhuma movimentação registrada
              </p>
            </div>
          ) : (
            movements.map(mv => {
              const cfg = movementCfg[mv.type] ?? movementCfg.TRANSFER
              const { Icon, label, color, borderColor } = cfg

              return (
                <div key={mv.id} style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 20px', borderLeft: `3px solid ${color}` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    {/* Icon */}
                    <div style={{ width: 38, height: 38, borderRadius: 9, flexShrink: 0, background: `${borderColor}33`, border: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={16} color={color} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Top */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color }}>
                          {label.toUpperCase()}
                        </span>
                        <span style={{ fontSize: 10, color: '#3d5068' }}>•</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060' }}>
                          {fmtFull(mv.createdAt)}
                        </span>
                      </div>

                      {/* Users / locations */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px', marginBottom: 6 }}>
                        {mv.fromUser && (
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3d5068' }}>
                            DE: <Link href={`/people/${mv.fromUser.id}`} style={{ color: '#8ba5c0', textDecoration: 'none' }}>{mv.fromUser.name}</Link>
                          </span>
                        )}
                        {mv.toUser && (
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3d5068' }}>
                            PARA: <Link href={`/people/${mv.toUser.id}`} style={{ color: '#8ba5c0', textDecoration: 'none' }}>{mv.toUser.name}</Link>
                          </span>
                        )}
                        {mv.fromLocation && (
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3d5068' }}>
                            LOCAL DE: <span style={{ color: '#8ba5c0' }}>{mv.fromLocation}</span>
                          </span>
                        )}
                        {mv.toLocation && (
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3d5068' }}>
                            LOCAL PARA: <span style={{ color: '#8ba5c0' }}>{mv.toLocation}</span>
                          </span>
                        )}
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3d5068' }}>
                          POR: <Link href={`/people/${mv.actor.id}`} style={{ color: '#8ba5c0', textDecoration: 'none' }}>{mv.actor.name}</Link>
                        </span>
                      </div>

                      {/* Status change */}
                      {(mv.fromStatus || mv.toStatus) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          {mv.fromStatus && (
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700, color: statusConfig[mv.fromStatus]?.color ?? '#94a3b8', padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                              {statusConfig[mv.fromStatus]?.label ?? mv.fromStatus}
                            </span>
                          )}
                          {mv.fromStatus && mv.toStatus && <span style={{ color: '#2d4060', fontSize: 10 }}>→</span>}
                          {mv.toStatus && (
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700, color: statusConfig[mv.toStatus]?.color ?? '#94a3b8', padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                              {statusConfig[mv.toStatus]?.label ?? mv.toStatus}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Notes */}
                      {mv.notes && (
                        <p style={{ fontSize: 11, color: '#5a7a9a', marginTop: 4, fontStyle: 'italic', borderLeft: '2px solid rgba(255,255,255,0.06)', paddingLeft: 8 }}>
                          {mv.notes}
                        </p>
                      )}

                      {/* Linked entities */}
                      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                        {mv.ticket && (
                          <Link href={`/tickets/${mv.ticket.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 5, background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#38bdf8', textDecoration: 'none' }}>
                            CHAMADO {mv.ticket.code}
                          </Link>
                        )}
                        {mv.order && (
                          <Link href={`/movements/${mv.order.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#a78bfa', textDecoration: 'none' }}>
                            ORDEM DE MOVIMENTAÇÃO
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}

          {histTotalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#1e3048' }}>
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
