import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AssetModelForm from '@/components/assets/AssetModelForm'

export default async function NewModelPage() {
  const session = await auth()
  const role = session?.user.role
  if (role !== 'TECNICO' && role !== 'ADMIN') redirect('/assets/models')

  const [categories, hwParts] = await Promise.all([
    prisma.assetCategory.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, isComputer: true },
    }),
    prisma.hardwarePart.findMany({
      where: { active: true },
      orderBy: [{ type: 'asc' }, { scorePoints: 'desc' }],
      select: { id: true, type: true, brand: true, model: true, scorePoints: true, notes: true },
    }),
  ])

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
        <Link href="/assets/models" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060', textDecoration: 'none', letterSpacing: '0.1em' }}>
          MODELOS
        </Link>
        <span style={{ color: '#1e3048', fontSize: 10 }}>/</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#00d9b8', letterSpacing: '0.1em' }}>
          NOVO
        </span>
      </div>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#e2eaf4', letterSpacing: '-0.01em', lineHeight: 1 }}>
          Novo modelo
        </h1>
        <p style={{ fontSize: 13, color: '#3d5068', marginTop: 6 }}>
          Defina as especificações padrão para este modelo de equipamento.
        </p>
      </div>

      <AssetModelForm
        mode="create"
        categories={categories}
        hwCpuParts={hwCpuParts}
        hwRamParts={hwRamParts}
        hwStorageParts={hwStorageParts}
      />
    </div>
  )
}
