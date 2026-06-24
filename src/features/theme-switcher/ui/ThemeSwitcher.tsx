import { Palette } from 'lucide-react'
import { THEME_OPTIONS } from '../model/themeConfig.js'
import type { ThemeValue } from '../model/themeConfig.js'

type ThemeSwitcherProps = {
  theme: ThemeValue
  onThemeChange: (theme: ThemeValue) => void
}

export default function ThemeSwitcher({ theme, onThemeChange }: ThemeSwitcherProps) {
  return (
    <label className="theme-switcher">
      <Palette size={14} aria-hidden="true" />
      <select
        value={theme}
        onChange={(event) => onThemeChange(event.target.value as ThemeValue)}
        aria-label="Р’С‹Р±РѕСЂ С‚РµРјС‹ РѕС„РѕСЂРјР»РµРЅРёСЏ"
      >
        {THEME_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
