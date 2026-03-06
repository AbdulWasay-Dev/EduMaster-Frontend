import { Outlet } from 'react-router-dom'
import StudentSidebar from './StudentSidebar'
import { cn } from '@/lib/utils'

export default function StudentPortalShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F0F9FF]">
      {/* Student Sidebar */}
      <StudentSidebar />

      {/* Main area */}
      <div className={cn('flex flex-1 flex-col overflow-hidden transition-all duration-300')}>
        {/* Simple top bar */}
        <header className="flex items-center justify-between h-14 px-6 border-b border-sky-100 bg-white/80 backdrop-blur-sm shrink-0">
          <h2 className="text-sm font-semibold text-slate-600">Student Portal</h2>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="mx-auto max-w-5xl animate-slide-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
