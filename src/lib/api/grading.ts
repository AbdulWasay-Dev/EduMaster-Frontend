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
  student_id?: string
  answer_sheet_images: Array<File | string>
  grading_mode?: GradingMode
  strictness?: GradingStrictness
}

/** Convert a File to a base64-encoded string (data URI prefix stripped) */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip the "data:image/...;base64," prefix so backend gets pure base64
      resolve(result.includes(',') ? result.split(',')[1] : result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function gradeAnswerSheet(payload: GradeAnswerSheetPayload): Promise<Submission> {
  let imageData: string
  if (payload.answer_sheet_image instanceof File) {
    imageData = await fileToBase64(payload.answer_sheet_image)
  } else {
    imageData = payload.answer_sheet_image
  }
  const body = {
    paper_id: payload.paper_id,
    student_id: payload.student_id,
    answer_sheet_image: imageData,
    grading_mode: payload.grading_mode ?? 'auto',
    strictness: payload.strictness ?? 'medium',
  }
  const { data } = await api.post<Submission>('/grading/upload-answer-sheet', body)
  return data
}

export async function gradeMultipleSheets(payload: GradeMultiplePayload): Promise<Submission> {
  const answer_sheet_images = await Promise.all(
    payload.answer_sheet_images.map(image => image instanceof File ? fileToBase64(image) : image)
  )
  const body = {
    ...payload,
    answer_sheet_images,
    grading_mode: payload.grading_mode ?? 'auto',
    strictness: payload.strictness ?? 'medium',
  }
  const { data } = await api.post<Submission>('/grading/upload-multiple-answer-sheets', body)
  return data
}

export async function listSubmissions(paperId?: string): Promise<Submission[]> {
  const params = paperId ? { paper_id: paperId } : {}
  const { data } = await api.get<Submission[] | { submissions?: Submission[] }>('/grading/', { params })
  return Array.isArray(data) ? data : ((data as { submissions?: Submission[] }).submissions ?? [])
}

export async function exportPaperClassReport(paperId: string, format: 'pdf' | 'csv' = 'pdf', classId?: string): Promise<Blob> {
  const { data } = await api.get(`/papers/${paperId}/grading-report`, {
    responseType: 'blob',
    params: classId ? { format, class_id: classId } : { format },
  })
  return data as Blob
}

export async function sendPaperGradingReport(
  paperId: string,
  payload: { class_id?: string; student_id?: string; recipient_email?: string },
): Promise<{ status: string; message: string }> {
  const { data } = await api.post(`/papers/${paperId}/grading-report/send`, payload)
  return data
}

export async function getSubmission(id: string): Promise<Submission> {
  const { data } = await api.get<Submission>(`/grading/${id}`)
  return data
}

export async function overrideScore(id: string, questionId: string, score: number, note: string): Promise<Submission> {
  const { data } = await api.post<Submission>(`/grading/${id}/override`, { question_id: questionId, score, note })
  return data
}
