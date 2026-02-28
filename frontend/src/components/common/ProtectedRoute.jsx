import { Navigate, useLocation } from 'react-router-dom'
import { useWorkspace } from '../../context/WorkspaceContext'
import { APP_ROUTES } from '../../routes'

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, currentUser } = useWorkspace()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to={APP_ROUTES.login} replace state={{ from: location.pathname }} />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser?.role)) {
    return <Navigate to={APP_ROUTES.home} replace />
  }

  return children
}
