import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  KCP_DEFAULT_SORT_MODE,
  KCP_OFFICIAL_LEVELS_2026,
  KCP_OFFICIAL_SUMMARY_2026,
  KCP_SORT_OPTIONS,
} from '../src/widgets/dashboard/lib/kcpProgress.js'
import KcpProgress from '../src/widgets/dashboard/ui/KcpProgress.js'

describe('KCP progress labels', () => {
  it('uses readable Russian labels for all sorting controls', () => {
    assert.deepEqual(KCP_SORT_OPTIONS.map((option) => option.label), [
      'Заполненность ↑',
      'Заполненность ↓',
      'А–Я',
      'КЦП ↓',
    ])
    assert.equal(KCP_DEFAULT_SORT_MODE, 'fillDesc')
  })

  it('uses the official enrollment result for the 2026 aggregate summary', () => {
    assert.deepEqual(KCP_OFFICIAL_SUMMARY_2026, {
      enrolled: 4_658,
      plan: 4_658,
      percent: 100,
    })
  })
})

describe('KCP progress campaign data', () => {
  it('reconciles the three 2026 education levels with the total enrollment and plan', () => {
    assert.deepEqual(
      KCP_OFFICIAL_LEVELS_2026.map(({ name, plan, enrolled, percent }) => ({ name, plan, enrolled, percent })),
      [
        { name: 'Бакалавриат', plan: 2_858, enrolled: 2_858, percent: 100 },
        { name: 'Специалитет', plan: 270, enrolled: 270, percent: 100 },
        { name: 'Магистратура', plan: 1_530, enrolled: 1_530, percent: 100 },
      ],
    )
    assert.equal(KCP_OFFICIAL_LEVELS_2026.reduce((sum, level) => sum + level.plan, 0), KCP_OFFICIAL_SUMMARY_2026.plan)
    assert.equal(KCP_OFFICIAL_LEVELS_2026.reduce((sum, level) => sum + level.enrolled, 0), KCP_OFFICIAL_SUMMARY_2026.enrolled)
  })

  for (const loading of [false, true]) {
    it(`keeps all 2026 levels available without API data while loading is ${loading}`, () => {
      const html = renderToStaticMarkup(createElement(KcpProgress, { campaignYear: 2026, data: null, loading }))
        .replace(/[\u00a0\u202f]/g, ' ')

      assert.match(html, /Итог зачисления: 4 658 из 4 658/)
      assert.match(html, /aria-busy="false"/)
      assert.match(html, /tabindex="0" aria-expanded="false"/)
      assert.match(html, /id="kcp-directions-details"/)
      assert.equal((html.match(/<article class="kcp-panel__direction">/g) || []).length, 3)
      for (const [name, value] of [['Бакалавриат', '2 858'], ['Специалитет', '270'], ['Магистратура', '1 530']]) {
        assert.ok(html.includes(`<span>${name}</span>`))
        assert.ok(html.includes(`<strong>${value}</strong>Зачислено`))
        assert.ok(html.includes(`<strong>${value}</strong>КЦП`))
      }
      assert.doesNotMatch(html, /Загрузка|Нет данных|приоритет|согласи|осталось|остаток|Поиск|Сортировка|направлений/)
    })
  }

  it('does not mix stale API directions and consent counts into the 2026 enrollment results', () => {
    const html = renderToStaticMarkup(createElement(KcpProgress, {
      campaignYear: 2026,
      loading: false,
      data: {
        hasPlan: true,
        current: 175,
        plan: 700,
        percent: 25,
        fillPercent: 25,
        remaining: 525,
        directions: [{
          code: '00.00.00',
          name: 'Устаревшее направление API',
          plan: 700,
          current: 175,
          percent: 25,
          fillPercent: 25,
          remaining: 525,
          overflow: 0,
        }],
      },
    }))

    assert.match(html, /Выполнение КЦП по ВО/)
    assert.doesNotMatch(html, /Устаревшее направление API|00\.00\.00|175|525|25,0%/)
    assert.equal((html.match(/<article class="kcp-panel__direction">/g) || []).length, 3)
  })

  it('keeps the 2025 summary tied to operational API data', () => {
    const html = renderToStaticMarkup(createElement(KcpProgress, {
      campaignYear: 2025,
      loading: false,
      data: { hasPlan: true, current: 175, plan: 700, percent: 25, fillPercent: 25 },
    }))

    assert.match(html, /Оперативный спрос по КЦП/)
    assert.match(html, /Первый приоритет и согласие/)
    assert.match(html, /25,0%/)
    assert.match(html, /width:25%/)
    assert.doesNotMatch(html, /Итог зачисления|Магистратура|Зачислено/)
  })

  it('does not use the 2026 fallback when 2025 API data is unavailable', () => {
    const html = renderToStaticMarkup(createElement(KcpProgress, { campaignYear: 2025, data: null, loading: true }))

    assert.match(html, /aria-busy="true"/)
    assert.match(html, /Загрузка…/)
    assert.doesNotMatch(html, /aria-expanded|kcp-panel__direction-list|Бакалавриат|100%/)
  })
})
