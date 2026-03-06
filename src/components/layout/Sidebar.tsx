import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, Users, FileText, ScrollText,
  CheckSquare, Bot, BarChart3, Bell, Settings, LogOut,
  ChevronLeft, ChevronRight, Flame,
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
        'hidden lg:flex flex-col h-screen bg-sidebar-bg border-r border-sidebar-border transition-all duration-300 shrink-0 relative z-30',
        collapsed ? 'w-[60px]' : 'w-[260px]',
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-sidebar-border',
        collapsed && 'justify-center px-2',
      )}>
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-500 shadow-brand shrink-0">
          <Flame className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-white text-lg tracking-tight">
            Edu<span className="text-brand-400">Master</span>
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
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-sidebar-active text-white shadow-brand'
                  : 'text-sidebar-text hover:bg-white/10 hover:text-white',
                collapsed && 'justify-center px-2',
              )
            }
            title={collapsed ? label : undefined}
          >
            {({ isActive }) => (
              <>
                <Icon className={cn(
                  'w-4 h-4 shrink-0',
                  isActive ? 'text-white' : 'text-sidebar-icon group-hover:text-white',
                )} />
                {!collapsed && <span>{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      {user && (
        <div className={cn(
          'border-t border-sidebar-border p-3',
          collapsed ? 'flex justify-center' : '',
        )}>
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-500 text-white text-xs font-bold shrink-0">
                {getInitials(user.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user.name}</p>
                <p className="text-sidebar-text text-xs truncate">{user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-sidebar-icon hover:text-accent-400 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="text-sidebar-icon hover:text-accent-400 transition-colors"
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
        className="absolute -right-3 top-16 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-brand-500 text-white shadow-brand hover:bg-brand-600 transition-colors"
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
