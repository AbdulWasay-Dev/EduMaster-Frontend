import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, XCircle, Zap, User } from 'lucide-react'
import { toast } from 'sonner'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import {
  getAssignment,
  getAssignmentSubmissions,
  getAssignmentAnalytics,
  publishAssignment,
  closeAssignment,
  gradeSubmission,
  gradeAllSubmissions,
} from '@/lib/api/assignments'
import { cn } from '@/lib/utils'

export default function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: assignment, isLoading } = useQuery({
    queryKey: ['assignment', id],
    queryFn: () => getAssignment(id!),
    enabled: !!id,
  })

  const { data: submissions } = useQuery({
    queryKey: ['assignment-submissions', id],
    queryFn: () => getAssignmentSubmissions(id!),
    enabled: !!id,
  })

  const { data: analytics } = useQuery({
    queryKey: ['assignment-analytics', id],
    queryFn: () => getAssignmentAnalytics(id!),
    enabled: !!id,
  })

  const publishMut = useMutation({
    mutationFn: () => publishAssignment(id!),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['assignment', id] }); toast.success('Published!') },
  })

  const closeMut = useMutation({
    mutationFn: () => closeAssignment(id!),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['assignment', id] }); toast.success('Closed') },
  })

  const gradeOneMut = useMutation({
    mutationFn: (subId: string) => gradeSubmission(id!, subId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-submissions', id] })
      queryClient.invalidateQueries({ queryKey: ['assignment-analytics', id] })
      toast.success('Graded!')
    },
    onError: () => toast.error('Grading failed'),
  })

  const gradeAllMut = useMutation({
    mutationFn: () => gradeAllSubmissions(id!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assignment-submissions', id] })
      queryClient.invalidateQueries({ queryKey: ['assignment-analytics', id] })
      toast.success(`Graded ${data.graded} submissions` + (data.failed ? ` (${data.failed} failed)` : ''))
    },
  })

  if (isLoading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>
  if (!assignment) return <div className="text-center py-16 text-brand-400">Assignment not found.</div>

  const ungradedCount = (submissions || []).filter((s) => s.status !== 'graded').length

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/assignments')} className="text-brand-400 hover:text-brand-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#1C0A00]">{assignment.title}</h1>
            <p className="text-sm text-brand-700">
              {assignment.total_marks} marks · Status: <span className="font-medium">{assignment.status}</span>
              {assignment.due_date && ` · Due: ${new Date(assignment.due_date).toLocaleDateString()}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {assignment.status === 'draft' && (
            <button onClick={() => publishMut.mutate()} className="btn-primary flex items-center gap-1 text-sm">
              <CheckCircle2 className="w-4 h-4" /> Publish
            </button>
          )}
          {assignment.status === 'published' && (
            <button onClick={() => closeMut.mutate()} className="btn-secondary flex items-center gap-1 text-sm">
              <XCircle className="w-4 h-4" /> Close
            </button>
          )}
        </div>
      </div>

      {/* Analytics summary */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Submissions', value: analytics.total_submissions },
            { label: 'Graded', value: analytics.graded_count },
            { label: 'Average', value: analytics.average_score != null ? `${analytics.average_score}%` : '-' },
            { label: 'Pass Rate', value: `${analytics.pass_rate}%` },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-brand-100 p-4 shadow-sm text-center">
              <p className="text-xs text-brand-500 font-medium">{s.label}</p>
              <p className="text-xl font-bold text-[#1C0A00] mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      {assignment.instructions && (
        <div className="bg-white rounded-xl border border-brand-100 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-brand-700 mb-2">Instructions</h2>
          <p className="text-sm text-[#1C0A00] whitespace-pre-wrap">{assignment.instructions}</p>
        </div>
      )}

      {/* Submissions */}
      <div className="bg-white rounded-xl border border-brand-100 shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-brand-50">
          <h2 className="font-semibold text-[#1C0A00]">
            Submissions ({(submissions || []).length})
          </h2>
          {ungradedCount > 0 && (
            <button
              onClick={() => gradeAllMut.mutate()}
              disabled={gradeAllMut.isPending}
              className="btn-primary flex items-center gap-1 text-xs py-1.5 px-3"
            >
              {gradeAllMut.isPending ? <LoadingSpinner size="sm" /> : <><Zap className="w-3.5 h-3.5" /> AI Grade All ({ungradedCount})</>}
            </button>
          )}
        </div>

        {(submissions || []).length > 0 ? (
          <div className="divide-y divide-brand-50">
            {(submissions || []).map((sub) => (
              <div key={sub.id} className="flex items-center gap-4 p-4 hover:bg-brand-25 transition-colors">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-100 text-brand-500 shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1C0A00] truncate">{sub.student_name || 'Student'}</p>
                  <p className="text-xs text-brand-500 truncate">{sub.submission_text?.slice(0, 80)}...</p>
                </div>
                <div className="text-right shrink-0">
                  {sub.status === 'graded' ? (
                    <div>
                      <p className="text-sm font-bold text-green-600">
                        {sub.marks_obtained}/{assignment.total_marks}
                      </p>
                      <p className="text-xs text-brand-400">{sub.grade}</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => gradeOneMut.mutate(sub.id)}
                      disabled={gradeOneMut.isPending}
                      className={cn(
                        'px-3 py-1 rounded-md text-xs font-medium',
                        'bg-brand-50 text-brand-600 hover:bg-brand-100',
                      )}
                    >
                      {gradeOneMut.isPending ? <LoadingSpinner size="sm" /> : 'AI Grade'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-brand-400">No submissions yet.</div>
        )}
      </div>
    </motion.div>
  )
}
