import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { GraduationCap, Mail, User, KeyRound, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import PasswordInput from '@/components/forms/PasswordInput'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { validateClassCode, studentSignup } from '@/lib/api/student-auth'
import { useStudentAuthStore } from '@/store/studentAuthStore'

// Step 1 schema
const codeSchema = z.object({
  class_code: z.string().min(4, 'Enter a valid class code'),
})

// Step 2 schema
const signupSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

type CodeForm = z.infer<typeof codeSchema>
type SignupForm = z.infer<typeof signupSchema>

export default function StudentSignupPage() {
  const navigate = useNavigate()
  const storeLogin = useStudentAuthStore((s) => s.login)
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [classCode, setClassCode] = useState('')
  const [className, setClassName] = useState('')

  // Step 1 form
  const codeForm = useForm<CodeForm>({ resolver: zodResolver(codeSchema) })
  // Step 2 form
  const signupForm = useForm<SignupForm>({ resolver: zodResolver(signupSchema) })

  const onValidateCode = async (data: CodeForm) => {
    setLoading(true)
    setError(null)
    try {
      const result = await validateClassCode(data.class_code)
      if (result.valid) {
        setClassCode(data.class_code)
        setClassName(result.class_name || 'Your Class')
        setStep(2)
      } else {
        setError('Invalid class code. Please check with your teacher.')
      }
    } catch {
      setError('Could not validate class code. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const onSignup = async (data: SignupForm) => {
    setLoading(true)
    setError(null)
    try {
      const result = await studentSignup({
        full_name: data.full_name,
        email: data.email,
        password: data.password,
        class_code: classCode,
      })
      storeLogin(result.access_token, result.student)
      toast.success(`Welcome, ${result.student.full_name}! Your account is pending verification.`)
      navigate('/student/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Signup failed'
      setError(typeof msg === 'string' ? msg : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 relative overflow-hidden px-4">
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-sky-500/15 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl border border-sky-100 p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-sky-500 shadow-lg mb-3">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">
              Student <span className="text-sky-500">Sign Up</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {step === 1 ? 'Enter your class code to get started' : `Joining: ${className}`}
            </p>
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className={`flex items-center gap-1.5 text-xs font-medium ${step >= 1 ? 'text-sky-500' : 'text-slate-300'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${step > 1 ? 'bg-green-500' : 'bg-sky-500'}`}>
                {step > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
              </div>
              Class Code
            </div>
            <div className="w-8 h-px bg-slate-200" />
            <div className={`flex items-center gap-1.5 text-xs font-medium ${step >= 2 ? 'text-sky-500' : 'text-slate-300'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                2
              </div>
              Your Details
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={codeForm.handleSubmit(onValidateCode)}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Class Code</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
                    <input
                      {...codeForm.register('class_code')}
                      type="text"
                      placeholder="e.g. ABC123"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent uppercase tracking-widest font-mono"
                      autoFocus
                    />
                  </div>
                  {codeForm.formState.errors.class_code && (
                    <p className="text-xs text-red-500 mt-1">{codeForm.formState.errors.class_code.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-sky-500 text-white font-semibold text-sm hover:bg-sky-600 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? <LoadingSpinner size="sm" /> : 'Verify Code'}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={signupForm.handleSubmit(onSignup)}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
                    <input
                      {...signupForm.register('full_name')}
                      type="text"
                      placeholder="Your full name"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                  {signupForm.formState.errors.full_name && (
                    <p className="text-xs text-red-500 mt-1">{signupForm.formState.errors.full_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
                    <input
                      {...signupForm.register('email')}
                      type="email"
                      placeholder="you@school.edu"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                  {signupForm.formState.errors.email && (
                    <p className="text-xs text-red-500 mt-1">{signupForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <PasswordInput
                    {...signupForm.register('password')}
                    placeholder="Choose a password"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                  {signupForm.formState.errors.password && (
                    <p className="text-xs text-red-500 mt-1">{signupForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                  <PasswordInput
                    {...signupForm.register('confirm_password')}
                    placeholder="Confirm your password"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                  {signupForm.formState.errors.confirm_password && (
                    <p className="text-xs text-red-500 mt-1">{signupForm.formState.errors.confirm_password.message}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(null) }}
                    className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-lg bg-sky-500 text-white font-semibold text-sm hover:bg-sky-600 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <LoadingSpinner size="sm" /> : 'Create Account'}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/student/login" className="text-sky-500 font-medium hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
