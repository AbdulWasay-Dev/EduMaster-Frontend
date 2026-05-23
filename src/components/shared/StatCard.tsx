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
      whileHover={{ y: -2 } as any}
      className={cn(
        'bg-white rounded-2xl border border-[#e2e8f0] p-5 transition-shadow hover:shadow-lg cursor-default',
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-[12px] font-semibold text-[#64748b] uppercase tracking-wider">{title}</p>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: '#EAF3FF' }}
        >
          <Icon className="w-5 h-5" style={{ color: '#0A66C2' }} />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <p className="text-[28px] font-extrabold text-[#0f172a] tracking-tight">
          {prefix}
          <CountUp end={value} duration={1.2} separator="," />
          {suffix}
        </p>
      </div>
      {delta !== undefined && (
        <div className={cn(
          'flex items-center gap-1 mt-2 text-[11px] font-semibold',
          isPositive ? 'text-emerald-600' : 'text-red-500',
        )}>
          {isPositive
            ? <TrendingUp className="w-3 h-3" />
            : <TrendingDown className="w-3 h-3" />
          }
          <span>{isPositive ? '+' : ''}{delta} {deltaLabel ?? 'this month'}</span>
        </div>
      )}
      {deltaLabel && delta === undefined && (
        <p className="text-[11px] text-[#94a3b8] mt-2">{deltaLabel}</p>
      )}
    </motion.div>
  )
}
