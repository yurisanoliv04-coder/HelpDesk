/**
 * HelpDesk Design System - Color Palette
 * Sophisticated professional aesthetic with refined accents
 */

export const colors = {
  // Primary colors - Deep, professional foundation
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },

  // Emerald accent - Primary action and highlights
  emerald: {
    50: '#f0fdf4',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
  },

  // Semantic colors for status
  status: {
    open: '#3b82f6',        // Blue - open/unassigned
    inProgress: '#f59e0b',  // Amber - in progress
    onHold: '#8b5cf6',      // Purple - waiting
    done: '#10b981',        // Emerald - completed
    canceled: '#ef4444',    // Red - canceled
  },

  // Priority indicators
  priority: {
    low: '#3b82f6',         // Blue
    medium: '#f59e0b',      // Amber
    high: '#ef4444',        // Red
    urgent: '#dc2626',      // Dark red
  },

  // Neutral palette
  white: '#ffffff',
  black: '#000000',
  gray: '#6b7280',

  // Backgrounds
  bg: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    dark: '#0f172a',
  },
}

export const gradients = {
  // Subtle elevation gradients
  card: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.8) 100%)',
  cardHover: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',

  // Accent gradients for visual interest
  accent: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  accentSubtle: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
}

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
  base: '0 1px 3px 0 rgba(15, 23, 42, 0.1), 0 1px 2px 0 rgba(15, 23, 42, 0.06)',
  md: '0 4px 6px -1px rgba(15, 23, 42, 0.1), 0 2px 4px -1px rgba(15, 23, 42, 0.06)',
  lg: '0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -2px rgba(15, 23, 42, 0.05)',
  xl: '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 10px 10px -5px rgba(15, 23, 42, 0.04)',
  hover: '0 20px 25px -5px rgba(16, 185, 129, 0.15), 0 10px 10px -5px rgba(16, 185, 129, 0.08)',
}
