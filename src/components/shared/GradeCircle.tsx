import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GradeCircleProps {
  percentage: number
  size?: number
  strokeWidth?: number
  className?: string
}

export default function GradeCircle({
  percentage,
  size = 120,
  strokeWidth = 8,
  className,
}: GradeCircleProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  const color =
    percentage >= 80 ? '#10b981' :
    percentage >= 60 ? '#fbbf24' :
    '#ef4444'

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#fed7aa"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-bold text-[#1C0A00]">{Math.round(percentage)}%</span>
      </div>
    </div>
  )
}
