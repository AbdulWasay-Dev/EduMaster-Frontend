import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { getMyScores } from '@/lib/api/student-portal'
import { cn } from '@/lib/utils'

function gradeColor(grade: string) {
  if (grade.startsWith('A')) return 'text-green-600 bg-green-50'
  if (grade.startsWith('B')) return 'text-sky-600 bg-sky-50'
  if (grade.startsWith('C')) return 'text-amber-600 bg-amber-50'
  return 'text-red-600 bg-red-50'
}

export default function StudentScoresPage() {
  const { data: scores, isLoading } = useQuery({
    queryKey: ['student-scores'],
    queryFn: getMyScores,
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>
  }

  const avg = scores && scores.length > 0
    ? Math.round(scores.reduce((s, sc) => s + sc.percentage, 0) / scores.length)
    : null

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Scores</h1>
          <p className="text-slate-500 text-sm mt-1">Your graded assignment results.</p>
        </div>
        {avg != null && (
          <div className="text-right">
            <p className="text-xs text-slate-400">Average</p>
            <p className="text-3xl font-bold text-sky-500">{avg}%</p>
          </div>
        )}
      </div>

      {scores && scores.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Assignment</th>
                <th className="text-left px-4 py-3">Subject</th>
                <th className="text-center px-4 py-3">Score</th>
                <th className="text-center px-4 py-3">%</th>
                <th className="text-center px-4 py-3">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scores.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{s.assignment_title}</td>
                  <td className="px-4 py-3 text-slate-500">{s.subject_name}</td>
                  <td className="px-4 py-3 text-center text-slate-700">{s.marks_obtained}/{s.total_marks}</td>
                  <td className="px-4 py-3 text-center font-medium text-slate-700">{s.percentage}%</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', gradeColor(s.grade))}>
                      {s.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 text-slate-400">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No graded scores yet.</p>
        </div>
      )}
    </motion.div>
  )
}
