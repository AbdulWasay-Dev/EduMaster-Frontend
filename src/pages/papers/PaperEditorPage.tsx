import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import {
  ArrowLeft, Save, Download, Key, Plus, Trash2, GripVertical,
  ChevronDown, ChevronUp, Settings, CheckCircle2, Eye,
  BookOpen, GraduationCap, School, AlignLeft,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { getPaper, updatePaper, exportPaperPDF, exportAnswerKey } from '@/lib/api/papers'
import { type Question, type QuestionType, type PaperTemplate } from '@/types'
import { formatDate } from '@/lib/utils'

// ── Constants ────────────────────────────────────────────────────────────────

const QUESTION_TYPES: { key: QuestionType; label: string }[] = [
  { key: 'mcq', label: 'MCQ' },
  { key: 'short_answer', label: 'Short Answer' },
  { key: 'long_answer', label: 'Long Answer' },
  { key: 'true_false', label: 'True / False' },
  { key: 'fill_blank', label: 'Fill in the Blank' },
]

const TEMPLATES: { key: PaperTemplate; label: string; icon: React.ReactNode }[] = [
  { key: 'classic', label: 'Classic', icon: <BookOpen className="w-3.5 h-3.5" /> },
  { key: 'university', label: 'University', icon: <GraduationCap className="w-3.5 h-3.5" /> },
  { key: 'school', label: 'School', icon: <School className="w-3.5 h-3.5" /> },
  { key: 'minimalist', label: 'Minimalist', icon: <AlignLeft className="w-3.5 h-3.5" /> },
]

const TEMPLATE_COLORS: Record<PaperTemplate, string> = {
  classic: 'bg-slate-700',
  university: 'bg-blue-800',
  school: 'bg-orange-600',
  minimalist: 'bg-gray-600',
}

const STUDENT_FIELD_LABELS: Record<string, string> = {
  name: 'Student Name',
  roll_number: 'Roll No.',
  class: 'Class',
  section: 'Section',
  father_name: "Father's Name",
  signature: 'Signature',
}

// ── Question editor with TipTap ───────────────────────────────────────────────

function QuestionTextEditor({
  value,
  onChange,
  placeholder = 'Enter question text…',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getText())
    },
    editorProps: {
      attributes: {
        class:
          'min-h-[3rem] outline-none text-sm text-[#1C0A00] leading-relaxed [&_p]:m-0 [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.is-editor-empty:first-child::before]:text-brand-300 [&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:float-left',
      },
    },
  })

  // Sync external value changes (e.g., when question is reloaded)
  const prevValue = useRef(value)
  useEffect(() => {
    if (editor && value !== prevValue.current) {
      const { from, to } = editor.state.selection
      editor.commands.setContent(value, { emitUpdate: false })
      prevValue.current = value
      try { editor.commands.setTextSelection({ from, to }) } catch {}
    }
  }, [value, editor])

  return (
    <div className="border border-brand-200 rounded-lg px-3 py-2 focus-within:border-brand-400 focus-within:ring-1 focus-within:ring-brand-200 transition-colors bg-white">
      <EditorContent editor={editor} />
    </div>
  )
}

// ── Single question card ──────────────────────────────────────────────────────

function QuestionCard({
  question,
  index,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  question: Question
  index: number
  onUpdate: (q: Question) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
}) {
  const [collapsed, setCollapsed] = useState(false)

  const updateField = <K extends keyof Question>(k: K, v: Question[K]) =>
    onUpdate({ ...question, [k]: v })

  const updateOption = (i: number, val: string) => {
    const opts = [...(question.options ?? [])]
    opts[i] = val
    onUpdate({ ...question, options: opts })
  }

  const addOption = () => onUpdate({ ...question, options: [...(question.options ?? []), ''] })
  const removeOption = (i: number) => {
    const opts = (question.options ?? []).filter((_, idx) => idx !== i)
    onUpdate({ ...question, options: opts })
  }

  const typeLabel = QUESTION_TYPES.find(t => t.key === question.question_type)?.label ?? question.question_type

  return (
    <div className="border border-brand-100 rounded-2xl bg-white shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-brand-25 border-b border-brand-100">
        {/* Reorder arrows */}
        <div className="flex flex-col gap-0.5">
          <button onClick={onMoveUp} disabled={isFirst} className="text-brand-300 hover:text-brand-600 disabled:opacity-20 transition-colors">
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button onClick={onMoveDown} disabled={isLast} className="text-brand-300 hover:text-brand-600 disabled:opacity-20 transition-colors">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
        <GripVertical className="w-4 h-4 text-brand-300 cursor-grab" />

        <span className="flex items-center justify-center w-6 h-6 rounded-md bg-brand-500 text-white text-xs font-bold shrink-0">
          {index + 1}
        </span>

        {/* Type selector */}
        <select
          value={question.question_type}
          onChange={e => updateField('question_type', e.target.value as QuestionType)}
          className="text-xs border border-brand-200 rounded-lg px-2 py-1 bg-white text-brand-700 font-medium"
        >
          {QUESTION_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>

        {/* Difficulty badge */}
        <select
          value={question.difficulty ?? 'medium'}
          onChange={e => updateField('difficulty', e.target.value as any)}
          className="text-xs border border-brand-200 rounded-lg px-2 py-1 bg-white text-brand-600"
        >
          {['easy', 'medium', 'hard'].map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <div className="ml-auto flex items-center gap-2">
          {/* Marks */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-brand-500">Marks:</span>
            <input
              type="number" min={1} max={100}
              value={question.marks ?? 5}
              onChange={e => updateField('marks', Number(e.target.value))}
              className="w-12 text-xs border border-brand-200 rounded-lg px-1.5 py-1 text-center font-bold text-brand-700"
            />
          </div>
          <button onClick={() => setCollapsed(c => !c)} className="p-1 rounded-lg hover:bg-brand-100 text-brand-500 transition-colors">
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button onClick={onDelete} className="p-1 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Card body */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Question text */}
              <div>
                <label className="text-xs font-semibold text-brand-500 mb-1 block">Question Text</label>
                <QuestionTextEditor
                  value={question.question_text}
                  onChange={v => updateField('question_text', v)}
                />
              </div>

              {/* MCQ options */}
              {question.question_type === 'mcq' && (
                <div>
                  <label className="text-xs font-semibold text-brand-500 mb-2 block">
                    Options <span className="font-normal text-brand-400">(click radio to mark correct)</span>
                  </label>
                  <div className="space-y-2">
                    {(question.options ?? []).map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-5 h-5 flex items-center justify-center rounded-full border border-brand-300 text-xs font-bold text-brand-600 shrink-0">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <input
                          type="radio"
                          name={`correct-${question.id}`}
                          checked={question.correct_answer === opt}
                          onChange={() => updateField('correct_answer', opt)}
                          className="accent-green-500"
                          title="Mark as correct"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={e => updateOption(i, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + i)}`}
                          className="flex-1 text-sm border border-brand-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-400"
                        />
                        <button onClick={() => removeOption(i)} disabled={(question.options?.length ?? 0) <= 2}
                          className="text-red-400 hover:text-red-600 disabled:opacity-20 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {(question.options?.length ?? 0) < 6 && (
                      <button onClick={addOption}
                        className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-700 transition-colors">
                        <Plus className="w-3 h-3" /> Add Option
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* True/False */}
              {question.question_type === 'true_false' && (
                <div>
                  <label className="text-xs font-semibold text-brand-500 mb-2 block">Correct Answer</label>
                  <div className="flex gap-3">
                    {['True', 'False'].map(opt => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`tf-${question.id}`}
                          checked={question.correct_answer === opt}
                          onChange={() => updateField('correct_answer', opt)}
                          className="accent-green-500"
                        />
                        <span className="text-sm font-medium text-[#1C0A00]">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Model answer for non-MCQ, non-TF */}
              {!['mcq', 'true_false'].includes(question.question_type) && (
                <div>
                  <label className="text-xs font-semibold text-brand-500 mb-1 block">Model Answer / Answer Key</label>
                  <textarea
                    value={question.correct_answer ?? ''}
                    onChange={e => updateField('correct_answer', e.target.value)}
                    placeholder="Enter the expected answer…"
                    rows={3}
                    className="w-full text-sm border border-brand-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-brand-400"
                  />
                </div>
              )}

              {/* Explanation */}
              <div>
                <label className="text-xs font-semibold text-brand-500 mb-1 block">Explanation (optional)</label>
                <input
                  type="text"
                  value={question.explanation ?? ''}
                  onChange={e => updateField('explanation', e.target.value)}
                  placeholder="Brief explanation for the answer…"
                  className="w-full text-sm border border-brand-200 rounded-lg px-3 py-2 focus:outline-none focus:border-brand-400"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main editor page ──────────────────────────────────────────────────────────

export default function PaperEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: paper, isLoading } = useQuery({
    queryKey: ['paper', id],
    queryFn: () => getPaper(id!),
  })

  // Local editable state
  const [questions, setQuestions] = useState<Question[]>([])
  const [meta, setMeta] = useState({
    title: '',
    institution_name: '',
    course_name: '',
    exam_date: '',
    duration: '',
    instructions: '',
    student_fields: ['name', 'roll_number'] as string[],
  })
  const [template, setTemplate] = useState<PaperTemplate>('classic')
  const [showSettings, setShowSettings] = useState(false)
  const [showAnswerKey, setShowAnswerKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)

  // Hydrate from remote data
  useEffect(() => {
    if (!paper) return
    setQuestions((paper.questions ?? []).map((q, i) => ({
      ...q,
      marks: (q as any).marks ?? (q as any).max_score ?? 5,
      id: q.id || `q${i + 1}`,
    })))
    setMeta({
      title: paper.title ?? '',
      institution_name: paper.institution_name ?? '',
      course_name: paper.course_name ?? '',
      exam_date: paper.exam_date ?? '',
      duration: paper.duration ?? '3 Hours',
      instructions: paper.instructions ?? '',
      student_fields: paper.student_fields ?? ['name', 'roll_number'],
    })
    setTemplate((paper.template ?? 'classic') as PaperTemplate)
  }, [paper])

  const saveMut = useMutation({
    mutationFn: () => {
      // Rebuild answer_key from current questions
      const answer_key: Record<string, string> = {}
      questions.forEach(q => { if (q.correct_answer) answer_key[q.id] = q.correct_answer })
      const total_marks = questions.reduce((sum, q) => sum + (q.marks ?? 5), 0)

      return updatePaper(id!, {
        title: meta.title,
        questions,
        answer_key,
        total_marks,
        instructions: meta.instructions,
        // Template & meta go into configuration via backend's update logic
        // We patch them as top-level keys that `update_paper` merges into the record
        ...(({ institution_name: meta.institution_name, course_name: meta.course_name, exam_date: meta.exam_date, duration: meta.duration, template }) as any),
      } as any)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['paper', id] })
      toast.success('Paper saved!')
    },
    onError: () => toast.error('Save failed'),
  })

  const handleSave = async () => {
    setSaving(true)
    try { await saveMut.mutateAsync() } finally { setSaving(false) }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const blob = await exportPaperPDF(id!, template)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${meta.title || 'paper'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Download failed') } finally { setDownloading(false) }
  }

  const handleDownloadKey = async () => {
    try {
      const blob = await exportAnswerKey(id!, 'pdf')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${meta.title || 'paper'}_answer_key.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Key download failed') }
  }

  const updateQuestion = useCallback((idx: number, q: Question) => {
    setQuestions(prev => prev.map((old, i) => i === idx ? q : old))
  }, [])

  const deleteQuestion = (idx: number) =>
    setQuestions(prev => prev.filter((_, i) => i !== idx).map((q, i) => ({ ...q, id: `q${i + 1}`, question_number: i + 1 })))

  const addQuestion = () => {
    const newQ: Question = {
      id: `q${questions.length + 1}`,
      question_number: questions.length + 1,
      question_text: '',
      question_type: 'short_answer',
      marks: 5,
      options: undefined,
      correct_answer: '',
    }
    setQuestions(prev => [...prev, newQ])
  }

  const moveQuestion = (idx: number, dir: -1 | 1) => {
    setQuestions(prev => {
      const arr = [...prev]
      const target = idx + dir
      if (target < 0 || target >= arr.length) return arr
      ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
      return arr.map((q, i) => ({ ...q, id: `q${i + 1}`, question_number: i + 1 }))
    })
  }

  const toggleStudentField = (f: string) =>
    setMeta(m => ({
      ...m,
      student_fields: m.student_fields.includes(f)
        ? m.student_fields.filter(x => x !== f)
        : [...m.student_fields, f],
    }))

  const headerBg = TEMPLATE_COLORS[template] ?? 'bg-slate-700'
  const totalMarks = questions.reduce((s, q) => s + (q.marks ?? 5), 0)

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  if (!paper) return <div className="py-20 text-center text-brand-500">Paper not found</div>

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#FFFAF5]">

      {/* ── Top Toolbar ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-brand-100 shrink-0 flex-wrap">
        <button onClick={() => navigate(`/papers/${id}`)} className="btn-ghost flex items-center gap-1.5 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex-1 min-w-0">
          <input
            value={meta.title}
            onChange={e => setMeta(m => ({ ...m, title: e.target.value }))}
            className="text-base font-semibold text-[#1C0A00] bg-transparent border-none outline-none w-full truncate"
            placeholder="Paper Title…"
          />
        </div>

        {/* Template switcher */}
        <div className="flex items-center gap-1 border border-brand-200 rounded-xl overflow-hidden">
          {TEMPLATES.map(tpl => (
            <button
              key={tpl.key}
              onClick={() => setTemplate(tpl.key)}
              title={tpl.label}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors ${template === tpl.key ? 'bg-brand-500 text-white' : 'text-brand-600 hover:bg-brand-50'}`}
            >
              {tpl.icon}
              <span className="hidden sm:inline">{tpl.label}</span>
            </button>
          ))}
        </div>

        <button onClick={() => setShowSettings(s => !s)} title="Paper Settings"
          className={`p-2 rounded-xl border transition-colors ${showSettings ? 'bg-brand-100 border-brand-300' : 'border-brand-200 hover:bg-brand-50'}`}>
          <Settings className="w-4 h-4 text-brand-600" />
        </button>

        <button onClick={() => setShowAnswerKey(s => !s)} title="Answer Key"
          className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border transition-colors ${showAnswerKey ? 'bg-brand-100 border-brand-300' : 'border-brand-200 hover:bg-brand-50'}`}>
          <Key className="w-4 h-4 text-brand-600" />
          <span className="hidden sm:inline text-brand-700">Answer Key</span>
        </button>

        <button onClick={handleDownloadKey}
          className="flex items-center gap-1.5 text-sm btn-ghost px-3 py-2 border border-brand-200">
          <Download className="w-4 h-4" /> Key PDF
        </button>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-1.5 text-sm btn-ghost px-3 py-2 border border-brand-200"
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Downloading…' : 'Download PDF'}
        </button>

        <button
          onClick={handleSave}
          disabled={saving || saveMut.isPending}
          className="btn-primary flex items-center gap-1.5 text-sm"
        >
          <Save className="w-4 h-4" />
          {saving || saveMut.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* ── Settings panel ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-brand-100 bg-white shrink-0"
          >
            <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-semibold text-brand-500 mb-1 block">Institution Name</label>
                <input value={meta.institution_name} onChange={e => setMeta(m => ({ ...m, institution_name: e.target.value }))}
                  className="input text-sm" placeholder="City High School" />
              </div>
              <div>
                <label className="text-xs font-semibold text-brand-500 mb-1 block">Course / Subject</label>
                <input value={meta.course_name} onChange={e => setMeta(m => ({ ...m, course_name: e.target.value }))}
                  className="input text-sm" placeholder="Biology Grade 10" />
              </div>
              <div>
                <label className="text-xs font-semibold text-brand-500 mb-1 block">Exam Date</label>
                <input type="date" value={meta.exam_date} onChange={e => setMeta(m => ({ ...m, exam_date: e.target.value }))}
                  className="input text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-brand-500 mb-1 block">Duration</label>
                <input value={meta.duration} onChange={e => setMeta(m => ({ ...m, duration: e.target.value }))}
                  className="input text-sm" placeholder="3 Hours" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-brand-500 mb-1 block">Instructions</label>
                <textarea value={meta.instructions} onChange={e => setMeta(m => ({ ...m, instructions: e.target.value }))}
                  rows={2} className="input text-sm resize-none" placeholder="Answer ALL questions…" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-brand-500 mb-1.5 block">Student Detail Fields</label>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(STUDENT_FIELD_LABELS).map(([k, label]) => (
                    <button key={k} onClick={() => toggleStudentField(k)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${meta.student_fields.includes(k) ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-brand-600 border-brand-200 hover:border-brand-400'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left sidebar — Question navigator */}
        <div className="w-48 shrink-0 border-r border-brand-100 bg-white overflow-y-auto flex flex-col">
          <div className="p-3 border-b border-brand-50">
            <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide">Questions</p>
            <p className="text-xs text-brand-400">{questions.length} · {totalMarks} marks</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {questions.map((q, i) => (
              <a
                key={q.id}
                href={`#q-${i}`}
                className="flex items-start gap-2 p-2 rounded-xl hover:bg-brand-50 transition-colors group"
              >
                <span className="w-5 h-5 rounded-md bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-xs text-brand-600 line-clamp-2 leading-relaxed">
                  {q.question_text || <em className="text-brand-300">Empty</em>}
                </span>
              </a>
            ))}
          </div>
          <div className="p-3 border-t border-brand-50">
            <button onClick={addQuestion}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-brand-600 border border-dashed border-brand-300 rounded-xl hover:bg-brand-50 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Question
            </button>
          </div>
        </div>

        {/* Center — Paper canvas */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-4">

            {/* Paper header preview */}
            <div className={`rounded-2xl overflow-hidden shadow-sm`}>
              <div className={`${headerBg} px-6 py-5 text-white`}>
                <p className="text-lg font-bold text-center leading-tight">
                  {meta.institution_name || 'Institution Name'}
                </p>
                {template === 'university' && (
                  <p className="text-xs text-center opacity-75 mt-1">Examination Department</p>
                )}
              </div>
              <div className="bg-white px-6 py-4 space-y-3 border border-brand-100 rounded-b-2xl">
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                  {[[meta.course_name || 'Course / Subject', 'Course'], [meta.exam_date || 'Date', 'Date'], [meta.duration, 'Duration'], [String(totalMarks), 'Total Marks']].map(([v, label]) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-brand-400 text-xs">{label}:</span>
                      <span className="font-medium text-[#1C0A00] text-xs">{v}</span>
                    </div>
                  ))}
                </div>
                {/* Student fields */}
                {meta.student_fields.length > 0 && (
                  <div className="pt-2 border-t border-brand-100 grid grid-cols-2 gap-x-6 gap-y-2">
                    {meta.student_fields.map(f => (
                      <div key={f} className="flex items-center gap-2">
                        <span className="text-xs text-brand-500 whitespace-nowrap">{STUDENT_FIELD_LABELS[f] ?? f}:</span>
                        <span className="flex-1 border-b border-brand-300 text-xs text-transparent">___</span>
                      </div>
                    ))}
                  </div>
                )}
                {/* Instructions */}
                {meta.instructions && (
                  <div className="pt-2 border-t border-brand-100">
                    <p className="text-xs font-semibold text-brand-600">Instructions:</p>
                    <p className="text-xs text-brand-700 mt-0.5 leading-relaxed">{meta.instructions}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-3">
              {questions.map((q, i) => (
                <div id={`q-${i}`} key={q.id}>
                  <QuestionCard
                    question={q}
                    index={i}
                    onUpdate={updated => updateQuestion(i, updated)}
                    onDelete={() => deleteQuestion(i)}
                    onMoveUp={() => moveQuestion(i, -1)}
                    onMoveDown={() => moveQuestion(i, 1)}
                    isFirst={i === 0}
                    isLast={i === questions.length - 1}
                  />
                </div>
              ))}

              {/* Add question button */}
              <button onClick={addQuestion}
                className="w-full py-3 border-2 border-dashed border-brand-200 rounded-2xl text-sm text-brand-500 hover:border-brand-400 hover:text-brand-700 transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add Question
              </button>
            </div>
          </div>
        </div>

        {/* Right panel — Answer Key */}
        <AnimatePresence>
          {showAnswerKey && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="shrink-0 border-l border-brand-100 bg-white overflow-y-auto"
            >
              <div className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Key className="w-4 h-4 text-brand-600" />
                  <p className="font-semibold text-sm text-[#1C0A00]">Answer Key</p>
                </div>
                <div className="space-y-2">
                  {questions.map((q, i) => (
                    <div key={q.id} className="flex gap-2 p-2 rounded-xl bg-brand-25 border border-brand-100">
                      <span className="w-5 h-5 rounded-md bg-brand-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-brand-500 truncate mb-0.5">{q.question_text || 'No question text'}</p>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                          <span className="text-xs font-medium text-green-700 line-clamp-2">
                            {q.correct_answer || <em className="text-brand-300 font-normal">No answer set</em>}
                          </span>
                        </div>
                        <p className="text-xs text-brand-400 mt-0.5">{q.marks ?? 5} marks</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-brand-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-brand-600">Total Marks</span>
                    <span className="font-bold text-[#1C0A00]">{totalMarks}</span>
                  </div>
                </div>
                <button onClick={handleDownloadKey}
                  className="mt-3 w-full btn-ghost text-sm flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" /> Download Key PDF
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
