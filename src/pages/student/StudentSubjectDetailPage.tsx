import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BookOpen, FileText, ClipboardList } from 'lucide-react'
import { useParams, Link } from 'react-router-dom'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { getMySubjectDetail } from '@/lib/api/student-portal'

export default function StudentSubjectDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: subject, isLoading } = useQuery({
    queryKey: ['student-subject-detail', id],
    queryFn: () => getMySubjectDetail(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>
  }

  if (!subject) {
    return <div className="text-center py-16 text-slate-400">Subject not found.</div>
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{subject.name}</h1>
        <p className="text-slate-500 text-sm mt-1">{subject.description || 'Your class subject hub.'}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <p className="text-xs text-slate-400 font-medium">Documents</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{subject.document_count}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <p className="text-xs text-slate-400 font-medium">Assignments</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{subject.assignment_count}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <p className="text-xs text-slate-400 font-medium">Average Score</p>
          <p className="text-2xl font-bold text-sky-500 mt-1">{subject.average_score != null ? `${subject.average_score}%` : 'N/A'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2"><FileText className="w-4 h-4" /> Documents</h2>
          <div className="space-y-3">
            {subject.documents?.length ? subject.documents.map((doc: { id: string; file_name: string; file_type: string; status: string }) => (
              <div key={doc.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{doc.file_name}</p>
                  <p className="text-xs text-slate-500">{doc.file_type} · {doc.status}</p>
                </div>
              </div>
            )) : <p className="text-sm text-slate-400">No documents published for this subject.</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2"><ClipboardList className="w-4 h-4" /> Assignments</h2>
          <div className="space-y-3">
            {subject.assignments?.length ? subject.assignments.map((assignment: { id: string; title: string; due_date?: string | null; total_marks: number; status: string }) => (
              <Link key={assignment.id} to={`/student/assignments/${assignment.id}`} className="block rounded-lg border border-slate-100 p-3 hover:border-sky-200 hover:bg-sky-50/40 transition-colors">
                <p className="text-sm font-medium text-slate-800">{assignment.title}</p>
                <p className="text-xs text-slate-500">{assignment.total_marks} marks{assignment.due_date ? ` · Due ${new Date(assignment.due_date).toLocaleDateString()}` : ''}</p>
              </Link>
            )) : <p className="text-sm text-slate-400">No assignments available for this subject.</p>}
          </div>
        </div>
      </div>

      <div className="bg-slate-950 text-white rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-sky-400" />
          <h2 className="font-semibold">Subject Learning Hub</h2>
        </div>
        <p className="text-sm text-slate-300">
          Use the RAG assistant and class documents to review notes, clarify concepts, and prepare for your next graded task.
        </p>
      </div>
    </motion.div>
  )
}