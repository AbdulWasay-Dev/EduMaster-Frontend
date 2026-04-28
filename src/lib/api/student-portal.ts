import api from '@/lib/axios'
import type {
  StudentDashboard,
  StudentAssignmentListItem,
  StudentScore,
} from '@/types'

// ─── Student Portal API ─────────────────────────────────────────────────────

export async function getStudentDashboard(): Promise<StudentDashboard> {
  const { data } = await api.get<StudentDashboard>('/student/dashboard')
  return data
}

export async function listStudentAssignments(): Promise<StudentAssignmentListItem[]> {
  const { data } = await api.get<StudentAssignmentListItem[]>('/student/assignments')
  return Array.isArray(data) ? data : []
}

export async function getStudentAssignment(id: string) {
  const { data } = await api.get(`/student/assignments/${id}`)
  return data
}

export async function submitAssignment(id: string, submissionText: string, files?: File[]) {
  const formData = new FormData()
  if (submissionText) formData.append('submission_text', submissionText)
  if (files && files.length > 0) {
    files.forEach(f => formData.append('files', f))
  }
  const { data } = await api.post(`/student/assignments/${id}/submit`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data
}

export async function getStudentAnalytics() {
  const { data } = await api.get('/student/analytics')
  return data
}

export async function getMyClasses() {
  const { data } = await api.get('/student/classes')
  return Array.isArray(data) ? data : []
}

export async function getMySubmission(assignmentId: string) {
  const { data } = await api.get(`/student/assignments/${assignmentId}/submission`)
  return data
}

export async function getMyScores(): Promise<StudentScore[]> {
  const { data } = await api.get<StudentScore[]>('/student/scores')
  return Array.isArray(data) ? data : []
}

export async function getMySubjects() {
  const { data } = await api.get('/student/subjects')
  return Array.isArray(data) ? data : []
}

export async function getMyPapers() {
  const { data } = await api.get('/student/papers')
  return Array.isArray(data) ? data : []
}

export async function getMySubjectDetail(subjectId: string) {
  const { data } = await api.get(`/student/subjects/${subjectId}`)
  return data
}

export async function getSubjectDocuments(subjectId: string) {
  const { data } = await api.get(`/student/subjects/${subjectId}/documents`)
  return Array.isArray(data) ? data : []
}

export async function studentRAGQuery(question: string, subjectId: string) {
  const { data } = await api.post('/student/rag/query', {
    question,
    subject_id: subjectId,
  })
  return data
}
