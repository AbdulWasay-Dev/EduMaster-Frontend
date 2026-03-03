import api from '@/lib/axios'
import type { AppNotification } from '@/types'

export async function listNotifications(): Promise<AppNotification[]> {
  const { data } = await api.get<{ notifications?: AppNotification[] } | AppNotification[]>('/notifications/')
  return Array.isArray(data) ? data : ((data as { notifications?: AppNotification[] }).notifications ?? [])
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.put(`/notifications/${id}/read`)
}

export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`/notifications/${id}`)
}
