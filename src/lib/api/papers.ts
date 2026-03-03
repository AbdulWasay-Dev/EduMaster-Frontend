import api from '@/lib/axios'
import type { Paper, PaperGenerationRequest, Question } from '@/types'

export async function generatePaper(payload: PaperGenerationRequest): Promise<Paper> {
  // Map frontend field names to backend expected names
  const body: Record<string, unknown> = {
    ...payload,
    // Always send both aliases so either field name works
    question_count: payload.question_count ?? payload.num_questions ?? 10,
    difficulty_level: payload.difficulty_level ?? payload.difficulty ?? 'medium',
  }
  const { data } = await api.post<Paper>('/papers/generate', body)
  return data
}

export async function listPapers(subjectId?: string): Promise<Paper[]> {
  const params = subjectId ? { subject_id: subjectId } : {}
  const { data } = await api.get<Paper[] | { papers?: Paper[] }>('/papers/', { params })
  return Array.isArray(data) ? data : ((data as { papers?: Paper[] }).papers ?? [])
}

export async function getPaper(id: string): Promise<Paper> {
  const { data } = await api.get<Paper>(`/papers/${id}`)
  return data
}

export async function updatePaper(id: string, payload: Partial<Paper> & { questions?: Question[] }): Promise<Paper> {
  const { data } = await api.put<Paper>(`/papers/${id}`, payload)
  return data
}

export async function publishPaper(id: string): Promise<Paper> {
  const { data } = await api.post<Paper>(`/papers/${id}/publish`)
  return data
}

export async function deletePaper(id: string): Promise<void> {
  await api.delete(`/papers/${id}`)
}

export async function exportPaperPDF(id: string, template?: string): Promise<Blob> {
  const params = template ? { template } : {}
  const { data } = await api.get(`/papers/${id}/export`, { responseType: 'blob', params })
  return data as Blob
}

export async function exportAnswerKey(id: string, format: 'pdf' | 'txt' | 'html' = 'pdf'): Promise<Blob> {
  const { data } = await api.get(`/papers/${id}/answer-key`, {
    responseType: 'blob',
    params: { format },
  })
  return data as Blob
}
