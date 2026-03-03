import { NavLink } from 'react-router-dom'
import { LayoutDashboard, BookOpen, ScrollText, CheckSquare, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'

const MOBILE_NAV = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Home' },
  { to: '/subjects',     icon: BookOpen,        label: 'Subjects' },
  { to: '/papers',       icon: ScrollText,      label: 'Papers' },
  { to: '/grading',      icon: CheckSquare,     label: 'Grading' },
  { to: '/ai-assistant', icon: Bot,             label: 'AI' },
]

export default function MobileBottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-sidebar-bg border-t border-sidebar-border z-30 flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
      {MOBILE_NAV.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors',
              isActive ? 'text-brand-400' : 'text-sidebar-text',
            )
          }
        >
          <Icon className="w-5 h-5" />
          <span className="text-[10px] font-medium">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
