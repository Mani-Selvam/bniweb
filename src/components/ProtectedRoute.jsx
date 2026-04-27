import { Navigate, useLocation } from 'react-router-dom'
import { useAuth, dashboardPathForRole } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="page-loading">Loading…</div>
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={dashboardPathForRole(user.role)} replace />
  }
  return children
}
