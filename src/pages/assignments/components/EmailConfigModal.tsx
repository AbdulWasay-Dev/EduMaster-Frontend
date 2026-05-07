import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, Mail, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { getEmailConfig, saveEmailConfig, testEmailConnection, type EmailConfig } from '@/lib/api/assignments'

const schema = z.object({
  email_address: z.string().email('Invalid email'),
  app_password: z.string().min(1, 'App password required'),
  imap_host: z.string().min(1, 'IMAP host required').default('imap.gmail.com'),
  imap_port: z.coerce.number().default(993),
  is_active: z.boolean().default(true),
})

export default function EmailConfigModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const { data: config, isLoading } = useQuery({
    queryKey: ['email-config'],
    queryFn: getEmailConfig,
  })

  const { register, handleSubmit, formState: { errors }, reset, getValues } = useForm<EmailConfig>({
    resolver: zodResolver(schema),
    defaultValues: { imap_host: 'imap.gmail.com', imap_port: 993, is_active: true }
  })

  useEffect(() => {
    if (config) reset(config)
  }, [config, reset])

  const saveMut = useMutation({
    mutationFn: saveEmailConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-config'] })
      toast.success('Configuration saved!')
      onClose()
    },
    onError: () => toast.error('Failed to save configuration'),
  })

  const testMut = useMutation({
    mutationFn: testEmailConnection,
    onSuccess: (data) => setTestResult(data),
    onError: (err: any) => setTestResult({ success: false, message: err.response?.data?.message || 'Connection failed' }),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-brand-50">
          <h2 className="text-lg font-semibold text-[#1C0A00] flex items-center gap-2">
            <Mail className="w-5 h-5 text-brand-500" /> Email Sync Config
          </h2>
          <button onClick={onClose} className="p-1.5 text-brand-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 flex justify-center"><LoadingSpinner /></div>
        ) : (
          <form onSubmit={handleSubmit((data) => saveMut.mutate(data))} className="p-5 space-y-4">
            <div className="bg-brand-50 p-3 rounded-lg border border-brand-100 text-sm text-brand-700 flex gap-2">
              <AlertCircle className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
              <p>Configure IMAP to allow EduMaster to automatically fetch student assignment submissions sent to your email.</p>
            </div>

            <div>
              <label className="label">Email Address</label>
              <input {...register('email_address')} className="input" placeholder="teacher@gmail.com" />
              {errors.email_address && <p className="text-xs text-red-500 mt-1">{errors.email_address.message}</p>}
            </div>

            <div>
              <label className="label">App Password</label>
              <input {...register('app_password')} type="password" className="input" placeholder="16-digit app password" />
              <p className="text-xs text-brand-400 mt-1">For Gmail, use an App Password, not your account password.</p>
              {errors.app_password && <p className="text-xs text-red-500 mt-1">{errors.app_password.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">IMAP Host</label>
                <input {...register('imap_host')} className="input" />
              </div>
              <div>
                <label className="label">Port</label>
                <input {...register('imap_port')} type="number" className="input" />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <input type="checkbox" {...register('is_active')} className="rounded border-brand-300 text-brand-600 focus:ring-brand-500" />
              <span className="text-sm font-medium text-brand-700">Enable email fetching</span>
            </label>

            {testResult && (
              <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                <p>{testResult.message}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-brand-50">
              <button
                type="button"
                onClick={() => testMut.mutate(getValues())}
                disabled={testMut.isPending}
                className="btn-secondary flex-1 text-sm font-medium"
              >
                {testMut.isPending ? <LoadingSpinner size="sm" /> : 'Test Connection'}
              </button>
              <button
                type="submit"
                disabled={saveMut.isPending}
                className="btn-primary flex-1 text-sm font-medium"
              >
                {saveMut.isPending ? <LoadingSpinner size="sm" /> : 'Save Config'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
