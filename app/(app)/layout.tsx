import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import AppLayoutClient from '@/components/layout/AppLayoutClient'
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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <AppLayoutClient
        userName={name ?? ''}
        userRole={role}
        userInitials={getInitials(name ?? 'U')}
      >
        {children}
      </AppLayoutClient>
      <RealtimeToast userId={id} />
    </div>
  )
}
