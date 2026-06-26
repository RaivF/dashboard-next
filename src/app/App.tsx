import { lazy, Suspense } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import 'react-datepicker/dist/react-datepicker.css'
import DashboardPage from '../pages/dashboard/ui/DashboardPage.js'
import ReportPage from '../pages/report/ui/ReportPage.js'
import SpecialtiesPage from '../pages/specialties/ui/SpecialtiesPage.js'
import { useTheme } from '../features/theme-switcher/model/useTheme.js'
import ThemeSwitcher from '../features/theme-switcher/ui/ThemeSwitcher.js'
import { ManualEditingProvider } from '../features/manual-editing/model/ManualEditingProvider.js'
import EditModeToggle from '../features/manual-editing/ui/EditModeToggle.js'
import AppHeader from '../widgets/app-header/ui/AppHeader.js'
import { NAV_ITEMS, ROUTES, getRouteTitle, resolveRoutePath } from './routing/routes.js'
import type { RoutePath } from './routing/routes.js'

const CampusPlanPage = lazy(() => import('../pages/campus-plan/ui/CampusPlanPage.js'))
const CampusMapPage = lazy(() => import('../pages/campus-map/ui/CampusMapPage.js'))

type CurrentPageProps = {
  path: RoutePath
}

function CurrentPage({ path }: CurrentPageProps) {
  if (path === ROUTES.specialties) return <SpecialtiesPage />
  if (path === ROUTES.report) return <ReportPage />
  if (path === ROUTES.campusPlan) {
    return (
      <Suspense fallback={<div className="status-bar">Открываем план университета…</div>}>
        <CampusPlanPage />
      </Suspense>
    )
  }
  if (path === ROUTES.campusMap) {
    return (
      <Suspense fallback={<div className="status-bar">Открываем 3D-карту...</div>}>
        <CampusMapPage />
      </Suspense>
    )
  }
  return <DashboardPage />
}

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const pagePath = resolveRoutePath(location.pathname)
  const { theme, setTheme } = useTheme()

  function handleNavigate(path: RoutePath) {
    if (path !== location.pathname) {
      navigate(path)
    }
  }

  return (
    <ManualEditingProvider pageKey={pagePath} editablePages={[ROUTES.dashboard, ROUTES.report]}>
      <main className="app-shell">
        <AppHeader
          activePath={pagePath}
          navItems={NAV_ITEMS}
          title={getRouteTitle(pagePath)}
          onNavigate={handleNavigate}
        />

        <div data-manual-edit-scope="true">
          <CurrentPage path={pagePath} />
        </div>

        <footer className="dashboard-footer">
          <EditModeToggle />
          <ThemeSwitcher theme={theme} onThemeChange={setTheme} />
        </footer>
      </main>
    </ManualEditingProvider>
  )
}
