import api from '@/lib/axios'
import { getDocumentDisplayName, isLikelyInternalId } from '@/lib/displayNames'
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

export async function submitAssignment(id: string, submissionText: string) {
  const { data } = await api.post(`/student/assignments/${id}/submit`, {
    submission_text: submissionText,
  })
  return data
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

export async function getSubjectDocuments(subjectId: string) {
  const { data } = await api.get(`/student/subjects/${subjectId}/documents`)
  if (!Array.isArray(data)) return []

  return data.map((doc) => {
    const displayName = getDocumentDisplayName({
      id: doc.id,
      title: doc.title,
      filename: doc.filename ?? doc.file_name,
      original_filename: doc.original_filename ?? doc.file_name,
    })
    const safeOriginalFilename = doc.original_filename && !isLikelyInternalId(doc.original_filename, doc.id)
      ? doc.original_filename
      : displayName

    return {
      ...doc,
      title: doc.title && !isLikelyInternalId(doc.title, doc.id) ? doc.title : displayName,
      filename: displayName,
      file_name: displayName,
      original_filename: safeOriginalFilename,
    }
  })
}

export async function studentRAGQuery(question: string, subjectId: string) {
  const { data } = await api.post('/student/rag/query', {
    question,
    subject_id: subjectId,
  })
  return data
}
