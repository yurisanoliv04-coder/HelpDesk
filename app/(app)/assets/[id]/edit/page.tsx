import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import EditAssetForm from '@/components/assets/EditAssetForm'

export default async function EditAssetPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  const role = session?.user.role
  if (role === 'COLABORADOR' || role === 'AUXILIAR_TI') redirect('/dashboard')

  const { id } = await params

  const [asset, categories, users, departments, hwParts] = await Promise.all([
    prisma.asset.findUnique({
      where: { id },
      include: { category: true, customFieldValues: true },
    }),
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
    prisma.department.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.hardwarePart.findMany({
      where: { active: true },
      orderBy: [{ type: 'asc' }, { scorePoints: 'asc' }],
      select: { id: true, type: true, brand: true, model: true, scorePoints: true, notes: true },
    }),
  ])

  const locationOptions = [
    'Departamento de T.I',
    'Estoque T.I',
    ...departments.map(d => d.name),
  ].filter((v, i, a) => a.indexOf(v) === i)

  if (!asset) notFound()

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
        <Link href={`/assets/${id}`} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060', textDecoration: 'none', letterSpacing: '0.1em' }}>
          {asset.tag}
        </Link>
        <span style={{ color: '#1e3048', fontSize: 10 }}>/</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#00d9b8', letterSpacing: '0.1em' }}>
          EDITAR
        </span>
      </div>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#e2eaf4', letterSpacing: '-0.01em', lineHeight: 1 }}>
          Editar ativo
        </h1>
        <p style={{ fontSize: 13, color: '#3d5068', marginTop: 6 }}>
          Edite as informações do equipamento <span style={{ color: '#4a6580' }}>{asset.name}</span>. Campos com <span style={{ color: '#f87171' }}>*</span> são obrigatórios.
        </p>
      </div>

      {/* Form */}
      <EditAssetForm
        assetId={id}
        categories={categories}
        users={users}
        locationOptions={locationOptions}
        hwCpuParts={hwCpuParts}
        hwRamParts={hwRamParts}
        hwStorageParts={hwStorageParts}
        initialValues={{
          tag: asset.tag,
          name: asset.name,
          categoryId: asset.categoryId,
          status: asset.status,
          location: asset.location ?? '',
          serialNumber: asset.serialNumber ?? '',
          assignedToUserId: asset.assignedToUserId ?? '',
          notes: asset.notes ?? '',
          // Catálogo
          cpuPartId:     asset.cpuPartId     ?? '',
          ramPartId:     asset.ramPartId     ?? '',
          storagePartId: asset.storagePartId ?? '',
          // Hardware legado
          ramGb:         asset.ramGb ? String(asset.ramGb) : '',
          storageType:   asset.storageType ?? '',
          storageGb:     asset.storageGb ? String(asset.storageGb) : '',
          cpuBrand:      asset.cpuBrand ?? '',
          cpuModel:      asset.cpuModel ?? '',
          cpuGeneration: asset.cpuGeneration ? String(asset.cpuGeneration) : '',
          // Financial
          acquisitionCost: asset.acquisitionCost ? String(asset.acquisitionCost) : '',
          currentValue:    asset.currentValue    ? String(asset.currentValue)    : '',
          acquisitionDate: asset.acquisitionDate
            ? asset.acquisitionDate.toISOString().slice(0, 10)
            : '',
          warrantyUntil: asset.warrantyUntil
            ? asset.warrantyUntil.toISOString().slice(0, 10)
            : '',
          initialCustomValues: Object.fromEntries(
            asset.customFieldValues.map(v => [v.fieldDefId, v.value])
          ),
        }}
      />

    </div>
  )
}
