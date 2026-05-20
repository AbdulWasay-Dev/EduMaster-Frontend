import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { X, CheckCircle2, User, FileText, AlertCircle, Edit3 } from 'lucide-react'
import { toast } from 'sonner'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { overrideSubmissionGrade } from '@/lib/api/assignments'
import type { Assignment, AssignmentSubmission } from '@/types'

interface SubmissionDetailModalProps {
  submission: AssignmentSubmission | undefined
  assignment: Assignment | undefined
  onClose: () => void
  onOverrideSuccess: () => void
}

export default function SubmissionDetailModal({ submission, assignment, onClose, onOverrideSuccess }: SubmissionDetailModalProps) {
  const [overrideMarks, setOverrideMarks] = useState(submission?.marks_obtained?.toString() || '')
  const [overrideFeedback, setOverrideFeedback] = useState(submission?.teacher_remarks || '')
  const [isEditing, setIsEditing] = useState(false)

  const overrideMut = useMutation({
    mutationFn: () => overrideSubmissionGrade(assignment!.id, submission!.id, {
      teacher_override_marks: parseFloat(overrideMarks),
      teacher_remarks: overrideFeedback,
    }),
    onSuccess: () => {
      toast.success('Grade updated')
      setIsEditing(false)
      onOverrideSuccess()
    },
    onError: () => toast.error('Failed to update grade'),
  })

  if (!submission || !assignment) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-brand-50 bg-brand-50/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center text-brand-600">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0f172a]">{submission.student_name}</h2>
              <p className="text-sm text-brand-500">{submission.student_email} • Submitted: {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : '—'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-brand-400 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Main Content Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Left Col: Submission Content */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white rounded-xl border border-brand-100 p-5">
                <h3 className="text-sm font-semibold text-brand-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-500" /> Student Answer
                </h3>
                <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-800 whitespace-pre-wrap border border-slate-100 min-h-[150px]">
                  {submission.submission_text || <span className="text-slate-400 italic">No text provided.</span>}
                </div>
                
                {submission.submission_files && submission.submission_files.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-brand-50">
                    <h4 className="text-xs font-semibold text-brand-600 mb-2 uppercase tracking-wider">Attachments</h4>
                    <div className="flex flex-col gap-2">
                      {submission.submission_files.map((file, i) => (
                        <a key={i} href={file.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                          <FileText className="w-4 h-4" /> Attachment {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {submission.ai_feedback && (
                <div className="bg-brand-50/50 rounded-xl border border-brand-100 p-5">
                  <h3 className="text-sm font-semibold text-brand-900 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> AI Feedback
                  </h3>
                  <div className="prose prose-sm prose-brand max-w-none text-brand-800">
                    {submission.ai_feedback}
                  </div>
                </div>
              )}
            </div>

            {/* Right Col: Grading & Override */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-brand-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-brand-900">Current Grade</h3>
                  {!isEditing && submission.status !== 'pending' && (
                    <button onClick={() => setIsEditing(true)} className="p-1.5 text-brand-500 hover:bg-brand-50 rounded-md">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div>
                      <label className="text-xs font-medium text-brand-600 block mb-1">Override Marks</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={overrideMarks}
                          onChange={(e) => setOverrideMarks(e.target.value)}
                          className="input w-24 text-center font-bold"
                          min="0" max={assignment.total_marks} step="0.5"
                        />
                        <span className="text-brand-500">/ {assignment.total_marks}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-brand-600 block mb-1">Teacher Remarks</label>
                      <textarea
                        value={overrideFeedback}
                        onChange={(e) => setOverrideFeedback(e.target.value)}
                        className="input resize-none h-24 text-sm"
                        placeholder="Add your own feedback..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setIsEditing(false)} className="btn-secondary flex-1 text-xs py-1.5">Cancel</button>
                      <button onClick={() => overrideMut.mutate()} disabled={overrideMut.isPending} className="btn-primary flex-1 text-xs py-1.5">
                        {overrideMut.isPending ? <LoadingSpinner size="sm" /> : 'Save Grade'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center pb-4">
                    <p className="text-5xl font-black text-[#0f172a]">
                      {submission.marks_obtained !== null ? submission.marks_obtained : '-'}
                    </p>
                    <p className="text-sm text-brand-500 mt-1 font-medium">out of {assignment.total_marks}</p>
                    <div className="mt-3 inline-block px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-sm font-bold border border-brand-100">
                      Grade: {submission.grade || 'N/A'}
                    </div>
                  </div>
                )}
              </div>

              {submission.teacher_remarks && !isEditing && (
                <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
                  <h4 className="text-xs font-semibold text-yellow-800 mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> Teacher Remarks
                  </h4>
                  <p className="text-sm text-yellow-900">{submission.teacher_remarks}</p>
                </div>
              )}

              {submission.ai_rubric_breakdown && Object.keys(submission.ai_rubric_breakdown).length > 0 && (
                <div className="bg-white rounded-xl border border-brand-100 p-5">
                  <h4 className="text-xs font-semibold text-brand-900 mb-3 uppercase tracking-wider">Rubric Breakdown</h4>
                  <div className="space-y-3">
                    {Object.entries(submission.ai_rubric_breakdown).map(([criteria, item]: [string, any], i: number) => (
                      <div key={i} className="text-sm">
                        <div className="flex justify-between font-medium text-[#0f172a] mb-0.5">
                          <span>{item.criteria ?? criteria}</span>
                          <span>{item.score}/{item.max_score}</span>
                        </div>
                        {item.comment && <p className="text-xs text-brand-500">{item.comment}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
