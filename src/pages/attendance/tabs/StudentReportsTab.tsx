import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, User, ChevronRight, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, X, Calendar } from 'lucide-react'
import { getStudentsSummary, getStudentAnalytics } from '@/lib/api/attendance'
import type { AttendanceSummary } from '@/lib/api/attendance'

interface Props { classId: string; subjectId: string }

export default function StudentReportsTab({ classId, subjectId }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const ninetyAgo = new Date(Date.now() - 90 * 864e5).toISOString().split('T')[0]
  const [startDate, setStartDate] = useState(ninetyAgo)
  const [endDate, setEndDate]     = useState(today)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'pct' | 'absent'>('pct')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const { data: summary = [], isLoading } = useQuery({
    queryKey: ['students-summary', classId, subjectId, startDate, endDate],
    queryFn:  () => getStudentsSummary(classId, subjectId, startDate, endDate),
    enabled:  !!classId && !!subjectId,
  })

  const sorted = [...(summary as AttendanceSummary[])].sort((a, b) => {
    let va: number | string = sortBy === 'name' ? a.student_name : sortBy === 'pct' ? a.attendance_pct : a.absent
    let vb: number | string = sortBy === 'name' ? b.student_name : sortBy === 'pct' ? b.attendance_pct : b.absent
    if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va)
    return sortDir === 'asc' ? va - (vb as number) : (vb as number) - va
  })

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
  }

  const SortIndicator = ({ col }: { col: typeof sortBy }) =>
    sortBy === col ? <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span> : null

  return (
    <div className="space-y-4">
      {/* Date Range */}
      <div className="bg-white/90 border border-slate-200/60 rounded-2xl shadow-sm p-5">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">From</label>
            <input type="date" className="input text-sm w-40" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">To</label>
            <input type="date" className="input text-sm w-40" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap pb-0.5">
            {[['Last 30 days', 30], ['Last 60 days', 60], ['Last 90 days', 90]].map(([label, days]) => (
              <button
                key={label}
                onClick={() => { setStartDate(new Date(Date.now() - (days as number) * 864e5).toISOString().split('T')[0]); setEndDate(today) }}
                className="text-xs px-3 py-2 rounded-lg bg-indigo-50 text-indigo-600 font-semibold hover:bg-indigo-100 transition-colors"
              >{label as string}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Student List */}
        <div className="lg:col-span-1 bg-white/90 border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 text-sm">All Students ({sorted.length})</h3>
            <div className="flex gap-2 mt-2">
              {([['name','Name'],['pct','Attendance %'],['absent','Absences']] as const).map(([col, label]) => (
                <button
                  key={col}
                  onClick={() => toggleSort(col)}
                  className={`text-xs px-2 py-1 rounded font-medium transition-colors ${sortBy === col ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {label}<SortIndicator col={col} />
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 text-indigo-400 animate-spin" /></div>
          ) : (
            <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
              {sorted.map(s => (
                <button
                  key={s.student_id}
                  onClick={() => setSelectedStudentId(s.student_id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left hover:bg-slate-50 ${selectedStudentId === s.student_id ? 'bg-indigo-50/80 border-r-2 border-indigo-400' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    s.attendance_pct >= 90 ? 'bg-emerald-100 text-emerald-700' :
                    s.attendance_pct >= 75 ? 'bg-amber-100 text-amber-700' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    {s.student_name.split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{s.student_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${s.attendance_pct >= 90 ? 'bg-emerald-400' : s.attendance_pct >= 75 ? 'bg-amber-400' : 'bg-rose-400'}`}
                          style={{ width: `${s.attendance_pct}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold ${s.attendance_pct >= 90 ? 'text-emerald-600' : s.attendance_pct >= 75 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {s.attendance_pct}%
                      </span>
                    </div>
                  </div>
                  {s.attendance_pct < 75 && <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
                  <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Student Detail */}
        <div className="lg:col-span-2">
          {selectedStudentId
            ? <StudentDetail studentId={selectedStudentId} classId={classId} subjectId={subjectId} startDate={startDate} endDate={endDate} onClose={() => setSelectedStudentId(null)} />
            : (
              <div className="bg-white/90 border border-slate-200/60 rounded-2xl shadow-sm p-12 text-center text-slate-400 h-full flex flex-col items-center justify-center">
                <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Select a student to view their report</p>
                <p className="text-sm mt-1">Click any student from the list on the left</p>
              </div>
            )
          }
        </div>
      </div>
    </div>
  )
}

function StudentDetail({ studentId, classId, subjectId, startDate, endDate, onClose }: {
  studentId: string; classId: string; subjectId: string; startDate: string; endDate: string; onClose: () => void
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['student-analytics', studentId, classId, subjectId, startDate, endDate],
    queryFn:  () => getStudentAnalytics(studentId, classId, subjectId, startDate, endDate),
    enabled:  !!studentId,
  })

  if (isLoading) return (
    <div className="bg-white/90 border border-slate-200/60 rounded-2xl p-12 flex justify-center items-center">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
    </div>
  )
  if (!data) return null

  const pctColor = data.attendance_pct >= 90 ? 'text-emerald-600' : data.attendance_pct >= 75 ? 'text-amber-600' : 'text-rose-600'
  const barColor = data.attendance_pct >= 90 ? 'bg-emerald-400' : data.attendance_pct >= 75 ? 'bg-amber-400' : 'bg-rose-400'

  return (
    <div className="bg-white/90 border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-blue-50">
        <div>
          <h3 className="font-bold text-slate-900 text-lg">{data.student_name}</h3>
          {data.roll_number && <p className="text-sm text-slate-400">Roll No: {data.roll_number}</p>}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className={`text-3xl font-black ${pctColor}`}>{data.attendance_pct}%</p>
            <p className="text-xs text-slate-400">Attendance</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
        {([
          ['Present', data.present, 'emerald'],
          ['Absent',  data.absent,  'rose'],
          ['Late',    data.late,    'amber'],
          ['Excused', data.excused, 'blue'],
        ] as const).map(([label, count, color]) => (
          <div key={label} className="py-3 text-center">
            <p className={`text-xl font-black text-${color}-600`}>{count}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
          <span>Attendance Rate</span>
          <span>{data.total_sessions} sessions</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${data.attendance_pct}%` }} />
        </div>
        {data.attendance_pct < 75 && (
          <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Below 75% threshold — student is at risk
          </p>
        )}
      </div>

      {/* Monthly breakdown */}
      {data.monthly?.length > 0 && (
        <div className="px-6 py-4 border-b border-slate-100">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Monthly Breakdown</h4>
          <div className="space-y-2">
            {data.monthly.map((m: any) => (
              <div key={m.month} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-16 flex-shrink-0">{m.month}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${m.rate >= 90 ? 'bg-emerald-400' : m.rate >= 75 ? 'bg-amber-400' : 'bg-rose-400'}`} style={{ width: `${m.rate}%` }} />
                </div>
                <span className={`text-xs font-bold w-10 text-right ${m.rate >= 90 ? 'text-emerald-600' : m.rate >= 75 ? 'text-amber-600' : 'text-rose-600'}`}>{m.rate}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent records */}
      <div className="px-6 py-4">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent Records</h4>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {data.records?.slice(0, 20).map((r: any, i: number) => (
            <div key={i} className="flex items-center gap-3 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
              <span className="text-xs text-slate-500 w-28">{new Date(r.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                r.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                r.status === 'absent'  ? 'bg-rose-100 text-rose-700' :
                r.status === 'late'    ? 'bg-amber-100 text-amber-700' :
                                         'bg-blue-100 text-blue-700'
              }`}>{r.status}</span>
              {r.remarks && <span className="text-xs text-slate-400 italic truncate">{r.remarks}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
