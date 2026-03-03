import api from '@/lib/axios'
import type { Document, DocumentChunk } from '@/types'

export async function uploadDocument(subjectId: string, file: File): Promise<Document> {
  const formData = new FormData()
  formData.append('subject_id', subjectId)
  formData.append('file', file)
  const { data } = await api.post<Document>('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function listDocuments(subjectId?: string): Promise<Document[]> {
  const params = subjectId ? { subject_id: subjectId } : {}
  const { data } = await api.get<Document[] | { documents?: Document[] }>('/documents/', { params })
  return Array.isArray(data) ? data : ((data as { documents?: Document[] }).documents ?? [])
}

export async function getDocument(id: string): Promise<Document> {
  const { data } = await api.get<Document>(`/documents/${id}`)
  return data
}

export async function getDocumentChunks(id: string): Promise<DocumentChunk[]> {
  const { data } = await api.get<DocumentChunk[] | { chunks?: DocumentChunk[] }>(`/documents/${id}/chunks`)
  return Array.isArray(data) ? data : ((data as { chunks?: DocumentChunk[] }).chunks ?? [])
}

export async function deleteDocument(id: string): Promise<void> {
  await api.delete(`/documents/${id}`)
}
