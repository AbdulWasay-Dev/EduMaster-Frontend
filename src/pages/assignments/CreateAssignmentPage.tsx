import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Save,
  Sparkles,
  FileText,
  BookOpen,
  Wand2,
  CheckCircle2,
  RefreshCw,
  Plus,
  Trash2,
  ClipboardList,
  Layers3,
  Mail,
} from 'lucide-react'
import { toast } from 'sonner'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { createAssignment, generateAssignmentContent, type GeneratedContent } from '@/lib/api/assignments'
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
  due_date: z.string().min(1, 'Deadline is required'),
  auto_grade: z.boolean().default(true),
  grading_rubric: z.string().optional(),
  topic_hint: z.string().optional(),
  assignment_type: z.string().default('worksheet'),
  difficulty_level: z.string().default('medium'),
  estimated_duration: z.string().optional(),
  requirements: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const assignmentTypes = [
  { value: 'worksheet', label: 'Worksheet' },
  { value: 'research', label: 'Research' },
  { value: 'case_study', label: 'Case Study' },
  { value: 'practical', label: 'Practical' },
  { value: 'essay', label: 'Essay' },
]

const difficultyOptions = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'mixed', label: 'Mixed' },
]

export default function CreateAssignmentPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const [aiGenerated, setAiGenerated] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [selectedClassName, setSelectedClassName] = useState('')
  const [selectedSubjectName, setSelectedSubjectName] = useState('')
  const [deliverables, setDeliverables] = useState<string[]>(['Completed assignment PDF'])
  const [deliverableInput, setDeliverableInput] = useState('')

  const prefilledClassId = searchParams.get('class_id') ?? ''
  const prefilledSubjectId = searchParams.get('subject_id') ?? ''

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      total_marks: 10,
      auto_grade: true,
      class_id: prefilledClassId,
      subject_id: prefilledSubjectId,
      assignment_type: 'worksheet',
      difficulty_level: 'medium',
      estimated_duration: '1 week',
    },
  })

  const selectedClass = watch('class_id')
  const selectedSubject = watch('subject_id')
  const titleValue = watch('title')
  const totalMarks = watch('total_marks')
  const topicHint = watch('topic_hint')
  const assignmentType = watch('assignment_type')
  const difficultyLevel = watch('difficulty_level')
  const estimatedDuration = watch('estimated_duration')
  const requirements = watch('requirements')

  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: listClasses })

  const { data: subjects = [], isLoading: isLoadingSubjects } = useQuery({
    queryKey: ['subjects', selectedClass],
    queryFn: () => listSubjects(selectedClass),
    enabled: !!selectedClass,
  })

  useEffect(() => {
    if (prefilledClassId) setValue('class_id', prefilledClassId)
    if (prefilledSubjectId) setValue('subject_id', prefilledSubjectId)
  }, [prefilledClassId, prefilledSubjectId, setValue])

  useEffect(() => {
    const current = classes.find((item) => item.id === selectedClass)
    setSelectedClassName(current?.name ?? '')
  }, [classes, selectedClass])

  useEffect(() => {
    const current = subjects.find((item) => item.id === selectedSubject)
    setSelectedSubjectName(current?.name ?? '')
  }, [subjects, selectedSubject])

  const currentTypeLabel = useMemo(
    () => assignmentTypes.find((item) => item.value === assignmentType)?.label ?? 'Assignment',
    [assignmentType],
  )

  const createMut = useMutation({
    mutationFn: createAssignment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      toast.success(data.attachment_url ? 'Assignment created with downloadable PDF!' : 'Assignment created!')
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
      if (data.deliverables?.length) setDeliverables(data.deliverables)
      setGeneratedContent(data)
      setAiGenerated(true)
      toast.success('Full assignment generated. Review it before saving.')
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || 'AI generation failed'
      toast.error(msg)
    },
  })

  const handleAddDeliverable = () => {
    const next = deliverableInput.trim()
    if (!next) return
    setDeliverables((items) => Array.from(new Set([...items, next])))
    setDeliverableInput('')
  }

  const handleRemoveDeliverable = (value: string) => {
    setDeliverables((items) => items.filter((item) => item !== value))
  }

  const handleGenerate = () => {
    if (!titleValue || !selectedSubject || !selectedClass) {
      toast.error('Please fill in title, class, and subject before generating.')
      return
    }
    generateMut.mutate({
      title: titleValue,
      subject_name: selectedSubjectName || 'General',
      class_name: selectedClassName,
      total_marks: totalMarks || 10,
      topic_hint: topicHint || undefined,
      assignment_type: assignmentType,
      difficulty_level: difficultyLevel,
      estimated_duration: estimatedDuration || undefined,
      deliverables,
      requirements: requirements || undefined,
    })
  }

  const onSubmit = (data: FormData) => {
    const {
      topic_hint,
      assignment_type,
      difficulty_level,
      estimated_duration,
      requirements: extraRequirements,
      ...assignmentFields
    } = data

    const generated_outline: GeneratedContent = {
      ...(generatedContent ?? {
        description: assignmentFields.description ?? '',
        instructions: assignmentFields.instructions ?? '',
        grading_rubric: assignmentFields.grading_rubric ?? '',
      }),
      deliverables,
      assignment_type,
      difficulty_level,
      estimated_duration,
      assignment_name: assignmentFields.title,
      email_subject_syntax: generatedContent?.email_subject_syntax ?? `[ASG-CODE] ${assignmentFields.title}`,
      submission_format: generatedContent?.submission_format ?? 'Submit one PDF or document file with your completed work.',
    }

    createMut.mutate({
      ...assignmentFields,
      generate_pdf: true,
      generated_outline,
    })
  }

  const generationSteps = [
    { label: 'Details', done: Boolean(titleValue && selectedClass && selectedSubject) },
    { label: 'AI outline', done: Boolean(generatedContent), active: generateMut.isPending },
    { label: 'PDF on save', done: Boolean(generatedContent), active: createMut.isPending },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 bg-white border border-brand-100 text-brand-500 rounded-xl hover:bg-brand-50 transition-colors shadow-sm">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">New Assignment</h1>
          <p className="text-sm text-brand-500">Generate a complete assignment sheet, review it, then save the PDF for students.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-brand-100 shadow-sm">
          <h2 className="text-base font-bold text-brand-900 mb-5 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-500" /> Basic Information
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="label">Assignment Title *</label>
              <input {...register('title')} className="input" placeholder="e.g. Chapter 5 - Photosynthesis Investigation" />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="label">Class *</label>
              <select
                {...register('class_id')}
                className="input"
                onChange={(e) => {
                  setValue('class_id', e.target.value)
                  setValue('subject_id', '')
                  setSelectedSubjectName('')
                  setGeneratedContent(null)
                  setAiGenerated(false)
                }}
              >
                <option value="">Select a class</option>
                {classes.map((c) => (
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
                    setValue('subject_id', e.target.value)
                    setGeneratedContent(null)
                    setAiGenerated(false)
                  }}
                >
                  <option value="">
                    {!selectedClass ? 'Select a class first' : isLoadingSubjects ? 'Loading...' : 'Select a subject'}
                  </option>
                  {subjects.map((s) => (
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
              <label className="label">Deadline *</label>
              <input type="datetime-local" {...register('due_date')} className="input" />
              {errors.due_date && <p className="text-xs text-red-500 mt-1">{errors.due_date.message}</p>}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-brand-100 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 mb-5">
            <div>
              <h2 className="text-base font-bold text-brand-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-500" /> Assignment Generator
              </h2>
              <p className="text-sm text-brand-500 mt-1">Control the structure, generate the full assignment, then edit every field before saving.</p>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generateMut.isPending || !titleValue || !selectedSubject || !selectedClass}
              className={cn(
                'flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm',
                generateMut.isPending || !titleValue || !selectedSubject || !selectedClass
                  ? 'bg-brand-50 text-brand-300 cursor-not-allowed'
                  : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand shadow-md',
              )}
            >
              {generateMut.isPending ? (
                <><LoadingSpinner size="sm" /> Generating...</>
              ) : aiGenerated ? (
                <><RefreshCw className="w-4 h-4" /> Regenerate Assignment</>
              ) : (
                <><Wand2 className="w-4 h-4" /> Generate Assignment</>
              )}
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-5">
            <div>
              <label className="label">Assignment Type</label>
              <select {...register('assignment_type')} className="input">
                {assignmentTypes.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Difficulty</label>
              <select {...register('difficulty_level')} className="input">
                {difficultyOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Estimated Duration</label>
              <input {...register('estimated_duration')} className="input" placeholder="e.g. 1 week, 2 hours" />
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_0.9fr] gap-5">
            <div className="space-y-4">
              <div>
                <label className="label">Topic Focus</label>
                <input
                  {...register('topic_hint')}
                  className="input"
                  placeholder="e.g. Focus on light reactions, Calvin cycle, and applications"
                />
              </div>
              <div>
                <label className="label">Extra Requirements</label>
                <textarea
                  {...register('requirements')}
                  rows={4}
                  className="input resize-y"
                  placeholder="Add constraints, required examples, citation style, diagrams, word count, or presentation rules."
                />
              </div>
            </div>

            <div className="rounded-xl border border-brand-100 bg-brand-25 p-4">
              <div className="flex items-center gap-2 mb-3">
                <ClipboardList className="w-4 h-4 text-brand-500" />
                <h3 className="text-sm font-bold text-brand-900">Deliverables</h3>
              </div>
              <div className="space-y-2 mb-3">
                {deliverables.map((item) => (
                  <div key={item} className="flex items-center justify-between gap-2 rounded-lg bg-white border border-brand-100 px-3 py-2">
                    <span className="text-sm text-brand-700">{item}</span>
                    <button type="button" onClick={() => handleRemoveDeliverable(item)} className="p-1 text-slate-400 hover:text-red-600 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={deliverableInput}
                  onChange={(event) => setDeliverableInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      handleAddDeliverable()
                    }
                  }}
                  className="input bg-white text-sm"
                  placeholder="Add deliverable"
                />
                <button type="button" onClick={handleAddDeliverable} className="btn-secondary px-3">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {generationSteps.map((step) => (
              <span
                key={step.label}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
                  step.done && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  step.active && 'bg-brand-50 text-brand-700 border-brand-200',
                  !step.done && !step.active && 'bg-slate-50 text-slate-500 border-slate-200',
                )}
              >
                {step.active ? <LoadingSpinner size="sm" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                {step.label}
              </span>
            ))}
          </div>

          <AnimatePresence>
            {generatedContent && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="mt-5 rounded-xl border border-brand-100 bg-white p-5">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-brand-500">Generated Preview</p>
                    <h3 className="text-lg font-bold text-[#0f172a] mt-1">{generatedContent.assignment_name || titleValue}</h3>
                    <p className="text-sm text-brand-500 mt-1">
                      {selectedClassName || 'Selected class'} | {selectedSubjectName || 'Selected subject'} | {currentTypeLabel} | {totalMarks || 10} marks
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 border border-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                    <Mail className="w-3.5 h-3.5" /> {generatedContent.email_subject_syntax || `[ASG-CODE] ${titleValue}`}
                  </span>
                </div>

                {!!generatedContent.learning_objectives?.length && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-brand-500 uppercase mb-2">Objectives</p>
                    <div className="flex flex-wrap gap-2">
                      {generatedContent.learning_objectives.map((item) => (
                        <span key={item} className="text-xs bg-slate-50 border border-slate-200 text-slate-600 rounded-full px-2.5 py-1">{item}</span>
                      ))}
                    </div>
                  </div>
                )}

                {!!generatedContent.tasks?.length && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-brand-500 uppercase">Tasks</p>
                    {generatedContent.tasks.map((task, index) => (
                      <div key={`${task.title}-${index}`} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-800">{index + 1}. {task.title}</p>
                          {task.marks != null && <span className="text-xs font-semibold text-brand-600">{task.marks} marks</span>}
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{task.details}</p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-brand-100 shadow-sm">
          <h2 className="text-base font-bold text-brand-900 mb-5 flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-500" /> Assignment Content
            {aiGenerated && (
              <span className="ml-auto text-xs font-medium text-brand-600 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Layers3 className="w-3 h-3" /> Generated
              </span>
            )}
          </h2>
          <div className="space-y-5">
            <div>
              <label className="label">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className={cn('input resize-y transition-all', aiGenerated && 'border-brand-200 bg-brand-50/30')}
                placeholder="Brief overview of the assignment..."
              />
            </div>
            <div>
              <label className="label">Detailed Instructions</label>
              <textarea
                {...register('instructions')}
                rows={7}
                className={cn('input resize-y transition-all', aiGenerated && 'border-brand-200 bg-brand-50/30')}
                placeholder="Step-by-step instructions for students..."
              />
            </div>
            <div>
              <label className="label">Grading Rubric</label>
              <p className="text-xs text-brand-500 mb-1">Used by AI to evaluate and score submissions.</p>
              <textarea
                {...register('grading_rubric')}
                rows={5}
                className={cn('input resize-y transition-all', aiGenerated && 'border-brand-200 bg-brand-50/30')}
                placeholder="e.g. 5 marks for accuracy, 3 marks for presentation, 2 marks for originality..."
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer p-4 bg-brand-50 rounded-xl border border-brand-100 hover:bg-brand-100/60 transition-colors">
              <input type="checkbox" {...register('auto_grade')} className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 border-brand-300" />
              <div>
                <p className="text-sm font-semibold text-brand-900">Enable AI Auto-Grading</p>
                <p className="text-xs text-brand-600/80">Automatically evaluate student submissions when they are uploaded.</p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary px-6">Cancel</button>
          <button type="submit" disabled={createMut.isPending} className="btn-primary px-8 flex items-center justify-center gap-2">
            {createMut.isPending ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
            Create Assignment & PDF
          </button>
        </div>
      </form>
    </motion.div>
  )
}
