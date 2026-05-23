import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Search, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
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
  const navigate = useNavigate()
  const breadcrumbs = useBreadcrumbs()

  const handleLogout = () => {
    logout()
    toast.success('Logged out')
    navigate('/login')
  }

  return (
    <header
      className="flex items-center justify-between h-14 px-4 lg:px-6 shrink-0 z-20"
      style={{ background: 'white', borderBottom: '1px solid #e2e8f0' }}
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[13px]">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.to} className="flex items-center gap-1.5">
            {i > 0 && <span style={{ color: '#cbd5e1' }}>/</span>}
            {crumb.isLast ? (
              <span className="font-semibold" style={{ color: '#0f172a' }}>{crumb.label}</span>
            ) : (
              <Link to={crumb.to} className="transition-colors hover:underline" style={{ color: '#64748b' }}>
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div
          className="hidden md:flex items-center gap-2 rounded-xl px-3 py-1.5 w-48 lg:w-56"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
        >
          <Search className="w-3.5 h-3.5 shrink-0" style={{ color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search…"
            className="bg-transparent text-[13px] outline-none flex-1 min-w-0"
            style={{ color: '#0f172a' }}
          />
        </div>

        {/* Notifications dropdown */}
        <NotificationDropdown />

        {/* User avatar */}
        {user && (
          <div className="flex items-center gap-2 pl-2" style={{ borderLeft: '1px solid #e2e8f0' }}>
            <div
              className="w-8 h-8 rounded-full text-white text-[11px] font-bold flex items-center justify-center cursor-pointer"
              style={{ background: '#0A66C2' }}
            >
              {getInitials(user.name)}
            </div>
            <div className="hidden lg:block">
              <p className="text-[12px] font-semibold leading-tight" style={{ color: '#0f172a' }}>{user.name}</p>
              <p className="text-[10px] capitalize" style={{ color: '#94a3b8' }}>{user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg transition-colors hover:bg-[#f8fafc]"
              style={{ color: '#94a3b8' }}
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
