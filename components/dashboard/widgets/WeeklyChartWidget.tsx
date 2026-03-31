import { getWeeklyData } from '@/lib/dashboard/fetchers/tickets'
import { WeeklyChart } from '@/components/dashboard/WeeklyChart'

export default async function WeeklyChartWidget() {
  const data = await getWeeklyData()
  return <WeeklyChart data={data} />
}
