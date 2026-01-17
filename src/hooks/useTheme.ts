'use client'

import { create } from 'zustand'
import { useEffect } from 'react'

type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  setTheme: (theme) => {
    set({ theme })
    // Aplicar clase al document
    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(theme)
      localStorage.setItem('theme', theme)
    }
  },
  toggleTheme: () => {
    const current = get().theme
    const newTheme = current === 'light' ? 'dark' : 'light'
    get().setTheme(newTheme)
  },
}))

// Hook que inicializa el tema desde localStorage o preferencia del sistema
export function useTheme() {
  const { theme, setTheme, toggleTheme } = useThemeStore()

  useEffect(() => {
    // Solo ejecutar en cliente
    if (typeof window === 'undefined') return

    // Intentar obtener tema guardado
    const savedTheme = localStorage.getItem('theme') as Theme | null

    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      // Si no hay tema guardado, usar preferencia del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light')
    }
  }, [setTheme])

  return { theme, setTheme, toggleTheme }
}

export { useThemeStore }
