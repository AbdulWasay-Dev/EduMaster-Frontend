import api from '@/lib/axios'
import type { Student } from '@/types'

export interface CreateStudentPayload {
  student_name?: string
  name?: string
  student_id?: string
  roll_number?: string
  email?: string
  class_id: string
}

export async function listStudents(classId?: string): Promise<Student[]> {
  const params = classId ? { class_id: classId } : {}
  const { data } = await api.get<Student[] | { students?: Student[] }>('/students/', { params })
  return Array.isArray(data) ? data : ((data as { students?: Student[] }).students ?? [])
}

export async function createStudent(payload: CreateStudentPayload): Promise<Student> {
  // Normalize name fields for backend compatibility
  const body = {
    ...payload,
    student_name: payload.student_name ?? payload.name,
    student_id: payload.student_id ?? payload.roll_number,
  }
  const { data } = await api.post<Student>('/students/', body)
  return data
}

export async function getStudent(id: string): Promise<Student> {
  const { data } = await api.get<Student>(`/students/${id}`)
  return data
}

export async function deleteStudent(id: string): Promise<void> {
  await api.delete(`/students/${id}`)
}
