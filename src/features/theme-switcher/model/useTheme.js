import { useEffect, useState } from 'react'
import { THEME_OPTIONS, THEME_VERSION } from './themeConfig.js'

function getDefaultTheme() {
  const savedTheme = localStorage.getItem('dashboard-theme')
  const savedThemeVersion = localStorage.getItem('dashboard-theme-version')
  const legacyPrefix = ['app', 'le'].join('')

  if (savedTheme === `${legacyPrefix}-light`) return 'light'
  if (savedTheme === `${legacyPrefix}-dark`) return 'dark'
  if (savedTheme === 'night' && savedThemeVersion !== THEME_VERSION) {
    localStorage.setItem('dashboard-theme-version', THEME_VERSION)
    return 'light'
  }

  return THEME_OPTIONS.some((option) => option.value === savedTheme) ? savedTheme : 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState(getDefaultTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('dashboard-theme', theme)
    localStorage.setItem('dashboard-theme-version', THEME_VERSION)
  }, [theme])

  return {
    theme,
    setTheme,
  }
}
