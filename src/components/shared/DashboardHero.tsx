import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type MetricTone = 'default' | 'brand' | 'emerald' | 'amber' | 'violet'

interface HeroMetric {
  label: string
  value: ReactNode
  tone?: MetricTone
}

interface DashboardHeroProps {
  eyebrow: string
  title: string
  description: string
  icon: ReactNode
  metrics: HeroMetric[]
  actions?: ReactNode
  className?: string
}

const metricToneClasses: Record<MetricTone, string> = {
  default: 'bg-white/15',
  brand: 'bg-brand-500/30',
  emerald: 'bg-emerald-500/30',
  amber: 'bg-amber-500/25',
  violet: 'bg-violet-500/25',
}

export default function DashboardHero({
  eyebrow,
  title,
  description,
  icon,
  metrics,
  actions,
  className,
}: DashboardHeroProps) {
  return (
    <div className={cn('relative overflow-hidden bg-gradient-to-br from-[#0f172a] to-brand-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl', className)}>
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-brand-500/15 translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500/30 flex items-center justify-center">
              {icon}
            </div>
            <span className="text-brand-200 text-sm font-medium">{eyebrow}</span>
          </div>

          <h1 className="text-3xl font-bold mb-1">{title}</h1>
          <p className="text-white/65 text-sm max-w-xl">{description}</p>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-4 mt-5">
            {metrics.map(({ label, value, tone = 'default' }) => (
              <div key={label} className={cn(metricToneClasses[tone], 'rounded-xl px-4 py-2 text-center min-w-[82px]')}>
                <p className="text-xl font-bold leading-tight">{value}</p>
                <p className="text-[10px] text-white/65 uppercase tracking-wide">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {actions && (
          <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
