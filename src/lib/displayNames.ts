import type { Document, RAGSource } from '@/types'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const UUID_FILENAME_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.[a-z0-9]+$/i

function cleanLabel(value?: string | null) {
  return typeof value === 'string' ? value.trim() : ''
}

export function isLikelyInternalId(value?: string | null, relatedId?: string | null) {
  const label = cleanLabel(value)
  if (!label) return false

  const related = cleanLabel(relatedId)
  if (related && (label === related || label.startsWith(`${related}.`))) return true

  return UUID_RE.test(label) || UUID_FILENAME_RE.test(label)
}

export function getDocumentDisplayName(
  doc?: Pick<Document, 'id' | 'title' | 'filename' | 'original_filename'> | null,
  fallback = 'Untitled document',
) {
  if (!doc) return fallback

  const title = cleanLabel(doc.title)
  if (title && !isLikelyInternalId(title, doc.id)) return title

  const originalFilename = cleanLabel(doc.original_filename)
  if (originalFilename && !isLikelyInternalId(originalFilename, doc.id)) return originalFilename

  const filename = cleanLabel(doc.filename)
  if (filename && !isLikelyInternalId(filename, doc.id)) return filename

  return fallback
}

export function getRAGSourceDisplayName(source?: RAGSource | null, fallback = 'Document source') {
  if (!source) return fallback

  const title = cleanLabel(source.document_title)
  if (title && !isLikelyInternalId(title, source.document_id)) return title

  const name = cleanLabel(source.document_name)
  if (name && !isLikelyInternalId(name, source.document_id)) return name

  return fallback
}
