import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parseSpecialtiesMxl } from '../../../src/entities/specialties/lib/specialties.js'

type Specialty = {
  code: string
  name: string
}

type AdmissionDirectionPlan = Specialty & {
  quantity: number
}

type MockApplicantStatistic = {
  application_method: string
  date: string
  degree_type: string
  form_of_education: string
  funding_type: string
  priority: number
  quantity: number
  specialty: Specialty
}

const FUNDING_TYPES = ['Бюджетная основа', 'Полное возмещение затрат', 'Целевая квота', 'Отдельная квота', 'Особая квота']
const FUNDING_MULTIPLIERS = new Map([
  ['Бюджетная основа', 1.55],
  ['Полное возмещение затрат', 1.02],
  ['Целевая квота', 0.48],
  ['Отдельная квота', 0.16],
  ['Особая квота', 0.12],
])
const FORMS = ['Очная', 'Заочная', 'Очно-Заочная']
const DEGREES = [
  'Среднее профессиональное образование',
  'Бакалавриат',
  'Магистратура',
  'Специалитет',
  'Аспирантура',
]
const METHODS = ['Веб', 'Лично', 'Почта', 'Суперсервис "Поступление в вуз онлайн"', '<Объект не найден>']
const SPECIALTIES = [
  { code: '09.03.01', name: 'Информатика и вычислительная техника' },
  { code: '38.03.01', name: 'Экономика' },
  { code: '44.03.01', name: 'Педагогическое образование' },
  { code: '40.03.01', name: 'Юриспруденция' },
  { code: '35.03.04', name: 'Агрономия' },
  { code: '08.03.01', name: 'Строительство' },
  { code: '23.03.03', name: 'Эксплуатация транспортно-технологических машин и комплексов' },
  { code: '19.03.04', name: 'Технология продукции и организация общественного питания' },
]
const SPECIALTIES_MXL_PATH = fileURLToPath(new URL('../../../public/specialties.mxl', import.meta.url))

function loadSpecialties(): Specialty[] {
  try {
    const rows = parseSpecialtiesMxl(readFileSync(SPECIALTIES_MXL_PATH))
    return rows.length ? rows.map(({ code, name }) => ({ code, name })) : SPECIALTIES
  } catch {
    return SPECIALTIES
  }
}

const MOCK_SPECIALTIES = loadSpecialties()

function buildAdmissionDirectionPlans(total: number, year: number): AdmissionDirectionPlan[] {
  const weights = MOCK_SPECIALTIES.map((specialty, index) => ({
    ...specialty,
    weight: 0.82 + seededRandom(year, index, 419) * 0.74,
  }))
  const weightTotal = weights.reduce((sum, item) => sum + item.weight, 0)
  let allocated = 0

  return weights.map((item, index) => {
    const quantity = index === weights.length - 1
      ? total - allocated
      : Math.round((total * item.weight) / weightTotal)
    allocated += quantity

    return {
      code: item.code,
      name: item.name,
      quantity,
    }
  })
}

function buildAdmissionControlNumbers(year: number) {
  const yearShift = Math.round(seededRandom(year, 311) * 420)
  const total = 32000 + yearShift

  return {
    total,
    directions: buildAdmissionDirectionPlans(total, year),
    categories: [
      { name: 'Бюджетная основа', quantity: Math.round(total * 0.44) },
      { name: 'Платное обучение', quantity: Math.round(total * 0.34) },
      { name: 'Целевая квота', quantity: Math.round(total * 0.13) },
      { name: 'Отдельная квота', quantity: Math.round(total * 0.05) },
      { name: 'Особая квота', quantity: Math.round(total * 0.04) },
    ],
  }
}

function getDaysInYear(year: number): number {
  return new Date(Date.UTC(Number(year), 1, 29)).getUTCMonth() === 1 ? 366 : 365
}

function getDateByDayOffset(year: number, dayOffset: number): Date {
  const date = new Date(Date.UTC(Number(year), 0, 1))
  date.setUTCDate(date.getUTCDate() + dayOffset)
  return date
}

function makeDate(year: number, dayOffset: number, itemIndex = 0): string {
  const date = getDateByDayOffset(year, dayOffset)
  const hour = 8 + ((dayOffset * 3 + itemIndex * 5) % 11)
  const minute = ((dayOffset + itemIndex) % 2) * 30
  date.setUTCHours(hour, minute, 0, 0)
  return date.toISOString().replace('.000Z', '')
}

function seededRandom(...parts: number[]): number {
  const seed = parts.reduce((acc, value, index) => acc + Number(value) * (9973 + index * 7919), 0)
  const raw = Math.sin(seed) * 10000
  return raw - Math.floor(raw)
}

function getSeasonFactor(year: number, dayOffset: number): number {
  const date = getDateByDayOffset(year, dayOffset)
  const month = date.getUTCMonth()
  const dayOfYear = dayOffset + 1

  const monthBase = [0.07, 0.08, 0.11, 0.20, 0.38, 0.90, 1.42, 1.08, 0.46, 0.20, 0.11, 0.08][month]
  const mainPeak = Math.exp(-((dayOfYear - 194) ** 2) / (2 * 28 ** 2))
  const augustPeak = Math.exp(-((dayOfYear - 232) ** 2) / (2 * 18 ** 2))
  const weeklyWave = 0.92 + Math.sin((dayOffset + Number(year) % 17) / 4.7) * 0.10

  return Math.max(0.03, (monthBase + mainPeak * 0.80 + augustPeak * 0.35) * weeklyWave)
}

function buildMockItems(year: number, previousYearMode = false): MockApplicantStatistic[] {
  const items: MockApplicantStatistic[] = []
  const daysInYear = getDaysInYear(year)
  const numericYear = Number(year)
  const yearFactor = 0.88 + seededRandom(numericYear, 41) * 0.34
  const previousYearFactor = previousYearMode ? 0.78 + seededRandom(numericYear, 97) * 0.30 : 1

  for (let day = 0; day < daysInYear; day += 1) {
    const seasonFactor = getSeasonFactor(year, day)

    FUNDING_TYPES.forEach((fundingType, fundingIndex) => {
      FORMS.forEach((form, formIndex) => {
        const degree = DEGREES[(day + fundingIndex + formIndex) % DEGREES.length]
        const method = METHODS[(day + formIndex + fundingIndex) % METHODS.length]
        const specialty = MOCK_SPECIALTIES[(day + fundingIndex * 2 + formIndex) % MOCK_SPECIALTIES.length]
        const random = seededRandom(year, day, fundingIndex, formIndex)
        const dayNoise = 0.72 + random * 0.70
        const base = 2 + fundingIndex * 5 + formIndex * 3 + Math.round(random * 11)
        const fundingMultiplier = FUNDING_MULTIPLIERS.get(fundingType) || 1
        const formMultiplier = form === 'Очная' ? 1.18 : form === 'Заочная' ? 0.78 : 0.62
        const methodMultiplier = method.includes('Суперсервис') ? 1.12 : method === 'Веб' ? 1.22 : method === 'Почта' ? 0.28 : 1
        const rawQuantity = base * seasonFactor * fundingMultiplier * formMultiplier * methodMultiplier * yearFactor * previousYearFactor * dayNoise
        const quantity = method === '<Объект не найден>' ? 0 : Math.max(0, Math.round(rawQuantity))

        items.push({
          date: makeDate(year, day, fundingIndex * FORMS.length + formIndex),
          funding_type: fundingType,
          form_of_education: form,
          priority: (day % 6) + 1,
          degree_type: degree,
          application_method: method,
          specialty,
          quantity,
        })
      })
    })
  }

  return items
}

export function buildMockResponse(period = '2025-01') {
  const year = Number(String(period).slice(0, 4)) || 2025
  const applicants_statistics = buildMockItems(year)
  const previous_year_statistics = buildMockItems(year - 1, true)

  return {
    applicants_statistics,
    previous_year_statistics,
    admission_control_numbers: buildAdmissionControlNumbers(year),
    meta: {
      source: 'mock',
      note: 'Демо-данные за полный календарный год. Добавьте Excel в DATA или включите источник Excel в .env.',
      period,
    },
  }
}
