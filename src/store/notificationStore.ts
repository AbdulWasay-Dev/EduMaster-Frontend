/**
 * Zustand store for notifications.
 * Polls every 60 s while the user is logged in.
 */
import { create } from 'zustand'
import type { AppNotification } from '@/types'
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearReadNotifications,
  getUnreadCount,
} from '@/lib/api/notifications'

interface NotificationState {
  notifications: AppNotification[]
  unreadCount: number
  loading: boolean
  panelOpen: boolean

  // actions
  fetchNotifications: () => Promise<void>
  fetchUnreadCount: () => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  remove: (id: string) => Promise<void>
  clearRead: () => Promise<void>
  togglePanel: () => void
  closePanel: () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  panelOpen: false,

  fetchNotifications: async () => {
    set({ loading: true })
    try {
      const { notifications, unread_count } = await listNotifications()
      set({ notifications, unreadCount: unread_count, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  fetchUnreadCount: async () => {
    try {
      const count = await getUnreadCount()
      set({ unreadCount: count })
    } catch {
      // swallow
    }
  },

  markRead: async (id) => {
    await markNotificationRead(id)
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n,
      ),
      unreadCount: Math.max(0, s.unreadCount - (s.notifications.find((n) => n.id === id && !n.is_read) ? 1 : 0)),
    }))
  },

  markAllRead: async () => {
    await markAllNotificationsRead()
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    }))
  },

  remove: async (id) => {
    const wasUnread = get().notifications.find((n) => n.id === id && !n.is_read)
    await deleteNotification(id)
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
      unreadCount: wasUnread ? Math.max(0, s.unreadCount - 1) : s.unreadCount,
    }))
  },

  clearRead: async () => {
    await clearReadNotifications()
    set((s) => ({
      notifications: s.notifications.filter((n) => !n.is_read),
    }))
  },

  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  closePanel: () => set({ panelOpen: false }),
}))
