import api from '@/lib/axios'
import type { Paper, PaperGenerationRequest } from '@/types'

export async function generatePaper(payload: PaperGenerationRequest): Promise<Paper> {
  const { data } = await api.post<Paper>('/papers/generate', payload)
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

export async function updatePaper(id: string, payload: Partial<Paper>): Promise<Paper> {
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

export async function exportPaperPDF(id: string): Promise<Blob> {
  const { data } = await api.get(`/papers/${id}/export`, { responseType: 'blob' })
  return data as Blob
}
