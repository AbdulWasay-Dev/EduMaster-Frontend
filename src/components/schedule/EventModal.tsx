import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { listClasses } from '@/lib/api/classes'
import { createEvent, updateEvent } from '@/lib/api/schedule'
import type { ScheduleEvent, EventType } from '@/types'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  type: z.enum(['class', 'quiz', 'assignment', 'paper', 'personal']),
  class_id: z.string().optional(),
  repeat_weekly: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

interface EventModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event?: ScheduleEvent | null
  initialDate?: string
}

export default function EventModal({ open, onOpenChange, event, initialDate }: EventModalProps) {
  const qc = useQueryClient()
  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: listClasses })

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'class',
      date: initialDate ?? new Date().toISOString().split('T')[0],
      start_time: '09:00',
      end_time: '10:00',
      repeat_weekly: false,
    }
  })

  useEffect(() => {
    if (open) {
      if (event) {
        reset({
          title: event.title,
          description: event.description || '',
          date: event.date,
          start_time: event.start_time,
          end_time: event.end_time,
          type: event.type,
          class_id: event.class_id || '',
          repeat_weekly: event.repeat_weekly || false,
        })
      } else {
        reset({
          title: '',
          description: '',
          date: initialDate ?? new Date().toISOString().split('T')[0],
          start_time: '09:00',
          end_time: '10:00',
          type: 'class',
          class_id: '',
          repeat_weekly: false,
        })
      }
    }
  }, [open, event, initialDate, reset])

  const eventType = watch('type')

  const saveMut = useMutation({
    mutationFn: async (data: FormValues) => {
      const className = data.class_id ? classes.find(c => c.id === data.class_id)?.name : undefined
      const payload = { ...data, class_name: className }
      if (event) {
        return updateEvent(event.id, payload)
      }
      return createEvent(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] })
      toast.success(event ? 'Event updated' : 'Event created')
      onOpenChange(false)
    },
    onError: () => toast.error('Failed to save event')
  })

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-xl z-50 p-6 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-lg font-bold text-[#1C0A00]">
              {event ? 'Edit Event' : 'New Event'}
            </Dialog.Title>
            <Dialog.Close className="p-2 rounded-full hover:bg-brand-50 text-brand-500 transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(d => saveMut.mutate(d))} className="space-y-4">
            <div>
              <label className="label">Event Title *</label>
              <input {...register('title')} className="input" placeholder="e.g. Physics Midterm" />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Event Type *</label>
                <select {...register('type')} className="input">
                  <option value="class">Class</option>
                  <option value="quiz">Quiz</option>
                  <option value="assignment">Assignment</option>
                  <option value="paper">Exam / Paper</option>
                  <option value="personal">Personal Event</option>
                </select>
              </div>
              <div>
                <label className="label">Date *</label>
                <input type="date" {...register('date')} className="input" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Start Time *</label>
                <input type="time" {...register('start_time')} className="input" />
              </div>
              <div>
                <label className="label">End Time *</label>
                <input type="time" {...register('end_time')} className="input" />
              </div>
            </div>

            {eventType !== 'personal' && (
              <div>
                <label className="label">Class (Optional)</label>
                <select {...register('class_id')} className="input">
                  <option value="">-- Select Class --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {!event && (
              <label className="flex items-center gap-2 p-3 border rounded-xl bg-brand-50/50 cursor-pointer hover:border-brand-300 transition-colors">
                <input type="checkbox" {...register('repeat_weekly')} className="accent-brand-500 w-4 h-4 rounded" />
                <div className="text-sm">
                  <span className="font-semibold text-brand-900 block">Repeat every week</span>
                  <span className="text-brand-600 text-xs">Schedule this event for the next 16 weeks</span>
                </div>
              </label>
            )}

            <div>
              <label className="label">Description / Notes</label>
              <textarea {...register('description')} rows={3} className="input resize-none" placeholder="Any details..." />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saveMut.isPending} className="btn-primary flex-1">
                {saveMut.isPending ? 'Saving...' : 'Save Event'}
              </button>
              <button type="button" onClick={() => onOpenChange(false)} className="btn-ghost">
                Cancel
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
