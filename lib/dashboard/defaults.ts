import { WidgetInstance } from './types'

let _id = 0
function uid() { return `default-${++_id}` }

// 12-column grid, rowHeight=80px.
// x: 0-based column start (0–11)
// y: 0-based row start (explicit, never simulated)
// w: width in columns (1–12)
// h: height in rows (1–20)

export const TI_DEFAULT_LAYOUT: WidgetInstance[] = [
  { instanceId: uid(), widgetId: 'tickets_open_kpis',    x: 0, y:  0, w: 12, h: 2 },
  { instanceId: uid(), widgetId: 'assets_kpis',          x: 0, y:  2, w: 12, h: 2 },
  { instanceId: uid(), widgetId: 'tickets_weekly_chart', x: 0, y:  4, w: 12, h: 4 },
  { instanceId: uid(), widgetId: 'tickets_my',           x: 0, y:  8, w:  8, h: 5 },
  { instanceId: uid(), widgetId: 'messages_recent',      x: 8, y:  8, w:  4, h: 5 },
  { instanceId: uid(), widgetId: 'tickets_tech_chart',   x: 0, y: 13, w:  6, h: 4 },
  { instanceId: uid(), widgetId: 'assets_dept_chart',    x: 6, y: 13, w:  6, h: 4 },
  { instanceId: uid(), widgetId: 'tickets_recent',       x: 0, y: 17, w:  8, h: 5 },
  { instanceId: uid(), widgetId: 'assets_low_stock',     x: 8, y: 17, w:  4, h: 5 },
  { instanceId: uid(), widgetId: 'assets_movements',     x: 0, y: 22, w:  6, h: 4 },
  { instanceId: uid(), widgetId: 'purchases_pending',    x: 6, y: 22, w:  6, h: 4 },
  { instanceId: uid(), widgetId: 'calendar',             x: 0, y: 26, w:  4, h: 5 },
]

export const COLABORADOR_DEFAULT_LAYOUT: WidgetInstance[] = [
  { instanceId: uid(), widgetId: 'tickets_open_kpis',    x: 0, y:  0, w: 12, h: 2 },
  { instanceId: uid(), widgetId: 'tickets_weekly_chart', x: 0, y:  2, w: 12, h: 4 },
  { instanceId: uid(), widgetId: 'tickets_my',           x: 0, y:  6, w:  8, h: 5 },
  { instanceId: uid(), widgetId: 'messages_recent',      x: 8, y:  6, w:  4, h: 5 },
  { instanceId: uid(), widgetId: 'calendar',             x: 0, y: 11, w:  4, h: 5 },
  { instanceId: uid(), widgetId: 'tickets_recent',       x: 4, y: 11, w:  8, h: 5 },
]
