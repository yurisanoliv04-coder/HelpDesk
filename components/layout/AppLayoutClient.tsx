'use client'

import { useState, useEffect } from 'react'
import { UserRole } from '@prisma/client'
import Sidebar from './Sidebar'
import SearchModal from './SearchModal'
import SystemConfigModal from './SystemConfigModal'
import type { SystemIdentity } from '@/app/(app)/settings/system-actions'

interface Props {
  userName: string
  userRole: UserRole
  userInitials: string
  systemName: string
  companyName: string
  systemLogo: string | null
  children: React.ReactNode
}

export const SIDEBAR_EXPANDED = 228
export const SIDEBAR_COLLAPSED = 60

export default function AppLayoutClient({ userName, userRole, userInitials, systemName, companyName, systemLogo, children }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [systemConfigOpen, setSystemConfigOpen] = useState(false)

  // Identity can be updated live after saving in the modal (without full reload)
  const [identity, setIdentity] = useState<SystemIdentity>({ systemName, companyName, systemLogo })

  // Sync if server-side props change (e.g. after router.refresh())
  useEffect(() => {
    setIdentity({ systemName, companyName, systemLogo })
  }, [systemName, companyName, systemLogo])

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed') === 'true'
    setCollapsed(stored)
    setMounted(true)
  }, [])

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar-collapsed', String(next))
  }

  const sidebarW = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED

  return (
    <>
      <Sidebar
        userName={userName}
        userRole={userRole}
        userInitials={userInitials}
        collapsed={collapsed}
        onToggle={toggle}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenSystemConfig={() => setSystemConfigOpen(true)}
        systemName={identity.systemName}
        companyName={identity.companyName}
        systemLogo={identity.systemLogo}
      />
      <main
        style={{
          flex: 1,
          marginLeft: mounted ? sidebarW : SIDEBAR_EXPANDED,
          padding: '28px 32px',
          minHeight: '100vh',
          background: 'var(--bg-base)',
          transition: 'margin-left 0.22s ease',
        }}
      >
        {children}
      </main>
      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onOpen={() => setSearchOpen(true)}
        userRole={userRole}
      />
      {userRole === 'ADMIN' && (
        <SystemConfigModal
          open={systemConfigOpen}
          onClose={() => setSystemConfigOpen(false)}
          onIdentitySaved={data => setIdentity(data)}
        />
      )}
    </>
  )
}
