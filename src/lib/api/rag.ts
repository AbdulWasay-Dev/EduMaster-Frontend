import api from '@/lib/axios'
import type { RAGQueryResponse } from '@/types'

export interface RAGQueryPayload {
  query: string
  subject_id?: string
  document_ids?: string[]
  use_documents?: boolean
  include_sources?: boolean
  top_k?: number
}

export interface GenerateQuestionsPayload {
  subject_id: string
  document_ids?: string[]
  question_count?: number
  question_types?: string[]
  difficulty_level?: string
}

export async function queryRAG(payload: RAGQueryPayload): Promise<RAGQueryResponse> {
  const { data } = await api.post<RAGQueryResponse>('/rag/query', payload)
  return data
}

export async function generateQuestionsFromRAG(payload: GenerateQuestionsPayload) {
  const { data } = await api.post('/rag/generate-questions', payload)
  return data
}

export async function getRAGSuggestions(subjectId: string): Promise<string[]> {
  const { data } = await api.get<{ suggestions: string[] }>(`/rag/suggestions/${subjectId}`)
  return data.suggestions ?? []
}
