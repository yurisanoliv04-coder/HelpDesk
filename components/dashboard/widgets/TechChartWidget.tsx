import { getTechData } from '@/lib/dashboard/fetchers/tickets'
import { TechChart } from '@/components/dashboard/TechChart'

export default async function TechChartWidget() {
  const data = await getTechData()
  return <TechChart data={data} />
}
