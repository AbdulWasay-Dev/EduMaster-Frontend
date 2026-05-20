/**
 * UploadDocumentPage — drag-drop upload with live progress bar.
 * After upload the page stays open showing the processing progress.
 * User can go back to the library once processing is done.
 */
import { useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowLeft, Upload, FileText, CheckCircle2, X,
  CloudUpload, Info,
} from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import DocumentProgressBar from '@/components/documents/DocumentProgressBar'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { uploadDocument } from '@/lib/api/documents'
import { listSubjects } from '@/lib/api/subjects'
import { formatBytes, cn } from '@/lib/utils'
import type { Subject } from '@/types'
import type { Document } from '@/types'

const ACCEPT_MIME: Record<string, string[]> = {
  'application/pdf':                                                          ['.pdf'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':  ['.docx'],
  'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'],
}
const MAX_SIZE = 200 * 1024 * 1024  // 200 MB

interface FormValues { subject_id: string }

interface UploadedDoc {
  id: string
  filename: string
  done: boolean
}

export default function UploadDocumentPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [searchParams] = useSearchParams()
  const prefilledSubjectId = searchParams.get('subject_id') ?? ''
  const { data: subjects } = useQuery<Subject[]>({ queryKey: ['subjects'], queryFn: () => listSubjects() })
  const { register, handleSubmit, watch } = useForm<FormValues>({ defaultValues: { subject_id: prefilledSubjectId } })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([])
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const subjectId = watch('subject_id')

  const handleFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    const allowed = ['pdf', 'pptx', 'docx', 'png', 'jpg', 'jpeg']
    if (!ext || !allowed.includes(ext)) {
      toast.error(`Unsupported type ".${ext}". Allowed: ${allowed.join(', ')}`)
      return
    }
    if (file.size > MAX_SIZE) {
      toast.error(`File too large (${formatBytes(file.size)}). Max is 200 MB.`)
      return
    }
    setSelectedFile(file)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const doUpload = handleSubmit(async (values) => {
    if (!selectedFile) { toast.error('Please select a file'); return }
    if (!values.subject_id) { toast.error('Please select a subject'); return }
    setUploading(true)
    try {
      const doc: Document = await uploadDocument(values.subject_id, selectedFile)
      setUploadedDocs(prev => [...prev, { id: doc.id, filename: selectedFile.name, done: false }])
      setSelectedFile(null)
      qc.invalidateQueries({ queryKey: ['documents'] })
      toast.success('File uploaded! Processing has started.')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  })

  const allDone = uploadedDocs.length > 0 && uploadedDocs.every(d => d.done)

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Upload Document"
        subtitle="Upload PDFs, PPTX, DOCX, or images up to 200 MB — AI processes them automatically"
        action={
          <button onClick={() => navigate('/documents')} className="btn-ghost flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Library
          </button>
        }
      />

      {/* Upload form — hidden once docs are uploading */}
      <AnimatePresence>
        {uploadedDocs.length === 0 || !allDone ? (
          <motion.form
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={doUpload}
            className="card p-6 space-y-5"
          >
            {/* Drag-and-drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={cn(
                'relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed cursor-pointer transition-all py-12 px-8 text-center',
                dragOver
                  ? 'border-brand-500 bg-brand-50'
                  : selectedFile
                  ? 'border-emerald-400 bg-emerald-50/40'
                  : 'border-brand-200 hover:border-brand-400 hover:bg-brand-50/40',
              )}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.pptx,.docx,.png,.jpg,.jpeg"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
              />

              <AnimatePresence mode="wait">
                {selectedFile ? (
                  <motion.div key="selected" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                    </div>
                    <p className="font-semibold text-[#0f172a] text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-brand-500">{formatBytes(selectedFile.size)}</p>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setSelectedFile(null) }}
                      className="text-[10px] text-red-400 hover:text-red-600 flex items-center gap-1 mt-1"
                    >
                      <X className="w-3 h-3" /> Remove
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center">
                      <CloudUpload className="w-7 h-7 text-brand-500" />
                    </div>
                    <p className="font-semibold text-[#0f172a] text-sm">
                      {dragOver ? 'Drop your file here' : 'Drag & drop or click to browse'}
                    </p>
                    <p className="text-xs text-brand-400">PDF, PPTX, DOCX, PNG, JPG — up to 200 MB</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Subject select */}
            <div>
              <label className="label">Subject <span className="text-red-400">*</span></label>
              <select {...register('subject_id', { required: true })} className="input">
                <option value="">— Select subject —</option>
                {(subjects ?? []).map((s: Subject) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <p className="text-[11px] text-brand-400 mt-1 flex items-center gap-1">
                <Info className="w-3 h-3" /> AI queries will search this document within the chosen subject.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={uploading || !selectedFile || !subjectId}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {uploading ? <LoadingSpinner size="sm" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'Uploading…' : 'Upload & Process'}
              </button>
              <button type="button" onClick={() => navigate('/documents')} className="btn-ghost">
                Cancel
              </button>
            </div>
          </motion.form>
        ) : null}
      </AnimatePresence>

      {/* Progress cards for in-flight / completed uploads */}
      <AnimatePresence>
        {uploadedDocs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <h3 className="text-sm font-semibold text-brand-700">Processing queue</h3>
            {uploadedDocs.map(doc => (
              <DocumentProgressBar
                key={doc.id}
                documentId={doc.id}
                filename={doc.filename}
                onComplete={() => {
                  setUploadedDocs(prev => prev.map(d => d.id === doc.id ? { ...d, done: true } : d))
                  qc.invalidateQueries({ queryKey: ['documents'] })
                }}
                onError={() => {
                  toast.error(`Processing failed for "${doc.filename}"`)
                }}
              />
            ))}

            {allDone && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 pt-2"
              >
                <button
                  onClick={() => navigate('/documents')}
                  className="btn-primary flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" /> Go to Document Library
                </button>
                <button
                  onClick={() => { setUploadedDocs([]); setSelectedFile(null) }}
                  className="btn-ghost"
                >
                  Upload another
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
