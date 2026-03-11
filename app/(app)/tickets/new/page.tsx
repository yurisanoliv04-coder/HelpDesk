import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NewTicketForm from '@/components/tickets/NewTicketForm'

export default async function NewTicketPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const role = session.user.role
  const isAux  = role === 'AUXILIAR_TI'
  const isTI   = ['TECNICO', 'ADMIN', 'AUXILIAR_TI'].includes(role ?? '')

  // COLABORADOR cannot reach this page (middleware blocks them)
  // But guard just in case
  if (!isTI) redirect('/login')

  const [categories, users, solutions, assetsRaw] = await Promise.all([
    prisma.ticketCategory.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, description: true, icon: true, defaultPriority: true },
    }),

    // AUXILIAR_TI → only users from their own department
    // TECNICO / ADMIN → all active users
    isAux
      ? prisma.user.findMany({
          where: {
            active: true,
            ...(session.user.departmentId
              ? { departmentId: session.user.departmentId }
              : {}),
          },
          orderBy: { name: 'asc' },
          select: { id: true, name: true, email: true, role: true, department: { select: { name: true } } },
        })
      : isTI
      ? prisma.user.findMany({
          where: { active: true },
          orderBy: { name: 'asc' },
          select: { id: true, name: true, email: true, role: true, department: { select: { name: true } } },
        })
      : Promise.resolve([]),

    prisma.ticketSolution.findMany({
      select: {
        id: true, title: true, body: true, categoryId: true,
        createdBy: { select: { name: true } },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),

    // AUXILIAR_TI → load all DEPLOYED assets for users in the same dept
    isAux && session.user.departmentId
      ? prisma.asset.findMany({
          where: {
            status: 'DEPLOYED',
            assignedToUser: { departmentId: session.user.departmentId },
          },
          select: {
            id: true, tag: true, name: true, assignedToUserId: true,
            category: { select: { name: true, icon: true } },
          },
        })
      : Promise.resolve([]),
  ])

  // Group assets by user id
  const assetsByUser: Record<string, { id: string; tag: string; name: string; category: { name: string; icon: string | null } }[]> = {}
  for (const a of assetsRaw) {
    if (!a.assignedToUserId) continue
    if (!assetsByUser[a.assignedToUserId]) assetsByUser[a.assignedToUserId] = []
    assetsByUser[a.assignedToUserId].push({ id: a.id, tag: a.tag, name: a.name, category: a.category })
  }

  const backHref = isAux ? '/aux' : '/tickets'

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Link href={backHref} style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
          color: '#3d5068', textDecoration: 'none',
        }}>
          {isAux ? 'Início' : 'Chamados'}
        </Link>
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#2d4060" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#00d9b8', fontWeight: 700 }}>
          Novo chamado
        </span>
      </nav>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2eaf4', marginBottom: 4 }}>
          Abrir chamado
        </h1>
        <p style={{ fontSize: 13, color: '#3d5068' }}>
          Descreva o problema com o máximo de detalhes possível.
        </p>
      </div>

      <NewTicketForm
        categories={categories}
        users={users}
        solutions={solutions.map(s => ({
          ...s,
          createdAt: s.createdAt.toISOString(),
        }))}
        currentUserId={session.user.id ?? ''}
        isTI={isTI}
        isAux={isAux}
        assetsByUser={isAux ? assetsByUser : undefined}
      />
    </div>
  )
}
