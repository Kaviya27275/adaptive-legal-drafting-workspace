import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import { APP_ROUTES } from './routes'
import OnboardingPage from './pages/OnboardingPage'
import Dashboard from './pages/Dashboard'
import DraftPage from './pages/DraftPage'
import ComparePage from './pages/ComparePage'
import PrecedentsPage from './pages/PrecedentsPage'
import MyDraftsPage from './pages/MyDraftsPage'
import ComplianceReportsPage from './pages/ComplianceReportsPage'
import SettingsPage from './pages/SettingsPage'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'
import AdminPage from './pages/AdminPage'
import ClausesPage from './pages/ClausesPage'
import ProtectedRoute from './components/common/ProtectedRoute'
import UploadPage from './pages/UploadPage'

export default function App() {
  return (
    <Routes>
      <Route path={APP_ROUTES.root} element={<Navigate to={APP_ROUTES.login} replace />} />
      <Route path={APP_ROUTES.login} element={<Login />} />
      <Route path={APP_ROUTES.register} element={<Register />} />
      <Route path={APP_ROUTES.onboarding} element={<Navigate to={APP_ROUTES.home} replace />} />

      <Route
        element={(
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        )}
      >
        <Route path={APP_ROUTES.home} element={<Dashboard />} />
        <Route path={APP_ROUTES.dashboard} element={<Navigate to={APP_ROUTES.home} replace />} />
        <Route path={APP_ROUTES.drafts} element={<MyDraftsPage />} />
        <Route path={APP_ROUTES.draftById()} element={<DraftPage />} />
        <Route path={APP_ROUTES.comparison} element={<ComparePage />} />
        <Route path={APP_ROUTES.precedents} element={<PrecedentsPage />} />
        <Route path={APP_ROUTES.clauses} element={<ClausesPage />} />
        <Route path={APP_ROUTES.upload} element={<UploadPage />} />
        <Route path={APP_ROUTES.reports} element={<ComplianceReportsPage />} />
        <Route path={APP_ROUTES.settings} element={<SettingsPage />} />
        <Route
          path={APP_ROUTES.admin}
          element={(
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminPage />
            </ProtectedRoute>
          )}
        />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
