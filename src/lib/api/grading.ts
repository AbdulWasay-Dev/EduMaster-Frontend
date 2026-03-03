import api from '@/lib/axios'
import type { Submission, GradingMode, GradingStrictness } from '@/types'

export interface GradeAnswerSheetPayload {
  paper_id: string
  student_id?: string
  answer_sheet_image: File | string  // File or base64 string
  grading_mode?: GradingMode
  strictness?: GradingStrictness
}

export interface GradeMultiplePayload {
  paper_id: string
  student_id: string
  answer_sheet_images: string[]
  grading_mode?: GradingMode
  strictness?: GradingStrictness
}

export async function gradeAnswerSheet(payload: GradeAnswerSheetPayload): Promise<Submission> {
  if (payload.answer_sheet_image instanceof File) {
    const form = new FormData()
    form.append('paper_id', payload.paper_id)
    if (payload.student_id) form.append('student_id', payload.student_id)
    form.append('answer_sheet_image', payload.answer_sheet_image)
    if (payload.grading_mode) form.append('grading_mode', payload.grading_mode)
    const { data } = await api.post<Submission>('/grading/upload-answer-sheet', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  }
  const { data } = await api.post<Submission>('/grading/upload-answer-sheet', payload)
  return data
}

export async function gradeMultipleSheets(payload: GradeMultiplePayload): Promise<Submission> {
  const { data } = await api.post<Submission>('/grading/upload-multiple-answer-sheets', payload)
  return data
}

export async function listSubmissions(paperId?: string): Promise<Submission[]> {
  const params = paperId ? { paper_id: paperId } : {}
  const { data } = await api.get<Submission[] | { submissions?: Submission[] }>('/grading/', { params })
  return Array.isArray(data) ? data : ((data as { submissions?: Submission[] }).submissions ?? [])
}

export async function getSubmission(id: string): Promise<Submission> {
  const { data } = await api.get<Submission>(`/grading/${id}`)
  return data
}

export async function overrideScore(id: string, questionId: string, score: number, note: string): Promise<Submission> {
  const { data } = await api.post<Submission>(`/grading/${id}/override`, { question_id: questionId, score, note })
  return data
}
