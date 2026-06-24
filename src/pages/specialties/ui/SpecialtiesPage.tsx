import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { SPECIALTY_LEVEL_OPTIONS } from '../../../entities/specialties/lib/specialties.js'
import { useSpecialties } from '../../../entities/specialties/model/useSpecialties.js'

const ALL_LEVELS_LABEL = SPECIALTY_LEVEL_OPTIONS[0]

export default function SpecialtiesPage() {
  const { rows, loading, error } = useSpecialties()
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState(ALL_LEVELS_LABEL)

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return rows.filter((item) => {
      const matchesLevel = level === ALL_LEVELS_LABEL || item.level === level
      const matchesQuery =
        !normalizedQuery ||
        item.code.toLowerCase().includes(normalizedQuery) ||
        item.name.toLowerCase().includes(normalizedQuery)

      return matchesLevel && matchesQuery
    })
  }, [level, query, rows])

  const levelCounts = useMemo(() => {
    return rows.reduce((map, item) => {
      map.set(item.level, (map.get(item.level) || 0) + 1)
      return map
    }, new Map<string, number>())
  }, [rows])

  return (
    <section className="specialties-page">
      <div className="specialties-toolbar">
        <label className="specialties-search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="РќР°Р№С‚Рё РїРѕ РєРѕРґСѓ РёР»Рё РЅР°Р·РІР°РЅРёСЋ"
            aria-label="РџРѕРёСЃРє СЃРїРµС†РёР°Р»СЊРЅРѕСЃС‚Рё"
          />
        </label>

        <select
          className="specialties-select"
          value={level}
          onChange={(event) => setLevel(event.target.value)}
          aria-label="Р¤РёР»СЊС‚СЂ РїРѕ СѓСЂРѕРІРЅСЋ"
        >
          {SPECIALTY_LEVEL_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="specialties-summary" aria-label="РЎРІРѕРґРєР° РїРѕ СЃРїРµС†РёР°Р»СЊРЅРѕСЃС‚СЏРј">
        <span>
          <strong>{rows.length}</strong>
          Р’СЃРµРіРѕ
        </span>
        {SPECIALTY_LEVEL_OPTIONS.filter((option) => option !== ALL_LEVELS_LABEL).map((option) => (
          <span key={option}>
            <strong>{levelCounts.get(option) || 0}</strong>
            {option}
          </span>
        ))}
      </div>

      <section className="panel specialties-panel">
        <div className="panel__header">
          <div>
            <h2>РЎРїСЂР°РІРѕС‡РЅРёРє СЃРїРµС†РёР°Р»СЊРЅРѕСЃС‚РµР№</h2>
            <p>РљРѕРґС‹ Рё СЂР°СЃС€РёС„СЂРѕРІРєРё РёР· С‚Р°Р±Р»РёС†С‹ 1РЎ</p>
          </div>
        </div>

        {error && <div className="table-list__empty">РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё: {error}</div>}

        {!error && loading && (
          <div className="table-loading" aria-label="Р—Р°РіСЂСѓР·РєР° С‚Р°Р±Р»РёС†С‹ СЃРїРµС†РёР°Р»СЊРЅРѕСЃС‚РµР№">
            {Array.from({ length: 8 }).map((_, index) => (
              <div className="table-loading__row" key={index}>
                <span className="table-loading__rank" />
                <span className="table-loading__text">
                  <span />
                  <small />
                </span>
                <strong />
              </div>
            ))}
          </div>
        )}

        {!error && !loading && (
          <div className="specialties-table-wrap">
            <table className="specialties-table">
              <thead>
                <tr>
                  <th>РљРѕРґ</th>
                  <th>РќР°РёРјРµРЅРѕРІР°РЅРёРµ</th>
                  <th>РЈСЂРѕРІРµРЅСЊ</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((item) => (
                  <tr key={`${item.code}-${item.name}`}>
                    <td>{item.code}</td>
                    <td>{item.name}</td>
                    <td>{item.level}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredRows.length === 0 && (
              <div className="table-list__empty">РќРµС‚ СЃС‚СЂРѕРє РїРѕ РІС‹Р±СЂР°РЅРЅС‹Рј С„РёР»СЊС‚СЂР°Рј</div>
            )}
          </div>
        )}
      </section>
    </section>
  )
}
