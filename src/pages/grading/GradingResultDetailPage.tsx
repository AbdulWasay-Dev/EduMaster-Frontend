import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import confetti from 'canvas-confetti'
import PageHeader from '@/components/shared/PageHeader'
import GradeCircle from '@/components/shared/GradeCircle'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { getSubmission } from '@/lib/api/grading'
import { formatDate, gradeLabel, gradeColor } from '@/lib/utils'

export default function GradingResultDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: submission, isLoading } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => getSubmission(id!),
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

  const details = submission.grading_details ?? submission.question_details ?? []
  const feedback = submission.ai_feedback ?? submission.feedback

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
        <div className="ml-auto grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'Correct', value: details.filter(d => d.is_correct).length, color: 'text-green-600', icon: CheckCircle },
            { label: 'Partial', value: details.filter(d => !d.is_correct && (d.marks_awarded ?? 0) > 0).length, color: 'text-amber-500', icon: AlertCircle },
            { label: 'Wrong', value: details.filter(d => !d.is_correct && (d.marks_awarded ?? 0) === 0).length, color: 'text-red-500', icon: XCircle },
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

      {/* Question breakdown */}
      {details.length > 0 && (
        <div className="space-y-3">
          <h2 className="section-title">Question Breakdown</h2>
          {details.map((d, i) => (
            <div key={d.question_id ?? i} className={`card p-4 border-l-4 ${d.is_correct ? 'border-green-400' : (d.marks_awarded ?? 0) > 0 ? 'border-amber-400' : 'border-red-400'}`}>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-brand-100 text-brand-700">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#1C0A00]">{d.question_text}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <span className="text-brand-500">Awarded: <strong>{d.marks_awarded ?? 0}</strong> / {d.max_marks ?? 1}</span>
                    {d.is_correct
                      ? <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Correct</span>
                      : (d.marks_awarded ?? 0) > 0
                        ? <span className="text-amber-500 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Partial</span>
                        : <span className="text-red-500 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Incorrect</span>
                    }
                  </div>
                  {d.student_answer && (
                    <div className="mt-2 p-2 bg-brand-50 rounded-lg">
                      <p className="text-xs text-brand-600 font-medium">Student answer:</p>
                      <p className="text-sm text-[#1C0A00]">{d.student_answer}</p>
                    </div>
                  )}
                  {d.evidence_quote && (
                    <div className="mt-2 p-2 bg-white rounded-lg border border-brand-100">
                      <p className="text-xs text-brand-600 font-medium">OCR evidence:</p>
                      <p className="text-sm text-[#1C0A00]">{d.evidence_quote}</p>
                    </div>
                  )}
                  {d.ai_comment && (
                    <p className="mt-2 text-xs text-brand-500 italic">{d.ai_comment}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
