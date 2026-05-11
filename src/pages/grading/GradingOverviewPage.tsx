import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, CheckSquare, Eye, AlertCircle, TrendingUp, Search,
  Users, BookOpen, Filter, Clock, CheckCircle2, XCircle,
  BarChart2, FileText, ChevronRight, Scan, Layers,
} from 'lucide-react'
import GradeCircle from '@/components/shared/GradeCircle'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { listSubmissions } from '@/lib/api/grading'
import { listClasses } from '@/lib/api/classes'
import { listPapers } from '@/lib/api/papers'
import { formatDate, gradeLabel, gradeColor } from '@/lib/utils'
import type { Submission, Class, Paper } from '@/types'

const STATUS_CONFIG = {
  graded:  { label: 'Graded',  color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200',       dot: 'bg-amber-500'   },
  review:  { label: 'Review',  color: 'bg-violet-100 text-violet-700 border-violet-200',    dot: 'bg-violet-500'  },
}

export default function GradingOverviewPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [statusFilter, setStatusFilter] = useState<'all' | 'graded' | 'pending' | 'review'>('all')
  const [classFilter,  setClassFilter]  = useState(searchParams.get('class_id') ?? '')
  const [paperFilter,  setPaperFilter]  = useState(searchParams.get('paper_id') ?? '')
  const [search,       setSearch]       = useState('')

  const { data: submissions = [], isLoading } = useQuery<Submission[]>({
    queryKey: ['submissions'],
    queryFn: () => listSubmissions(),
  })
  const { data: classes = [] } = useQuery<Class[]>({ queryKey: ['classes'], queryFn: () => listClasses() })
  const { data: papers  = [] } = useQuery<Paper[]>({ queryKey: ['papers'],  queryFn: () => listPapers()  })

  const paperMap = useMemo(() => Object.fromEntries(papers.map(p => [p.id, p.title])), [papers])
  const classMap = useMemo(() => Object.fromEntries(classes.map(c => [c.id, c.name])), [classes])

  const getPaperTitle = (s: Submission) => s.paper_title || paperMap[s.paper_id] || '—'
  const getClassName  = (s: Submission) => classMap[s.class_id ?? ''] || null
  const getPct = (s: Submission) =>
    s.grade_percentage ?? (s.max_score ? Math.round(((s.total_score ?? 0) / s.max_score) * 100) : 0)

  const graded  = submissions.filter(s => s.status === 'graded')
  const pending = submissions.filter(s => s.status === 'pending')
  const review  = submissions.filter(s => s.status === 'review')
  const avgScore = graded.length
    ? Math.round(graded.reduce((a, s) => a + getPct(s), 0) / graded.length)
    : 0
  const highScore = graded.length ? Math.max(...graded.map(getPct)) : 0

  const filtered = useMemo(() => submissions.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    if (classFilter && s.class_id !== classFilter) return false
    if (paperFilter && s.paper_id !== paperFilter) return false
    if (search) {
      const term = search.toLowerCase()
      return (s.student_name || '').toLowerCase().includes(term) ||
             getPaperTitle(s).toLowerCase().includes(term)
    }
    return true
  }), [submissions, statusFilter, classFilter, paperFilter, search, paperMap])

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1C0A00] to-brand-900 rounded-3xl p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-emerald-500/10 translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/30 flex items-center justify-center">
                <CheckSquare className="w-4 h-4 text-emerald-200" />
              </div>
              <span className="text-emerald-300 text-sm font-medium">Grading Center</span>
            </div>
            <h1 className="text-3xl font-bold mb-1">Answer Sheet Grading</h1>
            <p className="text-white/60 text-sm max-w-lg">AI-powered OCR grading — upload scanned sheets and get instant results with per-question feedback.</p>
            <div className="flex items-center gap-4 mt-5">
              {[
                { label: 'Total',   value: submissions.length, color: 'bg-white/15' },
                { label: 'Graded',  value: graded.length,      color: 'bg-emerald-500/30' },
                { label: 'Pending', value: pending.length,     color: 'bg-amber-500/25' },
                { label: 'Avg %',   value: `${avgScore}%`,     color: 'bg-white/10' },
              ].map(({ label, value, color }) => (
                <div key={label} className={`${color} rounded-xl px-4 py-2 text-center`}>
                  <p className="text-xl font-bold">{value}</p>
                  <p className="text-[10px] text-white/60 uppercase tracking-wide">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
            <Link to="/grading/new"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_0_24px_rgba(16,185,129,0.4)] transition-all text-sm font-bold">
              <Scan className="w-4 h-4" /> Grade New Sheets
            </Link>
            <Link to="/papers"
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium border border-white/10 transition-all">
              <FileText className="w-4 h-4" /> Browse Papers
            </Link>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      {submissions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Submissions', value: submissions.length, icon: Layers,      grad: 'from-brand-500 to-orange-400'   },
            { label: 'Graded',           value: graded.length,      icon: CheckCircle2, grad: 'from-emerald-500 to-teal-400'   },
            { label: 'Pending Review',   value: pending.length + review.length, icon: AlertCircle, grad: 'from-amber-500 to-yellow-400' },
            { label: 'Average Score',    value: `${avgScore}%`,     icon: TrendingUp,  grad: 'from-blue-500 to-cyan-400'      },
          ].map(({ label, value, icon: Icon, grad }) => (
            <motion.div key={label} whileHover={{ y: -2 } as any} className="card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-[#1C0A00] leading-none">{value}</p>
                <p className="text-xs text-brand-500 mt-0.5 font-medium">{label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Grade distribution bar */}
      {graded.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title flex items-center gap-2"><BarChart2 className="w-4 h-4 text-brand-500" /> Score Distribution</h2>
            <span className="text-xs text-brand-400">Highest: <strong className="text-[#1C0A00]">{highScore}%</strong></span>
          </div>
          <div className="flex gap-1.5 h-10 items-end">
            {['0-20','21-40','41-60','61-80','81-100'].map(range => {
              const [lo, hi] = range.split('-').map(Number)
              const count = graded.filter(s => { const p = getPct(s); return p >= lo && p <= hi }).length
              const pct = graded.length ? (count / graded.length) * 100 : 0
              const color = lo >= 81 ? 'bg-emerald-500' : lo >= 61 ? 'bg-blue-500' : lo >= 41 ? 'bg-amber-500' : lo >= 21 ? 'bg-orange-500' : 'bg-red-500'
              return (
                <div key={range} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-brand-400 font-medium">{count}</span>
                  <div className={`w-full ${color} rounded-t-md transition-all`} style={{ height: `${Math.max(pct, 4)}%` }} />
                  <span className="text-[9px] text-brand-400">{range}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      {submissions.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search student or paper…" className="input pl-9 text-sm w-full" />
          </div>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400 pointer-events-none" />
            <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
              className="input pl-9 text-sm appearance-none pr-8 min-w-[150px]">
              <option value="">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="relative">
            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400 pointer-events-none" />
            <select value={paperFilter} onChange={e => setPaperFilter(e.target.value)}
              className="input pl-9 text-sm appearance-none pr-8 min-w-[160px]">
              <option value="">All Papers</option>
              {papers.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1 bg-brand-50 p-1 rounded-lg">
            {(['all', 'graded', 'pending', 'review'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${
                  statusFilter === s ? 'bg-white shadow-sm text-brand-700' : 'text-brand-500 hover:text-brand-700'
                }`}>{s}</button>
            ))}
          </div>
          <span className="text-xs text-brand-400 ml-auto">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Main content */}
      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : submissions.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckSquare className="w-10 h-10 text-emerald-300" />
          </div>
          <h2 className="text-xl font-bold text-[#1C0A00] mb-2">No graded submissions yet</h2>
          <p className="text-brand-500 max-w-sm mx-auto mb-6">Upload scanned answer sheets to start AI-powered grading. Results appear here instantly.</p>
          <Link to="/grading/new" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Start Grading
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Search className="w-10 h-10 text-brand-200 mx-auto mb-3" />
          <p className="font-semibold text-[#1C0A00] mb-1">No submissions match</p>
          <button onClick={() => { setSearch(''); setClassFilter(''); setPaperFilter(''); setStatusFilter('all') }}
            className="btn-ghost text-sm mt-2">Clear filters</button>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((s, i) => {
              const pct = getPct(s)
              const paperTitle = getPaperTitle(s)
              const className  = getClassName(s)
              const sc = STATUS_CONFIG[s.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending
              const details = s.grading_details ?? s.question_details ?? []
              const correct = details.filter((d: any) => d.is_correct).length

              return (
                <motion.div key={s.id} layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
                  exit={{ opacity: 0 }}
                  className="card group hover:shadow-md hover:border-brand-300 transition-all overflow-hidden cursor-pointer"
                  onClick={() => navigate(`/grading/${s.id}`)}
                >
                  {/* Accent bar keyed to grade */}
                  <div className={`h-1 w-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-blue-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} />

                  <div className="flex items-center gap-4 p-4">
                    {/* Grade circle */}
                    <div className="shrink-0">
                      <GradeCircle percentage={pct} size={56} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-bold text-sm text-[#1C0A00]">
                          {s.student_name || 'Unknown Student'}
                        </p>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-brand-500">
                        <span className="flex items-center gap-1 font-medium text-brand-700">
                          <FileText className="w-3 h-3" /> {paperTitle}
                        </span>
                        {className && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {className}
                          </span>
                        )}
                        {details.length > 0 && (
                          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                            <CheckCircle2 className="w-3 h-3" /> {correct}/{details.length} correct
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-brand-400">
                          <Clock className="w-3 h-3" />
                          {formatDate(s.graded_at ?? s.created_at ?? s.submitted_at ?? '')}
                        </span>
                      </div>
                    </div>

                    {/* Score + arrow */}
                    <div className="shrink-0 flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className={`text-2xl font-black tabular-nums ${gradeColor(pct)}`}>{gradeLabel(pct)}</p>
                        <p className="text-xs text-brand-400">{s.total_score ?? s.score ?? 0}/{s.max_score ?? s.total_marks ?? 0}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-brand-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
