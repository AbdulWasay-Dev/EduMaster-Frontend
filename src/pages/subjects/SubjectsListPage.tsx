import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, BookOpen, Search, Filter, FileText,
  ScrollText, Users, TrendingUp, LayoutGrid, List,
  GraduationCap, CheckCircle2, XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import SubjectCard from '@/components/subjects/SubjectCard'
import { listSubjects, deleteSubject } from '@/lib/api/subjects'
import { listClasses } from '@/lib/api/classes'
import { type Subject, type Class } from '@/types'

type ViewMode = 'grid' | 'list'

export default function SubjectsListPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const { data: subjects = [], isLoading } = useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: () => listSubjects(),
  })

  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: () => listClasses(),
  })

  const deleteMut = useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subjects'] })
      toast.success('Subject deleted')
    },
    onError: () => toast.error('Failed to delete subject'),
  })

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this subject? This cannot be undone.')) {
      deleteMut.mutate(id)
    }
  }

  // Build a class lookup map
  const classMap = useMemo(() => {
    const map: Record<string, string> = {}
    classes.forEach(c => { map[c.id] = c.name })
    return map
  }, [classes])

  // Filtered subjects
  const filtered = useMemo(() => {
    return subjects.filter(s => {
      const matchSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.code ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (s.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (s.subject_area ?? '').toLowerCase().includes(search.toLowerCase())
      const matchActive =
        filterActive === 'all' ||
        (filterActive === 'active' ? s.is_active : !s.is_active)
      return matchSearch && matchActive
    })
  }, [subjects, search, filterActive])

  // Aggregate stats
  const totalDocs     = subjects.reduce((a, s) => a + (s.document_count ?? 0), 0)
  const totalPapers   = subjects.reduce((a, s) => a + (s.paper_count ?? 0), 0)
  const totalStudents = subjects.reduce((a, s) => a + (s.student_count ?? 0), 0)
  const activeCount   = subjects.filter(s => s.is_active).length

  const stats = [
    { label: 'Total Subjects', value: subjects.length, icon: BookOpen,      color: 'from-brand-500 to-brand-300',      text: 'text-brand-600',   bg: 'bg-brand-50'   },
    { label: 'Active',         value: activeCount,     icon: CheckCircle2,  color: 'from-emerald-500 to-teal-400',   text: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Documents',      value: totalDocs,       icon: FileText,      color: 'from-violet-500 to-purple-400',  text: 'text-violet-600',  bg: 'bg-violet-50'  },
    { label: 'Papers',         value: totalPapers,     icon: ScrollText,    color: 'from-brand-600 to-brand-400',      text: 'text-blue-600',    bg: 'bg-blue-50'    },
  ]

  const container = {
    hidden: { opacity: 0 },
    show:   { opacity: 1, transition: { staggerChildren: 0.06 } },
  }
  const item = {
    hidden: { opacity: 0, y: 16 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.3 } },
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <PageHeader
        title="Subjects"
        subtitle={`Manage and organise ${subjects.length} teaching subject${subjects.length !== 1 ? 's' : ''}`}
        action={
          <Link to="/subjects/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Subject
          </Link>
        }
      />

      {/* Stats bar */}
      {!isLoading && subjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {stats.map(({ label, value, icon: Icon, color, text, bg }) => (
            <div key={label} className="card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-sm flex-shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-[#0f172a] leading-none">{value}</p>
                <p className={`text-xs font-medium mt-0.5 ${text}`}>{label}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Search / Filter / View controls */}
      {!isLoading && subjects.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search subjects, codes, areas…"
              className="input pl-9 pr-4 text-sm"
            />
          </div>

          {/* Active filter pills */}
          <div className="flex items-center gap-1.5">
            {(['all', 'active', 'inactive'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterActive(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterActive === f
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-brand-50 text-brand-600 hover:bg-brand-100'
                }`}
              >
                {f === 'all' ? 'All' : f === 'active' ? '✓ Active' : '✗ Inactive'}
              </button>
            ))}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-0.5 bg-brand-50 rounded-lg p-1 ml-auto sm:ml-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-brand-700' : 'text-brand-400 hover:text-brand-600'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-brand-700' : 'text-brand-400 hover:text-brand-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects yet"
          description="Create your first subject to start organising your teaching content."
          action={
            <Link to="/subjects/new" className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Subject
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Search className="w-10 h-10 text-brand-200 mx-auto mb-3" />
          <p className="text-[#0f172a] font-semibold mb-1">No subjects match your search</p>
          <p className="text-sm text-brand-500 mb-4">Try different keywords or clear the filters</p>
          <button
            onClick={() => { setSearch(''); setFilterActive('all') }}
            className="btn-ghost text-sm"
          >
            Clear filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence>
            {filtered.map(subject => (
              <motion.div key={subject.id} variants={item} layout>
                <SubjectCard
                  subject={subject}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        /* List view */
        <div className="card overflow-hidden">
          <div className="divide-y divide-brand-50">
            {filtered.map((subject, i) => (
              <SubjectListRow
                key={subject.id}
                subject={subject}
                className={classMap[subject.class_id ?? ''] ?? null}
                onDelete={handleDelete}
                index={i}
              />
            ))}
          </div>
        </div>
      )}

      {/* Results count */}
      {!isLoading && subjects.length > 0 && filtered.length > 0 && (
        <p className="text-xs text-brand-400 text-center">
          Showing {filtered.length} of {subjects.length} subjects
        </p>
      )}
    </div>
  )
}

/* ─── List row component ─────────────────────────────────────────────────── */
function SubjectListRow({
  subject, className, onDelete, index,
}: {
  subject: Subject
  className: string | null
  onDelete: (id: string) => void
  index: number
}) {
  const GRADIENTS = [
    'from-brand-500 to-brand-300',
    'from-brand-600 to-brand-400',
    'from-violet-500 to-purple-400',
    'from-emerald-500 to-teal-400',
    'from-indigo-500 to-blue-400',
    'from-brand-500 to-brand-300',
  ]
  const gradient = GRADIENTS[subject.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENTS.length]

  return (
    <Link
      to={`/subjects/${subject.id}`}
      className="flex items-center gap-4 px-5 py-4 hover:bg-brand-50/60 transition-colors group"
    >
      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm flex-shrink-0`}>
        <BookOpen className="w-5 h-5 text-white" />
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-[#0f172a] truncate">{subject.name}</span>
          {subject.code && (
            <span className="text-xs font-mono text-brand-500 bg-brand-50 px-1.5 py-0.5 rounded">{subject.code}</span>
          )}
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            subject.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {subject.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <p className="text-xs text-brand-500 mt-0.5 truncate">
          {[subject.subject_area, subject.grade_level, subject.academic_year].filter(Boolean).join(' · ') || subject.description || '—'}
        </p>
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-5 text-xs text-brand-500">
        <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {subject.document_count ?? 0}</span>
        <span className="flex items-center gap-1"><ScrollText className="w-3.5 h-3.5" /> {subject.paper_count ?? 0}</span>
        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {subject.student_count ?? 0}</span>
      </div>

      {/* Arrow */}
      <span className="text-brand-300 group-hover:text-brand-500 transition-colors ml-2 text-lg">›</span>
    </Link>
  )
}
