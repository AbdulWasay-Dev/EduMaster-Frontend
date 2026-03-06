import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Clock, CheckCircle2, XCircle, FileText, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { listAssignments, deleteAssignment, publishAssignment, closeAssignment } from '@/lib/api/assignments'
import { listClasses } from '@/lib/api/classes'
import { cn } from '@/lib/utils'
import type { Assignment } from '@/types'

const statusConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  draft: { icon: FileText, label: 'Draft', color: 'bg-slate-100 text-slate-600' },
  published: { icon: Clock, label: 'Published', color: 'bg-green-50 text-green-700' },
  closed: { icon: XCircle, label: 'Closed', color: 'bg-red-50 text-red-600' },
}

export default function AssignmentsListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [classFilter, setClassFilter] = useState('')

  const { data: classes } = useQuery({ queryKey: ['classes'], queryFn: listClasses })
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['assignments', classFilter],
    queryFn: () => listAssignments(classFilter ? { class_id: classFilter } : undefined),
  })

  const deleteMut = useMutation({
    mutationFn: deleteAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      toast.success('Assignment deleted')
    },
  })

  const publishMut = useMutation({
    mutationFn: publishAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      toast.success('Assignment published!')
    },
  })

  const closeMut = useMutation({
    mutationFn: closeAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      toast.success('Assignment closed')
    },
  })

  if (isLoading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1C0A00]">Assignments</h1>
          <p className="text-brand-700 text-sm mt-1">Create, manage, and grade student assignments.</p>
        </div>
        <button
          onClick={() => navigate('/assignments/new')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Assignment
        </button>
      </div>

      {/* Filter */}
      <div>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="input w-48"
        >
          <option value="">All Classes</option>
          {(classes || []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Assignments list */}
      {(assignments || []).length > 0 ? (
        <div className="space-y-3">
          {(assignments || []).map((a: Assignment) => {
            const sc = statusConfig[a.status] || statusConfig.draft
            const Icon = sc.icon
            return (
              <div
                key={a.id}
                className="flex items-center gap-4 bg-white rounded-xl border border-brand-100 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <Link to={`/assignments/${a.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-50 text-brand-500 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1C0A00] truncate">{a.title}</p>
                    <p className="text-xs text-brand-700">
                      {a.total_marks} marks
                      {a.due_date && ` · Due: ${new Date(a.due_date).toLocaleDateString()}`}
                    </p>
                  </div>
                  <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', sc.color)}>
                    <Icon className="w-3 h-3" /> {sc.label}
                  </span>
                </Link>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {a.status === 'draft' && (
                    <button
                      onClick={() => publishMut.mutate(a.id)}
                      className="px-2 py-1 text-xs font-medium rounded-md bg-green-50 text-green-700 hover:bg-green-100"
                      title="Publish"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {a.status === 'published' && (
                    <button
                      onClick={() => closeMut.mutate(a.id)}
                      className="px-2 py-1 text-xs font-medium rounded-md bg-red-50 text-red-600 hover:bg-red-100"
                      title="Close"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => { if (confirm('Delete this assignment?')) deleteMut.mutate(a.id) }}
                    className="px-2 py-1 text-xs font-medium rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-brand-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No assignments yet. Create your first one!</p>
        </div>
      )}
    </motion.div>
  )
}
