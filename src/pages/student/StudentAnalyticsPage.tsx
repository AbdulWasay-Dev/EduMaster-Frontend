import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Trophy, TrendingUp, BookOpen, ClipboardList } from 'lucide-react'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { getStudentAnalytics } from '@/lib/api/student-portal'

export default function StudentAnalyticsPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['student-analytics'],
    queryFn: getStudentAnalytics,
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>
  }

  const trendData = (analytics?.trend || []).map((item: { date: string; percentage: number; assignment_title: string; subject_name?: string }) => ({
    name: item.assignment_title,
    value: item.percentage,
    subject: item.subject_name || '',
  }))

  const subjectData = (analytics?.subject_performance || []).map((item: { name: string; average: number }) => ({
    name: item.name,
    average: item.average,
  }))

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Performance Analytics</h1>
        <p className="text-slate-500 text-sm mt-1">Track your learning progress across assignments, subjects, and graded papers.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Overall', value: `${analytics?.overall_percentage ?? 0}%`, icon: Trophy, color: 'bg-sky-500' },
          { label: 'Graded Items', value: analytics?.total_graded ?? 0, icon: ClipboardList, color: 'bg-green-500' },
          { label: 'Subjects', value: analytics?.subject_performance?.length ?? 0, icon: BookOpen, color: 'bg-indigo-500' },
          { label: 'Trending Up', value: analytics?.recent_trend?.length ?? 0, icon: TrendingUp, color: 'bg-amber-500' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl ${card.color} text-white flex items-center justify-center`}>
              <card.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">{card.label}</p>
              <p className="text-2xl font-bold text-slate-800">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Grade Trend</h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="studentTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#0EA5E9" fillOpacity={1} fill="url(#studentTrend)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Subject Averages</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={subjectData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="average" fill="#14B8A6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Recent Results</h2>
        <div className="space-y-3">
          {(analytics?.recent_trend || []).map((item: { assignment_title: string; subject_name?: string; percentage: number; score: number; total_marks: number; date: string }) => (
            <div key={`${item.assignment_title}-${item.date}`} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
              <div>
                <p className="text-sm font-medium text-slate-800">{item.assignment_title}</p>
                <p className="text-xs text-slate-500">{item.subject_name || 'Subject'} · {item.score}/{item.total_marks}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-800">{item.percentage}%</p>
                <p className="text-xs text-slate-400">{item.date ? new Date(item.date).toLocaleDateString() : 'Recently'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}