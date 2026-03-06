import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { StudentAccount } from '@/types'

interface StudentAuthState {
  token: string | null
  student: StudentAccount | null
  isAuthenticated: boolean
  login: (token: string, student: StudentAccount) => void
  logout: () => void
  setStudent: (student: StudentAccount) => void
}

export const useStudentAuthStore = create<StudentAuthState>()(
  persist(
    (set) => ({
      token: null,
      student: null,
      isAuthenticated: false,

      login: (token, student) =>
        set({ token, student, isAuthenticated: true }),

      logout: () =>
        set({ token: null, student: null, isAuthenticated: false }),

      setStudent: (student) =>
        set({ student }),
    }),
    {
      name: 'edumaster-student-auth',
      partialize: (state) => ({
        token: state.token,
        student: state.student,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
