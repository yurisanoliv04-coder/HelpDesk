import { WidgetDef } from './types'

// All sizes in 12-column units. full-width = w:12, half = w:6, third = w:4.
// ROW_HEIGHT = 20px → each h unit ≈ 28px (20px row + 8px gap)
export const WIDGET_CATALOG: WidgetDef[] = [
  // ── Chamados ──────────────────────────────────────────────────────────────
  {
    id: 'tickets_open_kpis',
    label: 'KPIs de Chamados',
    description: 'Cartões com totais: abertos, não atribuídos, urgentes, em atendimento',
    icon: 'LayoutGrid',
    defaultW: 12, defaultH: 8, minW: 6, minH: 6,
    tiOnly: false,
  },
  {
    id: 'tickets_my',
    label: 'Meus Chamados',
    description: 'Lista de chamados abertos atribuídos a mim (ou abertos por mim)',
    icon: 'Inbox',
    defaultW: 8, defaultH: 20, minW: 4, minH: 10,
    tiOnly: false,
  },
  {
    id: 'tickets_recent',
    label: 'Chamados Recentes',
    description: 'Últimos chamados abertos/em atendimento no sistema',
    icon: 'Clock',
    defaultW: 8, defaultH: 20, minW: 4, minH: 10,
    tiOnly: false,
  },
  {
    id: 'tickets_weekly_chart',
    label: 'Gráfico Semanal',
    description: 'Chamados abertos vs. fechados nos últimos 30 dias',
    icon: 'TrendingUp',
    defaultW: 12, defaultH: 16, minW: 6, minH: 10,
    tiOnly: false,
    chartTypes: [
      { id: 'line',  label: 'Linha',           icon: 'TrendingUp' },
      { id: 'area',  label: 'Área',            icon: 'AreaChart' },
      { id: 'bar_v', label: 'Barras Verticais', icon: 'BarChart2' },
    ],
  },
  {
    id: 'tickets_tech_chart',
    label: 'Carga por Técnico',
    description: 'Chamados ativos por técnico',
    icon: 'BarChart2',
    defaultW: 6, defaultH: 8, minW: 3, minH: 6,
    tiOnly: true,
    chartTypes: [
      { id: 'bar_h',  label: 'Barras Horizontais', icon: 'AlignLeft' },
      { id: 'bar_v',  label: 'Barras Verticais',   icon: 'BarChart2' },
      { id: 'pie',    label: 'Pizza',               icon: 'PieChart' },
    ],
  },

  // ── Patrimônio ────────────────────────────────────────────────────────────
  {
    id: 'assets_kpis',
    label: 'KPIs de Patrimônio',
    description: 'Cartões com totais: total, implantados, em estoque, manutenção',
    icon: 'Package',
    defaultW: 12, defaultH: 8, minW: 6, minH: 6,
    tiOnly: true,
  },
  {
    id: 'assets_dept_chart',
    label: 'Ativos por Local',
    description: 'Distribuição de ativos por local físico (BOM / INTERMEDIÁRIO / RUIM)',
    icon: 'PieChart',
    defaultW: 6, defaultH: 16, minW: 4, minH: 10,
    tiOnly: true,
    chartTypes: [
      { id: 'bar_stacked', label: 'Barras Empilhadas', icon: 'BarChart2' },
      { id: 'bar_grouped', label: 'Barras Agrupadas',  icon: 'BarChart3' },
      { id: 'pie',         label: 'Pizza',             icon: 'PieChart'  },
    ],
  },
  {
    id: 'assets_low_stock',
    label: 'Estoque Baixo',
    description: 'Categorias de acessórios/consumíveis abaixo do estoque mínimo',
    icon: 'AlertTriangle',
    defaultW: 4, defaultH: 20, minW: 3, minH: 10,
    tiOnly: true,
  },
  {
    id: 'assets_movements',
    label: 'Movimentações Recentes',
    description: 'Últimas movimentações de ativos registradas',
    icon: 'ArrowLeftRight',
    defaultW: 6, defaultH: 16, minW: 4, minH: 10,
    tiOnly: true,
  },

  // ── Compras ───────────────────────────────────────────────────────────────
  {
    id: 'purchases_pending',
    label: 'Compras Pendentes',
    description: 'Compras aguardando recebimento',
    icon: 'ShoppingCart',
    defaultW: 4, defaultH: 16, minW: 3, minH: 10,
    tiOnly: true,
  },

  // ── Alertas ───────────────────────────────────────────────────────────────
  {
    id: 'system_alerts',
    label: 'Alertas do Sistema',
    description: 'Avisos críticos: chamados urgentes sem técnico, equipamentos RUIM, estoque baixo',
    icon: 'BellDot',
    defaultW: 12, defaultH: 12, minW: 6, minH: 6,
    tiOnly: true,
  },

  // ── Layout ────────────────────────────────────────────────────────────────
  {
    id: 'divider',
    label: 'Divisor de Seção',
    description: 'Linha divisória para organizar visualmente o dashboard em seções',
    icon: 'Minus',
    defaultW: 12, defaultH: 2, minW: 4, minH: 1,
    tiOnly: false,
  },

  // ── Geral ─────────────────────────────────────────────────────────────────
  {
    id: 'weather',
    label: 'Clima',
    description: 'Temperatura e condições climáticas atuais da cidade',
    icon: 'Cloud',
    defaultW: 3, defaultH: 14, minW: 2, minH: 10,
    tiOnly: false,
  },
  {
    id: 'messages_recent',
    label: 'Mensagens Recentes',
    description: 'Últimas mensagens recebidas nos seus chamados',
    icon: 'MessageSquare',
    defaultW: 4, defaultH: 20, minW: 3, minH: 10,
    tiOnly: false,
  },
  {
    id: 'calendar',
    label: 'Calendário',
    description: 'Mini calendário com navegação de datas',
    icon: 'Calendar',
    defaultW: 4, defaultH: 16, minW: 2, minH: 10,
    tiOnly: false,
  },
]

/** Retorna apenas os widgets que o papel pode usar */
export function getAvailableWidgets(isTI: boolean): WidgetDef[] {
  return isTI ? WIDGET_CATALOG : WIDGET_CATALOG.filter((w) => !w.tiOnly)
}
