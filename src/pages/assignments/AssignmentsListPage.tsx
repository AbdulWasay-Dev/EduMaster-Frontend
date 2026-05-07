import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Clock, CheckCircle2, XCircle, FileText, Trash2, Settings, ChevronRight, BarChart3, Search } from 'lucide-react'
import { toast } from 'sonner'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { listAssignments, deleteAssignment, publishAssignment, closeAssignment } from '@/lib/api/assignments'
import { listClasses } from '@/lib/api/classes'
import { cn } from '@/lib/utils'
import type { Assignment } from '@/types'
import EmailConfigModal from './components/EmailConfigModal'

const statusConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  draft: { icon: FileText, label: 'Draft', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  published: { icon: Clock, label: 'Published', color: 'bg-green-50 text-green-700 border-green-200' },
  closed: { icon: XCircle, label: 'Closed', color: 'bg-red-50 text-red-600 border-red-200' },
}

export default function AssignmentsListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [classFilter, setClassFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showEmailConfig, setShowEmailConfig] = useState(false)

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

  const filteredAssignments = (assignments || []).filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header section with gradient background */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1C0A00] to-brand-900 rounded-3xl p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Assignment Center</h1>
            <p className="text-brand-100/80 max-w-xl">Create and manage assignments, track student submissions, and auto-grade using AI with our advanced system.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button onClick={() => setShowEmailConfig(true)} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all text-sm font-medium border border-white/10">
              <Settings className="w-4 h-4" /> Email Sync
            </button>
            <button onClick={() => navigate('/assignments/new')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all text-sm font-bold">
              <Plus className="w-4 h-4" /> New Assignment
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-brand-100 shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="input w-full sm:w-48 bg-brand-50 border-transparent focus:bg-white"
          >
            <option value="">All Classes</option>
            {(classes || []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
          <input 
            type="text" 
            placeholder="Search assignments..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-9 w-full bg-brand-50 border-transparent focus:bg-white"
          />
        </div>
      </div>

      {/* Assignments List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>
      ) : filteredAssignments.length > 0 ? (
        <div className="grid gap-4">
          <AnimatePresence>
            {filteredAssignments.map((a: Assignment) => {
              const sc = statusConfig[a.status] || statusConfig.draft
              const Icon = sc.icon
              const cl = classes?.find(c => c.id === a.class_id)
              
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  key={a.id}
                  className="group relative bg-white rounded-2xl border border-brand-100 p-5 shadow-sm hover:shadow-md hover:border-brand-300 transition-all overflow-hidden"
                >
                  {/* Subtle left border accent */}
                  <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", 
                    a.status === 'published' ? "bg-green-400" : 
                    a.status === 'draft' ? "bg-brand-400" : "bg-red-400"
                  )} />

                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pl-2">
                    <Link to={`/assignments/${a.id}`} className="flex items-start gap-4 flex-1 min-w-0 w-full group/link">
                      <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 text-brand-500 group-hover/link:bg-brand-500 group-hover/link:text-white transition-colors shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-base font-bold text-[#1C0A00] truncate group-hover/link:text-brand-600 transition-colors">
                            {a.title}
                          </h3>
                          <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border', sc.color)}>
                            <Icon className="w-3 h-3" /> {sc.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-brand-500 font-medium">
                          <span className="flex items-center gap-1 text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                            {cl?.name || 'Class'}
                          </span>
                          <span>{a.total_marks} Marks</span>
                          {a.due_date && <span className="text-orange-600">Due: {new Date(a.due_date).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    </Link>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center w-full md:w-auto justify-end mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-0 border-brand-50">
                      <Link to={`/assignments/${a.id}`} className="p-2 text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg text-sm font-semibold flex items-center gap-1 transition-colors mr-1">
                        <BarChart3 className="w-4 h-4" /> Manage <ChevronRight className="w-4 h-4 hidden sm:block" />
                      </Link>
                      
                      {a.status === 'draft' && (
                        <button
                          onClick={() => publishMut.mutate(a.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Publish"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => { if (confirm('Delete this assignment?')) deleteMut.mutate(a.id) }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-brand-100 p-16 text-center shadow-sm">
          <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <FileText className="w-10 h-10 text-brand-300" />
          </div>
          <h2 className="text-xl font-bold text-[#1C0A00] mb-2">No assignments found</h2>
          <p className="text-brand-500 max-w-sm mx-auto mb-6">
            {searchQuery ? "We couldn't find any assignments matching your search." : "You haven't created any assignments yet. Create one to start accepting submissions."}
          </p>
          {!searchQuery && (
            <button onClick={() => navigate('/assignments/new')} className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create First Assignment
            </button>
          )}
        </div>
      )}

      {showEmailConfig && <EmailConfigModal onClose={() => setShowEmailConfig(false)} />}
    </motion.div>
  )
}
