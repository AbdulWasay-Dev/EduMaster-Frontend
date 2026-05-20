import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, 
  isSameDay, isToday, addWeeks, subWeeks, parseISO, isAfter, isBefore 
} from 'date-fns'
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, 
  Clock, MapPin, Trash2, Edit3, Bell, ScrollText, CheckSquare, 
  Bot, Users 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import { listEvents, deleteEvent } from '@/lib/api/schedule'
import EventModal from '@/components/schedule/EventModal'
import type { ScheduleEvent, EventType } from '@/types'

const EVENT_COLORS: Record<EventType, string> = {
  class: 'bg-blue-100 text-blue-700 border-blue-200',
  quiz: 'bg-amber-100 text-amber-700 border-amber-200',
  assignment: 'bg-purple-100 text-purple-700 border-purple-200',
  paper: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  personal: 'bg-slate-100 text-slate-700 border-slate-200',
}

const EVENT_ICONS: Record<EventType, React.ElementType> = {
  class: Users,
  quiz: Clock,
  assignment: ScrollText,
  paper: CheckSquare,
  personal: CalendarIcon,
}

export default function SchedulePage() {
  const qc = useQueryClient()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week'>('month')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null)
  const [selectedDateStr, setSelectedDateStr] = useState<string | undefined>()

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => listEvents(),
  })

  const deleteMut = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] })
      toast.success('Event deleted')
    }
  })

  const handlePrev = () => {
    setCurrentDate(view === 'month' ? subMonths(currentDate, 1) : subWeeks(currentDate, 1))
  }

  const handleNext = () => {
    setCurrentDate(view === 'month' ? addMonths(currentDate, 1) : addWeeks(currentDate, 1))
  }

  const handleAddEvent = (date?: Date) => {
    setSelectedEvent(null)
    setSelectedDateStr(date ? format(date, 'yyyy-MM-dd') : undefined)
    setModalOpen(true)
  }

  const handleEditEvent = (event: ScheduleEvent) => {
    setSelectedEvent(event)
    setSelectedDateStr(undefined)
    setModalOpen(true)
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(view === 'month' ? monthStart : currentDate)
  const endDate = endOfWeek(view === 'month' ? monthEnd : currentDate)

  const dateFormat = view === 'month' ? 'MMMM yyyy' : 'MMM d, yyyy'
  const days = eachDayOfInterval({ start: startDate, end: endDate })
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Alerts logic: upcoming events today/tomorrow
  const now = new Date()
  const upcomingEvents = events
    .filter(e => {
      const eDate = parseISO(`${e.date}T${e.start_time}`)
      return isAfter(eDate, now) || isSameDay(eDate, now)
    })
    .sort((a, b) => {
      const dateA = parseISO(`${a.date}T${a.start_time}`)
      const dateB = parseISO(`${b.date}T${b.start_time}`)
      return dateA.getTime() - dateB.getTime()
    })
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timetable & Schedule"
        subtitle="Manage your classes, exams, and personal events"
        action={
          <button onClick={() => handleAddEvent()} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Event
          </button>
        }
      />

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Calendar View */}
        <div className="lg:col-span-3 card p-5 flex flex-col min-h-[600px]">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-[#0f172a] w-48">
                {format(currentDate, dateFormat)}
              </h2>
              <div className="flex items-center gap-1 bg-brand-50 p-1 rounded-lg">
                <button 
                  onClick={handlePrev}
                  className="p-1.5 rounded hover:bg-white text-brand-600 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1.5 rounded text-sm font-medium hover:bg-white text-brand-600 transition-colors"
                >
                  Today
                </button>
                <button 
                  onClick={handleNext}
                  className="p-1.5 rounded hover:bg-white text-brand-600 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-brand-50 p-1 rounded-lg">
              <button 
                onClick={() => setView('month')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  view === 'month' ? 'bg-white shadow-sm text-brand-700' : 'text-brand-500 hover:text-brand-700'
                }`}
              >
                Month
              </button>
              <button 
                onClick={() => setView('week')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  view === 'week' ? 'bg-white shadow-sm text-brand-700' : 'text-brand-500 hover:text-brand-700'
                }`}
              >
                Week
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 flex flex-col">
            {/* Weekdays row */}
            <div className="grid grid-cols-7 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-xs font-bold text-brand-400 uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className={`flex-1 grid grid-cols-7 gap-px bg-brand-100 rounded-xl overflow-hidden border border-brand-100 ${
              view === 'month' ? 'auto-rows-fr' : 'h-64'
            }`}>
              {days.map((day, i) => {
                const dayStr = format(day, 'yyyy-MM-dd')
                const dayEvents = events.filter(e => e.date === dayStr).sort((a, b) => a.start_time.localeCompare(b.start_time))
                const isCurrentMonth = isSameMonth(day, currentDate)
                
                return (
                  <div 
                    key={day.toString()} 
                    onClick={() => handleAddEvent(day)}
                    className={`min-h-[100px] p-2 bg-white transition-colors cursor-pointer hover:bg-brand-25 group ${
                      !isCurrentMonth && view === 'month' ? 'opacity-40 bg-slate-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                        isToday(day) 
                          ? 'bg-brand-500 text-white shadow-sm' 
                          : 'text-[#0f172a]'
                      }`}>
                        {format(day, 'd')}
                      </span>
                      <Plus className="w-4 h-4 text-brand-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    
                    <div className="space-y-1.5 mt-2">
                      {dayEvents.map(evt => {
                        const Icon = EVENT_ICONS[evt.type]
                        return (
                          <div 
                            key={evt.id}
                            onClick={(e) => { e.stopPropagation(); handleEditEvent(evt) }}
                            className={`px-2 py-1 rounded text-[10px] sm:text-xs font-medium border truncate transition-all hover:brightness-95 flex items-center gap-1 cursor-pointer ${EVENT_COLORS[evt.type]}`}
                            title={`${evt.start_time} - ${evt.title}`}
                          >
                            <span className="opacity-70 hidden xl:inline">{evt.start_time}</span>
                            <span className="truncate">{evt.title}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Alerts / Upcoming */}
        <div className="space-y-4">
          <div className="card p-5 bg-gradient-to-br from-brand-50 to-white border-brand-100">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-brand-500" />
              <h3 className="font-bold text-[#0f172a]">Upcoming Alerts</h3>
            </div>
            
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-6 text-brand-400">
                <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No upcoming events.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map(evt => {
                  const Icon = EVENT_ICONS[evt.type]
                  const eDate = parseISO(evt.date)
                  return (
                    <motion.div 
                      key={evt.id} 
                      whileHover={{ scale: 1.02 }}
                      className="p-3 bg-white rounded-xl border border-brand-100 shadow-sm relative group cursor-pointer"
                      onClick={() => handleEditEvent(evt)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${EVENT_COLORS[evt.type].split(' ')[0]} ${EVENT_COLORS[evt.type].split(' ')[1]}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#0f172a] truncate">{evt.title}</p>
                          <p className="text-xs text-brand-600 mt-0.5">
                            {isToday(eDate) ? 'Today' : format(eDate, 'MMM d')} • {evt.start_time}
                          </p>
                          {evt.class_name && (
                            <p className="text-xs text-brand-500 truncate mt-1">
                              Class: {evt.class_name}
                            </p>
                          )}
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            window.confirm('Delete event?') && deleteMut.mutate(evt.id)
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-red-400 transition-opacity shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
          
          <div className="card p-5">
            <h3 className="font-bold text-[#0f172a] text-sm mb-3">Event Types</h3>
            <div className="space-y-2">
              {Object.entries(EVENT_COLORS).map(([type, colorClass]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full border ${colorClass}`} />
                  <span className="text-xs font-medium text-brand-600 capitalize">{type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <EventModal 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
        event={selectedEvent} 
        initialDate={selectedDateStr}
      />
    </div>
  )
}
