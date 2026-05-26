import { type KeyboardEvent, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, Loader2, LogOut, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import { cn, getInitials } from '@/lib/utils'
import { listClasses } from '@/lib/api/classes'
import { listSubjects } from '@/lib/api/subjects'
import { listDocuments } from '@/lib/api/documents'
import { listPapers } from '@/lib/api/papers'
import { listAssignments } from '@/lib/api/assignments'
import { listSubmissions } from '@/lib/api/grading'
import type { Assignment, Class, Document as AppDocument, Paper, Subject, Submission } from '@/types'
import NotificationDropdown from './NotificationDropdown'

type SearchResult = {
  id: string
  type: string
  title: string
  subtitle: string
  to: string
  searchText: string
  priority: number
}

type SearchData = {
  classes: Class[]
  subjects: Subject[]
  documents: AppDocument[]
  papers: Paper[]
  assignments: Assignment[]
  submissions: Submission[]
}

const PAGE_RESULTS: SearchResult[] = [
  createResult('page-dashboard', 'Page', 'Dashboard', 'Overview and performance snapshot', '/dashboard', 'dashboard home overview kpi', -2),
  createResult('page-subjects', 'Page', 'Subjects', 'Manage subjects, documents, and papers', '/subjects', 'subjects courses documents papers', -1),
  createResult('page-classes', 'Page', 'Classes', 'Manage classes, students, and schedules', '/classes', 'classes students schedule attendance', -1),
  createResult('page-assignments', 'Page', 'Assignments', 'Create, publish, and grade assignments', '/assignments', 'assignments submissions auto grade', -1),
  createResult('page-documents', 'Page', 'Documents', 'Upload and manage study material', '/documents', 'documents library uploads notes files', -1),
  createResult('page-papers', 'Page', 'Papers', 'Generate and manage exam papers', '/papers', 'papers exams questions generate', -1),
  createResult('page-grading', 'Page', 'Grading', 'Grade answer sheets and review results', '/grading', 'grading answer sheets submissions results', -1),
  createResult('page-attendance', 'Page', 'Attendance', 'Take attendance and review records', '/attendance', 'attendance presence records students', -1),
  createResult('page-schedule', 'Page', 'Schedule', 'Class calendar and events', '/schedule', 'schedule calendar events classes', 0),
  createResult('page-analytics', 'Page', 'Analytics', 'Reports and insights', '/analytics', 'analytics reports insights charts', 0),
]

function createResult(
  id: string,
  type: string,
  title: string,
  subtitle: string,
  to: string,
  keywords = '',
  priority = 0,
): SearchResult {
  return {
    id,
    type,
    title,
    subtitle,
    to,
    priority,
    searchText: normalizeSearch([type, title, subtitle, to, keywords].join(' ')),
  }
}

function normalizeSearch(value: string) {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

function settled<T>(result: PromiseSettledResult<T[]>): T[] {
  return result.status === 'fulfilled' ? result.value : []
}

async function loadSearchData(): Promise<SearchData> {
  const [classes, subjects, documents, papers, assignments, submissions] = await Promise.allSettled([
    listClasses(),
    listSubjects(),
    listDocuments(),
    listPapers(),
    listAssignments(),
    listSubmissions(),
  ])

  return {
    classes: settled(classes),
    subjects: settled(subjects),
    documents: settled(documents),
    papers: settled(papers),
    assignments: settled(assignments),
    submissions: settled(submissions),
  }
}

function scoreResult(result: SearchResult, terms: string[]) {
  if (!terms.every(term => result.searchText.includes(term))) return Number.POSITIVE_INFINITY
  const first = terms[0]
  const title = normalizeSearch(result.title)
  const wordStart = result.searchText.split(' ').some(word => word.startsWith(first))
  return result.priority + (title === terms.join(' ') ? 0 : title.startsWith(first) ? 1 : wordStart ? 2 : 3)
}

function useBreadcrumbs() {
  const { pathname } = useLocation()
  const parts = pathname.split('/').filter(Boolean)
  return parts.map((part, i) => ({
    label: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
    to: '/' + parts.slice(0, i + 1).join('/'),
    isLast: i === parts.length - 1,
  }))
}

export default function TopNav() {
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const breadcrumbs = useBreadcrumbs()
  const searchRef = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const deferredSearch = useDeferredValue(search)
  const searchTerm = normalizeSearch(deferredSearch)

  const { data: searchData, isFetching } = useQuery({
    queryKey: ['global-search-index'],
    queryFn: loadSearchData,
    enabled: isAuthenticated && isSearchOpen,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  })

  useEffect(() => {
    if (!isSearchOpen) return
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [isSearchOpen])

  const entityResults = useMemo<SearchResult[]>(() => {
    if (!searchData) return []

    return [
      ...searchData.classes.map(cls =>
        createResult(
          `class-${cls.id}`,
          'Class',
          cls.name,
          [cls.grade_level, `${cls.student_count ?? 0} students`].filter(Boolean).join(' | '),
          `/classes/${cls.id}`,
          [cls.description, cls.class_code, cls.subject_area, cls.academic_year].filter(Boolean).join(' '),
        )
      ),
      ...searchData.subjects.map(subject =>
        createResult(
          `subject-${subject.id}`,
          'Subject',
          subject.name,
          [subject.code, subject.subject_area, subject.grade_level].filter(Boolean).join(' | '),
          `/subjects/${subject.id}`,
          [subject.description, subject.academic_year].filter(Boolean).join(' '),
        )
      ),
      ...searchData.documents.map(doc =>
        createResult(
          `document-${doc.id}`,
          'Document',
          doc.title || doc.filename || doc.original_filename,
          [doc.subject_name, doc.file_type, doc.processing_status].filter(Boolean).join(' | '),
          `/documents/${doc.id}`,
          [doc.original_filename, doc.filename].filter(Boolean).join(' '),
        )
      ),
      ...searchData.papers.map(paper =>
        createResult(
          `paper-${paper.id}`,
          'Paper',
          paper.title,
          [paper.subject_name, paper.is_published ? 'Published' : 'Draft'].filter(Boolean).join(' | '),
          `/papers/${paper.id}`,
          [paper.description, paper.difficulty_level, `${paper.questions?.length ?? 0} questions`].filter(Boolean).join(' '),
        )
      ),
      ...searchData.assignments.map(assignment =>
        createResult(
          `assignment-${assignment.id}`,
          'Assignment',
          assignment.title,
          [assignment.class_name, assignment.subject_name, assignment.status].filter(Boolean).join(' | '),
          `/assignments/${assignment.id}`,
          [assignment.description, assignment.instructions, `${assignment.total_marks} marks`].filter(Boolean).join(' '),
        )
      ),
      ...searchData.submissions.map(submission =>
        createResult(
          `grading-${submission.id}`,
          'Grading',
          submission.student_name || 'Unknown student',
          [submission.paper_title, submission.status, `${Math.round(submission.grade_percentage ?? 0)}%`].filter(Boolean).join(' | '),
          `/grading/${submission.id}`,
          [submission.feedback, submission.grade].filter(Boolean).join(' '),
        )
      ),
    ]
  }, [searchData])

  const searchResults = useMemo(() => {
    const allResults = [...PAGE_RESULTS, ...entityResults]
    if (!searchTerm) return PAGE_RESULTS.slice(0, 6)

    const terms = searchTerm.split(' ').filter(Boolean)
    return allResults
      .map(result => ({ result, score: scoreResult(result, terms) }))
      .filter(item => Number.isFinite(item.score))
      .sort((a, b) => a.score - b.score || a.result.title.localeCompare(b.result.title))
      .slice(0, 10)
      .map(item => item.result)
  }, [entityResults, searchTerm])

  const runSearchResult = (result: SearchResult) => {
    setSearch('')
    setIsSearchOpen(false)
    navigate(result.to)
  }

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && searchResults[0]) {
      event.preventDefault()
      runSearchResult(searchResults[0])
    }
    if (event.key === 'Escape') {
      setIsSearchOpen(false)
      setSearch('')
    }
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out')
    navigate('/login')
  }

  return (
    <header
      className="flex items-center justify-between h-14 px-4 lg:px-6 shrink-0 z-20"
      style={{ background: 'white', borderBottom: '1px solid #e2e8f0' }}
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[13px]">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.to} className="flex items-center gap-1.5">
            {i > 0 && <span style={{ color: '#cbd5e1' }}>/</span>}
            {crumb.isLast ? (
              <span className="font-semibold" style={{ color: '#0f172a' }}>{crumb.label}</span>
            ) : (
              <Link to={crumb.to} className="transition-colors hover:underline" style={{ color: '#64748b' }}>
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div ref={searchRef} className="hidden md:block relative">
          <div
            className={cn(
              'flex items-center gap-2 rounded-xl px-3 py-1.5 w-56 lg:w-72 transition-all',
              isSearchOpen && 'ring-2 ring-brand-500/20 border-brand-300',
            )}
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
          >
            <Search className="w-3.5 h-3.5 shrink-0" style={{ color: '#94a3b8' }} />
            <input
              type="text"
              value={search}
              onFocus={() => setIsSearchOpen(true)}
              onChange={event => {
                setSearch(event.target.value)
                setIsSearchOpen(true)
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search..."
              className="bg-transparent text-[13px] outline-none flex-1 min-w-0"
              style={{ color: '#0f172a' }}
            />
            {isFetching && isSearchOpen ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400 shrink-0" />
            ) : search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-brand-400 hover:text-brand-600 transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>

          {isSearchOpen && (
            <div className="absolute right-0 mt-2 w-[28rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-brand-100 bg-white shadow-xl z-50 overflow-hidden">
              <div className="px-3 py-2 border-b border-brand-50 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wide text-brand-400">
                  {searchTerm ? 'Search Results' : 'Quick Links'}
                </span>
                <span className="text-[11px] text-brand-300">Enter to open</span>
              </div>

              <div className="max-h-80 overflow-y-auto py-1">
                {searchResults.length > 0 ? (
                  searchResults.map(result => (
                    <button
                      key={result.id}
                      type="button"
                      onMouseDown={event => event.preventDefault()}
                      onClick={() => runSearchResult(result)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-brand-50 transition-colors group"
                    >
                      <span className="w-16 shrink-0 text-[10px] font-bold uppercase tracking-wide text-brand-500 bg-brand-50 border border-brand-100 rounded-full px-2 py-1 text-center group-hover:bg-white">
                        {result.type}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-[#0f172a] truncate">{result.title}</span>
                        <span className="block text-xs text-brand-500 truncate">{result.subtitle || result.to}</span>
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-brand-300 group-hover:text-brand-600 shrink-0" />
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm font-semibold text-[#0f172a]">
                      {isFetching ? 'Searching...' : 'No results found'}
                    </p>
                    <p className="text-xs text-brand-400 mt-1">Try a subject, class, paper, assignment, or student name.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notifications dropdown */}
        <NotificationDropdown />

        {/* User avatar */}
        {user && (
          <div className="flex items-center gap-2 pl-2" style={{ borderLeft: '1px solid #e2e8f0' }}>
            <div
              className="w-8 h-8 rounded-full text-white text-[11px] font-bold flex items-center justify-center cursor-pointer"
              style={{ background: '#0A66C2' }}
            >
              {getInitials(user.name)}
            </div>
            <div className="hidden lg:block">
              <p className="text-[12px] font-semibold leading-tight" style={{ color: '#0f172a' }}>{user.name}</p>
              <p className="text-[10px] capitalize" style={{ color: '#94a3b8' }}>{user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg transition-colors hover:bg-[#f8fafc]"
              style={{ color: '#94a3b8' }}
              title="Log out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
