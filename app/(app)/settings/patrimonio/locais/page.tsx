import { prisma } from '@/lib/db/prisma'
import AssetLocationsSection from '@/components/settings/AssetLocationsSection'
import SettingsSubHeader from '@/components/settings/SettingsSubHeader'
import { getAssetLocations } from '@/app/(app)/settings/actions'

export default async function PatrimonioLocaisPage() {
  const [locations, departments] = await Promise.all([
    getAssetLocations(),
    prisma.department.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ])

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SettingsSubHeader
        title="Locais"
        description="Locais físicos onde os ativos são instalados (usado nos filtros)."
        accent="#38bdf8"
      />
      <AssetLocationsSection
        locations={locations as string[]}
        departments={departments}
      />
    </div>
  )
}
