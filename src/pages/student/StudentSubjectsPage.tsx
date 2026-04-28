import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BookOpen, FileText, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { getMySubjects } from '@/lib/api/student-portal'

export default function StudentSubjectsPage() {
  const { data: subjects, isLoading } = useQuery({
    queryKey: ['student-subjects'],
    queryFn: getMySubjects,
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Subjects</h1>
        <p className="text-slate-500 text-sm mt-1">Subjects in your class.</p>
      </div>

      {subjects && subjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((s: { id: string; name: string; description?: string; document_count: number }) => (
            <Link
              key={s.id}
              to={`/student/subjects/${s.id}`}
              className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-800">{s.name}</h3>
              </div>
              {s.description && <p className="text-xs text-slate-500 line-clamp-2 mb-2">{s.description}</p>}
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <FileText className="w-3 h-3" />
                {s.document_count} document{s.document_count !== 1 ? 's' : ''}
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-400 mt-2">
                <TrendingUp className="w-3 h-3" />
                Open subject analytics
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-slate-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No subjects found.</p>
        </div>
      )}
    </motion.div>
  )
}
