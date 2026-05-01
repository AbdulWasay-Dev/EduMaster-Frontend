import api from '@/lib/axios'
import type { User, AuthTokens } from '@/types'

export interface LoginPayload { email: string; password: string }
export interface RegisterPayload {
  email: string
  password: string
  name: string
  role?: string
  school_name?: string
  institution_type?: string
  institution_level?: string
  institution_address?: string
  institution_city?: string
  institution_country?: string
  department?: string
  designation?: string
  qualification?: string
  specialization?: string
  employee_id?: string
  phone?: string
}

export async function login(payload: LoginPayload): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>('/auth/login', payload)
  return data
}

export async function register(payload: RegisterPayload): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>('/auth/register', payload)
  return data
}

export async function getProfile(): Promise<User> {
  const { data } = await api.get<User>('/auth/profile')
  return data
}

export async function updateProfile(payload: Partial<User>): Promise<User> {
  const { data } = await api.put<User>('/auth/profile', payload)
  return data
}
