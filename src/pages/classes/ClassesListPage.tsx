import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Users, GraduationCap } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { listClasses, deleteClass } from '@/lib/api/classes'

export default function ClassesListPage() {
  const qc = useQueryClient()
  const { data: classes = [], isLoading } = useQuery({ queryKey: ['classes'], queryFn: listClasses })

  const deleteMut = useMutation({
    mutationFn: deleteClass,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['classes'] }); toast.success('Class deleted') },
    onError: () => toast.error('Failed to delete class'),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Classes"
        subtitle="Manage your classroom groups"
        action={
          <Link to="/classes/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Class
          </Link>
        }
      />
      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : classes.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No classes yet"
          description="Create your first class to start managing students."
          action={<Link to="/classes/new" className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" />New Class</Link>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(cls => (
            <motion.div
              key={cls.id}
              whileHover={{ y: -3, boxShadow: '0 12px 40px -8px rgba(28,10,0,0.14)' } as any}
              className="card p-5 relative group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-brand-500" />
                </div>
                <StatusBadge status={cls.is_active ? 'active' : 'inactive'} />
              </div>
              <h3 className="font-semibold text-[#1C0A00]">{cls.name}</h3>
              <p className="text-xs text-brand-600 mt-1">{cls.grade_level} · {cls.academic_year}</p>
              <div className="flex items-center gap-1 mt-3">
                <Users className="w-3.5 h-3.5 text-brand-400" />
                <span className="text-xs text-brand-600">{cls.student_count ?? 0} students</span>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-brand-50">
                <Link to={`/classes/${cls.id}`} className="text-xs font-medium text-brand-500 hover:text-brand-700">View →</Link>
                <button
                  onClick={() => window.confirm('Delete class?') && deleteMut.mutate(cls.id)}
                  className="ml-auto text-xs text-red-400 hover:text-red-600"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
          <Link to="/classes/new">
            <div className="card p-5 flex flex-col items-center justify-center gap-2 cursor-pointer border-dashed hover:border-brand-400 hover:bg-brand-50 transition-all group min-h-[160px]">
              <Plus className="w-6 h-6 text-brand-400 group-hover:text-brand-500" />
              <span className="text-sm font-medium text-brand-500">New Class</span>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}
