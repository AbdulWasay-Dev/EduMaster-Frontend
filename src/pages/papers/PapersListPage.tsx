import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, ScrollText, Download, Trash2, Eye, Edit3, CheckSquare } from 'lucide-react'
import { toast } from 'sonner'
import { type ColumnDef } from '@tanstack/react-table'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import StatusBadge from '@/components/shared/StatusBadge'
import DataTable from '@/components/shared/DataTable'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { listPapers, deletePaper, exportPaperPDF } from '@/lib/api/papers'
import { listSubjects } from '@/lib/api/subjects'
import { formatDate } from '@/lib/utils'
import { type Paper } from '@/types'

export default function PapersListPage() {
  const qc = useQueryClient()
  const [subjectFilter, setSubjectFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data: papers = [], isLoading } = useQuery({ queryKey: ['papers'], queryFn: () => listPapers() })
  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: listSubjects })

  const deleteMut = useMutation({
    mutationFn: deletePaper,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['papers'] }); toast.success('Paper deleted') },
    onError: () => toast.error('Failed to delete paper'),
  })

  const onExport = async (id: string, title: string) => {
    try {
      const blob = await exportPaperPDF(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF downloaded')
    } catch {
      toast.error('Export failed')
    }
  }

  const filtered = papers.filter(p => {
    if (subjectFilter && p.subject_id !== subjectFilter) return false
    if (statusFilter === 'published' && !p.is_published) return false
    if (statusFilter === 'draft' && p.is_published) return false
    return true
  })

  const columns: ColumnDef<Paper, any>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <Link to={`/papers/${row.original.id}`} className="font-medium text-[#1C0A00] hover:text-brand-500">
          {row.original.title}
        </Link>
      ),
    },
    {
      id: 'questions',
      header: 'Questions',
      cell: ({ row }) => <span className="text-brand-700">{row.original.questions?.length ?? 0}</span>,
    },
    {
      accessorKey: 'total_marks',
      header: 'Marks',
      cell: ({ getValue }) => <span className="text-brand-700">{getValue() as number}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.is_published ? 'published' : 'draft'} />,
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ getValue }) => <span className="text-brand-500 text-xs">{formatDate(getValue() as string)}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Link
            to={`/papers/${row.original.id}`}
            title="View"
            className="p-1.5 rounded hover:bg-brand-100 text-brand-500 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
          </Link>
          <Link
            to={`/papers/${row.original.id}/edit`}
            title="Edit"
            className="p-1.5 rounded hover:bg-brand-100 text-brand-500 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </Link>
          <Link
            to={`/grading/new?paper_id=${row.original.id}`}
            title="Use for Grading"
            className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600 transition-colors"
          >
            <CheckSquare className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => onExport(row.original.id, row.original.title)}
            title="Download PDF"
            className="p-1.5 rounded hover:bg-green-50 text-green-600 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => window.confirm(`Delete "${row.original.title}"?`) && deleteMut.mutate(row.original.id)}
            title="Delete"
            className="p-1.5 rounded hover:bg-red-50 text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exam Papers"
        subtitle="Manage your AI-generated exam papers"
        action={
          <Link to="/papers/generate" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Generate Paper
          </Link>
        }
      />

      {/* Filters */}
      {papers.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={subjectFilter}
            onChange={e => setSubjectFilter(e.target.value)}
            className="input text-sm py-1.5 w-auto"
          >
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input text-sm py-1.5 w-auto"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          {(subjectFilter || statusFilter) && (
            <button
              onClick={() => { setSubjectFilter(''); setStatusFilter('') }}
              className="text-xs text-brand-500 hover:text-brand-700 font-medium"
            >
              Clear filters
            </button>
          )}
          <span className="text-xs text-brand-400 ml-auto">{filtered.length} paper{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : papers.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No papers yet"
          description="Generate your first AI-powered exam paper from your uploaded study materials."
          action={
            <Link to="/papers/generate" className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Generate Paper
            </Link>
          }
        />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          searchPlaceholder="Search papers…"
          isLoading={isLoading}
          emptyMessage="No papers match your filters"
        />
      )}
    </div>
  )
}
