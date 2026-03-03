import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface ProgressStepsProps {
  steps: string[]
  currentStep: number
}

export default function ProgressSteps({ steps, currentStep }: ProgressStepsProps) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const done = i < currentStep
        const active = i === currentStep
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full border-2 text-xs font-bold transition-all',
                done  ? 'bg-brand-500 border-brand-500 text-white' :
                active ? 'bg-white border-brand-500 text-brand-600' :
                         'bg-white border-brand-200 text-brand-400',
              )}>
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={cn(
                'text-[10px] font-medium mt-1 whitespace-nowrap',
                active ? 'text-brand-600' : done ? 'text-brand-500' : 'text-brand-400',
              )}>
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                'h-0.5 w-12 md:w-20 mx-1 mb-3 transition-all',
                done ? 'bg-brand-500' : 'bg-brand-200',
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}
