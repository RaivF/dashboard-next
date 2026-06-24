import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { THEME_OPTIONS, THEME_VERSION } from './themeConfig.js'

function getLegacyTheme() {
  if (typeof localStorage === 'undefined') return 'light'

  const savedTheme = localStorage.getItem('dashboard-theme')
  const savedThemeVersion = localStorage.getItem('dashboard-theme-version')
  const legacyPrefix = ['app', 'le'].join('')

  if (savedTheme === `${legacyPrefix}-light`) return 'light'
  if (savedTheme === `${legacyPrefix}-dark`) return 'dark'
  if (savedTheme === 'night' && savedThemeVersion !== THEME_VERSION) return 'light'

  return THEME_OPTIONS.some((option) => option.value === savedTheme) ? savedTheme : 'light'
}

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: getLegacyTheme(),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'dashboard-theme-state',
      partialize: ({ theme }) => ({ theme }),
    },
  ),
)
