import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, FileText, Trash2, LayoutGrid, LayoutList, Sparkles,
  Search, BookOpen, Filter, ExternalLink, Clock, CheckCircle2,
  AlertCircle, Loader2, FolderOpen,
} from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { listDocuments, deleteDocument } from '@/lib/api/documents'
import { listSubjects } from '@/lib/api/subjects'
import { formatDate, formatBytes, fileIcon } from '@/lib/utils'
import type { Document, Subject } from '@/types'

const FILE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  pdf:  { bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-200'    },
  pptx: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  ppt:  { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  docx: { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200'   },
  doc:  { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200'   },
  png:  { bg: 'bg-emerald-100',text: 'text-emerald-700',border: 'border-emerald-200'},
  jpg:  { bg: 'bg-emerald-100',text: 'text-emerald-700',border: 'border-emerald-200'},
  jpeg: { bg: 'bg-emerald-100',text: 'text-emerald-700',border: 'border-emerald-200'},
  txt:  { bg: 'bg-slate-100',  text: 'text-slate-600',  border: 'border-slate-200'  },
}

function StatusChip({ status }: { status: string }) {
  if (status === 'completed') return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
      <CheckCircle2 className="w-2.5 h-2.5" /> Ready
    </span>
  )
  if (status === 'processing') return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
      <Loader2 className="w-2.5 h-2.5 animate-spin" /> Processing
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">
      <AlertCircle className="w-2.5 h-2.5" /> {status}
    </span>
  )
}

export default function DocumentsLibraryPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const qc = useQueryClient()

  // Pre-select subject if coming from a subject page
  const prefilledSubjectId = searchParams.get('subject_id') ?? ''

  const { data: docs = [], isLoading } = useQuery<Document[]>({
    queryKey: ['documents'],
    queryFn: () => listDocuments(),
  })

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: () => listSubjects(),
  })

  const deleteMut = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); toast.success('Document deleted') },
    onError: () => toast.error('Failed to delete'),
  })

  // Build subject name lookup
  const subjectMap = useMemo(() =>
    Object.fromEntries(subjects.map(s => [s.id, s.name])),
    [subjects]
  )

  const getSubjectName = (doc: Document) =>
    doc.subject_name || subjectMap[doc.subject_id] || null

  const filtered = useMemo(() => {
    const activeSubject = subjectFilter || prefilledSubjectId
    return docs.filter(doc => {
      const matchSubject = !activeSubject || doc.subject_id === activeSubject
      const matchSearch = !search ||
        (doc.filename || doc.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (getSubjectName(doc) ?? '').toLowerCase().includes(search.toLowerCase())
      return matchSubject && matchSearch
    })
  }, [docs, search, subjectFilter, prefilledSubjectId, subjectMap])

  const typeChip = (type: string) => {
    const t = (type || '').toLowerCase()
    const c = FILE_COLORS[t] || { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' }
    return t ? (
      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${c.bg} ${c.text} ${c.border}`}>{t}</span>
    ) : null
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Library"
        subtitle="Upload study materials — AI generates exam questions from these"
        action={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-brand-50 p-1 rounded-lg">
              <button onClick={() => setView('grid')} className={`p-1.5 rounded ${view === 'grid' ? 'bg-white shadow-sm' : ''}`}>
                <LayoutGrid className="w-4 h-4 text-brand-600" />
              </button>
              <button onClick={() => setView('list')} className={`p-1.5 rounded ${view === 'list' ? 'bg-white shadow-sm' : ''}`}>
                <LayoutList className="w-4 h-4 text-brand-600" />
              </button>
            </div>
            <Link to="/documents/upload" className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Upload
            </Link>
          </div>
        }
      />

      {/* Stats row */}
      {!isLoading && docs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total',      value: docs.length,                                      color: 'from-brand-500 to-orange-400'   },
            { label: 'Ready',      value: docs.filter(d => d.processing_status === 'completed').length, color: 'from-emerald-500 to-teal-400' },
            { label: 'Processing', value: docs.filter(d => d.processing_status === 'processing').length, color: 'from-amber-500 to-yellow-400' },
            { label: 'Subjects',   value: new Set(docs.map(d => d.subject_id).filter(Boolean)).size, color: 'from-blue-500 to-cyan-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-sm flex-shrink-0`}>
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-[#1C0A00] leading-none">{value}</p>
                <p className="text-xs text-brand-500 mt-0.5 font-medium">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search + filter */}
      {!isLoading && docs.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search documents…" className="input pl-9 text-sm w-full" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
            <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}
              className="input pl-9 text-sm pr-8 appearance-none">
              <option value="">All Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <span className="text-xs text-brand-400 ml-auto">{filtered.length} document{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : docs.length === 0 ? (
        <EmptyState icon={FileText} title="No documents yet"
          description="Upload textbooks, notes, or slides to enable AI-powered exam generation."
          action={<Link to="/documents/upload" className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Upload Document</Link>}
        />
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderOpen className="w-10 h-10 text-brand-200 mx-auto mb-3" />
          <p className="font-semibold text-[#1C0A00] mb-1">No documents match</p>
          <button onClick={() => { setSearch(''); setSubjectFilter('') }} className="btn-ghost text-sm mt-2">Clear filters</button>
        </div>
      ) : view === 'list' ? (
        /* ── List view ── */
        <div className="card overflow-hidden divide-y divide-brand-50">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-brand-50 text-xs font-semibold text-brand-500 uppercase tracking-wide">
            <div className="col-span-5">File</div>
            <div className="col-span-2">Subject</div>
            <div className="col-span-1">Type</div>
            <div className="col-span-1">Size</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1">Uploaded</div>
            <div className="col-span-1"></div>
          </div>
          <AnimatePresence>
            {filtered.map(doc => {
              const subName = getSubjectName(doc)
              return (
                <motion.div key={doc.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-brand-25 group transition-colors">
                  <div className="col-span-5 flex items-center gap-2 min-w-0">
                    <span className="text-xl flex-shrink-0">{fileIcon(doc.file_type ?? '')}</span>
                    <Link to={`/documents/${doc.id}`}
                      className="font-medium text-[#1C0A00] hover:text-brand-500 truncate text-sm">
                      {doc.filename || doc.title}
                    </Link>
                  </div>
                  <div className="col-span-2">
                    {subName ? (
                      <span className="inline-flex items-center gap-1 text-xs text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full font-medium truncate max-w-full">
                        <BookOpen className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{subName}</span>
                      </span>
                    ) : <span className="text-brand-300 text-xs">—</span>}
                  </div>
                  <div className="col-span-1">{typeChip(doc.file_type ?? '')}</div>
                  <div className="col-span-1 text-xs text-brand-500">{doc.file_size ? formatBytes(doc.file_size) : '—'}</div>
                  <div className="col-span-1"><StatusChip status={doc.processing_status} /></div>
                  <div className="col-span-1 text-xs text-brand-400">{formatDate(doc.created_at)}</div>
                  <div className="col-span-1 flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    {doc.processing_status === 'completed' && (
                      <button onClick={() => navigate(`/papers/generate?doc_id=${doc.id}`)}
                        className="p-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-500 transition-colors" title="Use in Paper">
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => window.confirm('Delete document?') && deleteMut.mutate(doc.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      ) : (
        /* ── Grid view ── */
        <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filtered.map((doc, i) => {
              const subName = getSubjectName(doc)
              const type = (doc.file_type || '').toLowerCase()
              const colors = FILE_COLORS[type] || { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' }
              return (
                <motion.div key={doc.id} layout
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
                  whileHover={{ y: -4, boxShadow: '0 12px 32px -8px rgba(28,10,0,0.14)' } as any}
                  className="card p-4 group flex flex-col overflow-hidden"
                >
                  {/* Top accent line */}
                  <div className={`absolute top-0 left-0 right-0 h-1 ${colors.bg}`} />

                  <div className="flex items-start justify-between mb-3 mt-1">
                    <span className="text-4xl">{fileIcon(doc.file_type ?? '')}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {doc.processing_status === 'completed' && (
                        <button onClick={() => navigate(`/papers/generate?doc_id=${doc.id}`)}
                          className="p-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-500 transition-colors" title="Use in Paper">
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => window.confirm('Delete?') && deleteMut.mutate(doc.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-all" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <Link to={`/documents/${doc.id}`}>
                    <h3 className="font-semibold text-sm text-[#1C0A00] hover:text-brand-500 line-clamp-2 leading-snug transition-colors">
                      {doc.filename || doc.title}
                    </h3>
                  </Link>

                  {/* Subject name tag — NO raw ID */}
                  {subName ? (
                    <div className="mt-2 flex items-center gap-1 text-xs text-brand-600 bg-brand-50 px-2 py-1 rounded-lg w-fit max-w-full">
                      <BookOpen className="w-3 h-3 flex-shrink-0 text-brand-400" />
                      <span className="truncate font-medium">{subName}</span>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-brand-300 italic">No subject assigned</div>
                  )}

                  <div className="mt-auto pt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      {typeChip(type)}
                      <span className="text-xs text-brand-400">{doc.file_size ? formatBytes(doc.file_size) : ''}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <StatusChip status={doc.processing_status} />
                      <span className="text-[10px] text-brand-300 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />{formatDate(doc.created_at)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
