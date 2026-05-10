import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Save, Sparkles, FileText, BookOpen, Wand2, CheckCircle2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { createAssignment, generateAssignmentContent } from '@/lib/api/assignments'
import { listClasses } from '@/lib/api/classes'
import { listSubjects } from '@/lib/api/subjects'
import { cn } from '@/lib/utils'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  class_id: z.string().min(1, 'Class is required'),
  subject_id: z.string().min(1, 'Subject is required'),
  description: z.string().optional(),
  instructions: z.string().optional(),
  total_marks: z.coerce.number().min(1, 'At least 1 mark').default(10),
  due_date: z.string().optional(),
  auto_grade: z.boolean().default(true),
  grading_rubric: z.string().optional(),
  topic_hint: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function CreateAssignmentPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const [aiGenerated, setAiGenerated] = useState(false)
  const [selectedClassName, setSelectedClassName] = useState('')
  const [selectedSubjectName, setSelectedSubjectName] = useState('')

  const prefilledClassId   = searchParams.get('class_id')   ?? ''
  const prefilledSubjectId = searchParams.get('subject_id') ?? ''

  const { register, handleSubmit, formState: { errors }, watch, setValue, control } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      total_marks: 10,
      auto_grade: true,
      class_id: prefilledClassId,
      subject_id: prefilledSubjectId,
    },
  })

  // Pre-fill from URL once classes/subjects are loaded
  useEffect(() => {
    if (prefilledClassId)   setValue('class_id',   prefilledClassId)
    if (prefilledSubjectId) setValue('subject_id', prefilledSubjectId)
  }, [prefilledClassId, prefilledSubjectId, setValue])

  const selectedClass = watch('class_id')
  const selectedSubject = watch('subject_id')
  const titleValue = watch('title')
  const totalMarks = watch('total_marks')
  const topicHint = watch('topic_hint')

  const { data: classes } = useQuery({ queryKey: ['classes'], queryFn: listClasses })

  // Reset subject when class changes
  const { data: subjects, isLoading: isLoadingSubjects } = useQuery({
    queryKey: ['subjects', selectedClass],
    queryFn: () => listSubjects(selectedClass),
    enabled: !!selectedClass,
  })

  const createMut = useMutation({
    mutationFn: createAssignment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      toast.success('Assignment created!')
      navigate(`/assignments/${data.id}`)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || 'Failed to create assignment'
      toast.error(msg)
    },
  })

  const generateMut = useMutation({
    mutationFn: generateAssignmentContent,
    onSuccess: (data) => {
      setValue('description', data.description)
      setValue('instructions', data.instructions)
      setValue('grading_rubric', data.grading_rubric)
      setAiGenerated(true)
      toast.success('AI generated content! Review and edit as needed.')
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || 'AI generation failed'
      toast.error(msg)
    },
  })

  const handleGenerate = () => {
    if (!titleValue || !selectedSubject) {
      toast.error('Please fill in Title and Subject before generating.')
      return
    }
    generateMut.mutate({
      title: titleValue,
      subject_name: selectedSubjectName || 'General',
      class_name: selectedClassName,
      total_marks: totalMarks || 10,
      topic_hint: topicHint || undefined,
    })
  }

  const onSubmit = (data: FormData) => {
    const payload: any = { ...data }
    if (!payload.due_date) delete payload.due_date
    if (!payload.topic_hint) delete payload.topic_hint
    createMut.mutate(payload)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 bg-white border border-brand-100 text-brand-500 rounded-xl hover:bg-brand-50 transition-colors shadow-sm">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#1C0A00]">New Assignment</h1>
          <p className="text-sm text-brand-500">Create an assignment — let AI write the instructions for you</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Basic Info */}
        <div className="bg-white p-6 rounded-2xl border border-brand-100 shadow-sm">
          <h2 className="text-base font-bold text-brand-900 mb-5 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-500" /> Basic Information
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="label">Assignment Title *</label>
              <input
                {...register('title')}
                className="input"
                placeholder="e.g. Chapter 5 – Photosynthesis Essay"
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="label">Class *</label>
              <select
                {...register('class_id')}
                className="input"
                onChange={(e) => {
                  const opt = e.target.options[e.target.selectedIndex]
                  setSelectedClassName(opt.text)
                  setValue('class_id', e.target.value)
                  // Reset subject when class changes
                  setValue('subject_id', '')
                  setSelectedSubjectName('')
                }}
              >
                <option value="">Select a class</option>
                {(classes || []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.class_id && <p className="text-xs text-red-500 mt-1">{errors.class_id.message}</p>}
            </div>

            <div>
              <label className="label">Subject *</label>
              <div className="relative">
                <select
                  {...register('subject_id')}
                  className="input disabled:opacity-50"
                  disabled={!selectedClass}
                  onChange={(e) => {
                    const opt = e.target.options[e.target.selectedIndex]
                    setSelectedSubjectName(opt.text)
                    setValue('subject_id', e.target.value)
                  }}
                >
                  <option value="">
                    {!selectedClass ? 'Select a class first' : isLoadingSubjects ? 'Loading...' : 'Select a subject'}
                  </option>
                  {(subjects || []).map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {isLoadingSubjects && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <LoadingSpinner size="sm" />
                  </div>
                )}
              </div>
              {errors.subject_id && <p className="text-xs text-red-500 mt-1">{errors.subject_id.message}</p>}
            </div>

            <div>
              <label className="label">Total Marks *</label>
              <input type="number" {...register('total_marks')} className="input" min="1" />
              {errors.total_marks && <p className="text-xs text-red-500 mt-1">{errors.total_marks.message}</p>}
            </div>

            <div>
              <label className="label">Due Date (Optional)</label>
              <input type="datetime-local" {...register('due_date')} className="input" />
            </div>
          </div>
        </div>

        {/* AI Generation Panel */}
        <div className="bg-gradient-to-br from-violet-50 via-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-base font-bold text-indigo-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" /> AI Content Generator
              </h2>
              <p className="text-xs text-indigo-600 mt-0.5">Let AI draft the instructions and rubric based on your title and subject</p>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generateMut.isPending || !titleValue || !selectedSubject}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm",
                generateMut.isPending || !titleValue || !selectedSubject
                  ? "bg-indigo-100 text-indigo-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 shadow-md"
              )}
            >
              {generateMut.isPending ? (
                <><LoadingSpinner size="sm" /> Generating...</>
              ) : aiGenerated ? (
                <><RefreshCw className="w-4 h-4" /> Regenerate</>
              ) : (
                <><Wand2 className="w-4 h-4" /> Generate with AI</>
              )}
            </button>
          </div>

          {/* Topic Hint */}
          <div className="mb-4">
            <label className="label text-indigo-900">Topic Hint (Optional)</label>
            <input
              {...register('topic_hint')}
              className="input bg-white/70 focus:bg-white border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400"
              placeholder="e.g. Focus on light reactions, Calvin cycle, and real-world applications"
            />
            <p className="text-xs text-indigo-500 mt-1">Guide the AI with specific topics to cover</p>
          </div>

          {aiGenerated && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              AI content generated! You can edit below before saving.
            </motion.div>
          )}

          {/* Enable auto-grading */}
          <label className="flex items-center gap-3 cursor-pointer p-4 bg-white/60 rounded-xl border border-indigo-200/50 hover:bg-white transition-colors">
            <input type="checkbox" {...register('auto_grade')} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-indigo-300" />
            <div>
              <p className="text-sm font-semibold text-indigo-900">Enable AI Auto-Grading</p>
              <p className="text-xs text-indigo-600/80">Automatically evaluate student submissions using AI when they are uploaded.</p>
            </div>
          </label>
        </div>

        {/* Content Fields */}
        <div className="bg-white p-6 rounded-2xl border border-brand-100 shadow-sm">
          <h2 className="text-base font-bold text-brand-900 mb-5 flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-500" /> Assignment Content
            {aiGenerated && (
              <span className="ml-auto text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI Generated
              </span>
            )}
          </h2>
          <div className="space-y-5">
            <div>
              <label className="label">Description</label>
              <textarea
                {...register('description')}
                rows={2}
                className={cn("input resize-y transition-all", aiGenerated && "border-indigo-200 bg-indigo-50/30")}
                placeholder="Brief overview of the assignment..."
              />
            </div>
            <div>
              <label className="label">Detailed Instructions</label>
              <textarea
                {...register('instructions')}
                rows={5}
                className={cn("input resize-y transition-all", aiGenerated && "border-indigo-200 bg-indigo-50/30")}
                placeholder="Step-by-step instructions for students..."
              />
            </div>
            <div>
              <label className="label">Grading Rubric</label>
              <p className="text-xs text-brand-500 mb-1">Used by AI to evaluate and score submissions.</p>
              <textarea
                {...register('grading_rubric')}
                rows={4}
                className={cn("input resize-y transition-all", aiGenerated && "border-indigo-200 bg-indigo-50/30")}
                placeholder="e.g. 5 marks for accuracy, 3 marks for presentation, 2 marks for originality..."
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary px-6">Cancel</button>
          <button
            type="submit"
            disabled={createMut.isPending}
            className="btn-primary px-8 flex items-center gap-2"
          >
            {createMut.isPending ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
            Create Assignment
          </button>
        </div>
      </form>
    </motion.div>
  )
}
