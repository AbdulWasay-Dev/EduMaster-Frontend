import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, FileText, Trash2, LayoutGrid, LayoutList, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { type ColumnDef } from '@tanstack/react-table'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import DataTable from '@/components/shared/DataTable'
import { listDocuments, deleteDocument } from '@/lib/api/documents'
import { formatDate, formatBytes, fileIcon } from '@/lib/utils'
import { type Document } from '@/types'

export default function DocumentsLibraryPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => listDocuments(),
  })

  const deleteMut = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); toast.success('Document deleted') },
    onError: () => toast.error('Failed to delete'),
  })

  const columns: ColumnDef<Document, any>[] = [
    {
      accessorKey: 'filename',
      header: 'File',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="text-lg">{fileIcon(row.original.file_type ?? '')}</span>
          <Link
            to={`/documents/${row.original.id}`}
            className="font-medium text-[#1C0A00] hover:text-brand-500 truncate max-w-[200px]"
          >
            {row.original.filename || row.original.title}
          </Link>
        </div>
      ),
    },
    {
      accessorKey: 'file_type',
      header: 'Type',
      cell: ({ getValue }) => {
        const type = (getValue() as string)?.toLowerCase() || ''
        const colorMap: Record<string, string> = {
          pdf: 'bg-red-100 text-red-700',
          pptx: 'bg-orange-100 text-orange-700',
          ppt: 'bg-orange-100 text-orange-700',
          docx: 'bg-blue-100 text-blue-700',
          doc: 'bg-blue-100 text-blue-700',
          png: 'bg-emerald-100 text-emerald-700',
          jpg: 'bg-emerald-100 text-emerald-700',
          jpeg: 'bg-emerald-100 text-emerald-700',
        }
        const cls = colorMap[type] || 'bg-slate-100 text-slate-600'
        return type ? (
          <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-md ${cls}`}>{type}</span>
        ) : <span className="text-slate-400">—</span>
      },
    },
    {
      accessorKey: 'file_size',
      header: 'Size',
      cell: ({ getValue }) => (
        <span className="text-brand-600">{getValue() ? formatBytes(getValue() as number) : '—'}</span>
      ),
    },
    {
      accessorKey: 'processing_status',
      header: 'Status',
      cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
    },
    {
      accessorKey: 'created_at',
      header: 'Uploaded',
      cell: ({ getValue }) => <span className="text-brand-600">{formatDate(getValue() as string)}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.processing_status === 'completed' && (
            <button
              onClick={() => navigate(`/papers/generate?doc_id=${row.original.id}`)}
              className="text-xs text-brand-500 hover:text-brand-700 font-medium flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" /> Use in Paper
            </button>
          )}
          <button
            onClick={() => window.confirm('Delete document?') && deleteMut.mutate(row.original.id)}
            className="text-xs text-red-400 hover:text-red-600"
          >
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Library"
        subtitle="Upload study materials — AI generates exam questions from these"
        action={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-brand-50 p-1 rounded-lg">
              <button
                onClick={() => setView('grid')}
                className={`p-1.5 rounded ${view === 'grid' ? 'bg-white shadow-sm' : ''}`}
              >
                <LayoutGrid className="w-4 h-4 text-brand-600" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-1.5 rounded ${view === 'list' ? 'bg-white shadow-sm' : ''}`}
              >
                <LayoutList className="w-4 h-4 text-brand-600" />
              </button>
            </div>
            <Link to="/documents/upload" className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Upload
            </Link>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : docs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Upload textbooks, notes, or slides to enable AI-powered exam generation."
          action={
            <Link to="/documents/upload" className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Upload Document
            </Link>
          }
        />
      ) : view === 'list' ? (
        <DataTable data={docs} columns={columns} isLoading={isLoading} searchPlaceholder="Search documents…" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {docs.map(doc => (
            <motion.div
              key={doc.id}
              whileHover={{ y: -3, boxShadow: '0 10px 30px -8px rgba(28,10,0,0.12)' } as any}
              className="card p-4 group flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{fileIcon(doc.file_type ?? '')}</span>
                <button
                  onClick={() => window.confirm('Delete?') && deleteMut.mutate(doc.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-red-50 text-red-400 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <Link to={`/documents/${doc.id}`}>
                <h3 className="font-medium text-sm text-[#1C0A00] truncate hover:text-brand-500">
                  {doc.filename || doc.title}
                </h3>
              </Link>
              <div className="mt-1 flex items-center gap-2">
                {(() => {
                  const type = (doc.file_type || '').toLowerCase()
                  const colorMap: Record<string, string> = {
                    pdf: 'bg-red-100 text-red-700',
                    pptx: 'bg-orange-100 text-orange-700',
                    ppt: 'bg-orange-100 text-orange-700',
                    docx: 'bg-blue-100 text-blue-700',
                    doc: 'bg-blue-100 text-blue-700',
                    png: 'bg-emerald-100 text-emerald-700',
                    jpg: 'bg-emerald-100 text-emerald-700',
                    jpeg: 'bg-emerald-100 text-emerald-700',
                  }
                  const cls = colorMap[type] || 'bg-slate-100 text-slate-600'
                  return type ? (
                    <span className={`text-xs font-semibold uppercase px-1.5 py-0.5 rounded ${cls}`}>{type}</span>
                  ) : null
                })()}
                <p className="text-xs text-brand-500">{doc.file_size ? formatBytes(doc.file_size) : ''}</p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <StatusBadge status={doc.processing_status} />
                <span className="text-xs text-brand-400">{formatDate(doc.created_at)}</span>
              </div>
              {doc.processing_status === 'completed' && (
                <button
                  onClick={() => navigate(`/papers/generate?doc_id=${doc.id}`)}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-medium text-brand-600 border border-brand-200 rounded-lg py-1.5 hover:bg-brand-50 hover:border-brand-400 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Use in Paper
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
