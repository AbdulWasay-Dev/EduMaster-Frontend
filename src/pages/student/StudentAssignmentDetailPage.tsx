import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock, CheckCircle2, Send, Download } from 'lucide-react'
import { toast } from 'sonner'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { getStudentAssignment, submitAssignment } from '@/lib/api/student-portal'

function getBackendFileUrl(path?: string | null) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  const apiBase = import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:8010/api/v1`
  const backendBase = apiBase.replace(/\/api\/v1\/?$/, '')
  return `${backendBase}${path.startsWith('/') ? '' : '/'}${path}`
}

export default function StudentAssignmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [submissionText, setSubmissionText] = useState('')

  const { data: assignment, isLoading } = useQuery({
    queryKey: ['student-assignment', id],
    queryFn: () => getStudentAssignment(id!),
    enabled: !!id,
  })

  const submitMutation = useMutation({
    mutationFn: () => submitAssignment(id!, submissionText),
    onSuccess: () => {
      toast.success('Assignment submitted successfully!')
      queryClient.invalidateQueries({ queryKey: ['student-assignment', id] })
      queryClient.invalidateQueries({ queryKey: ['student-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['student-dashboard'] })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Submission failed'
      toast.error(typeof msg === 'string' ? msg : 'Submission failed')
    },
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>
  }

  if (!assignment) {
    return <div className="text-center py-16 text-slate-400">Assignment not found.</div>
  }

  const hasSubmission = !!assignment.submission
  const isGraded = assignment.submission?.status === 'graded'
  const canSubmit = assignment.status === 'published' && !isGraded
  const assignmentPdfUrl = getBackendFileUrl(assignment.attachment_url)

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/student/assignments')} className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{assignment.title}</h1>
          <p className="text-sm text-slate-500">
            {assignment.subject_name} · {assignment.total_marks} marks
            {assignment.due_date && ` · Due: ${new Date(assignment.due_date).toLocaleDateString()}`}
          </p>
        </div>
      </div>

      {/* Assignment details */}
      {assignment.instructions && (
        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-600 mb-2">Instructions</h2>
          <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">
            {assignment.instructions}
          </div>
        </div>
      )}

      {assignmentPdfUrl && (
        <div className="bg-white rounded-xl border border-brand-100 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-700">Assignment PDF</h2>
            <p className="text-sm text-slate-500 mt-1">Download the generated assignment sheet before writing your answer.</p>
          </div>
          <a href={assignmentPdfUrl} target="_blank" rel="noreferrer" className="btn-primary inline-flex items-center justify-center gap-2">
            <Download className="w-4 h-4" /> Download PDF
          </a>
        </div>
      )}

      {/* Grading result */}
      {isGraded && assignment.submission && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-green-800">Graded</h2>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs text-green-600 font-medium">Score</p>
              <p className="text-2xl font-bold text-green-800">
                {assignment.submission.marks_obtained ?? '-'}/{assignment.total_marks}
              </p>
            </div>
            <div>
              <p className="text-xs text-green-600 font-medium">Percentage</p>
              <p className="text-2xl font-bold text-green-800">
                {assignment.submission.percentage != null ? `${assignment.submission.percentage}%` : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-green-600 font-medium">Grade</p>
              <p className="text-2xl font-bold text-green-800">{assignment.submission.grade ?? '-'}</p>
            </div>
          </div>
          {assignment.submission.ai_feedback && (
            <div>
              <h3 className="text-sm font-semibold text-green-700 mb-1">Feedback</h3>
              <div className="prose prose-sm max-w-none text-green-800 whitespace-pre-wrap">
                {assignment.submission.ai_feedback}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Existing submission (not yet graded) */}
      {hasSubmission && !isGraded && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-brand-600" />
            <h2 className="text-sm font-semibold text-brand-800">Submitted — Awaiting Grading</h2>
          </div>
          <p className="text-sm text-brand-700 whitespace-pre-wrap">
            {assignment.submission?.submission_text}
          </p>
        </div>
      )}

      {/* Submission form */}
      {canSubmit && !hasSubmission && (
        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-600 mb-3">Your Answer</h2>
          <textarea
            value={submissionText}
            onChange={(e) => setSubmissionText(e.target.value)}
            rows={10}
            placeholder="Type your answer here..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-y"
          />
          <div className="flex justify-end mt-4">
            <button
              onClick={() => submitMutation.mutate()}
              disabled={!submissionText.trim() || submitMutation.isPending}
              className="px-5 py-2.5 rounded-lg bg-brand-500 text-white font-semibold text-sm hover:bg-brand-600 disabled:opacity-60 transition-colors flex items-center gap-2"
            >
              {submitMutation.isPending ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Closed assignment notice */}
      {assignment.status === 'closed' && !hasSubmission && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-slate-500">
          This assignment is closed. Submissions are no longer accepted.
        </div>
      )}
    </motion.div>
  )
}
