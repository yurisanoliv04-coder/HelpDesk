import Link from 'next/link'

export function PaginationBar({
  page,
  totalPages,
  buildHref,
}: {
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

  const btnBase: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 30, height: 30, borderRadius: 6,
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
    textDecoration: 'none', fontSize: 14, transition: 'all 0.1s',
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
      <Link
        href={buildHref(page - 1)}
        aria-disabled={page <= 1}
        style={{ ...btnBase, color: page <= 1 ? '#1e3048' : '#4a6580', pointerEvents: page <= 1 ? 'none' : 'auto' }}
      >
        ‹
      </Link>

      {pages.map(p => (
        <Link
          key={p}
          href={buildHref(p)}
          style={{
            ...btnBase,
            background: p === page ? 'rgba(0,217,184,0.12)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${p === page ? 'rgba(0,217,184,0.35)' : 'rgba(255,255,255,0.07)'}`,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
            color: p === page ? '#00d9b8' : '#4a6580',
            fontWeight: p === page ? 700 : 400,
          }}
        >
          {p}
        </Link>
      ))}

      <Link
        href={buildHref(page + 1)}
        aria-disabled={page >= totalPages}
        style={{ ...btnBase, color: page >= totalPages ? '#1e3048' : '#4a6580', pointerEvents: page >= totalPages ? 'none' : 'auto' }}
      >
        ›
      </Link>
    </div>
  )
}
