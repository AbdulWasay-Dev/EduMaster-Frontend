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

export interface AttendanceSummary {
  student_id: string
  student_name: string
  roll_number?: string
  present: number
  absent: number
  late: number
  excused: number
  total: number
  attendance_pct: number
}

export interface ClassAnalytics {
  total_sessions: number
  total_records: number
  present: number
  absent: number
  late: number
  excused: number
  overall_rate: number
  trend: { date: string; present: number; absent: number; late: number; excused: number; total: number; rate: number }[]
  students: AttendanceSummary[]
  low_attendance: AttendanceSummary[]
  start_date: string
  end_date: string
}

export interface StudentAnalytics {
  student_name: string
  roll_number: string
  total_sessions: number
  present: number
  absent: number
  late: number
  excused: number
  attendance_pct: number
  records: { date: string; status: string; remarks?: string }[]
  monthly: { month: string; present: number; absent: number; late: number; excused: number; total: number; rate: number }[]
  start_date: string
  end_date: string
}

export interface AttendanceOverview {
  total_sessions: number
  total_records: number
  present: number
  absent: number
  late: number
  excused: number
  overall_rate: number
  heatmap: { date: string; attended: number; total: number; rate: number }[]
  at_risk_students: { student_id: string; student_name: string; attended: number; total: number; attendance_pct: number }[]
  at_risk_count: number
}

export interface AttendanceHistoryEntry {
  date: string
  present: number
  absent: number
  late: number
  excused: number
  total: number
  attendance_rate: number
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

export async function getAttendanceRange(class_id: string, subject_id: string, start_date: string, end_date: string): Promise<any[]> {
  const { data } = await api.get('/attendance/range', {
    params: { class_id, subject_id, start_date, end_date }
  })
  return data
}

export async function getAttendanceHistory(class_id: string, subject_id: string, limit = 30): Promise<AttendanceHistoryEntry[]> {
  const { data } = await api.get('/attendance/history', {
    params: { class_id, subject_id, limit }
  })
  return data
}

export async function getClassAnalytics(
  class_id: string,
  subject_id: string,
  start_date?: string,
  end_date?: string
): Promise<ClassAnalytics> {
  const { data } = await api.get('/attendance/analytics/class', {
    params: { class_id, subject_id, start_date, end_date }
  })
  return data
}

export async function getStudentAnalytics(
  student_id: string,
  class_id: string,
  subject_id: string,
  start_date?: string,
  end_date?: string
): Promise<StudentAnalytics> {
  const { data } = await api.get(`/attendance/analytics/student/${student_id}`, {
    params: { class_id, subject_id, start_date, end_date }
  })
  return data
}

export async function getAttendanceOverview(class_id: string, subject_id: string): Promise<AttendanceOverview> {
  const { data } = await api.get('/attendance/analytics/overview', {
    params: { class_id, subject_id }
  })
  return data
}

export async function getStudentsSummary(
  class_id: string,
  subject_id: string,
  start_date?: string,
  end_date?: string
): Promise<AttendanceSummary[]> {
  const { data } = await api.get('/attendance/students/summary', {
    params: { class_id, subject_id, start_date, end_date }
  })
  return data
}
