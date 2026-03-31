import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import AssetModelForm from '@/components/assets/AssetModelForm'

interface Props { params: Promise<{ id: string }> }

export default async function EditModelPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  const role = session?.user.role
  if (role !== 'TECNICO' && role !== 'ADMIN') redirect('/assets/models')

  const [model, categories, hwParts] = await Promise.all([
    prisma.assetModel.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, isComputer: true } },
      },
    }),
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

  if (!model) notFound()

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
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#a78bfa', letterSpacing: '0.1em' }}>
          EDITAR
        </span>
      </div>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#e2eaf4', letterSpacing: '-0.01em', lineHeight: 1 }}>
          Editar modelo
        </h1>
        <p style={{ fontSize: 13, color: '#3d5068', marginTop: 6 }}>
          {model.name} — {model.category.name}
        </p>
      </div>

      <AssetModelForm
        mode="edit"
        modelId={model.id}
        initialValues={{
          categoryId: model.categoryId,
          name: model.name,
          manufacturer: model.manufacturer ?? '',
          imageData: model.imageData,
          cpuPartId: model.cpuPartId ?? '',
          ramPartId: model.ramPartId ?? '',
          storagePartId: model.storagePartId ?? '',
          customDefaults: model.customDefaults as Record<string, string> | null,
        }}
        categories={categories}
        hwCpuParts={hwCpuParts}
        hwRamParts={hwRamParts}
        hwStorageParts={hwStorageParts}
      />
    </div>
  )
}
