import api from '@/lib/axios'
import type { ScheduleEvent, EventType } from '@/types'

export interface CreateEventPayload {
  title: string
  description?: string
  date: string
  start_time: string
  end_time: string
  type: EventType
  class_id?: string
  class_name?: string
  is_all_day?: boolean
  repeat_weekly?: boolean
}

export async function listEvents(startDate?: string, endDate?: string): Promise<ScheduleEvent[]> {
  const params = new URLSearchParams()
  if (startDate) params.append('start_date', startDate)
  if (endDate) params.append('end_date', endDate)
  
  const query = params.toString() ? `?${params.toString()}` : ''
  const { data } = await api.get<ScheduleEvent[]>(`/schedule/${query}`)
  return data
}

export async function createEvent(payload: CreateEventPayload): Promise<ScheduleEvent> {
  const { data } = await api.post<ScheduleEvent>('/schedule/', payload)
  return data
}

export async function getEvent(id: string): Promise<ScheduleEvent> {
  const { data } = await api.get<ScheduleEvent>(`/schedule/${id}`)
  return data
}

export async function updateEvent(id: string, payload: Partial<CreateEventPayload>): Promise<ScheduleEvent> {
  const { data } = await api.put<ScheduleEvent>(`/schedule/${id}`, payload)
  return data
}

export async function deleteEvent(id: string): Promise<void> {
  await api.delete(`/schedule/${id}`)
}
