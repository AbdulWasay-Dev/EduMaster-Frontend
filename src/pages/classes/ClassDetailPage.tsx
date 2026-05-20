import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { format, parseISO, isToday } from 'date-fns'
import {
  ArrowLeft, Plus, Trash2, User, ScrollText, CheckSquare,
  Users, BookOpen, TrendingUp, Eye, BarChart2, FileText,
  ClipboardCheck, ClipboardList, Calendar, Clock, Sparkles,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as Dialog from '@radix-ui/react-dialog'
import { type ColumnDef } from '@tanstack/react-table'
import { motion } from 'framer-motion'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import EmptyState from '@/components/shared/EmptyState'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import DataTable from '@/components/shared/DataTable'
import GradeCircle from '@/components/shared/GradeCircle'
import { getClass } from '@/lib/api/classes'
import { listStudents, createStudent, deleteStudent } from '@/lib/api/students'
import { listPapers } from '@/lib/api/papers'
import { listSubmissions } from '@/lib/api/grading'
import { listSubjects } from '@/lib/api/subjects'
import { listEvents } from '@/lib/api/schedule'
import { listAssignments } from '@/lib/api/assignments'
import { formatDate, gradeLabel } from '@/lib/utils'
import { type Student, type Paper, type Submission } from '@/types'

const studentSchema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Valid email required').optional().or(z.literal('')),
  roll_number: z.string().optional(),
})
type StudentForm = z.infer<typeof studentSchema>

type Tab = 'overview' | 'students' | 'papers' | 'grading' | 'performance'

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'overview',     label: 'Overview',     icon: BookOpen    },
  { key: 'students',    label: 'Students',     icon: Users       },
  { key: 'papers',      label: 'Papers',       icon: ScrollText  },
  { key: 'grading',     label: 'Grading',      icon: CheckSquare },
  { key: 'performance', label: 'Performance',  icon: BarChart2   },
]

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('overview')
  const [addOpen, setAddOpen] = useState(false)

  const { data: cls, isLoading: loadingCls } = useQuery({
    queryKey: ['class', id],
    queryFn: () => getClass(id!),
  })
  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['students', id],
    queryFn: () => listStudents(id),
    enabled: !!id,
  })
  const { data: allPapers = [], isLoading: loadingPapers } = useQuery({
    queryKey: ['papers'],
    queryFn: () => listPapers(),
  })
  const { data: submissions = [], isLoading: loadingSubmissions } = useQuery({
    queryKey: ['submissions'],
    queryFn: () => listSubmissions(),
  })
  const { data: classSubjects = [] } = useQuery({
    queryKey: ['subjects', id],
    queryFn: () => listSubjects(id),
    enabled: !!id,
  })
  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => listEvents(),
  })
  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments', id],
    queryFn: () => listAssignments({ class_id: id }),
    enabled: !!id,
  })
  // Class schedule events
  const classEvents = events.filter(e => e.class_id === id && e.type === 'class')
  const recurringSlots = classEvents.filter(e => e.repeat_weekly)
  const upcomingOnce = classEvents.filter(e => {
    try { return !e.repeat_weekly && (isToday(parseISO(e.date)) || parseISO(e.date) > new Date()) } catch { return false }
  }).slice(0, 3)
  // First subject for pre-selection
  const firstSubjectId = classSubjects[0]?.id ?? ''

  // Grading submissions relevant to this class
  const classSubmissions = submissions.filter(s => s.class_id === id)
  const gradedSubmissions = classSubmissions.filter(s => s.status === 'graded')

  const avgScore = gradedSubmissions.length
    ? Math.round(
        gradedSubmissions.reduce((acc, s) => {
          const pct = s.grade_percentage ?? (s.max_score ? Math.round(((s.total_score ?? 0) / s.max_score) * 100) : 0)
          return acc + pct
        }, 0) / gradedSubmissions.length,
      )
    : null

  const addMut = useMutation({
    mutationFn: (v: StudentForm) => createStudent({ ...v, class_id: id! }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students', id] })
      toast.success('Student added!')
      setAddOpen(false)
      reset()
    },
    onError: () => toast.error('Failed to add student'),
  })
  const deleteMut = useMutation({
    mutationFn: deleteStudent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students', id] })
      toast.success('Student removed')
    },
    onError: () => toast.error('Failed to remove'),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<StudentForm>({
    resolver: zodResolver(studentSchema),
  })

  const studentColumns: ColumnDef<Student, any>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-600">
            {row.original.name?.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-[#0f172a]">{row.original.name}</span>
        </div>
      ),
    },
    { accessorKey: 'roll_number', header: 'Roll No.' },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ getValue }) => <span className="text-brand-600">{(getValue() as string) || '—'}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={() => window.confirm('Remove student?') && deleteMut.mutate(row.original.id)}
          className="p-1.5 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ]

  const paperColumns: ColumnDef<Paper, any>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ getValue }) => <span className="font-medium text-[#0f172a]">{getValue() as string}</span>,
    },
    {
      id: 'questions',
      header: 'Questions',
      cell: ({ row }) => row.original.questions?.length ?? 0,
    },
    { accessorKey: 'total_marks', header: 'Marks' },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.is_published ? 'published' : 'draft'} />,
    },
    {
      id: 'created',
      header: 'Created',
      cell: ({ row }) => formatDate(row.original.created_at),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link to={`/papers/${row.original.id}`} className="p-1.5 rounded hover:bg-brand-100 text-brand-500 transition-colors">
            <Eye className="w-3.5 h-3.5" />
          </Link>
          <Link
            to={`/grading/new?paper_id=${row.original.id}`}
            className="text-xs text-brand-500 hover:text-brand-700 font-medium px-2 py-1 rounded border border-brand-200 hover:border-brand-400 transition-colors"
          >
            Grade
          </Link>
        </div>
      ),
    },
  ]

  const submissionColumns: ColumnDef<Submission, any>[] = [
    {
      accessorKey: 'student_name',
      header: 'Student',
      cell: ({ getValue }) => <span className="font-medium text-[#0f172a]">{(getValue() as string) || '—'}</span>,
    },
    {
      accessorKey: 'paper_title',
      header: 'Paper',
      cell: ({ getValue }) => <span className="text-brand-600 text-xs">{(getValue() as string) || '—'}</span>,
    },
    {
      id: 'score',
      header: 'Score',
      cell: ({ row }) => {
        const s = row.original
        return `${s.total_score ?? s.score ?? 0}/${s.max_score ?? s.total_marks ?? 0}`
      },
    },
    {
      id: 'pct',
      header: '%',
      cell: ({ row }) => {
        const s = row.original
        const pct = s.grade_percentage ?? (s.max_score ? Math.round(((s.total_score ?? 0) / s.max_score) * 100) : 0)
        return <GradeCircle percentage={pct} size={36} />
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Link to={`/grading/${row.original.id}`} className="p-1.5 rounded hover:bg-brand-100 text-brand-500 transition-colors inline-flex">
          <Eye className="w-3.5 h-3.5" />
        </Link>
      ),
    },
  ]

  if (loadingCls) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  if (!cls) return <div className="text-center py-20 text-brand-500">Class not found</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={cls.name}
        subtitle={[cls.grade_level, cls.academic_year].filter(Boolean).join(' · ')}
        action={
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/classes')} className="btn-ghost flex items-center gap-2 text-sm">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <Link to={`/grading/new`} className="btn-ghost flex items-center gap-2 text-sm border border-brand-200">
              <CheckSquare className="w-4 h-4" /> Grade Sheets
            </Link>
            <button onClick={() => setAddOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Add Student
            </button>
          </div>
        }
      />

      {/* Stat row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Students',      value: students.length,           icon: Users,       color: 'bg-brand-100 text-brand-600'   },
          { label: 'Papers',        value: allPapers.length,          icon: ScrollText,  color: 'bg-violet-100 text-violet-600' },
          { label: 'Submissions',   value: classSubmissions.length,   icon: FileText,    color: 'bg-blue-100 text-blue-600'     },
          { label: 'Avg Score',     value: avgScore !== null ? `${avgScore}%` : '—', icon: TrendingUp, color: 'bg-emerald-100 text-emerald-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <motion.div
            key={label}
            whileHover={{ y: -2 } as any}
            className="card p-4 flex items-center gap-3"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-[#0f172a]">{value}</p>
              <p className="text-xs text-brand-600">{label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-brand-100 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === key
                ? 'border-brand-500 text-brand-700'
                : 'border-transparent text-brand-500 hover:text-brand-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Overview ─────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {/* Class info card */}
          <div className="card p-5">
            <h2 className="section-title mb-4">Class Information</h2>
            <dl className="grid grid-cols-2 gap-4">
              {[
                ['Class Name', cls.name],
                ['Grade Level', cls.grade_level ?? '—'],
                ['Academic Year', cls.academic_year ?? '—'],
                ['Status', cls.is_active ? 'Active' : 'Inactive'],
                ['Class Code', cls.class_code ?? '—'],
                ['Max Students', cls.max_students ?? '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-semibold text-brand-600 uppercase tracking-wide">{k}</dt>
                  <dd className="mt-1 text-sm font-medium text-[#0f172a]">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Quick Actions — pre-filled with class_id (and first subject if available) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Take Attendance', desc: 'Mark today\'s attendance', icon: ClipboardCheck, color: 'bg-indigo-100 text-indigo-600',
                to: `/attendance?class_id=${id}${firstSubjectId ? `&subject_id=${firstSubjectId}` : ''}` },
              { label: 'Generate Paper',  desc: 'AI-powered exam paper',   icon: ScrollText,     color: 'bg-blue-100 text-blue-600',
                to: `/papers/generate?class_id=${id}${firstSubjectId ? `&subject_id=${firstSubjectId}` : ''}` },
              { label: 'New Assignment',  desc: 'Create an assignment',     icon: ClipboardList,  color: 'bg-emerald-100 text-emerald-600',
                to: `/assignments/new?class_id=${id}${firstSubjectId ? `&subject_id=${firstSubjectId}` : ''}` },
              { label: 'Grade Sheets',    desc: 'Upload answer sheets',     icon: CheckSquare,    color: 'bg-violet-100 text-violet-600',
                to: `/grading/new?class_id=${id}` },
              { label: 'Add Student',     desc: 'Enrol a new student',      icon: Plus,           color: 'bg-brand-100 text-brand-600',
                to: null, onClick: () => setAddOpen(true) },
              { label: 'Subjects',        desc: `${classSubjects.length} subject${classSubjects.length !== 1 ? 's' : ''}`, icon: BookOpen, color: 'bg-rose-100 text-rose-600',
                to: `/subjects?class_id=${id}` },
            ].map(({ label, desc, icon: Icon, color, to, onClick }) =>
              to ? (
                <Link key={label} to={to}
                  className="card p-4 flex items-center gap-3 hover:border-brand-300 hover:bg-brand-50 transition-all group">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} flex-shrink-0`}><Icon className="w-5 h-5" /></div>
                  <div><p className="font-semibold text-sm text-[#0f172a]">{label}</p><p className="text-xs text-brand-500">{desc}</p></div>
                </Link>
              ) : (
                <button key={label} onClick={onClick as any}
                  className="card p-4 flex items-center gap-3 hover:border-brand-300 hover:bg-brand-50 transition-all text-left">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} flex-shrink-0`}><Icon className="w-5 h-5" /></div>
                  <div><p className="font-semibold text-sm text-[#0f172a]">{label}</p><p className="text-xs text-brand-500">{desc}</p></div>
                </button>
              )
            )}
          </div>

          {/* Schedule section */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title flex items-center gap-2"><Calendar className="w-4 h-4 text-brand-500" /> Class Schedule</h2>
              <Link to="/schedule" className="text-xs text-brand-500 hover:text-brand-700 font-medium">Manage →</Link>
            </div>
            {recurringSlots.length === 0 && upcomingOnce.length === 0 ? (
              <div className="text-center py-6">
                <Clock className="w-8 h-8 text-brand-200 mx-auto mb-2" />
                <p className="text-sm text-brand-400 mb-3">No schedule events yet</p>
                <Link to="/schedule" className="btn-ghost text-sm">Add to Schedule</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recurringSlots.map((e, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-blue-800 truncate">{e.title}</p>
                      <p className="text-xs text-blue-600">Weekly · {e.start_time} – {e.end_time}</p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Recurring</span>
                  </div>
                ))}
                {upcomingOnce.map((e, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-brand-50 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0f172a] truncate">{e.title}</p>
                      <p className="text-xs text-brand-500">{isToday(parseISO(e.date)) ? 'Today' : format(parseISO(e.date), 'EEE, MMM d')} · {e.start_time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subjects linked to this class */}
          {classSubjects.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="section-title flex items-center gap-2"><BookOpen className="w-4 h-4 text-brand-500" /> Subjects ({classSubjects.length})</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {classSubjects.map(s => (
                  <Link key={s.id} to={`/subjects/${s.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl border border-brand-100 hover:border-brand-300 hover:bg-brand-50 transition-all group">
                    <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-brand-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0f172a] truncate">{s.name}</p>
                      {s.code && <p className="text-xs text-brand-400 font-mono">{s.code}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Link to={`/attendance?class_id=${id}&subject_id=${s.id}`} onClick={e => e.stopPropagation()}
                        title="Attendance" className="p-1.5 rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100 transition-colors">
                        <ClipboardCheck className="w-3.5 h-3.5" />
                      </Link>
                      <Link to={`/papers/generate?class_id=${id}&subject_id=${s.id}`} onClick={e => e.stopPropagation()}
                        title="Generate Paper" className="p-1.5 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors">
                        <ScrollText className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Students ──────────────────────────────────────── */}
      {tab === 'students' && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Students ({students.length})</h2>
            <button onClick={() => setAddOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Add Student
            </button>
          </div>
          {students.length === 0 && !loadingStudents ? (
            <EmptyState
              icon={User}
              title="No students yet"
              description="Add students to this class to get started."
              action={
                <button onClick={() => setAddOpen(true)} className="btn-primary flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Student
                </button>
              }
            />
          ) : (
            <DataTable
              data={students}
              columns={studentColumns}
              isLoading={loadingStudents}
              searchPlaceholder="Search students…"
              emptyMessage="No matching students"
            />
          )}
        </div>
      )}

      {/* ── Tab: Papers ────────────────────────────────────────── */}
      {tab === 'papers' && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Papers ({allPapers.length})</h2>
            <Link to="/papers/generate" className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Generate Paper
            </Link>
          </div>
          {allPapers.length === 0 && !loadingPapers ? (
            <EmptyState
              icon={ScrollText}
              title="No papers yet"
              description="Generate an AI-powered exam paper from your uploaded documents."
              action={
                <Link to="/papers/generate" className="btn-primary flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Generate Paper
                </Link>
              }
            />
          ) : (
            <DataTable
              data={allPapers}
              columns={paperColumns}
              isLoading={loadingPapers}
              searchPlaceholder="Search papers…"
              emptyMessage="No matching papers"
            />
          )}
        </div>
      )}

      {/* ── Tab: Grading ───────────────────────────────────────── */}
      {tab === 'grading' && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Grading Sessions</h2>
            <Link to="/grading/new" className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Grade New Batch
            </Link>
          </div>
          {classSubmissions.length === 0 && !loadingSubmissions ? (
            <EmptyState
              icon={CheckSquare}
              title="No graded submissions"
              description="Upload answer sheets to start AI-powered grading for this class."
              action={
                <Link to="/grading/new" className="btn-primary flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Start Grading
                </Link>
              }
            />
          ) : (
            <DataTable
              data={classSubmissions}
              columns={submissionColumns}
              isLoading={loadingSubmissions}
              searchPlaceholder="Search submissions…"
              emptyMessage="No matching submissions"
            />
          )}
        </div>
      )}

      {/* ── Tab: Performance ───────────────────────────────────── */}
      {tab === 'performance' && (
        <div className="space-y-4">
          {gradedSubmissions.length === 0 ? (
            <div className="card p-5">
              <EmptyState
                icon={BarChart2}
                title="No performance data yet"
                description="Grade some answer sheets for this class to see performance insights."
                action={
                  <Link to="/grading/new" className="btn-primary flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" /> Start Grading
                  </Link>
                }
              />
            </div>
          ) : (
            <>
              {/* Grade band summary */}
              <div className="card p-5">
                <h2 className="section-title mb-4">Grade Distribution</h2>
                <div className="space-y-2">
                  {(['A+','A','B','C','D','F'] as const).map(grade => {
                    const thresholds: Record<string, [number,number]> = {
                      'A+': [90,100], 'A': [80,90], 'B': [65,80],
                      'C': [50,65], 'D': [35,50], 'F': [0,35],
                    }
                    const [lo, hi] = thresholds[grade]
                    const count = gradedSubmissions.filter(s => {
                      const pct = s.grade_percentage ?? (s.max_score ? Math.round(((s.total_score ?? 0) / s.max_score) * 100) : 0)
                      return pct >= lo && pct < hi
                    }).length
                    const pct = gradedSubmissions.length ? Math.round((count / gradedSubmissions.length) * 100) : 0
                    const colors: Record<string, string> = {
                      'A+': 'bg-emerald-500', 'A': 'bg-green-400', 'B': 'bg-cyan-400',
                      'C': 'bg-sky-400', 'D': 'bg-blue-300', 'F': 'bg-red-400',
                    }
                    return (
                      <div key={grade} className="flex items-center gap-3">
                        <span className="w-6 text-xs font-bold text-brand-700">{grade}</span>
                        <div className="flex-1 bg-brand-50 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${colors[grade]}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-brand-600 w-16 text-right">{count} students ({pct}%)</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Student score table */}
              <div className="card p-5">
                <h2 className="section-title mb-4">Student Results</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-brand-100">
                        {['Student', 'Paper', 'Score', 'Grade', 'Date', ''].map(h => (
                          <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-brand-700 uppercase tracking-wide">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {gradedSubmissions.map(sub => {
                        const pct = sub.grade_percentage ?? (sub.max_score ? Math.round(((sub.total_score ?? 0) / sub.max_score) * 100) : 0)
                        return (
                          <tr key={sub.id} className="border-b border-brand-50 hover:bg-brand-50/50 transition-colors">
                            <td className="py-3 px-3 font-medium text-[#0f172a]">{sub.student_name ?? '—'}</td>
                            <td className="py-3 px-3 text-brand-600 text-xs">{sub.paper_title ?? '—'}</td>
                            <td className="py-3 px-3 text-brand-700">{sub.total_score ?? 0}/{sub.max_score ?? 0}</td>
                            <td className={`py-3 px-3 font-bold ${pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-blue-500' : 'text-red-500'}`}>{gradeLabel(pct)}</td>
                            <td className="py-3 px-3 text-brand-500 text-xs">{formatDate(sub.graded_at ?? sub.created_at ?? '')}</td>
                            <td className="py-3 px-3">
                              <Link to={`/grading/${sub.id}`} className="text-brand-500 hover:text-brand-700 text-xs font-medium">View →</Link>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Add Student Dialog ─────────────────────────────────── */}
      <Dialog.Root open={addOpen} onOpenChange={setAddOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 z-50 w-full max-w-sm">
            <Dialog.Title className="text-lg font-bold text-[#0f172a] mb-4">Add Student</Dialog.Title>
            <form onSubmit={handleSubmit(v => addMut.mutate(v))} className="space-y-4">
              <div>
                <label className="label">Full Name *</label>
                <input {...register('name')} className="input" placeholder="e.g. Alice Johnson" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="label">Roll Number</label>
                <input {...register('roll_number')} className="input" placeholder="e.g. 001" />
              </div>
              <div>
                <label className="label">Email</label>
                <input {...register('email')} type="email" className="input" placeholder="optional" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={addMut.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {addMut.isPending && <LoadingSpinner size="sm" />} Add Student
                </button>
                <Dialog.Close asChild>
                  <button type="button" className="btn-ghost">Cancel</button>
                </Dialog.Close>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
