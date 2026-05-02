import { Link } from 'react-router-dom'
import { User, Shield, CreditCard, ScrollText } from 'lucide-react'

type ActiveTab = 'profile' | 'security' | 'billing' | 'paper-defaults'

const TABS: { label: string; to: string; icon: React.ElementType; key: ActiveTab }[] = [
  { label: 'Profile',        to: '/settings/profile',        icon: User,       key: 'profile' },
  { label: 'Paper Defaults', to: '/settings/paper-defaults', icon: ScrollText, key: 'paper-defaults' },
  { label: 'Security',       to: '/settings/security',       icon: Shield,     key: 'security' },
  { label: 'Billing',        to: '/settings/billing',        icon: CreditCard, key: 'billing' },
]

export default function SettingsTabs({ active }: { active: ActiveTab }) {
  return (
    <div className="flex items-center gap-1 bg-brand-50 p-1 rounded-xl w-fit">
      {TABS.map(({ label, to, icon: Icon, key }) => (
        <Link
          key={to}
          to={to}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            active === key ? 'bg-white text-brand-900 shadow-sm' : 'text-brand-600 hover:text-brand-900'
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
        </Link>
      ))}
    </div>
  )
}
