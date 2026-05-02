import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Scan, CheckCircle, Info } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import FileDropzone from '@/components/forms/FileDropzone'
import AIThinking from '@/components/feedback/AIThinking'
import { listPapers } from '@/lib/api/papers'
import { gradeAnswerSheet, gradeMultipleSheets } from '@/lib/api/grading'
import { listStudents } from '@/lib/api/students'
import { listClasses } from '@/lib/api/classes'

export default function UploadGradingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const prefilledPaperId = searchParams.get('paper_id') ?? ''

  const [files, setFiles] = useState<File[]>([])
  const [paperId, setPaperId] = useState(prefilledPaperId)
  const [studentId, setStudentId] = useState('')
  const [classId, setClassId] = useState('')
  const [result, setResult] = useState<string | null>(null)

  // If paper_id is in the URL, pre-select it
  useEffect(() => {
    if (prefilledPaperId) setPaperId(prefilledPaperId)
  }, [prefilledPaperId])

  const { data: papers = [] } = useQuery({ queryKey: ['papers'], queryFn: () => listPapers() })
  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: listClasses })
  const { data: students = [] } = useQuery({
    queryKey: ['students', classId],
    queryFn: () => listStudents(classId || undefined),
    enabled: true,
  })

  const selectedPaper = papers.find(p => p.id === paperId)

  const gradeMut = useMutation({
    mutationFn: () =>
      files.length > 1
        ? gradeMultipleSheets({ paper_id: paperId, student_id: studentId || undefined, answer_sheet_images: files })
        : gradeAnswerSheet({ paper_id: paperId, student_id: studentId || undefined, answer_sheet_image: files[0] }),
    onSuccess: (sub) => { setResult(sub.id); toast.success('Grading complete!') },
    onError: () => toast.error('Grading failed. Please try again.'),
  })

  const canGrade = files.length > 0 && paperId

  if (result) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="card p-10 text-center mt-10">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[#1C0A00] mb-2">Grading Complete!</h3>
          <p className="text-brand-600 mb-6">
            The answer sheet{files.length > 1 ? 's have' : ' has'} been graded successfully.
          </p>
          <div className="flex justify-center gap-3">
            <button onClick={() => navigate(`/grading/${result}`)} className="btn-primary">
              View Results
            </button>
            <button onClick={() => { setFiles([]); setResult(null) }} className="btn-ghost">
              Grade Another
            </button>
            <button onClick={() => navigate('/grading')} className="btn-ghost">
              All Results
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (gradeMut.isPending) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="card p-10 text-center mt-10">
          <AIThinking message={`AI is reading and grading ${files.length > 1 ? `${files.length} answer sheets` : 'the answer sheet'}…`} />
          <p className="text-xs text-brand-400 mt-4">
            This may take {files.length > 1 ? '1–3 minutes' : '30–90 seconds'} depending on sheet length
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Grade Answer Sheets"
        subtitle="Upload scanned answer sheets for AI-powered grading"
        action={
          <button onClick={() => navigate('/grading')} className="btn-ghost flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        }
      />

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Left: Upload */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-[#1C0A00]">Answer Sheet Images</h3>
          <FileDropzone
            label="Drop answer sheet images here"
            accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
            maxSize={20 * 1024 * 1024}
            onFilesChange={setFiles}
            multiple
          />
          {files.length > 0 && (
            <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-xs text-emerald-700 font-medium">
                {files.length} file{files.length !== 1 ? 's' : ''} selected
              </span>
            </div>
          )}
        </div>

        {/* Right: Settings */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-[#1C0A00]">Grading Settings</h3>

          <div>
            <label className="label">Exam Paper *</label>
            <select value={paperId} onChange={e => setPaperId(e.target.value)} className="input">
              <option value="">— Select paper —</option>
              {papers.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
            {selectedPaper && (
              <div className="mt-2 flex items-start gap-1.5 text-xs text-brand-600">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{selectedPaper.questions?.length ?? 0} questions · {selectedPaper.total_marks} marks</span>
              </div>
            )}
          </div>

          <div>
            <label className="label">Class (optional)</label>
            <select value={classId} onChange={e => setClassId(e.target.value)} className="input">
              <option value="">— No class —</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {classId && (
            <div>
              <label className="label">Student (optional)</label>
              <select value={studentId} onChange={e => setStudentId(e.target.value)} className="input">
                <option value="">— No student —</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}{s.roll_number ? ` (${s.roll_number})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => gradeMut.mutate()}
            disabled={!canGrade}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Scan className="w-4 h-4" />
            {files.length > 1 ? `Grade ${files.length} Sheets` : 'Start Grading'}
          </button>

          {!paperId && (
            <p className="text-xs text-brand-400 text-center">Select a paper to enable grading</p>
          )}
        </div>
      </div>
    </div>
  )
}
