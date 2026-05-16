import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { BookOpen, Mail, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import PasswordInput from '@/components/forms/PasswordInput'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { login } from '@/lib/api/auth'
import { getProfile } from '@/lib/api/auth'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const storeLogin = useAuthStore((s) => s.login)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })
  const passwordValue = watch('password', '')

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError(null)
    try {
      const tokens = await login({ email: data.email, password: data.password })
      const tempStore = useAuthStore.getState()
      tempStore.login(tokens.access_token, { id: '', name: '', email: data.email, role: 'teacher' })
      const profile = await getProfile()
      storeLogin(tokens.access_token, profile)
      toast.success(`Welcome back, ${profile.name}!`)
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Invalid email or password'
      setError(typeof msg === 'string' ? msg : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 py-8"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[420px]"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <Link to="/" className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#0281FF' }}>
              <BookOpen className="w-[18px] h-[18px] text-white" />
            </div>
            <span className="font-extrabold text-[20px] text-[#0f172a]">EduMaster</span>
          </Link>
          <h1 className="text-[24px] sm:text-[28px] font-extrabold text-[#0f172a] tracking-tight">
            Welcome back
          </h1>
          <p className="text-[14px] text-[#64748b] mt-1">
            Sign in to your account to continue
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 sm:p-8 shadow-sm">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl text-[14px] border" style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-[13px] font-semibold text-[#0f172a] mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@school.edu"
                  autoComplete="email"
                  className="w-full h-[46px] pl-10 pr-4 rounded-xl border border-[#e2e8f0] bg-white text-[14px] text-[#0f172a] placeholder:text-[#94a3b8] outline-none transition-all focus:border-[#0281FF] focus:ring-2 focus:ring-[#0281FF]/10"
                />
              </div>
              {errors.email && <p className="text-[12px] text-[#ef4444] mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[13px] font-semibold text-[#0f172a]">Password</label>
                <Link to="/forgot-password" className="text-[12px] font-medium hover:underline" style={{ color: '#0281FF' }}>
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                {...register('password')}
                value={passwordValue}
                placeholder="Your password"
                autoComplete="current-password"
              />
              {errors.password && <p className="text-[12px] text-[#ef4444] mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex items-center gap-2.5">
              <input {...register('remember')} id="remember" type="checkbox" className="w-4 h-4 rounded border-[#cbd5e1] accent-[#0281FF]" />
              <label htmlFor="remember" className="text-[13px] text-[#64748b] cursor-pointer">Remember me</label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[48px] flex items-center justify-center gap-2 rounded-xl font-semibold text-[15px] transition-all duration-200 disabled:opacity-60"
              style={{ background: '#0f172a', color: 'white' }}
            >
              {loading ? <LoadingSpinner size="sm" /> : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#e2e8f0]" /></div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-[12px] text-[#94a3b8]">or</span>
            </div>
          </div>

          <button
            disabled
            title="Coming soon"
            className="w-full h-[46px] flex items-center justify-center gap-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] text-[14px] font-medium text-[#94a3b8] cursor-not-allowed"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 opacity-50" />
            Continue with Google
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: '#e2e8f0', color: '#64748b' }}>Soon</span>
          </button>
        </div>

        <p className="text-center text-[14px] text-[#64748b] mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold hover:underline" style={{ color: '#0281FF' }}>Create one free</Link>
        </p>
      </motion.div>
    </div>
  )
}
