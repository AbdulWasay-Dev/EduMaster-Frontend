import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Users, ScrollText, CheckSquare, Plus, FileText, Bot,
  ArrowRight, ChevronRight, AlertCircle, Clock, BookOpen,
} from 'lucide-react'
import { motion } from 'framer-motion'
import PageHeader from '@/components/shared/PageHeader'
import StatCard from '@/components/shared/StatCard'
import StatusBadge from '@/components/shared/StatusBadge'
import GradeCircle from '@/components/shared/GradeCircle'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { useAuthStore } from '@/store/authStore'
import { listPapers } from '@/lib/api/papers'
import { listClasses } from '@/lib/api/classes'
import { listSubmissions } from '@/lib/api/grading'
import { formatDate, gradeLabel } from '@/lib/utils'

const QUICK_ACTIONS = [
  {
    label: 'Generate Paper',
    icon: ScrollText,
    to: '/papers/generate',
    color: 'from-brand-500 to-brand-600',
    desc: 'Create AI-powered exam',
  },
  {
    label: 'Grade Answer Sheets',
    icon: CheckSquare,
    to: '/grading/new',
    color: 'from-accent-500 to-accent-600',
    desc: 'Upload & auto-grade',
  },
  {
    label: 'Upload Document',
    icon: FileText,
    to: '/documents/upload',
    color: 'from-gold-400 to-gold-600',
    desc: 'Add study materials',
  },
  {
    label: 'Ask AI Assistant',
    icon: Bot,
    to: '/ai-assistant',
    color: 'from-cyan-500 to-cyan-600',
    desc: 'Query your content',
  },
]

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardPage() {
  const user = useAuthStore(s => s.user)

  const { data: papers = [], isLoading: loadingPapers } = useQuery({
    queryKey: ['papers'],
    queryFn: () => listPapers(),
  })

  const { data: classes = [], isLoading: loadingClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: listClasses,
  })

  const { data: submissions = [], isLoading: loadingSubmissions } = useQuery({
    queryKey: ['submissions'],
    queryFn: () => listSubmissions(),
  })

  // Real computed stats
  const totalStudents = classes.reduce((a, c) => a + (c.student_count ?? 0), 0)
  const gradedSubmissions = submissions.filter(s => s.status === 'graded')
  const pendingSubmissions = submissions.filter(s => s.status === 'pending' || s.status === 'review')

  // Average score across all graded submissions
  const avgScore = gradedSubmissions.length
    ? Math.round(
        gradedSubmissions.reduce((acc, s) => {
          const pct = s.grade_percentage ?? (s.max_score ? Math.round(((s.total_score ?? 0) / s.max_score) * 100) : 0)
          return acc + pct
        }, 0) / gradedSubmissions.length,
      )
    : null

  const recentPapers = papers.slice(0, 5)

  const isLoading = loadingPapers || loadingClasses || loadingSubmissions

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${getGreeting()}, ${user?.name?.split(' ')[0] ?? 'Teacher'} 👋`}
        subtitle={`${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
      />

      {/* ── Stat Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Classes" value={classes.length} icon={Users} />
        <StatCard title="Students" value={totalStudents} icon={Users} />
        <StatCard title="Papers" value={papers.length} icon={ScrollText} />
        <StatCard
          title="Avg Score"
          value={avgScore ?? 0}
          suffix="%"
          icon={CheckSquare}
          deltaLabel={avgScore !== null ? 'across graded sheets' : ''}
        />
      </div>

      {/* ── Needs Attention + Quick Actions ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Needs Attention — real pending grading */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-accent-500" />
              <h2 className="section-title">Needs Attention</h2>
            </div>
            {pendingSubmissions.length > 0 && (
              <span className="text-xs bg-accent-100 text-accent-700 font-semibold px-2 py-0.5 rounded-full">
                {pendingSubmissions.length} pending
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8"><LoadingSpinner size="md" /></div>
          ) : pendingSubmissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckSquare className="w-10 h-10 text-emerald-400 mb-3" />
              <p className="font-medium text-[#1C0A00]">All caught up!</p>
              <p className="text-xs text-brand-500 mt-1">No pending answer sheets to grade.</p>
              <Link to="/grading/new" className="btn-primary mt-4 flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" /> Grade New Batch
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingSubmissions.slice(0, 5).map(sub => (
                <Link
                  key={sub.id}
                  to={`/grading/${sub.id}`}
                  className="flex items-center justify-between p-3 rounded-xl border border-brand-100 hover:border-brand-300 hover:bg-brand-50/60 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-accent-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1C0A00]">
                        {sub.student_name ?? 'Unknown Student'}
                      </p>
                      <p className="text-xs text-brand-500">
                        {sub.paper_title ?? 'Untitled Paper'} · {formatDate(sub.submitted_at ?? sub.created_at ?? '')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={sub.status} />
                    <ArrowRight className="w-3.5 h-3.5 text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
              {pendingSubmissions.length > 5 && (
                <Link
                  to="/grading"
                  className="flex items-center justify-center gap-1 text-xs text-brand-500 hover:text-brand-700 font-medium py-2 transition-colors"
                >
                  +{pendingSubmissions.length - 5} more <ChevronRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="section-title mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map(({ label, icon: Icon, to, color, desc }) => (
              <Link key={to} to={to}>
                <motion.div
                  whileHover={{ y: -2, boxShadow: '0 10px 40px -8px rgba(28,10,0,0.15)' } as any}
                  className={`bg-gradient-to-br ${color} rounded-xl p-4 text-white cursor-pointer h-full`}
                >
                  <Icon className="w-6 h-6 mb-2 opacity-90" />
                  <p className="font-semibold text-sm leading-tight">{label}</p>
                  <p className="text-xs opacity-80 mt-0.5">{desc}</p>
                  <ArrowRight className="w-3.5 h-3.5 mt-2 opacity-70" />
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Graded Results ─────────────────────────────────────── */}
      {gradedSubmissions.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Recent Grading Results</h2>
            <Link
              to="/grading"
              className="text-sm text-brand-500 font-medium hover:text-brand-700 flex items-center gap-1"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-100">
                  {['Student', 'Paper', 'Score', '%', 'Grade', 'Date'].map(h => (
                    <th
                      key={h}
                      className="text-left py-2 px-3 text-xs font-semibold text-brand-700 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gradedSubmissions.slice(0, 5).map(sub => {
                  const pct = sub.grade_percentage
                    ?? (sub.max_score ? Math.round(((sub.total_score ?? 0) / sub.max_score) * 100) : 0)
                  return (
                    <tr
                      key={sub.id}
                      className="border-b border-brand-50 hover:bg-brand-50/50 transition-colors"
                    >
                      <td className="py-3 px-3 font-medium text-[#1C0A00]">
                        {sub.student_name ?? '—'}
                      </td>
                      <td className="py-3 px-3 text-brand-600 text-xs">
                        {sub.paper_title ?? '—'}
                      </td>
                      <td className="py-3 px-3 text-brand-700">
                        {sub.total_score ?? sub.score ?? 0}/{sub.max_score ?? sub.total_marks ?? 0}
                      </td>
                      <td className="py-3 px-3">
                        <GradeCircle percentage={pct} size={36} />
                      </td>
                      <td className={`py-3 px-3 font-bold text-sm ${pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                        {gradeLabel(pct)}
                      </td>
                      <td className="py-3 px-3 text-brand-500 text-xs">
                        {formatDate(sub.graded_at ?? sub.created_at ?? '')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Recent Papers ─────────────────────────────────────────────── */}
      {recentPapers.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Recent Papers</h2>
            <Link
              to="/papers"
              className="text-sm text-brand-500 font-medium hover:text-brand-700 flex items-center gap-1"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-100">
                  {['Title', 'Questions', 'Marks', 'Created', 'Status', ''].map(h => (
                    <th
                      key={h}
                      className="text-left py-2 px-3 text-xs font-semibold text-brand-700 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentPapers.map(paper => (
                  <tr
                    key={paper.id}
                    className="border-b border-brand-50 hover:bg-brand-50/50 transition-colors"
                  >
                    <td className="py-3 px-3 font-medium text-[#1C0A00]">{paper.title}</td>
                    <td className="py-3 px-3 text-brand-700">{paper.questions?.length ?? 0}</td>
                    <td className="py-3 px-3 text-brand-700">{paper.total_marks}</td>
                    <td className="py-3 px-3 text-brand-700">{formatDate(paper.created_at)}</td>
                    <td className="py-3 px-3">
                      <StatusBadge status={paper.is_published ? 'published' : 'draft'} />
                    </td>
                    <td className="py-3 px-3">
                      <Link
                        to={`/papers/${paper.id}`}
                        className="text-brand-500 hover:text-brand-700 text-xs font-medium"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── My Classes ───────────────────────────────────────────────── */}
      {classes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title">My Classes</h2>
            <Link
              to="/classes"
              className="text-sm text-brand-500 font-medium hover:text-brand-700 flex items-center gap-1"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {classes.slice(0, 3).map(cls => (
              <Link key={cls.id} to={`/classes/${cls.id}`}>
                <motion.div
                  whileHover={{ y: -2, boxShadow: '0 10px 40px -8px rgba(28,10,0,0.12)' } as any}
                  className="card p-4 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-brand-100 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-brand-600" />
                      </div>
                      <h3 className="font-semibold text-[#1C0A00]">{cls.name}</h3>
                    </div>
                    <StatusBadge status={cls.is_active ? 'active' : 'inactive'} />
                  </div>
                  <p className="text-xs text-brand-600 ml-10">{cls.grade_level} · {cls.academic_year}</p>
                  <div className="flex items-center gap-1 mt-3 ml-10">
                    <Users className="w-3.5 h-3.5 text-brand-400" />
                    <span className="text-xs text-brand-600">{cls.student_count ?? 0} students</span>
                  </div>
                </motion.div>
              </Link>
            ))}
            <Link to="/classes/new">
              <div className="card p-4 flex flex-col items-center justify-center gap-2 cursor-pointer border-dashed hover:border-brand-400 hover:bg-brand-50 transition-all group min-h-[100px]">
                <Plus className="w-6 h-6 text-brand-400 group-hover:text-brand-500" />
                <span className="text-sm font-medium text-brand-500">New Class</span>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* ── Empty state when truly new user ─────────────────────────── */}
      {!isLoading && classes.length === 0 && papers.length === 0 && (
        <div className="card p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-brand-500" />
          </div>
          <h3 className="text-lg font-bold text-[#1C0A00] mb-2">Welcome! Let's get started.</h3>
          <p className="text-brand-600 text-sm mb-6 max-w-sm mx-auto">
            Set up your first class, upload your study materials, and generate AI-powered exam papers in minutes.
          </p>
          <div className="flex justify-center gap-3">
            <Link to="/classes/new" className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Class
            </Link>
            <Link to="/documents/upload" className="btn-ghost flex items-center gap-2">
              <FileText className="w-4 h-4" /> Upload Document
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
