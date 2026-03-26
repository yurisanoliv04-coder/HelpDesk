import { prisma } from '@/lib/db/prisma'
import { CustomFieldsSection } from '@/components/settings/AssetsSettingsTab'
import SettingsSubHeader from '@/components/settings/SettingsSubHeader'
import { getAssetCustomFieldDefs } from '@/app/(app)/settings/actions'

export default async function PatrimonioCamposPage() {
  const [assetCategories, customFieldDefs] = await Promise.all([
    prisma.assetCategory.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { assets: true } } },
    }),
    getAssetCustomFieldDefs(),
  ])

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SettingsSubHeader
        title="Campos Personalizados"
        description="Campos adicionais por categoria, exibidos no formulário de cadastro de ativo."
        accent="#a78bfa"
      />
      <CustomFieldsSection
        assetCategories={assetCategories as Parameters<typeof CustomFieldsSection>[0]['assetCategories']}
        customFieldDefs={customFieldDefs as Parameters<typeof CustomFieldsSection>[0]['customFieldDefs']}
      />
    </div>
  )
}
