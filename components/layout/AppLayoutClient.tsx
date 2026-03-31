'use client'

import { useState, useEffect } from 'react'
import { UserRole } from '@prisma/client'
import Sidebar from './Sidebar'
import SearchModal from './SearchModal'

interface Props {
  userName: string
  userRole: UserRole
  userInitials: string
  children: React.ReactNode
}

export const SIDEBAR_EXPANDED = 228
export const SIDEBAR_COLLAPSED = 60

export default function AppLayoutClient({ userName, userRole, userInitials, children }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

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
    </>
  )
}
