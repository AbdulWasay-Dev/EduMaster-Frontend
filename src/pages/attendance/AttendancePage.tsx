import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ClipboardCheck, BarChart3, Users, History, BookOpen, ChevronDown } from 'lucide-react'
import { listClasses } from '@/lib/api/classes'
import { listSubjects } from '@/lib/api/subjects'
import type { Class, Subject } from '@/types'

import TakeAttendanceTab from './tabs/TakeAttendanceTab'
import RecordsTab from './tabs/RecordsTab'
import StudentReportsTab from './tabs/StudentReportsTab'
import AnalyticsTab from './tabs/AnalyticsTab'

type TabId = 'take' | 'records' | 'students' | 'analytics'

const TABS: { id: TabId; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'take',      label: 'Take Attendance', icon: <ClipboardCheck className="w-4 h-4" />, desc: 'Mark daily attendance' },
  { id: 'records',   label: 'All Records',     icon: <History className="w-4 h-4" />,        desc: 'Browse history' },
  { id: 'students',  label: 'Student Reports', icon: <Users className="w-4 h-4" />,           desc: 'Per-student breakdown' },
  { id: 'analytics', label: 'Analytics',       icon: <BarChart3 className="w-4 h-4" />,       desc: 'Trends & insights' },
]

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<TabId>('take')
  const [selectedClass, setSelectedClass]     = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')

  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: () => listClasses() })
  const { data: classSubjects = [] } = useQuery({
    queryKey: ['subjects', selectedClass],
    queryFn: () => listSubjects(selectedClass || undefined),
    enabled: !!selectedClass,
  })

  const selectedClassObj   = (classes as Class[]).find(c => c.id === selectedClass)
  const selectedSubjectObj = (classSubjects as Subject[]).find(s => s.id === selectedSubject)

  const filtersReady = !!selectedClass && !!selectedSubject

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                <ClipboardCheck className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Attendance</h1>
            </div>
            <p className="text-slate-500 ml-13 pl-1">Advanced attendance management &amp; analytics</p>
          </div>

          {/* Global Stats Strip */}
          {filtersReady && (
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-white/70 border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <span className="font-medium text-slate-700">{selectedClassObj?.name}</span>
              <span>·</span>
              <span>{selectedSubjectObj?.name}</span>
            </div>
          )}
        </div>

        {/* ── Filter Bar ── */}
        <div className="bg-white/80 backdrop-blur border border-slate-200/60 rounded-2xl shadow-sm p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Class</label>
              <div className="relative">
                <select
                  className="input w-full appearance-none pr-9 font-medium"
                  value={selectedClass}
                  onChange={e => { setSelectedClass(e.target.value); setSelectedSubject('') }}
                >
                  <option value="">— Select a class —</option>
                  {(classes as Class[]).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Subject</label>
              <div className="relative">
                <select
                  className="input w-full appearance-none pr-9 font-medium disabled:bg-slate-50"
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  disabled={!selectedClass}
                >
                  <option value="">— Select a subject —</option>
                  {(classSubjects as Subject[]).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2 bg-white/70 border border-slate-200/60 rounded-2xl p-1.5 shadow-sm overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md shadow-indigo-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        {!filtersReady ? (
          <div className="bg-white/80 rounded-2xl border border-slate-200/60 shadow-sm p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center mx-auto mb-4">
              <ClipboardCheck className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Select Class &amp; Subject</h3>
            <p className="text-slate-400 max-w-sm mx-auto">Choose a class and subject above to begin managing attendance records and viewing analytics.</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {activeTab === 'take'      && <TakeAttendanceTab  classId={selectedClass} subjectId={selectedSubject} />}
            {activeTab === 'records'   && <RecordsTab         classId={selectedClass} subjectId={selectedSubject} />}
            {activeTab === 'students'  && <StudentReportsTab  classId={selectedClass} subjectId={selectedSubject} />}
            {activeTab === 'analytics' && <AnalyticsTab       classId={selectedClass} subjectId={selectedSubject} />}
          </div>
        )}
      </div>
    </div>
  )
}
