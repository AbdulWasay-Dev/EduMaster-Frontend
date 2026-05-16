import { useState, forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

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
const STRENGTH_BAR_COLORS = ['', '#ef4444', '#f59e0b', '#22c55e', '#16a34a']
const STRENGTH_TEXT_COLORS = ['', '#ef4444', '#f59e0b', '#16a34a', '#16a34a']

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showStrength, value, onChange, ...props }, ref) => {
    const [show, setShow] = useState(false)
    const str = showStrength ? getStrength(String(value ?? '')) : 0

    return (
      <div className="space-y-1.5">
        <div className="relative">
          <input
            ref={ref}
            type={show ? 'text' : 'password'}
            value={value}
            onChange={onChange}
            className="w-full h-[44px] px-3.5 pr-10 rounded-xl border border-[#e2e8f0] bg-white text-[14px] text-[#0f172a] placeholder:text-[#94a3b8] outline-none transition-all focus:border-[#0281FF] focus:ring-2 focus:ring-[#0281FF]/10"
            {...props}
          />
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: '#94a3b8' }}
            tabIndex={-1}
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {showStrength && String(value ?? '').length > 0 && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full transition-all"
                  style={{
                    background: i <= str ? STRENGTH_BAR_COLORS[str] : '#e2e8f0',
                  }}
                />
              ))}
            </div>
            <p
              className="text-[11px] font-medium"
              style={{ color: STRENGTH_TEXT_COLORS[str] }}
            >
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
