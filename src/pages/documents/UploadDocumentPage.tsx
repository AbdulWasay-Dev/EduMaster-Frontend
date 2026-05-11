import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { ArrowLeft, Upload } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import FileDropzone from '@/components/forms/FileDropzone'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { uploadDocument } from '@/lib/api/documents'
import { listSubjects } from '@/lib/api/subjects'

export default function UploadDocumentPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [searchParams] = useSearchParams()
  const prefilledSubjectId = searchParams.get('subject_id') ?? ''
  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: () => listSubjects() })

  const { register, handleSubmit, formState: { errors } } = useForm<{ subject_id: string; title: string }>({
    defaultValues: { subject_id: prefilledSubjectId }
  })

  const uploadMut = useMutation({
    mutationFn: ({ file, subject_id }: { file: File; subject_id?: string; title?: string }) =>
      uploadDocument(subject_id ?? '', file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Document uploaded! It is now being processed.')
      navigate('/documents')
    },
    onError: () => toast.error('Upload failed. Please try again.'),
  })

  const onSubmit = (values: { subject_id: string; title: string }) => {
    if (selectedFiles.length === 0) { toast.error('Please select a file to upload'); return }
    uploadMut.mutate({ file: selectedFiles[0], subject_id: values.subject_id || undefined, title: values.title || undefined })
  }

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader
        title="Upload Document"
        subtitle="Add study materials to your document library"
        action={
          <button onClick={() => navigate('/documents')} className="btn-ghost flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        }
      />
      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        <FileDropzone
          label="Document File"
          accept={{ 'application/pdf': ['.pdf'], 'application/msword': ['.doc'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'text/plain': ['.txt'] }}
          maxSize={50 * 1024 * 1024}
          onFilesChange={setSelectedFiles}
        />
        <div>
          <label className="label">Title (optional)</label>
          <input {...register('title')} className="input" placeholder="e.g. Chapter 3 – Cell Biology" />
        </div>
        <div>
          <label className="label">Subject (optional)</label>
          <select {...register('subject_id')} className="input">
            <option value="">— No subject —</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={uploadMut.isPending || selectedFiles.length === 0}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {uploadMut.isPending ? <LoadingSpinner size="sm" /> : <Upload className="w-4 h-4" />}
            {uploadMut.isPending ? 'Uploading…' : 'Upload Document'}
          </button>
          <button type="button" onClick={() => navigate('/documents')} className="btn-ghost">Cancel</button>
        </div>
      </form>
    </div>
  )
}
