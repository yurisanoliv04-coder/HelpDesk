import { Suspense } from 'react'
import { WidgetId } from '@/lib/dashboard/types'
import WidgetSkeleton from './widgets/WidgetSkeleton'

// ── Lazy imports (each in its own Suspense boundary) ─────────────────────────
import TicketsOpenKpisWidget   from './widgets/TicketsOpenKpisWidget'
import AssetsKpisWidget        from './widgets/AssetsKpisWidget'
import WeeklyChartWidget       from './widgets/WeeklyChartWidget'
import TechChartWidget         from './widgets/TechChartWidget'
import AssetsDeptChartWidget   from './widgets/AssetsDeptChartWidget'
import MyTicketsWidget         from './widgets/MyTicketsWidget'
import RecentTicketsWidget     from './widgets/RecentTicketsWidget'
import LowStockWidget          from './widgets/LowStockWidget'
import RecentMovementsWidget   from './widgets/RecentMovementsWidget'
import PurchasesPendingWidget  from './widgets/PurchasesPendingWidget'
import RecentMessagesWidget    from './widgets/RecentMessagesWidget'
import CalendarWidgetWrapper   from './widgets/CalendarWidget'
import DividerWidget           from './widgets/DividerWidget'
import SystemAlertsWidget     from './widgets/SystemAlertsWidget'
import WeatherWidget          from './widgets/WeatherWidget'

interface Props {
  widgetId: WidgetId
}

export default function WidgetRenderer({ widgetId }: Props) {
  let content: React.ReactNode

  switch (widgetId) {
    case 'tickets_open_kpis':    content = <TicketsOpenKpisWidget />; break
    case 'assets_kpis':          content = <AssetsKpisWidget />;      break
    case 'tickets_weekly_chart': content = <WeeklyChartWidget />;     break
    case 'tickets_tech_chart':   content = <TechChartWidget />;       break
    case 'assets_dept_chart':    content = <AssetsDeptChartWidget />; break
    case 'tickets_my':           content = <MyTicketsWidget />;       break
    case 'tickets_recent':       content = <RecentTicketsWidget />;   break
    case 'assets_low_stock':     content = <LowStockWidget />;        break
    case 'assets_movements':     content = <RecentMovementsWidget />; break
    case 'purchases_pending':    content = <PurchasesPendingWidget />; break
    case 'messages_recent':      content = <RecentMessagesWidget />;  break
    case 'calendar':             content = <CalendarWidgetWrapper />; break
    case 'system_alerts':        content = <SystemAlertsWidget />;   break
    case 'divider':              content = <DividerWidget />;        break
    case 'weather':              content = <WeatherWidget />;        break
    default:
      content = (
        <div style={{ padding: 20, color: 'var(--text-dim)', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
          Widget desconhecido: {widgetId}
        </div>
      )
  }

  return (
    <Suspense fallback={<WidgetSkeleton />}>
      {content}
    </Suspense>
  )
}
