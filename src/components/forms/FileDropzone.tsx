import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, X, FileText } from 'lucide-react'
import { cn, formatBytes } from '@/lib/utils'

interface FileDropzoneProps {
  onFilesChange: (files: File[]) => void
  accept?: Record<string, string[]>
  maxFiles?: number
  maxSize?: number
  label?: string
  multiple?: boolean
}

export default function FileDropzone({
  onFilesChange,
  accept = { 'image/*': ['.jpg', '.jpeg', '.png'], 'application/pdf': ['.pdf'] },
  maxFiles = 10,
  maxSize = 52_428_800,
  label = 'Drop files here, or click to browse',
  multiple = true,
}: FileDropzoneProps) {
  const [files, setFiles] = useState<File[]>([])

  const onDrop = useCallback((accepted: File[]) => {
    const merged = multiple ? [...files, ...accepted].slice(0, maxFiles) : accepted.slice(0, 1)
    setFiles(merged)
    onFilesChange(merged)
  }, [files, multiple, maxFiles, onFilesChange])

  const remove = (i: number) => {
    const next = files.filter((_, idx) => idx !== i)
    setFiles(next)
    onFilesChange(next)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize,
    multiple,
  })

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          'flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200',
          isDragActive
            ? 'border-brand-500 bg-brand-50 scale-[1.01]'
            : 'border-brand-300 bg-brand-50/50 hover:border-brand-400 hover:bg-brand-50',
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className={cn(
          'w-10 h-10 mb-3 transition-colors',
          isDragActive ? 'text-brand-500' : 'text-brand-400',
        )} />
        <p className="text-sm font-medium text-brand-700 text-center">{label}</p>
        <p className="text-xs text-brand-500 mt-1">Max {formatBytes(maxSize)} per file</p>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {files.map((file, i) => (
            <div key={i} className="relative group flex items-center gap-2 p-2 bg-white rounded-lg border border-brand-200 shadow-sm">
              {file.type.startsWith('image/') ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-8 h-8 object-cover rounded"
                />
              ) : (
                <FileText className="w-8 h-8 text-brand-500 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#1C0A00] truncate">{file.name}</p>
                <p className="text-[10px] text-brand-500">{formatBytes(file.size)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); remove(i) }}
                className="shrink-0 text-brand-400 hover:text-accent-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
