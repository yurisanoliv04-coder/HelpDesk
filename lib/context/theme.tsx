'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type ThemeName = 'meianoite' | 'aurora' | 'oceano' | 'brasa' | 'quartzo' | 'neve'

export const THEMES: { id: ThemeName; label: string; bg: string; accent: string }[] = [
  { id: 'meianoite', label: 'Meia-noite', bg: '#070c14', accent: '#00d9b8' },
  { id: 'aurora',    label: 'Aurora',     bg: '#0b0814', accent: '#a78bfa' },
  { id: 'oceano',    label: 'Oceano',     bg: '#030c18', accent: '#38bdf8' },
  { id: 'brasa',     label: 'Brasa',      bg: '#0a0a0a', accent: '#f59e0b' },
  { id: 'quartzo',   label: 'Quartzo',    bg: '#120810', accent: '#f472b6' },
  { id: 'neve',      label: 'Neve',       bg: '#f5f8fc', accent: '#0284c7' },
]

interface ThemeContextType {
  theme: ThemeName
  setTheme: (t: ThemeName) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function applyTheme(t: ThemeName) {
  document.documentElement.setAttribute('data-theme', t)
  localStorage.setItem('hd_theme', t)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>('meianoite')

  useEffect(() => {
    const stored = localStorage.getItem('hd_theme') as ThemeName | null
    const initial: ThemeName =
      stored && THEMES.some(t => t.id === stored) ? stored : 'meianoite'
    setThemeState(initial)
    applyTheme(initial)
  }, [])

  const setTheme = (t: ThemeName) => {
    setThemeState(t)
    applyTheme(t)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
