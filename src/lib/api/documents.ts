import api from '@/lib/axios'
import { getDocumentDisplayName, isLikelyInternalId } from '@/lib/displayNames'
import type { Document, DocumentChunk } from '@/types'

function normalizeDocument(doc: Document): Document {
  const displayName = getDocumentDisplayName(doc)
  const safeTitle = doc.title && !isLikelyInternalId(doc.title, doc.id)
    ? doc.title
    : displayName
  const safeOriginalFilename = doc.original_filename && !isLikelyInternalId(doc.original_filename, doc.id)
    ? doc.original_filename
    : displayName

  return {
    ...doc,
    title: safeTitle,
    filename: displayName,
    original_filename: safeOriginalFilename,
  }
}

export async function uploadDocument(subjectId: string, file: File): Promise<Document> {
  const formData = new FormData()
  formData.append('subject_id', subjectId)
  formData.append('file', file)
  const { data } = await api.post<Document>('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return normalizeDocument(data)
}

export async function listDocuments(subjectId?: string): Promise<Document[]> {
  const params = subjectId ? { subject_id: subjectId } : {}
  const { data } = await api.get<Document[] | { documents?: Document[] }>('/documents/', { params })
  const documents = Array.isArray(data) ? data : ((data as { documents?: Document[] }).documents ?? [])
  return documents.map(normalizeDocument)
}

export async function getDocument(id: string): Promise<Document> {
  const { data } = await api.get<Document>(`/documents/${id}`)
  return normalizeDocument(data)
}

export async function getDocumentChunks(id: string): Promise<DocumentChunk[]> {
  const { data } = await api.get<DocumentChunk[] | { chunks?: DocumentChunk[] }>(`/documents/${id}/chunks`)
  return Array.isArray(data) ? data : ((data as { chunks?: DocumentChunk[] }).chunks ?? [])
}

export async function deleteDocument(id: string): Promise<void> {
  await api.delete(`/documents/${id}`)
}
