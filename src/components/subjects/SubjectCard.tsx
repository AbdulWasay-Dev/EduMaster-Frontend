import { motion } from 'framer-motion'
import {
  BookOpen, MoreVertical, Trash2, Pencil, FileText,
  ScrollText, Users, GraduationCap, Calendar, Tag,
  ChevronRight, CheckCircle2
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { type Subject } from '@/types'

interface SubjectCardProps {
  subject: Subject
  onDelete: (id: string) => void
  className?: string
}

// Blue-led gradients based on subject name hash
const SUBJECT_GRADIENTS = [
  'from-brand-500 to-brand-300',
  'from-brand-600 to-brand-400',
  'from-violet-500 to-purple-400',
  'from-emerald-500 to-teal-400',
  'from-indigo-500 to-blue-400',
  'from-brand-500 to-brand-300',
]

const SUBJECT_BG_LIGHT = [
  'bg-brand-50',
  'bg-sky-50',
  'bg-violet-50',
  'bg-emerald-50',
  'bg-blue-50',
  'bg-cyan-50',
]

function getSubjectIndex(name: string): number {
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return hash % SUBJECT_GRADIENTS.length
}

export default function SubjectCard({ subject, onDelete }: SubjectCardProps) {
  const navigate = useNavigate()
  const idx = getSubjectIndex(subject.name)
  const gradient = SUBJECT_GRADIENTS[idx]
  const bgLight = SUBJECT_BG_LIGHT[idx]

  const stats = [
    { icon: FileText,   label: 'Docs',     value: subject.document_count ?? 0 },
    { icon: ScrollText, label: 'Papers',   value: subject.paper_count ?? 0 },
    { icon: Users,      label: 'Students', value: subject.student_count ?? 0 },
  ]

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 20px 48px -8px rgba(15,23,42,0.16)' } as any}
      transition={{ duration: 0.2 }}
      className={`card relative group cursor-pointer overflow-hidden border-0 shadow-card`}
      onClick={() => navigate(`/subjects/${subject.id}`)}
      role="link"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') navigate(`/subjects/${subject.id}`) }}
    >
      {/* Colored top bar */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />

      {/* Card body */}
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Subject icon circle */}
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-[#0f172a] text-base leading-tight truncate">
                {subject.name}
              </h3>
              {subject.code && (
                <span className="inline-flex items-center gap-1 mt-0.5 text-xs font-mono font-semibold text-brand-500 bg-brand-50 px-2 py-0.5 rounded-md">
                  <Tag className="w-3 h-3" />
                  {subject.code}
                </span>
              )}
            </div>
          </div>

          {/* Dropdown — stops propagation so clicking it doesn't navigate */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                onClick={e => e.stopPropagation()}
                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-brand-100 transition-all flex-shrink-0"
              >
                <MoreVertical className="w-4 h-4 text-brand-500" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[150px] bg-white border border-brand-100 rounded-xl shadow-card py-1 z-50"
                align="end"
                onClick={e => e.stopPropagation()}
              >
                <DropdownMenu.Item asChild>
                  <Link
                    to={`/subjects/${subject.id}`}
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-brand-50 cursor-pointer outline-none"
                  >
                    <Pencil className="w-3.5 h-3.5 text-brand-500" /> Edit Subject
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onSelect={e => { onDelete(subject.id) }}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 text-red-600 cursor-pointer outline-none"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>

        {/* Description */}
        {subject.description && (
          <p className="text-xs text-brand-600 leading-relaxed line-clamp-2 mb-4">
            {subject.description}
          </p>
        )}

        {/* Meta tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {subject.grade_level && (
            <span className="inline-flex items-center gap-1 text-xs text-brand-600 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-full">
              <GraduationCap className="w-3 h-3" />
              {subject.grade_level}
            </span>
          )}
          {subject.academic_year && (
            <span className="inline-flex items-center gap-1 text-xs text-brand-600 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-full">
              <Calendar className="w-3 h-3" />
              {subject.academic_year}
            </span>
          )}
          {subject.subject_area && (
            <span className="inline-flex items-center gap-1 text-xs text-brand-600 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-full">
              <BookOpen className="w-3 h-3" />
              {subject.subject_area}
            </span>
          )}
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
            subject.is_active
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              : 'bg-gray-100 text-gray-500 border border-gray-200'
          }`}>
            <CheckCircle2 className="w-3 h-3" />
            {subject.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Stats row */}
        <div className={`grid grid-cols-3 gap-2 p-3 ${bgLight} rounded-xl mb-4`}>
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <Icon className="w-3.5 h-3.5 text-brand-400 mb-0.5" />
              <span className="text-base font-bold text-[#0f172a] leading-none">{value}</span>
              <span className="text-[10px] text-brand-500 font-medium">{label}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-brand-400">
            Click to view details
          </span>
          <div className="flex items-center gap-1 text-xs font-semibold text-brand-500 group-hover:text-brand-700 transition-colors">
            Open <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
