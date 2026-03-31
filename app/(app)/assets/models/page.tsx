import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AssetModelsClient from '@/components/assets/AssetModelsClient'

export default async function AssetModelsPage() {
  const session = await auth()
  const role = session?.user.role
  if (role === 'COLABORADOR' || role === 'AUXILIAR_TI') redirect('/dashboard')

  const models = await prisma.assetModel.findMany({
    orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
    include: {
      category: { select: { id: true, name: true, isComputer: true } },
      cpuPart: { select: { id: true, brand: true, model: true, scorePoints: true, notes: true } },
      ramPart: { select: { id: true, brand: true, model: true, scorePoints: true, notes: true } },
      storagePart: { select: { id: true, brand: true, model: true, scorePoints: true, notes: true } },
      _count: { select: { assets: true } },
    },
  })

  const categories = await prisma.assetCategory.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, isComputer: true },
  })

  // Serialize (Decimal → number etc.) — no complex types here, safe to pass directly
  const serialized = models.map(m => ({
    id: m.id,
    categoryId: m.categoryId,
    categoryName: m.category.name,
    isComputerCategory: m.category.isComputer,
    name: m.name,
    manufacturer: m.manufacturer,
    imageData: m.imageData,
    cpuPartId: m.cpuPartId,
    ramPartId: m.ramPartId,
    storagePartId: m.storagePartId,
    customDefaults: m.customDefaults as Record<string, string> | null,
    assetCount: m._count.assets,
    cpuPart: m.cpuPart,
    ramPart: m.ramPart,
    storagePart: m.storagePart,
  }))

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Link href="/assets" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060', textDecoration: 'none', letterSpacing: '0.1em' }}>
          PATRIMÔNIO
        </Link>
        <span style={{ color: '#1e3048', fontSize: 10 }}>/</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#00d9b8', letterSpacing: '0.1em' }}>
          MODELOS
        </span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#e2eaf4', letterSpacing: '-0.01em', lineHeight: 1 }}>
            Modelos de equipamento
          </h1>
          <p style={{ fontSize: 13, color: '#3d5068', marginTop: 6 }}>
            {serialized.length} modelo{serialized.length !== 1 ? 's' : ''} cadastrado{serialized.length !== 1 ? 's' : ''}
          </p>
        </div>
        {(role === 'TECNICO' || role === 'ADMIN') && (
          <Link href="/assets/models/new" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', borderRadius: 9,
            background: 'rgba(0,217,184,0.1)', border: '1px solid rgba(0,217,184,0.25)',
            color: '#00d9b8', fontSize: 13, fontWeight: 600,
            textDecoration: 'none', fontFamily: "'JetBrains Mono', monospace",
            whiteSpace: 'nowrap',
          }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Novo modelo
          </Link>
        )}
      </div>

      <AssetModelsClient models={serialized} categories={categories} />
    </div>
  )
}
