import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Users, GraduationCap, CheckSquare } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import StatusBadge from '@/components/shared/StatusBadge'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { listClasses, deleteClass } from '@/lib/api/classes'

export default function ClassesListPage() {
  const qc = useQueryClient()
  const [showActive, setShowActive] = useState<'all' | 'active' | 'inactive'>('all')
  const [search, setSearch] = useState('')

  const { data: classes = [], isLoading } = useQuery({ queryKey: ['classes'], queryFn: listClasses })

  const deleteMut = useMutation({
    mutationFn: deleteClass,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['classes'] }); toast.success('Class deleted') },
    onError: () => toast.error('Failed to delete class'),
  })

  const filtered = classes.filter(cls => {
    const matchesStatus = showActive === 'all' || (showActive === 'active' ? cls.is_active : !cls.is_active)
    const matchesSearch = !search || cls.name.toLowerCase().includes(search.toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Classes"
        subtitle="Manage your classroom groups and students"
        action={
          <Link to="/classes/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Class
          </Link>
        }
      />

      {/* Filters */}
      {classes.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search classes…"
            className="input text-sm py-1.5 w-48"
          />
          <div className="flex items-center gap-1 bg-brand-50 p-1 rounded-lg">
            {(['all', 'active', 'inactive'] as const).map(s => (
              <button
                key={s}
                onClick={() => setShowActive(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                  showActive === s ? 'bg-white shadow-sm text-brand-700' : 'text-brand-500 hover:text-brand-700'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <span className="text-xs text-brand-400 ml-auto">{filtered.length} class{filtered.length !== 1 ? 'es' : ''}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : classes.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No classes yet"
          description="Create your first class to start managing students, papers and grading."
          action={
            <Link to="/classes/new" className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Class
            </Link>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(cls => (
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
              <p className="text-xs text-brand-600 mt-1">
                {[cls.grade_level, cls.academic_year].filter(Boolean).join(' · ')}
              </p>
              <div className="flex items-center gap-1 mt-3">
                <Users className="w-3.5 h-3.5 text-brand-400" />
                <span className="text-xs text-brand-600">{cls.student_count ?? 0} students</span>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-brand-50">
                <Link
                  to={`/classes/${cls.id}`}
                  className="text-xs font-medium text-brand-500 hover:text-brand-700 flex items-center gap-1"
                >
                  Open →
                </Link>
                <Link
                  to={`/grading/new?class_id=${cls.id}`}
                  title="Quick Grade"
                  className="ml-auto flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg transition-colors"
                >
                  <CheckSquare className="w-3.5 h-3.5" /> Quick Grade
                </Link>
                <button
                  onClick={() => window.confirm(`Delete "${cls.name}"?`) && deleteMut.mutate(cls.id)}
                  className="text-xs text-red-400 hover:text-red-600 ml-1"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
          <Link to="/classes/new">
            <div className="card p-5 flex flex-col items-center justify-center gap-2 cursor-pointer border-dashed hover:border-brand-400 hover:bg-brand-50 transition-all group min-h-[180px]">
              <Plus className="w-6 h-6 text-brand-400 group-hover:text-brand-500" />
              <span className="text-sm font-medium text-brand-500">New Class</span>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}
