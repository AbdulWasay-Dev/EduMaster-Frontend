import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Search, Calendar, Filter, ChevronDown } from 'lucide-react'
import { getAttendanceRange } from '@/lib/api/attendance'

const STATUS_COLORS: Record<string, string> = {
  present: 'bg-emerald-100 text-emerald-700',
  absent:  'bg-rose-100 text-rose-700',
  late:    'bg-amber-100 text-amber-700',
  excused: 'bg-brand-100 text-brand-700',
}

interface Props { classId: string; subjectId: string }

export default function RecordsTab({ classId, subjectId }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const thirtyAgo = new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0]
  const [startDate, setStartDate] = useState(thirtyAgo)
  const [endDate,   setEndDate]   = useState(today)
  const [search,    setSearch]    = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['attendance-range', classId, subjectId, startDate, endDate],
    queryFn:  () => getAttendanceRange(classId, subjectId, startDate, endDate),
    enabled:  !!classId && !!subjectId,
  })

  const filtered = records.filter((r: any) => {
    const matchSearch = !search || r.student_name?.toLowerCase().includes(search.toLowerCase()) || r.roll_number?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || r.status === filterStatus
    return matchSearch && matchStatus
  })

  // Group by date
  const grouped = filtered.reduce<Record<string, any[]>>((acc, r: any) => {
    const d = r.date?.split('T')[0] ?? r.date ?? 'Unknown'
    ;(acc[d] = acc[d] || []).push(r)
    return acc
  }, {})

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white/90 border border-slate-200/60 rounded-2xl shadow-sm p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">From</label>
            <input type="date" className="input w-full text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">To</label>
            <input type="date" className="input w-full text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Status</label>
            <div className="relative">
              <select className="input w-full text-sm appearance-none pr-8" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="excused">Excused</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Student name / ID…" className="input pl-9 text-sm w-full" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
          <Filter className="w-4 h-4" />
          <span><strong className="text-slate-800">{filtered.length}</strong> records across <strong className="text-slate-800">{sortedDates.length}</strong> sessions</span>
        </div>
      </div>

      {/* Records */}
      {isLoading ? (
        <div className="bg-white/90 border border-slate-200/60 rounded-2xl p-16 flex justify-center">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="bg-white/90 border border-slate-200/60 rounded-2xl p-12 text-center text-slate-400">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No records found for this period</p>
          <p className="text-sm mt-1">Try adjusting the date range or filters</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map(date => {
            const recs = grouped[date]
            const pct = Math.round(recs.filter((r:any) => r.status === 'present' || r.status === 'late').length / recs.length * 100)
            return (
              <div key={date} className="bg-white/90 border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                {/* Session Header */}
                <div className="flex items-center justify-between px-5 py-3 bg-slate-50/80 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-brand-400" />
                    <span className="font-semibold text-slate-800">
                      {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500">{recs.length} students</span>
                    <div className={`text-xs font-bold px-2.5 py-1 rounded-full ${pct >= 75 ? 'bg-emerald-100 text-emerald-700' : pct >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                      {pct}% attendance
                    </div>
                  </div>
                </div>

                {/* Mini bar */}
                <div className="flex h-1.5">
                  {(['present','absent','late','excused'] as const).map(st => {
                    const cnt = recs.filter((r: any) => r.status === st).length
                    const pct = recs.length ? (cnt / recs.length) * 100 : 0
                    return pct > 0 ? (
                      <div key={st} style={{ width: `${pct}%` }} className={`${st === 'present' ? 'bg-emerald-400' : st === 'absent' ? 'bg-rose-400' : st === 'late' ? 'bg-amber-400' : 'bg-brand-400'}`} />
                    ) : null
                  })}
                </div>

                {/* Table */}
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-50 text-left">
                      <th className="px-5 py-2.5 font-semibold text-slate-400 text-xs uppercase tracking-wider w-8">#</th>
                      <th className="px-5 py-2.5 font-semibold text-slate-400 text-xs uppercase tracking-wider">Student</th>
                      <th className="px-5 py-2.5 font-semibold text-slate-400 text-xs uppercase tracking-wider">Status</th>
                      <th className="px-5 py-2.5 font-semibold text-slate-400 text-xs uppercase tracking-wider">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {recs.map((r: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-2.5 text-slate-300 font-bold text-xs">{i + 1}</td>
                        <td className="px-5 py-2.5">
                          <p className="font-semibold text-slate-800">{r.student_name}</p>
                          {r.roll_number && <p className="text-xs text-slate-400">{r.roll_number}</p>}
                        </td>
                        <td className="px-5 py-2.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[r.status] ?? 'bg-slate-100 text-slate-600'}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-slate-400 text-xs italic">{r.remarks || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
