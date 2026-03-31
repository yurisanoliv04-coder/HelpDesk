import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { TabSaverLink } from '@/components/ui/TabSaverLink'
import { Suspense } from 'react'
import {
  LogIn, LogOut, ArrowLeftRight, ArrowUpDown, Wrench,
  CheckCircle2, Trash2, Share2, Undo2, Activity,
  UserPlus, UserMinus, UserCog, Building2, ShieldCheck, RefreshCw,
  ChevronLeft, ChevronRight, Pencil, StickyNote, Paperclip,
  type LucideProps,
} from 'lucide-react'
import HistorySearchInput from '@/components/history/HistorySearchInput'
import HistoryDateFilter  from '@/components/history/HistoryDateFilter'

// ── Constants ───────────────────────────────────────────────────────────────
const PAGE_SIZE  = 30
const MAX_HIST   = 600   // max records fetched per source for merged tab

// ── Movement type config ────────────────────────────────────────────────────
type MvCfg = { label: string; color: string; bg: string; border: string; Icon: React.ComponentType<LucideProps> }

const mvConfig: Record<string, MvCfg> = {
  CREATED:     { label: 'Cadastro',       color: '#00d9b8', bg: 'rgba(0,217,184,0.09)',   border: 'rgba(0,217,184,0.24)',   Icon: Activity       },
  CHECK_IN:    { label: 'Check-in',       color: '#34d399', bg: 'rgba(52,211,153,0.09)',  border: 'rgba(52,211,153,0.24)',  Icon: LogIn          },
  CHECK_OUT:   { label: 'Check-out',      color: '#38bdf8', bg: 'rgba(56,189,248,0.09)',  border: 'rgba(56,189,248,0.24)',  Icon: LogOut         },
  TRANSFER:    { label: 'Transferência',  color: '#a78bfa', bg: 'rgba(167,139,250,0.09)', border: 'rgba(167,139,250,0.24)', Icon: ArrowLeftRight },
  SWAP:        { label: 'Troca',          color: '#fb923c', bg: 'rgba(251,146,60,0.09)',  border: 'rgba(251,146,60,0.24)',  Icon: ArrowUpDown    },
  MAINT_START: { label: 'Manutenção',     color: '#fbbf24', bg: 'rgba(251,191,36,0.09)',  border: 'rgba(251,191,36,0.24)',  Icon: Wrench         },
  MAINT_END:   { label: 'Fim Manutenção', color: '#00d9b8', bg: 'rgba(0,217,184,0.09)',   border: 'rgba(0,217,184,0.24)',   Icon: CheckCircle2   },
  DISCARD:     { label: 'Descarte',       color: '#f87171', bg: 'rgba(248,113,113,0.09)', border: 'rgba(248,113,113,0.24)', Icon: Trash2         },
  LOAN:        { label: 'Empréstimo',     color: '#818cf8', bg: 'rgba(129,140,248,0.09)', border: 'rgba(129,140,248,0.24)', Icon: Share2         },
  RETURN:      { label: 'Devolução',      color: '#94a3b8', bg: 'rgba(148,163,184,0.09)', border: 'rgba(148,163,184,0.24)', Icon: Undo2          },
  UPDATE:      { label: 'Edição',         color: '#64748b', bg: 'rgba(100,116,139,0.09)', border: 'rgba(100,116,139,0.24)', Icon: Pencil         },
}

// ── User event config ───────────────────────────────────────────────────────
const evConfig: Record<string, MvCfg> = {
  PROFILE_CREATED:     { label: 'Perfil criado',      color: '#34d399', bg: 'rgba(52,211,153,0.09)',  border: 'rgba(52,211,153,0.24)',  Icon: UserPlus    },
  PROFILE_UPDATED:     { label: 'Perfil atualizado',  color: '#38bdf8', bg: 'rgba(56,189,248,0.09)',  border: 'rgba(56,189,248,0.24)',  Icon: UserCog     },
  DEPT_CHANGED:        { label: 'Troca de depto.',    color: '#a78bfa', bg: 'rgba(167,139,250,0.09)', border: 'rgba(167,139,250,0.24)', Icon: Building2   },
  ROLE_CHANGED:        { label: 'Perfil alterado',    color: '#fbbf24', bg: 'rgba(251,191,36,0.09)',  border: 'rgba(251,191,36,0.24)',  Icon: ShieldCheck },
  PROFILE_DEACTIVATED: { label: 'Perfil cancelado',   color: '#f87171', bg: 'rgba(248,113,113,0.09)', border: 'rgba(248,113,113,0.24)', Icon: UserMinus   },
  PROFILE_REACTIVATED: { label: 'Perfil reativado',   color: '#00d9b8', bg: 'rgba(0,217,184,0.09)',   border: 'rgba(0,217,184,0.24)',   Icon: RefreshCw   },
}

// ── Historico source configs ─────────────────────────────────────────────────
const noteSourceCfg:     MvCfg = { label: 'Nota adicionada',  color: '#00d9b8', bg: 'rgba(0,217,184,0.09)',   border: 'rgba(0,217,184,0.24)',   Icon: StickyNote }
const fileCfg:           MvCfg = { label: 'Arquivo enviado',   color: '#a78bfa', bg: 'rgba(167,139,250,0.09)', border: 'rgba(167,139,250,0.24)', Icon: Paperclip  }
const fallbackCfg:       MvCfg = { label: 'Evento',            color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)',  Icon: Activity   }
const purchasePendingCfg:MvCfg = { label: 'Compra registrada', color: '#fbbf24', bg: 'rgba(251,191,36,0.09)',  border: 'rgba(251,191,36,0.24)',  Icon: Activity   }
const purchaseRecvCfg:   MvCfg = { label: 'Compra recebida',   color: '#34d399', bg: 'rgba(52,211,153,0.09)', border: 'rgba(52,211,153,0.24)',  Icon: CheckCircle2 }
const purchaseCancelCfg: MvCfg = { label: 'Compra cancelada',  color: '#f87171', bg: 'rgba(248,113,113,0.09)',border: 'rgba(248,113,113,0.24)', Icon: Trash2      }
const stockMoveCfg:      MvCfg = { label: 'Movim. estoque',    color: '#38bdf8', bg: 'rgba(56,189,248,0.09)', border: 'rgba(56,189,248,0.24)',  Icon: ArrowUpDown }

const roleLabel: Record<string, string> = {
  COLABORADOR: 'Colaborador', AUXILIAR_TI: 'Auxiliar TI',
  TECNICO: 'Técnico',         ADMIN: 'Administrador',
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(date)
}

const PALETTE: [string, string][] = [
  ['#00d9b8','rgba(0,217,184,0.14)'], ['#a78bfa','rgba(167,139,250,0.14)'],
  ['#38bdf8','rgba(56,189,248,0.14)'], ['#fbbf24','rgba(251,191,36,0.14)'],
  ['#f87171','rgba(248,113,113,0.14)'], ['#34d399','rgba(52,211,153,0.14)'],
  ['#fb923c','rgba(251,146,60,0.14)'],
]
function getAvatarColor(name: string): [string, string] {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % PALETTE.length
  return PALETTE[Math.abs(h)]!
}

function Avatar({ name, size = 26 }: { name: string; size?: number }) {
  const [color, bg] = getAvatarColor(name)
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: bg, border: `1px solid ${color}35`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: size * 0.35, fontWeight: 700, color }}>
        {initials}
      </span>
    </div>
  )
}

function TypeBadge({ cfg }: { cfg: MvCfg }) {
  const Icon = cfg.Icon
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 6,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
    }}>
      <Icon size={11} color={cfg.color} />
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: cfg.color, whiteSpace: 'nowrap' }}>
        {cfg.label}
      </span>
    </span>
  )
}

// ── Pagination bar (server-rendered links) ───────────────────────────────────
function PaginationBar({ page, totalPages, buildHref }: {
  page: number
  totalPages: number
  buildHref: (p: number) => string
}) {
  if (totalPages <= 1) return null
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1
    const start = Math.max(1, Math.min(page - 3, totalPages - 6))
    return start + i
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
      <Link
        href={buildHref(Math.max(1, page - 1))}
        aria-disabled={page === 1}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '6px 12px', borderRadius: 7,
          background: page === 1 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
          color: page === 1 ? '#1e3048' : '#3d5068',
          textDecoration: 'none', pointerEvents: page === 1 ? 'none' : 'auto',
        }}
      >
        <ChevronLeft size={12} /> Anterior
      </Link>

      {pages.map(p => (
        <Link
          key={p}
          href={buildHref(p)}
          style={{
            width: 32, height: 32, borderRadius: 7,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: p === page ? 'rgba(0,217,184,0.12)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${p === page ? 'rgba(0,217,184,0.35)' : 'rgba(255,255,255,0.07)'}`,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
            color: p === page ? '#00d9b8' : '#3d5068',
            fontWeight: p === page ? 700 : 400,
            textDecoration: 'none',
          }}
        >
          {p}
        </Link>
      ))}

      <Link
        href={buildHref(Math.min(totalPages, page + 1))}
        aria-disabled={page === totalPages}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '6px 12px', borderRadius: 7,
          background: page === totalPages ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
          color: page === totalPages ? '#1e3048' : '#3d5068',
          textDecoration: 'none', pointerEvents: page === totalPages ? 'none' : 'auto',
        }}
      >
        Próxima <ChevronRight size={12} />
      </Link>
    </div>
  )
}

// ── Unified audit entry type ─────────────────────────────────────────────────
type HistEntry = {
  id: string
  date: Date
  cfg: MvCfg
  sourceLabel: string
  subject1: string
  subject2?: string
  subjectHref?: string
  description: string
  actorName: string
}

function movDesc(m: {
  fromUser?: { name: string } | null
  toUser?:   { name: string } | null
  fromLocation?: string | null
  toLocation?:   string | null
  notes?: string | null
}): string {
  const from = m.fromUser?.name ?? m.fromLocation ?? null
  const to   = m.toUser?.name   ?? m.toLocation   ?? null
  if (from && to) return `${from} → ${to}`
  if (from)       return `De: ${from}`
  if (to)         return `Para: ${to}`
  if (m.notes) {
    const lines = m.notes.split('\n')
    const preview = lines.slice(0, 2).join(' · ')
    return lines.length > 2 ? `${preview} · +${lines.length - 2} mais` : preview
  }
  return '—'
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function MovementsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; type?: string; q?: string; page?: string; dateFrom?: string; dateTo?: string }>
}) {
  const session = await auth()
  if (session?.user.role === 'COLABORADOR') redirect('/dashboard')

  const sp = await searchParams

  // Redireciona para a última aba usada quando não há parâmetro na URL
  if (!sp.tab) {
    const cookieStore = await cookies()
    const saved = cookieStore.get('hd_movements_tab')?.value
    if (saved && ['ativos', 'pessoas', 'historico'].includes(saved)) {
      redirect(`/movements?tab=${saved}`)
    }
  }

  const tab = (['ativos', 'pessoas', 'historico'].includes(sp.tab ?? '') ? sp.tab : 'ativos') as 'ativos' | 'pessoas' | 'historico'
  const type     = sp.type ?? null
  const q        = sp.q?.trim() ?? null
  const page     = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)
  const skip     = (page - 1) * PAGE_SIZE
  const dateFrom = sp.dateFrom ?? null
  const dateTo   = sp.dateTo   ?? null

  // ── Build where conditions ─────────────────────────────────────────────
  const assetTextOr = q ? [
    { asset:    { tag:  { contains: q, mode: 'insensitive' as const } } },
    { asset:    { name: { contains: q, mode: 'insensitive' as const } } },
    { actor:    { name: { contains: q, mode: 'insensitive' as const } } },
    { fromUser: { name: { contains: q, mode: 'insensitive' as const } } },
    { toUser:   { name: { contains: q, mode: 'insensitive' as const } } },
    { fromLocation: { contains: q, mode: 'insensitive' as const } },
    { toLocation:   { contains: q, mode: 'insensitive' as const } },
    { ticket:   { code: { contains: q, mode: 'insensitive' as const } } },
  ] : undefined

  const assetWhere = {
    ...(type ? { type: type as never } : {}),
    ...(assetTextOr ? { OR: assetTextOr } : {}),
  }

  const peopleTextOr = q ? [
    { user:  { name:       { contains: q, mode: 'insensitive' as const } } },
    { user:  { department: { name: { contains: q, mode: 'insensitive' as const } } } },
    { actor: { name:       { contains: q, mode: 'insensitive' as const } } },
    { description: { contains: q, mode: 'insensitive' as const } },
  ] : undefined

  const peopleWhere = {
    ...(peopleTextOr ? { OR: peopleTextOr } : {}),
  }

  // ── Queries ────────────────────────────────────────────────────────────
  const [
    movements, assetTotal, assetTypeCounts,
    userEvents, userTotal, userEventTypeCounts,
    histNoteCountAll, histFileCountAll,
    histPurchaseCountAll, histStockCountAll,
  ] = await Promise.all([
    prisma.assetMovement.findMany({
      where: assetWhere, orderBy: { createdAt: 'desc' },
      skip, take: PAGE_SIZE,
      include: {
        asset:    { select: { id: true, tag: true, name: true } },
        fromUser: { select: { name: true } },
        toUser:   { select: { name: true } },
        actor:    { select: { name: true } },
        ticket:   { select: { code: true } },
      },
    }),
    prisma.assetMovement.count({ where: assetWhere }),
    prisma.assetMovement.groupBy({ by: ['type'], _count: { _all: true } }),

    prisma.userEvent.findMany({
      where: peopleWhere, orderBy: { createdAt: 'desc' },
      skip, take: PAGE_SIZE,
      include: {
        user:  { select: { id: true, name: true, role: true, department: { select: { name: true } } } },
        actor: { select: { name: true, role: true } },
      },
    }),
    prisma.userEvent.count({ where: peopleWhere }),
    prisma.userEvent.groupBy({ by: ['type'], _count: { _all: true } }),

    // For tab bar grand total (unfiltered)
    prisma.assetNote.count(),
    prisma.assetFile.count(),
    prisma.purchase.count(),
    prisma.categoryStockMovement.count(),
  ])

  const assetCountByType = Object.fromEntries(assetTypeCounts.map(c => [c.type, c._count._all]))
  const userCountByType  = Object.fromEntries(userEventTypeCounts.map(c => [c.type, c._count._all]))
  const assetGrandTotal  = Object.values(assetCountByType).reduce((a, b) => a + b, 0)
  const userGrandTotal   = Object.values(userCountByType).reduce((a, b) => a + b, 0)
  const histGrandTotal   = assetGrandTotal + userGrandTotal + histNoteCountAll + histFileCountAll + histPurchaseCountAll + histStockCountAll

  const assetTotalPages = Math.max(1, Math.ceil(assetTotal / PAGE_SIZE))
  const userTotalPages  = Math.max(1, Math.ceil(userTotal  / PAGE_SIZE))

  // ── Historico tab ──────────────────────────────────────────────────────
  let histPageItems: HistEntry[] = []
  let histTotal     = 0
  let histTotalPages = 1

  if (tab === 'historico') {
    const dateWhere = (dateFrom || dateTo) ? {
      createdAt: {
        ...(dateFrom ? { gte: new Date(dateFrom + 'T00:00:00') } : {}),
        ...(dateTo   ? { lte: new Date(dateTo   + 'T23:59:59') } : {}),
      },
    } : {}

    const hMovWhere = {
      ...dateWhere,
      ...(q ? { OR: [
        { asset:    { tag:  { contains: q, mode: 'insensitive' as const } } },
        { asset:    { name: { contains: q, mode: 'insensitive' as const } } },
        { actor:    { name: { contains: q, mode: 'insensitive' as const } } },
        { fromUser: { name: { contains: q, mode: 'insensitive' as const } } },
        { toUser:   { name: { contains: q, mode: 'insensitive' as const } } },
        { notes:    { contains: q, mode: 'insensitive' as const } },
      ]} : {}),
    }
    const hEvWhere = {
      ...dateWhere,
      ...(q ? { OR: [
        { user:        { name:  { contains: q, mode: 'insensitive' as const } } },
        { actor:       { name:  { contains: q, mode: 'insensitive' as const } } },
        { description: { contains: q, mode: 'insensitive' as const } },
      ]} : {}),
    }
    const hNoteWhere = {
      ...dateWhere,
      ...(q ? { OR: [
        { body:   { contains: q, mode: 'insensitive' as const } },
        { author: { name: { contains: q, mode: 'insensitive' as const } } },
        { asset:  { tag:  { contains: q, mode: 'insensitive' as const } } },
        { asset:  { name: { contains: q, mode: 'insensitive' as const } } },
      ]} : {}),
    }
    const hFileWhere = {
      ...dateWhere,
      ...(q ? { OR: [
        { originalName: { contains: q, mode: 'insensitive' as const } },
        { uploadedBy:   { name: { contains: q, mode: 'insensitive' as const } } },
        { asset:        { tag:  { contains: q, mode: 'insensitive' as const } } },
        { asset:        { name: { contains: q, mode: 'insensitive' as const } } },
      ]} : {}),
    }

    // Purchase and stock movement filters
    const hPurchaseWhere = {
      ...dateWhere,
      ...(q ? { OR: [
        { title:     { contains: q, mode: 'insensitive' as const } },
        { supplier:  { contains: q, mode: 'insensitive' as const } },
        { createdBy: { name: { contains: q, mode: 'insensitive' as const } } },
      ]} : {}),
    }
    const hStockWhere = {
      ...dateWhere,
      ...(q ? { OR: [
        { notes:    { contains: q, mode: 'insensitive' as const } },
        { category: { name: { contains: q, mode: 'insensitive' as const } } },
        { createdBy: { name: { contains: q, mode: 'insensitive' as const } } },
      ]} : {}),
    }

    const [hMovs, hMovCount, hEvs, hEvCount, hNotes, hNoteCount, hFiles, hFileCount,
           hPurchases, hPurchaseCount, hStocks, hStockCount] = await Promise.all([
      prisma.assetMovement.findMany({
        where: hMovWhere, orderBy: { createdAt: 'desc' }, take: MAX_HIST,
        include: {
          asset:    { select: { id: true, tag: true, name: true } },
          actor:    { select: { name: true } },
          fromUser: { select: { name: true } },
          toUser:   { select: { name: true } },
        },
      }),
      prisma.assetMovement.count({ where: hMovWhere }),
      prisma.userEvent.findMany({
        where: hEvWhere, orderBy: { createdAt: 'desc' }, take: MAX_HIST,
        include: {
          user:  { select: { id: true, name: true } },
          actor: { select: { name: true } },
        },
      }),
      prisma.userEvent.count({ where: hEvWhere }),
      prisma.assetNote.findMany({
        where: hNoteWhere, orderBy: { createdAt: 'desc' }, take: MAX_HIST,
        include: {
          asset:  { select: { id: true, tag: true, name: true } },
          author: { select: { name: true } },
        },
      }),
      prisma.assetNote.count({ where: hNoteWhere }),
      prisma.assetFile.findMany({
        where: hFileWhere, orderBy: { createdAt: 'desc' }, take: MAX_HIST,
        include: {
          asset:      { select: { id: true, tag: true, name: true } },
          uploadedBy: { select: { name: true } },
        },
      }),
      prisma.assetFile.count({ where: hFileWhere }),
      prisma.purchase.findMany({
        where: hPurchaseWhere, orderBy: { createdAt: 'desc' }, take: MAX_HIST,
        include: { createdBy: { select: { name: true } } },
      }),
      prisma.purchase.count({ where: hPurchaseWhere }),
      prisma.categoryStockMovement.findMany({
        where: hStockWhere, orderBy: { createdAt: 'desc' }, take: MAX_HIST,
        include: {
          category:  { select: { name: true } },
          createdBy: { select: { name: true } },
        },
      }),
      prisma.categoryStockMovement.count({ where: hStockWhere }),
    ])

    // Normalize all sources into unified HistEntry[]
    const entries: HistEntry[] = [
      ...hMovs.map(m => ({
        id: `mv-${m.id}`,
        date: m.createdAt,
        cfg: mvConfig[m.type] ?? fallbackCfg,
        sourceLabel: 'Movimentação',
        subject1: m.asset.tag,
        subject2: m.asset.name,
        subjectHref: `/assets/${m.asset.id}`,
        description: movDesc(m as Parameters<typeof movDesc>[0]),
        actorName: m.actor.name,
      })),
      ...hEvs.map(e => ({
        id: `ev-${e.id}`,
        date: e.createdAt,
        cfg: evConfig[e.type] ?? fallbackCfg,
        sourceLabel: 'Usuário',
        subject1: e.user.name,
        subject2: undefined,
        subjectHref: undefined,
        description: e.description ?? evConfig[e.type]?.label ?? e.type,
        actorName: e.actor?.name ?? 'Sistema',
      })),
      ...hNotes.map(n => ({
        id: `note-${n.id}`,
        date: n.createdAt,
        cfg: noteSourceCfg,
        sourceLabel: 'Nota',
        subject1: n.asset.tag,
        subject2: n.asset.name,
        subjectHref: `/assets/${n.asset.id}?tab=notas`,
        description: n.body.length > 90 ? n.body.slice(0, 90) + '…' : n.body,
        actorName: n.author.name,
      })),
      ...hFiles.map(f => ({
        id: `file-${f.id}`,
        date: f.createdAt,
        cfg: fileCfg,
        sourceLabel: 'Arquivo',
        subject1: f.asset.tag,
        subject2: f.asset.name,
        subjectHref: `/assets/${f.asset.id}?tab=arquivos`,
        description: f.originalName,
        actorName: f.uploadedBy.name,
      })),
      ...hPurchases.map(p => ({
        id: `purchase-${p.id}`,
        date: p.createdAt,
        cfg: p.status === 'RECEIVED' ? purchaseRecvCfg : p.status === 'CANCELED' ? purchaseCancelCfg : purchasePendingCfg,
        sourceLabel: 'Compra',
        subject1: p.title,
        subject2: p.supplier ?? undefined,
        subjectHref: `/consumiveis/compras/${p.id}/editar`,
        description: `Qtd: ${p.quantity}${p.supplier ? ` · ${p.supplier}` : ''}`,
        actorName: p.createdBy.name,
      })),
      ...hStocks.map(s => ({
        id: `stock-${s.id}`,
        date: s.createdAt,
        cfg: stockMoveCfg,
        sourceLabel: 'Estoque',
        subject1: s.category.name,
        subject2: undefined,
        subjectHref: `/consumiveis`,
        description: `${s.type === 'PURCHASE' ? '+' : s.quantity > 0 ? '+' : ''}${s.quantity} un${s.notes ? ` · ${s.notes.length > 60 ? s.notes.slice(0, 60) + '…' : s.notes}` : ''}`,
        actorName: s.createdBy.name,
      })),
    ]

    // Sort by date desc, then paginate
    entries.sort((a, b) => b.date.getTime() - a.date.getTime())
    histTotal      = hMovCount + hEvCount + hNoteCount + hFileCount + hPurchaseCount + hStockCount
    histTotalPages = Math.max(1, Math.ceil(histTotal / PAGE_SIZE))
    histPageItems  = entries.slice(skip, skip + PAGE_SIZE)
  }

  // ── URL builders ──────────────────────────────────────────────────────
  function buildHref(params: Record<string, string | null | undefined>) {
    const p = new URLSearchParams()
    p.set('tab', tab)
    if (type)        p.set('type', type)
    if (q)           p.set('q', q)
    if (dateFrom)    p.set('dateFrom', dateFrom)
    if (dateTo)      p.set('dateTo',   dateTo)
    if (params.page) p.set('page', params.page)
    if (params.type !== undefined) {
      if (params.type) p.set('type', params.type)
      else p.delete('type')
    }
    return `/movements?${p.toString()}`
  }

  function buildHistHref(p: number) {
    const params = new URLSearchParams()
    params.set('tab', 'historico')
    if (q)        params.set('q', q)
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo)   params.set('dateTo',   dateTo)
    params.set('page', String(p))
    return `/movements?${params.toString()}`
  }

  const assetTypeChips = [
    { key: null, label: 'Todos', href: buildHref({ type: null }), count: assetGrandTotal },
    ...Object.entries(assetCountByType).sort((a, b) => b[1] - a[1]).map(([t, count]) => ({
      key: t, label: mvConfig[t]?.label ?? t,
      href: buildHref({ type: t }), count,
    })),
  ]

  const ASSET_GRID  = '162px 128px minmax(160px,1fr) minmax(180px,1.2fr) 170px 90px'
  const PEOPLE_GRID = '180px 128px minmax(180px,1fr) 170px 200px'
  const HIST_GRID   = '160px 128px minmax(120px,1fr) minmax(180px,1.4fr) 155px'

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060', letterSpacing: '0.1em' }}>SISTEMA</span>
          <span style={{ color: '#1e3048', fontSize: 10 }}>/</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#00d9b8', letterSpacing: '0.1em' }}>HISTÓRICO</span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e2eaf4', letterSpacing: '-0.01em', lineHeight: 1 }}>
          Histórico Geral
        </h1>
        <p style={{ fontSize: 13, color: '#3d5068', marginTop: 6 }}>
          Registro auditável de movimentações patrimoniais e alterações de perfis
        </p>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        {([
          { key: 'ativos',    label: 'Ativos',    count: assetGrandTotal, href: '/movements?tab=ativos'    },
          { key: 'pessoas',   label: 'Pessoas',   count: userGrandTotal,  href: '/movements?tab=pessoas'   },
          { key: 'historico', label: 'Histórico', count: histGrandTotal,  href: '/movements?tab=historico' },
        ] as const).map(t => {
          const isActive = tab === t.key
          return (
            <TabSaverLink key={t.key} href={t.href} cookieKey="hd_movements_tab" cookieValue={t.key} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '10px 16px',
              borderBottom: isActive ? '2px solid #00d9b8' : '2px solid transparent',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12, fontWeight: isActive ? 700 : 500,
              color: isActive ? '#00d9b8' : '#3d5068',
              textDecoration: 'none', marginBottom: -1, transition: 'all 0.12s',
            }}>
              {t.label}
              <span style={{
                fontSize: 10,
                background: isActive ? 'rgba(0,217,184,0.14)' : 'rgba(255,255,255,0.05)',
                color: isActive ? '#00d9b8' : '#2d4060',
                padding: '1px 6px', borderRadius: 5,
              }}>
                {t.count}
              </span>
            </TabSaverLink>
          )
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: ATIVOS
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'ativos' && (
        <>
          {/* Search + type chips row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Suspense fallback={<div style={{ height: 36, width: 300 }} />}>
              <HistorySearchInput initialValue={q ?? ''} tab="ativos" typeFilter={type ?? undefined} />
            </Suspense>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {assetTypeChips.map(chip => {
                const isActive = type === chip.key
                const cfg = chip.key ? mvConfig[chip.key] : null
                const cc = isActive ? (cfg?.color ?? '#00d9b8') : '#3d5068'
                return (
                  <Link key={String(chip.key)} href={chip.href} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '5px 12px', borderRadius: 7,
                    background: isActive ? (cfg?.bg ?? 'rgba(0,217,184,0.12)') : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isActive ? (cfg?.border ?? 'rgba(0,217,184,0.35)') : 'rgba(255,255,255,0.07)'}`,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11, fontWeight: isActive ? 700 : 500,
                    color: cc, textDecoration: 'none',
                  }}>
                    {chip.label}
                    <span style={{ fontSize: 10, color: cc, background: isActive ? `${cc}1a` : 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: 5 }}>
                      {chip.count}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>

          {(q || type) && (
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3d5068' }}>
              {assetTotal} resultado{assetTotal !== 1 ? 's' : ''}
              {q ? <span> para <span style={{ color: '#00d9b8' }}>"{q}"</span></span> : null}
              {type ? <span> · tipo <span style={{ color: mvConfig[type]?.color ?? '#00d9b8' }}>{mvConfig[type]?.label ?? type}</span></span> : null}
            </p>
          )}

          <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: ASSET_GRID, columnGap: 8,
              padding: '0 20px', height: 38,
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.02)', alignItems: 'center',
            }}>
              {['TIPO','DATA','ATIVO','MOVIMENTAÇÃO','EXECUTADO POR','CHAMADO'].map(h => (
                <div key={h} style={thStyle}>{h}</div>
              ))}
            </div>

            {movements.length === 0 ? (
              <div style={{ padding: '60px 24px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#2d4060' }}>
                {q ? `— nenhum resultado para "${q}" —` : '— nenhuma movimentação encontrada —'}
              </div>
            ) : movements.map((m, i) => {
              const cfg  = mvConfig[m.type] ?? { label: m.type, color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)', Icon: Activity }
              const from = m.fromUser?.name ?? m.fromLocation ?? null
              const to   = m.toUser?.name   ?? m.toLocation   ?? null
              return (
                <div key={m.id} className="hover-row" style={{
                  display: 'grid', gridTemplateColumns: ASSET_GRID,
                  columnGap: 8, padding: '14px 20px', alignItems: 'center',
                  borderBottom: i < movements.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  transition: 'background 0.1s',
                }}>
                  <div><TypeBadge cfg={cfg} /></div>
                  <div><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#4a6580' }}>{formatDate(m.createdAt)}</span></div>
                  <div style={{ minWidth: 0 }}>
                    <Link href={`/assets/${m.asset.id}`} style={{ textDecoration: 'none' }}>
                      <span style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#00d9b8', lineHeight: 1.3 }}>{m.asset.tag}</span>
                      <span style={{ display: 'block', fontSize: 12, color: '#7a9bbc', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.asset.name}</span>
                    </Link>
                  </div>
                  {m.type === 'CREATED' ? (
                    /* CREATED — exibe status inicial e localização */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#00d9b8', letterSpacing: '0.06em' }}>CADASTRO INICIAL</span>
                        {m.toStatus && (
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3d5068' }}>·</span>
                        )}
                        {m.toStatus && (() => {
                          const sMap: Record<string, string> = { STOCK: 'Em estoque', DEPLOYED: 'Implantado', MAINTENANCE: 'Manutenção', DISCARDED: 'Descartado', LOANED: 'Emprestado' }
                          return <span style={{ fontSize: 11, color: '#7a9bbc' }}>{sMap[m.toStatus] ?? m.toStatus}</span>
                        })()}
                      </div>
                      {m.toLocation && (
                        <span style={{ fontSize: 11, color: '#4a6580' }}>📍 {m.toLocation}</span>
                      )}
                    </div>
                  ) : m.type === 'UPDATE' && m.notes ? (
                    /* UPDATE com diff detalhado */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, overflow: 'hidden' }}>
                      {m.notes.split('\n').slice(0, 3).map((line, li) => {
                        const sep = line.indexOf(': ')
                        const field = sep >= 0 ? line.slice(0, sep) : ''
                        const rest  = sep >= 0 ? line.slice(sep + 2) : line
                        const arrowIdx = rest.indexOf(' → ')
                        const oldVal = arrowIdx >= 0 ? rest.slice(0, arrowIdx) : rest
                        const newVal = arrowIdx >= 0 ? rest.slice(arrowIdx + 3) : ''
                        return (
                          <div key={li} style={{ display: 'flex', alignItems: 'baseline', gap: 5, overflow: 'hidden' }}>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', flexShrink: 0, letterSpacing: '0.04em' }}>{field}:</span>
                            <span style={{ fontSize: 11, color: '#4a6580', flexShrink: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>{oldVal}</span>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#1e3a52', flexShrink: 0 }}>→</span>
                            <span style={{ fontSize: 11, color: '#c8d6e5', flexShrink: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>{newVal}</span>
                          </div>
                        )
                      })}
                      {m.notes.split('\n').length > 3 && (
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060' }}>
                          +{m.notes.split('\n').length - 3} campo{m.notes.split('\n').length - 3 !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  ) : m.type === 'UPDATE' ? (
                    /* UPDATE antigo sem diff registrado */
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060', fontStyle: 'italic' }}>
                      — campos editados (sem detalhes) —
                    </span>
                  ) : (
                    /* Movimentação normal: from → to */
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                      <span style={{ fontSize: 12, color: from ? '#8ba5c0' : '#1e3048', fontStyle: from ? 'normal' : 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 1 }}>{from ?? '—'}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#1e3a52', flexShrink: 0 }}>→</span>
                      <span style={{ fontSize: 12, color: to ? '#c8d6e5' : '#1e3048', fontStyle: to ? 'normal' : 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 1 }}>{to ?? '—'}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <Avatar name={m.actor.name} />
                    <span style={{ fontSize: 12, color: '#8ba5c0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.actor.name}</span>
                  </div>
                  <div>
                    {m.ticket ? (
                      <Link href={`/tickets/${m.ticketId}`} style={{ textDecoration: 'none' }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#00d9b8' }}>{m.ticket.code}</span>
                      </Link>
                    ) : (
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#1e3048' }}>—</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#1e3048' }}>
              Página {page} de {assetTotalPages} · {assetTotal} registro{assetTotal !== 1 ? 's' : ''} no total
            </p>
            <PaginationBar
              page={page}
              totalPages={assetTotalPages}
              buildHref={p => buildHref({ page: String(p) })}
            />
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: PESSOAS
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'pessoas' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Suspense fallback={<div style={{ height: 36, width: 300 }} />}>
              <HistorySearchInput initialValue={q ?? ''} tab="pessoas" />
            </Suspense>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 12px', borderRadius: 8,
              background: 'rgba(0,217,184,0.05)', border: '1px solid rgba(0,217,184,0.12)',
            }}>
              <span style={{ color: '#00d9b8', fontSize: 12 }}>ℹ</span>
              <p style={{ fontSize: 11, color: '#3d5068' }}>
                Campo <span style={{ color: '#8ba5c0' }}>Executado por</span> indica o técnico responsável
              </p>
            </div>
          </div>

          {q && (
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3d5068' }}>
              {userTotal} resultado{userTotal !== 1 ? 's' : ''} para <span style={{ color: '#00d9b8' }}>"{q}"</span>
            </p>
          )}

          <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: PEOPLE_GRID, columnGap: 8,
              padding: '0 20px', height: 38,
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.02)', alignItems: 'center',
            }}>
              {['EVENTO','DATA','PESSOA','DEPARTAMENTO','EXECUTADO POR'].map(h => (
                <div key={h} style={thStyle}>{h}</div>
              ))}
            </div>

            {userEvents.length === 0 ? (
              <div style={{ padding: '60px 24px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#2d4060' }}>
                {q ? `— nenhum resultado para "${q}" —` : '— nenhum evento de pessoa encontrado —'}
              </div>
            ) : userEvents.map((ev, i) => {
              const cfg  = evConfig[ev.type] ?? evConfig.PROFILE_UPDATED
              const meta = ev.meta as Record<string, string | null> | null
              return (
                <div key={ev.id} className="hover-row" style={{
                  display: 'grid', gridTemplateColumns: PEOPLE_GRID,
                  columnGap: 8, padding: '14px 20px', alignItems: 'center',
                  borderBottom: i < userEvents.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  transition: 'background 0.1s',
                }}>
                  <div><TypeBadge cfg={cfg} /></div>
                  <div><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#4a6580' }}>{formatDate(ev.createdAt)}</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                    <Avatar name={ev.user.name} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#c8d6e5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>{ev.user.name}</p>
                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', marginTop: 1 }}>{roleLabel[ev.user.role] ?? ev.user.role}</p>
                    </div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    {ev.type === 'DEPT_CHANGED' && meta?.oldDept && meta?.newDept ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        <span style={{ fontSize: 11, color: '#4a6580', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta.oldDept}</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#1e3a52', flexShrink: 0 }}>→</span>
                        <span style={{ fontSize: 11, color: '#c8d6e5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta.newDept}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: ev.user.department?.name ? '#8ba5c0' : '#1e3048', fontStyle: ev.user.department?.name ? 'normal' : 'italic' }}>
                        {ev.user.department?.name ?? 'Sem departamento'}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    {ev.actor ? (
                      <>
                        <Avatar name={ev.actor.name} size={24} />
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 12, color: '#8ba5c0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>{ev.actor.name}</p>
                          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', marginTop: 1 }}>{roleLabel[ev.actor.role] ?? ev.actor.role}</p>
                        </div>
                      </>
                    ) : (
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#1e3048', fontStyle: 'italic' }}>Sistema</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#1e3048' }}>
              Página {page} de {userTotalPages} · {userTotal} registro{userTotal !== 1 ? 's' : ''} no total
            </p>
            <PaginationBar
              page={page}
              totalPages={userTotalPages}
              buildHref={p => {
                const params = new URLSearchParams()
                params.set('tab', 'pessoas')
                if (q) params.set('q', q)
                params.set('page', String(p))
                return `/movements?${params.toString()}`
              }}
            />
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: HISTÓRICO (tudo)
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'historico' && (
        <>
          {/* Search row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
            <Suspense fallback={<div style={{ height: 36, width: 300 }} />}>
              <HistorySearchInput initialValue={q ?? ''} tab="historico" dateFrom={dateFrom} dateTo={dateTo} />
            </Suspense>
          </div>

          {/* Date range filter */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
            padding: '12px 16px', borderRadius: 10,
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#2d4060', letterSpacing: '0.1em' }}>
              FILTRO AVANÇADO
            </span>
            <Suspense fallback={<div style={{ height: 32, width: 300 }} />}>
              <HistoryDateFilter tab="historico" q={q} dateFrom={dateFrom} dateTo={dateTo} />
            </Suspense>

            {/* Active filter pills */}
            {(q || dateFrom || dateTo) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginLeft: 'auto' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060' }}>
                  {histTotal} resultado{histTotal !== 1 ? 's' : ''}
                </span>
                {(q || dateFrom || dateTo) && (
                  <Link href="/movements?tab=historico" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 8px', borderRadius: 5,
                    background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.18)',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#f87171',
                    textDecoration: 'none',
                  }}>
                    Limpar filtros
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Table */}
          <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: HIST_GRID, columnGap: 8,
              padding: '0 20px', height: 38,
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.02)', alignItems: 'center',
            }}>
              {['TIPO','DATA','OBJETO','DETALHE','EXECUTOR'].map(h => (
                <div key={h} style={thStyle}>{h}</div>
              ))}
            </div>

            {histPageItems.length === 0 ? (
              <div style={{ padding: '60px 24px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#2d4060' }}>
                {(q || dateFrom || dateTo) ? '— nenhum resultado para os filtros aplicados —' : '— nenhum evento registrado —'}
              </div>
            ) : histPageItems.map((entry, i) => (
              <div key={entry.id} className="hover-row" style={{
                display: 'grid', gridTemplateColumns: HIST_GRID,
                columnGap: 8, padding: '14px 20px', alignItems: 'center',
                borderBottom: i < histPageItems.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                transition: 'background 0.1s',
              }}>
                {/* Type badge */}
                <div><TypeBadge cfg={entry.cfg} /></div>

                {/* Date */}
                <div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#4a6580' }}>
                    {formatDate(entry.date)}
                  </span>
                </div>

                {/* Subject */}
                <div style={{ minWidth: 0 }}>
                  {entry.subjectHref ? (
                    <Link href={entry.subjectHref} style={{ textDecoration: 'none' }}>
                      <span style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#00d9b8', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.subject1}
                      </span>
                      {entry.subject2 && (
                        <span style={{ display: 'block', fontSize: 11, color: '#7a9bbc', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {entry.subject2}
                        </span>
                      )}
                    </Link>
                  ) : (
                    <span style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#c8d6e5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.subject1}
                    </span>
                  )}
                  <span style={{
                    display: 'inline-block', marginTop: 3,
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 600,
                    padding: '1px 5px', borderRadius: 3,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                    color: '#3d5068', letterSpacing: '0.05em',
                  }}>
                    {entry.sourceLabel.toUpperCase()}
                  </span>
                </div>

                {/* Description */}
                <div style={{ minWidth: 0 }}>
                  <span style={{ fontSize: 12, color: '#8ba5c0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                    {entry.description}
                  </span>
                </div>

                {/* Actor */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <Avatar name={entry.actorName} />
                  <span style={{ fontSize: 12, color: '#8ba5c0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.actorName}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#1e3048' }}>
              Página {page} de {histTotalPages} · {histTotal} evento{histTotal !== 1 ? 's' : ''} no total
            </p>
            <PaginationBar page={page} totalPages={histTotalPages} buildHref={buildHistHref} />
          </div>
        </>
      )}
    </div>
  )
}

const thStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 9, fontWeight: 700,
  color: '#2d4060', letterSpacing: '0.08em',
  whiteSpace: 'nowrap',
}
