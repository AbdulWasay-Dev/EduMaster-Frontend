import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Flame, Mail } from 'lucide-react'
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
      // Fetch user profile
      const tempStore = useAuthStore.getState()
      tempStore.login(tokens.access_token, { id: '', name: '', email: data.email, role: 'teacher' })
      const profile = await getProfile()
      storeLogin(tokens.access_token, profile)
      toast.success(`Welcome back, ${profile.name}! 🔥`)
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Invalid email or password'
      setError(typeof msg === 'string' ? msg : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-hero-gradient relative overflow-hidden px-4">
      {/* Animated blobs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="card p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-500 shadow-brand mb-3">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#1C0A00]">
              Edu<span className="gradient-text">Master</span>
            </h1>
            <p className="text-sm text-brand-700 mt-1">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-accent-50 border border-accent-200 text-accent-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@school.edu"
                  className="input pl-9"
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-xs text-accent-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs text-brand-500 hover:text-brand-700 font-medium">
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                {...register('password')}
                value={passwordValue}
                placeholder="Your password"
                autoComplete="current-password"
              />
              {errors.password && <p className="text-xs text-accent-500 mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex items-center gap-2">
              <input
                {...register('remember')}
                id="remember"
                type="checkbox"
                className="w-4 h-4 rounded border-brand-300 accent-brand-500"
              />
              <label htmlFor="remember" className="text-sm text-brand-700 cursor-pointer">Remember me</label>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? <LoadingSpinner size="sm" /> : 'Sign In'}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-brand-400">or</span>
            </div>
          </div>

          <button
            disabled
            title="Coming soon"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-brand-200 bg-brand-50 text-sm font-medium text-brand-400 cursor-not-allowed"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 opacity-50" />
            Continue with Google
            <span className="badge badge-amber text-[10px]">Soon</span>
          </button>

          <p className="text-center text-sm text-brand-700 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-500 font-semibold hover:text-brand-700">
              Create one free
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
