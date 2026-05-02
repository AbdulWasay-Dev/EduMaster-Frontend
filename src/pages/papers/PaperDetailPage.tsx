import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Download, Globe, Edit3, Trash2, Clock, CheckSquare, Key, Building2 } from 'lucide-react'
import { motion } from 'framer-motion'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { getPaper, publishPaper, deletePaper, exportPaperPDF, exportAnswerKey } from '@/lib/api/papers'
import { formatDate } from '@/lib/utils'

const QUESTION_TYPE_LABELS: Record<string, string> = {
  mcq: 'MCQ', short_answer: 'Short Answer', long_answer: 'Long Answer',
  true_false: 'True/False', fill_blank: 'Fill in the Blank',
}

export default function PaperDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: paper, isLoading } = useQuery({ queryKey: ['paper', id], queryFn: () => getPaper(id!) })

  const publishMut = useMutation({
    mutationFn: () => publishPaper(id!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['paper', id] }); toast.success('Paper published!') },
  })
  const deleteMut = useMutation({
    mutationFn: () => deletePaper(id!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['papers'] }); toast.success('Deleted'); navigate('/papers') },
  })

  const onExport = async () => {
    try {
      const blob = await exportPaperPDF(id!, paper?.template)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `${paper?.title ?? 'paper'}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Export failed') }
  }

  const onDownloadKey = async () => {
    try {
      const blob = await exportAnswerKey(id!, 'pdf')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `${paper?.title ?? 'paper'}_answer_key.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Key download failed') }
  }

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  if (!paper) return <div className="py-20 text-center text-brand-500">Paper not found</div>

  return (
    <div className="space-y-6">
      <PageHeader
        title={paper.title}
        subtitle={`${paper.questions?.length ?? 0} questions · ${paper.total_marks} marks · ${paper.duration_minutes ?? 0} min`}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => navigate('/papers')} className="btn-ghost flex items-center gap-2 text-sm">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => navigate(`/papers/${id}/edit`)} className="btn-ghost flex items-center gap-2 text-sm">
              <Edit3 className="w-4 h-4" /> Edit Paper
            </button>
            <button onClick={onExport} className="btn-ghost flex items-center gap-2 text-sm">
              <Download className="w-4 h-4" /> Export PDF
            </button>
            <button onClick={onDownloadKey} className="btn-ghost flex items-center gap-2 text-sm">
              <Key className="w-4 h-4" /> Answer Key PDF
            </button>
            <button
              onClick={() => navigate(`/grading/new?paper_id=${id}`)}
              className="btn-ghost flex items-center gap-2 text-sm border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <CheckSquare className="w-4 h-4" /> Use for Grading
            </button>
            {!paper.is_published && (
              <button onClick={() => publishMut.mutate()} disabled={publishMut.isPending} className="btn-primary flex items-center gap-2 text-sm">
                <Globe className="w-4 h-4" /> Publish
              </button>
            )}
            <button onClick={() => window.confirm('Delete paper?') && deleteMut.mutate()} className="btn-danger flex items-center gap-2 text-sm">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        }
      />

      {/* Meta row */}
      <div className="flex items-center gap-3 flex-wrap">
        <StatusBadge status={paper.is_published ? 'published' : 'draft'} />
        {paper.duration && (
          <div className="flex items-center gap-1 text-xs text-brand-600">
            <Clock className="w-3.5 h-3.5" /> {paper.duration}
          </div>
        )}
        <div className="flex items-center gap-1 text-xs text-brand-600">
          <CheckSquare className="w-3.5 h-3.5" /> {paper.total_marks} marks
        </div>
        {paper.institution_name && (
          <div className="flex items-center gap-1 text-xs text-brand-600">
            <Building2 className="w-3.5 h-3.5" /> {paper.institution_name}
          </div>
        )}
        <span className="text-xs text-brand-400">Created {formatDate(paper.created_at)}</span>
      </div>

      {paper.instructions && (
        <div className="card p-4 border-l-4 border-brand-400">
          <p className="text-xs font-semibold text-brand-600 mb-1">Instructions</p>
          <p className="text-sm text-[#1C0A00]">{paper.instructions}</p>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-4">
        <h2 className="section-title">Questions</h2>
        {(paper.questions ?? []).map((q, i) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="card p-5"
          >
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-100 text-brand-700 text-xs font-bold shrink-0">
                {i + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="badge badge-orange text-xs">{QUESTION_TYPE_LABELS[q.question_type] ?? q.question_type}</span>
                  <span className={`badge text-xs ${q.difficulty === 'easy' ? 'badge-green' : q.difficulty === 'hard' ? 'badge-red' : 'badge-amber'}`}>
                    {q.difficulty ?? 'medium'}
                  </span>
                  <span className="text-xs text-brand-500 ml-auto">{(q.marks ?? (q as any).max_score ?? 5)} mark{(q.marks ?? (q as any).max_score ?? 5) !== 1 ? 's' : ''}</span>
                </div>
                <p className="text-sm font-medium text-[#1C0A00] leading-relaxed">{q.question_text}</p>

                {q.question_type === 'mcq' && q.options && (
                  <div className="mt-3 space-y-1.5">
                    {(q.options as string[]).map((opt, oi) => (
                      <div
                        key={oi}
                        className={`flex items-center gap-2 p-2 rounded-lg text-sm ${opt === q.correct_answer ? 'bg-green-50 border border-green-200 font-medium text-green-700' : 'text-brand-600'}`}
                      >
                        <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs font-bold shrink-0">
                          {String.fromCharCode(65 + oi)}
                        </span>
                        {opt}
                        {opt === q.correct_answer && <CheckSquare className="w-3.5 h-3.5 ml-auto text-green-500" />}
                      </div>
                    ))}
                  </div>
                )}

                {q.question_type !== 'mcq' && q.correct_answer && (
                  <div className="mt-3 p-2.5 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs font-semibold text-green-700 mb-0.5">Model Answer</p>
                    <p className="text-sm text-green-800">{q.correct_answer}</p>
                  </div>
                )}

                {q.explanation && (
                  <p className="mt-2 text-xs text-brand-500 italic">{q.explanation}</p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
