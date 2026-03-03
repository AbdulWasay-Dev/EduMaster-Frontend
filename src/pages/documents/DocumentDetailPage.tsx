import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Trash2, FileText, Hash, Brain } from 'lucide-react'
import * as Tabs from '@radix-ui/react-tabs'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { getDocument, getDocumentChunks, deleteDocument } from '@/lib/api/documents'
import { formatDate, formatBytes, fileIcon } from '@/lib/utils'

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

  const deleteMut = useMutation({
    mutationFn: () => deleteDocument(id!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); toast.success('Deleted'); navigate('/documents') },
  })

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  if (!doc) return <div className="py-20 text-center text-brand-500">Document not found</div>

  return (
    <div className="space-y-6">
      <PageHeader
        title={doc.filename || doc.title || 'Document'}
        subtitle={`${doc.file_type?.toUpperCase() ?? 'FILE'} · ${doc.file_size ? formatBytes(doc.file_size) : ''} · Uploaded ${formatDate(doc.created_at)}`}
        action={
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/documents')} className="btn-ghost flex items-center gap-2 text-sm">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => window.confirm('Delete document?') && deleteMut.mutate()} className="btn-danger flex items-center gap-2 text-sm">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        }
      />

      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Status', value: <StatusBadge status={doc.processing_status} /> },
          { label: 'Chunks', value: chunks.length },
          { label: 'File type', value: doc.file_type?.toUpperCase() ?? '—' },
          { label: 'Uploaded', value: formatDate(doc.created_at) },
        ].map(({ label, value }) => (
          <div key={label} className="card p-4 text-center">
            <div className="text-lg font-bold text-[#1C0A00]">{value}</div>
            <p className="text-xs text-brand-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <Tabs.Root defaultValue="chunks" className="space-y-4">
        <Tabs.List className="flex items-center gap-1 bg-brand-50 p-1 rounded-xl w-fit">
          {[['chunks', 'Text Chunks'], ['info', 'Metadata']].map(([val, label]) => (
            <Tabs.Trigger key={val} value={val}
              className="px-4 py-2 rounded-lg text-sm font-medium text-brand-600 data-[state=active]:bg-white data-[state=active]:text-brand-900 data-[state=active]:shadow-sm transition-all"
            >
              {label}
            </Tabs.Trigger>
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
                <div key={chunk.id} className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="w-3.5 h-3.5 text-brand-400" />
                    <span className="text-xs font-mono text-brand-500">Chunk {i + 1}</span>
                  </div>
                  <p className="text-sm text-[#1C0A00] leading-relaxed">{chunk.content}</p>
                </div>
              ))}
            </div>
          )}
        </Tabs.Content>

        <Tabs.Content value="info">
          <div className="card p-5 space-y-3">
            {[
              ['ID', doc.id],
              ['Filename', doc.filename],
              ['File type', doc.file_type],
              ['File size', doc.file_size ? formatBytes(doc.file_size) : '—'],
              ['Processing status', doc.processing_status],
              ['Created at', formatDate(doc.created_at)],
            ].map(([k, v]) => (
              <div key={k} className="flex items-start gap-4 py-2 border-b border-brand-50 last:border-0">
                <span className="text-xs font-semibold text-brand-600 w-32 shrink-0">{k}</span>
                <span className="text-sm text-[#1C0A00] font-mono break-all">{v}</span>
              </div>
            ))}
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
