import api from '@/lib/axios'
import type { Assignment, AssignmentSubmission, AssignmentAnalytics } from '@/types'

// ─── Teacher-side Assignment API ─────────────────────────────────────────────

export interface CreateAssignmentPayload {
  title: string
  instructions?: string
  subject_id: string
  class_id: string
  total_marks?: number
  due_date?: string
  grading_rubric?: string
}

export async function listAssignments(params?: {
  class_id?: string
  subject_id?: string
  status?: string
}): Promise<Assignment[]> {
  const { data } = await api.get<Assignment[]>('/assignments/', { params })
  return Array.isArray(data) ? data : []
}

export async function createAssignment(payload: CreateAssignmentPayload): Promise<Assignment> {
  const { data } = await api.post<Assignment>('/assignments/', payload)
  return data
}

export async function getAssignment(id: string): Promise<Assignment> {
  const { data } = await api.get<Assignment>(`/assignments/${id}`)
  return data
}

export async function updateAssignment(
  id: string,
  payload: Partial<CreateAssignmentPayload>,
): Promise<Assignment> {
  const { data } = await api.patch<Assignment>(`/assignments/${id}`, payload)
  return data
}

export async function deleteAssignment(id: string): Promise<void> {
  await api.delete(`/assignments/${id}`)
}

export async function publishAssignment(id: string): Promise<Assignment> {
  const { data } = await api.post<Assignment>(`/assignments/${id}/publish`)
  return data
}

export async function closeAssignment(id: string): Promise<Assignment> {
  const { data } = await api.post<Assignment>(`/assignments/${id}/close`)
  return data
}

// ─── Submissions (teacher view) ──────────────────────────────────────────────

export async function getAssignmentSubmissions(assignmentId: string): Promise<AssignmentSubmission[]> {
  const { data } = await api.get<AssignmentSubmission[]>(`/assignments/${assignmentId}/submissions`)
  return Array.isArray(data) ? data : []
}

export async function getSubmission(assignmentId: string, submissionId: string): Promise<AssignmentSubmission> {
  const { data } = await api.get<AssignmentSubmission>(
    `/assignments/${assignmentId}/submissions/${submissionId}`,
  )
  return data
}

export async function gradeSubmission(
  assignmentId: string,
  submissionId: string,
): Promise<AssignmentSubmission> {
  const { data } = await api.post<AssignmentSubmission>(
    `/assignments/${assignmentId}/submissions/${submissionId}/grade`,
  )
  return data
}

export async function overrideSubmissionGrade(
  assignmentId: string,
  submissionId: string,
  payload: { marks_obtained: number; feedback?: string },
): Promise<AssignmentSubmission> {
  const { data } = await api.patch<AssignmentSubmission>(
    `/assignments/${assignmentId}/submissions/${submissionId}/override`,
    payload,
  )
  return data
}

export async function gradeAllSubmissions(assignmentId: string): Promise<{ graded: number; failed: number }> {
  const { data } = await api.post<{ graded: number; failed: number }>(
    `/assignments/${assignmentId}/grade-all`,
  )
  return data
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export async function getAssignmentAnalytics(assignmentId: string): Promise<AssignmentAnalytics> {
  const { data } = await api.get<AssignmentAnalytics>(`/assignments/${assignmentId}/analytics`)
  return data
}
