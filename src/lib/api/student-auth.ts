import api from '@/lib/axios'
import type { StudentAuthTokens, StudentAccount } from '@/types'

export interface StudentLoginPayload {
  email: string
  password: string
}

export interface StudentSignupPayload {
  full_name: string
  email: string
  password: string
  class_code: string
  roll_number?: string
  student_id?: string
  phone?: string
}

export interface ValidateCodeResponse {
  valid: boolean
  class_name?: string
  class_id?: string
  class_code?: string
}

export async function validateClassCode(code: string): Promise<ValidateCodeResponse> {
  const { data } = await api.get<ValidateCodeResponse>(`/student-auth/validate-class-code/${code}`)
  return data
}

export async function studentSignup(payload: StudentSignupPayload): Promise<StudentAuthTokens> {
  const { data } = await api.post<StudentAuthTokens>('/student-auth/signup', payload)
  if ((data as unknown as { user?: unknown }).user && !(data as unknown as { student?: unknown }).student) {
    const response = data as unknown as StudentAuthTokens & { user?: StudentAccount }
    return {
      ...response,
      student: response.user ?? response.student,
    }
  }
  return data
}

export async function studentLogin(payload: StudentLoginPayload): Promise<StudentAuthTokens> {
  const { data } = await api.post<StudentAuthTokens>('/student-auth/login', payload)
  if ((data as unknown as { user?: unknown }).user && !(data as unknown as { student?: unknown }).student) {
    const response = data as unknown as StudentAuthTokens & { user?: StudentAccount }
    return {
      ...response,
      student: response.user ?? response.student,
    }
  }
  return data
}

export async function getStudentProfile(): Promise<StudentAccount> {
  const { data } = await api.get<StudentAccount>('/student-auth/profile')
  return data
}

export async function updateStudentProfile(payload: Partial<StudentAccount>): Promise<StudentAccount> {
  const { data } = await api.patch<StudentAccount>('/student-auth/profile', payload)
  return data
}
