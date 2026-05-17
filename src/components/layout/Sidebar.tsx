import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, Users, FileText, ScrollText,
  CheckSquare, Bot, BarChart3, Bell, Settings, LogOut,
  ChevronLeft, ChevronRight, Calendar, ClipboardCheck, BookOpenCheck
} from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { cn, getInitials } from '@/lib/utils'
import { toast } from 'sonner'

const NAV_ITEMS = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/subjects',     icon: BookOpen,        label: 'Subjects' },
  { to: '/classes',      icon: Users,           label: 'Classes' },
  { to: '/assignments',  icon: ScrollText,      label: 'Assignments' },
  { to: '/documents',    icon: FileText,        label: 'Documents' },
  { to: '/papers',       icon: ScrollText,      label: 'Papers' },
  { to: '/grading',      icon: CheckSquare,     label: 'Grading' },
  { to: '/schedule',     icon: Calendar,        label: 'Schedule' },
  { to: '/attendance',   icon: ClipboardCheck,  label: 'Attendance' },
  { to: '/ai-assistant', icon: Bot,             label: 'AI Assistant' },
  { to: '/analytics',    icon: BarChart3,       label: 'Analytics' },
  { to: '/notifications',icon: Bell,            label: 'Notifications' },
  { to: '/settings',     icon: Settings,        label: 'Settings' },
]

export default function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col h-screen shrink-0 relative z-30 transition-all duration-300',
        collapsed ? 'w-[60px]' : 'w-[260px]',
      )}
      style={{ background: '#0f172a', borderRight: '1px solid #1e293b' }}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5',
        collapsed && 'justify-center px-2',
      )}
        style={{ borderBottom: '1px solid #1e293b' }}
      >
        <div
          className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center"
          style={{ background: '#0281FF' }}
        >
          <BookOpenCheck className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-extrabold text-white text-[17px] tracking-tight">
            EduMaster
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150 group',
                isActive
                  ? 'text-white'
                  : 'text-[#94a3b8] hover:text-white hover:bg-white/5',
                collapsed && 'justify-center px-2',
              )
            }
            style={({ isActive }) => isActive ? { background: '#0281FF' } : {}}
            title={collapsed ? label : undefined}
          >
            {({ isActive }) => (
              <>
                <Icon className={cn(
                  'w-4 h-4 shrink-0',
                  isActive ? 'text-white' : 'text-[#64748b] group-hover:text-white',
                )} />
                {!collapsed && <span>{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      {user && (
        <div
          className={cn('p-3', collapsed ? 'flex justify-center' : '')}
          style={{ borderTop: '1px solid #1e293b' }}
        >
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full text-white text-xs font-bold shrink-0 flex items-center justify-center"
                style={{ background: '#0281FF' }}
              >
                {getInitials(user.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-[13px] font-medium truncate">{user.name}</p>
                <p className="text-[#64748b] text-[11px] truncate capitalize">{user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-[#64748b] hover:text-red-400 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="text-[#64748b] hover:text-red-400 transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-16 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-colors"
        style={{ background: '#0281FF', color: 'white' }}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed
          ? <ChevronRight className="w-3 h-3" />
          : <ChevronLeft className="w-3 h-3" />
        }
      </button>
    </aside>
  )
}
