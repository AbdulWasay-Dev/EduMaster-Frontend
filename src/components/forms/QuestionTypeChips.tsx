import { cn } from '@/lib/utils'
import type { QuestionType } from '@/types'

const TYPES: { value: QuestionType; label: string }[] = [
  { value: 'mcq',          label: 'MCQ' },
  { value: 'short_answer', label: 'Short Answer' },
  { value: 'long_answer',  label: 'Long Answer' },
  { value: 'true_false',   label: 'True / False' },
  { value: 'fill_blank',   label: 'Fill in the Blank' },
]

interface QuestionTypeChipsProps {
  value: QuestionType[]
  onChange: (v: QuestionType[]) => void
}

export default function QuestionTypeChips({ value, onChange }: QuestionTypeChipsProps) {
  const toggle = (t: QuestionType) => {
    if (value.includes(t)) {
      if (value.length === 1) return // must keep at least 1
      onChange(value.filter(v => v !== t))
    } else {
      onChange([...value, t])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {TYPES.map(type => {
        const active = value.includes(type.value)
        return (
          <button
            key={type.value}
            type="button"
            onClick={() => toggle(type.value)}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all',
              active
                ? 'bg-brand-500 text-white border-brand-500 shadow-brand'
                : 'bg-white text-brand-600 border-brand-200 hover:border-brand-400',
            )}
          >
            {type.label}
          </button>
        )
      })}
    </div>
  )
}
