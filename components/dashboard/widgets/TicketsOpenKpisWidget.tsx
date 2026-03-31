import { getTicketKpis } from '@/lib/dashboard/fetchers/tickets'
import { DashboardCard } from '@/components/dashboard/DashboardCard'

export default async function TicketsOpenKpisWidget() {
  const kpis = await getTicketKpis()

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, height: '100%' }}>
      <DashboardCard title="Não atribuídos"  value={kpis.unassigned}  icon="inbox"    color="red"   href="/tickets?filter=unassigned" />
      <DashboardCard title="Em aberto"       value={kpis.open}        icon="alert"   color="blue"  href="/tickets?filter=open" />
      <DashboardCard title="Em atendimento"  value={kpis.inProgress}  icon="clock"   color="amber" href="/tickets?filter=in_progress" />
      <DashboardCard title="Urgentes ativos" value={kpis.urgent}      icon="zap"     color="red"   href="/tickets?priority=URGENT" />
    </div>
  )
}
