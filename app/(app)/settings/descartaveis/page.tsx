import { prisma } from '@/lib/db/prisma'
import AssetCategoriesSection from '@/components/settings/AssetCategoriesSection'
import SettingsSubHeader from '@/components/settings/SettingsSubHeader'

export default async function DescartaveisPage() {
  const assetCategories = await prisma.assetCategory.findMany({
    where: { kind: 'DISPOSABLE' },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, icon: true, active: true, kind: true, stockQuantity: true, stockMinQty: true, _count: { select: { assets: true } } },
  })

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SettingsSubHeader
        title="Consumíveis"
        description="Categorias de itens de consumo: cartuchos, papel, cabos avulsos, etc."
        accent="#fb923c"
      />
      <AssetCategoriesSection
        assetCategories={assetCategories as Parameters<typeof AssetCategoriesSection>[0]['assetCategories']}
        lockedKind="DISPOSABLE"
      />
    </div>
  )
}
