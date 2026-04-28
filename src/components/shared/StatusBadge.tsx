import { cn, statusBadgeClass, capitalize } from '@/lib/utils'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'

interface StatusBadgeProps {
  status: string
  className?: string
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const cls = statusBadgeClass(status)
  const isProcessing = status.toLowerCase() === 'processing'

  return (
    <span className={cn('badge', cls, className)}>
      {isProcessing && <LoadingSpinner size="sm" />}
      {capitalize(status)}
    </span>
  )
}
