import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Users, ScrollText, CheckSquare, Plus, FileText, Bot,
  ArrowRight, ChevronRight, AlertCircle, Clock, BookOpen,
  Bell, Calendar, Activity,
} from 'lucide-react'
import { motion } from 'framer-motion'
import PageHeader from '@/components/shared/PageHeader'
import StatCard from '@/components/shared/StatCard'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { useAuthStore } from '@/store/authStore'
import { listPapers } from '@/lib/api/papers'
import { listClasses } from '@/lib/api/classes'
import { listSubmissions } from '@/lib/api/grading'
import { formatDate, gradeLabel } from '@/lib/utils'

const QUICK_ACTIONS = [
  { label: 'Generate Paper', icon: ScrollText, to: '/papers/generate', desc: 'Create AI-powered exam' },
  { label: 'Grade Sheets', icon: CheckSquare, to: '/grading/new', desc: 'Upload & auto-grade' },
  { label: 'Upload Document', icon: FileText, to: '/documents/upload', desc: 'Add study materials' },
  { label: 'Ask AI Assistant', icon: Bot, to: '/ai-assistant', desc: 'Query your content' },
]

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.06 } }),
}

/* ── Mock notifications (replace with real API later) ── */
function getNotifications(pendingCount: number, papersCount: number) {
  const notifs = []
  if (pendingCount > 0) {
    notifs.push({
      id: 'pending',
      icon: AlertCircle,
      iconBg: '#fef2f2',
      iconColor: '#ef4444',
      title: `${pendingCount} submission${pendingCount > 1 ? 's' : ''} need grading`,
      time: 'Just now',
      to: '/grading',
    })
  }
  if (papersCount > 0) {
    notifs.push({
      id: 'papers',
      icon: ScrollText,
      iconBg: '#EFF6FF',
      iconColor: '#0281FF',
      title: `${papersCount} paper${papersCount > 1 ? 's' : ''} generated this week`,
      time: 'This week',
      to: '/papers',
    })
  }
  notifs.push(
    { id: 'welcome', icon: Bell, iconBg: '#f0fdf4', iconColor: '#22c55e', title: 'Welcome to EduMaster! Start by creating a class.', time: 'Today', to: '/classes/new' },
    { id: 'tip', icon: Bot, iconBg: '#faf5ff', iconColor: '#a855f7', title: 'Tip: Use AI Assistant to query your documents', time: 'Tip', to: '/ai-assistant' },
  )
  return notifs.slice(0, 5)
}

/* ── Calendar brief (mock schedule) ── */
function getCalendarItems() {
  const today = new Date()
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return {
      day: dayNames[d.getDay()],
      date: d.getDate(),
      isToday: i === 0,
    }
  })
  return days
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

  const totalStudents = classes.reduce((a, c) => a + (c.student_count ?? 0), 0)
  const gradedSubmissions = submissions.filter(s => s.status === 'graded')
  const pendingSubmissions = submissions.filter(s => s.status === 'pending' || s.status === 'review')

  const avgScore = gradedSubmissions.length
    ? Math.round(
        gradedSubmissions.reduce((acc, s) => {
          const pct = s.grade_percentage ?? (s.max_score ? Math.round(((s.total_score ?? 0) / s.max_score) * 100) : 0)
          return acc + pct
        }, 0) / gradedSubmissions.length,
      )
    : null

  const isLoading = loadingPapers || loadingClasses || loadingSubmissions
  const notifications = getNotifications(pendingSubmissions.length, papers.length)
  const calendarDays = getCalendarItems()

  // Build recent activities from all sources
  const recentActivities = [
    ...gradedSubmissions.slice(0, 3).map(s => ({
      id: `grade-${s.id}`,
      icon: CheckSquare,
      iconBg: '#f0fdf4',
      iconColor: '#22c55e',
      title: `Graded ${s.student_name ?? 'student'}'s submission`,
      subtitle: s.paper_title ?? 'Paper',
      time: formatDate(s.graded_at ?? s.created_at ?? ''),
      to: `/grading/${s.id}`,
    })),
    ...papers.slice(0, 3).map(p => ({
      id: `paper-${p.id}`,
      icon: ScrollText,
      iconBg: '#EFF6FF',
      iconColor: '#0281FF',
      title: `Created paper "${p.title}"`,
      subtitle: `${p.questions?.length ?? 0} questions · ${p.total_marks} marks`,
      time: formatDate(p.created_at),
      to: `/papers/${p.id}`,
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 6)

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <PageHeader
        title={`${getGreeting()}, ${user?.name?.split(' ')[0] ?? 'Teacher'} 👋`}
        subtitle={`${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
      />

      {/* ── Stat Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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

      {/* ── Quick Actions ── */}
      <motion.div initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {QUICK_ACTIONS.map(({ label, icon: Icon, to, desc }, i) => (
          <motion.div key={to} custom={i} variants={fadeUp}>
            <Link to={to}>
              <div
                className="group relative overflow-hidden rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #0281FF 0%, #0270e0 100%)' }}
              >
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
                <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-white/5 -translate-x-4 translate-y-4" />
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-white/20">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="font-semibold text-[14px] text-white leading-tight">{label}</p>
                <p className="text-[12px] text-white/70 mt-1">{desc}</p>
                <ArrowRight className="w-4 h-4 text-white/40 mt-3 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Notifications + Calendar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Notifications Panel */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#e2e8f0] p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#EFF6FF' }}>
                <Bell className="w-4 h-4" style={{ color: '#0281FF' }} />
              </div>
              <h2 className="text-[15px] font-bold text-[#0f172a]">Notifications</h2>
            </div>
            <Link to="/notifications" className="text-[12px] font-medium flex items-center gap-0.5 hover:underline" style={{ color: '#0281FF' }}>
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8"><LoadingSpinner size="md" /></div>
          ) : (
            <div className="space-y-2">
              {notifications.map(n => (
                <Link
                  key={n.id}
                  to={n.to}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[#f1f5f9] hover:border-[#0281FF]/20 hover:bg-[#f8fafc] transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: n.iconBg }}>
                    <n.icon className="w-4 h-4" style={{ color: n.iconColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[#0f172a] truncate">{n.title}</p>
                    <p className="text-[11px] text-[#94a3b8]">{n.time}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#94a3b8] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Calendar Brief */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e2e8f0] p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#EFF6FF' }}>
                <Calendar className="w-4 h-4" style={{ color: '#0281FF' }} />
              </div>
              <h2 className="text-[15px] font-bold text-[#0f172a]">Calendar</h2>
            </div>
            <Link to="/schedule" className="text-[12px] font-medium flex items-center gap-0.5 hover:underline" style={{ color: '#0281FF' }}>
              Full view <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Week strip */}
          <div className="flex items-center justify-between gap-1 mb-5">
            {calendarDays.map(d => (
              <div
                key={d.date}
                className="flex flex-col items-center gap-1 py-2 px-2.5 sm:px-3 rounded-xl transition-all cursor-pointer"
                style={{
                  background: d.isToday ? '#0281FF' : 'transparent',
                  color: d.isToday ? 'white' : '#64748b',
                }}
              >
                <span className="text-[10px] font-semibold uppercase">{d.day}</span>
                <span className={`text-[16px] font-bold ${d.isToday ? 'text-white' : 'text-[#0f172a]'}`}>{d.date}</span>
              </div>
            ))}
          </div>

          {/* Upcoming items */}
          <div className="space-y-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8]">Today's Schedule</p>
            {classes.length > 0 ? (
              classes.slice(0, 3).map(cls => (
                <Link
                  key={cls.id}
                  to={`/classes/${cls.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#f8fafc] transition-all"
                >
                  <div className="w-1 h-8 rounded-full" style={{ background: '#0281FF' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#0f172a] truncate">{cls.name}</p>
                    <p className="text-[11px] text-[#94a3b8]">{cls.grade_level} · {cls.student_count ?? 0} students</p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-[13px] text-[#94a3b8] py-3 text-center">No classes scheduled today</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Activities ── */}
      {recentActivities.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#f0fdf4' }}>
                <Activity className="w-4 h-4 text-emerald-500" />
              </div>
              <h2 className="text-[15px] font-bold text-[#0f172a]">Recent Activities</h2>
            </div>
          </div>

          {/* Desktop list */}
          <div className="hidden sm:block space-y-2">
            {recentActivities.map(a => (
              <Link
                key={a.id}
                to={a.to}
                className="flex items-center gap-3 p-3 rounded-xl border border-[#f1f5f9] hover:border-[#0281FF]/20 hover:bg-[#f8fafc] transition-all group"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: a.iconBg }}>
                  <a.icon className="w-4 h-4" style={{ color: a.iconColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#0f172a] truncate">{a.title}</p>
                  <p className="text-[11px] text-[#94a3b8]">{a.subtitle}</p>
                </div>
                <span className="text-[11px] text-[#94a3b8] shrink-0">{a.time}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#94a3b8] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </Link>
            ))}
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {recentActivities.map(a => (
              <Link
                key={a.id}
                to={a.to}
                className="block p-3 rounded-xl border border-[#f1f5f9] hover:border-[#0281FF]/20 transition-all"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: a.iconBg }}>
                    <a.icon className="w-3.5 h-3.5" style={{ color: a.iconColor }} />
                  </div>
                  <p className="text-[12px] font-semibold text-[#0f172a] truncate flex-1">{a.title}</p>
                </div>
                <p className="text-[11px] text-[#94a3b8] pl-9">{a.subtitle} · {a.time}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── My Classes ── */}
      {classes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-bold text-[#0f172a]">My Classes</h2>
            <Link to="/classes" className="text-[12px] font-medium flex items-center gap-0.5 hover:underline" style={{ color: '#0281FF' }}>
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {classes.slice(0, 3).map(cls => (
              <Link key={cls.id} to={`/classes/${cls.id}`}>
                <motion.div
                  whileHover={{ y: -2 } as any}
                  className="bg-white rounded-2xl border border-[#e2e8f0] p-4 sm:p-5 cursor-pointer transition-shadow hover:shadow-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#EFF6FF' }}>
                        <BookOpen className="w-4 h-4" style={{ color: '#0281FF' }} />
                      </div>
                      <h3 className="font-semibold text-[14px] text-[#0f172a]">{cls.name}</h3>
                    </div>
                    <StatusBadge status={cls.is_active ? 'active' : 'inactive'} />
                  </div>
                  <p className="text-[12px] text-[#94a3b8] ml-[46px]">{cls.grade_level} · {cls.academic_year}</p>
                  <div className="flex items-center gap-1.5 mt-3 ml-[46px]">
                    <Users className="w-3.5 h-3.5 text-[#94a3b8]" />
                    <span className="text-[12px] text-[#64748b]">{cls.student_count ?? 0} students</span>
                  </div>
                </motion.div>
              </Link>
            ))}
            <Link to="/classes/new">
              <div className="bg-white rounded-2xl border border-dashed border-[#cbd5e1] p-5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#0281FF] hover:bg-[#f8fafc] transition-all group min-h-[120px]">
                <Plus className="w-6 h-6 text-[#94a3b8] group-hover:text-[#0281FF] transition-colors" />
                <span className="text-[13px] font-semibold text-[#94a3b8] group-hover:text-[#0281FF] transition-colors">New Class</span>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && classes.length === 0 && papers.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-10 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#EFF6FF' }}>
            <BookOpen className="w-8 h-8" style={{ color: '#0281FF' }} />
          </div>
          <h3 className="text-[18px] font-bold text-[#0f172a] mb-2">Welcome! Let's get started.</h3>
          <p className="text-[14px] text-[#64748b] mb-6 max-w-sm mx-auto">
            Set up your first class, upload your study materials, and generate AI-powered exam papers in minutes.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              to="/classes/new"
              className="h-[44px] px-6 flex items-center justify-center gap-2 rounded-xl text-[14px] font-semibold transition-all"
              style={{ background: '#0f172a', color: 'white' }}
            >
              <Plus className="w-4 h-4" /> Create Class
            </Link>
            <Link
              to="/documents/upload"
              className="h-[44px] px-6 flex items-center justify-center gap-2 rounded-xl text-[14px] font-semibold border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc] transition-all"
            >
              <FileText className="w-4 h-4" /> Upload Document
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
