import { create } from 'zustand'
import type { ThemeValue } from './themeConfig.js'

type ThemeState = {
  theme: ThemeValue
  setTheme: (theme: ThemeValue) => void
}

export const useThemeStore = create<ThemeState>()((set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme }),
}))
