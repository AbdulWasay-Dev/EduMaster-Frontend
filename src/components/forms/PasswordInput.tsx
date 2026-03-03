import { useState, forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  showStrength?: boolean
}

function getStrength(password: string): 0 | 1 | 2 | 3 | 4 {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return score as 0 | 1 | 2 | 3 | 4
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Strong', 'Very Strong']
const STRENGTH_COLORS = ['', 'bg-accent-500', 'bg-gold-400', 'bg-emerald-400', 'bg-emerald-500']

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showStrength, className, value, onChange, ...props }, ref) => {
    const [show, setShow] = useState(false)
    const str = showStrength ? getStrength(String(value ?? '')) : 0

    return (
      <div className="space-y-1.5">
        <div className="relative">
          <input
            ref={ref}
            type={show ? 'text' : 'password'}
            className={cn('input pr-10', className)}
            value={value}
            onChange={onChange}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-600 transition-colors"
            tabIndex={-1}
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {showStrength && String(value ?? '').length > 0 && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={cn(
                  'h-1 flex-1 rounded-full transition-all',
                  i <= str ? STRENGTH_COLORS[str] : 'bg-brand-200',
                )} />
              ))}
            </div>
            <p className={cn(
              'text-xs font-medium',
              str <= 1 ? 'text-accent-500' : str === 2 ? 'text-gold-500' : 'text-emerald-600',
            )}>
              {STRENGTH_LABELS[str]}
            </p>
          </div>
        )}
      </div>
    )
  }
)
PasswordInput.displayName = 'PasswordInput'
export default PasswordInput
