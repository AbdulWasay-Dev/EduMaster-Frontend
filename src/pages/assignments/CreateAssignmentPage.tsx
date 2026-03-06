import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { createAssignment } from '@/lib/api/assignments'
import { listClasses } from '@/lib/api/classes'
import { listSubjects } from '@/lib/api/subjects'

const schema = z.object({
  title: z.string().min(2, 'Title is required'),
  instructions: z.string().optional(),
  class_id: z.string().min(1, 'Select a class'),
  subject_id: z.string().min(1, 'Select a subject'),
  total_marks: z.coerce.number().min(1, 'Must be at least 1').default(10),
  due_date: z.string().optional(),
  grading_rubric: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function CreateAssignmentPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: classes } = useQuery({ queryKey: ['classes'], queryFn: listClasses })
  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: () => listSubjects() })

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { total_marks: 10 },
  })

  const createMut = useMutation({
    mutationFn: createAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      toast.success('Assignment created!')
      navigate('/assignments')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed to create assignment'
      toast.error(typeof msg === 'string' ? msg : 'Failed')
    },
  })

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/assignments')} className="text-brand-400 hover:text-brand-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-[#1C0A00]">New Assignment</h1>
      </div>

      <form onSubmit={handleSubmit((data) => createMut.mutate(data))} className="bg-white rounded-xl border border-brand-100 p-6 shadow-sm space-y-5">
        <div>
          <label className="label">Title</label>
          <input {...register('title')} className="input" placeholder="Assignment title" />
          {errors.title && <p className="text-xs text-accent-500 mt-1">{errors.title.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Class</label>
            <select {...register('class_id')} className="input">
              <option value="">Select class</option>
              {(classes || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.class_id && <p className="text-xs text-accent-500 mt-1">{errors.class_id.message}</p>}
          </div>
          <div>
            <label className="label">Subject</label>
            <select {...register('subject_id')} className="input">
              <option value="">Select subject</option>
              {(subjects || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {errors.subject_id && <p className="text-xs text-accent-500 mt-1">{errors.subject_id.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Total Marks</label>
            <input {...register('total_marks')} type="number" className="input" min={1} />
            {errors.total_marks && <p className="text-xs text-accent-500 mt-1">{errors.total_marks.message}</p>}
          </div>
          <div>
            <label className="label">Due Date (optional)</label>
            <input {...register('due_date')} type="datetime-local" className="input" />
          </div>
        </div>

        <div>
          <label className="label">Instructions</label>
          <textarea {...register('instructions')} rows={5} className="input resize-y" placeholder="Describe the assignment..." />
        </div>

        <div>
          <label className="label">Grading Rubric / Answer Key (optional)</label>
          <textarea {...register('grading_rubric')} rows={4} className="input resize-y" placeholder="Rubric or expected answers for AI grading..." />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate('/assignments')} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={createMut.isPending} className="btn-primary flex items-center gap-2">
            {createMut.isPending ? <LoadingSpinner size="sm" /> : 'Create Assignment'}
          </button>
        </div>
      </form>
    </motion.div>
  )
}
