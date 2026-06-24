import { lazy, Suspense, useEffect, useState } from 'react'
import 'react-datepicker/dist/react-datepicker.css'
import DashboardPage from '../pages/dashboard/ui/DashboardPage.jsx'
import ReportPage from '../pages/report/ui/ReportPage.jsx'
import SpecialtiesPage from '../pages/specialties/ui/SpecialtiesPage.jsx'
import { useTheme } from '../features/theme-switcher/model/useTheme.js'
import ThemeSwitcher from '../features/theme-switcher/ui/ThemeSwitcher.jsx'
import AppHeader from '../widgets/app-header/ui/AppHeader.jsx'
import { NAV_ITEMS, ROUTES, getRouteTitle, resolveRoutePath } from './routing/routes.js'

const CampusPlanPage = lazy(() => import('../pages/campus-plan/ui/CampusPlanPage.jsx'))
const CampusMapPage = lazy(() => import('../pages/campus-map/ui/CampusMapPage.jsx'))

function CurrentPage({ path }) {
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
  const [pagePath, setPagePath] = useState(() => resolveRoutePath(window.location.pathname))
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const handlePopState = () => setPagePath(resolveRoutePath(window.location.pathname))
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function navigate(path) {
    if (path !== window.location.pathname) {
      window.history.pushState({}, '', path)
    }

    setPagePath(resolveRoutePath(path))
  }

  return (
    <main className="app-shell">
      <AppHeader
        activePath={pagePath}
        navItems={NAV_ITEMS}
        title={getRouteTitle(pagePath)}
        onNavigate={navigate}
      />

      <CurrentPage path={pagePath} />

      <footer className="dashboard-footer">
        <ThemeSwitcher theme={theme} onThemeChange={setTheme} />
      </footer>
    </main>
  )
}
