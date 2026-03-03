import { Link } from 'react-router-dom'
import { User, Shield, CreditCard } from 'lucide-react'

const TABS = [
  { label: 'Profile',  to: '/settings/profile',  icon: User },
  { label: 'Security', to: '/settings/security', icon: Shield },
  { label: 'Billing',  to: '/settings/billing',  icon: CreditCard },
]

export default function SettingsTabs({ active }: { active: 'profile' | 'security' | 'billing' }) {
  return (
    <div className="flex items-center gap-1 bg-brand-50 p-1 rounded-xl w-fit">
      {TABS.map(({ label, to, icon: Icon }) => {
        const isActive = active === label.toLowerCase()
        return (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive ? 'bg-white text-brand-900 shadow-sm' : 'text-brand-600 hover:text-brand-900'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </Link>
        )
      })}
    </div>
  )
}
