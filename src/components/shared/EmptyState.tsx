import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      {Icon && (
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-brand-100 mb-4">
          <Icon className="w-8 h-8 text-brand-500" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-[#1C0A00] mb-2">{title}</h3>
      {description && <p className="text-sm text-brand-700 max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  )
}
