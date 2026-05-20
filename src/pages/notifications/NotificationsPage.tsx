import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, CheckCheck, Trash2, FileText, ScrollText, CheckSquare,
  Bot, Users, CalendarDays, ClipboardCheck, BookOpen, GraduationCap,
  Inbox, RefreshCw, X,
} from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import { useNotificationStore } from '@/store/notificationStore'
import type { NotificationType } from '@/types'
import { cn } from '@/lib/utils'

// ── Maps ─────────────────────────────────────────────────────────────────────
const ICON_MAP: Record<NotificationType, React.ElementType> = {
  paper_assigned:     ScrollText,
  paper_published:    ScrollText,
  grade_available:    CheckSquare,
  deadline_reminder:  CalendarDays,
  document_processed: FileText,
  attendance_saved:   ClipboardCheck,
  student_enrolled:   Users,
  assignment_published: BookOpen,
  assignment_graded:  GraduationCap,
  class_created:      Users,
  calendar_event:     CalendarDays,
  system:             Bot,
}

const COLOR_MAP: Record<NotificationType, string> = {
  paper_assigned:     'bg-brand-100 text-brand-600',
  paper_published:    'bg-brand-100 text-brand-600',
  grade_available:    'bg-emerald-100 text-emerald-600',
  deadline_reminder:  'bg-amber-100 text-amber-600',
  document_processed: 'bg-amber-100 text-amber-600',
  attendance_saved:   'bg-cyan-100 text-cyan-600',
  student_enrolled:   'bg-cyan-100 text-cyan-600',
  assignment_published: 'bg-violet-100 text-violet-600',
  assignment_graded:  'bg-violet-100 text-violet-600',
  class_created:      'bg-sky-100 text-sky-600',
  calendar_event:     'bg-blue-100 text-blue-600',
  system:             'bg-gray-100 text-gray-500',
}

const LABEL_MAP: Record<NotificationType, string> = {
  paper_assigned:     'Papers',
  paper_published:    'Papers',
  grade_available:    'Grading',
  deadline_reminder:  'Deadlines',
  document_processed: 'Documents',
  attendance_saved:   'Attendance',
  student_enrolled:   'Classes',
  assignment_published: 'Assignments',
  assignment_graded:  'Assignments',
  class_created:      'Classes',
  calendar_event:     'Calendar',
  system:             'System',
}

// ── Time helper ───────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'yesterday'
  return `${days}d ago`
}

// ── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = ['All', 'Unread', 'Grading', 'Papers', 'Attendance', 'Assignments', 'Documents'] as const
type Tab = typeof TABS[number]

const TAB_FILTER: Record<Tab, (type: NotificationType, is_read: boolean) => boolean> = {
  All:         () => true,
  Unread:      (_, is_read) => !is_read,
  Grading:     (t) => t === 'grade_available',
  Papers:      (t) => t === 'paper_assigned' || t === 'paper_published',
  Attendance:  (t) => t === 'attendance_saved',
  Assignments: (t) => t === 'assignment_published' || t === 'assignment_graded',
  Documents:   (t) => t === 'document_processed',
}

// ─────────────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markRead,
    markAllRead,
    remove,
    clearRead,
  } = useNotificationStore()

  const [activeTab, setActiveTab] = useState<Tab>('All')

  useEffect(() => { fetchNotifications() }, [])

  const filtered = notifications.filter((n) =>
    TAB_FILTER[activeTab](n.type as NotificationType, n.is_read),
  )

  const readCount = notifications.filter((n) => n.is_read).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle={
          unreadCount > 0
            ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
            : 'All caught up!'
        }
        action={
          <div className="flex items-center gap-2">
            {/* Refresh */}
            <button
              onClick={fetchNotifications}
              disabled={loading}
              className="btn-ghost flex items-center gap-2 text-sm"
              title="Refresh"
            >
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            </button>

            {/* Clear read */}
            {readCount > 0 && (
              <button
                onClick={clearRead}
                className="btn-ghost flex items-center gap-2 text-sm text-red-500 hover:text-red-600"
              >
                <X className="w-4 h-4" /> Clear read ({readCount})
              </button>
            )}

            {/* Mark all read */}
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="btn-ghost flex items-center gap-2 text-sm"
              >
                <CheckCheck className="w-4 h-4" /> Mark all read
              </button>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-brand-50 p-1 rounded-xl w-fit flex-wrap">
        {TABS.map((tab) => {
          const count =
            tab === 'Unread'
              ? unreadCount
              : tab !== 'All'
              ? notifications.filter((n) => TAB_FILTER[tab](n.type as NotificationType, n.is_read)).length
              : undefined
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === tab
                  ? 'bg-white text-brand-900 shadow-sm'
                  : 'text-brand-600 hover:text-brand-900',
              )}
            >
              {tab}
              {count !== undefined && count > 0 && (
                <span className="ml-1.5 bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Notification list */}
      <div className="space-y-2">
        {loading && filtered.length === 0 ? (
          <div className="card p-12 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
            <p className="text-brand-500 text-sm">Loading notifications…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 flex flex-col items-center gap-3 text-center">
            <Inbox className="w-10 h-10 text-brand-300" />
            <p className="text-brand-500 font-medium">
              {activeTab === 'Unread' ? 'No unread notifications' : 'No notifications here'}
            </p>
            <p className="text-xs text-brand-400">
              {activeTab === 'All'
                ? 'Notifications appear here when you grade, publish papers, record attendance, and more.'
                : `No ${activeTab.toLowerCase()} notifications yet.`}
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filtered.map((notif) => {
              const type = notif.type as NotificationType
              const Icon = ICON_MAP[type] ?? Bot
              const colourCls = COLOR_MAP[type] ?? COLOR_MAP.system
              const label = LABEL_MAP[type] ?? 'System'
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0 } as never}
                  transition={{ duration: 0.2 }}
                  onClick={() => markRead(notif.id)}
                  className={cn(
                    'card p-4 flex items-start gap-4 cursor-pointer group transition-all',
                    !notif.is_read && 'border-l-4 border-l-brand-500',
                  )}
                >
                  {/* Icon */}
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', colourCls)}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={cn('text-sm font-semibold leading-tight', notif.is_read ? 'text-brand-700' : 'text-[#0f172a]')}>
                          {notif.title}
                          {!notif.is_read && (
                            <span className="ml-2 w-2 h-2 bg-brand-500 rounded-full inline-block align-middle" />
                          )}
                        </p>
                        <span className="inline-block mt-0.5 text-[10px] font-medium bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded-md">
                          {label}
                        </span>
                      </div>
                      <span className="text-[10px] text-brand-400 whitespace-nowrap shrink-0 mt-0.5">
                        {timeAgo(notif.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-brand-600 mt-1 leading-relaxed">{notif.message}</p>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={(e) => { e.stopPropagation(); remove(notif.id) }}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-400 hover:text-red-600 transition-all shrink-0 mt-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Summary footer */}
      {notifications.length > 0 && (
        <p className="text-center text-xs text-brand-400">
          {notifications.length} total notification{notifications.length !== 1 ? 's' : ''} •{' '}
          {unreadCount} unread • {readCount} read
        </p>
      )}
    </div>
  )
}
