import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Laptop, Monitor, Printer, Keyboard, MousePointer,
  Headphones, Battery, Network, Smartphone, Package,
  Cpu, HardDrive, Server, Tablet, Camera,
  ArrowRight, ArrowLeft, ArrowLeftRight, Repeat2,
  Wrench, CheckCircle2, Trash2, Share2, CornerDownLeft,
  type LucideProps,
} from 'lucide-react'
import SystemAccessGrid from '@/components/people/SystemAccessGrid'
import NotesPanel from '@/components/people/NotesPanel'
import FilesPanel from '@/components/people/FilesPanel'
import PersonTabBar from '@/components/people/PersonTabBar'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ─── Icon maps ───────────────────────────────────────────────────────────────
const assetIconMap: Record<string, React.ComponentType<LucideProps>> = {
  laptop: Laptop, monitor: Monitor, printer: Printer, keyboard: Keyboard,
  'mouse-pointer': MousePointer, headphones: Headphones, battery: Battery,
  network: Network, smartphone: Smartphone, package: Package,
  cpu: Cpu, 'hard-drive': HardDrive, server: Server, tablet: Tablet, camera: Camera,
}

function CategoryIcon({ name }: { name: string | null }) {
  if (!name) return <Package size={14} color="#3d5068" />
  const Icon = assetIconMap[name]
  return Icon ? <Icon size={14} color="#3d5068" /> : <Package size={14} color="#3d5068" />
}

// ─── Role / status config ────────────────────────────────────────────────────
const roleLabel: Record<string, string> = {
  COLABORADOR: 'Colaborador',
  AUXILIAR_TI: 'Auxiliar TI',
  TECNICO:     'Técnico TI',
  ADMIN:       'Admin TI',
}
const roleColor: Record<string, { text: string; bg: string; border: string }> = {
  COLABORADOR: { text: '#94a3b8', bg: 'rgba(148,163,184,0.1)',  border: 'rgba(148,163,184,0.2)'  },
  AUXILIAR_TI: { text: '#818cf8', bg: 'rgba(129,140,248,0.1)',  border: 'rgba(129,140,248,0.2)'  },
  TECNICO:     { text: '#00d9b8', bg: 'rgba(0,217,184,0.1)',    border: 'rgba(0,217,184,0.2)'    },
  ADMIN:       { text: '#f87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.2)'  },
}

const ticketStatusCfg = {
  OPEN:        { label: 'Aberto',       color: '#38bdf8' },
  IN_PROGRESS: { label: 'Em andamento', color: '#fbbf24' },
  ON_HOLD:     { label: 'Aguardando',   color: '#a78bfa' },
  DONE:        { label: 'Concluído',    color: '#34d399' },
  CANCELED:    { label: 'Cancelado',    color: '#64748b' },
} as Record<string, { label: string; color: string }>

const assetStatusCfg = {
  DEPLOYED:    { label: 'Implantado', color: '#34d399' },
  STOCK:       { label: 'Estoque',    color: '#94a3b8' },
  MAINTENANCE: { label: 'Manutenção', color: '#fbbf24' },
  LOANED:      { label: 'Emprestado', color: '#38bdf8' },
  DISCARDED:   { label: 'Descartado', color: '#f87171' },
} as Record<string, { label: string; color: string }>

const movementCfg: Record<string, {
  label: string
  color: string
  borderColor: string
  Icon: React.ComponentType<LucideProps>
  direction: 'in' | 'out' | 'neutral'
}> = {
  CHECK_IN:    { label: 'Retorno ao estoque', color: '#94a3b8', borderColor: 'rgba(148,163,184,0.3)', Icon: ArrowLeft,      direction: 'out'     },
  CHECK_OUT:   { label: 'Retirada de estoque',color: '#34d399', borderColor: 'rgba(52,211,153,0.3)',  Icon: ArrowRight,     direction: 'in'      },
  TRANSFER:    { label: 'Transferência',      color: '#38bdf8', borderColor: 'rgba(56,189,248,0.3)',  Icon: ArrowLeftRight, direction: 'neutral' },
  SWAP:        { label: 'Troca',              color: '#a78bfa', borderColor: 'rgba(167,139,250,0.3)', Icon: Repeat2,        direction: 'neutral' },
  MAINT_START: { label: 'Enviado p/ manutenção', color: '#fbbf24', borderColor: 'rgba(251,191,36,0.3)', Icon: Wrench,      direction: 'out'     },
  MAINT_END:   { label: 'Retorno de manutenção', color: '#34d399', borderColor: 'rgba(52,211,153,0.3)', Icon: CheckCircle2,direction: 'in'      },
  DISCARD:     { label: 'Descartado',         color: '#f87171', borderColor: 'rgba(248,113,113,0.3)', Icon: Trash2,         direction: 'out'     },
  LOAN:        { label: 'Empréstimo',         color: '#38bdf8', borderColor: 'rgba(56,189,248,0.3)',  Icon: Share2,         direction: 'in'      },
  RETURN:      { label: 'Devolução',          color: '#f87171', borderColor: 'rgba(248,113,113,0.3)', Icon: CornerDownLeft, direction: 'out'     },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(d: Date | null | undefined): string {
  if (!d) return '—'
  return format(d, 'dd/MM/yyyy', { locale: ptBR })
}

function fmtFull(d: Date): string {
  return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', letterSpacing: '0.08em', fontWeight: 700 }}>
        {label}
      </span>
      <span style={{ fontSize: 13, color: '#c8d6e5' }}>{value}</span>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default async function PersonDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await auth()
  const myRole = session?.user.role
  if (myRole === 'COLABORADOR' || myRole === 'AUXILIAR_TI') redirect('/dashboard')

  const { id } = await params
  const { tab: rawTab } = await searchParams
  const VALID_TABS = ['geral', 'transacoes', 'notas', 'arquivos'] as const
  type TabKey = typeof VALID_TABS[number]
  const activeTab: TabKey = VALID_TABS.includes(rawTab as TabKey) ? (rawTab as TabKey) : 'geral'

  const canEdit = myRole === 'TECNICO' || myRole === 'ADMIN'
  const isAdmin = myRole === 'ADMIN'

  // ── Fetch base user ────────────────────────────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      department: true,
      systemAccesses: { orderBy: { system: 'asc' } },
      assignedAssets: {
        include: { category: true },
        orderBy: { updatedAt: 'desc' },
      },
      ticketsAsRequester: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { category: { select: { name: true } } },
      },
      // Counts for badges
      notes: {
        select: { id: true },
      },
      files: {
        select: { id: true },
      },
    },
  })

  if (!user) notFound()

  // ── Fetch tab-specific data ────────────────────────────────────────────────
  const movements = activeTab === 'transacoes'
    ? await prisma.assetMovement.findMany({
        where: { OR: [{ fromUserId: id }, { toUserId: id }] },
        include: {
          asset:    { include: { category: true } },
          fromUser: { select: { id: true, name: true } },
          toUser:   { select: { id: true, name: true } },
          actor:    { select: { id: true, name: true } },
          ticket:   { select: { id: true, code: true, title: true } },
          order:    { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
    : null

  const notes = activeTab === 'notas'
    ? await prisma.userNote.findMany({
        where: { userId: id },
        include: { author: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      })
    : null

  const files = activeTab === 'arquivos'
    ? await prisma.userFile.findMany({
        where: { userId: id },
        include: { uploadedBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      })
    : null

  // ── Derived ────────────────────────────────────────────────────────────────
  const rc = roleColor[user.role] ?? roleColor.COLABORADOR
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const deployedAssets = user.assignedAssets.filter(a => a.status === 'DEPLOYED')
  const notesCount = user.notes.length
  const filesCount = user.files.length

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Link href="/people" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060', textDecoration: 'none', letterSpacing: '0.1em' }}>
          PESSOAS
        </Link>
        <span style={{ color: '#1e3048', fontSize: 10 }}>/</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#00d9b8', letterSpacing: '0.1em' }}>
          {user.name.split(' ')[0].toUpperCase()}
        </span>
      </div>

      {/* ── Profile header ───────────────────────────────────────────────── */}
      <div style={{
        background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, padding: '28px 32px',
        display: 'flex', alignItems: 'flex-start', gap: 24,
      }}>
        {/* Avatar */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
          background: rc.bg, border: `2px solid ${rc.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 24px ${rc.border}`,
        }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: rc.text }}>
            {initials}
          </span>
        </div>

        {/* Name + status + info grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e2eaf4', lineHeight: 1 }}>
              {user.name}
            </h1>
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '3px 10px', borderRadius: 5,
              background: rc.bg, border: `1px solid ${rc.border}`,
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: rc.text,
            }}>
              {roleLabel[user.role]}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 5,
              background: user.active ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
              border: `1px solid ${user.active ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: user.active ? '#34d399' : '#f87171', boxShadow: `0 0 5px ${user.active ? '#34d39988' : '#f8717188'}` }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: user.active ? '#34d399' : '#f87171' }}>
                {user.active ? 'Ativo' : 'Inativo'}
              </span>
            </span>
          </div>

          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#3d5068', marginTop: 6 }}>
            {user.email}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px 24px', marginTop: 20 }}>
            <InfoRow label="DEPARTAMENTO"   value={user.department?.name ?? '—'} />
            <InfoRow label="ENTRADA"        value={fmt(user.entryDate)} />
            {user.exitDate    && <InfoRow label="SAÍDA"          value={fmt(user.exitDate)} />}
            {user.birthday    && <InfoRow label="ANIVERSÁRIO"    value={fmt(user.birthday)} />}
            {user.phone       && <InfoRow label="TELEFONE"       value={user.phone} />}
            {user.windowsUser && (
              <InfoRow label="USUÁRIO WINDOWS" value={
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{user.windowsUser}</span>
              } />
            )}
            {user.domainAccount && (
              <InfoRow label="DOMÍNIO (AD)" value={
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{user.domainAccount}</span>
              } />
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
          {[
            { value: deployedAssets.length,                                          label: 'Equipamentos', color: '#34d399' },
            { value: user.ticketsAsRequester.length,                                 label: 'Chamados',     color: '#38bdf8' },
            { value: user.systemAccesses.filter(a => a.status === 'OK').length,      label: 'Acessos OK',  color: '#00d9b8' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10, padding: '14px 18px', textAlign: 'center',
            }}>
              <p style={{ fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {s.value}
              </p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3d5068', marginTop: 4, letterSpacing: '0.05em' }}>
                {s.label.toUpperCase()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab Bar ──────────────────────────────────────────────────────── */}
      <PersonTabBar
        userId={id}
        activeTab={activeTab}
        counts={{ notas: notesCount, arquivos: filesCount }}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          TAB: GERAL
      ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'geral' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>

          {/* Left — Acessos + Equipamentos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* System access grid */}
            <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px 24px' }}>
              <SystemAccessGrid
                userId={user.id}
                accesses={user.systemAccesses.map(a => ({ system: a.system, status: a.status, notes: a.notes }))}
                canEdit={canEdit}
              />
            </div>

            {/* Equipment list */}
            <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', letterSpacing: '0.1em', fontWeight: 700 }}>
                  EQUIPAMENTOS ALOCADOS
                </span>
                <Link href={`/assets?userId=${user.id}`} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#00d9b8', textDecoration: 'none', letterSpacing: '0.05em' }}>
                  VER TODOS →
                </Link>
              </div>

              {user.assignedAssets.length === 0 ? (
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#1e3048', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                  Nenhum equipamento alocado
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {user.assignedAssets.map((asset, i) => {
                    const st = assetStatusCfg[asset.status]
                    return (
                      <Link key={asset.id} href={`/assets/${asset.id}`}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 12px', borderRadius: 8,
                          background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                          border: '1px solid rgba(255,255,255,0.04)',
                          textDecoration: 'none', transition: 'background 0.1s',
                        }}
                        className="hover-row"
                      >
                        <div style={{
                          width: 28, height: 28, borderRadius: 6,
                          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <CategoryIcon name={asset.category.icon} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: '#c8d6e5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {asset.name}
                          </p>
                          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3d5068', marginTop: 1 }}>
                            {asset.tag}{asset.serialNumber ? ` · S/N: ${asset.serialNumber}` : ''}
                          </p>
                        </div>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: st.color, flexShrink: 0 }}>
                          {st.label}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right — Tickets */}
          <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', letterSpacing: '0.1em', fontWeight: 700 }}>
                HISTÓRICO DE CHAMADOS
              </span>
              <Link href={`/tickets?requesterId=${user.id}`} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#00d9b8', textDecoration: 'none', letterSpacing: '0.05em' }}>
                VER TODOS →
              </Link>
            </div>

            {user.ticketsAsRequester.length === 0 ? (
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#1e3048', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                Nenhum chamado aberto
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {user.ticketsAsRequester.map(ticket => {
                  const st = ticketStatusCfg[ticket.status] ?? ticketStatusCfg.OPEN
                  return (
                    <Link key={ticket.id} href={`/tickets/${ticket.id}`}
                      style={{
                        display: 'flex', flexDirection: 'column', gap: 4,
                        padding: '10px 12px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                        textDecoration: 'none', transition: 'background 0.1s',
                      }}
                      className="hover-row"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3d5068', flexShrink: 0 }}>
                          {ticket.code}
                        </span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: st.color, flexShrink: 0 }}>
                          {st.label}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: '#c8d6e5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                        {ticket.title}
                      </p>
                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060' }}>
                        {ticket.category.name} · {fmt(ticket.createdAt)}
                      </p>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB: TRANSAÇÕES
      ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'transacoes' && movements && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {movements.length === 0 ? (
            <div style={{
              background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, padding: '48px 24px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            }}>
              <ArrowLeftRight size={28} color="#1e3048" />
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#1e3048', fontStyle: 'italic' }}>
                Nenhuma movimentação registrada para este usuário
              </p>
            </div>
          ) : (
            <>
              {/* Legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 4px', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 3, height: 14, borderRadius: 2, background: '#34d399' }} />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3d5068' }}>RECEBEU</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 3, height: 14, borderRadius: 2, background: '#f87171' }} />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3d5068' }}>DEVOLVEU / PERDEU</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 3, height: 14, borderRadius: 2, background: '#38bdf8' }} />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3d5068' }}>NEUTRO</span>
                </div>
              </div>

              {movements.map(mv => {
                const cfg = movementCfg[mv.type] ?? movementCfg.TRANSFER
                const { Icon, label, color, borderColor } = cfg
                const isReceiver = mv.toUserId === id
                const accent = isReceiver ? '#34d399' : mv.fromUserId === id ? '#f87171' : '#38bdf8'

                return (
                  <div
                    key={mv.id}
                    style={{
                      background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 12, padding: '16px 20px',
                      borderLeft: `3px solid ${accent}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      {/* Icon badge */}
                      <div style={{
                        width: 38, height: 38, borderRadius: 9, flexShrink: 0,
                        background: `${borderColor}33`, border: `1px solid ${borderColor}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={16} color={color} />
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Top row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color }}>
                            {label.toUpperCase()}
                          </span>
                          <span style={{ fontSize: 10, color: '#3d5068' }}>•</span>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060' }}>
                            {fmtFull(mv.createdAt)}
                          </span>
                        </div>

                        {/* Asset */}
                        <Link
                          href={`/assets/${mv.asset.id}`}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '6px 10px', borderRadius: 7,
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                            textDecoration: 'none', marginBottom: 10, transition: 'background 0.1s',
                          }}
                          className="hover-row"
                        >
                          <div style={{
                            width: 24, height: 24, borderRadius: 5,
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <CategoryIcon name={mv.asset.category.icon} />
                          </div>
                          <div>
                            <p style={{ fontSize: 12, fontWeight: 600, color: '#c8d6e5', lineHeight: 1.2 }}>
                              {mv.asset.name}
                            </p>
                            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3d5068' }}>
                              {mv.asset.tag}{mv.asset.serialNumber ? ` · S/N: ${mv.asset.serialNumber}` : ''}
                            </p>
                          </div>
                        </Link>

                        {/* Meta row */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px' }}>
                          {mv.fromUser && (
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3d5068' }}>
                              DE: <span style={{ color: '#8ba5c0' }}>{mv.fromUser.name}</span>
                            </span>
                          )}
                          {mv.toUser && (
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3d5068' }}>
                              PARA: <span style={{ color: '#8ba5c0' }}>{mv.toUser.name}</span>
                            </span>
                          )}
                          {mv.fromLocation && (
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3d5068' }}>
                              DE LOCAL: <span style={{ color: '#8ba5c0' }}>{mv.fromLocation}</span>
                            </span>
                          )}
                          {mv.toLocation && (
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3d5068' }}>
                              PARA LOCAL: <span style={{ color: '#8ba5c0' }}>{mv.toLocation}</span>
                            </span>
                          )}
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3d5068' }}>
                            POR: <span style={{ color: '#8ba5c0' }}>{mv.actor.name}</span>
                          </span>
                        </div>

                        {/* Notes */}
                        {mv.notes && (
                          <p style={{ fontSize: 11, color: '#5a7a9a', marginTop: 8, fontStyle: 'italic', borderLeft: '2px solid rgba(255,255,255,0.06)', paddingLeft: 8 }}>
                            {mv.notes}
                          </p>
                        )}

                        {/* Links */}
                        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                          {mv.ticket && (
                            <Link href={`/tickets/${mv.ticket.id}`} style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '4px 8px', borderRadius: 5,
                              background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)',
                              fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#38bdf8',
                              textDecoration: 'none',
                            }}>
                              CHAMADO {mv.ticket.code}
                            </Link>
                          )}
                          {mv.order && (
                            <Link href={`/movements/${mv.order.id}`} style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '4px 8px', borderRadius: 5,
                              background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)',
                              fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#a78bfa',
                              textDecoration: 'none',
                            }}>
                              ORDEM DE MOVIMENTAÇÃO
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Status change pill */}
                      {(mv.fromStatus || mv.toStatus) && (
                        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {mv.fromStatus && (
                            <span style={{
                              fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700,
                              color: assetStatusCfg[mv.fromStatus]?.color ?? '#94a3b8',
                              padding: '2px 6px', borderRadius: 4,
                              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                            }}>
                              {assetStatusCfg[mv.fromStatus]?.label ?? mv.fromStatus}
                            </span>
                          )}
                          {mv.fromStatus && mv.toStatus && (
                            <span style={{ color: '#2d4060', fontSize: 10 }}>→</span>
                          )}
                          {mv.toStatus && (
                            <span style={{
                              fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700,
                              color: assetStatusCfg[mv.toStatus]?.color ?? '#94a3b8',
                              padding: '2px 6px', borderRadius: 4,
                              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                            }}>
                              {assetStatusCfg[mv.toStatus]?.label ?? mv.toStatus}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB: NOTAS
      ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'notas' && notes !== null && (
        <NotesPanel
          userId={id}
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
        <FilesPanel
          userId={id}
          files={files.map(f => ({ ...f, createdAt: f.createdAt }))}
          currentUserId={session!.user.id}
          canEdit={canEdit}
          isAdmin={isAdmin}
        />
      )}

    </div>
  )
}
