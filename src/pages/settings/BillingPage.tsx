import { Check, Zap, Star, Crown } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import SettingsTabs from '@/components/settings/SettingsTabs'

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'For individual teachers getting started',
    icon: Zap,
    color: 'border-brand-200',
    features: ['5 documents', '3 papers/month', 'Basic grading (10 sheets)', 'AI queries (50/month)', '1 class'],
    cta: 'Current Plan',
    current: true,
  },
  {
    name: 'Pro',
    price: '$12',
    period: '/month',
    description: 'For active educators who need more',
    icon: Star,
    color: 'border-brand-500',
    badge: 'Most Popular',
    features: ['Unlimited documents', 'Unlimited papers', 'Unlimited grading', 'AI queries (unlimited)', '10 classes', 'Export to PDF', 'Priority support'],
    cta: 'Upgrade to Pro',
    current: false,
  },
  {
    name: 'School',
    price: '$49',
    period: '/month',
    description: 'For departments and schools',
    icon: Crown,
    color: 'border-accent-400',
    features: ['Everything in Pro', 'Up to 20 teachers', 'Admin dashboard', 'Custom branding', 'Dedicated support', 'API access', 'SSO'],
    cta: 'Contact Sales',
    current: false,
  },
]

const INVOICES = [
  { id: 'INV-001', date: 'Feb 2026', amount: '$0.00', status: 'Free' },
  { id: 'INV-000', date: 'Jan 2026', amount: '$0.00', status: 'Free' },
]

export default function BillingPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Settings" subtitle="Manage your account and preferences" />
      <SettingsTabs active="billing" />

      {/* Plans */}
      <div>
        <h2 className="section-title mb-4">Choose Your Plan</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {PLANS.map(plan => {
            const Icon = plan.icon
            return (
              <motion.div
                key={plan.name}
                whileHover={{ y: -3 }}
                className={`card p-6 flex flex-col gap-4 relative border-2 ${plan.color}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-[10px] font-bold px-3 py-1 rounded-full">
                    {plan.badge}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-brand-500" />
                  </div>
                  <span className="font-bold text-[#0f172a]">{plan.name}</span>
                </div>
                <div>
                  <span className="text-3xl font-black text-[#0f172a]">{plan.price}</span>
                  <span className="text-brand-500 text-sm">{plan.period}</span>
                  <p className="text-xs text-brand-600 mt-1">{plan.description}</p>
                </div>
                <ul className="space-y-2 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-brand-700">
                      <Check className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />{f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => plan.current ? undefined : toast.info(`Upgrade to ${plan.name} coming soon!`)}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    plan.current
                      ? 'bg-brand-100 text-brand-500 cursor-default'
                      : plan.name === 'Pro'
                        ? 'btn-primary'
                        : 'btn-ghost border border-brand-300'
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Usage */}
      <div className="card p-6 max-w-lg">
        <h2 className="section-title mb-4">Current Usage</h2>
        <div className="space-y-3">
          {[
            { label: 'Documents',    used: 3,  max: 5 },
            { label: 'Papers',       used: 1,  max: 3 },
            { label: 'Graded Sheets',used: 7,  max: 10 },
            { label: 'AI Queries',   used: 23, max: 50 },
          ].map(({ label, used, max }) => (
            <div key={label}>
              <div className="flex justify-between text-xs text-brand-700 mb-1">
                <span>{label}</span>
                <span className="font-medium">{used} / {max}</span>
              </div>
              <div className="h-2 bg-brand-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${used/max > 0.8 ? 'bg-accent-500' : 'bg-brand-500'}`}
                  style={{ width: `${(used/max)*100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invoice history */}
      <div className="card p-6 max-w-lg">
        <h2 className="section-title mb-4">Invoice History</h2>
        {INVOICES.length === 0 ? (
          <p className="text-sm text-brand-500">No invoices yet.</p>
        ) : (
          <div className="space-y-2">
            {INVOICES.map(inv => (
              <div key={inv.id} className="flex items-center justify-between py-2 border-b border-brand-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-[#0f172a]">{inv.id}</p>
                  <p className="text-xs text-brand-500">{inv.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-brand-700">{inv.amount}</span>
                  <span className="badge badge-gray text-xs">{inv.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
