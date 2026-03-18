import { Navigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function ProtectedRoute({ children, role }) {
  const { user, profile } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (role && profile?.role !== role) {
    const dest = profile?.role === 'mentor' ? '/dashboard/mentor'
      : profile?.role === 'admin' ? '/dashboard/admin'
      : '/dashboard/youth'
    return <Navigate to={dest} replace />
  }
  return children
}
