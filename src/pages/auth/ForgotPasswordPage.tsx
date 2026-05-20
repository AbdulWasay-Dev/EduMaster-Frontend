import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Flame, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200)) // simulate API
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-hero-gradient relative overflow-hidden px-4">
      <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl animate-float" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="card p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-500 shadow-brand mb-3">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#0f172a]">Reset your password</h1>
            <p className="text-sm text-brand-700 mt-1 text-center">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 py-4"
              >
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-[#0f172a] mb-1">Check your inbox</h3>
                  <p className="text-sm text-brand-700">
                    We sent a reset link to <span className="font-semibold text-brand-900">{email}</span>
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div>
                  <label className="label">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@school.edu"
                      className="input pl-9"
                      required
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
                  {loading ? <LoadingSpinner size="sm" /> : 'Send Reset Link'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <Link
            to="/login"
            className="flex items-center justify-center gap-1.5 mt-6 text-sm text-brand-600 hover:text-brand-800 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
