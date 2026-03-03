import api from '@/lib/axios'
import type { Class } from '@/types'

export interface CreateClassPayload {
  name: string
  description?: string
  grade_level?: string
  subject_area?: string
  academic_year?: string
}

export async function listClasses(): Promise<Class[]> {
  const { data } = await api.get<{ classes?: Class[] } | Class[]>('/classes/')
  return Array.isArray(data) ? data : ((data as { classes?: Class[] }).classes ?? [])
}

export async function createClass(payload: CreateClassPayload): Promise<Class> {
  const { data } = await api.post<Class>('/classes/', payload)
  return data
}

export async function getClass(id: string): Promise<Class> {
  const { data } = await api.get<Class>(`/classes/${id}`)
  return data
}

export async function updateClass(id: string, payload: Partial<CreateClassPayload>): Promise<Class> {
  const { data } = await api.put<Class>(`/classes/${id}`, payload)
  return data
}

export async function deleteClass(id: string): Promise<void> {
  await api.delete(`/classes/${id}`)
}
