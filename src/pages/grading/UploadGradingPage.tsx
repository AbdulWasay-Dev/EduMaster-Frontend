import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowLeft, Scan, CheckCircle, Info, Upload, Users, BookOpen,
  FileText, ChevronRight, Sparkles, Settings2, Clock, AlertCircle,
} from 'lucide-react'
import FileDropzone from '@/components/forms/FileDropzone'
import AIThinking from '@/components/feedback/AIThinking'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { listPapers } from '@/lib/api/papers'
import { gradeAnswerSheet, gradeMultipleSheets } from '@/lib/api/grading'
import { listStudents } from '@/lib/api/students'
import { listClasses } from '@/lib/api/classes'
import type { Class, Paper } from '@/types'

const GRADING_MODES = [
  { value: 'auto', label: 'Auto', desc: 'Fully AI-powered, fastest result', icon: Sparkles },
  { value: 'semi_auto', label: 'Semi-Auto', desc: 'AI grades, you review & confirm', icon: Settings2 },
  { value: 'manual', label: 'Manual', desc: 'AI assists, you make final call', icon: Users },
]
const STRICTNESS_OPTS = [
  { value: 'lenient', label: 'Lenient', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { value: 'medium',  label: 'Medium',  color: 'text-amber-600  bg-amber-50  border-amber-200'  },
  { value: 'strict',  label: 'Strict',  color: 'text-red-600    bg-red-50    border-red-200'    },
]

export default function UploadGradingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const prefilledPaperId = searchParams.get('paper_id') ?? ''
  const prefilledClassId = searchParams.get('class_id') ?? ''

  const [files,       setFiles]       = useState<File[]>([])
  const [paperId,     setPaperId]     = useState(prefilledPaperId)
  const [studentId,   setStudentId]   = useState('')
  const [classId,     setClassId]     = useState(prefilledClassId)
  const [gradingMode, setGradingMode] = useState<'auto' | 'semi_auto' | 'manual'>('auto')
  const [strictness,  setStrictness]  = useState<'lenient' | 'medium' | 'strict'>('medium')
  const [result,      setResult]      = useState<string | null>(null)
  const [step,        setStep]        = useState<1 | 2>(1)

  useEffect(() => { if (prefilledPaperId) { setPaperId(prefilledPaperId); setStep(2) } }, [prefilledPaperId])
  useEffect(() => { if (prefilledClassId) setClassId(prefilledClassId) }, [prefilledClassId])

  const { data: papers  = [] } = useQuery<Paper[]>({ queryKey: ['papers'],   queryFn: () => listPapers()          })
  const { data: classes = [] } = useQuery<Class[]>({ queryKey: ['classes'],  queryFn: () => listClasses()         })
  const { data: students = [] } = useQuery({
    queryKey: ['students', classId],
    queryFn:  () => listStudents(classId || undefined),
    enabled:  !!classId,
  })

  const selectedPaper = papers.find(p => p.id === paperId)
  const selectedClass = classes.find(c => c.id === classId)

  const gradeMut = useMutation({
    mutationFn: () =>
      files.length > 1
        ? gradeMultipleSheets({ paper_id: paperId, student_id: studentId || undefined, answer_sheet_images: files, grading_mode: gradingMode, strictness })
        : gradeAnswerSheet({ paper_id: paperId, student_id: studentId || undefined, answer_sheet_image: files[0], grading_mode: gradingMode, strictness }),
    onSuccess: (sub) => { setResult(sub.id); toast.success('Grading complete!') },
    onError:   () => toast.error('Grading failed. Please try again.'),
  })

  const canGrade = files.length > 0 && paperId

  /* ── Success screen ── */
  if (result) return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="max-w-lg mx-auto mt-10">
      <div className="card p-10 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>
        <h3 className="text-2xl font-bold text-[#1C0A00] mb-2">Grading Complete!</h3>
        <p className="text-brand-500 mb-6">
          {files.length > 1 ? `${files.length} answer sheets have` : 'The answer sheet has'} been graded successfully.
        </p>
        <div className="flex flex-col gap-2">
          <button onClick={() => navigate(`/grading/${result}`)} className="btn-primary flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" /> View Results
          </button>
          <button onClick={() => { setFiles([]); setResult(null); setStep(1) }} className="btn-ghost">
            Grade Another Sheet
          </button>
          <button onClick={() => navigate('/grading')} className="btn-ghost text-brand-400">
            Back to All Results
          </button>
        </div>
      </div>
    </motion.div>
  )

  /* ── AI thinking screen ── */
  if (gradeMut.isPending) return (
    <div className="max-w-lg mx-auto mt-10">
      <div className="card p-10 text-center space-y-4">
        <AIThinking message={`AI is reading and grading ${files.length > 1 ? `${files.length} answer sheets` : 'the answer sheet'}…`} />
        <div className="space-y-2">
          {['Extracting handwriting via OCR…', 'Matching answers to questions…', 'Computing scores and feedback…'].map((msg, i) => (
            <motion.div key={msg} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0, transition: { delay: i * 0.8 } }}
              className="flex items-center gap-2 text-sm text-brand-500 bg-brand-50 px-4 py-2 rounded-lg">
              <Sparkles className="w-3.5 h-3.5 text-brand-400 animate-pulse" /> {msg}
            </motion.div>
          ))}
        </div>
        <p className="text-xs text-brand-400">
          This may take {files.length > 1 ? '1–3 minutes' : '30–90 seconds'} depending on sheet length
        </p>
      </div>
    </div>
  )

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/grading')} className="btn-ghost flex items-center gap-2 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#1C0A00]">Grade Answer Sheets</h1>
          <p className="text-sm text-brand-500">Upload scanned answer sheets for AI-powered grading</p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-0">
        {[
          { n: 1, label: 'Select Paper & Class' },
          { n: 2, label: 'Upload & Grade' },
        ].map(({ n, label }, idx) => (
          <div key={n} className="flex items-center flex-1">
            <button onClick={() => setStep(n as 1 | 2)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                step === n ? 'bg-brand-500 text-white shadow-md' :
                step > n  ? 'bg-emerald-100 text-emerald-700' :
                            'bg-brand-50 text-brand-400'
              }`}>
              <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                step > n ? 'bg-emerald-500 text-white' : step === n ? 'bg-white text-brand-500' : 'bg-brand-200 text-brand-500'
              }`}>{step > n ? '✓' : n}</span>
              {label}
            </button>
            {idx < 1 && (
              <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${step > 1 ? 'bg-emerald-400' : 'bg-brand-100'}`} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── STEP 1: Paper & Class ── */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="grid lg:grid-cols-2 gap-5">

            {/* Paper selection */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-brand-500" />
                <h3 className="font-bold text-[#1C0A00]">Select Exam Paper <span className="text-red-500">*</span></h3>
              </div>
              <select value={paperId} onChange={e => setPaperId(e.target.value)} className="input">
                <option value="">— Choose a paper —</option>
                {papers.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
              {selectedPaper && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="p-4 bg-brand-50 rounded-xl border border-brand-100 space-y-2">
                  <p className="font-bold text-sm text-[#1C0A00]">{selectedPaper.title}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="bg-white border border-brand-100 px-2 py-1 rounded-lg font-medium text-brand-700">
                      {selectedPaper.questions?.length ?? 0} Questions
                    </span>
                    <span className="bg-white border border-brand-100 px-2 py-1 rounded-lg font-medium text-brand-700">
                      {selectedPaper.total_marks} Marks
                    </span>
                    {selectedPaper.duration_minutes && (
                      <span className="bg-white border border-brand-100 px-2 py-1 rounded-lg font-medium text-brand-700 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {selectedPaper.duration_minutes} min
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded-lg font-bold text-[10px] uppercase ${
                      selectedPaper.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>{selectedPaper.is_published ? 'Published' : 'Draft'}</span>
                  </div>
                </motion.div>
              )}
              {papers.length === 0 && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">No papers found. <button onClick={() => navigate('/papers/generate')} className="underline font-semibold">Generate one first →</button></p>
                </div>
              )}
            </div>

            {/* Class & student */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-brand-500" />
                <h3 className="font-bold text-[#1C0A00]">Class & Student <span className="text-brand-400 text-xs font-normal">(optional)</span></h3>
              </div>
              <div>
                <label className="label">Class</label>
                <select value={classId} onChange={e => { setClassId(e.target.value); setStudentId('') }} className="input">
                  <option value="">— No class —</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {selectedClass && <p className="text-xs text-brand-500 mt-1">{selectedClass.student_count ?? '?'} students enrolled</p>}
              </div>
              {classId && (
                <div>
                  <label className="label">Student</label>
                  <select value={studentId} onChange={e => setStudentId(e.target.value)} className="input">
                    <option value="">— No student —</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name}{s.roll_number ? ` (${s.roll_number})` : ''}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Grading mode */}
              <div>
                <label className="label">Grading Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {GRADING_MODES.map(({ value, label, desc, icon: Icon }) => (
                    <button key={value} onClick={() => setGradingMode(value as any)}
                      className={`p-3 rounded-xl border text-center text-xs transition-all ${
                        gradingMode === value
                          ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm'
                          : 'border-brand-100 text-brand-500 hover:border-brand-300'
                      }`}>
                      <Icon className="w-4 h-4 mx-auto mb-1 text-brand-400" />
                      <span className="font-bold block">{label}</span>
                      <span className="text-[10px] text-brand-400 leading-tight">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Strictness */}
              <div>
                <label className="label">Grading Strictness</label>
                <div className="flex gap-2">
                  {STRICTNESS_OPTS.map(({ value, label, color }) => (
                    <button key={value} onClick={() => setStrictness(value as any)}
                      className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all ${
                        strictness === value ? color : 'border-brand-100 text-brand-400 hover:border-brand-300'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 flex justify-end">
              <button onClick={() => setStep(2)} disabled={!paperId}
                className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed px-8">
                Continue to Upload <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: Upload & Grade ── */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="grid lg:grid-cols-3 gap-5">

            {/* Upload dropzone */}
            <div className="lg:col-span-2 card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-brand-500" />
                <h3 className="font-bold text-[#1C0A00]">Upload Answer Sheet Images</h3>
              </div>
              <FileDropzone
                label="Drop scanned answer sheets here (JPG, PNG, WEBP)"
                accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
                maxSize={20 * 1024 * 1024}
                onFilesChange={setFiles}
                multiple
              />
              {files.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">{files.length} file{files.length !== 1 ? 's' : ''} ready</p>
                    <p className="text-xs text-emerald-600">{files.map(f => f.name).join(', ')}</p>
                  </div>
                </motion.div>
              )}
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  For best results: ensure sheets are well-lit, not blurry, and the handwriting is clearly visible. 
                  Upload one image per student for batch grading.
                </p>
              </div>
            </div>

            {/* Summary + grade button */}
            <div className="space-y-4">
              <div className="card p-5 space-y-3">
                <h3 className="font-bold text-[#1C0A00] text-sm">Grading Summary</h3>
                {[
                  { label: 'Paper',     value: selectedPaper?.title ?? '—',       icon: FileText },
                  { label: 'Class',     value: selectedClass?.name ?? 'Not set',  icon: Users    },
                  { label: 'Mode',      value: GRADING_MODES.find(m => m.value === gradingMode)?.label ?? gradingMode, icon: Sparkles },
                  { label: 'Strictness', value: strictness,                       icon: Settings2 },
                  { label: 'Files',     value: `${files.length} uploaded`,        icon: Upload   },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-2 text-sm">
                    <Icon className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                    <span className="text-brand-500 w-20 shrink-0 text-xs font-medium">{label}</span>
                    <span className="font-semibold text-[#1C0A00] text-xs truncate">{value}</span>
                  </div>
                ))}
              </div>

              <button onClick={() => gradeMut.mutate()} disabled={!canGrade}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                <Scan className="w-5 h-5" />
                {files.length > 1 ? `Grade ${files.length} Sheets` : 'Start AI Grading'}
              </button>

              {!paperId && (
                <p className="text-xs text-amber-600 flex items-center gap-1 text-center justify-center">
                  <AlertCircle className="w-3.5 h-3.5" /> Go back and select a paper first
                </p>
              )}

              <button onClick={() => setStep(1)} className="w-full btn-ghost text-sm flex items-center justify-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Change Paper / Settings
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
