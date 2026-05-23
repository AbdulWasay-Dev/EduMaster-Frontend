import React, { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle, XCircle, Clock, FileText, Save, Loader2,
  UserCheck, UserX, ChevronLeft, ChevronRight, Zap
} from 'lucide-react'
import { listStudents } from '@/lib/api/students'
import { getAttendance, submitAttendance } from '@/lib/api/attendance'
import type { AttendanceStatus, Student, AttendanceRecord } from '@/types'

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; icon: React.ReactNode; activeClass: string; key: string }> = {
  present: { label: 'Present', icon: <CheckCircle className="w-4 h-4" />, activeClass: 'bg-emerald-500 text-white shadow shadow-emerald-200',  key: 'P' },
  absent:  { label: 'Absent',  icon: <XCircle className="w-4 h-4" />,     activeClass: 'bg-rose-500 text-white shadow shadow-rose-200',         key: 'A' },
  late:    { label: 'Late',    icon: <Clock className="w-4 h-4" />,        activeClass: 'bg-amber-500 text-white shadow shadow-amber-200',       key: 'L' },
  excused: { label: 'Excused', icon: <FileText className="w-4 h-4" />,     activeClass: 'bg-brand-500 text-white shadow shadow-brand',          key: 'E' },
}

type AttendanceState = Record<string, { status: AttendanceStatus; remarks: string }>

interface Props { classId: string; subjectId: string }

export default function TakeAttendanceTab({ classId, subjectId }: Props) {
  const queryClient = useQueryClient()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [attendanceState, setAttendanceState] = useState<AttendanceState>({})
  const [saved, setSaved] = useState(false)
  const [searchQ, setSearchQ] = useState('')

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['students', classId],
    queryFn: () => listStudents(classId),
    enabled: !!classId,
  })

  const { data: existingRecords = [], isLoading: loadingExisting } = useQuery({
    queryKey: ['attendance', classId, subjectId, selectedDate],
    queryFn: () => getAttendance(classId, subjectId, selectedDate),
    enabled: !!classId && !!subjectId && !!selectedDate,
  })

  // Init state whenever students / existing records change
  useEffect(() => {
    if ((students as Student[]).length === 0) { setAttendanceState({}); return }
    const ns: AttendanceState = {}
    ;(students as Student[]).forEach(s => {
      const ex = (existingRecords as AttendanceRecord[]).find(r => r.student_id === s.id)
      ns[s.id] = { status: ex?.status ?? 'present', remarks: ex?.remarks ?? '' }
    })
    setAttendanceState(ns)
    setSaved(false)
  }, [students, existingRecords])

  const setStatus = useCallback((id: string, status: AttendanceStatus) => {
    setAttendanceState(p => ({ ...p, [id]: { ...p[id], status } }))
    setSaved(false)
  }, [])

  const setRemarks = useCallback((id: string, remarks: string) => {
    setAttendanceState(p => ({ ...p, [id]: { ...p[id], remarks } }))
  }, [])

  const markAll = (status: AttendanceStatus) => {
    const ns: AttendanceState = {}
    Object.keys(attendanceState).forEach(id => { ns[id] = { ...attendanceState[id], status } })
    setAttendanceState(ns)
    setSaved(false)
  }

  const stepDate = (dir: 1 | -1) => {
    const d = new Date(selectedDate); d.setDate(d.getDate() + dir)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  const saveMutation = useMutation({
    mutationFn: () => submitAttendance({
      class_id: classId,
      subject_id: subjectId,
      date: selectedDate,
      entries: Object.entries(attendanceState).map(([student_id, d]) => ({ student_id, status: d.status, remarks: d.remarks || undefined })),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      setSaved(true)
    },
  })

  const filteredStudents = (students as Student[]).filter(s => {
    const name = (s.name || s.student_name || '').toLowerCase()
    return name.includes(searchQ.toLowerCase())
  })

  const counts = Object.values(attendanceState).reduce<Record<AttendanceStatus, number>>(
    (acc, v) => { acc[v.status] = (acc[v.status] || 0) + 1; return acc },
    { present: 0, absent: 0, late: 0, excused: 0 }
  )

  const isLoading = loadingStudents || loadingExisting

  return (
    <div className="space-y-4">
      {/* Date selector + summary strip */}
      <div className="bg-white/90 border border-slate-200/60 rounded-2xl shadow-sm p-5">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Date nav */}
          <div className="flex items-center gap-2">
            <button onClick={() => stepDate(-1)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <input
              type="date"
              className="input w-44 text-center font-semibold"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
            <button onClick={() => stepDate(1)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="text-xs px-3 py-1.5 bg-brand-50 text-brand-600 rounded-lg font-semibold hover:bg-brand-100 transition-colors"
            >Today</button>
          </div>

          {/* Live counts */}
          <div className="flex items-center gap-3 flex-wrap">
            {(Object.entries(counts) as [AttendanceStatus, number][]).map(([st, n]) => (
              <div key={st} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${
                st === 'present' ? 'bg-emerald-50 text-emerald-700' :
                st === 'absent'  ? 'bg-rose-50 text-rose-700' :
                st === 'late'    ? 'bg-amber-50 text-amber-700' :
                                   'bg-brand-50 text-brand-700'
              }`}>
                {STATUS_CONFIG[st].icon}
                <span>{n}</span>
                <span className="text-xs opacity-70">{STATUS_CONFIG[st].label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main sheet */}
      <div className="bg-white/90 border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search students…"
              className="input py-2 text-sm w-48"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
            />
            <span className="text-sm text-slate-500">{filteredStudents.length} students</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-medium">Mark all:</span>
            {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map(st => (
              <button
                key={st}
                onClick={() => markAll(st)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all hover:opacity-90 ${
                  st === 'present' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' :
                  st === 'absent'  ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' :
                  st === 'late'    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' :
                                     'bg-brand-100 text-brand-700 hover:bg-brand-200'
                }`}
              >{STATUS_CONFIG[st].label}</button>
            ))}

            <button
              disabled={Object.keys(attendanceState).length === 0 || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
              className="btn-primary py-2 ml-2 disabled:opacity-50"
            >
              {saveMutation.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : saved ? <UserCheck className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? 'Saved!' : 'Save'}
            </button>
          </div>
        </div>

        {/* Quick-key hint */}
        <div className="px-4 py-2 bg-brand-50/70 border-b border-brand-100 flex items-center gap-2 text-xs text-brand-600">
          <Zap className="w-3.5 h-3.5" />
          <span>Keyboard shortcuts: <strong>P</strong> = Present · <strong>A</strong> = Absent · <strong>L</strong> = Late · <strong>E</strong> = Excused</span>
        </div>

        {isLoading ? (
          <div className="p-16 flex justify-center">
            <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <UserX className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No students found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredStudents.map((student, idx) => {
              const s = student as Student
              const state = attendanceState[s.id] || { status: 'present' as AttendanceStatus, remarks: '' }
              return (
                <StudentRow
                  key={s.id}
                  index={idx + 1}
                  student={s}
                  state={state}
                  onStatus={st => setStatus(s.id, st)}
                  onRemarks={r => setRemarks(s.id, r)}
                />
              )
            })}
          </div>
        )}

        {saveMutation.isError && (
          <div className="p-4 bg-rose-50 border-t border-rose-100 text-rose-600 text-sm text-center">
            Failed to save. Please try again.
          </div>
        )}
      </div>
    </div>
  )
}

interface RowProps {
  index: number
  student: Student
  state: { status: AttendanceStatus; remarks: string }
  onStatus: (s: AttendanceStatus) => void
  onRemarks: (r: string) => void
}

function StudentRow({ index, student, state, onStatus, onRemarks }: RowProps) {
  const name = student.name || student.student_name || 'Unknown'
  const initials = name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()

  // Keyboard handler
  const handleKey = (e: React.KeyboardEvent) => {
    const map: Record<string, AttendanceStatus> = { p: 'present', a: 'absent', l: 'late', e: 'excused' }
    if (map[e.key.toLowerCase()]) { onStatus(map[e.key.toLowerCase()]); e.preventDefault() }
  }

  const rowBg = state.status === 'present' ? 'hover:bg-emerald-50/30' :
                state.status === 'absent'  ? 'bg-rose-50/20 hover:bg-rose-50/40' :
                state.status === 'late'    ? 'bg-amber-50/20 hover:bg-amber-50/40' :
                                             'bg-brand-50/30 hover:bg-brand-50/50'

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKey}
      className={`flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-3.5 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-300 ${rowBg}`}
    >
      {/* Index + Avatar */}
      <div className="flex items-center gap-3 w-full sm:w-56 flex-shrink-0">
        <span className="text-xs font-bold text-slate-300 w-6 text-right">{index}</span>
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
          state.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
          state.status === 'absent'  ? 'bg-rose-100 text-rose-700' :
          state.status === 'late'    ? 'bg-amber-100 text-amber-700' :
                                       'bg-brand-100 text-brand-700'
        }`}>{initials}</div>
        <div className="min-w-0">
          <p className="font-semibold text-slate-800 text-sm truncate">{name}</p>
          {student.student_id && <p className="text-xs text-slate-400">{student.student_id}</p>}
        </div>
      </div>

      {/* Status toggle */}
      <div className="flex items-center bg-slate-100/80 p-1 rounded-xl gap-0.5 flex-shrink-0">
        {(Object.entries(STATUS_CONFIG) as [AttendanceStatus, typeof STATUS_CONFIG[AttendanceStatus]][]).map(([st, cfg]) => (
          <button
            key={st}
            type="button"
            onClick={() => onStatus(st)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              state.status === st ? cfg.activeClass : 'text-slate-500 hover:bg-slate-200/60'
            }`}
          >
            {cfg.icon}
            <span className="hidden sm:inline">{cfg.label}</span>
            <span className="sm:hidden text-[10px] opacity-60">({cfg.key})</span>
          </button>
        ))}
      </div>

      {/* Remarks */}
      <input
        type="text"
        placeholder="Remarks…"
        className="input text-xs py-1.5 min-w-0 flex-1 bg-white/60"
        value={state.remarks}
        onChange={e => onRemarks(e.target.value)}
        onClick={e => e.stopPropagation()}
      />
    </div>
  )
}
