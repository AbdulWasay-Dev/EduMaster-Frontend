import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, MinusCircle, Edit3, Save, X } from 'lucide-react'
import confetti from 'canvas-confetti'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import GradeCircle from '@/components/shared/GradeCircle'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { getSubmission, overrideScore } from '@/lib/api/grading'
import { formatDate, gradeLabel, gradeColor } from '@/lib/utils'

type QuestionDetail = {
  question_id?: string
  question_text?: string
  question_type?: string
  student_answer?: string
  evidence_quote?: string
  correct_answer?: string
  marks_awarded?: number
  max_marks?: number
  is_correct?: boolean
  attempted?: boolean
  ai_comment?: string
  confidence?: number
}

export default function GradingResultDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: submission, isLoading } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => getSubmission(id!),
  })

  // Score override state
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null)
  const [editScore, setEditScore] = useState<number>(0)
  const [editNote, setEditNote] = useState<string>('')

  const overrideMut = useMutation({
    mutationFn: ({ qId, score, note }: { qId: string; score: number; note: string }) =>
      overrideScore(id!, qId, score, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submission', id] })
      setEditingQuestion(null)
      toast.success('Score updated')
    },
    onError: () => toast.error('Failed to update score'),
  })

  const score = submission ? (submission.score ?? submission.total_score ?? 0) : 0
  const totalMarks = submission ? (submission.total_marks ?? submission.max_score ?? 0) : 0
  const pct = totalMarks
    ? Math.round((score / totalMarks) * 100)
    : Math.round(submission?.grade_percentage ?? 0)

  useEffect(() => {
    if (pct >= 90) {
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 }, colors: ['#f97316', '#fbbf24', '#ef4444', '#10b981'] })
    }
  }, [pct])

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  if (!submission) return <div className="py-20 text-center text-brand-500">Submission not found</div>

  const details: QuestionDetail[] = submission.grading_details ?? submission.question_details ?? []
  const feedback = submission.ai_feedback ?? submission.feedback

  // Compute stats
  const attempted = details.filter(d => d.attempted !== false && ((d.marks_awarded ?? 0) > 0 || d.student_answer))
  const unattempted = details.filter(d => d.attempted === false || (!d.student_answer && (d.marks_awarded ?? 0) === 0))
  const correct = details.filter(d => d.is_correct)
  const partial = details.filter(d => !d.is_correct && (d.marks_awarded ?? 0) > 0)
  const wrong = details.filter(d => !d.is_correct && (d.marks_awarded ?? 0) === 0 && (d.attempted !== false && !!d.student_answer))

  function statusIcon(d: QuestionDetail) {
    if (d.attempted === false || (!d.student_answer && (d.marks_awarded ?? 0) === 0)) {
      return { icon: MinusCircle, color: 'text-gray-400', label: 'Not Attempted', border: 'border-gray-300' }
    }
    if (d.is_correct) return { icon: CheckCircle, color: 'text-green-600', label: 'Correct', border: 'border-green-400' }
    if ((d.marks_awarded ?? 0) > 0) return { icon: AlertCircle, color: 'text-amber-500', label: 'Partial', border: 'border-amber-400' }
    return { icon: XCircle, color: 'text-red-500', label: 'Incorrect', border: 'border-red-400' }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grading Result"
        subtitle={submission.student_name ? `Student: ${submission.student_name}` : 'Answer Sheet Result'}
        action={
          <button onClick={() => navigate('/grading')} className="btn-ghost flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        }
      />

      {/* Score hero */}
      <div className="card p-8 flex flex-col sm:flex-row items-center gap-8">
        <GradeCircle percentage={pct} size={120} />
        <div className="text-center sm:text-left">
          <div className={`text-4xl font-black ${gradeColor(pct)}`}>{gradeLabel(pct)}</div>
          <p className="text-2xl font-bold text-[#1C0A00] mt-1">
            {score} / {totalMarks}
          </p>
          <p className="text-brand-500 text-sm mt-1">{pct}% correct</p>
          {pct >= 90 && <p className="text-amber-500 font-semibold mt-2">🎉 Excellent performance!</p>}
          {pct < 50 && <p className="text-red-500 text-sm mt-2">Needs improvement</p>}
          <div className="flex items-center gap-2 mt-3">
            <StatusBadge status={submission.status} />
            <span className="text-xs text-brand-400">Graded {formatDate(submission.created_at ?? submission.graded_at ?? submission.submitted_at)}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="ml-auto grid grid-cols-4 gap-3 text-center">
          {[
            { label: 'Correct', value: correct.length, color: 'text-green-600', icon: CheckCircle },
            { label: 'Partial', value: partial.length, color: 'text-amber-500', icon: AlertCircle },
            { label: 'Wrong', value: wrong.length, color: 'text-red-500', icon: XCircle },
            { label: 'Unattempted', value: unattempted.length, color: 'text-gray-400', icon: MinusCircle },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="card p-3">
              <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
              <div className={`text-xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-brand-500">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI feedback summary */}
      {feedback && (
        <div className="card p-5 border-l-4 border-brand-400">
          <p className="text-xs font-semibold text-brand-600 mb-1">AI Feedback Summary</p>
          <p className="text-sm text-[#1C0A00] leading-relaxed">{feedback}</p>
        </div>
      )}

      {/* OCR confidence indicator */}
      {submission.ocr_confidence != null && (
        <div className="card p-4 flex items-center gap-4">
          <span className="text-xs font-semibold text-brand-600">OCR Confidence:</span>
          <div className="flex-1 bg-brand-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                (submission.ocr_confidence ?? 0) >= 0.7 ? 'bg-green-500' :
                (submission.ocr_confidence ?? 0) >= 0.4 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.round((submission.ocr_confidence ?? 0) * 100)}%` }}
            />
          </div>
          <span className="text-xs font-bold text-brand-700">
            {Math.round((submission.ocr_confidence ?? 0) * 100)}%
          </span>
        </div>
      )}

      {/* Question breakdown */}
      {details.length > 0 && (
        <div className="space-y-3">
          <h2 className="section-title">Question Breakdown ({details.length} questions)</h2>
          {details.map((d, i) => {
            const status = statusIcon(d)
            const isEditing = editingQuestion === d.question_id
            return (
              <div
                key={d.question_id ?? i}
                className={`card p-4 border-l-4 ${status.border}`}
              >
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-brand-100 text-brand-700">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#1C0A00]">{d.question_text}</p>
                    {d.question_type && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-brand-50 text-brand-600 text-[10px] font-semibold rounded-full uppercase">
                        {d.question_type.replace('_', ' ')}
                      </span>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <span className="text-brand-500">
                        Awarded: <strong>{d.marks_awarded ?? 0}</strong> / {d.max_marks ?? 1}
                      </span>
                      <span className={`${status.color} flex items-center gap-1`}>
                        <status.icon className="w-3.5 h-3.5" /> {status.label}
                      </span>
                      {d.confidence != null && (
                        <span className="text-brand-400">
                          AI conf: {Math.round((d.confidence ?? 0) * 100)}%
                        </span>
                      )}
                    </div>

                    {/* Student answer */}
                    {d.student_answer ? (
                      <div className="mt-2 p-2 bg-brand-50 rounded-lg">
                        <p className="text-xs text-brand-600 font-medium">Student answer:</p>
                        <p className="text-sm text-[#1C0A00]">{d.student_answer}</p>
                      </div>
                    ) : (d.attempted === false || (d.marks_awarded ?? 0) === 0) ? (
                      <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-400 italic">No answer detected in the submitted sheet</p>
                      </div>
                    ) : null}

                    {/* Correct answer reference */}
                    {d.correct_answer && (
                      <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-100">
                        <p className="text-xs text-green-700 font-medium">Correct answer:</p>
                        <p className="text-sm text-green-900">{d.correct_answer}</p>
                      </div>
                    )}

                    {/* OCR evidence */}
                    {d.evidence_quote && (
                      <div className="mt-2 p-2 bg-white rounded-lg border border-brand-100">
                        <p className="text-xs text-brand-600 font-medium">OCR evidence:</p>
                        <p className="text-sm text-[#1C0A00] font-mono">{d.evidence_quote}</p>
                      </div>
                    )}

                    {/* AI comment */}
                    {d.ai_comment && (
                      <p className="mt-2 text-xs text-brand-500 italic">{d.ai_comment}</p>
                    )}

                    {/* Score override controls */}
                    {isEditing ? (
                      <div className="mt-3 flex items-center gap-2 p-2 bg-brand-50 rounded-lg">
                        <label className="text-xs font-medium text-brand-700">Score:</label>
                        <input
                          type="number"
                          min={0}
                          max={d.max_marks ?? 1}
                          step={0.5}
                          value={editScore}
                          onChange={e => setEditScore(Number(e.target.value))}
                          className="input w-20 text-sm py-1"
                        />
                        <span className="text-xs text-brand-500">/ {d.max_marks ?? 1}</span>
                        <input
                          type="text"
                          placeholder="Note (optional)"
                          value={editNote}
                          onChange={e => setEditNote(e.target.value)}
                          className="input flex-1 text-sm py-1"
                        />
                        <button
                          onClick={() => overrideMut.mutate({ qId: d.question_id ?? '', score: editScore, note: editNote })}
                          disabled={overrideMut.isPending}
                          className="btn-primary py-1 px-2 text-xs flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" /> Save
                        </button>
                        <button
                          onClick={() => setEditingQuestion(null)}
                          className="btn-ghost py-1 px-2 text-xs"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingQuestion(d.question_id ?? null)
                          setEditScore(d.marks_awarded ?? 0)
                          setEditNote('')
                        }}
                        className="mt-2 text-xs text-brand-500 hover:text-brand-700 flex items-center gap-1 transition-colors"
                      >
                        <Edit3 className="w-3 h-3" /> Override score
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
