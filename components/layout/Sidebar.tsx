'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { UserRole } from '@prisma/client'
import { useTheme } from '@/lib/context/theme'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  roles?: UserRole[]
}

const NavIcon = ({ d, size = 17 }: { d: string; size?: number }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
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
  },
  {
    href: '/movements',
    label: 'Movimentações',
    icon: <NavIcon d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />,
    roles: ['TECNICO', 'ADMIN'],
  },
  {
    href: '/people',
    label: 'Pessoas',
    icon: <NavIcon d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
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
}

export default function Sidebar({ userName, userRole, userInitials }: SidebarProps) {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(userRole),
  )

  return (
    <aside
      style={{
        width: 'var(--sidebar-w)',
        background: '#080d18',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
      className="fixed inset-y-0 left-0 flex flex-col z-30"
    >
      {/* ── Logo ───────────────────────────────────────────── */}
      <div
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        className="px-4 py-4 flex items-center gap-3"
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #00d9b8 0%, #0ea5e9 100%)',
            boxShadow: '0 0 16px rgba(0,217,184,0.35)',
          }}
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <div>
          <p style={{ color: '#e2e8f0', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 14, lineHeight: 1 }}>
            HelpDesk
          </p>
          <p style={{ color: '#3d5068', fontSize: 11, marginTop: 3, fontFamily: "'JetBrains Mono', monospace" }}>
            v2.0 · Itamarathy
          </p>
        </div>
      </div>

      {/* ── Section label ──────────────────────────────────── */}
      <div className="px-4 pt-5 pb-1">
        <span style={{ color: '#2d4060', fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.12em', fontWeight: 600 }}>
          NAVEGAÇÃO
        </span>
      </div>

      {/* ── Nav ────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-2 pb-4" aria-label="Navegação principal">
        <ul className="space-y-0.5">
          {visibleItems.map((item, i) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`row-in flex items-center gap-3 px-3 py-2 rounded-r-md transition-all duration-150 group ${
                    isActive ? 'nav-active' : ''
                  }`}
                  style={{
                    animationDelay: `${i * 40}ms`,
                    borderLeft: isActive ? '2px solid #00d9b8' : '2px solid transparent',
                    color: isActive ? '#00d9b8' : '#64748b',
                    background: isActive ? 'rgba(0,217,184,0.07)' : 'transparent',
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
                  <span style={{ opacity: isActive ? 1 : 0.7 }}>{item.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: isActive ? 500 : 400, letterSpacing: '0.01em' }}>
                    {item.label}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* ── Footer ─────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} className="p-3 space-y-3">

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 10px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(255,255,255,0.03)',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
        >
          {theme === 'dark' ? (
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
          <span>{theme === 'dark' ? 'Modo claro' : 'Modo escuro'}</span>
        </button>

        {/* User card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 10px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <div
            style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg, #1e3a4a 0%, #0d2235 100%)',
              border: `1px solid ${roleTextColor[userRole]}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: roleTextColor[userRole] }}>
              {userInitials}
            </span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userName}
            </p>
            <span style={{
              display: 'inline-block',
              fontSize: 11,
              padding: '1px 6px',
              borderRadius: 3,
              fontFamily: "'JetBrains Mono', monospace",
              background: roleBadgeColor[userRole],
              color: roleTextColor[userRole],
              marginTop: 2,
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
      </div>
    </aside>
  )
}
