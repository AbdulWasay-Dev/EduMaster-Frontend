import api from '@/lib/axios'
import type { AppNotification } from '@/types'

interface ListResponse {
  notifications: AppNotification[]
  unread_count: number
  total: number
}

export async function listNotifications(): Promise<ListResponse> {
  const { data } = await api.get<ListResponse>('/notifications/')
  return data
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await api.get<{ unread_count: number }>('/notifications/unread-count')
  return data.unread_count ?? 0
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.put(`/notifications/${id}/read`)
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.put('/notifications/mark-all-read')
}

export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`/notifications/${id}`)
}

export async function clearReadNotifications(): Promise<void> {
  await api.delete('/notifications/clear-read')
}
