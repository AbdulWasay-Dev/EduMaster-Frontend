import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, CheckCircle, XCircle, AlertCircle, MinusCircle,
  Edit3, Save, X, BarChart2, FileText, Users, Clock,
  ChevronDown, ChevronUp, Sparkles, BookOpen, TrendingUp,
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { toast } from 'sonner'
import GradeCircle from '@/components/shared/GradeCircle'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { getSubmission, overrideScore } from '@/lib/api/grading'
import { listClasses } from '@/lib/api/classes'
import { listPapers } from '@/lib/api/papers'
import { formatDate, gradeLabel, gradeColor } from '@/lib/utils'
import type { Class, Paper } from '@/types'

type QDetail = {
  question_id?: string
  question_text?: string
  question_type?: string
  student_answer?: string
  student_answer_text?: string
  evidence_quote?: string
  correct_answer?: string
  marks_awarded?: number
  scored_marks?: number
  max_marks?: number
  max_score?: number
  is_correct?: boolean
  attempted?: boolean
  ai_comment?: string
  ai_feedback?: string
  confidence?: number
  ai_confidence?: number
}

function statusIcon(d: QDetail) {
  const marks = d.marks_awarded ?? d.scored_marks ?? 0
  const max   = d.max_marks ?? d.max_score ?? 1
  if (d.attempted === false || (!d.student_answer && !d.student_answer_text && marks === 0))
    return { icon: MinusCircle, color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-l-gray-300',  label: 'Not Attempted' }
  if (d.is_correct)
    return { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50/30', border: 'border-l-emerald-400', label: 'Correct' }
  if (marks > 0 && marks < max)
    return { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50/30', border: 'border-l-amber-400', label: 'Partial Credit' }
  return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50/20', border: 'border-l-red-400', label: 'Incorrect' }
}

export default function GradingResultDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editingQ, setEditingQ] = useState<string | null>(null)
  const [editScore, setEditScore] = useState(0)
  const [editNote, setEditNote] = useState('')
  const [expandedQs, setExpandedQs] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'breakdown' | 'info'>('breakdown')

  const { data: submission, isLoading } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => getSubmission(id!),
  })
  const { data: classes = [] } = useQuery<Class[]>({ queryKey: ['classes'], queryFn: () => listClasses() })
  const { data: papers  = [] } = useQuery<Paper[]>({ queryKey: ['papers'],  queryFn: () => listPapers()  })

  const overrideMut = useMutation({
    mutationFn: ({ qId, score, note }: { qId: string; score: number; note: string }) =>
      overrideScore(id!, qId, score, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submission', id] })
      setEditingQ(null)
      toast.success('Score updated')
    },
    onError: () => toast.error('Failed to update score'),
  })

  const score      = submission ? (submission.score ?? submission.total_score ?? 0) : 0
  const totalMarks = submission ? (submission.total_marks ?? submission.max_score ?? 0) : 0
  const pct = totalMarks
    ? Math.round((score / totalMarks) * 100)
    : Math.round(submission?.grade_percentage ?? 0)

  useEffect(() => {
    if (pct >= 90) confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 }, colors: ['#f97316', '#fbbf24', '#10b981'] })
  }, [pct])

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  if (!submission) return <div className="py-20 text-center text-brand-500">Submission not found</div>

  const details: QDetail[] = submission.grading_details ?? submission.question_details ?? []
  const feedback = submission.ai_feedback ?? submission.feedback

  const paperTitle = submission.paper_title || papers.find((p: Paper) => p.id === submission.paper_id)?.title || '—'
  const className  = classes.find((c: Class) => c.id === submission.class_id)?.name || null

  const attempted   = details.filter(d => d.attempted !== false && ((d.marks_awarded ?? d.scored_marks ?? 0) > 0 || d.student_answer || d.student_answer_text))
  const correct     = details.filter(d => d.is_correct)
  const partial     = details.filter(d => !d.is_correct && (d.marks_awarded ?? d.scored_marks ?? 0) > 0)
  const wrong       = details.filter(d => !d.is_correct && (d.marks_awarded ?? d.scored_marks ?? 0) === 0 && (d.attempted !== false) && (d.student_answer || d.student_answer_text))
  const unattempted = details.filter(d => d.attempted === false || (!d.student_answer && !d.student_answer_text && (d.marks_awarded ?? 0) === 0))

  const toggleQ = (qid: string) => setExpandedQs(prev => {
    const n = new Set(prev); n.has(qid) ? n.delete(qid) : n.add(qid); return n
  })

  return (
    <div className="space-y-6">
      {/* Hero result banner */}
      <div className={`relative overflow-hidden rounded-3xl p-8 text-white shadow-xl ${
        pct >= 80 ? 'bg-gradient-to-br from-emerald-700 to-teal-600' :
        pct >= 60 ? 'bg-gradient-to-br from-blue-700 to-cyan-600'    :
        pct >= 40 ? 'bg-gradient-to-br from-amber-700 to-orange-600' :
                   'bg-gradient-to-br from-red-700 to-rose-600'
      }`}>
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10">
          <button onClick={() => navigate('/grading')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm mb-5 transition-all">
            <ArrowLeft className="w-4 h-4" /> Back to Results
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Grade circle */}
            <div className="shrink-0">
              <GradeCircle percentage={pct} size={120} />
            </div>
            <div className="text-center sm:text-left flex-1">
              <div className={`text-5xl font-black mb-1`}>{gradeLabel(pct)}</div>
              <p className="text-3xl font-bold text-white/90">{score} / {totalMarks}</p>
              <p className="text-white/70 mt-1">{pct}% correct</p>
              {pct >= 90 && <p className="text-amber-300 font-semibold mt-2">🎉 Excellent performance!</p>}
              {pct < 50  && <p className="text-white/80 text-sm mt-2">Keep practicing — improvement takes effort.</p>}

              <div className="flex flex-wrap gap-2 mt-4">
                <StatusBadge status={submission.status} />
                {submission.student_name && (
                  <span className="inline-flex items-center gap-1 text-xs bg-white/20 px-2.5 py-1 rounded-full">
                    <Users className="w-3 h-3" /> {submission.student_name}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-xs bg-white/20 px-2.5 py-1 rounded-full">
                  <FileText className="w-3 h-3" /> {paperTitle}
                </span>
                {className && (
                  <span className="inline-flex items-center gap-1 text-xs bg-white/20 px-2.5 py-1 rounded-full">
                    <BookOpen className="w-3 h-3" /> {className}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-xs bg-white/20 px-2.5 py-1 rounded-full">
                  <Clock className="w-3 h-3" />
                  {formatDate(submission.graded_at ?? submission.created_at ?? submission.submitted_at ?? '')}
                </span>
              </div>
            </div>

            {/* Q-answer summary chips */}
            <div className="grid grid-cols-2 gap-2 shrink-0">
              {[
                { label: 'Correct',     value: correct.length,     color: 'bg-white/20',        icon: CheckCircle  },
                { label: 'Partial',     value: partial.length,     color: 'bg-amber-500/30',    icon: AlertCircle  },
                { label: 'Wrong',       value: wrong.length,       color: 'bg-red-500/30',      icon: XCircle      },
                { label: 'Unattempted', value: unattempted.length, color: 'bg-gray-500/20',     icon: MinusCircle  },
              ].map(({ label, value, color, icon: Icon }) => (
                <div key={label} className={`${color} rounded-xl px-4 py-3 text-center`}>
                  <Icon className="w-5 h-5 mx-auto mb-1 text-white/80" />
                  <p className="text-2xl font-black">{value}</p>
                  <p className="text-[10px] text-white/70 uppercase tracking-wide">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Progress bars */}
      {details.length > 0 && (
        <div className="card p-5 space-y-3">
          <h2 className="section-title flex items-center gap-2"><TrendingUp className="w-4 h-4 text-brand-500" /> Performance Breakdown</h2>
          {[
            { label: 'Correct',     count: correct.length,     color: 'bg-emerald-500' },
            { label: 'Partial',     count: partial.length,     color: 'bg-amber-500'   },
            { label: 'Wrong',       count: wrong.length,       color: 'bg-red-500'     },
            { label: 'Unattempted', count: unattempted.length, color: 'bg-gray-300'    },
          ].map(({ label, count, color }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-xs font-semibold text-brand-600 w-24 shrink-0">{label}</span>
              <div className="flex-1 bg-brand-50 rounded-full h-2.5 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: details.length ? `${(count / details.length) * 100}%` : '0%' }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${color}`} />
              </div>
              <span className="text-xs font-bold text-brand-700 w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* OCR confidence */}
      {submission.ocr_confidence != null && (
        <div className="card p-4 flex items-center gap-4">
          <Sparkles className="w-4 h-4 text-brand-400 shrink-0" />
          <span className="text-sm font-semibold text-brand-700">OCR Confidence</span>
          <div className="flex-1 bg-brand-100 rounded-full h-2.5 overflow-hidden">
            <div className={`h-full rounded-full ${
              (submission.ocr_confidence ?? 0) >= 0.7 ? 'bg-emerald-500' :
              (submission.ocr_confidence ?? 0) >= 0.4 ? 'bg-amber-500' : 'bg-red-500'
            }`} style={{ width: `${Math.round((submission.ocr_confidence ?? 0) * 100)}%` }} />
          </div>
          <span className="text-sm font-bold text-brand-700">{Math.round((submission.ocr_confidence ?? 0) * 100)}%</span>
        </div>
      )}

      {/* AI Feedback */}
      {feedback && (
        <div className="card p-5 border-l-4 border-brand-400 bg-brand-50/40">
          <p className="text-xs font-bold text-brand-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> AI Feedback Summary
          </p>
          <p className="text-sm text-[#1C0A00] leading-relaxed">{feedback}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-brand-100">
        {[
          { key: 'breakdown', label: `Question Breakdown (${details.length})`, icon: BarChart2 },
          { key: 'info',      label: 'Submission Info',                          icon: FileText  },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key as any)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key ? 'border-brand-500 text-brand-700' : 'border-transparent text-brand-500 hover:text-brand-700'
            }`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'breakdown' && (
          <motion.div key="breakdown" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-3">
            {details.length === 0 ? (
              <div className="card p-10 text-center text-brand-400">No question-level data available for this submission.</div>
            ) : details.map((d, i) => {
              const st = statusIcon(d)
              const isEditing = editingQ === d.question_id
              const isExpanded = expandedQs.has(d.question_id ?? String(i))
              const answer = d.student_answer ?? d.student_answer_text
              const comment = d.ai_comment ?? d.ai_feedback
              const marksAwarded = d.marks_awarded ?? d.scored_marks ?? 0
              const maxMarks = d.max_marks ?? d.max_score ?? 1

              return (
                <motion.div key={d.question_id ?? i} layout
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
                  className={`card overflow-hidden border-l-4 ${st.border} ${st.bg}`}>

                  {/* Question header (always visible) */}
                  <button className="w-full flex items-start gap-3 p-4 text-left group"
                    onClick={() => toggleQ(d.question_id ?? String(i))}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 bg-white border ${
                      d.is_correct ? 'border-emerald-200 text-emerald-700' :
                      marksAwarded > 0 ? 'border-amber-200 text-amber-700' : 'border-brand-100 text-brand-600'
                    }`}>{i + 1}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {d.question_type && (
                          <span className="text-[10px] font-bold uppercase bg-white border border-brand-100 px-1.5 py-0.5 rounded text-brand-600">
                            {d.question_type.replace('_', ' ')}
                          </span>
                        )}
                        <span className={`flex items-center gap-1 text-[10px] font-bold ${st.color}`}>
                          <st.icon className="w-3 h-3" /> {st.label}
                        </span>
                        <span className="text-xs text-brand-500 ml-auto font-semibold">
                          {marksAwarded} / {maxMarks} marks
                        </span>
                        {d.confidence != null && (
                          <span className="text-[10px] text-brand-400">AI: {Math.round((d.confidence ?? d.ai_confidence ?? 0) * 100)}%</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-[#1C0A00] line-clamp-2">{d.question_text}</p>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-brand-300 shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-brand-300 shrink-0 mt-1" />}
                  </button>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div key="detail" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-brand-50">
                        <div className="p-4 space-y-3">

                          {/* Student answer */}
                          {answer ? (
                            <div className="bg-white rounded-xl border border-brand-100 p-3">
                              <p className="text-xs font-bold text-brand-600 mb-1.5">Student's Answer</p>
                              <p className="text-sm text-[#1C0A00]">{answer}</p>
                            </div>
                          ) : (
                            <div className="bg-gray-50 rounded-xl border border-gray-200 p-3">
                              <p className="text-xs text-gray-400 italic">No answer detected</p>
                            </div>
                          )}

                          {/* Correct answer */}
                          {d.correct_answer && (
                            <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-3">
                              <p className="text-xs font-bold text-emerald-700 mb-1.5">✓ Correct Answer</p>
                              <p className="text-sm text-emerald-900">{d.correct_answer}</p>
                            </div>
                          )}

                          {/* OCR evidence */}
                          {d.evidence_quote && (
                            <div className="bg-white rounded-xl border border-brand-100 p-3">
                              <p className="text-xs font-bold text-brand-600 mb-1.5">OCR Evidence</p>
                              <p className="text-sm text-[#1C0A00] font-mono">{d.evidence_quote}</p>
                            </div>
                          )}

                          {/* AI comment */}
                          {comment && (
                            <div className="bg-brand-50/60 rounded-xl border border-brand-100 p-3">
                              <p className="text-xs font-bold text-brand-600 mb-1 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> AI Comment
                              </p>
                              <p className="text-xs text-brand-700 italic">{comment}</p>
                            </div>
                          )}

                          {/* Score override */}
                          {isEditing ? (
                            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
                              <label className="text-xs font-medium text-amber-800">Override Score:</label>
                              <input type="number" min={0} max={maxMarks} step={0.5}
                                value={editScore} onChange={e => setEditScore(Number(e.target.value))}
                                className="input w-20 text-sm py-1.5 text-center font-bold" />
                              <span className="text-xs text-amber-700">/ {maxMarks}</span>
                              <input type="text" placeholder="Note (optional)" value={editNote}
                                onChange={e => setEditNote(e.target.value)} className="input flex-1 text-sm py-1.5" />
                              <button onClick={() => overrideMut.mutate({ qId: d.question_id ?? '', score: editScore, note: editNote })}
                                disabled={overrideMut.isPending} className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1">
                                <Save className="w-3 h-3" /> Save
                              </button>
                              <button onClick={() => setEditingQ(null)} className="btn-ghost py-1.5 px-2 text-xs">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => { setEditingQ(d.question_id ?? null); setEditScore(marksAwarded); setEditNote('') }}
                              className="text-xs text-brand-500 hover:text-brand-700 flex items-center gap-1 transition-colors">
                              <Edit3 className="w-3 h-3" /> Override Score
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {activeTab === 'info' && (
          <motion.div key="info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid sm:grid-cols-2 gap-4">
            <div className="card p-5">
              <h2 className="section-title mb-4">Submission Details</h2>
              <dl className="space-y-0 divide-y divide-brand-50">
                {[
                  ['Student',    submission.student_name ?? '—'],
                  ['Paper',      paperTitle],
                  ['Class',      className ?? '—'],
                  ['Score',      `${score} / ${totalMarks} (${pct}%)`],
                  ['Grade',      gradeLabel(pct)],
                  ['Status',     submission.status],
                  ['Mode',       submission.grading_mode ?? '—'],
                  ['Graded At',  formatDate(submission.graded_at ?? submission.created_at ?? '')],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-start gap-4 py-2.5">
                    <dt className="text-xs font-semibold text-brand-500 uppercase tracking-wide w-24 shrink-0 pt-0.5">{k}</dt>
                    <dd className="text-sm font-medium text-[#1C0A00]">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="space-y-4">
              {feedback && (
                <div className="card p-5 border-l-4 border-brand-400">
                  <h3 className="text-xs font-bold text-brand-600 uppercase tracking-wide mb-2">AI Feedback</h3>
                  <p className="text-sm text-[#1C0A00] leading-relaxed">{feedback}</p>
                </div>
              )}
              <div className="card p-5">
                <h3 className="text-xs font-bold text-brand-600 uppercase tracking-wide mb-3">Quick Navigation</h3>
                <div className="space-y-2">
                  <Link to="/grading" className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-800 font-medium py-2 px-3 bg-brand-50 hover:bg-brand-100 rounded-xl transition-colors">
                    <BarChart2 className="w-4 h-4" /> All Grading Results
                  </Link>
                  <Link to="/grading/new" className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-800 font-medium py-2 px-3 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors">
                    <Sparkles className="w-4 h-4" /> Grade Another Sheet
                  </Link>
                  <Link to="/papers" className="flex items-center gap-2 text-sm text-violet-600 hover:text-violet-800 font-medium py-2 px-3 bg-violet-50 hover:bg-violet-100 rounded-xl transition-colors">
                    <FileText className="w-4 h-4" /> Browse Papers
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
