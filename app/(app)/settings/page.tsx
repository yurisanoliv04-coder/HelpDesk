import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import UsersTab from '@/components/settings/UsersTab'
import DepartmentsTab from '@/components/settings/DepartmentsTab'
import CategoriesTab from '@/components/settings/CategoriesTab'
import ScoringTab from '@/components/settings/ScoringTab'
import TicketSettingsTab from '@/components/settings/TicketSettingsTab'

const TABS = [
  { key: 'usuarios',      label: 'Usuários',          icon: '👥' },
  { key: 'departamentos', label: 'Departamentos',      icon: '🏢' },
  { key: 'chamados',      label: 'Config. Chamados',   icon: '🎫' },
  { key: 'scoring',       label: 'Pontuação',          icon: '📊' },
  { key: 'categorias',    label: 'Categorias',         icon: '🏷️' },
] as const
type TabKey = typeof TABS[number]['key']

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await auth()
  if (session?.user.role !== 'ADMIN') redirect('/dashboard')

  const { tab: rawTab } = await searchParams
  const activeTab: TabKey = TABS.some(t => t.key === rawTab) ? (rawTab as TabKey) : 'usuarios'

  // Load data for active tab
  const [
    users, departments, ticketCategories, assetCategories, slaPolices, totalAssets,
  ] = await Promise.all([
    activeTab === 'usuarios' ? prisma.user.findMany({
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
      select: {
        id: true, name: true, email: true, role: true, active: true,
        department: { select: { id: true, name: true } },
      },
    }) : Promise.resolve([]),

    (activeTab === 'usuarios' || activeTab === 'departamentos') ? prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { users: true } } },
    }) : Promise.resolve([]),

    activeTab === 'categorias' ? prisma.ticketCategory.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { tickets: true } } },
    }) : Promise.resolve([]),

    activeTab === 'categorias' ? prisma.assetCategory.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { assets: true } } },
    }) : Promise.resolve([]),

    activeTab === 'chamados' ? prisma.slaPolicy.findMany({
      orderBy: { name: 'asc' },
      include: { category: { select: { name: true } } },
    }) : Promise.resolve([]),

    activeTab === 'scoring' ? prisma.asset.count() : Promise.resolve(0),
  ])

  const deptsForUsers = activeTab === 'usuarios'
    ? (departments as Array<{ id: string; name: string }>)
    : []

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060', letterSpacing: '0.1em' }}>SISTEMA</span>
            <span style={{ color: '#1e3048', fontSize: 10 }}>/</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#00d9b8', letterSpacing: '0.1em' }}>CONFIGURAÇÕES</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e2eaf4', letterSpacing: '-0.01em', lineHeight: 1 }}>
            Configurações
          </h1>
          <p style={{ fontSize: 13, color: '#3d5068', marginTop: 6 }}>
            Gerenciamento do sistema — acesso restrito a administradores
          </p>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '5px 12px', borderRadius: 6,
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#f87171',
        }}>
          🔒 Admin TI
        </span>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 0 }}>
        {TABS.map(t => {
          const isActive = t.key === activeTab
          return (
            <Link
              key={t.key}
              href={`/settings?tab=${t.key}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', borderRadius: '8px 8px 0 0',
                background: isActive ? '#0d1422' : 'transparent',
                border: isActive ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
                borderBottom: isActive ? '1px solid #0d1422' : '1px solid transparent',
                marginBottom: isActive ? -1 : 0,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11, fontWeight: isActive ? 700 : 500,
                color: isActive ? '#00d9b8' : '#3d5068',
                textDecoration: 'none', transition: 'all 0.1s',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: 13 }}>{t.icon}</span>
              {t.label}
            </Link>
          )
        })}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'usuarios' && (
          <UsersTab
            users={users as Parameters<typeof UsersTab>[0]['users']}
            departments={deptsForUsers}
            currentUserId={session!.user.id}
          />
        )}

        {activeTab === 'departamentos' && (
          <DepartmentsTab
            departments={departments as Parameters<typeof DepartmentsTab>[0]['departments']}
          />
        )}

        {activeTab === 'chamados' && (
          <TicketSettingsTab
            slaPolices={slaPolices as Parameters<typeof TicketSettingsTab>[0]['slaPolices']}
          />
        )}

        {activeTab === 'scoring' && (
          <ScoringTab totalAssets={totalAssets as number} />
        )}

        {activeTab === 'categorias' && (
          <CategoriesTab
            ticketCategories={ticketCategories as Parameters<typeof CategoriesTab>[0]['ticketCategories']}
            assetCategories={assetCategories as Parameters<typeof CategoriesTab>[0]['assetCategories']}
          />
        )}
      </div>

    </div>
  )
}
