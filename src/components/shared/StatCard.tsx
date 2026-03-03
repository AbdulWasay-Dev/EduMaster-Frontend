import type { LucideIcon } from 'lucide-react'
import CountUp from 'react-countup'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface StatCardProps {
  title: string
  value: number
  delta?: number
  deltaLabel?: string
  icon: LucideIcon
  prefix?: string
  suffix?: string
  className?: string
}

export default function StatCard({
  title, value, delta, deltaLabel, icon: Icon, prefix, suffix, className
}: StatCardProps) {
  const isPositive = (delta ?? 0) >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 10px 40px -8px rgba(28,10,0,0.12)' } as any}
      className={cn('card p-5 cursor-default', className)}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-brand-700 uppercase tracking-wide">{title}</p>
        </div>
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-100">
          <Icon className="w-5 h-5 text-brand-600" />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <p className="text-3xl font-bold text-[#1C0A00]">
          {prefix}
          <CountUp end={value} duration={1.2} separator="," />
          {suffix}
        </p>
      </div>
      {delta !== undefined && (
        <div className={cn(
          'flex items-center gap-1 mt-2 text-xs font-semibold',
          isPositive ? 'text-emerald-600' : 'text-accent-500',
        )}>
          {isPositive
            ? <TrendingUp className="w-3 h-3" />
            : <TrendingDown className="w-3 h-3" />
          }
          <span>{isPositive ? '+' : ''}{delta} {deltaLabel ?? 'this month'}</span>
        </div>
      )}
    </motion.div>
  )
}
