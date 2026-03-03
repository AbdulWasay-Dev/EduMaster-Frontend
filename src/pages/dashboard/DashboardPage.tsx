import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users, BookOpen, ScrollText, CheckSquare, Plus, Upload, FileText, Bot, ArrowRight, ChevronRight } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import PageHeader from '@/components/shared/PageHeader'
import StatCard from '@/components/shared/StatCard'
import StatusBadge from '@/components/shared/StatusBadge'
import { useAuthStore } from '@/store/authStore'
import { listPapers } from '@/lib/api/papers'
import { listClasses } from '@/lib/api/classes'
import { formatDate, gradeColor } from '@/lib/utils'

// Mock activity data for charts
const activityData = Array.from({ length: 30 }, (_, i) => ({
  date: `Day ${i + 1}`,
  submissions: Math.floor(Math.random() * 15),
  avg: Math.floor(65 + Math.random() * 25),
}))

const gradeData = [
  { grade: 'A+', count: 12 },
  { grade: 'A',  count: 18 },
  { grade: 'B',  count: 24 },
  { grade: 'C',  count: 15 },
  { grade: 'D',  count: 7 },
  { grade: 'F',  count: 3 },
]

const recentActivity = [
  { icon: '📄', text: 'Paper "Chapter 5 Quiz" generated', time: '2 minutes ago', color: 'bg-brand-100' },
  { icon: '✅', text: '10 answer sheets graded for Class 9A', time: '1 hour ago', color: 'bg-emerald-100' },
  { icon: '👤', text: 'New student Alice Johnson enrolled', time: '3 hours ago', color: 'bg-cyan-100' },
  { icon: '📁', text: 'Document "Biology Unit 3.pdf" processed', time: '5 hours ago', color: 'bg-amber-100' },
  { icon: '🤖', text: 'AI query answered about photosynthesis', time: 'Yesterday', color: 'bg-violet-100' },
]

const QUICK_ACTIONS = [
  { label: 'Generate Paper',      icon: ScrollText,    to: '/papers/generate',   color: 'from-brand-500 to-brand-600',   desc: 'Create AI-powered exam' },
  { label: 'Grade Answer Sheets', icon: CheckSquare,   to: '/grading/new',       color: 'from-accent-500 to-accent-600', desc: 'Upload & auto-grade' },
  { label: 'Upload Document',     icon: FileText,      to: '/documents/upload',  color: 'from-gold-400 to-gold-600',     desc: 'Add study materials' },
  { label: 'Ask AI Assistant',    icon: Bot,           to: '/ai-assistant',      color: 'from-cyan-500 to-cyan-600',     desc: 'Query your content' },
]

export default function DashboardPage() {
  const user = useAuthStore(s => s.user)

  const { data: papers = [] } = useQuery({
    queryKey: ['papers'],
    queryFn: () => listPapers(),
  })

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: listClasses,
  })

  const recentPapers = papers.slice(0, 5)

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good morning, ${user?.name?.split(' ')[0] ?? 'Teacher'} 👋`}
        subtitle="Here's what's happening in your classroom today."
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Classes"       value={classes.length}     delta={1}  icon={Users}       />
        <StatCard title="Students"      value={classes.reduce((a, c) => a + (c.student_count ?? 0), 0)} delta={5} icon={Users} />
        <StatCard title="Papers"        value={papers.length}      delta={2}  icon={ScrollText}  />
        <StatCard title="Graded Sheets" value={47}                 delta={10} icon={CheckSquare} />
      </div>

      {/* Charts + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area chart */}
        <div className="lg:col-span-2 card p-5">
          <h2 className="section-title mb-4">Grading Activity — Last 30 Days</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="subGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffedd5" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9a3412' }} tickLine={false} axisLine={false} interval={6} />
              <YAxis tick={{ fontSize: 10, fill: '#9a3412' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ border: '1px solid #fed7aa', borderRadius: '8px', fontSize: '12px' }} />
              <Area type="monotone" dataKey="submissions" stroke="#f97316" strokeWidth={2} fill="url(#subGrad)" name="Submissions" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Grade distribution */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Grade Distribution</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={gradeData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffedd5" />
              <XAxis dataKey="grade" tick={{ fontSize: 11, fill: '#9a3412' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9a3412' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ border: '1px solid #fed7aa', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick actions */}
        <div className="lg:col-span-2">
          <h2 className="section-title mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map(({ label, icon: Icon, to, color, desc }) => (
              <Link key={to} to={to}>
                <motion.div
                  whileHover={{ y: -2, boxShadow: '0 10px 40px -8px rgba(28,10,0,0.15)' } as any}
                  className={`bg-gradient-to-br ${color} rounded-xl p-4 text-white cursor-pointer`}
                >
                  <Icon className="w-6 h-6 mb-2 opacity-90" />
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-xs opacity-80 mt-0.5">{desc}</p>
                  <ArrowRight className="w-3.5 h-3.5 mt-2 opacity-70" />
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`flex items-center justify-center w-7 h-7 rounded-lg ${item.color} text-sm shrink-0`}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#1C0A00] leading-snug">{item.text}</p>
                  <p className="text-[10px] text-brand-500 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent papers */}
      {recentPapers.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Recent Papers</h2>
            <Link to="/papers" className="text-sm text-brand-500 font-medium hover:text-brand-700 flex items-center gap-1">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-100">
                  {['Title', 'Questions', 'Marks', 'Created', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-brand-700 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentPapers.map(paper => (
                  <tr key={paper.id} className="border-b border-brand-50 hover:bg-brand-50/50 transition-colors">
                    <td className="py-3 px-3 font-medium text-[#1C0A00]">{paper.title}</td>
                    <td className="py-3 px-3 text-brand-700">{paper.questions?.length ?? 0}</td>
                    <td className="py-3 px-3 text-brand-700">{paper.total_marks}</td>
                    <td className="py-3 px-3 text-brand-700">{formatDate(paper.created_at)}</td>
                    <td className="py-3 px-3">
                      <StatusBadge status={paper.is_published ? 'published' : 'draft'} />
                    </td>
                    <td className="py-3 px-3">
                      <Link to={`/papers/${paper.id}`} className="text-brand-500 hover:text-brand-700 text-xs font-medium">
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

      {/* Classes grid */}
      {classes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title">My Classes</h2>
            <Link to="/classes" className="text-sm text-brand-500 font-medium hover:text-brand-700 flex items-center gap-1">
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
                    <h3 className="font-semibold text-[#1C0A00]">{cls.name}</h3>
                    <StatusBadge status={cls.is_active ? 'active' : 'inactive'} />
                  </div>
                  <p className="text-xs text-brand-600">{cls.grade_level} · {cls.academic_year}</p>
                  <div className="flex items-center gap-1 mt-3">
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
    </div>
  )
}
