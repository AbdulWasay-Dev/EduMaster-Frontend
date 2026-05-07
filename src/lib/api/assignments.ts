import api from '@/lib/axios'
import type { Assignment, AssignmentSubmission, AssignmentAnalytics } from '@/types'

export interface CreateAssignmentPayload {
  title: string
  instructions?: string
  description?: string
  subject_id: string
  class_id: string
  total_marks?: number
  due_date?: string
  grading_rubric?: string
  auto_grade?: boolean
}

export interface EmailConfig {
  id?: string
  email_address: string
  app_password: string
  imap_host?: string
  imap_port?: number
  is_active?: boolean
  last_fetched_at?: string | null
}

export async function listAssignments(params?: { class_id?: string; subject_id?: string; status?: string }): Promise<Assignment[]> {
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

export async function updateAssignment(id: string, payload: Partial<CreateAssignmentPayload>): Promise<Assignment> {
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

export async function uploadAssignmentAttachment(id: string, file: File): Promise<Assignment> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<Assignment>(`/assignments/${id}/upload-attachment`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

// Submissions
export async function getAssignmentSubmissions(assignmentId: string): Promise<AssignmentSubmission[]> {
  const { data } = await api.get<AssignmentSubmission[]>(`/assignments/${assignmentId}/submissions`)
  return Array.isArray(data) ? data : []
}

export async function getSubmission(assignmentId: string, submissionId: string): Promise<AssignmentSubmission> {
  const { data } = await api.get<AssignmentSubmission>(`/assignments/${assignmentId}/submissions/${submissionId}`)
  return data
}

export async function gradeSubmission(assignmentId: string, submissionId: string): Promise<AssignmentSubmission> {
  const { data } = await api.post<AssignmentSubmission>(`/assignments/${assignmentId}/submissions/${submissionId}/grade`)
  return data
}

export async function overrideSubmissionGrade(
  assignmentId: string,
  submissionId: string,
  payload: { teacher_override_marks?: number; teacher_remarks?: string },
): Promise<AssignmentSubmission> {
  const { data } = await api.patch<AssignmentSubmission>(
    `/assignments/${assignmentId}/submissions/${submissionId}/override`,
    payload,
  )
  return data
}

export async function gradeAllSubmissions(assignmentId: string): Promise<{ graded_count: number; failed_count: number; total: number }> {
  const { data } = await api.post(`/assignments/${assignmentId}/grade-all`)
  return data
}

export async function manualUploadSubmission(
  assignmentId: string,
  studentAccountId: string,
  submissionText?: string,
  file?: File,
): Promise<AssignmentSubmission> {
  const form = new FormData()
  form.append('student_account_id', studentAccountId)
  if (submissionText) form.append('submission_text', submissionText)
  if (file) form.append('file', file)
  const { data } = await api.post<AssignmentSubmission>(`/assignments/${assignmentId}/manual-upload`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

// Analytics
export async function getAssignmentAnalytics(assignmentId: string): Promise<AssignmentAnalytics> {
  const { data } = await api.get<AssignmentAnalytics>(`/assignments/${assignmentId}/analytics`)
  return data
}

// Email Integration
export async function getEmailConfig(): Promise<EmailConfig | null> {
  const { data } = await api.get('/assignments/email/config')
  return data
}

export async function saveEmailConfig(config: EmailConfig): Promise<EmailConfig> {
  const { data } = await api.post<EmailConfig>('/assignments/email/config', config)
  return data
}

export async function testEmailConnection(config: EmailConfig): Promise<{ success: boolean; message: string }> {
  const { data } = await api.post('/assignments/email/test-connection', config)
  return data
}

export async function fetchEmailSubmissions(assignmentId: string): Promise<{ emails_found: number; processed: number; skipped: number; message: string }> {
  const { data } = await api.post(`/assignments/${assignmentId}/fetch-email-submissions`)
  return data
}

export async function getEmailLogs(assignmentId: string): Promise<unknown[]> {
  const { data } = await api.get(`/assignments/${assignmentId}/email-logs`)
  return Array.isArray(data) ? data : []
}
