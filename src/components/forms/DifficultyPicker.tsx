import { cn } from '@/lib/utils'
import type { DifficultyLevel } from '@/types'

const OPTIONS: { value: DifficultyLevel; label: string; color: string }[] = [
  { value: 'easy',   label: '🟢 Easy',   color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { value: 'medium', label: '🟡 Medium', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  { value: 'hard',   label: '🔴 Hard',   color: 'bg-accent-100 text-accent-700 border-accent-300' },
  { value: 'mixed',  label: '🌈 Mixed',  color: 'bg-brand-100 text-brand-700 border-brand-300' },
]

interface DifficultyPickerProps {
  value: DifficultyLevel
  onChange: (v: DifficultyLevel) => void
}

export default function DifficultyPicker({ value, onChange }: DifficultyPickerProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all',
            value === opt.value
              ? cn(opt.color, 'scale-105 shadow-sm')
              : 'border-brand-200 bg-white text-brand-600 hover:border-brand-300',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
