'use client'

import { useState, useEffect, useTransition } from 'react'
import { TicketRowModern } from '@/components/tickets/TicketRowModern'
import { TicketCardModern } from '@/components/tickets/TicketCardModern'
import { bulkAssignTickets, bulkUpdateTicketStatus } from '@/app/(app)/tickets/actions'

// ── Constants ────────────────────────────────────────────────
const PAGE_SIZE    = 25
const STORAGE_SORT = 'hd_tickets_sort'
const STORAGE_VIEW = 'hd_tickets_view'

// ── Types ────────────────────────────────────────────────────
export type SerializedTicket = {
  id: string; code: string; title: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'DONE' | 'CANCELED'
  categoryName: string; requesterName: string
  assigneeId?: string; assigneeName?: string; createdAt: string
}
type Technician = { id: string; name: string; role: string }

const STATUS_OPTIONS = [
  { value: 'OPEN',        label: 'Aberto' },
  { value: 'IN_PROGRESS', label: 'Em atendimento' },
  { value: 'ON_HOLD',     label: 'Aguardando' },
  { value: 'DONE',        label: 'Concluído' },
  { value: 'CANCELED',    label: 'Cancelado' },
]

// ── Icons ────────────────────────────────────────────────────
const ListIcon = () => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)
const GridIcon = () => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
)
const SortDescIcon = () => (
  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9M3 12h5m13 0l-4 4m0 0l-4-4m4 4V4" />
  </svg>
)
const SortAscIcon = () => (
  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9M3 12h5m0-8l4-4m0 0l4 4m-4-4v16" />
  </svg>
)
const ChevronLeft = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
)
const ChevronRight = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
)
const UserIcon = () => (
  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)
const TagIcon = () => (
  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
)
const XIcon = () => (
  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

// ── Helpers ──────────────────────────────────────────────────
function ls(k: string): string | null { try { return localStorage.getItem(k) } catch { return null } }
function lsSet(k: string, v: string) { try { localStorage.setItem(k, v) } catch {} }

function buildPageNums(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '…')[] = [1]
  if (current > 3) pages.push('…')
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p)
  if (current < total - 2) pages.push('…')
  pages.push(total)
  return pages
}

// ── Checkbox ─────────────────────────────────────────────────
function Checkbox({ checked, indeterminate = false, onChange }: {
  checked: boolean; indeterminate?: boolean; onChange: () => void
}) {
  return (
    <div
      onClick={e => { e.stopPropagation(); e.preventDefault(); onChange() }}
      style={{
        width: 16, height: 16, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
        border: checked || indeterminate ? '1.5px solid #00d9b8' : '1.5px solid rgba(255,255,255,0.15)',
        background: checked ? '#00d9b8' : indeterminate ? 'rgba(0,217,184,0.25)' : 'rgba(255,255,255,0.03)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.12s',
      }}
    >
      {checked && (
        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#0d1422" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
      {!checked && indeterminate && (
        <div style={{ width: 8, height: 2, background: '#00d9b8', borderRadius: 1 }} />
      )}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────
interface Props {
  tickets: SerializedTicket[]
  technicians: Technician[]
}

export default function TicketsListView({ tickets, technicians }: Props) {
  const [sort, setSort]           = useState<'newest' | 'oldest'>('newest')
  const [view, setView]           = useState<'list' | 'cards'>('list')
  const [page, setPage]           = useState(1)
  const [hydrated, setHydrated]   = useState(false)

  // Selection
  const [selected, setSelected]   = useState<Set<string>>(new Set())

  // Bulk action panel
  const [bulkPanel, setBulkPanel]       = useState<'assign' | 'status' | null>(null)
  const [bulkAssignId, setBulkAssignId] = useState('')
  const [bulkStatus, setBulkStatus]     = useState('')
  const [isPending, startTransition]    = useTransition()

  // ── Hydrate prefs from localStorage ────────────────────
  useEffect(() => {
    const savedSort = ls(STORAGE_SORT)
    const savedView = ls(STORAGE_VIEW)
    if (savedSort === 'oldest') setSort('oldest')
    if (savedView === 'cards')  setView('cards')
    setHydrated(true)
  }, [])

  // Reset page & selection when tickets change
  useEffect(() => { setPage(1); setSelected(new Set()) }, [tickets])

  const handleSort = (v: 'newest' | 'oldest') => { setSort(v); lsSet(STORAGE_SORT, v); setPage(1) }
  const handleView = (v: 'list' | 'cards')    => { setView(v); lsSet(STORAGE_VIEW, v); setPage(1) }

  // ── Sort + paginate ────────────────────────────────────
  const sorted = [...tickets].sort((a, b) => {
    const d = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    return sort === 'newest' ? -d : d
  })
  const totalPages  = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage    = Math.min(page, totalPages)
  const pageItems   = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // ── Selection helpers ──────────────────────────────────
  const toggle = (id: string) => setSelected(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n
  })
  const allPageSelected  = pageItems.length > 0 && pageItems.every(t => selected.has(t.id))
  const somePageSelected = pageItems.some(t => selected.has(t.id)) && !allPageSelected

  const togglePageAll = () => {
    const ids = pageItems.map(t => t.id)
    setSelected(prev => {
      const n = new Set(prev)
      if (allPageSelected) ids.forEach(id => n.delete(id))
      else ids.forEach(id => n.add(id))
      return n
    })
  }
  const clearSelection = () => { setSelected(new Set()); setBulkPanel(null) }

  // ── Bulk actions ───────────────────────────────────────
  const execAssign = () => {
    if (!bulkAssignId) return
    startTransition(async () => {
      await bulkAssignTickets(
        Array.from(selected),
        bulkAssignId === '__remove__' ? null : bulkAssignId,
      )
      clearSelection()
    })
  }

  const execStatus = () => {
    if (!bulkStatus) return
    startTransition(async () => {
      await bulkUpdateTicketStatus(Array.from(selected), bulkStatus)
      clearSelection()
    })
  }

  if (!hydrated) return null

  const isCards = view === 'cards'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* ── Controls row: sort + view ─────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>

        {/* Sort */}
        <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, overflow: 'hidden' }}>
          {([
            { label: 'Mais recente', val: 'newest' as const, Icon: SortDescIcon },
            { label: 'Mais antigo',  val: 'oldest' as const, Icon: SortAscIcon  },
          ]).map(({ label, val, Icon }) => (
            <button key={val} onClick={() => handleSort(val)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px',
              background: sort === val ? 'rgba(0,217,184,0.1)' : 'transparent',
              color: sort === val ? '#00d9b8' : '#3d5068',
              border: 'none', borderRight: val === 'newest' ? '1px solid rgba(255,255,255,0.07)' : 'none',
              cursor: 'pointer', fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
              transition: 'background 0.12s, color 0.12s',
            }}>
              <Icon /> {label}
            </button>
          ))}
        </div>

        {/* View */}
        <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, overflow: 'hidden' }}>
          {([
            { val: 'list'  as const, Icon: ListIcon, title: 'Lista' },
            { val: 'cards' as const, Icon: GridIcon, title: 'Cards' },
          ]).map(({ val, Icon, title }) => (
            <button key={val} onClick={() => handleView(val)} title={title} style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 34, height: 34,
              background: view === val ? 'rgba(0,217,184,0.1)' : 'transparent',
              color: view === val ? '#00d9b8' : '#3d5068',
              border: 'none', borderRight: val === 'list' ? '1px solid rgba(255,255,255,0.07)' : 'none',
              cursor: 'pointer', transition: 'background 0.12s, color 0.12s',
            }}>
              <Icon />
            </button>
          ))}
        </div>
      </div>

      {/* ── Bulk action bar ───────────────────────────────── */}
      {selected.size > 0 && (
        <div style={{
          background: '#0a1628',
          border: '1px solid rgba(0,217,184,0.3)',
          borderRadius: 10, padding: '10px 16px',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: '#00d9b8',
              background: 'rgba(0,217,184,0.1)', border: '1px solid rgba(0,217,184,0.25)',
              padding: '3px 12px', borderRadius: 20,
            }}>
              {selected.size} selecionado{selected.size > 1 ? 's' : ''}
            </span>

            <button onClick={() => setBulkPanel(bulkPanel === 'assign' ? null : 'assign')} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: bulkPanel === 'assign' ? 'rgba(0,217,184,0.12)' : 'rgba(255,255,255,0.04)',
              border: bulkPanel === 'assign' ? '1px solid rgba(0,217,184,0.4)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6, padding: '6px 14px', color: bulkPanel === 'assign' ? '#00d9b8' : '#94a3b8',
              cursor: 'pointer', fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
            }}>
              <UserIcon /> Atribuir técnico
            </button>

            <button onClick={() => setBulkPanel(bulkPanel === 'status' ? null : 'status')} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: bulkPanel === 'status' ? 'rgba(0,217,184,0.12)' : 'rgba(255,255,255,0.04)',
              border: bulkPanel === 'status' ? '1px solid rgba(0,217,184,0.4)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6, padding: '6px 14px', color: bulkPanel === 'status' ? '#00d9b8' : '#94a3b8',
              cursor: 'pointer', fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
            }}>
              <TagIcon /> Alterar status
            </button>

            <button onClick={clearSelection} style={{
              marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'none', border: 'none', color: '#3d5068',
              cursor: 'pointer', fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
            }}>
              <XIcon /> Desmarcar
            </button>
          </div>

          {/* Assign panel */}
          {bulkPanel === 'assign' && (
            <div style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 8, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
            }}>
              <select
                value={bulkAssignId}
                onChange={e => setBulkAssignId(e.target.value)}
                style={{
                  flex: 1, minWidth: 200,
                  background: '#0d1422', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6, padding: '7px 12px', color: '#e2eaf4', fontSize: 13,
                  fontFamily: "'JetBrains Mono', monospace", outline: 'none',
                }}
              >
                <option value="">— Selecionar técnico —</option>
                <option value="__remove__">Remover atribuição</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.role === 'ADMIN' ? 'Admin' : 'Técnico'})</option>
                ))}
              </select>
              <button
                onClick={execAssign}
                disabled={!bulkAssignId || isPending}
                style={{
                  background: bulkAssignId && !isPending ? 'rgba(0,217,184,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${bulkAssignId && !isPending ? 'rgba(0,217,184,0.4)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 6, padding: '7px 18px',
                  color: bulkAssignId && !isPending ? '#00d9b8' : '#3d5068',
                  cursor: bulkAssignId && !isPending ? 'pointer' : 'not-allowed',
                  fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                }}
              >
                {isPending ? 'Aplicando…' : 'Aplicar'}
              </button>
            </div>
          )}

          {/* Status panel */}
          {bulkPanel === 'status' && (
            <div style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 8, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setBulkStatus(opt.value)}
                    style={{
                      padding: '5px 14px', borderRadius: 20,
                      border: bulkStatus === opt.value ? '1px solid rgba(0,217,184,0.5)' : '1px solid rgba(255,255,255,0.08)',
                      background: bulkStatus === opt.value ? 'rgba(0,217,184,0.12)' : 'rgba(255,255,255,0.03)',
                      color: bulkStatus === opt.value ? '#00d9b8' : '#7a9bbc',
                      cursor: 'pointer', fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button
                onClick={execStatus}
                disabled={!bulkStatus || isPending}
                style={{
                  background: bulkStatus && !isPending ? 'rgba(0,217,184,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${bulkStatus && !isPending ? 'rgba(0,217,184,0.4)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 6, padding: '7px 18px',
                  color: bulkStatus && !isPending ? '#00d9b8' : '#3d5068',
                  cursor: bulkStatus && !isPending ? 'pointer' : 'not-allowed',
                  fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                }}
              >
                {isPending ? 'Aplicando…' : 'Aplicar'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────── */}
      {pageItems.length === 0 && (
        <div style={{
          padding: '60px 24px', textAlign: 'center',
          color: '#2d4060', fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
        }}>
          — nenhum chamado encontrado —
        </div>
      )}

      {/* ── List view ─────────────────────────────────────── */}
      {pageItems.length > 0 && !isCards && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Column header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <div style={{ width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Checkbox checked={allPageSelected} indeterminate={somePageSelected} onChange={togglePageAll} />
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 20px 0 3px', gap: 20 }}>
              <div style={{ flexShrink: 0, width: 76 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060', letterSpacing: '0.08em' }}>#ID</span>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060', letterSpacing: '0.08em' }}>TÍTULO</span>
              </div>
              <div style={{ flexShrink: 0, width: 140 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060', letterSpacing: '0.08em' }}>TÉCNICO</span>
              </div>
              <div style={{ flexShrink: 0, width: 120 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060', letterSpacing: '0.08em' }}>STATUS</span>
              </div>
            </div>
          </div>

          {/* Rows */}
          {pageItems.map(t => (
            <div
              key={t.id}
              style={{
                display: 'flex', alignItems: 'stretch',
                borderRadius: 10, overflow: 'hidden',
                outline: selected.has(t.id) ? '1px solid rgba(0,217,184,0.25)' : '1px solid transparent',
                transition: 'outline 0.12s',
              }}
            >
              <div
                onClick={() => toggle(t.id)}
                style={{
                  width: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: selected.has(t.id) ? 'rgba(0,217,184,0.05)' : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer', transition: 'background 0.12s',
                  borderRight: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <Checkbox checked={selected.has(t.id)} onChange={() => toggle(t.id)} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <TicketRowModern
                  id={t.id} code={t.code} title={t.title}
                  requesterName={t.requesterName}
                  priority={t.priority} status={t.status}
                  assigneeId={t.assigneeId} assigneeName={t.assigneeName}
                  createdAt={new Date(t.createdAt)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Cards view ─────────────────────────────────────── */}
      {pageItems.length > 0 && isCards && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {pageItems.map(t => (
            <div key={t.id} style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
              {/* Checkbox side column */}
              <div
                onClick={() => toggle(t.id)}
                style={{
                  width: 28, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: selected.has(t.id) ? 'rgba(0,217,184,0.05)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${selected.has(t.id) ? 'rgba(0,217,184,0.25)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 8, cursor: 'pointer', transition: 'all 0.12s',
                }}
              >
                <Checkbox checked={selected.has(t.id)} onChange={() => toggle(t.id)} />
              </div>
              {/* Card */}
              <div style={{
                flex: 1, minWidth: 0,
                outline: selected.has(t.id) ? '2px solid rgba(0,217,184,0.3)' : '2px solid transparent',
                borderRadius: 9, transition: 'outline 0.12s',
              }}>
                <TicketCardModern
                  id={t.id} code={t.code} title={t.title}
                  priority={t.priority} status={t.status}
                  categoryName={t.categoryName}
                  requesterName={t.requesterName}
                  assigneeName={t.assigneeName}
                  createdAt={new Date(t.createdAt)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ─────────────────────────────────────── */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)',
          flexWrap: 'wrap', gap: 10,
        }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#3d5068' }}>
            Página {safePage} de {totalPages} · {sorted.length} chamados
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {/* Prev */}
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 30, height: 30, borderRadius: 6,
                background: 'transparent', border: '1px solid rgba(255,255,255,0.07)',
                color: safePage === 1 ? '#2d4060' : '#7a9bbc',
                cursor: safePage === 1 ? 'not-allowed' : 'pointer',
              }}
            >
              <ChevronLeft />
            </button>

            {/* Page numbers */}
            {buildPageNums(safePage, totalPages).map((p, i) =>
              p === '…' ? (
                <span key={`ellipsis-${i}`} style={{
                  width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#2d4060',
                }}>…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  style={{
                    width: 30, height: 30, borderRadius: 6,
                    background: p === safePage ? 'rgba(0,217,184,0.12)' : 'transparent',
                    border: `1px solid ${p === safePage ? 'rgba(0,217,184,0.35)' : 'rgba(255,255,255,0.07)'}`,
                    color: p === safePage ? '#00d9b8' : '#7a9bbc',
                    cursor: 'pointer', fontSize: 11,
                    fontFamily: "'JetBrains Mono', monospace", fontWeight: p === safePage ? 700 : 400,
                  }}
                >
                  {p}
                </button>
              )
            )}

            {/* Next */}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 30, height: 30, borderRadius: 6,
                background: 'transparent', border: '1px solid rgba(255,255,255,0.07)',
                color: safePage === totalPages ? '#2d4060' : '#7a9bbc',
                cursor: safePage === totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
