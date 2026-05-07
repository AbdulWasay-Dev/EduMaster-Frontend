import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Sparkles, FileText, Settings, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { createAssignment } from '@/lib/api/assignments'
import { listClasses } from '@/lib/api/classes'
import { listSubjects } from '@/lib/api/subjects'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  class_id: z.string().min(1, 'Class is required'),
  subject_id: z.string().min(1, 'Subject is required'),
  description: z.string().optional(),
  instructions: z.string().optional(),
  total_marks: z.coerce.number().min(1).default(10),
  due_date: z.string().optional(),
  auto_grade: z.boolean().default(true),
  grading_rubric: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function CreateAssignmentPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: classes } = useQuery({ queryKey: ['classes'], queryFn: listClasses })
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { total_marks: 10, auto_grade: true },
  })

  const selectedClass = watch('class_id')
  const { data: subjects } = useQuery({
    queryKey: ['subjects', selectedClass],
    queryFn: () => listSubjects(selectedClass),
    enabled: !!selectedClass,
  })

  const createMut = useMutation({
    mutationFn: createAssignment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      toast.success('Assignment created successfully')
      navigate(`/assignments/${data.id}`)
    },
    onError: () => toast.error('Failed to create assignment'),
  })

  const onSubmit = (data: FormData) => {
    // If due date is empty string, make it undefined
    if (!data.due_date) delete data.due_date
    createMut.mutate(data)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 bg-white border border-brand-100 text-brand-500 rounded-xl hover:bg-brand-50 transition-colors shadow-sm">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#1C0A00]">New Assignment</h1>
          <p className="text-sm text-brand-500">Create an assignment and set up AI grading</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Core Details */}
        <div className="bg-white p-6 rounded-2xl border border-brand-100 shadow-sm">
          <h2 className="text-base font-bold text-brand-900 mb-5 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-500" /> Basic Information
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="label">Assignment Title</label>
              <input {...register('title')} className="input" placeholder="e.g. Midterm Physics Essay" />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="label">Class</label>
              <select {...register('class_id')} className="input">
                <option value="">Select a class</option>
                {(classes || []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.class_id && <p className="text-xs text-red-500 mt-1">{errors.class_id.message}</p>}
            </div>

            <div>
              <label className="label">Subject</label>
              <select {...register('subject_id')} className="input" disabled={!selectedClass}>
                <option value="">Select a subject</option>
                {(subjects || []).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {errors.subject_id && <p className="text-xs text-red-500 mt-1">{errors.subject_id.message}</p>}
            </div>

            <div>
              <label className="label">Total Marks</label>
              <input type="number" {...register('total_marks')} className="input" min="1" />
              {errors.total_marks && <p className="text-xs text-red-500 mt-1">{errors.total_marks.message}</p>}
            </div>

            <div>
              <label className="label">Due Date (Optional)</label>
              <input type="datetime-local" {...register('due_date')} className="input" />
            </div>
          </div>
        </div>

        {/* Content Details */}
        <div className="bg-white p-6 rounded-2xl border border-brand-100 shadow-sm">
          <h2 className="text-base font-bold text-brand-900 mb-5 flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-500" /> Instructions & Description
          </h2>
          <div className="space-y-5">
            <div>
              <label className="label">Description (Optional)</label>
              <textarea {...register('description')} rows={2} className="input resize-y" placeholder="Brief overview of the assignment" />
            </div>
            <div>
              <label className="label">Detailed Instructions (Optional)</label>
              <textarea {...register('instructions')} rows={4} className="input resize-y" placeholder="Step-by-step instructions for students..." />
            </div>
          </div>
        </div>

        {/* AI Settings */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 shadow-sm">
          <h2 className="text-base font-bold text-indigo-900 mb-5 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" /> AI Grading Configuration
          </h2>
          <div className="space-y-5">
            <label className="flex items-center gap-3 cursor-pointer p-4 bg-white/60 rounded-xl border border-indigo-200/50 hover:bg-white transition-colors">
              <input type="checkbox" {...register('auto_grade')} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-indigo-300" />
              <div>
                <p className="text-sm font-semibold text-indigo-900">Enable AI Grading Assistant</p>
                <p className="text-xs text-indigo-600/80">Allow the system to automatically evaluate submissions based on your rubric.</p>
              </div>
            </label>

            <div>
              <label className="label text-indigo-900">Custom Grading Rubric (Optional)</label>
              <p className="text-xs text-indigo-500 mb-2">Provide specific instructions to the AI on how to grade this assignment.</p>
              <textarea {...register('grading_rubric')} rows={4} className="input resize-y bg-white/80 focus:bg-white border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400" placeholder="e.g. 5 marks for grammar, 5 marks for historical accuracy. Deduct 1 mark for each factual error..." />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary px-6">Cancel</button>
          <button type="submit" disabled={createMut.isPending} className="btn-primary px-8 flex items-center gap-2">
            {createMut.isPending ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />} Create Assignment
          </button>
        </div>
      </form>
    </motion.div>
  )
}
