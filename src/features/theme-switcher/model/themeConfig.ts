export const THEME_VERSION = 'light-primary-v1'

export const THEME_OPTIONS = [
  { value: 'light', label: 'Светлая' },
  { value: 'night', label: 'Ночь' },
  { value: 'dark', label: 'Тёмная' },
] as const

export type ThemeValue = (typeof THEME_OPTIONS)[number]['value']
