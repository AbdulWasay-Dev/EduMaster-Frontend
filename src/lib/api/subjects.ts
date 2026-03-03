import api from '@/lib/axios'
import type { Subject } from '@/types'

export interface CreateSubjectPayload {
  name: string
  description?: string
  grade_level?: string
  subject_area?: string
  academic_year?: string
}

export async function listSubjects(): Promise<Subject[]> {
  const { data } = await api.get<Subject[]>('/subjects/')
  return data
}

export async function createSubject(payload: CreateSubjectPayload): Promise<Subject> {
  const { data } = await api.post<Subject>('/subjects/', payload)
  return data
}

export async function getSubject(id: string): Promise<Subject> {
  const { data } = await api.get<Subject>(`/subjects/${id}`)
  return data
}

export async function updateSubject(id: string, payload: Partial<CreateSubjectPayload>): Promise<Subject> {
  const { data } = await api.put<Subject>(`/subjects/${id}`, payload)
  return data
}

export async function deleteSubject(id: string): Promise<void> {
  await api.delete(`/subjects/${id}`)
}
