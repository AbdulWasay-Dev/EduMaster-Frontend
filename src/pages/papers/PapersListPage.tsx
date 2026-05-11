import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, ScrollText, Download, Trash2, Eye, Edit3, CheckSquare,
  Search, BookOpen, Clock, BarChart2, Sparkles, Globe, FileText,
  ChevronRight, Layers, Filter, CheckCircle2, PenLine,
} from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { listPapers, deletePaper, exportPaperPDF } from '@/lib/api/papers'
import { listSubjects } from '@/lib/api/subjects'
import { listClasses } from '@/lib/api/classes'
import { formatDate } from '@/lib/utils'
import type { Paper, Subject, Class } from '@/types'

const DIFFICULTY_COLORS: Record<string, string> = {
  easy:   'bg-emerald-100 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  hard:   'bg-red-100 text-red-700 border-red-200',
  mixed:  'bg-violet-100 text-violet-700 border-violet-200',
}

const CARD_GRADIENTS = [
  'from-brand-500 to-orange-400',
  'from-violet-500 to-purple-400',
  'from-blue-500 to-cyan-400',
  'from-emerald-500 to-teal-400',
  'from-rose-500 to-pink-400',
  'from-amber-500 to-yellow-400',
]
const cardGradient = (title: string) =>
  CARD_GRADIENTS[title.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % CARD_GRADIENTS.length]

export default function PapersListPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState(searchParams.get('subject_id') ?? '')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const { data: papers = [], isLoading } = useQuery<Paper[]>({ queryKey: ['papers'], queryFn: () => listPapers() })
  const { data: subjects = [] } = useQuery<Subject[]>({ queryKey: ['subjects'], queryFn: () => listSubjects() })
  const { data: classes = [] } = useQuery<Class[]>({ queryKey: ['classes'], queryFn: () => listClasses() })

  const subjectMap = useMemo(() => Object.fromEntries(subjects.map(s => [s.id, s.name])), [subjects])
  const classMap   = useMemo(() => Object.fromEntries(classes.map(c => [c.id, c.name])), [classes])

  const getSubjectName = (p: Paper) => p.subject_name || subjectMap[p.subject_id] || null
  const getClassName   = (p: Paper) => classMap[p.class_id ?? ''] || null

  const deleteMut = useMutation({
    mutationFn: deletePaper,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['papers'] }); toast.success('Paper deleted') },
    onError: () => toast.error('Failed to delete paper'),
  })

  const onExport = async (id: string, title: string) => {
    try {
      const blob = await exportPaperPDF(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `${title}.pdf`; a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF downloaded')
    } catch { toast.error('Export failed') }
  }

  const filtered = useMemo(() => papers.filter(p => {
    if (subjectFilter && p.subject_id !== subjectFilter) return false
    if (statusFilter === 'published' && !p.is_published) return false
    if (statusFilter === 'draft' && p.is_published) return false
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) &&
        !(getSubjectName(p) ?? '').toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [papers, subjectFilter, statusFilter, search, subjectMap])

  const publishedCount = papers.filter(p => p.is_published).length
  const draftCount = papers.filter(p => !p.is_published).length
  const totalQuestions = papers.reduce((a, p) => a + (p.questions?.length ?? 0), 0)
  const totalMarks = papers.reduce((a, p) => a + (p.total_marks ?? 0), 0)

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1C0A00] to-brand-900 rounded-3xl p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-brand-500/20 translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-brand-500/30 flex items-center justify-center">
                <ScrollText className="w-4 h-4 text-brand-200" />
              </div>
              <span className="text-brand-300 text-sm font-medium">Exam Papers</span>
            </div>
            <h1 className="text-3xl font-bold mb-1">Paper Library</h1>
            <p className="text-brand-100/70 text-sm max-w-lg">AI-generated exam papers ready to print, grade, and distribute to students.</p>
            <div className="flex items-center gap-4 mt-5">
              {[
                { label: 'Total',     value: papers.length,   color: 'bg-white/15' },
                { label: 'Published', value: publishedCount,  color: 'bg-emerald-500/30' },
                { label: 'Draft',     value: draftCount,      color: 'bg-white/10' },
                { label: 'Questions', value: totalQuestions,  color: 'bg-violet-500/25' },
              ].map(({ label, value, color }) => (
                <div key={label} className={`${color} rounded-xl px-4 py-2 text-center`}>
                  <p className="text-xl font-bold">{value}</p>
                  <p className="text-[10px] text-white/60 uppercase tracking-wide">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/papers/generate"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-white shadow-[0_0_24px_rgba(249,115,22,0.4)] transition-all text-sm font-bold">
              <Sparkles className="w-4 h-4" /> Generate Paper
            </Link>
          </div>
        </div>
      </div>

      {/* Stats row */}
      {papers.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Papers',  value: papers.length,    icon: ScrollText, grad: 'from-brand-500 to-orange-400'   },
            { label: 'Published',     value: publishedCount,   icon: Globe,      grad: 'from-emerald-500 to-teal-400'   },
            { label: 'Total Questions', value: totalQuestions, icon: FileText,   grad: 'from-violet-500 to-purple-400'  },
            { label: 'Total Marks',   value: totalMarks,       icon: BarChart2,  grad: 'from-blue-500 to-cyan-400'      },
          ].map(({ label, value, icon: Icon, grad }) => (
            <div key={label} className="card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-[#1C0A00] leading-none">{value}</p>
                <p className="text-xs text-brand-500 mt-0.5 font-medium">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters + search */}
      {papers.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search papers or subjects…" className="input pl-9 text-sm w-full" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400 pointer-events-none" />
            <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}
              className="input pl-9 text-sm appearance-none pr-8 min-w-[160px]">
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1 bg-brand-50 p-1 rounded-lg">
            {(['all', 'published', 'draft'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${
                  statusFilter === s ? 'bg-white shadow-sm text-brand-700' : 'text-brand-500 hover:text-brand-700'
                }`}>{s}</button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-brand-50 p-1 rounded-lg">
            {(['grid', 'list'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`p-1.5 rounded-md text-xs transition-all ${view === v ? 'bg-white shadow-sm' : ''}`}>
                {v === 'grid' ? <Layers className="w-4 h-4 text-brand-600" /> : <FileText className="w-4 h-4 text-brand-600" />}
              </button>
            ))}
          </div>
          <span className="text-xs text-brand-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : papers.length === 0 ? (
        <EmptyState icon={ScrollText} title="No papers yet"
          description="Generate your first AI-powered exam paper from your uploaded study materials."
          action={<Link to="/papers/generate" className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Generate Paper</Link>}
        />
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Search className="w-10 h-10 text-brand-200 mx-auto mb-3" />
          <p className="font-semibold text-[#1C0A00] mb-1">No papers match</p>
          <button onClick={() => { setSearch(''); setSubjectFilter(''); setStatusFilter('all') }}
            className="btn-ghost text-sm mt-2">Clear filters</button>
        </div>
      ) : view === 'list' ? (
        /* ── List view ── */
        <div className="card overflow-hidden divide-y divide-brand-50">
          <div className="grid grid-cols-12 gap-3 px-4 py-2 bg-brand-50 text-xs font-semibold text-brand-500 uppercase tracking-wide">
            <div className="col-span-4">Paper</div>
            <div className="col-span-2">Subject</div>
            <div className="col-span-1">Q's</div>
            <div className="col-span-1">Marks</div>
            <div className="col-span-1">Difficulty</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1">Created</div>
            <div className="col-span-1"></div>
          </div>
          <AnimatePresence>
            {filtered.map(p => {
              const subName = getSubjectName(p)
              const diff = p.difficulty_level || 'medium'
              return (
                <motion.div key={p.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-brand-25 group transition-colors">
                  <div className="col-span-4 min-w-0">
                    <Link to={`/papers/${p.id}`} className="font-semibold text-sm text-[#1C0A00] hover:text-brand-500 transition-colors truncate block">
                      {p.title}
                    </Link>
                    {getClassName(p) && <p className="text-xs text-brand-400 truncate">{getClassName(p)}</p>}
                  </div>
                  <div className="col-span-2">
                    {subName ? (
                      <span className="inline-flex items-center gap-1 text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full font-medium truncate max-w-full">
                        <BookOpen className="w-3 h-3 flex-shrink-0" /><span className="truncate">{subName}</span>
                      </span>
                    ) : <span className="text-brand-300 text-xs">—</span>}
                  </div>
                  <div className="col-span-1 text-sm font-bold text-[#1C0A00]">{p.questions?.length ?? 0}</div>
                  <div className="col-span-1 text-sm font-bold text-[#1C0A00]">{p.total_marks}</div>
                  <div className="col-span-1">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${DIFFICULTY_COLORS[diff] || DIFFICULTY_COLORS.medium}`}>{diff}</span>
                  </div>
                  <div className="col-span-1">
                    {p.is_published
                      ? <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">Published</span>
                      : <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">Draft</span>}
                  </div>
                  <div className="col-span-1 text-xs text-brand-400">{formatDate(p.created_at)}</div>
                  <div className="col-span-1 flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link to={`/papers/${p.id}`} title="View" className="p-1.5 rounded hover:bg-brand-100 text-brand-500 transition-colors"><Eye className="w-3.5 h-3.5" /></Link>
                    <Link to={`/papers/${p.id}/edit`} title="Edit" className="p-1.5 rounded hover:bg-brand-100 text-brand-500 transition-colors"><Edit3 className="w-3.5 h-3.5" /></Link>
                    <button onClick={() => onExport(p.id, p.title)} title="Export PDF" className="p-1.5 rounded hover:bg-green-50 text-green-600 transition-colors"><Download className="w-3.5 h-3.5" /></button>
                    <button onClick={() => window.confirm(`Delete "${p.title}"?`) && deleteMut.mutate(p.id)} title="Delete" className="p-1.5 rounded hover:bg-red-50 text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      ) : (
        /* ── Grid view ── */
        <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {filtered.map((p, i) => {
              const subName = getSubjectName(p)
              const className = getClassName(p)
              const grad = cardGradient(p.title)
              const diff = p.difficulty_level || 'medium'
              const qCount = p.questions?.length ?? 0
              const typeBreakdown = (p.questions ?? []).reduce<Record<string, number>>((acc, q) => {
                acc[q.question_type] = (acc[q.question_type] || 0) + 1
                return acc
              }, {})

              return (
                <motion.div key={p.id} layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
                  whileHover={{ y: -5, boxShadow: '0 20px 48px -8px rgba(28,10,0,0.18)' } as any}
                  transition={{ duration: 0.2 }}
                  className="card overflow-hidden cursor-pointer group"
                  onClick={() => navigate(`/papers/${p.id}`)}
                  role="link" tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter') navigate(`/papers/${p.id}`) }}
                >
                  {/* Gradient header */}
                  <div className={`h-2 w-full bg-gradient-to-r ${grad}`} />
                  <div className="p-5">

                    {/* Title row */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-md flex-shrink-0`}>
                          <ScrollText className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-[#1C0A00] text-sm leading-snug line-clamp-2 group-hover:text-brand-600 transition-colors">{p.title}</h3>
                          {p.is_published
                            ? <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full border border-emerald-200 mt-0.5"><CheckCircle2 className="w-2.5 h-2.5" /> Published</span>
                            : <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-full border border-slate-200 mt-0.5"><PenLine className="w-2.5 h-2.5" /> Draft</span>}
                        </div>
                      </div>
                      {/* Stopgap actions (stop propagation) */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e => e.stopPropagation()}>
                        <Link to={`/papers/${p.id}/edit`} title="Edit" className="p-1.5 rounded-lg hover:bg-brand-100 text-brand-400 transition-colors"><Edit3 className="w-3.5 h-3.5" /></Link>
                        <button onClick={() => window.confirm(`Delete "${p.title}"?`) && deleteMut.mutate(p.id)} title="Delete" className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>

                    {/* Subject + class tags */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {subName && (
                        <span className="inline-flex items-center gap-1 text-xs text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-100 font-medium max-w-full">
                          <BookOpen className="w-3 h-3 text-brand-400 flex-shrink-0" />
                          <span className="truncate">{subName}</span>
                        </span>
                      )}
                      {className && (
                        <span className="inline-flex items-center gap-1 text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 font-medium max-w-full">
                          <span className="truncate">🎓 {className}</span>
                        </span>
                      )}
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[
                        { label: 'Questions', value: qCount },
                        { label: 'Marks',     value: p.total_marks },
                        { label: p.duration_minutes ? 'Mins' : 'Difficulty', value: p.duration_minutes ?? diff },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-brand-50 rounded-xl p-2 text-center">
                          <p className="text-sm font-bold text-[#1C0A00]">{value}</p>
                          <p className="text-[10px] text-brand-400 uppercase tracking-wide">{label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Question type breakdown */}
                    {Object.keys(typeBreakdown).length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {Object.entries(typeBreakdown).map(([type, count]) => (
                          <span key={type} className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                            {type.replace('_', ' ')} ×{count}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Difficulty + date */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${DIFFICULTY_COLORS[diff] || DIFFICULTY_COLORS.medium}`}>{diff}</span>
                      <span className="text-[10px] text-brand-400 flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(p.created_at)}</span>
                    </div>

                    {/* Quick actions */}
                    <div className="grid grid-cols-3 gap-1.5" onClick={e => e.stopPropagation()}>
                      <Link to={`/papers/${p.id}`}
                        className="flex flex-col items-center gap-0.5 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-600 transition-all text-center">
                        <Eye className="w-4 h-4" /><span className="text-[10px] font-semibold">View</span>
                      </Link>
                      <Link to={`/grading/new?paper_id=${p.id}`}
                        className="flex flex-col items-center gap-0.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-all text-center">
                        <CheckSquare className="w-4 h-4" /><span className="text-[10px] font-semibold">Grade</span>
                      </Link>
                      <button onClick={() => onExport(p.id, p.title)}
                        className="flex flex-col items-center gap-0.5 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-600 transition-all text-center">
                        <Download className="w-4 h-4" /><span className="text-[10px] font-semibold">PDF</span>
                      </button>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-brand-50">
                      <span className="text-[11px] text-brand-300">Click to open</span>
                      <span className="flex items-center gap-1 text-xs font-semibold text-brand-400 group-hover:text-brand-600 transition-colors">
                        Open <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* New paper tile */}
          <Link to="/papers/generate">
            <div className="card p-5 flex flex-col items-center justify-center gap-3 cursor-pointer border-dashed border-2 border-brand-200 hover:border-brand-400 hover:bg-brand-50 transition-all group min-h-[280px]">
              <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center group-hover:bg-brand-200 transition-colors">
                <Sparkles className="w-7 h-7 text-brand-500" />
              </div>
              <span className="text-sm font-bold text-brand-500">Generate New Paper</span>
              <span className="text-xs text-brand-400 text-center max-w-[140px]">AI-powered from your documents</span>
            </div>
          </Link>
        </motion.div>
      )}
    </div>
  )
}
