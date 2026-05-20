import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { createSubject, getSubject, updateSubject } from '@/lib/api/subjects'
import { listClasses } from '@/lib/api/classes'
import type { Class } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  code: z.string().optional(),
  class_id: z.string().optional(),
  description: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export default function CreateSubjectPage() {
  const { id } = useParams<{ id?: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['subject', id],
    queryFn: () => getSubject(id!),
    enabled: isEdit,
  })
  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: () => listClasses(),
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        code: existing.code ?? '',
        class_id: existing.class_id ?? '',
        description: existing.description ?? '',
      })
    }
  }, [existing, reset])

  const saveMut = useMutation({
    mutationFn: (values: FormValues) =>
      isEdit ? updateSubject(id!, values) : createSubject(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subjects'] })
      qc.invalidateQueries({ queryKey: ['classes'] })
      toast.success(isEdit ? 'Subject updated!' : 'Subject created!')
      navigate('/subjects')
    },
    onError: () => toast.error('Failed to save subject'),
  })

  if (loadingExisting) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  return (
    <div className="max-w-lg space-y-6">
      <PageHeader
        title={isEdit ? 'Edit Subject' : 'New Subject'}
        subtitle={isEdit ? 'Update subject details' : 'Add a new teaching subject'}
        action={
          <button onClick={() => navigate('/subjects')} className="btn-ghost flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        }
      />

      <form onSubmit={handleSubmit(v => saveMut.mutate(v))} className="card p-6 space-y-5">
        <div>
          <label className="label">Subject Name *</label>
          <input {...register('name')} className="input" placeholder="e.g. Biology" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="label">Subject Code</label>
          <input {...register('code')} className="input" placeholder="e.g. BIO-101" />
        </div>

        <div>
          <label className="label">Class</label>
          <select {...register('class_id')} className="input">
            <option value="">No class assigned</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea {...register('description')} className="input resize-none" rows={3} placeholder="Optional description…" />
        </div>

        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={isSubmitting || saveMut.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {(isSubmitting || saveMut.isPending) ? <LoadingSpinner size="sm" /> : null}
            {isEdit ? 'Save Changes' : 'Create Subject'}
          </button>
          <button type="button" onClick={() => navigate('/subjects')} className="btn-ghost">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
