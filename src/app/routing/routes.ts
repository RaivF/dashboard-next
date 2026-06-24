export const ROUTES = {
  dashboard: '/',
  specialties: '/specialties',
  report: '/report-2025-2026',
  campusPlan: '/campus-plan',
  campusMap: '/campus-map',
} as const

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]

export type NavItem = {
  path: RoutePath
  label: string
  title: string
}

export const NAV_ITEMS: NavItem[] = [
  {
    path: ROUTES.dashboard,
    label: 'Дашборд',
    title: 'Мониторинг приёмной кампании',
  },
  {
    path: ROUTES.specialties,
    label: 'Специальности',
    title: 'Справочник специальностей',
  },
  {
    path: ROUTES.report,
    label: 'Отчёт Выпуск 2026',
    title: 'Отчёт Выпуск 2026',
  },
  {
    path: ROUTES.campusPlan,
    label: 'План вуза',
    title: 'План университета',
  },
  {
    path: ROUTES.campusMap,
    label: '3D-карта',
    title: '3D-карта кампуса',
  },
]

export function resolveRoutePath(pathname: string): RoutePath {
  return NAV_ITEMS.some((item) => item.path === pathname) ? (pathname as RoutePath) : ROUTES.dashboard
}

export function getRouteTitle(pathname: string): string {
  return NAV_ITEMS.find((item) => item.path === pathname)?.title || NAV_ITEMS[0].title
}
