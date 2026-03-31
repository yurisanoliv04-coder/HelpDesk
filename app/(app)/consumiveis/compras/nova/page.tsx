import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import NovaPurchaseForm from './NovaPurchaseForm'

export const dynamic = 'force-dynamic'

export default async function NovaPurchasePage() {
  const session = await auth()
  const role = session?.user?.role
  if (role === 'COLABORADOR' || role === 'AUXILIAR_TI') redirect('/dashboard')

  const [categories, users] = await Promise.all([
    prisma.assetCategory.findMany({
      where: { active: true },
      select: { id: true, name: true, kind: true },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060', letterSpacing: '0.1em' }}>SISTEMA</span>
          <span style={{ color: '#1e3048', fontSize: 10 }}>/</span>
          <a href="/consumiveis" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#a78bfa', letterSpacing: '0.1em', textDecoration: 'none' }}>ACESSÓRIOS</a>
          <span style={{ color: '#1e3048', fontSize: 10 }}>/</span>
          <a href="/consumiveis/compras" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#34d399', letterSpacing: '0.1em', textDecoration: 'none' }}>COMPRAS</a>
          <span style={{ color: '#1e3048', fontSize: 10 }}>/</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#c8d6e5', letterSpacing: '0.1em' }}>NOVA</span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e2eaf4', letterSpacing: '-0.01em', lineHeight: 1 }}>
          Registrar Compra
        </h1>
        <p style={{ fontSize: 13, color: '#3d5068', marginTop: 6 }}>
          Registre a aquisição de equipamentos, acessórios ou consumíveis
        </p>
      </div>

      <NovaPurchaseForm categories={categories} users={users} />
    </div>
  )
}
