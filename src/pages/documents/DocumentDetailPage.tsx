import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Trash2, Hash, Sparkles, BookOpen, Clock, HardDrive, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import * as Tabs from '@radix-ui/react-tabs'
import PageHeader from '@/components/shared/PageHeader'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { getDocument, getDocumentChunks, deleteDocument } from '@/lib/api/documents'
import { listSubjects } from '@/lib/api/subjects'
import { formatDate, formatBytes, fileIcon } from '@/lib/utils'
import type { Subject } from '@/types'

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: doc, isLoading } = useQuery({ queryKey: ['document', id], queryFn: () => getDocument(id!) })
  const { data: chunks = [], isLoading: loadingChunks } = useQuery({
    queryKey: ['document-chunks', id],
    queryFn: () => getDocumentChunks(id!),
    enabled: !!id,
  })
  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: () => listSubjects(),
  })

  const deleteMut = useMutation({
    mutationFn: () => deleteDocument(id!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); toast.success('Deleted'); navigate('/documents') },
  })

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  if (!doc) return <div className="py-20 text-center text-brand-500">Document not found</div>

  // Resolve subject name — never show raw ID
  const subjectName = doc.subject_name
    || subjects.find((s: Subject) => s.id === doc.subject_id)?.name
    || null

  const statusBadge = () => {
    if (doc.processing_status === 'completed') return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5" /> Ready
      </span>
    )
    if (doc.processing_status === 'processing') return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing
      </span>
    )
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-600 border border-red-200">
        <AlertCircle className="w-3.5 h-3.5" /> Error
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={doc.filename || doc.title || 'Document'}
        subtitle={[
          doc.file_type?.toUpperCase(),
          doc.file_size ? formatBytes(doc.file_size) : null,
          subjectName ? `Subject: ${subjectName}` : null,
          `Uploaded ${formatDate(doc.created_at)}`,
        ].filter(Boolean).join(' · ')}
        action={
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/documents')} className="btn-ghost flex items-center gap-2 text-sm">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            {doc.processing_status === 'completed' && (
              <button
                onClick={() => navigate(`/papers/generate?doc_id=${id}`)}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Sparkles className="w-4 h-4" /> Generate Paper
              </button>
            )}
            <button onClick={() => window.confirm('Delete document?') && deleteMut.mutate()} className="btn-danger flex items-center gap-2 text-sm">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        }
      />

      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xl">{fileIcon(doc.file_type ?? '')}</span>
          </div>
          <div>
            <p className="text-sm font-bold text-[#0f172a]">{doc.file_type?.toUpperCase() ?? '—'}</p>
            <p className="text-xs text-brand-400">File type</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Hash className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#0f172a]">{chunks.length}</p>
            <p className="text-xs text-brand-400">Text chunks</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <HardDrive className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#0f172a]">{doc.file_size ? formatBytes(doc.file_size) : '—'}</p>
            <p className="text-xs text-brand-400">File size</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#0f172a]">{formatDate(doc.created_at)}</p>
            <p className="text-xs text-brand-400">Uploaded</p>
          </div>
        </div>
      </div>

      <Tabs.Root defaultValue="chunks" className="space-y-4">
        <Tabs.List className="flex items-center gap-1 bg-brand-50 p-1 rounded-xl w-fit">
          {[['chunks', 'Text Chunks'], ['info', 'Metadata']].map(([val, label]) => (
            <Tabs.Trigger key={val} value={val}
              className="px-4 py-2 rounded-lg text-sm font-medium text-brand-600 data-[state=active]:bg-white data-[state=active]:text-brand-900 data-[state=active]:shadow-sm transition-all"
            >{label}</Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="chunks">
          {loadingChunks ? <LoadingSpinner size="md" /> : chunks.length === 0 ? (
            <div className="card p-10 text-center text-brand-500">
              {doc.processing_status === 'processing' ? 'Document is still being processed…' : 'No chunks available'}
            </div>
          ) : (
            <div className="space-y-3">
              {chunks.map((chunk, i) => (
                <div key={chunk.id ?? i} className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="w-3.5 h-3.5 text-brand-400" />
                    <span className="text-xs font-mono text-brand-500">Chunk {i + 1}</span>
                    <span className="text-xs text-brand-300 ml-auto">{chunk.char_count} chars</span>
                  </div>
                  <p className="text-sm text-[#0f172a] leading-relaxed">{chunk.content}</p>
                </div>
              ))}
            </div>
          )}
        </Tabs.Content>

        <Tabs.Content value="info">
          <div className="card p-5 space-y-0 divide-y divide-brand-50">
            {[
              ['Filename',    doc.filename || doc.original_filename],
              ['Subject',     subjectName ?? '(No subject assigned)'],   // NAME not ID
              ['File type',   doc.file_type?.toUpperCase() ?? '—'],
              ['File size',   doc.file_size ? formatBytes(doc.file_size) : '—'],
              ['Status',      doc.processing_status],
              ['Uploaded',    formatDate(doc.created_at)],
              ['Text Chunks', chunks.length.toString()],
            ].map(([k, v]) => (
              <div key={k} className="flex items-start gap-4 py-3">
                <span className="text-xs font-semibold text-brand-500 uppercase tracking-wide w-28 shrink-0 pt-0.5">{k}</span>
                <span className="text-sm text-[#0f172a] font-medium">{v}</span>
              </div>
            ))}
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
