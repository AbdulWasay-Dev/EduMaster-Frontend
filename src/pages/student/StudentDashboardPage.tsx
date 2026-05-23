import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ClipboardList, CheckCircle2, Trophy, BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { getStudentDashboard } from '@/lib/api/student-portal'
import { useStudentAuthStore } from '@/store/studentAuthStore'

export default function StudentDashboardPage() {
  const student = useStudentAuthStore((s) => s.student)

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: getStudentDashboard,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const stats = [
    {
      label: 'Pending Assignments',
      value: dashboard?.pending_assignments ?? 0,
      icon: ClipboardList,
      color: 'bg-amber-500',
      link: '/student/assignments',
    },
    {
      label: 'Completed',
      value: dashboard?.completed_assignments ?? 0,
      icon: CheckCircle2,
      color: 'bg-green-500',
      link: '/student/assignments',
    },
    {
      label: 'Average Score',
      value: dashboard?.average_score != null ? `${dashboard.average_score}%` : 'N/A',
      icon: Trophy,
      color: 'bg-brand-500',
      link: '/student/scores',
    },
    {
      label: 'Class',
      value: dashboard?.class_name ?? 'N/A',
      icon: BookOpen,
      color: 'bg-indigo-500',
      link: '/student/subjects',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Welcome back, {student?.full_name ?? dashboard?.student_name ?? 'Student'}!
        </h1>
        <p className="text-slate-500 text-sm mt-1">Here's an overview of your academic progress.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Link
            key={i}
            to={s.link}
            className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${s.color} text-white shrink-0`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">{s.label}</p>
                <p className="text-xl font-bold text-slate-800 group-hover:text-brand-600 transition-colors">
                  {s.value}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/student/assignments"
            className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
          >
            View Assignments
          </Link>
          <Link
            to="/student/scores"
            className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            Check Scores
          </Link>
          <Link
            to="/student/ask-ai"
            className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            Ask AI
          </Link>
        </div>
      </div>

      {/* Verification notice */}
      {student && !student.is_verified && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800">
            <strong>Account Pending Verification</strong> — Your teacher needs to approve your account. 
            You can still view assignments but some features may be limited.
          </p>
        </div>
      )}
    </motion.div>
  )
}
