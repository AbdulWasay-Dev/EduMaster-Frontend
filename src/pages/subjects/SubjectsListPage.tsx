import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import SubjectCard from '@/components/subjects/SubjectCard'
import { listSubjects, deleteSubject } from '@/lib/api/subjects'

export default function SubjectsListPage() {
  const qc = useQueryClient()

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: listSubjects,
  })

  const deleteMut = useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subjects'] })
      toast.success('Subject deleted')
    },
    onError: () => toast.error('Failed to delete subject'),
  })

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this subject? This cannot be undone.')) {
      deleteMut.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subjects"
        subtitle="Manage the subjects you teach"
        action={
          <Link to="/subjects/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Subject
          </Link>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects yet"
          description="Create your first subject to start organizing your teaching content."
          action={
            <Link to="/subjects/new" className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Subject
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map(subject => (
            <SubjectCard key={subject.id} subject={subject} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
