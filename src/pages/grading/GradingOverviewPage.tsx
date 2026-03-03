import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, CheckSquare, Eye } from 'lucide-react'
import { type ColumnDef } from '@tanstack/react-table'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import StatusBadge from '@/components/shared/StatusBadge'
import GradeCircle from '@/components/shared/GradeCircle'
import DataTable from '@/components/shared/DataTable'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { listSubmissions } from '@/lib/api/grading'
import { formatDate } from '@/lib/utils'
import { type Submission } from '@/types'

export default function GradingOverviewPage() {
  const { data: submissions = [], isLoading } = useQuery({ queryKey: ['submissions'], queryFn: () => listSubmissions() })

  const columns: ColumnDef<Submission, any>[] = [
    { accessorKey: 'student_name', header: 'Student', cell: ({ getValue }) => (
      <span className="font-medium text-[#1C0A00]">{getValue() as string || '—'}</span>
    )},
    { id: 'score', header: 'Score', cell: ({ row }) => {
      const pct = row.original.total_marks ? Math.round(((row.original.score ?? 0) / row.original.total_marks) * 100) : 0
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium text-[#1C0A00]">{row.original.score ?? 0}/{row.original.total_marks}</span>
          <span className="text-xs text-brand-500">({pct}%)</span>
        </div>
      )
    }},
    { id: 'grade_circle', header: '%', cell: ({ row }) => {
      const pct = row.original.total_marks ? Math.round(((row.original.score ?? 0) / row.original.total_marks) * 100) : 0
      return <GradeCircle percentage={pct} size={40} />
    }},
    { id: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: 'created_at', header: 'Graded', cell: ({ getValue }) => formatDate(getValue() as string) },
    { id: 'actions', header: '', cell: ({ row }) => (
      <Link to={`/grading/${row.original.id}`} className="p-1.5 rounded hover:bg-brand-100 text-brand-500 transition-colors inline-flex">
        <Eye className="w-3.5 h-3.5" />
      </Link>
    )},
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grading"
        subtitle="Review AI-graded answer sheets"
        action={
          <Link to="/grading/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Grade Sheets
          </Link>
        }
      />
      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : submissions.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No graded submissions yet"
          description="Upload answer sheets to start AI-powered grading."
          action={<Link to="/grading/new" className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/>Start Grading</Link>}
        />
      ) : (
        <DataTable data={submissions} columns={columns} searchPlaceholder="Search submissions…" />
      )}
    </div>
  )
}
