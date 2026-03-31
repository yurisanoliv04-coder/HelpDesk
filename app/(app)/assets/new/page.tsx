import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NewAssetForm from '@/components/assets/NewAssetForm'
import { getNextTag } from './actions'

export default async function NewAssetPage() {
  const session = await auth()
  const role = session?.user.role
  if (role === 'COLABORADOR' || role === 'AUXILIAR_TI') redirect('/dashboard')

  const [categories, users, initialTag, departments, hwParts, models] = await Promise.all([
    prisma.assetCategory.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, icon: true, isComputer: true,
        customFields: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, label: true, fieldType: true, options: true, sortOrder: true, required: true, isUnique: true },
        },
      },
    }),
    prisma.user.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    getNextTag(),
    prisma.department.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.hardwarePart.findMany({
      where: { active: true },
      orderBy: [{ type: 'asc' }, { scorePoints: 'asc' }],
      select: { id: true, type: true, brand: true, model: true, scorePoints: true, notes: true },
    }),
    prisma.assetModel.findMany({
      orderBy: [{ categoryId: 'asc' }, { name: 'asc' }],
      select: { id: true, categoryId: true, name: true, manufacturer: true },
    }),
  ])

  const locationOptions = [
    'Departamento de T.I',
    'Estoque T.I',
    ...departments.map(d => d.name),
  ].filter((v, i, a) => a.indexOf(v) === i)

  const hwCpuParts     = hwParts.filter(p => p.type === 'CPU')
  const hwRamParts     = hwParts.filter(p => p.type === 'RAM')
  const hwStorageParts = hwParts.filter(p => p.type === 'STORAGE')

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Link href="/assets" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060', textDecoration: 'none', letterSpacing: '0.1em' }}>
          PATRIMÔNIO
        </Link>
        <span style={{ color: '#1e3048', fontSize: 10 }}>/</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#00d9b8', letterSpacing: '0.1em' }}>
          NOVO ATIVO
        </span>
      </div>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#e2eaf4', letterSpacing: '-0.01em', lineHeight: 1 }}>
          Cadastrar ativo
        </h1>
        <p style={{ fontSize: 13, color: '#3d5068', marginTop: 6 }}>
          Preencha as informações do equipamento. Campos com <span style={{ color: '#f87171' }}>*</span> são obrigatórios.
        </p>
      </div>

      {/* Form */}
      <NewAssetForm
        categories={categories}
        models={models}
        users={users}
        initialTag={initialTag}
        locationOptions={locationOptions}
        hwCpuParts={hwCpuParts}
        hwRamParts={hwRamParts}
        hwStorageParts={hwStorageParts}
      />

    </div>
  )
}
