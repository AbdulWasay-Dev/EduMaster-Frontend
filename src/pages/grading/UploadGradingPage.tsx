import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Scan, CheckCircle } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import FileDropzone from '@/components/forms/FileDropzone'
import AIThinking from '@/components/feedback/AIThinking'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { listPapers } from '@/lib/api/papers'
import { gradeAnswerSheet, gradeMultipleSheets } from '@/lib/api/grading'
import { listStudents } from '@/lib/api/students'
import { listClasses } from '@/lib/api/classes'

export default function UploadGradingPage() {
  const navigate = useNavigate()
  const [files, setFiles] = useState<File[]>([])
  const [paperId, setPaperId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [classId, setClassId] = useState('')
  const [result, setResult] = useState<string | null>(null)

  const { data: papers = [] } = useQuery({ queryKey: ['papers'], queryFn: () => listPapers() })
  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: listClasses })
  const { data: students = [] } = useQuery({
    queryKey: ['students', classId],
    queryFn: () => listStudents(classId || undefined),
    enabled: true,
  })

  const gradeMut = useMutation({
    mutationFn: () => files.length > 1
      ? gradeMultipleSheets({
          paper_id: paperId,
          student_id: studentId || undefined,
          answer_sheet_images: files,
        })
      : gradeAnswerSheet({
          paper_id: paperId,
          student_id: studentId || undefined,
          answer_sheet_image: files[0],
        }),
    onSuccess: (sub) => { setResult(sub.id); toast.success('Grading complete!') },
    onError: () => toast.error('Grading failed. Please try again.'),
  })

  const canGrade = files.length > 0 && paperId

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

      {result ? (
        <div className="card p-10 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[#1C0A00] mb-2">Grading Complete!</h3>
          <p className="text-brand-600 mb-6">The answer sheet has been graded successfully.</p>
          <div className="flex justify-center gap-3">
            <button onClick={() => navigate(`/grading/${result}`)} className="btn-primary">View Results</button>
            <button onClick={() => { setFiles([]); setResult(null) }} className="btn-ghost">Grade Another</button>
          </div>
        </div>
      ) : gradeMut.isPending ? (
        <div className="card p-10 text-center">
          <AIThinking message="AI is reading and grading the answer sheet…" />
          <p className="text-xs text-brand-400 mt-4">This may take 30–90 seconds depending on sheet length</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Left panel: upload */}
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-[#1C0A00]">Answer Sheet Image</h3>
            <FileDropzone
              label="Drop answer sheet images here"
              accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
              maxSize={20 * 1024 * 1024}
              onFilesChange={setFiles}
              multiple
            />
          </div>

          {/* Right panel: settings */}
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-[#1C0A00]">Grading Settings</h3>
            <div>
              <label className="label">Exam Paper *</label>
              <select value={paperId} onChange={e => setPaperId(e.target.value)} className="input">
                <option value="">— Select paper —</option>
                {papers.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Class (optional)</label>
              <select value={classId} onChange={e => setClassId(e.target.value)} className="input">
                <option value="">— No class —</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Student (optional)</label>
              <select value={studentId} onChange={e => setStudentId(e.target.value)} className="input">
                <option value="">— No student —</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <button
              onClick={() => gradeMut.mutate()}
              disabled={!canGrade}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Scan className="w-4 h-4" /> Start Grading
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
