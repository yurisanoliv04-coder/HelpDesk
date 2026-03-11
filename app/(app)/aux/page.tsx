import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

const priorityConfig = {
  LOW:    { label: 'Baixa',   color: '#475569' },
  MEDIUM: { label: 'Média',   color: '#fbbf24' },
  HIGH:   { label: 'Alta',    color: '#fb923c' },
  URGENT: { label: 'Urgente', color: '#f87171' },
}

const statusConfig = {
  OPEN:        { label: 'Aberto',       color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  IN_PROGRESS: { label: 'Em andamento', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  ON_HOLD:     { label: 'Aguardando',   color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  DONE:        { label: 'Concluído',    color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  CANCELED:    { label: 'Cancelado',    color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
}

const roleLabel: Record<string, string> = {
  COLABORADOR:  'Colaborador',
  AUXILIAR_TI:  'Aux. T.I.',
  TECNICO:      'Técnico',
  ADMIN:        'Admin',
}

function shortCode(code: string): string {
  return `#${parseInt(code.split('-').pop() ?? '0', 10)}`
}

function avatarColor(name: string): { bg: string; text: string } {
  const palettes = [
    { bg: 'rgba(0,217,184,0.18)',   text: '#00d9b8' },
    { bg: 'rgba(96,165,250,0.18)',  text: '#60a5fa' },
    { bg: 'rgba(167,139,250,0.18)', text: '#a78bfa' },
    { bg: 'rgba(251,191,36,0.18)',  text: '#fbbf24' },
    { bg: 'rgba(248,113,113,0.18)', text: '#f87171' },
    { bg: 'rgba(52,211,153,0.18)',  text: '#34d399' },
    { bg: 'rgba(251,146,60,0.18)',  text: '#fb923c' },
    { bg: 'rgba(244,114,182,0.18)', text: '#f472b6' },
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffff
  return palettes[hash % palettes.length]
}

export default async function AuxPage() {
  const session = await auth()
  if (!session) redirect('/login')
  if (session.user.role !== 'AUXILIAR_TI') redirect('/dashboard')

  const userId = session.user.id!
  const deptId = session.user.departmentId

  const [openCount, inProgressCount, doneCount, recentTickets, deptUsers] = await Promise.all([
    prisma.ticket.count({
      where: { openedById: userId, status: 'OPEN' },
    }),
    prisma.ticket.count({
      where: { openedById: userId, status: 'IN_PROGRESS' },
    }),
    prisma.ticket.count({
      where: { openedById: userId, status: { in: ['DONE', 'CANCELED'] } },
    }),
    prisma.ticket.findMany({
      where: { openedById: userId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        code: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true,
        requester: { select: { name: true } },
        assignee:  { select: { name: true } },
        category:  { select: { name: true, icon: true } },
      },
    }),
    // Dept members with their deployed assets
    deptId
      ? prisma.user.findMany({
          where: { departmentId: deptId, active: true },
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            role: true,
            assignedAssets: {
              where: { status: 'DEPLOYED' },
              orderBy: [{ categoryId: 'asc' }, { tag: 'asc' }],
              select: {
                id: true, tag: true, name: true,
                category: { select: { name: true, icon: true } },
              },
            },
          },
        })
      : Promise.resolve([]),
  ])

  const totalOpened = openCount + inProgressCount + doneCount

  const stats = [
    {
      label: 'Abertos',
      value: openCount,
      icon: (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#60a5fa" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      color: '#60a5fa',
      bg: 'rgba(96,165,250,0.06)',
      border: 'rgba(96,165,250,0.15)',
    },
    {
      label: 'Em andamento',
      value: inProgressCount,
      icon: (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fbbf24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: '#fbbf24',
      bg: 'rgba(251,191,36,0.06)',
      border: 'rgba(251,191,36,0.15)',
    },
    {
      label: 'Concluídos',
      value: doneCount,
      icon: (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#34d399" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: '#34d399',
      bg: 'rgba(52,211,153,0.06)',
      border: 'rgba(52,211,153,0.15)',
    },
    {
      label: 'Total enviados',
      value: totalOpened,
      icon: (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#00d9b8" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: '#00d9b8',
      bg: 'rgba(0,217,184,0.06)',
      border: 'rgba(0,217,184,0.15)',
    },
  ]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
            color: '#3d5068', letterSpacing: '0.08em', marginBottom: 6,
          }}>
            {greeting().toUpperCase()} · AUXILIAR T.I.
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#e2eaf4', lineHeight: 1.2 }}>
            Olá, {session.user.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ fontSize: 13, color: '#4a6580', marginTop: 6 }}>
            Gerencie os chamados do seu departamento por aqui.
          </p>
        </div>

        <Link
          href="/tickets/new"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '11px 22px', borderRadius: 10,
            background: 'rgba(0,217,184,0.12)',
            border: '1px solid rgba(0,217,184,0.3)',
            fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
            color: '#00d9b8', textDecoration: 'none',
            whiteSpace: 'nowrap', flexShrink: 0,
            boxShadow: '0 0 20px rgba(0,217,184,0.08)',
          }}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Novo chamado
        </Link>
      </div>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 12,
              padding: '18px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 9,
              background: s.bg, border: `1px solid ${s.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {s.icon}
            </div>
            <div>
              <p style={{ fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1 }}>
                {s.value}
              </p>
              <p style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                color: '#3d5068', marginTop: 4, fontWeight: 600, letterSpacing: '0.04em',
              }}>
                {s.label.toUpperCase()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Two-column body ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

        {/* ── LEFT: Recent Tickets ─────────────────────────────── */}
        <div style={{
          background: '#0d1422',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#3d5068" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                fontWeight: 700, color: '#3d5068', letterSpacing: '0.08em',
              }}>
                MEUS CHAMADOS RECENTES
              </span>
            </div>
            <Link
              href="/tickets"
              style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                color: '#00d9b8', textDecoration: 'none',
              }}
            >
              ver todos →
            </Link>
          </div>

          {recentTickets.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#3d5068' }}>
                Nenhum chamado aberto ainda.
              </p>
              <Link
                href="/tickets/new"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12,
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700,
                  color: '#00d9b8', textDecoration: 'none',
                }}
              >
                Abrir primeiro chamado →
              </Link>
            </div>
          ) : (
            <div>
              {recentTickets.map((ticket, i) => {
                const sc = statusConfig[ticket.status as keyof typeof statusConfig]
                const pc = priorityConfig[ticket.priority as keyof typeof priorityConfig]
                return (
                  <Link
                    key={ticket.id}
                    href={`/tickets/${ticket.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '14px 20px',
                      borderBottom: i < recentTickets.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      textDecoration: 'none',
                    }}
                  >
                    {/* Priority bar */}
                    <div style={{
                      width: 4, height: 36, borderRadius: 2,
                      background: pc.color, flexShrink: 0,
                    }} />

                    {/* Category icon */}
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, flexShrink: 0,
                    }}>
                      {ticket.category.icon ?? '📋'}
                    </div>

                    {/* Main info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060' }}>
                          {shortCode(ticket.code)}
                        </span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#1e3048' }}>
                          {ticket.category.name}
                        </span>
                        {ticket.requester && (
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#1e3048' }}>
                            · {ticket.requester.name.split(' ')[0]}
                          </span>
                        )}
                      </div>
                      <p style={{
                        fontSize: 13, color: '#94a3b8', fontWeight: 500,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {ticket.title}
                      </p>
                    </div>

                    {/* Right meta */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{
                        padding: '3px 9px', borderRadius: 6,
                        background: sc.bg, marginBottom: 4,
                        display: 'inline-block',
                      }}>
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                          fontWeight: 700, color: sc.color,
                        }}>
                          {sc.label.toUpperCase()}
                        </span>
                      </div>
                      <p style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                        color: '#1e3048',
                      }}>
                        {formatDistanceToNow(ticket.createdAt, { locale: ptBR, addSuffix: true })}
                      </p>
                    </div>

                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#2d4060" strokeWidth={2} style={{ flexShrink: 0 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* ── RIGHT: Dept Members + Assets ─────────────────────── */}
        <div style={{
          background: '#0d1422',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 18px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#3d5068" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
              fontWeight: 700, color: '#3d5068', letterSpacing: '0.08em',
            }}>
              COLABORADORES · EQUIPAMENTOS
            </span>
          </div>

          {deptUsers.length === 0 ? (
            <div style={{ padding: '32px 18px', textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: '#2d4060' }}>Nenhum colaborador encontrado.</p>
            </div>
          ) : (
            <div>
              {deptUsers.map((u, i) => {
                const av = avatarColor(u.name)
                const initials = u.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                return (
                  <div
                    key={u.id}
                    style={{
                      padding: '14px 18px',
                      borderBottom: i < deptUsers.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    }}
                  >
                    {/* User row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: u.assignedAssets.length > 0 ? 10 : 0 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: av.bg,
                        border: `1px solid ${av.text}33`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 11, fontWeight: 700, color: av.text,
                        }}>
                          {initials}
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: 13, fontWeight: 600, color: '#94a3b8',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {u.name}
                          {u.id === userId && (
                            <span style={{
                              fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                              color: '#00d9b8', marginLeft: 6,
                            }}>você</span>
                          )}
                        </p>
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                          color: '#2d4060',
                        }}>
                          {roleLabel[u.role] ?? u.role}
                        </span>
                      </div>
                      {/* Quick new ticket for this person */}
                      <Link
                        href="/tickets/new"
                        title={`Abrir chamado para ${u.name.split(' ')[0]}`}
                        style={{
                          width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                          background: 'rgba(0,217,184,0.07)',
                          border: '1px solid rgba(0,217,184,0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          textDecoration: 'none',
                        }}
                      >
                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="#00d9b8" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </Link>
                    </div>

                    {/* Assets */}
                    {u.assignedAssets.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, paddingLeft: 44 }}>
                        {u.assignedAssets.map(asset => (
                          <div
                            key={asset.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              padding: '4px 8px', borderRadius: 6,
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.07)',
                            }}
                          >
                            {asset.category.icon && (
                              <span style={{ fontSize: 11, lineHeight: 1 }}>{asset.category.icon}</span>
                            )}
                            <span style={{
                              fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                              color: '#4a6580', fontWeight: 600,
                            }}>
                              {asset.tag}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {u.assignedAssets.length === 0 && (
                      <p style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                        color: '#1e3048', paddingLeft: 44, fontStyle: 'italic',
                      }}>
                        sem equipamentos
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
