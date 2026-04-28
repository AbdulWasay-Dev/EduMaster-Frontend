import { cn, statusBadgeClass, capitalize } from '@/lib/utils'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'

interface StatusBadgeProps {
  status: string
  className?: string
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const safeStatus = status || 'pending';
  const cls = statusBadgeClass(safeStatus)
  const isProcessing = safeStatus.toLowerCase() === 'processing'

  return (
    <span className={cn('badge', cls, className)}>
      {isProcessing && <LoadingSpinner size="sm" />}
      {capitalize(safeStatus)}
    </span>
  )
}
