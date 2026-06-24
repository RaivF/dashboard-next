import { useEffect } from 'react'
import { THEME_VERSION } from './themeConfig.js'
import { useThemeStore } from './themeStore.js'

export function useTheme() {
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.setAttribute('data-theme-version', THEME_VERSION)
  }, [theme])

  return {
    theme,
    setTheme,
  }
}
