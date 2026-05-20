import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Users, GraduationCap, CheckSquare, ScrollText,
  ClipboardList, Clock, Calendar, Search, BookOpen,
  BarChart2, ClipboardCheck, ChevronRight, Layers,
  MoreVertical, Trash2, Pencil, CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { format, parseISO, isToday } from 'date-fns'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { listClasses, deleteClass } from '@/lib/api/classes'
import { listSubjects } from '@/lib/api/subjects'
import { listStudents } from '@/lib/api/students'
import { listEvents } from '@/lib/api/schedule'
import type { Class, ScheduleEvent } from '@/types'

// Blue-led palette keyed by class name hash
const CLASS_GRADIENTS = [
  'from-brand-500 to-sky-400',
  'from-violet-500 to-purple-400',
  'from-emerald-500 to-teal-400',
  'from-blue-600 to-cyan-400',
  'from-indigo-500 to-blue-400',
  'from-sky-500 to-blue-300',
]
function classGradient(name: string) {
  const h = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return CLASS_GRADIENTS[h % CLASS_GRADIENTS.length]
}

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function ClassesListPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

  const { data: classes = [], isLoading } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: () => listClasses(),
  })

  const { data: events = [] } = useQuery<ScheduleEvent[]>({
    queryKey: ['events'],
    queryFn: () => listEvents(),
  })

  const deleteMut = useMutation({
    mutationFn: deleteClass,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['classes'] }); toast.success('Class deleted') },
    onError: () => toast.error('Failed to delete class'),
  })

  // Group schedule events by class_id
  const eventsByClass = useMemo(() => {
    const map: Record<string, ScheduleEvent[]> = {}
    events.forEach(e => {
      if (e.class_id) {
        if (!map[e.class_id]) map[e.class_id] = []
        map[e.class_id].push(e)
      }
    })
    return map
  }, [events])

  // Get weekly recurring schedule for a class (class-type events with repeat_weekly)
  const getClassSchedule = (classId: string) => {
    const classEvents = eventsByClass[classId] ?? []
    const recurring = classEvents.filter(e => e.type === 'class' && e.repeat_weekly)
    const upcoming = classEvents.filter(e => {
      try { return !e.repeat_weekly && (isToday(parseISO(e.date)) || parseISO(e.date) > new Date()) } catch { return false }
    }).slice(0, 2)
    return { recurring, upcoming }
  }

  const filtered = useMemo(() => classes.filter(cls => {
    const matchStatus = filterStatus === 'all' || (filterStatus === 'active' ? cls.is_active : !cls.is_active)
    const matchSearch = !search || cls.name.toLowerCase().includes(search.toLowerCase()) ||
      (cls.grade_level ?? '').toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  }), [classes, search, filterStatus])

  const activeCount = classes.filter(c => c.is_active).length
  const totalStudents = classes.reduce((a, c) => a + (c.student_count ?? 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Classes"
        subtitle={`${classes.length} class${classes.length !== 1 ? 'es' : ''} · ${totalStudents} total students`}
        action={
          <Link to="/classes/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Class
          </Link>
        }
      />

      {/* Stats */}
      {!isLoading && classes.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Classes', value: classes.length, icon: Layers,      grad: 'from-brand-500 to-sky-400' },
            { label: 'Active',        value: activeCount,    icon: CheckCircle2, grad: 'from-emerald-500 to-teal-400' },
            { label: 'Students',      value: totalStudents,  icon: Users,        grad: 'from-blue-500 to-cyan-400'    },
            { label: 'Scheduled',     value: events.filter(e => e.type === 'class').length, icon: Calendar, grad: 'from-violet-500 to-purple-400' },
          ].map(({ label, value, icon: Icon, grad }) => (
            <div key={label} className="card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-[#0f172a] leading-none">{value}</p>
                <p className="text-xs text-brand-500 mt-0.5 font-medium">{label}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Search + Filter */}
      {!isLoading && classes.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search classes…" className="input pl-9 text-sm" />
          </div>
          <div className="flex items-center gap-1 bg-brand-50 p-1 rounded-lg">
            {(['all', 'active', 'inactive'] as const).map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${
                  filterStatus === s ? 'bg-white shadow-sm text-brand-700' : 'text-brand-500 hover:text-brand-700'
                }`}>{s}</button>
            ))}
          </div>
          <span className="text-xs text-brand-400 ml-auto">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : classes.length === 0 ? (
        <EmptyState icon={Users} title="No classes yet"
          description="Create your first class to start managing students, papers and grading."
          action={<Link to="/classes/new" className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> New Class</Link>}
        />
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Search className="w-10 h-10 text-brand-200 mx-auto mb-3" />
          <p className="font-semibold text-[#0f172a] mb-1">No classes match</p>
          <button onClick={() => { setSearch(''); setFilterStatus('all') }} className="btn-ghost text-sm mt-2">Clear filters</button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((cls, i) => (
              <ClassCard key={cls.id} cls={cls} schedule={getClassSchedule(cls.id)}
                onDelete={id => window.confirm(`Delete "${cls.name}"?`) && deleteMut.mutate(id)}
                index={i} />
            ))}
          </AnimatePresence>
          {/* Add new card */}
          <Link to="/classes/new">
            <div className="card p-5 flex flex-col items-center justify-center gap-2 cursor-pointer border-dashed border-2 border-brand-200 hover:border-brand-400 hover:bg-brand-50 transition-all group min-h-[220px]">
              <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center group-hover:bg-brand-200 transition-colors">
                <Plus className="w-6 h-6 text-brand-500" />
              </div>
              <span className="text-sm font-semibold text-brand-500">New Class</span>
            </div>
          </Link>
        </motion.div>
      )}
    </div>
  )
}

// ─── Class Card ──────────────────────────────────────────────────────────────
function ClassCard({ cls, schedule, onDelete, index }: {
  cls: Class
  schedule: { recurring: ScheduleEvent[]; upcoming: ScheduleEvent[] }
  onDelete: (id: string) => void
  index: number
}) {
  const navigate = useNavigate()
  const gradient = classGradient(cls.name)

  // Deduplicate recurring schedule by day
  const weeklySlots = useMemo(() => {
    const seen = new Set<string>()
    return schedule.recurring.filter(e => {
      const key = `${e.start_time}-${e.end_time}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).slice(0, 3)
  }, [schedule.recurring])

  const nextEvent = schedule.upcoming[0]

  const quickActions = [
    { label: 'Attendance',   icon: ClipboardCheck, to: `/attendance?class_id=${cls.id}`,                    color: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'  },
    { label: 'Make Paper',   icon: ScrollText,     to: `/papers/generate?class_id=${cls.id}`,               color: 'bg-blue-50 text-blue-600 hover:bg-blue-100'         },
    { label: 'Assignment',   icon: ClipboardList,  to: `/assignments/new?class_id=${cls.id}`,               color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'},
    { label: 'Grade',        icon: CheckSquare,    to: `/grading/new?class_id=${cls.id}`,                   color: 'bg-violet-50 text-violet-600 hover:bg-violet-100'   },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
      whileHover={{ y: -4, boxShadow: '0 20px 48px -8px rgba(15,23,42,0.16)' } as any}
      transition={{ duration: 0.2 }}
      className="card overflow-hidden cursor-pointer group relative border-0 shadow-card"
      onClick={() => navigate(`/classes/${cls.id}`)}
      role="link" tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') navigate(`/classes/${cls.id}`) }}
    >
      {/* Gradient top bar */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-[#0f172a] text-base leading-tight">{cls.name}</h3>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {cls.grade_level && (
                  <span className="text-xs text-brand-500 bg-brand-50 px-1.5 py-0.5 rounded">{cls.grade_level}</span>
                )}
                {cls.academic_year && (
                  <span className="text-xs text-brand-400 font-mono">{cls.academic_year}</span>
                )}
              </div>
            </div>
          </div>
          {/* Dropdown — stops propagation */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button onClick={e => e.stopPropagation()}
                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-brand-100 transition-all flex-shrink-0">
                <MoreVertical className="w-4 h-4 text-brand-500" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className="min-w-[150px] bg-white border border-brand-100 rounded-xl shadow-card py-1 z-50"
                align="end" onClick={e => e.stopPropagation()}>
                <DropdownMenu.Item asChild>
                  <Link to={`/classes/${cls.id}/edit`} onClick={e => e.stopPropagation()}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-brand-50 outline-none cursor-pointer">
                    <Pencil className="w-3.5 h-3.5 text-brand-500" /> Edit Class
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item onSelect={() => onDelete(cls.id)}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 text-red-600 outline-none cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>

        {/* Students + status */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1 text-xs text-brand-600 bg-brand-50 px-2 py-1 rounded-full">
            <Users className="w-3 h-3" /> {cls.student_count ?? 0} students
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            cls.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {cls.is_active ? '● Active' : '○ Inactive'}
          </span>
          {cls.class_code && (
            <span className="text-xs font-mono text-brand-400 ml-auto">#{cls.class_code}</span>
          )}
        </div>

        {/* Schedule section */}
        {weeklySlots.length > 0 ? (
          <div className="bg-blue-50 rounded-xl p-3 mb-4">
            <p className="text-xs font-semibold text-blue-600 mb-2 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Weekly Schedule
            </p>
            <div className="space-y-1.5">
              {weeklySlots.map((e, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-blue-700">
                  <span className="font-medium truncate">{e.title}</span>
                  <span className="text-blue-500 font-mono ml-2 flex-shrink-0">{e.start_time} – {e.end_time}</span>
                </div>
              ))}
            </div>
          </div>
        ) : nextEvent ? (
          <div className="bg-blue-50 rounded-xl p-3 mb-4">
            <p className="text-xs font-semibold text-blue-600 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Next Session
            </p>
            <div className="flex items-center justify-between text-xs text-blue-700">
              <span className="font-medium truncate">{nextEvent.title}</span>
              <span className="font-mono ml-2 flex-shrink-0">{nextEvent.start_time}</span>
            </div>
            <p className="text-[10px] text-blue-500 mt-0.5">
              {isToday(parseISO(nextEvent.date)) ? 'Today' : format(parseISO(nextEvent.date), 'EEE, MMM d')}
            </p>
          </div>
        ) : (
          <div className="border border-dashed border-brand-100 rounded-xl p-3 mb-4 text-center">
            <p className="text-xs text-brand-300">No schedule added yet</p>
            <Link to="/schedule" onClick={e => e.stopPropagation()}
              className="text-xs text-brand-500 hover:text-brand-700 font-medium mt-0.5 inline-block">
              Add to Schedule →
            </Link>
          </div>
        )}

        {/* Quick action buttons */}
        <div className="grid grid-cols-4 gap-1.5 mb-3" onClick={e => e.stopPropagation()}>
          {quickActions.map(({ label, icon: Icon, to, color }) => (
            <Link key={label} to={to}
              className={`flex flex-col items-center gap-1 py-2 rounded-xl text-center transition-all ${color}`}
              title={label}>
              <Icon className="w-4 h-4" />
              <span className="text-[10px] font-semibold leading-tight">{label}</span>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-brand-50">
          <span className="text-[11px] text-brand-400">Click to open class</span>
          <div className="flex items-center gap-1 text-xs font-semibold text-brand-500 group-hover:text-brand-700 transition-colors">
            Open <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
