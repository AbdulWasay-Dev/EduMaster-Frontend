import axios from 'axios'
import { useAuthStore } from '@/store/authStore'
import { useStudentAuthStore } from '@/store/studentAuthStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — attach JWT token (teacher OR student)
api.interceptors.request.use(
  (config) => {
    // Prefer teacher token, fall back to student token
    const teacherToken = useAuthStore.getState().token
    const studentToken = useStudentAuthStore.getState().token
    const token = teacherToken || studentToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Check which auth store is active and log them out
      const teacherAuth = useAuthStore.getState()
      const studentAuth = useStudentAuthStore.getState()
      if (teacherAuth.isAuthenticated) {
        teacherAuth.logout()
        window.location.href = '/login'
      } else if (studentAuth.isAuthenticated) {
        studentAuth.logout()
        window.location.href = '/student/login'
      } else {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default api
