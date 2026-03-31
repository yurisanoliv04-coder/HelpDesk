import { getAssetKpis } from '@/lib/dashboard/fetchers/assets'
import { DashboardCard } from '@/components/dashboard/DashboardCard'

export default async function AssetsKpisWidget() {
  const kpis = await getAssetKpis()

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, height: '100%' }}>
      <DashboardCard title="Total de ativos"  value={kpis.total}       icon="package"  color="cyan"   href="/assets" />
      <DashboardCard title="Implantados"       value={kpis.deployed}    icon="trending" color="blue"   href="/assets?status=DEPLOYED" />
      <DashboardCard title="Em estoque"        value={kpis.stock}       icon="package"  color="purple" href="/assets?status=STOCK" />
      <DashboardCard title="Em manutenção"     value={kpis.maintenance} icon="alert"    color="amber"  href="/assets?status=MAINTENANCE" />
    </div>
  )
}
