import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  BookOpen, Briefcase, Building2, GraduationCap, Mail, MapPin, Phone, User,
  ArrowRight, ArrowLeft, CheckCircle2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import PasswordInput from '@/components/forms/PasswordInput'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { register as registerApi, getProfile } from '@/lib/api/auth'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  name:            z.string().min(2, 'Name must be at least 2 characters'),
  email:           z.string().email('Invalid email'),
  password:        z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  school_name:     z.string().min(2, 'Institution name is required'),
  institution_type: z.string().min(2, 'Institution type is required'),
  institution_level: z.string().optional(),
  institution_address: z.string().optional(),
  institution_city: z.string().optional(),
  institution_country: z.string().optional(),
  department:      z.string().min(2, 'Department is required'),
  designation:     z.string().min(2, 'Designation is required'),
  qualification:   z.string().optional(),
  specialization:  z.string().optional(),
  employee_id:     z.string().optional(),
  phone:           z.string().optional(),
  terms:           z.boolean().refine(v => v, 'You must accept the terms'),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

const emptyToUndefined = (value?: string) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

const inputCls =
  'w-full h-[46px] px-3.5 rounded-xl border border-[#e2e8f0] bg-white text-[14px] text-[#0f172a] placeholder:text-[#94a3b8] outline-none transition-all focus:border-[#0281FF] focus:ring-2 focus:ring-[#0281FF]/10'
const inputIconCls = inputCls + ' pl-10'
const labelCls = 'block text-[13px] font-semibold text-[#0f172a] mb-1.5'
const errorCls = 'text-[12px] text-[#ef4444] mt-1'

const STEPS = [
  { label: 'Account', icon: User },
  { label: 'Institution', icon: Building2 },
  { label: 'Profile', icon: Briefcase },
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const storeLogin = useAuthStore((s) => s.login)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(0)

  const { register, handleSubmit, watch, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { institution_type: 'school' },
    mode: 'onTouched',
  })
  const passwordValue = watch('password', '')

  const goNext = async () => {
    let fieldsToValidate: (keyof FormData)[] = []
    if (step === 0) fieldsToValidate = ['name', 'email', 'password', 'confirmPassword']
    if (step === 1) fieldsToValidate = ['school_name', 'institution_type']

    const valid = await trigger(fieldsToValidate)
    if (valid) setStep(s => Math.min(s + 1, 2))
  }

  const goBack = () => setStep(s => Math.max(s - 1, 0))

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError(null)
    try {
      const tokens = await registerApi({
        email: data.email, password: data.password, name: data.name,
        school_name: data.school_name, institution_type: data.institution_type,
        institution_level: emptyToUndefined(data.institution_level),
        institution_address: emptyToUndefined(data.institution_address),
        institution_city: emptyToUndefined(data.institution_city),
        institution_country: emptyToUndefined(data.institution_country),
        department: data.department, designation: data.designation,
        qualification: emptyToUndefined(data.qualification),
        specialization: emptyToUndefined(data.specialization),
        employee_id: emptyToUndefined(data.employee_id),
        phone: emptyToUndefined(data.phone),
      })
      useAuthStore.getState().login(tokens.access_token, { id: '', name: data.name, email: data.email, role: 'teacher' })
      const profile = await getProfile()
      storeLogin(tokens.access_token, profile)
      toast.success(`Welcome to EduMaster, ${profile.name}!`)
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(typeof msg === 'string' ? msg : 'Registration failed. Please try again.')
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
        className="w-full max-w-[480px]"
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
            Create your account
          </h1>
          <p className="text-[14px] text-[#64748b] mt-1">
            Join EduMaster — it's completely free
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-6 px-4">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 text-white"
                  style={{
                    background: i <= step ? '#0281FF' : '#e2e8f0',
                  }}
                >
                  {i < step ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <s.icon className="w-4 h-4" style={{ color: i <= step ? 'white' : '#94a3b8' }} />
                  )}
                </div>
                <span
                  className="text-[11px] font-semibold mt-1.5 hidden sm:block"
                  style={{ color: i <= step ? '#0281FF' : '#94a3b8' }}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="w-12 sm:w-16 h-[2px] mx-2 sm:mx-3 rounded-full transition-all duration-300 self-start mt-[18px] sm:mt-[20px]"
                  style={{ background: i < step ? '#0281FF' : '#e2e8f0' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 sm:p-8 shadow-sm">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl text-[14px] border" style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              {/* ── Step 1: Account ── */}
              {step === 0 && (
                <motion.div
                  key="step-0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div>
                    <label className={labelCls}>Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                      <input {...register('name')} type="text" placeholder="Jane Smith" className={inputIconCls} />
                    </div>
                    {errors.name && <p className={errorCls}>{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Email address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                      <input {...register('email')} type="email" placeholder="you@school.edu" className={inputIconCls} />
                    </div>
                    {errors.email && <p className={errorCls}>{errors.email.message}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Password *</label>
                    <PasswordInput {...register('password')} value={passwordValue} showStrength placeholder="Min. 8 characters" />
                    {errors.password && <p className={errorCls}>{errors.password.message}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Confirm Password *</label>
                    <PasswordInput {...register('confirmPassword')} placeholder="Repeat password" />
                    {errors.confirmPassword && <p className={errorCls}>{errors.confirmPassword.message}</p>}
                  </div>
                </motion.div>
              )}

              {/* ── Step 2: Institution ── */}
              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div>
                    <label className={labelCls}>University / School Name *</label>
                    <input {...register('school_name')} className={inputCls} placeholder="e.g. City Science College" />
                    {errors.school_name && <p className={errorCls}>{errors.school_name.message}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Institution Type *</label>
                    <select {...register('institution_type')} className={inputCls}>
                      <option value="school">School</option>
                      <option value="college">College</option>
                      <option value="university">University</option>
                      <option value="academy">Academy / Coaching Center</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Academic Level</label>
                    <input {...register('institution_level')} className={inputCls} placeholder="e.g. Secondary, Undergraduate" />
                  </div>
                  <div>
                    <label className={labelCls}>Country</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                      <input {...register('institution_country')} className={inputIconCls} placeholder="e.g. Pakistan" />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>City</label>
                    <input {...register('institution_city')} className={inputCls} placeholder="e.g. Karachi" />
                  </div>
                  <div>
                    <label className={labelCls}>Address</label>
                    <input {...register('institution_address')} className={inputCls} placeholder="Campus, block, area" />
                  </div>
                </motion.div>
              )}

              {/* ── Step 3: Teaching Profile + Terms ── */}
              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div>
                    <label className={labelCls}>Department / Faculty *</label>
                    <input {...register('department')} className={inputCls} placeholder="e.g. Computer Science" />
                    {errors.department && <p className={errorCls}>{errors.department.message}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Designation *</label>
                    <input {...register('designation')} className={inputCls} placeholder="e.g. Lecturer, Professor" />
                    {errors.designation && <p className={errorCls}>{errors.designation.message}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Qualification</label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                      <input {...register('qualification')} className={inputIconCls} placeholder="e.g. MS Mathematics" />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Specialization</label>
                    <input {...register('specialization')} className={inputCls} placeholder="e.g. Artificial Intelligence" />
                  </div>
                  <div>
                    <label className={labelCls}>Employee / Faculty ID</label>
                    <input {...register('employee_id')} className={inputCls} placeholder="Optional" />
                  </div>
                  <div>
                    <label className={labelCls}>Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                      <input {...register('phone')} className={inputIconCls} placeholder="+92..." />
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="flex items-start gap-2.5 pt-2">
                    <input {...register('terms')} id="terms" type="checkbox" className="w-4 h-4 mt-0.5 rounded border-[#cbd5e1] accent-[#0281FF]" />
                    <label htmlFor="terms" className="text-[13px] text-[#64748b] cursor-pointer leading-relaxed">
                      I agree to the{' '}
                      <a href="#" className="font-medium hover:underline" style={{ color: '#0281FF' }}>Terms of Service</a>
                      {' '}and{' '}
                      <a href="#" className="font-medium hover:underline" style={{ color: '#0281FF' }}>Privacy Policy</a>
                    </label>
                  </div>
                  {errors.terms && <p className={errorCls}>{errors.terms.message}</p>}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex items-center gap-3 mt-6">
              {step > 0 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="h-[48px] px-5 flex items-center gap-2 rounded-xl font-semibold text-[14px] border border-[#e2e8f0] bg-white text-[#64748b] transition-all hover:bg-[#f1f5f9]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}

              {step < 2 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="flex-1 h-[48px] flex items-center justify-center gap-2 rounded-xl font-semibold text-[15px] transition-all duration-200"
                  style={{ background: '#0f172a', color: 'white' }}
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-[48px] flex items-center justify-center gap-2 rounded-xl font-semibold text-[15px] transition-all duration-200 disabled:opacity-60"
                  style={{ background: '#0f172a', color: 'white' }}
                >
                  {loading ? <LoadingSpinner size="sm" /> : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              )}
            </div>
          </form>
        </div>

        <p className="text-center text-[14px] text-[#64748b] mt-6 pb-6">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold hover:underline" style={{ color: '#0281FF' }}>Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}
