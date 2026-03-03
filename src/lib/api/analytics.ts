import api from '@/lib/axios'
import type { ClassOverview, ActivityDataPoint } from '@/types'

export async function getClassOverview(classId: string): Promise<ClassOverview> {
  const { data } = await api.get<ClassOverview>(`/analytics/class/${classId}/overview`)
  return data
}

export async function getStudentProgress(studentId: string) {
  const { data } = await api.get(`/analytics/student/${studentId}/progress`)
  return data
}

export async function getDashboardStats() {
  const { data } = await api.get('/analytics/dashboard')
  return data
}

export async function getActivityData(days?: number): Promise<ActivityDataPoint[]> {
  const params = days ? { days } : {}
  const { data } = await api.get<ActivityDataPoint[]>('/analytics/activity', { params })
  return Array.isArray(data) ? data : []
}
