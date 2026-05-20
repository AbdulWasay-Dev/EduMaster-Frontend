import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Plus, Clock, CheckCircle2, XCircle, FileText, Trash2,
  Settings, ChevronRight, BarChart3, Search, Users, BookOpen,
  CalendarDays, ScrollText, Layers, AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { listAssignments, deleteAssignment, publishAssignment } from '@/lib/api/assignments'
import { listClasses } from '@/lib/api/classes'
import { listSubjects } from '@/lib/api/subjects'
import { cn } from '@/lib/utils'
import type { Assignment, Class, Subject } from '@/types'
import EmailConfigModal from './components/EmailConfigModal'

const statusConfig: Record<string, { icon: React.ElementType; label: string; color: string; bar: string }> = {
  draft:     { icon: FileText,     label: 'Draft',     color: 'bg-slate-100 text-slate-700 border-slate-200', bar: 'bg-slate-400'  },
  published: { icon: Clock,        label: 'Published', color: 'bg-green-50 text-green-700 border-green-200',  bar: 'bg-green-400'  },
  closed:    { icon: XCircle,      label: 'Closed',    color: 'bg-red-50 text-red-600 border-red-200',        bar: 'bg-red-400'    },
}

export default function AssignmentsListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [classFilter, setClassFilter] = useState(searchParams.get('class_id') ?? '')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showEmailConfig, setShowEmailConfig] = useState(false)

  const { data: classes = [] } = useQuery<Class[]>({ queryKey: ['classes'], queryFn: () => listClasses() })
  const { data: allSubjects = [] } = useQuery<Subject[]>({ queryKey: ['subjects'], queryFn: () => listSubjects() })
  const { data: assignments = [], isLoading } = useQuery<Assignment[]>({
    queryKey: ['assignments', classFilter],
    queryFn: () => listAssignments(classFilter ? { class_id: classFilter } : undefined),
  })

  // Name lookup maps
  const classMap = useMemo(() => Object.fromEntries(classes.map(c => [c.id, c.name])), [classes])
  const subjectMap = useMemo(() => Object.fromEntries(allSubjects.map(s => [s.id, s.name])), [allSubjects])

  const getClassName = (a: Assignment) => a.class_name || classMap[a.class_id] || null
  const getSubjectName = (a: Assignment) => a.subject_name || subjectMap[a.subject_id] || null

  const deleteMut = useMutation({
    mutationFn: deleteAssignment,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['assignments'] }); toast.success('Assignment deleted') },
  })

  const publishMut = useMutation({
    mutationFn: publishAssignment,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['assignments'] }); toast.success('Assignment published!') },
  })

  const filtered = useMemo(() =>
    assignments.filter(a => {
      const matchStatus = !statusFilter || a.status === statusFilter
      const matchSearch = !searchQuery ||
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (getClassName(a) ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (getSubjectName(a) ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      return matchStatus && matchSearch
    }),
    [assignments, statusFilter, searchQuery, classMap, subjectMap]
  )

  // Stats
  const draftCount     = assignments.filter(a => a.status === 'draft').length
  const publishedCount = assignments.filter(a => a.status === 'published').length
  const closedCount    = assignments.filter(a => a.status === 'closed').length

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] to-brand-900 rounded-3xl p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Assignment Center</h1>
            <p className="text-brand-100/80 max-w-xl">Create and manage assignments, track student submissions, and auto-grade using AI.</p>
            {/* Mini stats in header */}
            <div className="flex items-center gap-4 mt-4">
              {[
                { label: 'Total',     value: assignments.length, color: 'bg-white/20' },
                { label: 'Published', value: publishedCount,     color: 'bg-green-500/30' },
                { label: 'Draft',     value: draftCount,         color: 'bg-white/10' },
                { label: 'Closed',    value: closedCount,        color: 'bg-red-500/30' },
              ].map(({ label, value, color }) => (
                <div key={label} className={`${color} rounded-xl px-3 py-1.5 text-center`}>
                  <p className="text-lg font-bold">{value}</p>
                  <p className="text-[10px] text-white/70 uppercase tracking-wide">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button onClick={() => setShowEmailConfig(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all text-sm font-medium border border-white/10">
              <Settings className="w-4 h-4" /> Email Sync
            </button>
            <button onClick={() => navigate('/assignments/new')}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all text-sm font-bold">
              <Plus className="w-4 h-4" /> New Assignment
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-white p-4 rounded-2xl border border-brand-100 shadow-sm">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
          <input type="text" placeholder="Search assignments, classes…"
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="input pl-9 w-full bg-brand-50 border-transparent focus:bg-white text-sm" />
        </div>
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
          className="input bg-brand-50 border-transparent focus:bg-white text-sm min-w-[160px]">
          <option value="">All Classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="flex items-center gap-1 bg-brand-50 p-1 rounded-lg">
          {['', 'draft', 'published', 'closed'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${
                statusFilter === s ? 'bg-white shadow-sm text-brand-700' : 'text-brand-500 hover:text-brand-700'
              }`}>
              {s || 'All'}
            </button>
          ))}
        </div>
        <span className="text-xs text-brand-400 ml-auto">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-4">
          <AnimatePresence>
            {filtered.map((a: Assignment) => {
              const sc = statusConfig[a.status] || statusConfig.draft
              const Icon = sc.icon
              const className  = getClassName(a)
              const subjectName = getSubjectName(a)

              return (
                <motion.div layout key={a.id}
                  initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                  className="group relative bg-white rounded-2xl border border-brand-100 shadow-sm hover:shadow-md hover:border-brand-300 transition-all overflow-hidden"
                >
                  <div className={cn('absolute left-0 top-0 bottom-0 w-1.5', sc.bar)} />

                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 pl-6">
                    <Link to={`/assignments/${a.id}`} className="flex items-start gap-4 flex-1 min-w-0 w-full group/link">
                      <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 text-brand-500 group-hover/link:bg-brand-500 group-hover/link:text-white transition-colors shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                          <h3 className="text-base font-bold text-[#0f172a] truncate group-hover/link:text-brand-600 transition-colors">
                            {a.title}
                          </h3>
                          <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border', sc.color)}>
                            <Icon className="w-3 h-3" /> {sc.label}
                          </span>
                        </div>

                        {/* Meta row — class name + subject name, NOT IDs */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {className && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-full">
                              <Users className="w-3 h-3 text-brand-400" /> {className}
                            </span>
                          )}
                          {subjectName && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                              <BookOpen className="w-3 h-3 text-indigo-400" /> {subjectName}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-xs text-brand-500">
                            <ScrollText className="w-3 h-3" /> {a.total_marks} Marks
                          </span>
                          {a.due_date && (
                            <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
                              <CalendarDays className="w-3 h-3" /> Due: {new Date(a.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center w-full md:w-auto justify-end mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-0 border-brand-50">
                      <Link to={`/assignments/${a.id}`}
                        className="p-2 text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg text-sm font-semibold flex items-center gap-1 transition-colors mr-1">
                        <BarChart3 className="w-4 h-4" /> Manage <ChevronRight className="w-4 h-4 hidden sm:block" />
                      </Link>
                      {a.status === 'draft' && (
                        <button onClick={() => publishMut.mutate(a.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Publish">
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                      )}
                      <button onClick={() => { if (confirm('Delete this assignment?')) deleteMut.mutate(a.id) }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-brand-100 p-16 text-center shadow-sm">
          <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <FileText className="w-10 h-10 text-brand-300" />
          </div>
          <h2 className="text-xl font-bold text-[#0f172a] mb-2">
            {searchQuery || classFilter || statusFilter ? 'No assignments match filters' : 'No assignments yet'}
          </h2>
          <p className="text-brand-500 max-w-sm mx-auto mb-6">
            {searchQuery || classFilter || statusFilter
              ? "Try clearing your filters to see all assignments."
              : "You haven't created any assignments yet. Create one to start accepting submissions."}
          </p>
          {!searchQuery && !classFilter && !statusFilter && (
            <button onClick={() => navigate('/assignments/new')} className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create First Assignment
            </button>
          )}
          {(searchQuery || classFilter || statusFilter) && (
            <button onClick={() => { setSearchQuery(''); setClassFilter(''); setStatusFilter('') }} className="btn-ghost">
              Clear Filters
            </button>
          )}
        </div>
      )}

      {showEmailConfig && <EmailConfigModal onClose={() => setShowEmailConfig(false)} />}
    </motion.div>
  )
}
