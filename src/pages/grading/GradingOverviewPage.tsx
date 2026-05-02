import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, CheckSquare, Eye, AlertCircle, TrendingUp } from 'lucide-react'
import { type ColumnDef } from '@tanstack/react-table'
import { motion } from 'framer-motion'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import StatusBadge from '@/components/shared/StatusBadge'
import GradeCircle from '@/components/shared/GradeCircle'
import DataTable from '@/components/shared/DataTable'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { listSubmissions } from '@/lib/api/grading'
import { listClasses } from '@/lib/api/classes'
import { formatDate } from '@/lib/utils'
import { type Submission } from '@/types'

export default function GradingOverviewPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['submissions'],
    queryFn: () => listSubmissions(),
  })
  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: listClasses })

  const getPct = (s: Submission) =>
    s.grade_percentage ?? (s.max_score ? Math.round(((s.total_score ?? 0) / s.max_score) * 100) : 0)

  const graded    = submissions.filter(s => s.status === 'graded')
  const pending   = submissions.filter(s => s.status === 'pending')
  const avgScore  = graded.length
    ? Math.round(graded.reduce((a, s) => a + getPct(s), 0) / graded.length)
    : 0

  const filtered = submissions.filter(s => {
    if (statusFilter && s.status !== statusFilter) return false
    if (classFilter && s.class_id !== classFilter) return false
    return true
  })

  const columns: ColumnDef<Submission, any>[] = [
    {
      accessorKey: 'student_name',
      header: 'Student',
      cell: ({ getValue }) => (
        <span className="font-medium text-[#1C0A00]">{(getValue() as string) || '—'}</span>
      ),
    },
    {
      accessorKey: 'paper_title',
      header: 'Paper',
      cell: ({ getValue }) => (
        <span className="text-brand-600 text-xs">{(getValue() as string) || '—'}</span>
      ),
    },
    {
      id: 'score',
      header: 'Score',
      cell: ({ row }) => {
        const s = row.original
        return (
          <span className="font-medium text-[#1C0A00]">
            {s.total_score ?? s.score ?? 0}/{s.max_score ?? s.total_marks ?? 0}
          </span>
        )
      },
    },
    {
      id: 'pct',
      header: '%',
      cell: ({ row }) => <GradeCircle percentage={getPct(row.original)} size={40} />,
    },
    {
      id: 'questions',
      header: 'Questions',
      cell: ({ row }) => {
        const details: any[] = row.original.grading_details ?? row.original.question_details ?? []
        if (!details.length) return <span className="text-xs text-brand-400">—</span>
        const correct = details.filter((d: any) => d.is_correct).length
        return (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-green-600 font-semibold">{correct}✓</span>
            <span className="text-brand-400">|</span>
            <span className="text-brand-600">{details.length} total</span>
          </div>
        )
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'graded_at',
      header: 'Date',
      cell: ({ row }) => {
        const d = row.original.graded_at ?? row.original.created_at ?? row.original.submitted_at
        return <span className="text-brand-500 text-xs">{d ? formatDate(d) : '—'}</span>
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Link
          to={`/grading/${row.original.id}`}
          className="p-1.5 rounded hover:bg-brand-100 text-brand-500 transition-colors inline-flex"
        >
          <Eye className="w-3.5 h-3.5" />
        </Link>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grading"
        subtitle="Review and manage AI-graded answer sheets"
        action={
          <Link to="/grading/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Grade Sheets
          </Link>
        }
      />

      {/* Stats */}
      {submissions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Submissions', value: submissions.length, icon: CheckSquare, color: 'bg-brand-100 text-brand-600' },
            { label: 'Graded',           value: graded.length,      icon: CheckSquare, color: 'bg-emerald-100 text-emerald-600' },
            { label: 'Pending',          value: pending.length,     icon: AlertCircle, color: 'bg-amber-100 text-amber-600' },
            { label: 'Avg Score',        value: `${avgScore}%`,     icon: TrendingUp,  color: 'bg-cyan-100 text-cyan-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <motion.div key={label} whileHover={{ y: -2 } as any} className="card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-[#1C0A00]">{value}</p>
                <p className="text-xs text-brand-600">{label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Filters */}
      {submissions.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input text-sm py-1.5 w-auto"
          >
            <option value="">All Status</option>
            <option value="graded">Graded</option>
            <option value="pending">Pending</option>
            <option value="review">Review</option>
          </select>
          <select
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
            className="input text-sm py-1.5 w-auto"
          >
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {(statusFilter || classFilter) && (
            <button
              onClick={() => { setStatusFilter(''); setClassFilter('') }}
              className="text-xs text-brand-500 hover:text-brand-700 font-medium"
            >
              Clear filters
            </button>
          )}
          <span className="text-xs text-brand-400 ml-auto">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : submissions.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No graded submissions yet"
          description="Upload answer sheets to start AI-powered grading. Results appear here instantly."
          action={
            <Link to="/grading/new" className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Start Grading
            </Link>
          }
        />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          searchPlaceholder="Search by student or paper…"
          emptyMessage="No submissions match your filters"
        />
      )}
    </div>
  )
}
