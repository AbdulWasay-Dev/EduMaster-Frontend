import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Trash2, User } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as Dialog from '@radix-ui/react-dialog'
import { type ColumnDef } from '@tanstack/react-table'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import EmptyState from '@/components/shared/EmptyState'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import DataTable from '@/components/shared/DataTable'
import { getClass } from '@/lib/api/classes'
import { listStudents, createStudent, deleteStudent } from '@/lib/api/students'
import { type Student } from '@/types'

const studentSchema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Valid email required').optional().or(z.literal('')),
  roll_number: z.string().optional(),
})
type StudentForm = z.infer<typeof studentSchema>

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)

  const { data: cls, isLoading: loadingCls } = useQuery({ queryKey: ['class', id], queryFn: () => getClass(id!) })
  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['students', id],
    queryFn: () => listStudents(id),
    enabled: !!id,
  })

  const addMut = useMutation({
    mutationFn: (v: StudentForm) => createStudent({ ...v, class_id: id! }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['students', id] }); toast.success('Student added!'); setAddOpen(false); reset() },
    onError: () => toast.error('Failed to add student'),
  })
  const deleteMut = useMutation({
    mutationFn: deleteStudent,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['students', id] }); toast.success('Student removed') },
    onError: () => toast.error('Failed to remove'),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<StudentForm>({ resolver: zodResolver(studentSchema) })

  const columns: ColumnDef<Student, any>[] = [
    { accessorKey: 'name', header: 'Name', cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-600">
          {row.original.name.charAt(0).toUpperCase()}
        </div>
        <span className="font-medium text-[#1C0A00]">{row.original.name}</span>
      </div>
    )},
    { accessorKey: 'roll_number', header: 'Roll No.' },
    { accessorKey: 'email', header: 'Email', cell: ({ getValue }) => <span className="text-brand-600">{getValue() as string || '—'}</span> },
    { id: 'actions', header: '', cell: ({ row }) => (
      <button
        onClick={() => window.confirm('Remove student?') && deleteMut.mutate(row.original.id)}
        className="p-1.5 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    )},
  ]

  if (loadingCls) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  if (!cls) return <div className="text-center py-20 text-brand-500">Class not found</div>

  return (
    <div className="space-y-6">
      <PageHeader
        title={cls.name}
        subtitle={`${cls.grade_level} · ${cls.academic_year}`}
        action={
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/classes')} className="btn-ghost flex items-center gap-2 text-sm">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <Dialog.Root open={addOpen} onOpenChange={setAddOpen}>
              <Dialog.Trigger asChild>
                <button className="btn-primary flex items-center gap-2 text-sm">
                  <Plus className="w-4 h-4" /> Add Student
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 z-50 w-full max-w-sm">
                  <Dialog.Title className="text-lg font-bold text-[#1C0A00] mb-4">Add Student</Dialog.Title>
                  <form onSubmit={handleSubmit(v => addMut.mutate(v))} className="space-y-4">
                    <div>
                      <label className="label">Full Name *</label>
                      <input {...register('name')} className="input" placeholder="e.g. Alice Johnson" />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>
                    <div>
                      <label className="label">Roll Number</label>
                      <input {...register('roll_number')} className="input" placeholder="e.g. 001" />
                    </div>
                    <div>
                      <label className="label">Email</label>
                      <input {...register('email')} type="email" className="input" placeholder="optional" />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button type="submit" disabled={addMut.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
                        {addMut.isPending && <LoadingSpinner size="sm" />} Add Student
                      </button>
                      <Dialog.Close asChild>
                        <button type="button" className="btn-ghost">Cancel</button>
                      </Dialog.Close>
                    </div>
                  </form>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        }
      />

      <div className="flex items-center gap-4">
        <div className="card p-4 flex-1 text-center">
          <p className="text-2xl font-bold text-[#1C0A00]">{students.length}</p>
          <p className="text-xs text-brand-600 mt-0.5">Students</p>
        </div>
        <div className="card p-4 flex-1 text-center">
          <StatusBadge status={cls.is_active ? 'active' : 'inactive'} />
          <p className="text-xs text-brand-600 mt-1">Status</p>
        </div>
        <div className="card p-4 flex-1 text-center">
          <Link to={`/classes/${id}`} state={{ edit: true }} className="text-brand-500 hover:text-brand-700 text-sm font-medium">Edit Class</Link>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="section-title mb-4">Students</h2>
        {students.length === 0 && !loadingStudents ? (
          <EmptyState
            icon={User}
            title="No students yet"
            description="Add students to this class to get started."
            action={<button onClick={() => setAddOpen(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/>Add Student</button>}
          />
        ) : (
          <DataTable
            data={students}
            columns={columns}
            isLoading={loadingStudents}
            searchPlaceholder="Search students…"
            emptyMessage="No matching students"
          />
        )}
      </div>
    </div>
  )
}
