import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, FileText, Trash2, Search, LayoutGrid, LayoutList } from 'lucide-react'
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
  const qc = useQueryClient()

  const { data: docs = [], isLoading } = useQuery({ 
    queryKey: ['documents'], 
    queryFn: () => listDocuments(),
    refetchInterval: (query) => {
      // Automatically poll every 5 seconds if any document is 'pending' or 'processing'
      const docsData = query.state?.data || []
      const hasPending = docsData.some((d: Document) => d.processing_status === 'pending' || d.processing_status === 'processing')
      return hasPending ? 5000 : false
    }
  })

  const deleteMut = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); toast.success('Document deleted') },
    onError: () => toast.error('Failed to delete'),
  })

  const columns: ColumnDef<Document, any>[] = [
    { accessorKey: 'filename', header: 'File', cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="text-lg">{fileIcon(row.original.file_type ?? '')}</span>
        <Link to={`/documents/${row.original.id}`} className="font-medium text-[#1C0A00] hover:text-brand-500 truncate max-w-[200px]">
          {row.original.filename || row.original.title}
        </Link>
      </div>
    )},
    { accessorKey: 'file_type', header: 'Type', cell: ({ getValue }) => <span className="text-xs font-mono uppercase text-brand-600">{getValue() as string || '—'}</span> },
    { accessorKey: 'file_size', header: 'Size', cell: ({ getValue }) => <span className="text-brand-600">{getValue() ? formatBytes(getValue() as number) : '—'}</span> },
    { accessorKey: 'processing_status', header: 'Status', cell: ({ getValue }) => <StatusBadge status={getValue() as string} /> },
    { accessorKey: 'created_at', header: 'Uploaded', cell: ({ getValue }) => <span className="text-brand-600">{formatDate(getValue() as string)}</span> },
    { id: 'actions', header: '', cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Link to={`/documents/${row.original.id}`} className="text-xs text-brand-500 hover:text-brand-700">View</Link>
        <button onClick={() => window.confirm('Delete document?') && deleteMut.mutate(row.original.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Library"
        subtitle="Upload and manage study materials"
        action={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-brand-50 p-1 rounded-lg">
              <button onClick={() => setView('grid')} className={`p-1.5 rounded ${view === 'grid' ? 'bg-white shadow-sm' : ''}`}>
                <LayoutGrid className="w-4 h-4 text-brand-600" />
              </button>
              <button onClick={() => setView('list')} className={`p-1.5 rounded ${view === 'list' ? 'bg-white shadow-sm' : ''}`}>
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
          description="Upload study materials to enable AI-powered question generation."
          action={<Link to="/documents/upload" className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/>Upload Document</Link>}
        />
      ) : view === 'list' ? (
        <DataTable data={docs} columns={columns} isLoading={isLoading} searchPlaceholder="Search documents…" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {docs.map(doc => (
            <motion.div
              key={doc.id}
              whileHover={{ y: -3, boxShadow: '0 10px 30px -8px rgba(28,10,0,0.12)' } as any}
              className="card p-4 group cursor-pointer"
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
                <h3 className="font-medium text-sm text-[#1C0A00] truncate hover:text-brand-500">{doc.filename || doc.title}</h3>
              </Link>
              <p className="text-xs text-brand-500 mt-0.5">{doc.file_size ? formatBytes(doc.file_size) : ''}</p>
              
              {/* Progress bar for pending/processing documents */}
              {(doc.processing_status === 'pending' || doc.processing_status === 'processing') && (
                <div className="mt-3 w-full bg-brand-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-brand-500 h-1.5 rounded-full transition-all duration-1000 animate-pulse-slow" 
                    style={{ width: doc.processing_status === 'pending' ? '30%' : '70%' }}
                  />
                </div>
              )}

              <div className="mt-3 flex items-center justify-between">
                <StatusBadge status={doc.processing_status} />
                <span className="text-xs text-brand-400">{formatDate(doc.created_at)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
