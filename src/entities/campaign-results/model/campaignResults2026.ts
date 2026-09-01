export type PlanActualResult = {
  id: string
  name: string
  plan: number
  enrolled: number
}

export type RankedResult = {
  id: string
  name: string
  value: number
  code?: string
  caption?: string
}

export type YearComparison = {
  id: string
  name: string
  previous: number
  current: number
}

export const CAMPAIGN_RESULTS_2026 = {
  source: {
    title: 'Приёмная кампания 2026',
    snapshotDate: '2026-08-31',
    snapshotLabel: '31 августа 2026 года',
    slides: '2–16',
  },
  applications: {
    total: 16_910,
    methods: [
      { id: 'epgu', name: 'ЕПГУ', previous: 1_116, current: 2_742 },
      { id: 'personal-account', name: 'Личный кабинет', previous: 479, current: 0 },
      { id: 'in-person', name: 'Лично', previous: 13_716, current: 14_168 },
    ] satisfies YearComparison[],
    priorities: [
      { id: 'priority-1', name: '1', value: 6_191 },
      { id: 'priority-2', name: '2', value: 3_572 },
      { id: 'priority-3', name: '3', value: 2_599 },
      { id: 'priority-4', name: '4', value: 1_974 },
      { id: 'priority-5', name: '5', value: 1_452 },
      { id: 'priority-6', name: '6', value: 483 },
      { id: 'priority-7', name: '7', value: 314 },
      { id: 'priority-8', name: '8', value: 155 },
      { id: 'priority-9', name: '9', value: 102 },
      { id: 'priority-10', name: '10', value: 32 },
      { id: 'priority-11', name: '11', value: 16 },
      { id: 'priority-12', name: '12', value: 9 },
      { id: 'priority-13', name: '13', value: 6 },
      { id: 'priority-14', name: '14', value: 2 },
      { id: 'priority-15', name: '15', value: 1 },
    ] satisfies RankedResult[],
  },
  higherEducation: {
    id: 'higher-education',
    name: 'Высшее образование',
    plan: 4_658,
    enrolled: 4_658,
    levels: [
      { id: 'bachelor', name: 'Бакалавриат', plan: 2_858, enrolled: 2_858 },
      { id: 'specialist', name: 'Специалитет', plan: 270, enrolled: 270 },
      { id: 'master', name: 'Магистратура', plan: 1_530, enrolled: 1_530 },
    ] satisfies PlanActualResult[],
  },
  secondaryVocational: {
    id: 'secondary-vocational',
    name: 'Среднее профессиональное образование',
    plan: 650,
    enrolled: 425,
  },
  geography: {
    regionsTotal: 47,
    selectedRegions: [
      { id: 'moscow', name: 'Москва и Московская область', value: 18 },
      { id: 'saint-petersburg', name: 'Санкт-Петербург и Ленинградская область', value: 3 },
      { id: 'rostov', name: 'Ростовская область', value: 6 },
      { id: 'krasnodar', name: 'Краснодарский край', value: 12 },
      { id: 'donbass', name: 'ДНР и ЛНР', value: 29 },
      { id: 'south', name: 'Херсонская область и Республика Крым', value: 265 },
    ] satisfies RankedResult[],
  },
  ages: {
    byLevelAndForm: [
      { id: 'bachelor-specialist', name: 'Бакалавриат и специалитет', fullTime: 22.4, mixed: 29.9, partTime: 30.3 },
      { id: 'master', name: 'Магистратура', fullTime: 32.7, mixed: 40.9, partTime: 40.4 },
      { id: 'secondary-vocational', name: 'СПО', fullTime: 27.1, mixed: null, partTime: null },
    ],
    byFaculty: [
      { id: 'law', name: 'Юридический факультет', value: 22.4 },
      { id: 'technology', name: 'Технологический факультет', value: 25.1 },
      { id: 'tourism-service', name: 'Факультет туризма и сервиса', value: 26.9 },
      { id: 'economics', name: 'Экономический факультет', value: 27 },
      { id: 'innovative-pedagogy', name: 'Факультет инновационной педагогики', value: 28 },
      { id: 'energy', name: 'Энергетический факультет', value: 29.1 },
      { id: 'social-humanities', name: 'Социально-гуманитарный факультет', value: 29.4 },
      { id: 'natural-sciences', name: 'Факультет естественных наук', value: 29.5 },
      { id: 'agrotechnology', name: 'Агротехнологический факультет', value: 29.7 },
      { id: 'general-education', name: 'Факультет общего образования', value: 29.8 },
    ] satisfies RankedResult[],
    byBranch: [
      { id: 'berdyansk', name: 'Бердянский филиал', value: 23.8 },
      { id: 'vasilevka', name: 'Васильевский колледж', value: 27.8 },
      { id: 'energodar', name: 'Энергодарский филиал', value: 31.8 },
    ] satisfies RankedResult[],
  },
  demand: {
    topApplications: [
      { id: 'law-criminal', code: '40.03.01', name: 'Юриспруденция', caption: 'Уголовно-правовой профиль', value: 515 },
      { id: 'law-civil', code: '40.03.01', name: 'Юриспруденция', caption: 'Гражданско-правовой профиль', value: 509 },
      { id: 'prosecution', code: '40.05.04', name: 'Судебная и прокурорская деятельность', caption: 'Прокурорская деятельность', value: 440 },
      { id: 'public-administration', code: '38.03.04', name: 'Государственное и муниципальное управление', value: 429 },
      { id: 'management', code: '38.03.02', name: 'Менеджмент', caption: 'Менеджмент предприятий и организаций', value: 392 },
    ] satisfies RankedResult[],
    lowestApplications: [
      { id: 'music', code: '44.03.01', name: 'Педагогическое образование', caption: 'Музыка', value: 19 },
      { id: 'geography', code: '05.03.02', name: 'География', caption: 'Физическая и социальная география', value: 29 },
      { id: 'history-orthodox', code: '44.03.05', name: 'Педагогическое образование (с двумя профилями)', caption: 'История и православная культура', value: 30 },
      { id: 'soil-science', code: '06.03.02', name: 'Почвоведение', caption: 'Оценка качества почв и биотехнологический контроль', value: 31 },
      { id: 'primary-foreign', code: '44.03.05', name: 'Педагогическое образование (с двумя профилями)', caption: 'Начальное образование и иностранный язык', value: 33 },
    ] satisfies RankedResult[],
    peoplePerPlace: [
      { id: 'construction', code: '08.03.01', name: 'Строительство', caption: 'Промышленное и гражданское строительство', value: 2.3 },
      { id: 'psychology', code: '37.03.01', name: 'Психология', value: 2.2 },
      { id: 'prosecution', code: '40.05.04', name: 'Судебная и прокурорская деятельность', value: 2.1 },
      { id: 'linguistics', code: '45.03.02', name: 'Лингвистика', value: 1.7 },
      { id: 'law-criminal', code: '40.03.01', name: 'Юриспруденция', caption: 'Уголовно-правовой профиль', value: 1.6 },
    ] satisfies RankedResult[],
    applicationsPerPlace: [
      { id: 'economics', code: '38.03.01', name: 'Экономика', caption: 'Экономика предприятий и организаций', value: 8.9 },
      { id: 'sociology', code: '39.03.01', name: 'Социология', value: 8.7 },
      { id: 'physical-education', code: '49.03.01', name: 'Физическая культура', value: 7.9 },
      { id: 'law-criminal', code: '40.03.01', name: 'Юриспруденция', caption: 'Уголовно-правовой профиль', value: 7.8 },
      { id: 'prosecution', code: '40.05.04', name: 'Судебная и прокурорская деятельность', value: 7.3 },
    ] satisfies RankedResult[],
  },
  quotas: {
    enrolledByYear: [
      { year: 2024, special: 75, separate: 66, target: 0 },
      { year: 2025, special: 118, separate: 65, target: 4 },
      { year: 2026, special: 120, separate: 127, target: 1 },
    ],
    detailed2025: [
      { id: 'orphans', name: 'Дети-сироты', value: 36 },
      { id: 'veterans', name: 'Ветераны боевых действий', value: 55 },
      { id: 'disabled', name: 'Инвалиды', value: 29 },
      { id: 'svo-participants', name: 'Участники СВО', value: 81 },
      { id: 'svo-children', name: 'Дети участников СВО', value: 46 },
    ] satisfies RankedResult[],
  },
  branches: [
    { id: 'vasilevka', name: 'Васильевский колледж', planSpo: 275, enrolledSpo: 152, contractSpo: 0, enrolledHigher: 0, note: '' },
    { id: 'berdyansk', name: 'Бердянский филиал', planSpo: 225, enrolledSpo: 140, contractSpo: 0, enrolledHigher: 0, note: '' },
    { id: 'energodar', name: 'Энергодарский филиал', planSpo: 150, enrolledSpo: 133, contractSpo: 1, enrolledHigher: 295, note: 'Ещё 1 обучающийся СПО принят по договору' },
  ],
} as const

export function getCompletionPercent(enrolled: number, plan: number): number {
  if (!plan) return 0
  return enrolled / plan * 100
}

export function sumValues(rows: readonly { value: number }[]): number {
  return rows.reduce((sum, row) => sum + row.value, 0)
}
