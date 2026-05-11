import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Moon, Sun, Search, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { cn, getInitials } from '@/lib/utils'
import { toast } from 'sonner'
import NotificationDropdown from './NotificationDropdown'

function useBreadcrumbs() {
  const { pathname } = useLocation()
  const parts = pathname.split('/').filter(Boolean)
  return parts.map((part, i) => ({
    label: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
    to: '/' + parts.slice(0, i + 1).join('/'),
    isLast: i === parts.length - 1,
  }))
}

export default function TopNav() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { isDarkMode, toggleDarkMode } = useUIStore()
  const navigate = useNavigate()
  const breadcrumbs = useBreadcrumbs()

  const handleLogout = () => {
    logout()
    toast.success('Logged out')
    navigate('/login')
  }

  return (
    <header className="flex items-center justify-between h-14 px-4 lg:px-6 bg-white border-b border-brand-100 shrink-0 z-20">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.to} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-brand-300">/</span>}
            {crumb.isLast ? (
              <span className="font-semibold text-[#1C0A00]">{crumb.label}</span>
            ) : (
              <Link to={crumb.to} className="text-brand-700 hover:text-brand-500 transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-lg px-3 py-1.5 w-48 lg:w-64">
          <Search className="w-3.5 h-3.5 text-brand-400 shrink-0" />
          <input
            type="text"
            placeholder="Search…"
            className="bg-transparent text-sm text-[#1C0A00] placeholder-brand-400 outline-none flex-1 min-w-0"
          />
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors"
          title={isDarkMode ? 'Light mode' : 'Dark mode'}
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications dropdown */}
        <NotificationDropdown />

        {/* User avatar */}
        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-brand-200">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-white text-xs font-bold cursor-pointer">
              {getInitials(user.name)}
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-semibold text-[#1C0A00] leading-tight">{user.name}</p>
              <p className="text-[10px] text-brand-700 capitalize">{user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 hover:text-accent-500 transition-colors"
              title="Log out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
