import { Palette } from 'lucide-react'
import { THEME_OPTIONS } from '../model/themeConfig.js'

export default function ThemeSwitcher({ theme, onThemeChange }) {
  return (
    <label className="theme-switcher">
      <Palette size={14} aria-hidden="true" />
      <select value={theme} onChange={(event) => onThemeChange(event.target.value)} aria-label="Выбор темы оформления">
        {THEME_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}
