import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ScrollText, Sliders, Clock, AlignLeft } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { useAuthStore } from '@/store/authStore'
import { updateProfile } from '@/lib/api/auth'
import SettingsTabs from '@/components/settings/SettingsTabs'
import type { PaperTemplate } from '@/types'

const STUDENT_FIELD_OPTIONS = [
  { key: 'name',        label: 'Student Name'    },
  { key: 'roll_number', label: 'Roll Number'      },
  { key: 'class',       label: 'Class'            },
  { key: 'section',     label: 'Section'          },
  { key: 'father_name', label: "Father's Name"    },
  { key: 'signature',   label: 'Signature'        },
]

const schema = z.object({
  default_paper_template:    z.string().optional(),
  default_course_name:       z.string().optional(),
  default_exam_duration:     z.string().optional(),
  default_exam_instructions: z.string().optional(),
  default_student_fields:    z.array(z.string()).optional(),
})
type FormValues = z.infer<typeof schema>

export default function PaperDefaultsPage() {
  const user = useAuthStore(s => s.user)
  const setUser = useAuthStore(s => s.setUser)
  const qc = useQueryClient()

  const { register, handleSubmit, reset, watch, setValue, formState: { isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      default_paper_template:    user?.default_paper_template    ?? 'classic',
      default_course_name:       user?.default_course_name       ?? '',
      default_exam_duration:     user?.default_exam_duration     ?? '3 Hours',
      default_exam_instructions: user?.default_exam_instructions ?? 'Answer ALL questions. Marks are indicated against each question.',
      default_student_fields:    user?.default_student_fields    ?? ['name', 'roll_number'],
    },
  })

  useEffect(() => {
    if (user) {
      reset({
        default_paper_template:    user.default_paper_template    ?? 'classic',
        default_course_name:       user.default_course_name       ?? '',
        default_exam_duration:     user.default_exam_duration     ?? '3 Hours',
        default_exam_instructions: user.default_exam_instructions ?? 'Answer ALL questions. Marks are indicated against each question.',
        default_student_fields:    user.default_student_fields    ?? ['name', 'roll_number'],
      })
    }
  }, [user, reset])

  const saveMut = useMutation({
    mutationFn: (v: FormValues) => updateProfile({
      ...v,
      default_paper_template: v.default_paper_template as PaperTemplate | undefined,
    }),
    onSuccess: (updated) => { setUser(updated); qc.invalidateQueries({ queryKey: ['profile'] }); toast.success('Paper defaults saved!') },
    onError: () => toast.error('Failed to save'),
  })

  const selectedFields = watch('default_student_fields') ?? []

  const toggleField = (key: string) => {
    const current = selectedFields
    if (current.includes(key)) {
      setValue('default_student_fields', current.filter(k => k !== key), { shouldDirty: true })
    } else {
      setValue('default_student_fields', [...current, key], { shouldDirty: true })
    }
  }

  const TEMPLATES = [
    { key: 'classic',    label: 'Classic',     desc: 'Centered header, ruled sections' },
    { key: 'university', label: 'University',  desc: 'Two-column formal header' },
    { key: 'school',     label: 'School',      desc: 'Colorful, student-friendly' },
    { key: 'minimalist', label: 'Minimalist',  desc: 'Clean, no decorations' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Manage your account, institution, and paper defaults" />
      <SettingsTabs active="paper-defaults" />

      <form onSubmit={handleSubmit(v => saveMut.mutate(v))} className="space-y-5 max-w-2xl">
        {/* Paper Template */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-brand-500" />
            <h2 className="text-sm font-bold text-[#1C0A00]">Default Paper Template</h2>
          </div>
          <p className="text-xs text-brand-500">This template will be pre-selected every time you generate a new paper.</p>
          <div className="grid grid-cols-2 gap-3">
            {TEMPLATES.map(t => {
              const current = watch('default_paper_template')
              return (
                <label
                  key={t.key}
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    current === t.key
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-brand-100 hover:border-brand-300'
                  }`}
                >
                  <input
                    {...register('default_paper_template')}
                    type="radio"
                    value={t.key}
                    className="mt-0.5 accent-orange-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-[#1C0A00]">{t.label}</p>
                    <p className="text-xs text-brand-500 mt-0.5">{t.desc}</p>
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        {/* Paper Details Defaults */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-brand-500" />
            <h2 className="text-sm font-bold text-[#1C0A00]">Default Paper Details</h2>
          </div>
          <p className="text-xs text-brand-500">These values auto-fill the Details step of the paper generation wizard.</p>

          <div>
            <label className="label">Default Course / Subject Name</label>
            <input
              {...register('default_course_name')}
              className="input"
              placeholder="e.g. Biology, Mathematics"
            />
          </div>

          <div>
            <label className="label flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Default Exam Duration
            </label>
            <input
              {...register('default_exam_duration')}
              className="input"
              placeholder="e.g. 3 Hours, 90 Minutes"
            />
          </div>

          <div>
            <label className="label flex items-center gap-1">
              <AlignLeft className="w-3.5 h-3.5" /> Default Exam Instructions
            </label>
            <textarea
              {...register('default_exam_instructions')}
              rows={3}
              className="input resize-none"
              placeholder="Answer ALL questions. Marks are indicated against each question."
            />
          </div>
        </div>

        {/* Student Fields */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-[#1C0A00]">Default Student Answer Fields</h2>
          </div>
          <p className="text-xs text-brand-500">Choose which fields appear on each student's answer sheet header by default.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {STUDENT_FIELD_OPTIONS.map(({ key, label }) => (
              <label
                key={key}
                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-sm ${
                  selectedFields.includes(key)
                    ? 'border-brand-400 bg-brand-50 text-brand-700 font-medium'
                    : 'border-brand-100 text-brand-600 hover:border-brand-300'
                }`}
                onClick={() => toggleField(key)}
              >
                <input
                  type="checkbox"
                  checked={selectedFields.includes(key)}
                  readOnly
                  className="accent-orange-500 pointer-events-none"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!isDirty || saveMut.isPending}
            className="btn-primary flex items-center gap-2"
          >
            {saveMut.isPending && <LoadingSpinner size="sm" />} Save Defaults
          </button>
          <button
            type="button"
            onClick={() => reset()}
            className="btn-ghost"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  )
}
