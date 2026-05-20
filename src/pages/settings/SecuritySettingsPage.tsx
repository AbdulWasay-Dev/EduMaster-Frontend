import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Shield, LogOut, AlertTriangle } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import PasswordInput from '@/components/forms/PasswordInput'
import SettingsTabs from '@/components/settings/SettingsTabs'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'

const schema = z.object({
  current_password: z.string().min(1, 'Current password required'),
  new_password: z.string().min(8, 'At least 8 characters'),
  confirm_password: z.string(),
}).refine(d => d.new_password === d.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
})
type FormValues = z.infer<typeof schema>

export default function SecuritySettingsPage() {
  const logout = useAuthStore(s => s.logout)
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [twoFA, setTwoFA] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: FormValues) => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 1000)) // TODO: wire to API
    setSaving(false)
    toast.success('Password updated!')
    reset()
  }

  const handleLogoutAll = () => {
    logout()
    navigate('/login')
    toast.success('Signed out of all devices')
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Manage your account and preferences" />
      <SettingsTabs active="security" />

      <div className="max-w-lg space-y-5">
        {/* Change password */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-brand-500" />
            <h2 className="font-semibold text-[#0f172a]">Change Password</h2>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Current Password</label>
              <PasswordInput {...register('current_password')} placeholder="Enter current password" />
              {errors.current_password && <p className="text-red-500 text-xs mt-1">{errors.current_password.message}</p>}
            </div>
            <div>
              <label className="label">New Password</label>
              <PasswordInput showStrength {...register('new_password')} placeholder="At least 8 characters" />
              {errors.new_password && <p className="text-red-500 text-xs mt-1">{errors.new_password.message}</p>}
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <PasswordInput {...register('confirm_password')} placeholder="Repeat new password" />
              {errors.confirm_password && <p className="text-red-500 text-xs mt-1">{errors.confirm_password.message}</p>}
            </div>
            <button type="submit" disabled={!isDirty || saving} className="btn-primary flex items-center gap-2">
              {saving && <LoadingSpinner size="sm" />} Update Password
            </button>
          </form>
        </div>

        {/* Two-factor auth */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[#0f172a] text-sm">Two-Factor Authentication</h3>
              <p className="text-xs text-brand-500 mt-0.5">Add an extra layer of security to your account</p>
            </div>
            <button
              onClick={() => { setTwoFA(v => !v); toast.success(twoFA ? '2FA disabled' : '2FA enabled!') }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${twoFA ? 'bg-brand-500' : 'bg-brand-200'}`}
            >
              <span className={`inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow-md ring-0 transition-transform ${twoFA ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="card p-6 border border-red-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h3 className="font-semibold text-red-600 text-sm">Danger Zone</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#0f172a]">Sign out of all devices</p>
              <p className="text-xs text-brand-500">This will invalidate all active sessions</p>
            </div>
            <button onClick={handleLogoutAll} className="btn-danger flex items-center gap-2 text-sm">
              <LogOut className="w-3.5 h-3.5" /> Sign Out All
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
