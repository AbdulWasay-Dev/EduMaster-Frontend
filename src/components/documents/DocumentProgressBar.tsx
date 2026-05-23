/**
 * DocumentProgressBar — real-time upload/processing progress UI.
 * Polls GET /documents/{id}/status every 2s until done/failed.
 * Shows animated bar, stage label, and stats (pages, words, chunks).
 */
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Loader2, FileText, Cpu, Database, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/lib/axios'

interface ProgressStatus {
  document_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  stage: string
  page_count?: number
  word_count?: number
  chunk_count?: number
  error?: string
}

interface Props {
  documentId: string
  filename: string
  onComplete?: (status: ProgressStatus) => void
  onError?: (status: ProgressStatus) => void
  className?: string
}

const STAGE_ICONS: Record<string, React.ElementType> = {
  queued:           Loader2,
  starting:         Loader2,
  'loading file':   FileText,
  'extracting text':Cpu,
  'chunking':       Zap,
  'splitting':      Zap,
  'embedding':      Database,
  'storing':        Database,
  done:             CheckCircle2,
  default:          Loader2,
}

function stageIcon(stage: string) {
  const lower = stage.toLowerCase()
  for (const [key, Icon] of Object.entries(STAGE_ICONS)) {
    if (lower.includes(key)) return Icon
  }
  return STAGE_ICONS.default
}

function stageColor(status: string) {
  if (status === 'completed') return 'bg-emerald-500'
  if (status === 'failed')    return 'bg-red-500'
  return 'bg-gradient-to-r from-brand-500 via-brand-400 to-brand-300'
}

export default function DocumentProgressBar({ documentId, filename, onComplete, onError, className }: Props) {
  const [status, setStatus] = useState<ProgressStatus>({
    document_id: documentId,
    status: 'processing',
    progress: 0,
    stage: 'queued',
  })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [displayProgress, setDisplayProgress] = useState(0)

  useEffect(() => {
    const poll = async () => {
      try {
        const { data } = await api.get<ProgressStatus>(`/documents/${documentId}/status`)
        setStatus(data)

        if (data.status === 'completed') {
          setDisplayProgress(100)
          clearInterval(intervalRef.current!)
          onComplete?.(data)
        } else if (data.status === 'failed') {
          clearInterval(intervalRef.current!)
          onError?.(data)
        }
      } catch {
        // silently retry
      }
    }

    poll()
    intervalRef.current = setInterval(poll, 2000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [documentId])

  // Smooth animation: display progress trails behind real progress
  useEffect(() => {
    if (status.progress > displayProgress) {
      const diff = status.progress - displayProgress
      const step = Math.max(1, Math.floor(diff / 4))
      const t = setTimeout(() => setDisplayProgress(p => Math.min(status.progress, p + step)), 80)
      return () => clearTimeout(t)
    }
  }, [status.progress, displayProgress])

  const Icon = stageIcon(status.stage)
  const isDone   = status.status === 'completed'
  const isFailed = status.status === 'failed'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
      className={cn(
        'rounded-2xl border overflow-hidden shadow-sm',
        isDone   ? 'border-emerald-200 bg-emerald-50/60' :
        isFailed ? 'border-red-200 bg-red-50/60'         :
                   'border-brand-200 bg-white',
        className,
      )}
    >
      {/* Top progress bar */}
      <div className="relative h-1.5 w-full bg-brand-100">
        <motion.div
          className={cn('absolute left-0 top-0 h-full rounded-full transition-all', stageColor(status.status))}
          style={{ width: `${isFailed ? 100 : displayProgress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      <div className="p-4">
        {/* File name + status */}
        <div className="flex items-start gap-3">
          <div className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
            isDone   ? 'bg-emerald-100 text-emerald-600' :
            isFailed ? 'bg-red-100 text-red-500'         :
                       'bg-brand-100 text-brand-600',
          )}>
            {isDone   ? <CheckCircle2 className="w-4 h-4" />  :
             isFailed ? <XCircle className="w-4 h-4" />       :
             <Icon className="w-4 h-4 animate-spin" />}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#0f172a] truncate">{filename}</p>

            <div className="flex items-center gap-2 mt-0.5">
              <AnimatePresence mode="wait">
                <motion.span
                  key={status.stage}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className={cn(
                    'text-[11px] font-medium',
                    isDone   ? 'text-emerald-600' :
                    isFailed ? 'text-red-500'     :
                               'text-brand-500',
                  )}
                >
                  {isDone   ? 'Ready for AI queries!' :
                   isFailed ? (status.error || 'Processing failed') :
                   status.stage || 'Processing…'}
                </motion.span>
              </AnimatePresence>

              {!isDone && !isFailed && (
                <span className="text-[11px] text-brand-400 font-mono">
                  {Math.round(displayProgress)}%
                </span>
              )}
            </div>

            {/* Stats chips — show after extraction */}
            {(status.page_count || status.word_count || status.chunk_count) && (
              <div className="flex flex-wrap gap-2 mt-2">
                {status.page_count != null && (
                  <span className="text-[10px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full font-medium">
                    📄 {status.page_count} page{status.page_count !== 1 ? 's' : ''}
                  </span>
                )}
                {status.word_count != null && (
                  <span className="text-[10px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full font-medium">
                    📝 {status.word_count.toLocaleString()} words
                  </span>
                )}
                {status.chunk_count != null && (
                  <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
                    🧩 {status.chunk_count} AI chunks
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
