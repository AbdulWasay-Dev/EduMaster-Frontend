import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { TrendingUp, Users, ScrollText, CheckSquare, Award } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import StatCard from '@/components/shared/StatCard'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { getDashboardStats, getActivityData, getClassOverview } from '@/lib/api/analytics'
import { listClasses } from '@/lib/api/classes'

const GRADE_COLORS: Record<string, string> = {
  'A+': '#22c55e', A: '#4ade80', B: '#f97316', C: '#fbbf24', D: '#f87171', F: '#ef4444',
}
const PIE_COLORS = ['#f97316', '#ef4444', '#fbbf24', '#22c55e', '#06b6d4']

export default function AnalyticsDashboardPage() {
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  })
  const { data: activity = [], isLoading: loadingActivity } = useQuery({
    queryKey: ['activity-data'],
    queryFn: () => getActivityData(30),
  })
  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: listClasses })
  const { data: classOverview } = useQuery({
    queryKey: ['class-overview', classes[0]?.id],
    queryFn: () => getClassOverview(classes[0]?.id!),
    enabled: !!classes[0]?.id,
  })

  // Synthetic grade distribution from classOverview if available
  const gradeData = classOverview?.grade_distribution
    ? Object.entries(classOverview.grade_distribution).map(([grade, count]) => ({ grade, count }))
    : [
        { grade: 'A+', count: 8 }, { grade: 'A', count: 14 }, { grade: 'B', count: 22 },
        { grade: 'C', count: 18 }, { grade: 'D', count: 9 }, { grade: 'F', count: 4 },
      ]

  const subjectPieData = [
    { name: 'Biology', value: 32 }, { name: 'Chemistry', value: 28 },
    { name: 'Physics', value: 24 }, { name: 'Math', value: 16 },
  ]

  if (loadingStats) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Performance insights across all your classes" />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students"   value={stats?.total_students ?? 0}   delta={stats?.students_delta}   icon={Users}       />
        <StatCard title="Papers Generated" value={stats?.total_papers ?? 0}     delta={stats?.papers_delta}     icon={ScrollText}  />
        <StatCard title="Sheets Graded"    value={stats?.total_graded ?? 0}     delta={stats?.graded_delta}     icon={CheckSquare} />
        <StatCard title="Avg. Score"       value={stats?.avg_score ?? 0}       delta={stats?.score_delta}      icon={TrendingUp} suffix="%" />
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5">
          <h2 className="section-title mb-4">Grading Activity — Last 30 Days</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={activity.length ? activity : Array.from({length:30},(_,i)=>({date:`D${i+1}`,submissions:Math.floor(Math.random()*12),avg_score:Math.floor(65+Math.random()*25)}))}>
              <defs>
                <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2}/>
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffedd5" />
              <XAxis dataKey="date" tick={{fontSize:10,fill:'#9a3412'}} tickLine={false} axisLine={false} interval={6}/>
              <YAxis tick={{fontSize:10,fill:'#9a3412'}} tickLine={false} axisLine={false}/>
              <Tooltip contentStyle={{border:'1px solid #fed7aa',borderRadius:'8px',fontSize:'12px'}}/>
              <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:'11px'}}/>
              <Area type="monotone" dataKey="submissions" stroke="#f97316" strokeWidth={2} fill="url(#actGrad)" name="Submissions"/>
              <Area type="monotone" dataKey="avg_score"   stroke="#ef4444" strokeWidth={2} fill="url(#scoreGrad)" name="Avg Score"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="section-title mb-4">Activity by Subject</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={subjectPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {subjectPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
              </Pie>
              <Tooltip contentStyle={{border:'1px solid #fed7aa',borderRadius:'8px',fontSize:'12px'}}/>
              <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:'11px'}}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="section-title mb-4">Grade Distribution</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={gradeData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffedd5"/>
              <XAxis dataKey="grade" tick={{fontSize:11,fill:'#9a3412'}} tickLine={false} axisLine={false}/>
              <YAxis tick={{fontSize:10,fill:'#9a3412'}} tickLine={false} axisLine={false}/>
              <Tooltip contentStyle={{border:'1px solid #fed7aa',borderRadius:'8px',fontSize:'12px'}}/>
              <Bar dataKey="count" radius={[4,4,0,0]} name="Students">
                {gradeData.map((entry, i) => (
                  <Cell key={i} fill={GRADE_COLORS[entry.grade] ?? '#f97316'}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="section-title mb-4">Score Trend by Week</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={[
              {week:'W1',avg:68},{week:'W2',avg:72},{week:'W3',avg:70},
              {week:'W4',avg:76},{week:'W5',avg:74},{week:'W6',avg:80},
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffedd5"/>
              <XAxis dataKey="week" tick={{fontSize:11,fill:'#9a3412'}} tickLine={false} axisLine={false}/>
              <YAxis domain={[50,100]} tick={{fontSize:10,fill:'#9a3412'}} tickLine={false} axisLine={false}/>
              <Tooltip contentStyle={{border:'1px solid #fed7aa',borderRadius:'8px',fontSize:'12px'}}/>
              <Line type="monotone" dataKey="avg" stroke="#f97316" strokeWidth={2.5} dot={{fill:'#f97316',strokeWidth:0,r:4}} name="Avg Score"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top performers */}
      <div className="card p-5">
        <h2 className="section-title mb-4">Top Performers</h2>
        <div className="space-y-2">
          {[
            {name:'Alice Johnson', score:96, class:'Class 9A'},
            {name:'Bob Martinez',  score:93, class:'Class 9B'},
            {name:'Carol Smith',   score:91, class:'Class 10A'},
            {name:'David Lee',     score:89, class:'Class 9A'},
            {name:'Emma Wilson',   score:87, class:'Class 10B'},
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-6 text-center text-xs font-bold ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-700' : 'text-brand-500'}`}>
                {i + 1}
              </div>
              {i < 3 && <Award className={`w-4 h-4 shrink-0 ${i===0?'text-amber-400':i===1?'text-slate-400':'text-amber-600'}`}/>}
              {i >= 3 && <div className="w-4"/>}
              <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-600">
                {s.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#1C0A00]">{s.name}</p>
                <p className="text-xs text-brand-500">{s.class}</p>
              </div>
              <div className="text-sm font-bold text-brand-600">{s.score}%</div>
              <div className="w-24 h-2 bg-brand-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full" style={{width:`${s.score}%`}}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
