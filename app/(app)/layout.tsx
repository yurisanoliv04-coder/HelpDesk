import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import RealtimeToast from '@/components/realtime/RealtimeToast'

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const { name, role, id } = session.user

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#070c14' }}>
      <Sidebar
        userName={name ?? ''}
        userRole={role}
        userInitials={getInitials(name ?? 'U')}
      />
      <main
        style={{
          flex: 1,
          marginLeft: 'var(--sidebar-w)',
          padding: '28px 32px',
          minHeight: '100vh',
          background: '#070c14',
        }}
      >
        {children}
      </main>
      {/* SSE — toast de notificações em tempo real */}
      <RealtimeToast userId={id} />
    </div>
  )
}
