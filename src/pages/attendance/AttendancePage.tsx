import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, Clock, FileText, Save, Loader2, Info } from 'lucide-react'
import { listClasses } from '@/lib/api/classes'
import { listSubjects } from '@/lib/api/subjects'
import { listStudents } from '@/lib/api/students'
import { getAttendance, submitAttendance } from '@/lib/api/attendance'
import type { AttendanceStatus, Class, Subject, Student, AttendanceRecord } from '@/types'

export default function AttendancePage() {
  const queryClient = useQueryClient()
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [attendanceState, setAttendanceState] = useState<Record<string, { status: AttendanceStatus, remarks: string }>>({})

  // Fetch Classes
  const { data: classes = [], isLoading: isLoadingClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: () => listClasses()
  })

  // Fetch Subjects
  const { data: allSubjects = [], isLoading: isLoadingSubjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => listSubjects()
  })

  // Filter subjects by selected class
  const classSubjects = allSubjects.filter((s: Subject) => s.class_id === selectedClass)

  // Fetch Students
  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['students', selectedClass],
    queryFn: () => listStudents(selectedClass),
    enabled: !!selectedClass
  })

  // Fetch Existing Attendance
  const { data: existingRecords = [], isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['attendance', selectedClass, selectedSubject, selectedDate],
    queryFn: () => getAttendance(selectedClass, selectedSubject, selectedDate),
    enabled: !!selectedClass && !!selectedSubject && !!selectedDate
  })

  // Initialize form state when students or existing records load
  useEffect(() => {
    if (students.length > 0) {
      const newState: Record<string, { status: AttendanceStatus, remarks: string }> = {}
      students.forEach((student: Student) => {
        const existing = existingRecords.find((r: AttendanceRecord) => r.student_id === student.id)
        newState[student.id] = {
          status: existing ? existing.status : 'present', // Default to present
          remarks: existing?.remarks || ''
        }
      })
      setAttendanceState(newState)
    } else {
      setAttendanceState({})
    }
  }, [students, existingRecords])

  // Mutation
  const saveMutation = useMutation({
    mutationFn: () => {
      const entries = Object.entries(attendanceState).map(([student_id, data]) => ({
        student_id,
        status: data.status,
        remarks: data.remarks
      }))
      return submitAttendance({
        class_id: selectedClass,
        subject_id: selectedSubject,
        date: selectedDate,
        entries
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      alert('Attendance saved successfully!')
    },
    onError: (error) => {
      console.error(error)
      alert('Failed to save attendance. Please try again.')
    }
  })

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }))
  }

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks }
    }))
  }

  const markAll = (status: AttendanceStatus) => {
    const newState = { ...attendanceState }
    Object.keys(newState).forEach(id => {
      newState[id].status = status
    })
    setAttendanceState(newState)
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Attendance</h1>
          <p className="text-slate-500 mt-1">Manage daily attendance records for your classes.</p>
        </div>
        <button 
          disabled={!selectedClass || !selectedSubject || !selectedDate || saveMutation.isPending || students.length === 0}
          onClick={() => saveMutation.mutate()}
          className="btn-primary py-2.5 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Save Attendance
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Select Class</label>
          <select 
            className="input w-full"
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value)
              setSelectedSubject('')
            }}
          >
            <option value="">-- Choose Class --</option>
            {classes.map((c: Class) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Select Subject</label>
          <select 
            className="input w-full disabled:bg-slate-50"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            disabled={!selectedClass}
          >
            <option value="">-- Choose Subject --</option>
            {classSubjects.map((s: Subject) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Date</label>
          <input 
            type="date" 
            className="input w-full"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {(!selectedClass || !selectedSubject) ? (
          <div className="p-12 text-center text-slate-500">
            <Info className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-lg">Please select a class and subject to view the attendance sheet.</p>
          </div>
        ) : isLoadingStudents || isLoadingAttendance ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-lg">No students found in this class.</p>
          </div>
        ) : (
          <div>
            <div className="p-4 bg-slate-50 border-b border-slate-200/60 flex justify-between items-center">
              <span className="font-medium text-slate-700">{students.length} Students</span>
              <div className="flex gap-2">
                <button onClick={() => markAll('present')} className="text-xs px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 font-medium transition-colors">Mark All Present</button>
                <button onClick={() => markAll('absent')} className="text-xs px-3 py-1.5 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 font-medium transition-colors">Mark All Absent</button>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {students.map((student: Student) => {
                const state = attendanceState[student.id] || { status: 'present', remarks: '' }
                return (
                  <div key={student.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                    
                    {/* Student Info */}
                    <div className="flex items-center gap-3 w-full md:w-1/3">
                      <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold flex-shrink-0">
                        {(student.name || student.student_name || 'S').charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{student.name || student.student_name || 'Unknown Student'}</p>
                        {student.student_id && <p className="text-xs text-slate-500">ID: {student.student_id}</p>}
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col sm:flex-row w-full md:w-2/3 items-start sm:items-center justify-end gap-4">
                      
                      {/* Radio Buttons */}
                      <div className="flex items-center bg-slate-100/80 p-1 rounded-xl">
                        <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all ${state.status === 'present' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/50'}`}>
                          <input type="radio" className="hidden" name={`status-${student.id}`} checked={state.status === 'present'} onChange={() => handleStatusChange(student.id, 'present')} />
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Present</span>
                        </label>
                        <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all ${state.status === 'absent' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/50'}`}>
                          <input type="radio" className="hidden" name={`status-${student.id}`} checked={state.status === 'absent'} onChange={() => handleStatusChange(student.id, 'absent')} />
                          <XCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Absent</span>
                        </label>
                        <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all ${state.status === 'late' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/50'}`}>
                          <input type="radio" className="hidden" name={`status-${student.id}`} checked={state.status === 'late'} onChange={() => handleStatusChange(student.id, 'late')} />
                          <Clock className="w-4 h-4" />
                          <span className="text-sm font-medium">Late</span>
                        </label>
                        <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all ${state.status === 'excused' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/50'}`}>
                          <input type="radio" className="hidden" name={`status-${student.id}`} checked={state.status === 'excused'} onChange={() => handleStatusChange(student.id, 'excused')} />
                          <FileText className="w-4 h-4" />
                          <span className="text-sm font-medium">Excused</span>
                        </label>
                      </div>

                      {/* Remarks */}
                      <input 
                        type="text" 
                        className="input text-sm py-2 px-3 w-full sm:w-48 bg-transparent"
                        placeholder="Remarks (optional)"
                        value={state.remarks}
                        onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                      />
                    </div>

                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
