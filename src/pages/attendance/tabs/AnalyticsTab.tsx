import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, TrendingUp, TrendingDown, AlertTriangle, Users, Calendar, BarChart2, Activity } from 'lucide-react'
import { getAttendanceOverview, getClassAnalytics } from '@/lib/api/attendance'
import type { AttendanceOverview, ClassAnalytics } from '@/lib/api/attendance'

interface Props { classId: string; subjectId: string }

export default function AnalyticsTab({ classId, subjectId }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const thirtyAgo = new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0]
  const [startDate, setStartDate] = useState(thirtyAgo)
  const [endDate, setEndDate]     = useState(today)

  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['attendance-overview', classId, subjectId],
    queryFn:  () => getAttendanceOverview(classId, subjectId),
    enabled:  !!classId && !!subjectId,
  })

  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['class-analytics', classId, subjectId, startDate, endDate],
    queryFn:  () => getClassAnalytics(classId, subjectId, startDate, endDate),
    enabled:  !!classId && !!subjectId,
  })

  const isLoading = loadingOverview || loadingAnalytics

  return (
    <div className="space-y-5">
      {/* Date Range Controls */}
      <div className="bg-white/90 border border-slate-200/60 rounded-2xl shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">From</label>
            <input type="date" className="input text-sm w-38" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">To</label>
            <input type="date" className="input text-sm w-38" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap pb-0.5">
            {([['7 days',7],['30 days',30],['60 days',60],['90 days',90]] as const).map(([label, days]) => (
              <button key={days} onClick={() => { setStartDate(new Date(Date.now()-days*864e5).toISOString().split('T')[0]); setEndDate(today) }}
                className="text-xs px-3 py-2 rounded-lg bg-brand-50 text-brand-600 font-semibold hover:bg-brand-100 transition-colors">
                Last {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white/90 border border-slate-200/60 rounded-2xl p-16 flex justify-center">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Overall Rate" value={`${overview?.overall_rate ?? 0}%`} sub={`${overview?.total_sessions ?? 0} sessions total`}
              color="brand" icon={<TrendingUp className="w-5 h-5" />}
              trend={overview?.overall_rate && overview.overall_rate >= 75 ? 'up' : 'down'} />
            <KpiCard label="Present" value={String(analytics?.present ?? 0)} sub="records" color="emerald" icon={<Users className="w-5 h-5" />} />
            <KpiCard label="Absent" value={String(analytics?.absent ?? 0)} sub="records" color="rose" icon={<AlertTriangle className="w-5 h-5" />} />
            <KpiCard label="At Risk" value={String(overview?.at_risk_count ?? 0)} sub="students < 75%" color="amber" icon={<AlertTriangle className="w-5 h-5" />} />
          </div>

          {/* Status Donut + Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Status distribution */}
            <div className="lg:col-span-2 bg-white/90 border border-slate-200/60 rounded-2xl shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-brand-500" />
                Status Distribution
              </h3>
              {analytics && (
                <div className="space-y-3">
                  {([
                    ['Present', analytics.present, 'emerald'],
                    ['Absent',  analytics.absent,  'rose'],
                    ['Late',    analytics.late,    'amber'],
                    ['Excused', analytics.excused, 'brand'],
                  ] as const).map(([label, count, color]) => {
                    const total = (analytics.present + analytics.absent + analytics.late + analytics.excused) || 1
                    const pct = Math.round(count / total * 100)
                    return (
                      <div key={label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-slate-700">{label}</span>
                          <span className={`font-bold text-${color}-600`}>{count} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full bg-${color}-400 transition-all duration-500`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {/* Overall rate circle */}
              {analytics && (
                <div className="mt-6 flex items-center justify-center">
                  <div className="relative w-28 h-28">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                      <circle
                        cx="50" cy="50" r="40" fill="none"
                        stroke={analytics.overall_rate >= 90 ? '#34d399' : analytics.overall_rate >= 75 ? '#fbbf24' : '#f87171'}
                        strokeWidth="10"
                        strokeDasharray={`${analytics.overall_rate * 2.51} 251`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-2xl font-black ${analytics.overall_rate >= 90 ? 'text-emerald-600' : analytics.overall_rate >= 75 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {analytics.overall_rate}%
                      </span>
                      <span className="text-xs text-slate-400">Rate</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Trend chart */}
            <div className="lg:col-span-3 bg-white/90 border border-slate-200/60 rounded-2xl shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-500" />
                Attendance Trend
              </h3>
              {analytics?.trend && analytics.trend.length > 0 ? (
                <TrendChart trend={analytics.trend} />
              ) : (
                <div className="h-40 flex items-center justify-center text-slate-300">
                  <p>No trend data for this period</p>
                </div>
              )}
            </div>
          </div>

          {/* Heatmap */}
          {overview?.heatmap && overview.heatmap.length > 0 && (
            <div className="bg-white/90 border border-slate-200/60 rounded-2xl shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-500" />
                Attendance Heatmap <span className="text-xs text-slate-400 font-normal ml-1">(last 12 weeks)</span>
              </h3>
              <AttendanceHeatmap heatmap={overview.heatmap} />
            </div>
          )}

          {/* At-risk students */}
          {overview?.at_risk_students && overview.at_risk_students.length > 0 && (
            <div className="bg-white/90 border border-slate-200/60 rounded-2xl shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                At-Risk Students
                <span className="bg-rose-100 text-rose-600 text-xs font-bold px-2 py-0.5 rounded-full">{overview.at_risk_students.length}</span>
              </h3>
              <p className="text-sm text-slate-400 mb-4">Students with attendance below 75% threshold</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {overview.at_risk_students.map((s: any) => (
                  <div key={s.student_id} className="flex items-center gap-3 p-3 bg-rose-50/60 border border-rose-100 rounded-xl">
                    <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-xs font-bold text-rose-700 flex-shrink-0">
                      {s.student_name.split(' ').map((p:string) => p[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{s.student_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex-1 h-1.5 bg-rose-100 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-400 rounded-full" style={{ width: `${s.attendance_pct}%` }} />
                        </div>
                        <span className="text-xs font-bold text-rose-600">{s.attendance_pct}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top students table */}
          {analytics?.students && analytics.students.length > 0 && (
            <div className="bg-white/90 border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-500" />
                  All Students Summary
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      {['Student','Present','Absent','Late','Excused','Rate'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[...analytics.students].sort((a,b) => b.attendance_pct - a.attendance_pct).map((s, i) => (
                      <tr key={s.student_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3 font-semibold text-slate-800">{s.student_name}</td>
                        <td className="px-5 py-3 text-emerald-600 font-semibold">{s.present}</td>
                        <td className="px-5 py-3 text-rose-600 font-semibold">{s.absent}</td>
                        <td className="px-5 py-3 text-amber-600 font-semibold">{s.late}</td>
                        <td className="px-5 py-3 text-brand-600 font-semibold">{s.excused}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${s.attendance_pct >= 90 ? 'bg-emerald-400' : s.attendance_pct >= 75 ? 'bg-amber-400' : 'bg-rose-400'}`}
                                style={{ width: `${s.attendance_pct}%` }} />
                            </div>
                            <span className={`font-bold text-xs ${s.attendance_pct >= 90 ? 'text-emerald-600' : s.attendance_pct >= 75 ? 'text-amber-600' : 'text-rose-600'}`}>
                              {s.attendance_pct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function KpiCard({ label, value, sub, color, icon, trend }: { label: string; value: string; sub: string; color: string; icon: React.ReactNode; trend?: 'up' | 'down' }) {
  return (
    <div className={`bg-white/90 border border-${color}-100 rounded-2xl shadow-sm p-5`}>
      <div className={`w-10 h-10 rounded-xl bg-${color}-100 flex items-center justify-center text-${color}-600 mb-3`}>
        {icon}
      </div>
      <div className="flex items-end gap-2">
        <p className={`text-3xl font-black text-${color}-600`}>{value}</p>
        {trend && (
          trend === 'up'
            ? <TrendingUp className="w-4 h-4 text-emerald-500 mb-1" />
            : <TrendingDown className="w-4 h-4 text-rose-500 mb-1" />
        )}
      </div>
      <p className="text-sm font-semibold text-slate-700 mt-0.5">{label}</p>
      <p className="text-xs text-slate-400">{sub}</p>
    </div>
  )
}

function TrendChart({ trend }: { trend: ClassAnalytics['trend'] }) {
  const max = Math.max(...trend.map(t => t.total), 1)
  return (
    <div className="space-y-1">
      <div className="flex items-end gap-1 h-36">
        {trend.slice(-20).map((t, i) => {
          const presentH = (t.present / max) * 100
          const absentH  = (t.absent  / max) * 100
          const lateH    = (t.late    / max) * 100
          const excusedH = (t.excused / max) * 100
          return (
            <div key={i} className="flex-1 flex flex-col-reverse items-center gap-0 group relative h-full justify-end">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs rounded-lg px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
                <p className="font-semibold">{new Date(t.date + 'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})}</p>
                <p className="text-emerald-300">P: {t.present}</p>
                <p className="text-rose-300">A: {t.absent}</p>
                <p className="text-amber-300">L: {t.late}</p>
                <p className="text-brand-300">E: {t.excused}</p>
                <p className="font-bold">{t.rate}%</p>
              </div>
              <div className="w-full flex flex-col-reverse gap-0">
                <div className="w-full bg-emerald-400 rounded-t-sm transition-all" style={{ height: `${presentH}%`, minHeight: presentH > 0 ? '2px' : '0' }} />
                <div className="w-full bg-amber-400 transition-all"    style={{ height: `${lateH}%`,    minHeight: lateH > 0    ? '2px' : '0' }} />
                <div className="w-full bg-brand-400 transition-all"     style={{ height: `${excusedH}%`, minHeight: excusedH > 0 ? '2px' : '0' }} />
                <div className="w-full bg-rose-400 rounded-t-sm transition-all" style={{ height: `${absentH}%`,  minHeight: absentH > 0  ? '2px' : '0' }} />
              </div>
            </div>
          )
        })}
      </div>
      {/* X-axis labels */}
      <div className="flex gap-1">
        {trend.slice(-20).map((t, i) => (
          <div key={i} className="flex-1 text-center text-[9px] text-slate-300">
            {i % 4 === 0 ? new Date(t.date + 'T00:00:00').toLocaleDateString('en-US',{month:'numeric',day:'numeric'}) : ''}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
        {[['Present','bg-emerald-400'],['Absent','bg-rose-400'],['Late','bg-amber-400'],['Excused','bg-brand-400']].map(([l,c]) => (
          <span key={l} className="flex items-center gap-1"><span className={`w-2.5 h-2.5 rounded-sm ${c}`} />{l}</span>
        ))}
      </div>
    </div>
  )
}

function AttendanceHeatmap({ heatmap }: { heatmap: { date: string; attended: number; total: number; rate: number }[] }) {
  const today = new Date()
  // Build 12-week grid
  const weeks: (typeof heatmap[0] | null)[][] = []
  const start = new Date(today)
  start.setDate(start.getDate() - 83) // 12 weeks back
  const byDate: Record<string, typeof heatmap[0]> = {}
  heatmap.forEach(h => { byDate[h.date] = h })

  let week: (typeof heatmap[0] | null)[] = []
  const cur = new Date(start)
  while (cur <= today) {
    const key = cur.toISOString().split('T')[0]
    week.push(byDate[key] ?? null)
    if (week.length === 7) { weeks.push(week); week = [] }
    cur.setDate(cur.getDate() + 1)
  }
  if (week.length) weeks.push(week)

  const days = ['S','M','T','W','T','F','S']

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1">
        <div className="flex flex-col gap-1 pt-5">
          {days.map((d,i) => (
            <div key={i} className="w-4 h-3.5 text-[9px] text-slate-300 flex items-center">{d}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            <div className="h-4 text-[9px] text-slate-300 text-center">
              {wi % 3 === 0 && week[0] ? new Date(week[0].date + 'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}) : ''}
            </div>
            {week.map((day, di) => (
              <div
                key={di}
                title={day ? `${day.date}: ${day.rate}% (${day.attended}/${day.total})` : 'No session'}
                className={`w-3.5 h-3.5 rounded-sm transition-colors cursor-pointer ${
                  !day       ? 'bg-slate-100' :
                  day.rate >= 90 ? 'bg-emerald-500' :
                  day.rate >= 75 ? 'bg-emerald-300' :
                  day.rate >= 50 ? 'bg-amber-300' :
                  day.rate > 0   ? 'bg-rose-300' :
                                   'bg-slate-200'
                }`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
        <span>Less</span>
        {['bg-slate-200','bg-amber-300','bg-emerald-300','bg-emerald-500'].map((c,i) => (
          <span key={i} className={`w-3 h-3 rounded-sm ${c}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
