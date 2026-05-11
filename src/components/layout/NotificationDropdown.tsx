/**
 * NotificationDropdown — Bell button + slide-down panel in TopNav.
 * Fully connected to the notificationStore which polls the real backend.
 */
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, CheckCheck, Trash2, FileText, ScrollText,
  CheckSquare, Bot, Users, CalendarDays, ClipboardCheck,
  BookOpen, GraduationCap, X, Inbox, ArrowRight,
} from 'lucide-react'
import { useNotificationStore } from '@/store/notificationStore'
import { useAuthStore } from '@/store/authStore'
import type { NotificationType } from '@/types'
import { cn } from '@/lib/utils'

// ── Icon / colour maps keyed on notification_type ──────────────────────────
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
  calendar_event:     'bg-orange-100 text-orange-600',
  system:             'bg-gray-100 text-gray-500',
}

// ── Time ago helper ─────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

// ── Component ───────────────────────────────────────────────────────────────
export default function NotificationDropdown() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const {
    notifications,
    unreadCount,
    panelOpen,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markRead,
    markAllRead,
    remove,
    togglePanel,
    closePanel,
  } = useNotificationStore()

  const navigate = useNavigate()
  const panelRef = useRef<HTMLDivElement>(null)

  // ── Initial load + polling ─────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return
    fetchNotifications()
    const interval = setInterval(() => {
      fetchUnreadCount()
    }, 60_000)
    return () => clearInterval(interval)
  }, [isAuthenticated])

  // ── Close on outside click ─────────────────────────────────────────────
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        closePanel()
      }
    }
    if (panelOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [panelOpen])

  // ── Refresh on panel open ──────────────────────────────────────────────
  const handleToggle = () => {
    togglePanel()
    if (!panelOpen) fetchNotifications()
  }

  const preview = notifications.slice(0, 8)

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        id="notification-bell"
        onClick={handleToggle}
        className="relative p-2 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full px-0.5 ring-2 ring-white leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-[380px] max-h-[520px] bg-white rounded-2xl shadow-2xl border border-brand-100 overflow-hidden z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-brand-100 shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-brand-600" />
                <span className="text-sm font-semibold text-[#1C0A00]">Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-brand-600 hover:text-brand-900 px-2 py-1 rounded-lg hover:bg-brand-50 flex items-center gap-1 transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3 h-3" /> All read
                  </button>
                )}
                <button
                  onClick={closePanel}
                  className="p-1 rounded-lg text-brand-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div className="flex-1 overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-brand-400">
                  <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
                  <p className="text-xs">Loading…</p>
                </div>
              ) : preview.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-brand-400">
                  <Inbox className="w-10 h-10 opacity-40" />
                  <p className="text-sm font-medium">All caught up!</p>
                  <p className="text-xs text-center px-6">Notifications from grading, attendance, papers &amp; more will appear here.</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {preview.map((notif) => {
                    const Icon = ICON_MAP[notif.type as NotificationType] ?? Bot
                    const colourCls = COLOR_MAP[notif.type as NotificationType] ?? COLOR_MAP.system
                    return (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0, padding: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => markRead(notif.id)}
                        className={cn(
                          'flex items-start gap-3 px-4 py-3 cursor-pointer group hover:bg-brand-50 transition-colors',
                          !notif.is_read && 'bg-brand-50/60 border-l-2 border-brand-400',
                        )}
                      >
                        {/* Icon */}
                        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5', colourCls)}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-xs font-semibold leading-tight', notif.is_read ? 'text-brand-700' : 'text-[#1C0A00]')}>
                            {notif.title}
                            {!notif.is_read && (
                              <span className="ml-1.5 inline-block w-1.5 h-1.5 bg-brand-500 rounded-full align-middle" />
                            )}
                          </p>
                          <p className="text-[11px] text-brand-500 mt-0.5 leading-snug line-clamp-2">
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-brand-400 mt-1">{timeAgo(notif.created_at)}</p>
                        </div>

                        {/* Delete */}
                        <button
                          onClick={(e) => { e.stopPropagation(); remove(notif.id) }}
                          className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-400 hover:text-red-600 transition-all shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-brand-100 px-4 py-2.5 shrink-0 flex items-center justify-between">
                <span className="text-[11px] text-brand-400">
                  {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => { closePanel(); navigate('/notifications') }}
                  className="text-[11px] text-brand-600 hover:text-brand-900 font-medium flex items-center gap-1 hover:underline"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
