// @ts-nocheck
const admission2025Top = [
  { level: 'Бакалавриат', name: '44.00.00 Образование и педагогические науки', total: 785, kcp: 559 },
  { level: 'Бакалавриат', name: '38.00.00 Экономика и управление', total: 601, kcp: 409 },
  { level: 'Бакалавриат', name: '40.00.00 Юриспруденция', total: 460, kcp: 205 },
  { level: 'Магистратура', name: '44.00.00 Образование и педагогические науки', total: 327, kcp: 286 },
  { level: 'Магистратура', name: '38.00.00 Экономика и управление', total: 277, kcp: 218 },
  { level: 'Специалитет', name: '40.00.00 Юриспруденция', total: 268, kcp: 115 },
  { level: 'Бакалавриат', name: '35.00.00 Сельское, лесное и рыбное хозяйство', total: 255, kcp: 165 },
  { level: 'Магистратура', name: '40.00.00 Юриспруденция', total: 237, kcp: 80 },
  { level: 'Бакалавриат', name: '13.00.00 Электро- и теплоэнергетика', total: 168, kcp: 130 },
  { level: 'Бакалавриат', name: '15.00.00 Машиностроение', total: 140, kcp: 99 },
]

const plan2026Top = [
  { level: 'Бакалавриат', name: '44.00.00 Образование и педагогические науки', total: 894, kcp: 576 },
  { level: 'Бакалавриат', name: '38.00.00 Экономика и управление', total: 721, kcp: 537 },
  { level: 'Магистратура', name: '44.00.00 Образование и педагогические науки', total: 613, kcp: 360 },
  { level: 'Магистратура', name: '38.00.00 Экономика и управление', total: 536, kcp: 321 },
  { level: 'Бакалавриат', name: '40.00.00 Юриспруденция', total: 535, kcp: 265 },
  { level: 'Бакалавриат', name: '35.00.00 Сельское, лесное и рыбное хозяйство', total: 341, kcp: 166 },
  { level: 'Бакалавриат', name: '13.00.00 Электро- и теплоэнергетика', total: 320, kcp: 155 },
  { level: 'Специалитет', name: '40.00.00 Юриспруденция', total: 306, kcp: 160 },
  { level: 'Бакалавриат', name: '02.00.00 Компьютерные и информационные науки', total: 260, kcp: 130 },
  { level: 'Бакалавриат', name: '15.00.00 Машиностроение', total: 211, kcp: 114 },
]

const bachelorGraduation = [
  { name: '02.00.00 Компьютерные и информационные науки', summer: 62, winter: 19, total: 81 },
  { name: '05.00.00 Науки о земле', summer: 6, winter: 4, total: 10 },
  { name: '06.00.00 Биологические науки', summer: 13, winter: 86, total: 99 },
  { name: '13.00.00 Электро- и теплоэнергетика', summer: 21, winter: 50, total: 71 },
  { name: '15.00.00 Машиностроение', summer: 26, winter: 25, total: 51 },
  { name: '19.00.00 Промышленная экология и биотехнологии', summer: 36, winter: 24, total: 60 },
  { name: '20.00.00 Техносферная безопасность и природообустройство', summer: 24, winter: 21, total: 45 },
  { name: '35.00.00 Сельское, лесное и рыбное хозяйство', summer: 37, winter: 58, total: 95 },
  { name: '37.00.00 Психологические науки', summer: 47, winter: 37, total: 84 },
  { name: '38.00.00 Экономика и управление', summer: 138, winter: 293, total: 431 },
  { name: '39.00.00 Социология и социальная работа', summer: 4, winter: 36, total: 40 },
  { name: '40.00.00 Юриспруденция', summer: 92, winter: 81, total: 173 },
  { name: '43.00.00 Сервис и туризм', summer: 6, winter: 9, total: 15 },
  { name: '44.00.00 Образование и педагогические науки', summer: 154, winter: 257, total: 411 },
  { name: '45.00.00 Языкознание и литературоведение', summer: 22, winter: 4, total: 26 },
  { name: '46.00.00 История и археология', summer: 5, winter: 4, total: 9 },
  { name: '52.00.00 Сценические искусства и литературное творчество', summer: 0, winter: 3, total: 3 },
]

const masterGraduation = [
  { name: '02.00.00 Компьютерные и информационные науки', summer: 12, winter: 12, total: 24 },
  { name: '04.04.01 Химия', summer: 12, winter: 0, total: 12 },
  { name: '05.00.00 Науки о земле', summer: 13, winter: 7, total: 20 },
  { name: '06.00.00 Биологические науки', summer: 22, winter: 0, total: 22 },
  { name: '10.00.00 Информационная безопасность', summer: 12, winter: 8, total: 20 },
  { name: '13.00.00 Электро- и теплоэнергетика', summer: 14, winter: 25, total: 39 },
  { name: '15.00.00 Машиностроение', summer: 31, winter: 9, total: 40 },
  { name: '19.00.00 Промышленная экология и биотехнологии', summer: 32, winter: 0, total: 32 },
  { name: '20.00.00 Техносферная безопасность и природообустройство', summer: 9, winter: 11, total: 20 },
  { name: '35.00.00 Сельское, лесное и рыбное хозяйство', summer: 46, winter: 37, total: 83 },
  { name: '37.00.00 Психологические науки', summer: 11, winter: 17, total: 28 },
  { name: '38.00.00 Экономика и управление', summer: 81, winter: 139, total: 220 },
  { name: '39.00.00 Социология и социальная работа', summer: 13, winter: 9, total: 22 },
  { name: '40.00.00 Юриспруденция', summer: 21, winter: 75, total: 96 },
  { name: '43.00.00 Сервис и туризм', summer: 12, winter: 0, total: 12 },
  { name: '44.00.00 Образование и педагогические науки', summer: 221, winter: 55, total: 276 },
  { name: '45.00.00 Языкознание и литературоведение', summer: 12, winter: 4, total: 16 },
  { name: '46.00.00 История и археология', summer: 9, winter: 0, total: 9 },
]

export function buildReport20252026Response() {
  return {
    title: 'Отчёт Выпуск 2026',
    source: 'ДОКЛАД ректора МОН++ (1).docx',
    admissionCampaign: {
      year: '2025/2026',
      programsTotal: 177,
      programBreakdown: [
        { name: 'Бакалавриат', quantity: 83 },
        { name: 'Специалитет', quantity: 6 },
        { name: 'Магистратура', quantity: 49 },
        { name: 'СПО', quantity: 18 },
        { name: 'Аспирантура', quantity: 21 },
      ],
      enrolledTotal2025: 5156,
      enrolledKcp2025: [
        { name: 'Бакалавриат', quantity: 2267 },
        { name: 'Специалитет', quantity: 177 },
        { name: 'Магистратура', quantity: 1069 },
      ],
      admission2025Top,
      plan2026: [
        { name: 'Бакалавриат', total: 4716, kcp: 2885, growthPercent: 28, kcpDelta: 618 },
        { name: 'Специалитет', total: 485, kcp: 270, growthPercent: 174, kcpDelta: 93 },
        { name: 'Магистратура', total: 2587, kcp: 1530, growthPercent: 88, kcpDelta: 461 },
      ],
      plan2026Top,
      context: [
        { name: 'Выпуск школ Запорожской области', value: 2539, note: 'учеников в 2026 году' },
        { name: 'Очная КЦП бакалавриата и специалитета', value: 2438, note: '96% от выпуска всех школ' },
        { name: 'Выпуск бакалавров', value: 2683, note: 'ориентир для набора в магистратуру' },
        { name: 'План магистратуры', value: 2587, note: '96% от выпуска бакалавров' },
      ],
    },
    graduation: {
      year: '2026',
      total: 2695,
      summer: {
        title: 'Летний выпуск',
        quantity: 1276,
        description: 'Студенты очной формы обучения. Окончание по календарному графику 03.07.2026, при каникулах после ГИА - 31.08.2026.',
      },
      winter: {
        title: 'Зимний выпуск',
        quantity: 1419,
        description: 'Студенты очно-заочной и заочной формы обучения. Выпуск зимой 2026 состоялся.',
      },
      levels: [
        { name: 'Бакалавры', summer: 693, winter: 1011, total: 1704, rows: bachelorGraduation },
        { name: 'Магистры', summer: 583, winter: 408, total: 991, rows: masterGraduation },
      ],
    },
  }
}
