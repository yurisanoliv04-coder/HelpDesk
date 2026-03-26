export type WidgetId =
  | 'tickets_open_kpis'    // 4 stat cards de chamados
  | 'tickets_my'           // tabela "Meus Chamados / Atribuídos a mim"
  | 'tickets_recent'       // tabela "Chamados Recentes do Sistema"
  | 'tickets_weekly_chart' // LineChart 30 dias criados/fechados
  | 'tickets_tech_chart'   // BarChart horizontal carga por técnico (TI only)
  | 'assets_kpis'          // 4 stat cards de patrimônio (TI only)
  | 'assets_dept_chart'    // BarChart empilhado ativos por local (TI only)
  | 'assets_low_stock'     // lista alertas estoque baixo (TI only)
  | 'assets_movements'     // movimentações recentes (TI only)
  | 'purchases_pending'    // compras pendentes (TI only)
  | 'messages_recent'      // mensagens recentes em chamados do usuário
  | 'calendar'             // calendário client-only
  | 'system_alerts'        // painel de alertas críticos do sistema (TI only)
  | 'divider'              // separador visual de seção

export interface WidgetInstance {
  instanceId: string
  widgetId: WidgetId
  /** Coluna inicial, 0-based (0–11). Armazenado explicitamente. */
  x: number
  /** Linha inicial, 0-based. Armazenado explicitamente — nunca recalculado. */
  y: number
  /** Largura em colunas (1–12, full-width = 12). */
  w: number
  /** Altura em linhas (1–20). Cada linha = 80px via rowHeight do RGL. */
  h: number
  config?: Record<string, unknown>
}

export interface WidgetDef {
  id: WidgetId
  label: string
  description: string
  icon: string
  defaultW: number   // largura padrão ao adicionar (1–12)
  defaultH: number   // altura padrão ao adicionar (1–20)
  minW: number       // largura mínima para resize
  minH: number       // altura mínima para resize
  tiOnly: boolean
}

// Serialized form stored in DB (Json column)
export type DashboardLayout = WidgetInstance[]

export interface SerializedDashboard {
  id: string
  name: string
  isDefault: boolean
  layout: DashboardLayout
  updatedAt: string
}
