import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { X, UploadCloud, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { manualUploadSubmission } from '@/lib/api/assignments'
import { cn } from '@/lib/utils'

interface ManualUploadModalProps {
  assignmentId: string
  students: any[]
  onClose: () => void
  onSuccess: () => void
}

export default function ManualUploadModal({ assignmentId, students, onClose, onSuccess }: ManualUploadModalProps) {
  const [studentId, setStudentId] = useState('')
  const [submissionText, setSubmissionText] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const uploadMut = useMutation({
    mutationFn: () => manualUploadSubmission(assignmentId, studentId, submissionText, file || undefined),
    onSuccess: () => {
      toast.success('Submission uploaded successfully')
      onSuccess()
    },
    onError: () => toast.error('Failed to upload submission'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentId) return toast.error('Please select a student')
    if (!submissionText && !file) return toast.error('Please provide text or a file')
    uploadMut.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-brand-50">
          <h2 className="text-lg font-semibold text-[#0f172a] flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-brand-500" /> Manual Submission Upload
          </h2>
          <button onClick={onClose} className="p-1.5 text-brand-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-brand-50 p-3 rounded-lg border border-brand-100 text-sm text-brand-700 flex gap-2">
            <AlertCircle className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
            <p>Upload a submission on behalf of a student. This will trigger AI grading if enabled.</p>
          </div>

          <div>
            <label className="label">Select Student</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="input w-full"
              required
            >
              <option value="">-- Choose student --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name || s.name || s.student_name || s.email || 'Student'}
                  {s.roll_number || s.student_id ? ` - ${s.roll_number || s.student_id}` : ''}
                  {s.email ? ` (${s.email})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Submission Text (Optional)</label>
            <textarea
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              rows={4}
              className="input resize-y"
              placeholder="Paste student's answer here..."
            />
          </div>

          <div>
            <label className="label">Attachment (Optional)</label>
            <div className={cn(
              "border-2 border-dashed rounded-xl p-6 text-center transition-colors",
              file ? "border-brand-500 bg-brand-50" : "border-brand-200 hover:bg-brand-50/50"
            )}>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <UploadCloud className={cn("w-8 h-8 mb-2", file ? "text-brand-500" : "text-brand-300")} />
                {file ? (
                  <span className="text-sm font-medium text-brand-700">{file.name}</span>
                ) : (
                  <span className="text-sm text-brand-500">Click to upload or drag and drop</span>
                )}
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-brand-50">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 text-sm font-medium">Cancel</button>
            <button type="submit" disabled={uploadMut.isPending} className="btn-primary flex-1 text-sm font-medium">
              {uploadMut.isPending ? <LoadingSpinner size="sm" /> : 'Upload Submission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
