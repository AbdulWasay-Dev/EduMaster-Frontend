import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Users, ScrollText, CheckSquare, Award, AlertTriangle, ChevronRight } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import StatCard from '@/components/shared/StatCard'
import GradeCircle from '@/components/shared/GradeCircle'
import EmptyState from '@/components/shared/EmptyState'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { listClasses } from '@/lib/api/classes'
import { listSubmissions } from '@/lib/api/grading'
import { listPapers } from '@/lib/api/papers'

const GRADE_BANDS = [
  { label: 'A+', min: 90, max: 101, color: '#22c55e' },
  { label: 'A',  min: 80, max: 90,  color: '#4ade80' },
  { label: 'B',  min: 65, max: 80,  color: '#f97316' },
  { label: 'C',  min: 50, max: 65,  color: '#fbbf24' },
  { label: 'D',  min: 35, max: 50,  color: '#fb923c' },
  { label: 'F',  min: 0,  max: 35,  color: '#ef4444' },
]

export default function AnalyticsDashboardPage() {
  const [selectedClassId, setSelectedClassId] = useState<string>('all')

  const { data: classes = [], isLoading: loadingClasses } = useQuery({
    queryKey: ['classes'], queryFn: listClasses,
  })
  const { data: submissions = [], isLoading: loadingSubs } = useQuery({
    queryKey: ['submissions'], queryFn: () => listSubmissions(),
  })
  const { data: papers = [] } = useQuery({
    queryKey: ['papers'], queryFn: () => listPapers(),
  })

  const isLoading = loadingClasses || loadingSubs

  // Filter submissions by selected class
  const filteredSubs = selectedClassId === 'all'
    ? submissions
    : submissions.filter(s => s.class_id === selectedClassId)

  const gradedSubs = filteredSubs.filter(s => s.status === 'graded')

  const getPct = (s: typeof submissions[0]) =>
    s.grade_percentage ?? (s.max_score ? Math.round(((s.total_score ?? 0) / s.max_score) * 100) : 0)

  // Global stats (always all-class)
  const totalStudents = classes.reduce((a, c) => a + (c.student_count ?? 0), 0)
  const overallAvg = gradedSubs.length
    ? Math.round(gradedSubs.reduce((a, s) => a + getPct(s), 0) / gradedSubs.length)
    : 0

  // Grade distribution for chart
  const gradeDistData = GRADE_BANDS.map(band => ({
    grade: band.label,
    count: gradedSubs.filter(s => { const p = getPct(s); return p >= band.min && p < band.max }).length,
    fill: band.color,
  })).filter(d => d.count > 0)

  // Students needing attention (< 50% in latest submission)
  const studentMap = new Map<string, { name: string; pct: number; paperId: string; subId: string }>()
  for (const sub of gradedSubs) {
    const key = sub.student_id
    const pct = getPct(sub)
    const existing = studentMap.get(key)
    if (!existing || pct < existing.pct) {
      studentMap.set(key, { name: sub.student_name ?? 'Unknown', pct, paperId: sub.paper_id, subId: sub.id })
    }
  }
  const needsAttention = [...studentMap.values()].filter(s => s.pct < 50).sort((a, b) => a.pct - b.pct)

  // Top performers
  const topStudents = [...studentMap.values()].filter(s => s.pct >= 80).sort((a, b) => b.pct - a.pct).slice(0, 5)

  // Paper stats
  const paperStats = papers.map(paper => {
    const subs = gradedSubs.filter(s => s.paper_id === paper.id)
    if (!subs.length) return null
    const pcts = subs.map(getPct)
    const avg = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length)
    const high = Math.max(...pcts)
    const low = Math.min(...pcts)
    return { id: paper.id, title: paper.title, count: subs.length, avg, high, low }
  }).filter(Boolean) as { id: string; title: string; count: number; avg: number; high: number; low: number }[]

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Real performance insights across your classes"
        action={
          <select
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            className="input text-sm py-1.5"
          >
            <option value="all">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        }
      />

      {/* KPI row — all real */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Classes"      value={classes.length}    icon={Users}       />
        <StatCard title="Students"     value={totalStudents}     icon={Users}       />
        <StatCard title="Papers"       value={papers.length}     icon={ScrollText}  />
        <StatCard title="Avg Score"    value={overallAvg}        icon={TrendingUp}  suffix="%" />
      </div>

      {gradedSubs.length === 0 ? (
        <div className="card p-5">
          <EmptyState
            icon={CheckSquare}
            title="No grading data yet"
            description="Grade some answer sheets to see performance analytics here."
            action={<Link to="/grading/new" className="btn-primary flex items-center gap-2"><CheckSquare className="w-4 h-4" /> Start Grading</Link>}
          />
        </div>
      ) : (
        <>
          {/* Grade Distribution + Needs Attention */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Grade distribution — real data */}
            <div className="card p-5">
              <h2 className="section-title mb-4">Grade Distribution</h2>
              {gradeDistData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={gradeDistData} barSize={36}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffedd5" />
                    <XAxis dataKey="grade" tick={{ fontSize: 11, fill: '#9a3412' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#9a3412' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ border: '1px solid #dbeafe', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(v) => [`${v} students`, 'Count']}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Students">
                      {gradeDistData.map((entry, i) => (
                        <rect key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-brand-500 text-center py-8">No graded data for selected filter.</p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                {GRADE_BANDS.map(b => (
                  <span key={b.label} className="flex items-center gap-1 text-xs text-brand-600">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: b.color }} />
                    {b.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Needs Attention */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-accent-500" />
                <h2 className="section-title">Needs Attention</h2>
                {needsAttention.length > 0 && (
                  <span className="ml-auto text-xs bg-accent-100 text-accent-700 font-semibold px-2 py-0.5 rounded-full">
                    {needsAttention.length} student{needsAttention.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {needsAttention.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-emerald-600 font-medium">✅ All students above 50%</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {needsAttention.slice(0, 6).map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center text-xs font-bold text-red-600 shrink-0">
                        {s.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0f172a] truncate">{s.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <GradeCircle percentage={s.pct} size={36} />
                        <Link to={`/grading/${s.subId}`} className="text-xs text-brand-500 hover:text-brand-700">
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top Performers */}
          {topStudents.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-4 h-4 text-amber-500" />
                <h2 className="section-title">Top Performers</h2>
              </div>
              <div className="space-y-2">
                {topStudents.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={`w-6 text-center text-xs font-bold ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-700' : 'text-brand-500'}`}>
                      {i + 1}
                    </span>
                    {i < 3 && <Award className={`w-4 h-4 shrink-0 ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-400' : 'text-amber-600'}`} />}
                    {i >= 3 && <div className="w-4" />}
                    <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-600 shrink-0">
                      {s.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#0f172a]">{s.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-brand-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${s.pct}%` }} />
                      </div>
                      <span className="text-sm font-bold text-emerald-600 w-12 text-right">{s.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Paper Statistics */}
          {paperStats.length > 0 && (
            <div className="card p-5">
              <h2 className="section-title mb-4">Paper Statistics</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-100">
                      {['Paper', 'Submissions', 'Avg Score', 'Highest', 'Lowest', ''].map(h => (
                        <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-brand-700 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paperStats.map(p => (
                      <tr key={p.id} className="border-b border-brand-50 hover:bg-brand-50/50 transition-colors">
                        <td className="py-3 px-3 font-medium text-[#0f172a]">{p.title}</td>
                        <td className="py-3 px-3 text-brand-600">{p.count}</td>
                        <td className="py-3 px-3">
                          <span className={`font-bold ${p.avg >= 80 ? 'text-emerald-600' : p.avg >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                            {p.avg}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-emerald-600 font-medium">{p.high}%</td>
                        <td className="py-3 px-3 text-red-500 font-medium">{p.low}%</td>
                        <td className="py-3 px-3">
                          <Link to={`/papers/${p.id}`} className="text-xs text-brand-500 hover:text-brand-700 font-medium">View →</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Class Performance Snapshot */}
          {classes.length > 0 && selectedClassId === 'all' && (
            <div className="card p-5">
              <h2 className="section-title mb-4">Class Performance Snapshot</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {classes.map(cls => {
                  const classSubs = gradedSubs.filter(s => s.class_id === cls.id)
                  const avg = classSubs.length
                    ? Math.round(classSubs.reduce((a, s) => a + getPct(s), 0) / classSubs.length)
                    : null
                  return (
                    <Link key={cls.id} to={`/classes/${cls.id}`}>
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-brand-100 hover:border-brand-300 hover:bg-brand-50 transition-all">
                        <div className="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
                          <Users className="w-4 h-4 text-brand-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-[#0f172a] truncate">{cls.name}</p>
                          <p className="text-xs text-brand-500">{cls.student_count ?? 0} students · {classSubs.length} graded</p>
                        </div>
                        {avg !== null ? (
                          <GradeCircle percentage={avg} size={40} />
                        ) : (
                          <span className="text-xs text-brand-400">No data</span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
