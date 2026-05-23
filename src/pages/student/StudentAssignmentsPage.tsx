import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Clock, CheckCircle2, AlertCircle, FileText } from 'lucide-react'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { listStudentAssignments } from '@/lib/api/student-portal'
import { cn } from '@/lib/utils'

const statusBadge = (status: string) => {
  switch (status) {
    case 'graded':
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700"><CheckCircle2 className="w-3 h-3" /> Graded</span>
    case 'submitted':
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700"><Clock className="w-3 h-3" /> Submitted</span>
    default:
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700"><AlertCircle className="w-3 h-3" /> Pending</span>
  }
}

export default function StudentAssignmentsPage() {
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['student-assignments'],
    queryFn: listStudentAssignments,
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>
  }

  const pending = (assignments || []).filter((a) => a.submission_status === 'not_submitted')
  const completed = (assignments || []).filter((a) => a.submission_status !== 'not_submitted')

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Assignments</h1>
        <p className="text-slate-500 text-sm mt-1">View and submit your class assignments.</p>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-700 mb-3">Pending ({pending.length})</h2>
          <div className="space-y-3">
            {pending.map((a) => (
              <Link
                key={a.id}
                to={`/student/assignments/${a.id}`}
                className="flex items-center gap-4 bg-white rounded-xl border border-amber-100 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100 text-amber-600 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{a.title}</p>
                  <p className="text-xs text-slate-500">{a.subject_name} · {a.total_marks} marks</p>
                </div>
                <div className="text-right shrink-0">
                  {statusBadge(a.submission_status)}
                  {a.due_date && (
                    <p className="text-xs text-slate-400 mt-1">
                      Due: {new Date(a.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-700 mb-3">Completed ({completed.length})</h2>
          <div className="space-y-3">
            {completed.map((a) => (
              <Link
                key={a.id}
                to={`/student/assignments/${a.id}`}
                className={cn(
                  'flex items-center gap-4 bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow',
                  a.submission_status === 'graded' ? 'border-green-100' : 'border-brand-100',
                )}
              >
                <div className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-lg shrink-0',
                  a.submission_status === 'graded' ? 'bg-green-100 text-green-600' : 'bg-brand-100 text-brand-600',
                )}>
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{a.title}</p>
                  <p className="text-xs text-slate-500">{a.subject_name} · {a.total_marks} marks</p>
                </div>
                <div className="text-right shrink-0">
                  {statusBadge(a.submission_status)}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {(assignments || []).length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No assignments yet. Check back later!</p>
        </div>
      )}
    </motion.div>
  )
}
