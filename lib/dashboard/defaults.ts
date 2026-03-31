import { WidgetInstance } from './types'

let _id = 0
function uid() { return `default-${++_id}` }

// 12-column grid, rowHeight=20px.
// Each h unit ≈ 28px (20px row + 8px gap).
// All values are 4× the old 80px-based values for the same visual height.
// x: 0-based column start (0–11)
// y: 0-based row start
// w: width in columns (1–12)
// h: height in row units

export const TI_DEFAULT_LAYOUT: WidgetInstance[] = [
  { instanceId: uid(), widgetId: 'tickets_open_kpis',    x: 0, y:   0, w: 12, h:  8 },
  { instanceId: uid(), widgetId: 'assets_kpis',          x: 0, y:   8, w: 12, h:  8 },
  { instanceId: uid(), widgetId: 'tickets_weekly_chart', x: 0, y:  16, w: 12, h: 16 },
  { instanceId: uid(), widgetId: 'tickets_my',           x: 0, y:  32, w:  8, h: 20 },
  { instanceId: uid(), widgetId: 'messages_recent',      x: 8, y:  32, w:  4, h: 20 },
  { instanceId: uid(), widgetId: 'tickets_tech_chart',   x: 0, y:  52, w:  6, h: 16 },
  { instanceId: uid(), widgetId: 'assets_dept_chart',    x: 6, y:  52, w:  6, h: 16 },
  { instanceId: uid(), widgetId: 'tickets_recent',       x: 0, y:  68, w:  8, h: 20 },
  { instanceId: uid(), widgetId: 'assets_low_stock',     x: 8, y:  68, w:  4, h: 20 },
  { instanceId: uid(), widgetId: 'assets_movements',     x: 0, y:  88, w:  6, h: 16 },
  { instanceId: uid(), widgetId: 'purchases_pending',    x: 6, y:  88, w:  6, h: 16 },
  { instanceId: uid(), widgetId: 'calendar',             x: 0, y: 104, w:  4, h: 20 },
]

export const COLABORADOR_DEFAULT_LAYOUT: WidgetInstance[] = [
  { instanceId: uid(), widgetId: 'tickets_open_kpis',    x: 0, y:  0, w: 12, h:  8 },
  { instanceId: uid(), widgetId: 'tickets_weekly_chart', x: 0, y:  8, w: 12, h: 16 },
  { instanceId: uid(), widgetId: 'tickets_my',           x: 0, y: 24, w:  8, h: 20 },
  { instanceId: uid(), widgetId: 'messages_recent',      x: 8, y: 24, w:  4, h: 20 },
  { instanceId: uid(), widgetId: 'calendar',             x: 0, y: 44, w:  4, h: 20 },
  { instanceId: uid(), widgetId: 'tickets_recent',       x: 4, y: 44, w:  8, h: 20 },
]
