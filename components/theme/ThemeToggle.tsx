'use client'

import { useTheme } from '@/lib/context/theme'
import { Moon } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === 'neve' ? 'meianoite' : 'neve')}
      className="w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center"
      title="Alternar tema"
    >
      <Moon size={18} className="text-slate-600 dark:text-slate-400" />
    </button>
  )
}
