import { Suspense } from 'react'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { TI_DEFAULT_LAYOUT, COLABORADOR_DEFAULT_LAYOUT } from '@/lib/dashboard/defaults'
import { WidgetInstance, SerializedDashboard } from '@/lib/dashboard/types'
import { WIDGET_CATALOG } from '@/lib/dashboard/catalog'
import DashboardPageClient from '@/components/dashboard/DashboardPageClient'
import WidgetRenderer from '@/components/dashboard/WidgetRenderer'
import WidgetSkeleton from '@/components/dashboard/widgets/WidgetSkeleton'

// Always fresh — dashboard widgets pull live data
export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ db?: string }>
}) {
  const { db: dbParam } = await searchParams
  const session = await auth()
  const userId = session!.user.id
  const role = session?.user.role ?? 'COLABORADOR'
  const isTI = ['TECNICO', 'ADMIN', 'AUXILIAR_TI'].includes(role)

  // Load all dashboards for this user (lightweight — only layout JSON + metadata)
  let rows = await prisma.userDashboard.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, isDefault: true, layout: true, updatedAt: true },
  })

  // Lazy creation on first visit — no redirect, seamless
  if (rows.length === 0) {
    const defaultLayout = isTI ? TI_DEFAULT_LAYOUT : COLABORADOR_DEFAULT_LAYOUT
    const created = await prisma.userDashboard.create({
      data: {
        userId,
        name: 'Principal',
        isDefault: true,
        layout: defaultLayout as object[],
      },
      select: { id: true, name: true, isDefault: true, layout: true, updatedAt: true },
    })
    rows = [created]
  }

  // Ensure exactly one default
  const hasDefault = rows.some((r) => r.isDefault)
  if (!hasDefault) {
    await prisma.userDashboard.update({
      where: { id: rows[0].id },
      data: { isDefault: true },
    })
    rows[0] = { ...rows[0], isDefault: true }
  }

  // ── One-time migration: convert old {colStart,colSpan,rowSpan,order} → {x,y,w,h} ──
  // Detect old format: any widget missing the explicit `x` coordinate.
  // Old system used a 24-column grid with colStart (1-based) + colSpan + rowSpan.
  // New system uses react-grid-layout with 12-column x/y/w/h (all 0-based, stored).
  type OldWidget = { instanceId: string; widgetId: string; colStart?: number; colSpan?: number; rowSpan?: number; order?: number; x?: number }
  const needsMigration = rows.filter((r) => {
    const layout = r.layout as unknown as OldWidget[]
    return layout.length > 0 && layout[0].x === undefined
  })
  if (needsMigration.length > 0) {
    // One-time auto-pack simulation to compute y values from old format
    function convertOldLayout(instances: OldWidget[]): WidgetInstance[] {
      const COLS = 12
      // Grid occupancy map: grid[row][col] = true if occupied
      const grid: boolean[][] = []
      function isBlocked(row: number, col: number, w: number, h: number): boolean {
        for (let r = row; r < row + h; r++)
          for (let c = col; c < col + w; c++)
            if (grid[r]?.[c]) return true
        return false
      }
      function occupy(row: number, col: number, w: number, h: number) {
        for (let r = row; r < row + h; r++) {
          if (!grid[r]) grid[r] = new Array(COLS).fill(false)
          for (let c = col; c < col + w; c++) grid[r][c] = true
        }
      }
      const sorted = [...instances].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      return sorted.map((inst) => {
        const def = WIDGET_CATALOG.find((d) => d.id === inst.widgetId)
        // Old grid was 24-col; scale colSpan to 12-col (halve, clamp 1–12)
        const rawW = inst.colSpan ?? def?.defaultW ?? 12
        const w = Math.max(1, Math.min(COLS, Math.round(rawW / 2)))
        const h = inst.rowSpan ?? def?.defaultH ?? 2
        // x: old colStart was 1-based on 24 cols; convert to 0-based 12-col
        const rawX = inst.colStart != null ? inst.colStart - 1 : 0
        const x = Math.max(0, Math.min(COLS - w, Math.round(rawX / 2)))
        // Find lowest y that fits at column x
        let y = 0
        while (isBlocked(y, x, w, h)) y++
        occupy(y, x, w, h)
        return { instanceId: inst.instanceId, widgetId: inst.widgetId as WidgetInstance['widgetId'], x, y, w, h }
      })
    }
    await Promise.all(
      needsMigration.map((r) => {
        const migrated = convertOldLayout(r.layout as unknown as OldWidget[])
        ;(r as { layout: unknown }).layout = migrated
        return prisma.userDashboard.update({ where: { id: r.id }, data: { layout: migrated as object[] } })
      }),
    )
  }

  // Use ?db=id param when the user switches dashboards client-side
  const active =
    (dbParam ? rows.find((r) => r.id === dbParam) : null) ??
    rows.find((r) => r.isDefault) ??
    rows[0]

  // Serialize (dates → strings) for client component
  const dashboards: SerializedDashboard[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    isDefault: r.isDefault,
    layout: r.layout as unknown as SerializedDashboard['layout'],
    updatedAt: r.updatedAt.toISOString(),
  }))

  // Pre-render server component widgets for the active layout.
  // Each widget is wrapped in Suspense so they stream independently.
  // These slots are passed as React nodes to DashboardPageClient (composition pattern).
  const activeLayout = (active.layout as unknown as WidgetInstance[]) ?? []
  const initialSlots: Record<string, React.ReactNode> = {}
  for (const inst of activeLayout) {
    initialSlots[inst.instanceId] = (
      <Suspense key={inst.instanceId} fallback={<WidgetSkeleton />}>
        <WidgetRenderer widgetId={inst.widgetId} />
      </Suspense>
    )
  }

  return (
    <DashboardPageClient
      initialDashboards={dashboards}
      initialActiveId={active.id}
      isTI={isTI}
      initialSlots={initialSlots}
    />
  )
}
