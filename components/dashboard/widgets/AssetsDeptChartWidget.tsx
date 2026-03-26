import { getAssetLocationData } from '@/lib/dashboard/fetchers/assets'
import AssetsDeptChart from '@/components/assets/AssetsDeptChart'

export default async function AssetsDeptChartWidget() {
  const data = await getAssetLocationData()
  return <AssetsDeptChart data={data} />
}
