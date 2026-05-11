import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowLeft, Download, Globe, Edit3, Trash2, Clock, CheckSquare,
  Key, BookOpen, BarChart2, FileText, ChevronDown, ChevronUp,
  CheckCircle2, AlertCircle, Sparkles, Users, Layers,
} from 'lucide-react'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { getPaper, publishPaper, deletePaper, exportPaperPDF, exportAnswerKey } from '@/lib/api/papers'
import { listSubjects } from '@/lib/api/subjects'
import { listClasses } from '@/lib/api/classes'
import { formatDate } from '@/lib/utils'
import type { Subject, Class } from '@/types'

const Q_TYPE_LABELS: Record<string, string> = {
  mcq: 'MCQ', short_answer: 'Short Answer', long_answer: 'Long Answer',
  true_false: 'True / False', fill_blank: 'Fill in the Blank',
}
const DIFF_COLORS: Record<string, string> = {
  easy:   'bg-emerald-100 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-100   text-amber-700   border-amber-200',
  hard:   'bg-red-100     text-red-700     border-red-200',
  mixed:  'bg-violet-100  text-violet-700  border-violet-200',
}
const TYPE_COLORS: Record<string, string> = {
  mcq:          'bg-blue-100   text-blue-700   border-blue-200',
  short_answer: 'bg-amber-100  text-amber-700  border-amber-200',
  long_answer:  'bg-violet-100 text-violet-700 border-violet-200',
  true_false:   'bg-teal-100   text-teal-700   border-teal-200',
  fill_blank:   'bg-rose-100   text-rose-700   border-rose-200',
}

export default function PaperDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [expandedQ, setExpandedQ] = useState<Set<string>>(new Set())
  const [showAnswerKey, setShowAnswerKey] = useState(false)
  const [activeTab, setActiveTab] = useState<'questions' | 'info'>('questions')

  const { data: paper, isLoading } = useQuery({ queryKey: ['paper', id], queryFn: () => getPaper(id!) })
  const { data: subjects = [] } = useQuery<Subject[]>({ queryKey: ['subjects'], queryFn: () => listSubjects() })
  const { data: classes  = [] } = useQuery<Class[]>({ queryKey: ['classes'],  queryFn: () => listClasses()  })

  const publishMut = useMutation({
    mutationFn: () => publishPaper(id!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['paper', id] }); toast.success('Paper published!') },
  })
  const deleteMut = useMutation({
    mutationFn: () => deletePaper(id!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['papers'] }); toast.success('Deleted'); navigate('/papers') },
  })

  const onExport = async () => {
    try {
      const blob = await exportPaperPDF(id!, paper?.template)
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob); a.download = `${paper?.title ?? 'paper'}.pdf`; a.click()
      toast.success('PDF exported')
    } catch { toast.error('Export failed') }
  }
  const onDownloadKey = async () => {
    try {
      const blob = await exportAnswerKey(id!, 'pdf')
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob); a.download = `${paper?.title ?? 'paper'}_answer_key.pdf`; a.click()
    } catch { toast.error('Key download failed') }
  }

  const toggleQ = (qid: string) => setExpandedQ(prev => {
    const next = new Set(prev)
    next.has(qid) ? next.delete(qid) : next.add(qid)
    return next
  })

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  if (!paper) return <div className="py-20 text-center text-brand-500">Paper not found</div>

  const subjectName = paper.subject_name || subjects.find((s: Subject) => s.id === paper.subject_id)?.name || null
  const className   = classes.find((c: Class) => c.id === paper.class_id)?.name || null
  const questions   = paper.questions ?? []
  const qTypeBreakdown = questions.reduce<Record<string, number>>((acc, q) => {
    acc[q.question_type] = (acc[q.question_type] || 0) + 1; return acc
  }, {})
  const diffBreakdown = questions.reduce<Record<string, number>>((acc, q) => {
    const d = q.difficulty ?? 'medium'; acc[d] = (acc[d] || 0) + 1; return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1C0A00] to-brand-900 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10">
          {/* Back + actions */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <button onClick={() => navigate('/papers')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-sm transition-all">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <Link to={`/papers/${id}/edit`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-sm transition-all">
              <Edit3 className="w-4 h-4" /> Edit
            </Link>
            <button onClick={onExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-sm transition-all">
              <Download className="w-4 h-4" /> PDF
            </button>
            <button onClick={onDownloadKey}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-sm transition-all">
              <Key className="w-4 h-4" /> Answer Key
            </button>
            <Link to={`/grading/new?paper_id=${id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/30 hover:bg-emerald-500/50 text-white text-sm border border-emerald-500/40 transition-all">
              <CheckSquare className="w-4 h-4" /> Grade
            </Link>
            {!paper.is_published && (
              <button onClick={() => publishMut.mutate()} disabled={publishMut.isPending}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 text-white text-sm font-bold shadow-lg transition-all ml-auto">
                <Globe className="w-4 h-4" /> Publish
              </button>
            )}
            <button onClick={() => window.confirm('Delete this paper?') && deleteMut.mutate()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/25 hover:bg-red-500/40 text-white text-sm border border-red-500/30 transition-all">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>

          {/* Title */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/40 flex items-center justify-center flex-shrink-0 shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{paper.title}</h1>
              {paper.description && <p className="text-white/70 text-sm mt-1 max-w-2xl">{paper.description}</p>}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {paper.is_published
                  ? <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-500/30 border border-emerald-500/40 px-2.5 py-1 rounded-full"><CheckCircle2 className="w-3 h-3" /> Published</span>
                  : <span className="inline-flex items-center gap-1 text-xs font-bold bg-white/15 border border-white/20 px-2.5 py-1 rounded-full"><AlertCircle className="w-3 h-3" /> Draft</span>}
                {subjectName && (
                  <span className="inline-flex items-center gap-1 text-xs bg-white/15 border border-white/20 px-2.5 py-1 rounded-full">
                    <BookOpen className="w-3 h-3" /> {subjectName}
                  </span>
                )}
                {className && (
                  <span className="inline-flex items-center gap-1 text-xs bg-white/15 border border-white/20 px-2.5 py-1 rounded-full">
                    <Users className="w-3 h-3" /> {className}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Questions',   value: questions.length,          icon: FileText,   color: 'bg-brand-100 text-brand-600'   },
          { label: 'Total Marks', value: paper.total_marks,         icon: BarChart2,  color: 'bg-violet-100 text-violet-600' },
          { label: 'Duration',    value: paper.duration_minutes ? `${paper.duration_minutes} min` : paper.duration ?? '—',
                                                                    icon: Clock,      color: 'bg-amber-100 text-amber-600'   },
          { label: 'Difficulty',  value: paper.difficulty_level,    icon: Layers,     color: 'bg-blue-100 text-blue-600'     },
        ].map(({ label, value, icon: Icon, color }) => (
          <motion.div key={label} whileHover={{ y: -2 } as any} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} flex-shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#1C0A00] leading-none">{value}</p>
              <p className="text-xs text-brand-500 mt-0.5">{label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-brand-100">
        {(['questions', 'info'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === t ? 'border-brand-500 text-brand-700' : 'border-transparent text-brand-500 hover:text-brand-700'
            }`}>
            {t === 'questions' ? <FileText className="w-4 h-4" /> : <BarChart2 className="w-4 h-4" />}
            {t === 'questions' ? `Questions (${questions.length})` : 'Paper Info'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'questions' && (
          <motion.div key="questions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Type breakdown */}
            <div className="flex flex-wrap gap-2 items-center">
              {Object.entries(qTypeBreakdown).map(([type, count]) => (
                <span key={type} className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${TYPE_COLORS[type] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  {Q_TYPE_LABELS[type] ?? type} × {count}
                </span>
              ))}
              {Object.entries(diffBreakdown).map(([d, count]) => (
                <span key={d} className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${DIFF_COLORS[d] || DIFF_COLORS.medium}`}>
                  {d} × {count}
                </span>
              ))}
              <button onClick={() => setShowAnswerKey(!showAnswerKey)}
                className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg border border-brand-200 transition-all">
                <Key className="w-3.5 h-3.5" /> {showAnswerKey ? 'Hide' : 'Show'} Answer Key
              </button>
            </div>

            {questions.map((q, i) => {
              const expanded = expandedQ.has(q.id)
              const diff = q.difficulty ?? 'medium'
              return (
                <motion.div key={q.id} layout
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
                  className="card overflow-hidden"
                >
                  <button className="w-full flex items-start gap-3 p-5 text-left hover:bg-brand-25 transition-colors group"
                    onClick={() => toggleQ(q.id)}>
                    <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-orange-400 text-white text-xs font-bold shrink-0 shadow-sm">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${TYPE_COLORS[q.question_type] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {Q_TYPE_LABELS[q.question_type] ?? q.question_type}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${DIFF_COLORS[diff]}`}>{diff}</span>
                        <span className="text-xs text-brand-500 ml-auto font-semibold">
                          {q.marks ?? (q as any).max_score ?? 5} mark{(q.marks ?? 5) !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-[#1C0A00] leading-relaxed">{q.question_text}</p>
                    </div>
                    {expanded ? <ChevronUp className="w-4 h-4 text-brand-400 shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-brand-400 shrink-0 mt-1" />}
                  </button>

                  <AnimatePresence>
                    {expanded && (
                      <motion.div key="body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="px-5 pb-5 space-y-3 border-t border-brand-50 pt-4">
                          {/* MCQ options */}
                          {q.question_type === 'mcq' && q.options && (
                            <div className="space-y-1.5">
                              {(q.options as string[]).map((opt, oi) => (
                                <div key={oi}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${
                                    opt === q.correct_answer
                                      ? 'bg-emerald-50 border-emerald-200 font-semibold text-emerald-800'
                                      : 'border-brand-100 text-brand-700'
                                  }`}>
                                  <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold shrink-0">
                                    {String.fromCharCode(65 + oi)}
                                  </span>
                                  {opt}
                                  {opt === q.correct_answer && <CheckCircle2 className="w-4 h-4 ml-auto text-emerald-500" />}
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Answer / key */}
                          {(showAnswerKey || q.question_type !== 'mcq') && q.correct_answer && (
                            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                              <p className="text-xs font-bold text-emerald-700 mb-1">✓ Model Answer</p>
                              <p className="text-sm text-emerald-800">{q.correct_answer}</p>
                            </div>
                          )}
                          {q.explanation && (
                            <p className="text-xs text-brand-500 italic border-l-2 border-brand-200 pl-3">{q.explanation}</p>
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
          <motion.div key="info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid sm:grid-cols-2 gap-4">
            <div className="card p-5">
              <h2 className="section-title mb-4">Paper Details</h2>
              <dl className="space-y-0 divide-y divide-brand-50">
                {[
                  ['Title',        paper.title],
                  ['Subject',      subjectName ?? '—'],
                  ['Class',        className ?? '—'],
                  ['Difficulty',   paper.difficulty_level],
                  ['Total Marks',  String(paper.total_marks)],
                  ['Duration',     paper.duration_minutes ? `${paper.duration_minutes} min` : paper.duration ?? '—'],
                  ['Questions',    String(questions.length)],
                  ['Status',       paper.is_published ? 'Published' : 'Draft'],
                  ['Created',      formatDate(paper.created_at)],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-start gap-4 py-2.5">
                    <dt className="text-xs font-semibold text-brand-500 uppercase tracking-wide w-28 shrink-0 pt-0.5">{k}</dt>
                    <dd className="text-sm font-medium text-[#1C0A00]">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="space-y-4">
              {paper.instructions && (
                <div className="card p-5 border-l-4 border-brand-400">
                  <h3 className="text-xs font-bold text-brand-600 uppercase tracking-wide mb-2">Instructions</h3>
                  <p className="text-sm text-[#1C0A00] leading-relaxed">{paper.instructions}</p>
                </div>
              )}
              {paper.institution_name && (
                <div className="card p-5">
                  <h3 className="text-xs font-bold text-brand-600 uppercase tracking-wide mb-3">Institution Info</h3>
                  <dl className="space-y-2">
                    {[
                      ['Institution', paper.institution_name],
                      ['Course',      paper.course_name ?? '—'],
                      ['Teacher',     paper.teacher_name ?? '—'],
                      ['Exam Date',   paper.exam_date ?? '—'],
                    ].map(([k, v]) => (
                      <div key={k} className="flex gap-3 text-sm">
                        <span className="text-brand-500 font-semibold w-24 shrink-0">{k}</span>
                        <span className="text-[#1C0A00]">{v}</span>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
              {/* Quick actions */}
              <div className="card p-5">
                <h3 className="text-xs font-bold text-brand-600 uppercase tracking-wide mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Export PDF',     icon: Download,    action: onExport,        color: 'bg-violet-50 text-violet-600 hover:bg-violet-100 border-violet-100' },
                    { label: 'Answer Key PDF', icon: Key,         action: onDownloadKey,   color: 'bg-amber-50  text-amber-600  hover:bg-amber-100  border-amber-100'  },
                    { label: 'Grade Papers',   icon: CheckSquare, action: () => navigate(`/grading/new?paper_id=${id}`), color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100' },
                    { label: 'Edit Paper',     icon: Edit3,       action: () => navigate(`/papers/${id}/edit`), color: 'bg-brand-50 text-brand-600 hover:bg-brand-100 border-brand-100' },
                  ].map(({ label, icon: Icon, action, color }) => (
                    <button key={label} onClick={action}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${color}`}>
                      <Icon className="w-4 h-4" /> {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
