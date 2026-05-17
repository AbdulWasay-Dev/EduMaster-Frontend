import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-[24px] sm:text-[28px] font-extrabold text-[#0f172a] tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[14px] text-[#64748b] mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="ml-4 shrink-0">{action}</div>}
    </div>
  )
}
