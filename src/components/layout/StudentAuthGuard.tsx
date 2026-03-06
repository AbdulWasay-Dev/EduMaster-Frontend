import { Navigate, Outlet } from 'react-router-dom'
import { useStudentAuthStore } from '@/store/studentAuthStore'

export default function StudentAuthGuard() {
  const isAuthenticated = useStudentAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/student/login" replace />
  return <Outlet />
}
