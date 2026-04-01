'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { UserRole } from '@prisma/client'
import { SIDEBAR_COLLAPSED, SIDEBAR_EXPANDED } from './AppLayoutClient'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  roles?: UserRole[]
  subItems?: { href: string; label: string; roles?: UserRole[] }[]
}

const NavIcon = ({ d, size = 17 }: { d: string; size?: number }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
)

const navItems: NavItem[] = [
  {
    href: '/aux',
    label: 'Início',
    icon: <NavIcon d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    roles: ['AUXILIAR_TI'],
  },
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: <NavIcon d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    roles: ['TECNICO', 'ADMIN'],
  },
  {
    href: '/tickets',
    label: 'Chamados',
    icon: <NavIcon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
  },
  {
    href: '/assets',
    label: 'Patrimônio',
    icon: <NavIcon d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />,
    roles: ['TECNICO', 'ADMIN'],
    subItems: [
      { href: '/assets/models', label: 'Modelos', roles: ['TECNICO', 'ADMIN'] },
    ],
  },
  {
    href: '/consumiveis',
    label: 'Acessórios',
    icon: <NavIcon d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />,
    roles: ['TECNICO', 'ADMIN'],
  },
  {
    href: '/movements',
    label: 'Movimentações',
    icon: <NavIcon d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />,
    roles: ['TECNICO', 'ADMIN'],
  },
  {
    href: '/reports',
    label: 'Relatórios',
    icon: <NavIcon d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
    roles: ['TECNICO', 'ADMIN'],
  },
  {
    href: '/settings',
    label: 'Configurações',
    icon: <NavIcon d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />,
    roles: ['ADMIN'],
  },
]

const roleLabel: Record<UserRole, string> = {
  COLABORADOR: 'Colaborador',
  AUXILIAR_TI: 'Auxiliar TI',
  TECNICO: 'Técnico TI',
  ADMIN: 'Admin TI',
}

const roleBadgeColor: Record<UserRole, string> = {
  COLABORADOR: 'rgba(148,163,184,0.15)',
  AUXILIAR_TI: 'rgba(129,140,248,0.2)',
  TECNICO:     'rgba(0,217,184,0.15)',
  ADMIN:       'rgba(248,113,113,0.15)',
}
const roleTextColor: Record<UserRole, string> = {
  COLABORADOR: '#94a3b8',
  AUXILIAR_TI: '#818cf8',
  TECNICO:     '#00d9b8',
  ADMIN:       '#f87171',
}

interface SidebarProps {
  userName: string
  userRole: UserRole
  userInitials: string
  collapsed: boolean
  onToggle: () => void
  onOpenSearch: () => void
  onOpenSystemConfig?: () => void
  systemName?: string
  companyName?: string
  systemLogo?: string | null
}

export default function Sidebar({ userName, userRole, userInitials, collapsed, onToggle, onOpenSearch, onOpenSystemConfig, systemName = 'HelpDesk', companyName = 'Itamarathy', systemLogo }: SidebarProps) {
  const pathname = usePathname()

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(userRole),
  )

  const w = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED

  return (
    <aside
      style={{
        width: w,
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        transition: 'width 0.22s ease',
        overflow: 'hidden',
      }}
      className="fixed inset-y-0 left-0 flex flex-col z-30"
    >
      {/* ── Logo (clicável para ADMIN → abre config do sistema) ─── */}
      <div
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', minHeight: 57 }}
        className="px-3 py-4 flex items-center"
      >
        <button
          onClick={onOpenSystemConfig}
          title={collapsed ? `${systemName} — Configurações do sistema` : 'Configurações do sistema'}
          disabled={!onOpenSystemConfig}
          style={{
            display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10,
            background: 'none', border: 'none', padding: 0,
            cursor: onOpenSystemConfig ? 'pointer' : 'default',
            width: '100%', textAlign: 'left',
          }}
        >
          <div
            style={{
              background: systemLogo ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, var(--accent-cyan) 0%, #0ea5e9 100%)',
              boxShadow: systemLogo ? 'none' : '0 0 16px var(--accent-glow)',
              flexShrink: 0, width: 32, height: 32, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {systemLogo
              ? <img src={systemLogo} alt={systemName} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
              : <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            }
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <p style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 14, lineHeight: 1 }}>
                {systemName}
              </p>
              <p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 3, fontFamily: "'JetBrains Mono', monospace" }}>
                v2.0 · {companyName}
              </p>
            </div>
          )}
        </button>
      </div>

      {/* ── Search button ───────────────────────────────────── */}
      <div style={{ padding: collapsed ? '10px 8px 4px' : '10px 8px 4px' }}>
        <button
          onClick={onOpenSearch}
          title={collapsed ? 'Pesquisa (Ctrl+K)' : undefined}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: collapsed ? 0 : 8,
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '7px' : '7px 10px',
            borderRadius: 7,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            cursor: 'pointer',
            color: '#3d5068',
            transition: 'all 0.15s',
            boxSizing: 'border-box',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
            e.currentTarget.style.color = '#7e9bb5'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
            e.currentTarget.style.color = '#3d5068'
          }}
        >
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
          </svg>
          {!collapsed && (
            <>
              <span style={{ flex: 1, fontSize: 12, textAlign: 'left', fontFamily: "'JetBrains Mono', monospace" }}>
                Pesquisa…
              </span>
              <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '1px 5px' }}>
                Ctrl K
              </span>
            </>
          )}
        </button>
      </div>

      {/* ── Section label ──────────────────────────────────── */}
      {!collapsed && (
        <div className="px-4 pt-3 pb-1">
          <span style={{ color: '#2d4060', fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.12em', fontWeight: 600 }}>
            NAVEGAÇÃO
          </span>
        </div>
      )}
      {collapsed && <div style={{ height: 8 }} />}

      {/* ── Nav ────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto pb-4" style={{ padding: collapsed ? '0 6px' : '0 8px' }} aria-label="Navegação principal">
        <ul className="space-y-0.5">
          {visibleItems.map((item, i) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const visibleSubs = item.subItems?.filter(
              s => !s.roles || s.roles.includes(userRole)
            ) ?? []
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`row-in flex items-center rounded-md transition-all duration-150 group ${
                    isActive ? 'nav-active' : ''
                  }`}
                  style={{
                    animationDelay: `${i * 40}ms`,
                    borderLeft: isActive ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                    color: isActive ? 'var(--accent-cyan)' : '#64748b',
                    background: isActive ? 'var(--accent-cyan-dim)' : 'transparent',
                    padding: collapsed ? '8px 0' : '8px 10px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    gap: collapsed ? 0 : 10,
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#94a3b8'
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#64748b'
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  <span style={{ opacity: isActive ? 1 : 0.7, flexShrink: 0 }}>{item.icon}</span>
                  {!collapsed && (
                    <span style={{ fontSize: 14, fontWeight: isActive ? 500 : 400, letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>
                      {item.label}
                    </span>
                  )}
                </Link>

                {/* Sub-items — shown when parent is active and not collapsed */}
                {!collapsed && isActive && visibleSubs.length > 0 && (
                  <ul style={{ paddingLeft: 28, marginTop: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {visibleSubs.map(sub => {
                      const subActive = pathname === sub.href || pathname.startsWith(sub.href + '/')
                      return (
                        <li key={sub.href}>
                          <Link
                            href={sub.href}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 7,
                              padding: '5px 10px', borderRadius: 6,
                              fontSize: 12,
                              color: subActive ? '#00d9b8' : '#3d5068',
                              background: subActive ? 'rgba(0,217,184,0.06)' : 'transparent',
                              borderLeft: `2px solid ${subActive ? 'rgba(0,217,184,0.5)' : 'rgba(255,255,255,0.05)'}`,
                              textDecoration: 'none', transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { if (!subActive) { e.currentTarget.style.color = '#7e9bb5'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' } }}
                            onMouseLeave={e => { if (!subActive) { e.currentTarget.style.color = '#3d5068'; e.currentTarget.style.background = 'transparent' } }}
                          >
                            <svg width="8" height="8" viewBox="0 0 8 8" fill={subActive ? '#00d9b8' : '#3d5068'}>
                              <circle cx="4" cy="4" r="2.5" />
                            </svg>
                            {sub.label}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      {/* ── Footer ─────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: collapsed ? '10px 6px' : '10px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Toggle collapse button */}
        <button
          onClick={onToggle}
          title={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-end',
            padding: collapsed ? '6px' : '4px 6px',
            borderRadius: 6, background: 'none', border: '1px solid rgba(255,255,255,0.06)',
            cursor: 'pointer', color: '#2d4060', transition: 'all 0.15s',
            width: '100%',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#7e9bb5'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#2d4060'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
        >
          <svg
            width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.22s ease' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>

        {/* User card */}
        {collapsed ? (
          /* Collapsed: just avatar + logout stacked */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div
              title={`${userName} — ${roleLabel[userRole]}`}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, #1e3a4a 0%, #0d2235 100%)',
                border: `1px solid ${roleTextColor[userRole]}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                cursor: 'default',
              }}
            >
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: roleTextColor[userRole] }}>
                {userInitials}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              style={{ color: '#3d4f66', cursor: 'pointer', background: 'none', border: 'none', padding: 4, lineHeight: 0 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#3d4f66')}
              title="Sair"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        ) : (
          /* Expanded: full user card */
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <div
              style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'linear-gradient(135deg, #1e3a4a 0%, #0d2235 100%)',
                border: `1px solid ${roleTextColor[userRole]}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: roleTextColor[userRole] }}>
                {userInitials}
              </span>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userName}
              </p>
              <span style={{
                display: 'inline-block', fontSize: 11, padding: '1px 6px', borderRadius: 3,
                fontFamily: "'JetBrains Mono', monospace",
                background: roleBadgeColor[userRole], color: roleTextColor[userRole], marginTop: 2,
              }}>
                {roleLabel[userRole]}
              </span>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              style={{ color: '#3d4f66', cursor: 'pointer', background: 'none', border: 'none', padding: 4, flexShrink: 0, lineHeight: 0 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#3d4f66')}
              title="Sair"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
