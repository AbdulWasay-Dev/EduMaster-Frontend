import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, ScrollText, Download, Trash2, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { type ColumnDef } from '@tanstack/react-table'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import StatusBadge from '@/components/shared/StatusBadge'
import DataTable from '@/components/shared/DataTable'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { listPapers, deletePaper, exportPaperPDF } from '@/lib/api/papers'
import { formatDate } from '@/lib/utils'
import { type Paper } from '@/types'

export default function PapersListPage() {
  const qc = useQueryClient()
  const { data: papers = [], isLoading } = useQuery({ queryKey: ['papers'], queryFn: () => listPapers() })

  const deleteMut = useMutation({
    mutationFn: deletePaper,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['papers'] }); toast.success('Paper deleted') },
  })

  const onExport = async (id: string) => {
    try {
      const blob = await exportPaperPDF(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `paper-${id}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Export failed') }
  }

  const columns: ColumnDef<Paper, any>[] = [
    { accessorKey: 'title', header: 'Title', cell: ({ row }) => (
      <Link to={`/papers/${row.original.id}`} className="font-medium text-[#1C0A00] hover:text-brand-500">{row.original.title}</Link>
    )},
    { accessorKey: 'questions', header: 'Questions', cell: ({ row }) => row.original.questions?.length ?? 0 },
    { accessorKey: 'total_marks', header: 'Total Marks' },
    { accessorKey: 'duration_minutes', header: 'Duration', cell: ({ getValue }) => getValue() ? `${getValue()} min` : '—' },
    { id: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.is_published ? 'published' : 'draft'} /> },
    { accessorKey: 'created_at', header: 'Created', cell: ({ getValue }) => formatDate(getValue() as string) },
    { id: 'actions', header: '', cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Link to={`/papers/${row.original.id}`} className="p-1.5 rounded hover:bg-brand-100 text-brand-500 transition-colors">
          <Eye className="w-3.5 h-3.5" />
        </Link>
        <button onClick={() => onExport(row.original.id)} className="p-1.5 rounded hover:bg-green-100 text-green-600 transition-colors">
          <Download className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => window.confirm('Delete paper?') && deleteMut.mutate(row.original.id)} className="p-1.5 rounded hover:bg-red-50 text-red-400 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    )},
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
      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : papers.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No papers yet"
          description="Generate your first AI-powered exam paper in minutes."
          action={<Link to="/papers/generate" className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/>Generate Paper</Link>}
        />
      ) : (
        <DataTable data={papers} columns={columns} searchPlaceholder="Search papers…" isLoading={isLoading} />
      )}
    </div>
  )
}
