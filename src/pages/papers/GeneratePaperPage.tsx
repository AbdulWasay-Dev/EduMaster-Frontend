import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, Sparkles, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import PageHeader from '@/components/shared/PageHeader'
import ProgressSteps from '@/components/feedback/ProgressSteps'
import AIThinking from '@/components/feedback/AIThinking'
import DifficultyPicker from '@/components/forms/DifficultyPicker'
import QuestionTypeChips from '@/components/forms/QuestionTypeChips'
import { listSubjects } from '@/lib/api/subjects'
import { listDocuments } from '@/lib/api/documents'
import { generatePaper } from '@/lib/api/papers'
import { type PaperGenerationRequest, type QuestionType, type Difficulty } from '@/types'

const STEPS = ['Subject & Docs', 'Questions Setup', 'Paper Details', 'Generate']

type WizardState = {
  subject_id: string
  document_ids: string[]
  difficulty: Difficulty
  question_types: QuestionType[]
  num_questions: number
  title: string
  duration_minutes: number
  instructions: string
  topic_focus: string
}

const DEFAULT: WizardState = {
  subject_id: '',
  document_ids: [],
  difficulty: 'mixed',
  question_types: ['mcq', 'short_answer'],
  num_questions: 10,
  title: '',
  duration_minutes: 60,
  instructions: '',
  topic_focus: '',
}

export default function GeneratePaperPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<WizardState>(DEFAULT)
  const [generated, setGenerated] = useState<string | null>(null)

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
    onError: () => toast.error('Paper generation failed. Please try again.'),
  })

  const update = (k: keyof WizardState, v: any) => setForm(f => ({ ...f, [k]: v }))

  const canNext = () => {
    if (step === 0) return form.document_ids.length > 0
    if (step === 1) return form.question_types.length > 0 && form.num_questions > 0
    if (step === 2) return form.title.trim().length > 0
    return true
  }

  const handleGenerate = () => {
    const req: PaperGenerationRequest = {
      subject_id: form.subject_id || undefined,
      document_ids: form.document_ids,
      difficulty: form.difficulty,
      question_types: form.question_types,
      num_questions: form.num_questions,
      title: form.title,
      duration_minutes: form.duration_minutes,
      instructions: form.instructions || undefined,
      topic_focus: form.topic_focus || undefined,
    }
    genMut.mutate(req)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Generate Exam Paper"
        subtitle="AI will craft questions from your documents"
        action={
          <button onClick={() => navigate('/papers')} className="btn-ghost flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        }
      />

      <ProgressSteps steps={STEPS} currentStep={step} />

      <div className="card p-6">
        <AnimatePresence mode="wait">
          {/* Step 0: Subject & Documents */}
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
                        onChange={e => update('document_ids', e.target.checked ? [...form.document_ids, doc.id] : form.document_ids.filter(x => x !== doc.id))}
                        className="w-4 h-4 accent-brand-500"
                      />
                      <span className="text-sm font-medium text-[#1C0A00]">{doc.filename}</span>
                    </label>
                  ))}
                  {docs.filter(d => d.processing_status === 'completed').length === 0 && (
                    <p className="text-sm text-brand-400 text-center py-4">No processed documents available. Upload documents first.</p>
                  )}
                </div>
              </div>
              {form.document_ids.length > 0 && (
                <div>
                  <label className="label">Topic Focus (optional)</label>
                  <input value={form.topic_focus} onChange={e => update('topic_focus', e.target.value)} className="input" placeholder="e.g. Cellular respiration, photosynthesis" />
                </div>
              )}
            </motion.div>
          )}

          {/* Step 1: Questions Setup */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div>
                <label className="label">Difficulty</label>
                <DifficultyPicker value={form.difficulty} onChange={v => update('difficulty', v)} />
              </div>
              <div>
                <label className="label">Question Types *</label>
                <QuestionTypeChips value={form.question_types} onChange={v => update('question_types', v)} />
              </div>
              <div>
                <label className="label">Number of Questions</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range" min={5} max={50} value={form.num_questions}
                    onChange={e => update('num_questions', Number(e.target.value))}
                    className="flex-1 accent-brand-500"
                  />
                  <span className="w-10 text-center font-bold text-brand-500 text-lg">{form.num_questions}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Paper Details */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div>
                <label className="label">Paper Title *</label>
                <input value={form.title} onChange={e => update('title', e.target.value)} className="input" placeholder="e.g. Chapter 5 Biology Quiz" />
              </div>
              <div>
                <label className="label">Duration (minutes)</label>
                <input type="number" value={form.duration_minutes} onChange={e => update('duration_minutes', Number(e.target.value))} className="input" min={10} max={300} />
              </div>
              <div>
                <label className="label">Instructions (optional)</label>
                <textarea value={form.instructions} onChange={e => update('instructions', e.target.value)} className="input resize-none" rows={3} placeholder="e.g. Attempt all questions. Show your work." />
              </div>
            </motion.div>
          )}

          {/* Step 3: Generate */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              {generated ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-[#1C0A00] mb-2">Paper Generated!</h3>
                  <p className="text-brand-600 mb-6">Your exam paper has been created successfully.</p>
                  <div className="flex justify-center gap-3">
                    <button onClick={() => navigate(`/papers/${generated}`)} className="btn-primary">View Paper</button>
                    <button onClick={() => { setForm(DEFAULT); setStep(0); setGenerated(null) }} className="btn-ghost">Generate Another</button>
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
                  <div className="space-y-2">
                    {[
                      ['Title', form.title],
                      ['Documents', `${form.document_ids.length} selected`],
                      ['Questions', form.num_questions],
                      ['Difficulty', form.difficulty],
                      ['Types', form.question_types.join(', ')],
                      ['Duration', `${form.duration_minutes} min`],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between py-2 border-b border-brand-50">
                        <span className="text-sm text-brand-600">{k}</span>
                        <span className="text-sm font-medium text-[#1C0A00] capitalize">{v}</span>
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

      {/* Navigation buttons */}
      {!generated && !genMut.isPending && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="btn-ghost flex items-center gap-2 disabled:opacity-40"
          >
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>
          {step < 3 && (
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
