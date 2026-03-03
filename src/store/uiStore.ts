import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  sidebarCollapsed: boolean
  isDarkMode: boolean
  onboardingDone: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void
  toggleDarkMode: () => void
  completeOnboarding: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      isDarkMode: false,
      onboardingDone: false,

      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      setSidebarCollapsed: (v) =>
        set({ sidebarCollapsed: v }),

      toggleDarkMode: () =>
        set((s) => {
          const next = !s.isDarkMode
          document.documentElement.classList.toggle('dark', next)
          return { isDarkMode: next }
        }),

      completeOnboarding: () =>
        set({ onboardingDone: true }),
    }),
    { name: 'edumaster-ui' },
  ),
)
