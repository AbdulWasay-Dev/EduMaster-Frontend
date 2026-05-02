import api from '@/lib/axios'
import type { AttendanceRecord } from '@/types'

export interface SubmitAttendancePayload {
  class_id: string
  subject_id: string
  date: string
  entries: {
    student_id: string
    status: string
    remarks?: string
  }[]
}

export async function getAttendance(class_id: string, subject_id: string, date: string): Promise<AttendanceRecord[]> {
  const { data } = await api.get<AttendanceRecord[]>('/attendance/', {
    params: { class_id, subject_id, date }
  })
  return data
}

export async function submitAttendance(payload: SubmitAttendancePayload): Promise<any> {
  const { data } = await api.post('/attendance/', payload)
  return data
}
