import { prisma } from '@/lib/db/prisma'
import { ModelsSection } from '@/components/settings/AssetsSettingsTab'
import SettingsSubHeader from '@/components/settings/SettingsSubHeader'
import { getAssetModels } from '@/app/(app)/settings/actions'

export default async function PatrimonioModelosPage() {
  const [assetCategories, assetModels] = await Promise.all([
    prisma.assetCategory.findMany({
      where: { kind: 'EQUIPMENT' },
      orderBy: { name: 'asc' },
      include: { _count: { select: { assets: true } } },
    }),
    getAssetModels(),
  ])

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SettingsSubHeader
        title="Modelos de Equipamento"
        description="Modelos predefinidos com imagem e fabricante para facilitar o cadastro de ativos."
        accent="#fbbf24"
      />
      <ModelsSection
        assetCategories={assetCategories as Parameters<typeof ModelsSection>[0]['assetCategories']}
        assetModels={assetModels as Parameters<typeof ModelsSection>[0]['assetModels']}
      />
    </div>
  )
}
