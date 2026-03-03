import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Camera, User } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { useAuthStore } from '@/store/authStore'
import { updateProfile } from '@/lib/api/auth'
import SettingsTabs from '@/components/settings/SettingsTabs'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  school: z.string().optional(),
  bio: z.string().max(200, 'Max 200 characters').optional(),
})
type FormValues = z.infer<typeof schema>

export default function ProfileSettingsPage() {
  const user = useAuthStore(s => s.user)
  const setUser = useAuthStore(s => s.setUser)
  const qc = useQueryClient()

  const { register, handleSubmit, reset, watch, formState: { errors, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '', school: '', bio: '' },
  })

  useEffect(() => {
    if (user) reset({ name: user.name, email: user.email, school: '', bio: '' })
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

  const bio = watch('bio') ?? ''

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Manage your account and preferences" />
      <SettingsTabs active="profile" />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Avatar card */}
        <div className="card p-6 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.charAt(0).toUpperCase() ?? 'T'}
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-brand-200 rounded-lg flex items-center justify-center shadow-sm hover:bg-brand-50 transition-colors">
              <Camera className="w-3.5 h-3.5 text-brand-600" />
            </button>
          </div>
          <div className="text-center">
            <p className="font-semibold text-[#1C0A00]">{user?.name}</p>
            <p className="text-xs text-brand-500">{user?.email}</p>
            <p className="text-xs text-brand-400 mt-1 capitalize">{user?.role ?? 'Teacher'}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(v => saveMut.mutate(v))} className="lg:col-span-2 card p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input {...register('name')} className="input" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Email Address *</label>
              <input {...register('email')} type="email" className="input" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
          </div>
          <div>
            <label className="label">School / Institution</label>
            <input {...register('school')} className="input" placeholder="e.g. Springfield High School" />
          </div>
          <div>
            <label className="label">Bio <span className="text-brand-400 font-normal">({bio.length}/200)</span></label>
            <textarea {...register('bio')} className="input resize-none" rows={3} placeholder="Tell us a bit about yourself…" />
            {errors.bio && <p className="text-red-500 text-xs mt-1">{errors.bio.message}</p>}
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={!isDirty || saveMut.isPending} className="btn-primary flex items-center gap-2">
              {saveMut.isPending && <LoadingSpinner size="sm" />} Save Changes
            </button>
            <button type="button" onClick={() => reset()} className="btn-ghost">Reset</button>
          </div>
        </form>
      </div>
    </div>
  )
}
