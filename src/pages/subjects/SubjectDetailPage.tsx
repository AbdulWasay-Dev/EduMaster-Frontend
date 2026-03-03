import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Pencil, Trash2, ArrowLeft, FileText, ScrollText, BookOpen } from 'lucide-react'
import * as Tabs from '@radix-ui/react-tabs'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import { getSubject, deleteSubject } from '@/lib/api/subjects'
import { listDocuments } from '@/lib/api/documents'
import { listPapers } from '@/lib/api/papers'
import { formatDate } from '@/lib/utils'

export default function SubjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: subject, isLoading } = useQuery({
    queryKey: ['subject', id],
    queryFn: () => getSubject(id!),
  })

  const { data: docs = [] } = useQuery({
    queryKey: ['documents', id],
    queryFn: () => listDocuments(id),
    enabled: !!id,
  })

  const { data: papers = [] } = useQuery({
    queryKey: ['papers', id],
    queryFn: () => listPapers(),
  })

  const deleteMut = useMutation({
    mutationFn: () => deleteSubject(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subjects'] })
      toast.success('Subject deleted')
      navigate('/subjects')
    },
    onError: () => toast.error('Failed to delete'),
  })

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  if (!subject) return <div className="text-center py-20 text-brand-500">Subject not found</div>

  const handleDelete = () => {
    if (window.confirm('Delete this subject?')) deleteMut.mutate()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={subject.name}
        subtitle={subject.code ? `Code: ${subject.code}` : (subject.description ?? '')}
        action={
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/subjects')} className="btn-ghost flex items-center gap-2 text-sm">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <Link to={`/subjects/${id}`} className="btn-ghost flex items-center gap-2 text-sm" state={{ edit: true }}>
              <Pencil className="w-4 h-4" /> Edit
            </Link>
            <button onClick={handleDelete} className="btn-danger flex items-center gap-2 text-sm">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        }
      />

      <Tabs.Root defaultValue="docs" className="space-y-4">
        <Tabs.List className="flex items-center gap-1 bg-brand-50 p-1 rounded-xl w-fit">
          {[['docs', 'Documents'], ['papers', 'Papers']].map(([val, label]) => (
            <Tabs.Trigger
              key={val}
              value={val}
              className="px-4 py-2 rounded-lg text-sm font-medium text-brand-600 data-[state=active]:bg-white data-[state=active]:text-brand-900 data-[state=active]:shadow-sm transition-all"
            >
              {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="docs">
          {docs.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No documents yet"
              description="Upload study materials for this subject."
              action={
                <Link to="/documents/upload" className="btn-primary">Upload Document</Link>
              }
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {docs.map(doc => (
                <Link key={doc.id} to={`/documents/${doc.id}`} className="card p-4 hover:shadow-card-hover transition-shadow">
                  <FileText className="w-5 h-5 text-brand-500 mb-2" />
                  <p className="font-medium text-sm text-[#1C0A00] truncate">{doc.filename || doc.title}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <StatusBadge status={doc.processing_status} />
                    <span className="text-xs text-brand-500">{formatDate(doc.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Tabs.Content>

        <Tabs.Content value="papers">
          {papers.length === 0 ? (
            <EmptyState
              icon={ScrollText}
              title="No papers yet"
              description="Generate an exam paper for this subject."
              action={<Link to="/papers/generate" className="btn-primary">Generate Paper</Link>}
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {papers.map(paper => (
                <Link key={paper.id} to={`/papers/${paper.id}`} className="card p-4 hover:shadow-card-hover transition-shadow">
                  <ScrollText className="w-5 h-5 text-brand-500 mb-2" />
                  <p className="font-medium text-sm text-[#1C0A00] truncate">{paper.title}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <StatusBadge status={paper.is_published ? 'published' : 'draft'} />
                    <span className="text-xs text-brand-500">{paper.total_marks} marks</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
