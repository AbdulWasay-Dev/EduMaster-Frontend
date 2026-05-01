import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowLeft, ArrowRight, Sparkles, CheckCircle, Plus, Minus,
  BookOpen, GraduationCap, School, AlignLeft,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import PageHeader from '@/components/shared/PageHeader'
import ProgressSteps from '@/components/feedback/ProgressSteps'
import AIThinking from '@/components/feedback/AIThinking'
import DifficultyPicker from '@/components/forms/DifficultyPicker'
import { listSubjects } from '@/lib/api/subjects'
import { listDocuments } from '@/lib/api/documents'
import { generatePaper } from '@/lib/api/papers'
import { useAuthStore } from '@/store/authStore'
import {
  type PaperGenerationRequest, type QuestionType,
  type Difficulty, type PaperTemplate, type User,
} from '@/types'

const STEPS = ['Source', 'Questions', 'Template', 'Details', 'Review']

const QUESTION_TYPE_OPTIONS: { key: QuestionType; label: string; icon: string; defaultCount: number }[] = [
  { key: 'mcq', label: 'Multiple Choice (MCQ)', icon: '☑', defaultCount: 5 },
  { key: 'short_answer', label: 'Short Answer', icon: '✏', defaultCount: 3 },
  { key: 'long_answer', label: 'Long / Essay', icon: '📝', defaultCount: 2 },
  { key: 'true_false', label: 'True / False', icon: '✓✗', defaultCount: 0 },
  { key: 'fill_blank', label: 'Fill in the Blank', icon: '___', defaultCount: 0 },
]

const TEMPLATES: { key: PaperTemplate; label: string; description: string; icon: React.ReactNode; color: string }[] = [
  {
    key: 'classic',
    label: 'Classic',
    description: 'Centered header, ruled sections — the traditional exam layout',
    icon: <BookOpen className="w-6 h-6" />,
    color: 'border-slate-400 bg-slate-50',
  },
  {
    key: 'university',
    label: 'University / Formal',
    description: 'Two-column header with logo placeholder, department line',
    icon: <GraduationCap className="w-6 h-6" />,
    color: 'border-blue-400 bg-blue-50',
  },
  {
    key: 'school',
    label: 'School',
    description: 'Colorful header band — bright and student-friendly',
    icon: <School className="w-6 h-6" />,
    color: 'border-orange-400 bg-orange-50',
  },
  {
    key: 'minimalist',
    label: 'Minimalist',
    description: 'Clean sans-serif with no decorations — modern and crisp',
    icon: <AlignLeft className="w-6 h-6" />,
    color: 'border-gray-300 bg-gray-50',
  },
]

const STUDENT_FIELD_OPTIONS = [
  { key: 'name', label: 'Student Name' },
  { key: 'roll_number', label: 'Roll Number' },
  { key: 'class', label: 'Class' },
  { key: 'section', label: 'Section' },
  { key: 'father_name', label: "Father's Name" },
  { key: 'signature', label: 'Signature' },
]

type CountMode = 'per_type' | 'total'

type WizardState = {
  subject_id: string
  document_ids: string[]
  topic_focus: string
  // Questions step
  count_mode: CountMode
  question_type_counts: Record<string, number>
  total_count: number
  question_types: QuestionType[]
  difficulty: Difficulty
  // Template step
  template: PaperTemplate
  // Details step
  title: string
  institution_name: string
  teacher_name: string
  course_name: string
  exam_date: string
  duration: string
  instructions: string
  student_fields: string[]
}

const createDefaultForm = (user?: User | null): WizardState => ({
  subject_id: '',
  document_ids: [],
  topic_focus: '',
  count_mode: 'per_type',
  question_type_counts: { mcq: 5, short_answer: 3, long_answer: 2 },
  total_count: 10,
  question_types: ['mcq', 'short_answer'],
  difficulty: 'medium',
  template: user?.default_paper_template ?? 'classic',
  title: '',
  institution_name: user?.school_name ?? '',
  teacher_name: user?.name ?? '',
  course_name: user?.default_course_name ?? '',
  exam_date: new Date().toISOString().split('T')[0],
  duration: user?.default_exam_duration ?? '3 Hours',
  instructions: user?.default_exam_instructions ?? 'Answer ALL questions. Marks are indicated against each question.',
  student_fields: user?.default_student_fields?.length ? user.default_student_fields : ['name', 'roll_number'],
})

export default function GeneratePaperPage() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<WizardState>(() => createDefaultForm(user))
  const [generated, setGenerated] = useState<string | null>(null)

  useEffect(() => {
    setForm(current => ({
      ...current,
      template: current.template || user?.default_paper_template || 'classic',
      institution_name: current.institution_name || user?.school_name || '',
      teacher_name: current.teacher_name || user?.name || '',
      course_name: current.course_name || user?.default_course_name || '',
      duration: current.duration || user?.default_exam_duration || '3 Hours',
      instructions: current.instructions || user?.default_exam_instructions || 'Answer ALL questions. Marks are indicated against each question.',
      student_fields: current.student_fields.length
        ? current.student_fields
        : user?.default_student_fields?.length
          ? user.default_student_fields
          : ['name', 'roll_number'],
    }))
  }, [user])

  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: listSubjects })
  const { data: docs = [] } = useQuery({
    queryKey: ['documents', form.subject_id],
    queryFn: () => listDocuments(form.subject_id || undefined),
    enabled: true,
  })

  const genMut = useMutation({
    mutationFn: (req: PaperGenerationRequest) => generatePaper(req),
    onSuccess: (paper) => {
      setGenerated(paper.id)
      toast.success('Paper generated successfully!')
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail ?? 'Paper generation failed.'
      toast.error(detail)
    },
  })

  const update = <K extends keyof WizardState>(k: K, v: WizardState[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const totalCountFromTypeCounts = Object.values(form.question_type_counts).reduce((a, b) => a + b, 0)

  const canNext = (): boolean => {
    if (step === 0) return form.document_ids.length > 0
    if (step === 1) {
      if (form.count_mode === 'per_type') return totalCountFromTypeCounts > 0
      return form.question_types.length > 0 && form.total_count > 0
    }
    if (step === 2) return true
    if (step === 3) return form.title.trim().length > 0
    return true
  }

  const handleGenerate = () => {
    let subjectError: string | null = null
    const resolvedSubjectId = (() => {
      if (form.subject_id) return form.subject_id
      if (!form.document_ids.length) return undefined

      const selectedDocs = docs.filter(d => form.document_ids.includes(d.id))
      const subjectIds = Array.from(
        new Set(selectedDocs.map(d => d.subject_id).filter(Boolean)),
      )

      if (subjectIds.length === 1) return subjectIds[0]
      if (subjectIds.length > 1) {
        subjectError = 'Select documents from one subject or choose a subject.'
      }
      return undefined
    })()

    if (!resolvedSubjectId) {
      toast.error(subjectError ?? 'Please select a subject to generate the paper.')
      return
    }

    const req: PaperGenerationRequest = {
      subject_id: resolvedSubjectId,
      document_ids: form.document_ids,
      title: form.title,
      difficulty_level: form.difficulty,
      template: form.template,
      institution_name: form.institution_name || undefined,
      teacher_name: form.teacher_name || undefined,
      course_name: form.course_name || undefined,
      exam_date: form.exam_date || undefined,
      duration: form.duration || undefined,
      instructions: form.instructions || undefined,
      student_fields: form.student_fields,
      topic_focus: form.topic_focus || undefined,
    }

    if (form.count_mode === 'per_type') {
      // Filter out zero counts
      const counts: Record<string, number> = {}
      for (const [k, v] of Object.entries(form.question_type_counts)) {
        if (v > 0) counts[k] = v
      }
      req.question_type_counts = counts
      req.question_count = Object.values(counts).reduce((a, b) => a + b, 0)
    } else {
      req.question_types = form.question_types
      req.question_count = form.total_count
    }

    genMut.mutate(req)
  }

  const adjustCount = (type: string, delta: number) => {
    const cur = form.question_type_counts[type] ?? 0
    const next = Math.max(0, cur + delta)
    update('question_type_counts', { ...form.question_type_counts, [type]: next })
  }

  const toggleStudentField = (field: string) => {
    const cur = form.student_fields
    update('student_fields', cur.includes(field) ? cur.filter(f => f !== field) : [...cur, field])
  }

  const toggleQuestionType = (t: QuestionType) => {
    const cur = form.question_types
    update('question_types', cur.includes(t) ? cur.filter(x => x !== t) : [...cur, t])
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Generate Exam Paper"
        subtitle="AI crafts questions from your documents with full template control"
        action={
          <button onClick={() => navigate('/papers')} className="btn-ghost flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        }
      />

      <ProgressSteps steps={STEPS} currentStep={step} />

      <div className="card p-6">
        <AnimatePresence mode="wait">

          {/* ── Step 0: Source ─────────────────────────────────────────── */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div>
                <label className="label">Subject (optional)</label>
                <select value={form.subject_id} onChange={e => update('subject_id', e.target.value)} className="input">
                  <option value="">— All subjects —</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Select Documents *</label>
                <p className="text-xs text-brand-500 mb-2">AI will generate questions from these documents</p>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {docs.filter(d => d.processing_status === 'completed').map(doc => (
                    <label key={doc.id} className="flex items-center gap-3 p-3 rounded-xl border border-brand-100 hover:border-brand-300 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={form.document_ids.includes(doc.id)}
                        onChange={e => update('document_ids', e.target.checked
                          ? [...form.document_ids, doc.id]
                          : form.document_ids.filter(x => x !== doc.id))}
                        className="w-4 h-4 accent-brand-500"
                      />
                      <span className="text-sm font-medium text-[#1C0A00]">{doc.filename}</span>
                    </label>
                  ))}
                  {docs.filter(d => d.processing_status === 'completed').length === 0 && (
                    <p className="text-sm text-brand-400 text-center py-4">No processed documents. Upload documents first.</p>
                  )}
                </div>
              </div>

              {form.document_ids.length > 0 && (
                <div>
                  <label className="label">Topic Focus (optional)</label>
                  <input
                    value={form.topic_focus}
                    onChange={e => update('topic_focus', e.target.value)}
                    className="input"
                    placeholder="e.g. Chapter 3: Cellular Respiration"
                  />
                </div>
              )}
            </motion.div>
          )}

          {/* ── Step 1: Questions ──────────────────────────────────────── */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div>
                <label className="label">Difficulty</label>
                <DifficultyPicker value={form.difficulty} onChange={v => update('difficulty', v)} />
              </div>

              {/* Mode toggle */}
              <div className="flex gap-2 p-1 bg-brand-50 rounded-xl">
                {(['per_type', 'total'] as CountMode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => update('count_mode', m)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${form.count_mode === m ? 'bg-white shadow text-brand-700' : 'text-brand-500 hover:text-brand-700'}`}
                  >
                    {m === 'per_type' ? 'Count per Type' : 'Total Count'}
                  </button>
                ))}
              </div>

              {form.count_mode === 'per_type' ? (
                <div className="space-y-3">
                  <p className="text-xs text-brand-500">Set how many questions of each type to generate. Set to 0 to skip a type.</p>
                  {QUESTION_TYPE_OPTIONS.map(({ key, label, icon }) => {
                    const count = form.question_type_counts[key] ?? 0
                    return (
                      <div key={key} className="flex items-center justify-between p-3 rounded-xl border border-brand-100">
                        <div className="flex items-center gap-2">
                          <span className="text-lg w-6 text-center">{icon}</span>
                          <span className="text-sm font-medium text-[#1C0A00]">{label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => adjustCount(key, -1)} disabled={count === 0}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-brand-100 hover:bg-brand-200 disabled:opacity-30 transition-colors">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-bold text-brand-700 text-sm">{count}</span>
                          <button onClick={() => adjustCount(key, +1)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-brand-100 hover:bg-brand-200 transition-colors">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  <p className="text-xs text-brand-500 text-right">Total: <span className="font-bold text-brand-700">{totalCountFromTypeCounts}</span> questions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="label">Question Types *</label>
                    <div className="flex flex-wrap gap-2">
                      {QUESTION_TYPE_OPTIONS.map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => toggleQuestionType(key)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${form.question_types.includes(key) ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-brand-600 border-brand-200 hover:border-brand-400'}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label">Total Questions</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range" min={5} max={50} value={form.total_count}
                        onChange={e => update('total_count', Number(e.target.value))}
                        className="flex-1 accent-brand-500"
                      />
                      <span className="w-10 text-center font-bold text-brand-500 text-lg">{form.total_count}</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Step 2: Template ──────────────────────────────────────── */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <p className="text-sm text-brand-600">Choose a PDF template for your exam paper. You can change it any time from the editor.</p>
              <div className="grid grid-cols-2 gap-3">
                {TEMPLATES.map(tpl => (
                  <button
                    key={tpl.key}
                    onClick={() => update('template', tpl.key)}
                    className={`relative p-4 rounded-2xl border-2 text-left transition-all ${form.template === tpl.key ? `${tpl.color} border-opacity-100 ring-2 ring-brand-400` : 'border-brand-100 hover:border-brand-300 bg-white'}`}
                  >
                    {form.template === tpl.key && (
                      <span className="absolute top-2 right-2 w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </span>
                    )}
                    <div className={`mb-2 ${form.template === tpl.key ? 'text-brand-600' : 'text-brand-400'}`}>
                      {tpl.icon}
                    </div>
                    <p className="font-semibold text-sm text-[#1C0A00]">{tpl.label}</p>
                    <p className="text-xs text-brand-500 mt-1 leading-relaxed">{tpl.description}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Details ───────────────────────────────────────── */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div>
                <label className="label">Paper Title *</label>
                <input value={form.title} onChange={e => update('title', e.target.value)} className="input" placeholder="e.g. Chapter 5 Biology Mid-Term" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Institution / School Name</label>
                  <input value={form.institution_name} onChange={e => update('institution_name', e.target.value)} className="input" placeholder="e.g. City High School" />
                </div>
                <div>
                  <label className="label">Teacher Name</label>
                  <input value={form.teacher_name} onChange={e => update('teacher_name', e.target.value)} className="input" placeholder="e.g. Jane Smith" />
                </div>
                <div>
                  <label className="label">Course / Subject Name</label>
                  <input value={form.course_name} onChange={e => update('course_name', e.target.value)} className="input" placeholder="e.g. Biology Grade 10" />
                </div>
                <div>
                  <label className="label">Exam Date</label>
                  <input type="date" value={form.exam_date} onChange={e => update('exam_date', e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Duration</label>
                  <input value={form.duration} onChange={e => update('duration', e.target.value)} className="input" placeholder="e.g. 3 Hours" />
                </div>
              </div>
              <div>
                <label className="label">Instructions</label>
                <textarea value={form.instructions} onChange={e => update('instructions', e.target.value)} className="input resize-none" rows={3} placeholder="Instructions for students..." />
              </div>
              <div>
                <label className="label">Student Detail Fields</label>
                <p className="text-xs text-brand-500 mb-2">These fields will appear as fill-in boxes on the exam paper.</p>
                <div className="flex flex-wrap gap-2">
                  {STUDENT_FIELD_OPTIONS.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => toggleStudentField(key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${form.student_fields.includes(key) ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-brand-600 border-brand-200 hover:border-brand-400'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Step 4: Review & Generate ─────────────────────────────── */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              {generated ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-[#1C0A00] mb-2">Paper Generated!</h3>
                  <p className="text-brand-600 mb-6">Your exam paper has been created. Use the editor to tweak it before downloading.</p>
                  <div className="flex justify-center gap-3">
                    <button onClick={() => navigate(`/papers/${generated}/edit`)} className="btn-primary">Open Editor</button>
                    <button onClick={() => navigate(`/papers/${generated}`)} className="btn-ghost">View Paper</button>
                    <button onClick={() => { setForm(createDefaultForm(user)); setStep(0); setGenerated(null) }} className="btn-ghost">Generate Another</button>
                  </div>
                </div>
              ) : genMut.isPending ? (
                <div className="text-center py-8">
                  <AIThinking message="AI is crafting your exam questions…" />
                  <p className="text-xs text-brand-500 mt-4">This may take 30–60 seconds</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-semibold text-[#1C0A00]">Review & Generate</h3>
                  <div className="space-y-1.5">
                    {[
                      ['Title', form.title || '(not set)'],
                      ['Documents', `${form.document_ids.length} selected`],
                      ['Template', TEMPLATES.find(t => t.key === form.template)?.label ?? form.template],
                      ['Difficulty', form.difficulty],
                      form.count_mode === 'per_type'
                        ? ['Questions', Object.entries(form.question_type_counts).filter(([, v]) => v > 0).map(([k, v]) => `${v} ${k.replace('_', ' ')}`).join(', ') || '(none)']
                        : ['Questions', `${form.total_count} · ${form.question_types.join(', ')}`],
                      ['Institution', form.institution_name || '—'],
                      ['Teacher', form.teacher_name || '—'],
                      ['Course', form.course_name || '—'],
                      ['Date', form.exam_date || '—'],
                      ['Duration', form.duration],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between py-1.5 border-b border-brand-50 text-sm">
                        <span className="text-brand-600">{k}</span>
                        <span className="font-medium text-[#1C0A00] capitalize">{v}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={handleGenerate} className="btn-primary w-full flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" /> Generate Paper
                  </button>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Navigation */}
      {!generated && !genMut.isPending && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="btn-ghost flex items-center gap-2 disabled:opacity-40"
          >
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>
          {step < 4 && (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
              className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
