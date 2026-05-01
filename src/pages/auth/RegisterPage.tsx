import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Briefcase, Building2, Flame, GraduationCap, Mail, MapPin, Phone, User,
} from 'lucide-react'
import { motion } from 'framer-motion'
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

export default function RegisterPage() {
  const navigate = useNavigate()
  const storeLogin = useAuthStore((s) => s.login)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      institution_type: 'school',
    },
  })
  const passwordValue = watch('password', '')

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError(null)
    try {
      const tokens = await registerApi({
        email: data.email,
        password: data.password,
        name: data.name,
        school_name: data.school_name,
        institution_type: data.institution_type,
        institution_level: emptyToUndefined(data.institution_level),
        institution_address: emptyToUndefined(data.institution_address),
        institution_city: emptyToUndefined(data.institution_city),
        institution_country: emptyToUndefined(data.institution_country),
        department: data.department,
        designation: data.designation,
        qualification: emptyToUndefined(data.qualification),
        specialization: emptyToUndefined(data.specialization),
        employee_id: emptyToUndefined(data.employee_id),
        phone: emptyToUndefined(data.phone),
      })
      useAuthStore.getState().login(tokens.access_token, { id: '', name: data.name, email: data.email, role: 'teacher' })
      const profile = await getProfile()
      storeLogin(tokens.access_token, profile)
      toast.success(`Welcome to EduMaster, ${profile.name}! 🔥`)
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(typeof msg === 'string' ? msg : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-hero-gradient relative overflow-hidden px-4 py-12">
      <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-accent-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-5xl"
      >
        <div className="card p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-500 shadow-brand mb-3">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#1C0A00]">
              Create your account
            </h1>
            <p className="text-sm text-brand-700 mt-1">Join EduMaster — it's free</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-accent-50 border border-accent-200 text-accent-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-[#1C0A00]">
                <User className="w-4 h-4 text-brand-500" />
                <h2 className="text-sm font-bold">Account</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
                    <input {...register('name')} type="text" placeholder="Jane Smith" className="input pl-9" />
                  </div>
                  {errors.name && <p className="text-xs text-accent-500 mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="label">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
                    <input {...register('email')} type="email" placeholder="you@school.edu" className="input pl-9" />
                  </div>
                  {errors.email && <p className="text-xs text-accent-500 mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="label">Password</label>
                  <PasswordInput
                    {...register('password')}
                    value={passwordValue}
                    showStrength
                    placeholder="Min. 8 characters"
                  />
                  {errors.password && <p className="text-xs text-accent-500 mt-1">{errors.password.message}</p>}
                </div>

                <div>
                  <label className="label">Confirm Password</label>
                  <PasswordInput {...register('confirmPassword')} placeholder="Repeat password" />
                  {errors.confirmPassword && <p className="text-xs text-accent-500 mt-1">{errors.confirmPassword.message}</p>}
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 text-[#1C0A00]">
                <Building2 className="w-4 h-4 text-brand-500" />
                <h2 className="text-sm font-bold">Institution</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">University / School Name *</label>
                  <input {...register('school_name')} className="input" placeholder="e.g. City Science College" />
                  {errors.school_name && <p className="text-xs text-accent-500 mt-1">{errors.school_name.message}</p>}
                </div>
                <div>
                  <label className="label">Institution Type *</label>
                  <select {...register('institution_type')} className="input">
                    <option value="school">School</option>
                    <option value="college">College</option>
                    <option value="university">University</option>
                    <option value="academy">Academy / Coaching Center</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.institution_type && <p className="text-xs text-accent-500 mt-1">{errors.institution_type.message}</p>}
                </div>
                <div>
                  <label className="label">Academic Level</label>
                  <input {...register('institution_level')} className="input" placeholder="e.g. Secondary, Undergraduate, A Levels" />
                </div>
                <div>
                  <label className="label">Country</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
                    <input {...register('institution_country')} className="input pl-9" placeholder="e.g. Pakistan" />
                  </div>
                </div>
                <div>
                  <label className="label">City</label>
                  <input {...register('institution_city')} className="input" placeholder="e.g. Karachi" />
                </div>
                <div>
                  <label className="label">Address</label>
                  <input {...register('institution_address')} className="input" placeholder="Campus, block, area" />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 text-[#1C0A00]">
                <Briefcase className="w-4 h-4 text-brand-500" />
                <h2 className="text-sm font-bold">Teaching Profile</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Department / Faculty *</label>
                  <input {...register('department')} className="input" placeholder="e.g. Computer Science" />
                  {errors.department && <p className="text-xs text-accent-500 mt-1">{errors.department.message}</p>}
                </div>
                <div>
                  <label className="label">Designation *</label>
                  <input {...register('designation')} className="input" placeholder="e.g. Lecturer, Teacher, Professor" />
                  {errors.designation && <p className="text-xs text-accent-500 mt-1">{errors.designation.message}</p>}
                </div>
                <div>
                  <label className="label">Qualification</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
                    <input {...register('qualification')} className="input pl-9" placeholder="e.g. MS Mathematics" />
                  </div>
                </div>
                <div>
                  <label className="label">Specialization</label>
                  <input {...register('specialization')} className="input" placeholder="e.g. Artificial Intelligence" />
                </div>
                <div>
                  <label className="label">Employee / Faculty ID</label>
                  <input {...register('employee_id')} className="input" placeholder="Optional" />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
                    <input {...register('phone')} className="input pl-9" placeholder="+92..." />
                  </div>
                </div>
              </div>
            </section>

            <div className="flex items-start gap-2">
              <input
                {...register('terms')}
                id="terms"
                type="checkbox"
                className="w-4 h-4 mt-0.5 rounded border-brand-300 accent-brand-500"
              />
              <label htmlFor="terms" className="text-sm text-brand-700 cursor-pointer">
                I agree to the{' '}
                <a href="#" className="text-brand-500 font-medium hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-brand-500 font-medium hover:underline">Privacy Policy</a>
              </label>
            </div>
            {errors.terms && <p className="text-xs text-accent-500">{errors.terms.message}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? <LoadingSpinner size="sm" /> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-brand-700 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-500 font-semibold hover:text-brand-700">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
