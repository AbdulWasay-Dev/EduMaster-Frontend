import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, CheckCircle2, XCircle, Zap, User, Mail, UploadCloud,
  FileText, BarChart3, Settings, AlertCircle, PlayCircle
} from 'lucide-react'
import { toast } from 'sonner'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import {
  getAssignment, getAssignmentSubmissions, getAssignmentAnalytics,
  publishAssignment, closeAssignment, gradeSubmission, gradeAllSubmissions,
  fetchEmailSubmissions, manualUploadSubmission
} from '@/lib/api/assignments'
import { listStudents } from '@/lib/api/students'
import { listClasses } from '@/lib/api/classes'
import { listSubjects } from '@/lib/api/subjects'
import { cn } from '@/lib/utils'

import EmailConfigModal from './components/EmailConfigModal'
import ManualUploadModal from './components/ManualUploadModal'
import SubmissionDetailModal from './components/SubmissionDetailModal'

export default function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<'submissions' | 'analytics'>('submissions')
  const [showEmailConfig, setShowEmailConfig] = useState(false)
  const [showManualUpload, setShowManualUpload] = useState(false)
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null)

  const { data: assignment, isLoading } = useQuery({
    queryKey: ['assignment', id],
    queryFn: () => getAssignment(id!),
    enabled: !!id,
  })

  const { data: submissions, isLoading: isLoadingSubs } = useQuery({
    queryKey: ['assignment-submissions', id],
    queryFn: () => getAssignmentSubmissions(id!),
    enabled: !!id,
  })

  const { data: analytics } = useQuery({
    queryKey: ['assignment-analytics', id],
    queryFn: () => getAssignmentAnalytics(id!),
    enabled: !!id,
  })

  // Students for manual upload
  const { data: students } = useQuery({
    queryKey: ['students', assignment?.class_id],
    queryFn: () => listStudents(assignment!.class_id),
    enabled: !!assignment?.class_id,
  })

  // Class and subject name resolution
  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: () => listClasses() })
  const { data: allSubjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: () => listSubjects() })
  const className   = assignment?.class_name   || classes.find(c => c.id === assignment?.class_id)?.name   || null
  const subjectName = assignment?.subject_name || allSubjects.find(s => s.id === assignment?.subject_id)?.name || null

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
      toast.success(`Graded ${data.graded_count} submissions` + (data.failed_count ? ` (${data.failed_count} failed)` : ''))
    },
  })

  const fetchEmailMut = useMutation({
    mutationFn: () => fetchEmailSubmissions(id!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assignment-submissions', id] })
      toast.success(data.message)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to fetch emails')
      if (err.response?.data?.error?.includes('config')) setShowEmailConfig(true)
    }
  })

  if (isLoading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>
  if (!assignment) return <div className="text-center py-16 text-brand-400">Assignment not found.</div>

  const ungradedCount = (submissions || []).filter((s) => s.status === 'submitted').length

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-brand-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <button onClick={() => navigate('/assignments')} className="mt-1 p-2 bg-brand-50 text-brand-500 rounded-xl hover:bg-brand-100 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-[#0f172a]">{assignment.title}</h1>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                  assignment.status === 'draft' ? "bg-slate-50 text-slate-600 border-slate-200" :
                  assignment.status === 'published' ? "bg-green-50 text-green-700 border-green-200" :
                  "bg-red-50 text-red-600 border-red-200"
                )}>
                  {assignment.status.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-brand-600 flex items-center gap-3 flex-wrap mt-1">
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" /> {assignment.total_marks} marks
                </span>
                {assignment.due_date && <span className="text-blue-600">· Due: {new Date(assignment.due_date).toLocaleDateString()}</span>}
                {className && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-full">
                    🎓 {className}
                  </span>
                )}
                {subjectName && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                    📚 {subjectName}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {assignment.status === 'draft' && (
              <button onClick={() => publishMut.mutate()} className="btn-primary flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Publish
              </button>
            )}
            {assignment.status === 'published' && (
              <button onClick={() => closeMut.mutate()} className="btn-secondary flex items-center gap-2 text-red-600 hover:text-red-700">
                <XCircle className="w-4 h-4" /> Close
              </button>
            )}
          </div>
        </div>

        {assignment.instructions && (
          <div className="mt-6 pt-6 border-t border-brand-50">
            <h3 className="text-sm font-semibold text-brand-900 mb-2">Instructions</h3>
            <p className="text-sm text-brand-700 whitespace-pre-wrap">{assignment.instructions}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-brand-100">
        <button
          onClick={() => setActiveTab('submissions')}
          className={cn("pb-3 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
            activeTab === 'submissions' ? "border-brand-500 text-brand-700" : "border-transparent text-brand-400 hover:text-brand-600")}
        >
          <FileText className="w-4 h-4" /> Submissions ({(submissions || []).length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={cn("pb-3 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
            activeTab === 'analytics' ? "border-brand-500 text-brand-700" : "border-transparent text-brand-400 hover:text-brand-600")}
        >
          <BarChart3 className="w-4 h-4" /> Analytics
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'submissions' && (
            <div className="space-y-6">
              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-brand-100 shadow-sm">
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowEmailConfig(true)} className="btn-secondary flex items-center gap-2 text-sm" title="Email Configuration">
                    <Settings className="w-4 h-4" /> Email Sync Config
                  </button>
                  <button
                    onClick={() => fetchEmailMut.mutate()}
                    disabled={fetchEmailMut.isPending}
                    className="btn-secondary flex items-center gap-2 text-sm text-brand-600"
                  >
                    {fetchEmailMut.isPending ? <LoadingSpinner size="sm" /> : <Mail className="w-4 h-4" />} Fetch Emails
                  </button>
                  <button onClick={() => setShowManualUpload(true)} className="btn-secondary flex items-center gap-2 text-sm">
                    <UploadCloud className="w-4 h-4" /> Manual Upload
                  </button>
                </div>
                {ungradedCount > 0 && (
                  <button
                    onClick={() => gradeAllMut.mutate()}
                    disabled={gradeAllMut.isPending}
                    className="btn-primary flex items-center gap-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 border-none shadow-md shadow-blue-200"
                  >
                    {gradeAllMut.isPending ? <LoadingSpinner size="sm" /> : <Zap className="w-4 h-4" />}
                    AI Grade All ({ungradedCount})
                  </button>
                )}
              </div>

              {/* Submissions List */}
              <div className="bg-white rounded-xl border border-brand-100 shadow-sm overflow-hidden">
                {isLoadingSubs ? (
                  <div className="p-8 flex justify-center"><LoadingSpinner /></div>
                ) : (submissions || []).length > 0 ? (
                  <div className="divide-y divide-brand-50">
                    {(submissions || []).map((sub) => (
                      <div key={sub.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-brand-25 transition-colors group">
                        <div className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedSubId(sub.id)}>
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center text-brand-600 shrink-0">
                            <User className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#0f172a] truncate">{sub.student_name || 'Student'}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-xs text-brand-500 truncate max-w-xs">{sub.student_email || sub.roll_number}</p>
                              <span className="text-xs text-brand-300">•</span>
                              <p className="text-xs text-brand-400 capitalize">{sub.source || 'direct'} submission</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          {sub.status === 'graded' || sub.status === 'returned' ? (
                            <div className="text-right cursor-pointer" onClick={() => setSelectedSubId(sub.id)}>
                              <p className="text-lg font-bold text-green-600 tabular-nums">
                                {sub.marks_obtained !== null ? sub.marks_obtained : '-'}/{sub.max_marks || assignment.total_marks}
                              </p>
                              <p className="text-xs font-medium text-brand-400">Grade: {sub.grade}</p>
                            </div>
                          ) : sub.status === 'grading' ? (
                            <div className="flex items-center gap-2 text-brand-500 text-sm font-medium">
                              <LoadingSpinner size="sm" /> Grading...
                            </div>
                          ) : (
                            <button
                              onClick={() => gradeOneMut.mutate(sub.id)}
                              disabled={gradeOneMut.isPending}
                              className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-50 text-brand-600 hover:bg-brand-100 hover:text-brand-700 transition-colors flex items-center gap-2"
                            >
                              {gradeOneMut.isPending ? <LoadingSpinner size="sm" /> : <><PlayCircle className="w-4 h-4"/> AI Grade</>}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-brand-300" />
                    </div>
                    <h3 className="text-lg font-medium text-brand-900 mb-1">No submissions yet</h3>
                    <p className="text-brand-500 text-sm max-w-sm mx-auto">
                      Students can submit directly, or you can fetch emails, or upload them manually.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && analytics && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Submissions', value: analytics.total_submissions },
                  { label: 'Graded', value: analytics.graded_count },
                  { label: 'Average Score', value: analytics.average_score != null ? `${analytics.average_score}` : '-' },
                  { label: 'Pass Rate', value: `${analytics.pass_rate}%` },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-xl border border-brand-100 p-5 shadow-sm">
                    <p className="text-xs font-medium text-brand-500 uppercase tracking-wider">{s.label}</p>
                    <p className="text-3xl font-bold text-[#0f172a] mt-2">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Grade Distribution */}
              {analytics.grade_distribution && Object.keys(analytics.grade_distribution).length > 0 && (
                <div className="bg-white rounded-xl border border-brand-100 p-6 shadow-sm">
                  <h3 className="font-semibold text-brand-900 mb-4">Grade Distribution</h3>
                  <div className="flex gap-2 h-32 items-end">
                    {Object.entries(analytics.grade_distribution)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([grade, count]: [string, any]) => (
                      <div key={grade} className="flex flex-col items-center flex-1 gap-2">
                        <div
                          className="w-full bg-brand-500 rounded-t-sm"
                          style={{ height: `${(count / analytics.graded_count) * 100}%`, minHeight: '4px' }}
                        />
                        <span className="text-xs font-medium text-brand-600">{grade}</span>
                        <span className="text-xs text-brand-400">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      {showEmailConfig && <EmailConfigModal onClose={() => setShowEmailConfig(false)} />}
      {showManualUpload && (
        <ManualUploadModal
          assignmentId={id!}
          students={students || []}
          onClose={() => setShowManualUpload(false)}
          onSuccess={() => {
            setShowManualUpload(false)
            queryClient.invalidateQueries({ queryKey: ['assignment-submissions', id] })
          }}
        />
      )}
      {selectedSubId && (
        <SubmissionDetailModal
          submission={submissions?.find(s => s.id === selectedSubId)}
          assignment={assignment}
          onClose={() => setSelectedSubId(null)}
          onOverrideSuccess={() => queryClient.invalidateQueries({ queryKey: ['assignment-submissions', id] })}
        />
      )}
    </motion.div>
  )
}
