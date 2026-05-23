import { NavLink } from 'react-router-dom'
import { LayoutDashboard, BookOpen, ScrollText, CheckSquare, Bot, Calendar, ClipboardCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

const MOBILE_NAV = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Home' },
  { to: '/subjects',     icon: BookOpen,        label: 'Subjects' },
  { to: '/papers',       icon: ScrollText,      label: 'Papers' },
  { to: '/grading',      icon: CheckSquare,     label: 'Grading' },
  { to: '/schedule',     icon: Calendar,        label: 'Schedule' },
  { to: '/attendance',   icon: ClipboardCheck,  label: 'Attendance' },
  { to: '/ai-assistant', icon: Bot,             label: 'AI' },
]

export default function MobileBottomNav() {
  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 flex items-center justify-around px-2 py-2"
      style={{
        background: '#0A66C2',
        borderTop: '1px solid rgba(255,255,255,0.15)',
      }}
    >
      {MOBILE_NAV.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors',
              isActive ? 'bg-white/20' : '',
            )
          }
          style={{ color: 'white' }}
        >
          {({ isActive }) => (
            <>
              <Icon className="w-5 h-5" style={{ opacity: isActive ? 1 : 0.6 }} />
              <span className="text-[10px] font-medium" style={{ opacity: isActive ? 1 : 0.6 }}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
