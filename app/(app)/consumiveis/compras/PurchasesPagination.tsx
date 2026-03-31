'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'

interface Props {
  page: number
  totalPages: number
  total: number
  pageSize: number
}

export default function PurchasesPagination({ page, totalPages, total, pageSize }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  if (totalPages <= 1) return null

  function goTo(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (p === 1) {
      params.delete('page')
    } else {
      params.set('page', String(p))
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  // Build page number list with ellipsis
  function getPages(): (number | '…')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | '…')[] = [1]
    if (page > 3) pages.push('…')
    const start = Math.max(2, page - 1)
    const end   = Math.min(totalPages - 1, page + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (page < totalPages - 2) pages.push('…')
    pages.push(totalPages)
    return pages
  }

  const from = (page - 1) * pageSize + 1
  const to   = Math.min(page * pageSize, total)

  const btnBase: React.CSSProperties = {
    minWidth: 34,
    height: 34,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    border: '1px solid var(--border)',
    background: 'var(--bg-elevated)',
    color: 'var(--text-muted)',
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
    cursor: 'pointer',
    transition: 'all 0.1s',
    padding: '0 8px',
    opacity: isPending ? 0.6 : 1,
  }

  const btnActive: React.CSSProperties = {
    ...btnBase,
    background: 'var(--accent-cyan-dim)',
    border: '1px solid var(--accent-cyan)',
    color: 'var(--accent-cyan)',
    fontWeight: 700,
  }

  const btnDisabled: React.CSSProperties = {
    ...btnBase,
    opacity: 0.3,
    cursor: 'default',
    pointerEvents: 'none',
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 4px',
      flexWrap: 'wrap',
      gap: 12,
    }}>
      {/* Left: record range info */}
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        color: 'var(--text-dim)',
      }}>
        Exibindo{' '}
        <span style={{ color: 'var(--text-muted)' }}>{from}–{to}</span>
        {' '}de{' '}
        <span style={{ color: 'var(--text-muted)' }}>{total}</span>
        {' '}registros
      </span>

      {/* Right: page buttons */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {/* Prev */}
        <button
          style={page === 1 ? btnDisabled : btnBase}
          onClick={() => goTo(page - 1)}
          disabled={page === 1 || isPending}
          title="Página anterior"
          onMouseEnter={e => { if (page > 1) { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; e.currentTarget.style.color = 'var(--accent-cyan)' } }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Page numbers */}
        {getPages().map((p, i) =>
          p === '…' ? (
            <span
              key={`ellipsis-${i}`}
              style={{ ...btnBase, cursor: 'default', pointerEvents: 'none', background: 'transparent', border: 'none', color: 'var(--text-dim)' }}
            >
              …
            </span>
          ) : (
            <button
              key={p}
              style={p === page ? btnActive : btnBase}
              onClick={() => goTo(p as number)}
              disabled={isPending}
              onMouseEnter={e => { if (p !== page) { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; e.currentTarget.style.color = 'var(--accent-cyan)' } }}
              onMouseLeave={e => { if (p !== page) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' } }}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          style={page === totalPages ? btnDisabled : btnBase}
          onClick={() => goTo(page + 1)}
          disabled={page === totalPages || isPending}
          title="Próxima página"
          onMouseEnter={e => { if (page < totalPages) { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; e.currentTarget.style.color = 'var(--accent-cyan)' } }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  )
}
