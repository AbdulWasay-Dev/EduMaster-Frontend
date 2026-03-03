import { motion } from 'framer-motion'
import { BookOpen, MoreVertical, Trash2, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { type Subject } from '@/types'
import { subjectBorderColor } from '@/lib/utils'

interface SubjectCardProps {
  subject: Subject
  onDelete: (id: string) => void
}

export default function SubjectCard({ subject, onDelete }: SubjectCardProps) {
  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: '0 12px 40px -8px rgba(28,10,0,0.14)' } as any}
      className={`card p-5 border-l-4 ${subjectBorderColor(subject.name)} relative group`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-brand-500" />
          </div>
          <div>
            <h3 className="font-semibold text-[#1C0A00]">{subject.name}</h3>
            {subject.code && <p className="text-xs text-brand-500 font-mono">{subject.code}</p>}
          </div>
        </div>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-brand-100 transition-all">
              <MoreVertical className="w-4 h-4 text-brand-500" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-[140px] bg-white border border-brand-100 rounded-xl shadow-card py-1 z-50"
              align="end"
            >
              <DropdownMenu.Item asChild>
                <Link
                  to={`/subjects/${subject.id}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-brand-50 cursor-pointer outline-none"
                >
                  <Pencil className="w-3.5 h-3.5 text-brand-500" /> Edit
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={() => onDelete(subject.id)}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 text-red-600 cursor-pointer outline-none"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {subject.description && (
        <p className="text-xs text-brand-600 mt-3 line-clamp-2">{subject.description}</p>
      )}

      <Link
        to={`/subjects/${subject.id}`}
        className="mt-4 text-xs font-medium text-brand-500 hover:text-brand-700 flex items-center gap-1"
      >
        View details →
      </Link>
    </motion.div>
  )
}
