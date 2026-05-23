import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import {
  Pencil, Trash2, ArrowLeft, FileText, ScrollText, BookOpen,
  Users, Calendar, Tag, GraduationCap, CheckCircle2, XCircle,
  ClipboardList, TrendingUp, Plus, BarChart2, Eye,
  Clock, Award, Layers,
} from 'lucide-react'
import * as Tabs from '@radix-ui/react-tabs'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import { getSubject, deleteSubject } from '@/lib/api/subjects'
import { listDocuments } from '@/lib/api/documents'
import { listPapers } from '@/lib/api/papers'
import { listAssignments } from '@/lib/api/assignments'
import { listClasses } from '@/lib/api/classes'
import { formatDate, timeAgo, fileIcon } from '@/lib/utils'

const SUBJECT_GRADIENTS = [
  'from-brand-500 to-brand-300',
  'from-brand-600 to-brand-400',
  'from-violet-500 to-purple-400',
  'from-emerald-500 to-teal-400',
  'from-indigo-500 to-blue-400',
  'from-brand-500 to-brand-300',
]

function getGradient(name: string): string {
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return SUBJECT_GRADIENTS[hash % SUBJECT_GRADIENTS.length]
}

type TabKey = 'overview' | 'docs' | 'papers' | 'assignments'

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'overview',     label: 'Overview',     icon: BarChart2     },
  { key: 'docs',         label: 'Documents',    icon: FileText      },
  { key: 'papers',       label: 'Papers',       icon: ScrollText    },
  { key: 'assignments',  label: 'Assignments',  icon: ClipboardList },
]

export default function SubjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [tab, setTab] = useState<TabKey>('overview')

  const { data: subject, isLoading } = useQuery({
    queryKey: ['subject', id],
    queryFn: () => getSubject(id!),
  })

  const { data: docs = [] } = useQuery({
    queryKey: ['documents', id],
    queryFn: () => listDocuments(id),
    enabled: !!id,
  })

  const { data: papers = [] } = useQuery({
    queryKey: ['papers'],
    queryFn: () => listPapers(),
  })

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments', id],
    queryFn: () => listAssignments({ subject_id: id }),
    enabled: !!id,
  })

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: listClasses,
  })

  const deleteMut = useMutation({
    mutationFn: () => deleteSubject(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subjects'] })
      toast.success('Subject deleted')
      navigate('/subjects')
    },
    onError: () => toast.error('Failed to delete'),
  })

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  if (!subject) return <div className="text-center py-20 text-brand-500">Subject not found</div>

  const handleDelete = () => {
    if (window.confirm('Delete this subject?')) deleteMut.mutate()
  }

  const gradient = getGradient(subject.name)

  // Find associated class
  const associatedClass = subject.class_id
    ? classes.find(c => c.id === subject.class_id)
    : null

  // Subject-specific papers
  const subjectPapers = papers.filter(p => p.subject_id === id)

  // Stats
  const infoStats = [
    { label: 'Documents',    value: docs.length,         icon: FileText,      color: 'bg-violet-100 text-violet-600'  },
    { label: 'Papers',       value: subjectPapers.length, icon: ScrollText,    color: 'bg-blue-100 text-blue-600'      },
    { label: 'Assignments',  value: assignments.length,   icon: ClipboardList, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Students',     value: subject.student_count ?? 0, icon: Users, color: 'bg-blue-100 text-blue-600'     },
  ]

  return (
    <div className="space-y-6">

      {/* ── Hero banner ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl bg-gradient-to-br ${gradient} p-6 text-white shadow-lg overflow-hidden relative`}
      >
        {/* Decorative circles */}
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -right-4 top-12 w-24 h-24 rounded-full bg-white/10" />

        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Left: icon + title */}
          <div className="flex items-center gap-4 flex-1">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-md flex-shrink-0">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold leading-tight">{subject.name}</h1>
                {subject.code && (
                  <span className="text-sm font-mono bg-white/20 px-2 py-0.5 rounded-lg">{subject.code}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {associatedClass && (
                  <span className="inline-flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
                    <Layers className="w-3 h-3" /> Class: {associatedClass.name}
                  </span>
                )}
                {subject.grade_level && (
                  <span className="inline-flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
                    <GraduationCap className="w-3 h-3" /> {subject.grade_level}
                  </span>
                )}
                {subject.academic_year && (
                  <span className="inline-flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
                    <Calendar className="w-3 h-3" /> {subject.academic_year}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-semibold ${
                  subject.is_active ? 'bg-emerald-400/30 text-white' : 'bg-white/20 text-white/70'
                }`}>
                  {subject.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {subject.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/subjects')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <Link
              to={`/subjects/${id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-all"
            >
              <Pencil className="w-4 h-4" /> Edit
            </Link>
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/30 hover:bg-red-500/50 text-white text-sm font-medium transition-all"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>

        {/* Description in hero */}
        {subject.description && (
          <p className="relative mt-4 text-white/80 text-sm leading-relaxed max-w-2xl">
            {subject.description}
          </p>
        )}
      </motion.div>

      {/* ── Stats row ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {infoStats.map(({ label, value, icon: Icon, color }) => (
          <motion.div
            key={label}
            whileHover={{ y: -2 } as any}
            className="card p-4 flex items-center gap-3"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} flex-shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-[#0f172a] leading-none">{value}</p>
              <p className="text-xs text-brand-500 font-medium mt-0.5">{label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div className="flex gap-0.5 border-b border-brand-100 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              tab === key
                ? 'border-brand-500 text-brand-700 bg-brand-50/60'
                : 'border-transparent text-brand-500 hover:text-brand-700 hover:bg-brand-50/40'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Overview ───────────────────────────────────────── */}
      {tab === 'overview' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          {/* Subject Information */}
          <div className="card p-5">
            <h2 className="section-title mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-500" /> Subject Information
            </h2>
            <dl className="space-y-3">
              {[
                { k: 'Subject Name',   v: subject.name },
                { k: 'Subject Code',   v: subject.code ?? '—' },
                { k: 'Subject Area',   v: subject.subject_area ?? '—' },
                { k: 'Grade Level',    v: subject.grade_level ?? '—' },
                { k: 'Academic Year',  v: subject.academic_year ?? '—' },
                { k: 'Status',         v: subject.is_active ? 'Active' : 'Inactive' },
                { k: 'Associated Class', v: associatedClass?.name ?? '—' },
                { k: 'Created',        v: formatDate(subject.created_at) },
              ].map(({ k, v }) => (
                <div key={k} className="flex items-center justify-between py-2 border-b border-brand-50 last:border-0">
                  <dt className="text-xs font-semibold text-brand-500 uppercase tracking-wide">{k}</dt>
                  <dd className={`text-sm font-medium ${
                    k === 'Status'
                      ? subject.is_active ? 'text-emerald-600' : 'text-gray-400'
                      : 'text-[#0f172a]'
                  }`}>
                    {k === 'Status' ? (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        subject.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {subject.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {v}
                      </span>
                    ) : v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Quick actions */}
          <div className="space-y-3">
            <h2 className="section-title flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-500" /> Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  label: 'Upload Document',
                  desc:  'Add study materials',
                  icon:  FileText,
                  to:    `/documents/upload?subject_id=${id}`,
                  color: 'bg-violet-100 text-violet-600',
                },
                {
                  label: 'Generate Paper',
                  desc:  'AI-powered exam',
                  icon:  ScrollText,
                  to:    `/papers/generate?subject_id=${id}${subject.class_id ? `&class_id=${subject.class_id}` : ''}`,
                  color: 'bg-blue-100 text-blue-600',
                },
                {
                  label: 'Take Attendance',
                  desc:  'Mark attendance',
                  icon:  ClipboardList,
                  to:    `/attendance?subject_id=${id}${subject.class_id ? `&class_id=${subject.class_id}` : ''}`,
                  color: 'bg-indigo-100 text-indigo-600',
                },
                {
                  label: 'New Assignment',
                  desc:  'Create assignment',
                  icon:  BarChart2,
                  to:    `/assignments/new?subject_id=${id}${subject.class_id ? `&class_id=${subject.class_id}` : ''}`,
                  color: 'bg-emerald-100 text-emerald-600',
                },
              ].map(({ label, desc, icon: Icon, to, color }) => (
                <Link
                  key={label}
                  to={to}
                  className="card p-4 flex items-center gap-3 hover:border-brand-300 hover:bg-brand-50/40 transition-all group"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[#0f172a]">{label}</p>
                    <p className="text-xs text-brand-500">{desc}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Recent activity summary */}
            <div className="card p-4 mt-3">
              <h3 className="text-sm font-semibold text-[#0f172a] mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-400" /> Recent Activity
              </h3>
              {docs.length === 0 && subjectPapers.length === 0 && assignments.length === 0 ? (
                <p className="text-xs text-brand-400 text-center py-3">No activity yet</p>
              ) : (
                <div className="space-y-2">
                  {docs.slice(0, 2).map(doc => (
                    <Link
                      key={doc.id}
                      to={`/documents/${doc.id}`}
                      className="flex items-center gap-2 text-xs text-brand-600 hover:text-brand-800 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                      <span className="truncate flex-1">{doc.filename || doc.title}</span>
                      <span className="text-brand-400 flex-shrink-0">{timeAgo(doc.created_at)}</span>
                    </Link>
                  ))}
                  {subjectPapers.slice(0, 2).map(paper => (
                    <Link
                      key={paper.id}
                      to={`/papers/${paper.id}`}
                      className="flex items-center gap-2 text-xs text-brand-600 hover:text-brand-800 transition-colors"
                    >
                      <ScrollText className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      <span className="truncate flex-1">{paper.title}</span>
                      <span className="text-brand-400 flex-shrink-0">{timeAgo(paper.created_at)}</span>
                    </Link>
                  ))}
                  {assignments.slice(0, 2).map(a => (
                    <Link
                      key={a.id}
                      to={`/assignments/${a.id}`}
                      className="flex items-center gap-2 text-xs text-brand-600 hover:text-brand-800 transition-colors"
                    >
                      <ClipboardList className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span className="truncate flex-1">{a.title}</span>
                      <span className="text-brand-400 flex-shrink-0">{timeAgo(a.created_at)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Tab: Documents ───────────────────────────────────────── */}
      {tab === 'docs' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Documents ({docs.length})</h2>
            <Link to="/documents/upload" className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Upload
            </Link>
          </div>
          {docs.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No documents yet"
              description="Upload study materials for this subject."
              action={<Link to="/documents/upload" className="btn-primary">Upload Document</Link>}
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {docs.map(doc => (
                <Link
                  key={doc.id}
                  to={`/documents/${doc.id}`}
                  className="card p-4 hover:shadow-lg hover:border-brand-200 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{fileIcon(doc.file_type)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-[#0f172a] truncate group-hover:text-brand-700 transition-colors">
                        {doc.filename || doc.title}
                      </p>
                      <p className="text-xs text-brand-400 mt-0.5 uppercase font-medium">{doc.file_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <StatusBadge status={doc.processing_status} />
                    <span className="text-xs text-brand-400">{formatDate(doc.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ── Tab: Papers ──────────────────────────────────────────── */}
      {tab === 'papers' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Papers ({subjectPapers.length})</h2>
            <Link to="/papers/generate" className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Generate Paper
            </Link>
          </div>
          {subjectPapers.length === 0 ? (
            <EmptyState
              icon={ScrollText}
              title="No papers yet"
              description="Generate an AI-powered exam paper for this subject."
              action={<Link to="/papers/generate" className="btn-primary">Generate Paper</Link>}
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {subjectPapers.map(paper => (
                <Link
                  key={paper.id}
                  to={`/papers/${paper.id}`}
                  className="card p-4 hover:shadow-lg hover:border-brand-200 transition-all group"
                >
                  <div className="flex items-start gap-2 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <ScrollText className="w-4.5 h-4.5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-[#0f172a] group-hover:text-brand-700 transition-colors line-clamp-2">
                        {paper.title}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      {paper.total_marks} marks
                    </span>
                    <span className="text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full">
                      {paper.questions?.length ?? 0} questions
                    </span>
                    {paper.difficulty_level && (
                      <span className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full capitalize">
                        {paper.difficulty_level}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <StatusBadge status={paper.is_published ? 'published' : 'draft'} />
                    <span className="text-xs text-brand-400">{formatDate(paper.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ── Tab: Assignments ─────────────────────────────────────── */}
      {tab === 'assignments' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Assignments ({assignments.length})</h2>
            <Link to="/assignments/new" className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> New Assignment
            </Link>
          </div>
          {assignments.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No assignments yet"
              description="Create an assignment for students in this subject."
              action={<Link to="/assignments/new" className="btn-primary">Create Assignment</Link>}
            />
          ) : (
            <div className="card overflow-hidden">
              <div className="divide-y divide-brand-50">
                {assignments.map(a => (
                  <Link
                    key={a.id}
                    to={`/assignments/${a.id}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-brand-50/60 transition-colors group"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      a.status === 'published' ? 'bg-emerald-100 text-emerald-600' :
                      a.status === 'closed'    ? 'bg-gray-100 text-gray-500' :
                                                 'bg-blue-100 text-blue-600'
                    }`}>
                      <ClipboardList className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[#0f172a] truncate group-hover:text-brand-700 transition-colors">
                        {a.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-brand-500">
                          {a.total_marks} marks
                        </span>
                        {a.due_date && (
                          <span className="text-xs text-brand-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Due {formatDate(a.due_date)}
                          </span>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={a.status} />
                    <span className="text-brand-300 group-hover:text-brand-500 transition-colors ml-1 text-lg">›</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
