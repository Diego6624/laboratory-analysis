import { Navigate, useLocation } from 'react-router-dom'
import { isAdminAuthenticated } from '../services/labResultsApi.js'

export default function ProtectedAdmin({ children }) {
  const location = useLocation()

  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  return children
}
