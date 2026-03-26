import { prisma } from '@/lib/db/prisma'
import AssetCategoriesSection from '@/components/settings/AssetCategoriesSection'
import SettingsSubHeader from '@/components/settings/SettingsSubHeader'

export default async function AcessoriosPage() {
  const assetCategories = await prisma.assetCategory.findMany({
    where: { kind: 'ACCESSORY' },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, icon: true, active: true, kind: true, stockQuantity: true, stockMinQty: true, _count: { select: { assets: true } } },
  })

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SettingsSubHeader
        title="Acessórios"
        description="Categorias de periféricos reutilizáveis: mouses, teclados, headsets, etc."
        accent="#a78bfa"
      />
      <AssetCategoriesSection
        assetCategories={assetCategories as Parameters<typeof AssetCategoriesSection>[0]['assetCategories']}
        lockedKind="ACCESSORY"
      />
    </div>
  )
}
