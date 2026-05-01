import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Building2, Camera, Briefcase, User } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { useAuthStore } from '@/store/authStore'
import { updateProfile } from '@/lib/api/auth'
import SettingsTabs from '@/components/settings/SettingsTabs'
import type { User as UserProfile } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  school_name: z.string().min(2, 'Institution name is required'),
  institution_type: z.string().optional(),
  institution_level: z.string().optional(),
  institution_address: z.string().optional(),
  institution_city: z.string().optional(),
  institution_country: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  employee_id: z.string().optional(),
  phone: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

const valuesFromUser = (user: UserProfile | null): FormValues => ({
  name: user?.name ?? '',
  email: user?.email ?? '',
  school_name: user?.school_name ?? '',
  institution_type: user?.institution_type ?? 'school',
  institution_level: user?.institution_level ?? '',
  institution_address: user?.institution_address ?? '',
  institution_city: user?.institution_city ?? '',
  institution_country: user?.institution_country ?? '',
  department: user?.department ?? '',
  designation: user?.designation ?? '',
  qualification: user?.qualification ?? '',
  specialization: user?.specialization ?? '',
  employee_id: user?.employee_id ?? '',
  phone: user?.phone ?? '',
})

export default function ProfileSettingsPage() {
  const user = useAuthStore(s => s.user)
  const setUser = useAuthStore(s => s.setUser)
  const qc = useQueryClient()

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: valuesFromUser(user),
  })

  useEffect(() => {
    if (user) reset(valuesFromUser(user))
  }, [user, reset])

  const saveMut = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => {
      setUser(updated)
      qc.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Profile updated!')
    },
    onError: () => toast.error('Failed to update profile'),
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Manage your account, institution, and paper defaults" />
      <SettingsTabs active="profile" />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card p-6 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.charAt(0).toUpperCase() ?? 'T'}
            </div>
            <button type="button" className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-brand-200 rounded-lg flex items-center justify-center shadow-sm hover:bg-brand-50 transition-colors">
              <Camera className="w-3.5 h-3.5 text-brand-600" />
            </button>
          </div>
          <div className="text-center">
            <p className="font-semibold text-[#1C0A00]">{user?.name}</p>
            <p className="text-xs text-brand-500">{user?.email}</p>
            <p className="text-xs text-brand-400 mt-1 capitalize">{user?.designation || user?.role || 'Teacher'}</p>
            {user?.school_name && <p className="text-xs text-brand-500 mt-2">{user.school_name}</p>}
          </div>
        </div>

        <form onSubmit={handleSubmit(v => saveMut.mutate(v))} className="lg:col-span-2 card p-6 space-y-5">
          <div className="flex items-center gap-2 text-[#1C0A00]">
            <User className="w-4 h-4 text-brand-500" />
            <h2 className="text-sm font-bold">Account</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input {...register('name')} className="input" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Email Address *</label>
              <input {...register('email')} type="email" className="input" disabled />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 text-[#1C0A00] pt-2">
            <Building2 className="w-4 h-4 text-brand-500" />
            <h2 className="text-sm font-bold">Institution</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">University / School Name *</label>
              <input {...register('school_name')} className="input" placeholder="e.g. Springfield High School" />
              {errors.school_name && <p className="text-red-500 text-xs mt-1">{errors.school_name.message}</p>}
            </div>
            <div>
              <label className="label">Institution Type</label>
              <select {...register('institution_type')} className="input">
                <option value="school">School</option>
                <option value="college">College</option>
                <option value="university">University</option>
                <option value="academy">Academy / Coaching Center</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Academic Level</label>
              <input {...register('institution_level')} className="input" placeholder="Secondary, Undergraduate, A Levels" />
            </div>
            <div>
              <label className="label">Country</label>
              <input {...register('institution_country')} className="input" placeholder="Pakistan" />
            </div>
            <div>
              <label className="label">City</label>
              <input {...register('institution_city')} className="input" placeholder="Karachi" />
            </div>
            <div>
              <label className="label">Address</label>
              <input {...register('institution_address')} className="input" placeholder="Campus, block, area" />
            </div>
          </div>

          <div className="flex items-center gap-2 text-[#1C0A00] pt-2">
            <Briefcase className="w-4 h-4 text-brand-500" />
            <h2 className="text-sm font-bold">Teaching Profile</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Department / Faculty</label>
              <input {...register('department')} className="input" placeholder="Computer Science" />
            </div>
            <div>
              <label className="label">Designation</label>
              <input {...register('designation')} className="input" placeholder="Lecturer, Teacher, Professor" />
            </div>
            <div>
              <label className="label">Qualification</label>
              <input {...register('qualification')} className="input" placeholder="MS Mathematics" />
            </div>
            <div>
              <label className="label">Specialization</label>
              <input {...register('specialization')} className="input" placeholder="Artificial Intelligence" />
            </div>
            <div>
              <label className="label">Employee / Faculty ID</label>
              <input {...register('employee_id')} className="input" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input {...register('phone')} className="input" placeholder="+92..." />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={!isDirty || saveMut.isPending} className="btn-primary flex items-center gap-2">
              {saveMut.isPending && <LoadingSpinner size="sm" />} Save Changes
            </button>
            <button type="button" onClick={() => reset(valuesFromUser(user))} className="btn-ghost">Reset</button>
          </div>
        </form>
      </div>
    </div>
  )
}
