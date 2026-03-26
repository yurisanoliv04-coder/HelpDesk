import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NovoConsumívelForm from '@/components/assets/NovoConsumívelForm'

export default async function NovoConsumívelPage() {
  const session = await auth()
  const role = session?.user.role
  if (role === 'COLABORADOR' || role === 'AUXILIAR_TI') redirect('/dashboard')

  const [categories, users, departments] = await Promise.all([
    prisma.assetCategory.findMany({
      where: { active: true, kind: { in: ['ACCESSORY', 'DISPOSABLE'] } },
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, icon: true, kind: true,
        customFields: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, label: true, fieldType: true, options: true, sortOrder: true, required: true },
        },
      },
    }),
    prisma.user.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.department.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ])

  const locationOptions = [
    'Departamento de T.I',
    'Estoque T.I',
    ...departments.map(d => d.name),
  ].filter((v, i, a) => a.indexOf(v) === i)

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Link href="/consumiveis" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060', textDecoration: 'none', letterSpacing: '0.1em' }}>
          ACESSÓRIOS & CONSUMÍVEIS
        </Link>
        <span style={{ color: '#1e3048', fontSize: 10 }}>/</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#a78bfa', letterSpacing: '0.1em' }}>
          NOVO ITEM
        </span>
      </div>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#e2eaf4', letterSpacing: '-0.01em', lineHeight: 1 }}>
          Cadastrar item
        </h1>
        <p style={{ fontSize: 13, color: '#3d5068', marginTop: 6 }}>
          Campos com <span style={{ color: '#f87171' }}>*</span> são obrigatórios.
        </p>
      </div>

      <NovoConsumívelForm
        categories={categories}
        users={users}
        locationOptions={locationOptions}
      />
    </div>
  )
}
