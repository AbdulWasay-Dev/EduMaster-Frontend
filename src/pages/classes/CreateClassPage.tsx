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
import { createClass, getClass, updateClass } from '@/lib/api/classes'
import { listSubjects } from '@/lib/api/subjects'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  grade_level: z.string().min(1, 'Grade level is required'),
  academic_year: z.string().min(4, 'Academic year is required'),
  subject_id: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export default function CreateClassPage() {
  const { id } = useParams<{ id?: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['class', id],
    queryFn: () => getClass(id!),
    enabled: isEdit,
  })

  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: listSubjects })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { academic_year: new Date().getFullYear().toString() },
  })

  useEffect(() => {
    if (existing) reset({
      name: existing.name,
      grade_level: existing.grade_level,
      academic_year: existing.academic_year,
      subject_id: existing.subject_id ?? '',
    })
  }, [existing, reset])

  const saveMut = useMutation({
    mutationFn: (values: FormValues) =>
      isEdit ? updateClass(id!, values) : createClass(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] })
      toast.success(isEdit ? 'Class updated!' : 'Class created!')
      navigate('/classes')
    },
    onError: () => toast.error('Failed to save class'),
  })

  if (loadingExisting) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  return (
    <div className="max-w-lg space-y-6">
      <PageHeader
        title={isEdit ? 'Edit Class' : 'New Class'}
        subtitle={isEdit ? 'Update class details' : 'Create a new classroom group'}
        action={
          <button onClick={() => navigate('/classes')} className="btn-ghost flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        }
      />
      <form onSubmit={handleSubmit(v => saveMut.mutate(v))} className="card p-6 space-y-5">
        <div>
          <label className="label">Class Name *</label>
          <input {...register('name')} className="input" placeholder="e.g. Class 9A" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="label">Grade Level *</label>
          <input {...register('grade_level')} className="input" placeholder="e.g. Grade 9" />
          {errors.grade_level && <p className="text-red-500 text-xs mt-1">{errors.grade_level.message}</p>}
        </div>
        <div>
          <label className="label">Academic Year *</label>
          <input {...register('academic_year')} className="input" placeholder="e.g. 2024" />
          {errors.academic_year && <p className="text-red-500 text-xs mt-1">{errors.academic_year.message}</p>}
        </div>
        <div>
          <label className="label">Subject (optional)</label>
          <select {...register('subject_id')} className="input">
            <option value="">— No subject —</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={isSubmitting || saveMut.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {(isSubmitting || saveMut.isPending) && <LoadingSpinner size="sm" />}
            {isEdit ? 'Save Changes' : 'Create Class'}
          </button>
          <button type="button" onClick={() => navigate('/classes')} className="btn-ghost">Cancel</button>
        </div>
      </form>
    </div>
  )
}
