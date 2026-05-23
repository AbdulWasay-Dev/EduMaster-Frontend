import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ClipboardList, Trophy, BookOpen, Bot,
  LogOut, ChevronLeft, ChevronRight, GraduationCap,
} from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useStudentAuthStore } from '@/store/studentAuthStore'
import { cn, getInitials } from '@/lib/utils'
import { toast } from 'sonner'

const NAV_ITEMS = [
  { to: '/student/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/student/assignments',  icon: ClipboardList,   label: 'Assignments' },
  { to: '/student/scores',       icon: Trophy,          label: 'My Scores' },
  { to: '/student/subjects',     icon: BookOpen,        label: 'Subjects' },
  { to: '/student/ask-ai',       icon: Bot,             label: 'Ask AI' },
]

export default function StudentSidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const student = useStudentAuthStore((s) => s.student)
  const logout = useStudentAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/student/login')
  }

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col h-screen shrink-0 relative z-30 transition-all duration-300',
        collapsed ? 'w-[60px]' : 'w-[260px]',
      )}
      style={{
        background: 'linear-gradient(180deg, #0A66C2 0%, #0859A6 100%)',
        borderRight: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-white/15',
        collapsed && 'justify-center px-2',
      )}>
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 shadow-lg shrink-0">
          <GraduationCap className="w-4 h-4 text-white" />
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
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-white text-[#0A66C2] shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white',
                collapsed && 'justify-center px-2',
              )
            }
            title={collapsed ? label : undefined}
          >
            {({ isActive }) => (
              <>
                <Icon className={cn(
                  'w-4 h-4 shrink-0',
                  isActive ? 'text-[#0A66C2]' : 'text-white/50 group-hover:text-white',
                )} />
                {!collapsed && <span>{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      {student && (
        <div className={cn(
          'border-t border-white/15 p-3',
          collapsed ? 'flex justify-center' : '',
        )}>
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 text-white text-xs font-bold shrink-0">
                {getInitials(student.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{student.full_name}</p>
                <p className="text-white/50 text-xs truncate">Student</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-white/50 hover:text-white transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="text-white/50 hover:text-white transition-colors"
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
        className="absolute -right-3 top-16 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-white shadow-lg transition-colors"
        style={{ color: '#0A66C2' }}
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
