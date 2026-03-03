// ─── Auth ────────────────────────────────────────────────────────────────────
export interface User {
  id: string
  name: string
  email: string
  role: 'teacher' | 'admin'
  avatar?: string
}

export interface AuthTokens {
  access_token: string
  token_type: string
}

// ─── Subject ─────────────────────────────────────────────────────────────────
export interface Subject {
  id: string
  name: string
  code?: string
  description: string
  grade_level?: string
  subject_area?: string
  academic_year?: string
  is_active: boolean
  teacher_id: string
  created_at: string
  document_count?: number
  paper_count?: number
  student_count?: number
}

// ─── Class ───────────────────────────────────────────────────────────────────
export interface Class {
  id: string
  name: string
  description: string
  grade_level?: string
  subject_id?: string
  subject_area?: string
  academic_year?: string
  is_active: boolean
  teacher_id: string
  created_at: string
  student_count?: number
}

// ─── Student ─────────────────────────────────────────────────────────────────
export interface Student {
  id: string
  name: string           // display name
  student_name?: string  // backend alias
  student_id?: string    // roll number from backend
  roll_number?: string
  email?: string
  class_id: string
  enrolled_at?: string
  average_grade?: number
  created_at: string
}

// ─── Document ────────────────────────────────────────────────────────────────
export type DocumentStatus = 'processing' | 'ready' | 'completed' | 'error'
export type DocumentType = 'pdf' | 'pptx' | 'docx' | 'png' | 'jpg' | 'jpeg'

export interface Document {
  id: string
  filename: string
  title?: string           // alias used by some pages
  original_filename: string
  file_type: DocumentType
  file_size: number
  processing_status: DocumentStatus
  subject_id: string
  subject_name?: string
  created_at: string
  url?: string
}

export interface DocumentChunk {
  id?: string
  chunk_index: number
  content: string
  char_count: number
  metadata?: Record<string, unknown>
}

// ─── Paper ───────────────────────────────────────────────────────────────────
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'mixed'
export type Difficulty = DifficultyLevel   // alias for convenience
export type QuestionType = 'mcq' | 'short_answer' | 'long_answer' | 'true_false' | 'fill_blank'
export type PaperStatus = 'draft' | 'published'
export type PaperTemplate = 'classic' | 'university' | 'school' | 'minimalist'

export interface Question {
  id: string
  question_text: string
  question_type: QuestionType
  marks: number
  max_score?: number
  difficulty?: DifficultyLevel
  options?: string[]
  correct_answer?: string
  explanation?: string
  question_number?: number
}

export interface Paper {
  id: string
  title: string
  description?: string
  subject_id: string
  subject_name?: string
  class_id?: string
  questions: Question[]
  answer_key: Record<string, string>
  total_marks: number
  time_limit?: number
  duration_minutes?: number
  instructions?: string
  difficulty_level: DifficultyLevel
  is_published: boolean
  teacher_id: string
  created_at: string
  // Advanced metadata
  template?: PaperTemplate
  institution_name?: string
  course_name?: string
  exam_date?: string
  duration?: string
  student_fields?: string[]
}

export interface PaperGenerationRequest {
  subject_id?: string
  class_id?: string
  title: string
  description?: string
  question_count?: number
  num_questions?: number
  question_types?: QuestionType[]
  question_type_counts?: Record<string, number>
  difficulty_level?: DifficultyLevel
  difficulty?: DifficultyLevel
  time_limit?: number
  duration_minutes?: number
  total_marks?: number
  chapter_keywords?: string[]
  document_ids?: string[]
  content_filter?: string
  topic_focus?: string
  // Template & metadata
  template?: PaperTemplate
  institution_name?: string
  course_name?: string
  exam_date?: string
  duration?: string
  instructions?: string
  student_fields?: string[]
}

// ─── Grading ─────────────────────────────────────────────────────────────────
export type GradingMode = 'auto' | 'semi_auto' | 'manual'
export type GradingStrictness = 'lenient' | 'medium' | 'strict'

export interface QuestionGradingDetail {
  question_id?: string
  question_text?: string
  max_marks?: number
  scored_marks?: number
  marks_awarded?: number    // alias for scored_marks
  ocr_confidence?: number
  ai_feedback?: string
  ai_comment?: string       // alias for ai_feedback
  is_correct?: boolean
  student_answer_text?: string
  student_answer?: string   // alias for student_answer_text
}

export interface Submission {
  id: string
  paper_id: string
  paper_title?: string
  student_id: string
  student_name?: string
  class_id?: string
  total_score: number
  max_score: number
  score?: number           // alias for total_score
  total_marks?: number     // alias for max_score
  grade_percentage: number
  grading_mode: GradingMode
  status: 'pending' | 'graded' | 'review'
  feedback: string
  ai_feedback?: string     // alias for feedback
  question_details?: QuestionGradingDetail[]
  grading_details?: QuestionGradingDetail[]  // alias
  ocr_confidence?: number
  submitted_at: string
  graded_at?: string
  created_at?: string
}

// ─── RAG ─────────────────────────────────────────────────────────────────────
export interface RAGSource {
  document_id: string
  document_name: string
  document_title?: string
  chunk_text: string
  relevance_score: number
  page_number?: number
}

export interface RAGQueryResponse {
  answer: string
  sources: RAGSource[]
  query: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: RAGSource[]
  timestamp: string
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export interface ClassOverview {
  class_id: string
  class_name: string
  student_count: number
  paper_count: number
  average_score: number
  top_students: { name: string; score: number }[]
  grade_distribution: { grade: string; count: number }[]
}

export interface ActivityDataPoint {
  date: string
  submissions: number
  avg_score: number
}

// ─── Notifications ────────────────────────────────────────────────────────────
export type NotificationType = 'grading' | 'paper' | 'system'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  resource_id?: string
  resource_type?: string
  created_at: string
}

// ─── API Responses ────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
}

export interface ApiError {
  detail: string | { msg: string; loc: string[] }[]
  status_code?: number
}
