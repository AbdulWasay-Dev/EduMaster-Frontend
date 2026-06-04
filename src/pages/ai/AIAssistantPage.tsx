import { useState, useRef, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Send,
  Plus,
  Bot,
  BookOpen,
  ChevronDown,
  CheckCircle2,
  FileText,
  MessageCircle,
  Sparkles,
  X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useChatStore, type ChatMode } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import AIThinking from '@/components/feedback/AIThinking'
import { queryRAG } from '@/lib/api/rag'
import { listSubjects } from '@/lib/api/subjects'
import { listDocuments } from '@/lib/api/documents'
import { getDocumentDisplayName, getRAGSourceDisplayName } from '@/lib/displayNames'
import { getInitials } from '@/lib/utils'
import type { Document, RAGSource } from '@/types'

function isReadyDocument(doc: Document) {
  return doc.processing_status === 'completed' || doc.processing_status === 'ready'
}

function sourceLocation(source: RAGSource) {
  if (source.page_number) return `Page ${source.page_number}`
  if (typeof source.chunk_index === 'number') return `Chunk ${source.chunk_index + 1}`
  return 'Retrieved passage'
}

function sourceConfidence(source: RAGSource) {
  if (!Number.isFinite(source.relevance_score) || source.relevance_score <= 0) return null
  return `${Math.max(0, Math.min(100, Math.round(source.relevance_score * 100)))}% match`
}

export default function AIAssistantPage() {
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [setupOpen, setSetupOpen] = useState(false)
  const [chatMode, setChatMode] = useState<ChatMode>('documents')
  const [modalSubjectId, setModalSubjectId] = useState('')
  const [modalDocumentIds, setModalDocumentIds] = useState<string[]>([])
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({})
  const bottomRef = useRef<HTMLDivElement>(null)
  const user = useAuthStore(s => s.user)

  const { sessions, activeSessionId, createSession, addMessage, addAIResponse, setActiveSession } = useChatStore()
  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: () => listSubjects() })
  const { data: documents = [] } = useQuery({ queryKey: ['documents'], queryFn: () => listDocuments() })

  const activeSession = sessions.find(s => s.id === activeSessionId)

  const readyDocuments = useMemo(
    () => documents.filter(isReadyDocument),
    [documents],
  )

  const subjectNameMap = useMemo(
    () => new Map(subjects.map(subject => [subject.id, subject.name])),
    [subjects],
  )

  const documentNameMap = useMemo(
    () => new Map(documents.map(doc => [doc.id, getDocumentDisplayName(doc)])),
    [documents],
  )

  const modalDocuments = useMemo(
    () => readyDocuments.filter(doc => doc.subject_id === modalSubjectId),
    [readyDocuments, modalSubjectId],
  )

  const activeMode = activeSession?.mode ?? (activeSession?.subjectId ? 'documents' : 'general')
  const activeSubjectName = activeSession?.subjectId
    ? subjectNameMap.get(activeSession.subjectId) ?? 'Selected subject'
    : ''
  const activeDocumentCount = activeSession?.documentIds?.length ?? 0

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeSession?.messages, isThinking])

  const readyDocsForSubject = (subjectId: string) =>
    readyDocuments.filter(doc => doc.subject_id === subjectId)

  const openNewChatSetup = () => {
    const firstSubjectId = subjects[0]?.id ?? ''
    const firstSubjectDocs = firstSubjectId ? readyDocsForSubject(firstSubjectId) : []
    setChatMode(firstSubjectId && firstSubjectDocs.length > 0 ? 'documents' : 'general')
    setModalSubjectId(firstSubjectId)
    setModalDocumentIds(firstSubjectDocs.map(doc => doc.id))
    setSetupOpen(true)
  }

  const handleSubjectChange = (subjectId: string) => {
    const docsForSubject = readyDocsForSubject(subjectId)
    setModalSubjectId(subjectId)
    setModalDocumentIds(docsForSubject.map(doc => doc.id))
  }

  const toggleModalDocument = (documentId: string) => {
    setModalDocumentIds(current =>
      current.includes(documentId)
        ? current.filter(id => id !== documentId)
        : [...current, documentId],
    )
  }

  const startConfiguredChat = () => {
    if (chatMode === 'general') {
      createSession({ mode: 'general', title: 'General Chat', documentIds: [] })
      setSetupOpen(false)
      return
    }

    if (!modalSubjectId || modalDocumentIds.length === 0) return

    const subjectName = subjectNameMap.get(modalSubjectId) ?? 'Document Chat'
    createSession({
      mode: 'documents',
      subjectId: modalSubjectId,
      documentIds: modalDocumentIds,
      title: `${subjectName} Chat`,
    })
    setSetupOpen(false)
  }

  const toggleSources = (messageId: string) => {
    setExpandedSources(current => ({ ...current, [messageId]: !current[messageId] }))
  }

  const handleSend = async () => {
    if (!input.trim() || isThinking) return
    const text = input.trim()
    setInput('')

    let sessionId = activeSessionId
    const sessionForRequest = activeSession

    if (!sessionId) {
      sessionId = createSession({ mode: 'general', title: 'General Chat', documentIds: [] })
    }

    addMessage(sessionId, { id: `msg-${Date.now()}`, role: 'user', content: text, timestamp: new Date().toISOString() })
    setIsThinking(true)

    const requestMode = sessionForRequest?.mode ?? (sessionForRequest?.subjectId ? 'documents' : 'general')
    const useDocuments = requestMode === 'documents' && Boolean(sessionForRequest?.subjectId)

    try {
      const res = await queryRAG({
        query: text,
        subject_id: useDocuments ? sessionForRequest?.subjectId : undefined,
        document_ids: useDocuments ? sessionForRequest?.documentIds ?? [] : undefined,
        use_documents: useDocuments,
        include_sources: useDocuments,
        top_k: 6,
      })
      addAIResponse(sessionId, { id: `msg-${Date.now() + 1}`, role: 'assistant', content: res.answer, sources: res.sources, timestamp: new Date().toISOString() })
    } catch {
      addAIResponse(sessionId, { id: `msg-${Date.now() + 1}`, role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', timestamp: new Date().toISOString() })
    } finally {
      setIsThinking(false)
    }
  }

  const canStartDocumentChat = chatMode === 'documents' && Boolean(modalSubjectId) && modalDocumentIds.length > 0
  const canStartChat = chatMode === 'general' || canStartDocumentChat

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <div className="w-64 shrink-0 hidden lg:flex flex-col gap-2">
        <button
          onClick={openNewChatSetup}
          className="btn-primary w-full flex items-center gap-2 justify-center text-sm"
        >
          <Plus className="w-4 h-4" /> New Chat
        </button>

        <div className="flex-1 overflow-y-auto space-y-1.5 mt-1">
          {sessions.length === 0 && (
            <p className="text-xs text-brand-400 text-center mt-8">No chats yet. Start a new conversation.</p>
          )}
          {sessions.map(session => {
            const mode = session.mode ?? (session.subjectId ? 'documents' : 'general')
            const subjectName = session.subjectId ? subjectNameMap.get(session.subjectId) ?? 'Selected subject' : ''
            const docCount = session.documentIds?.length ?? 0
            return (
              <button
                key={session.id}
                onClick={() => setActiveSession(session.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  session.id === activeSessionId
                    ? 'bg-brand-500 text-white'
                    : 'hover:bg-brand-50 text-brand-700'
                }`}
              >
                <div className="font-medium truncate">
                  {session.messages[0]?.content?.slice(0, 28) ?? session.title}
                  {(session.messages[0]?.content?.length ?? 0) > 28 ? '...' : ''}
                </div>
                <div className={`text-xs mt-0.5 ${session.id === activeSessionId ? 'text-white/75' : 'text-brand-400'}`}>
                  {mode === 'general' ? 'General chat' : `${subjectName} - ${docCount} doc${docCount !== 1 ? 's' : ''}`}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col card overflow-hidden">
        <div className="px-5 py-4 border-b border-brand-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-[#0f172a] text-sm">EduMaster AI</h3>
            <p className="text-xs text-brand-500 truncate">
              {activeMode === 'general'
                ? 'General teacher assistant'
                : activeSubjectName
                  ? `${activeSubjectName} - ${activeDocumentCount} selected document${activeDocumentCount !== 1 ? 's' : ''}`
                  : 'Document-backed assistant'}
            </p>
          </div>
          <button onClick={openNewChatSetup} className="ml-auto btn-ghost text-xs flex items-center gap-1 lg:hidden">
            <Plus className="w-3.5 h-3.5" /> New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {!activeSession || activeSession.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center">
                <Bot className="w-8 h-8 text-brand-500" />
              </div>
              <div>
                <h3 className="font-bold text-[#0f172a]">Start an AI conversation</h3>
                <p className="text-sm text-brand-500 mt-1 max-w-xs">
                  Use New Chat for document-backed answers or a normal AI conversation.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {[
                  'Explain photosynthesis in simple terms',
                  'What are the key topics from Chapter 3?',
                  'Create a summary of the main concepts',
                  'What questions might appear on the exam?',
                ].map(q => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="text-left p-3 rounded-xl border border-brand-100 hover:border-brand-300 bg-brand-50/50 hover:bg-brand-50 text-sm text-brand-700 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {activeSession.messages.map(msg => {
                const sourcesOpen = expandedSources[msg.id]
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                      msg.role === 'user'
                        ? 'bg-brand-500 text-white'
                        : 'bg-gradient-to-br from-brand-100 to-brand-200 text-brand-700'
                    }`}>
                      {msg.role === 'user' ? getInitials(user?.name ?? 'U') : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`max-w-[88%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-brand-500 text-white rounded-tr-sm'
                        : 'bg-brand-50 text-[#0f172a] rounded-tl-sm'
                    }`}>
                      {msg.role === 'assistant' ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-sm max-w-none">
                          {msg.content}
                        </ReactMarkdown>
                      ) : (
                        msg.content
                      )}

                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-brand-200">
                          <button
                            type="button"
                            onClick={() => toggleSources(msg.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:border-brand-300 hover:bg-brand-50 transition-colors"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            Sources
                            <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] text-brand-700">
                              {msg.sources.length}
                            </span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sourcesOpen ? 'rotate-180' : ''}`} />
                          </button>

                          <AnimatePresence initial={false}>
                            {sourcesOpen && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-2 space-y-2">
                                  {msg.sources.map((source, sourceIndex) => {
                                    const sourceName = getRAGSourceDisplayName(
                                      source,
                                      source.document_id ? documentNameMap.get(source.document_id) ?? 'Document source' : 'Document source',
                                    )
                                    const confidence = sourceConfidence(source)
                                    return (
                                      <div key={`${msg.id}-source-${sourceIndex}`} className="rounded-xl border border-brand-100 bg-white p-3">
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="min-w-0">
                                            <p className="font-semibold text-xs text-[#0f172a] truncate">{sourceName}</p>
                                            <p className="text-[11px] text-brand-500">
                                              {[sourceLocation(source), confidence].filter(Boolean).join(' - ')}
                                            </p>
                                          </div>
                                          <FileText className="w-4 h-4 text-brand-300 shrink-0" />
                                        </div>
                                        <p className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap rounded-lg bg-brand-50 px-3 py-2 text-xs leading-relaxed text-brand-700">
                                          {source.chunk_text || 'No chunk text available for this source.'}
                                        </p>
                                      </div>
                                    )
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
              {isThinking && (
                <motion.div key="thinking" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-brand-700" />
                  </div>
                  <div className="bg-brand-50 rounded-2xl rounded-tl-sm px-4 py-3">
                    <AIThinking />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="px-4 py-3 border-t border-brand-100">
          <div className="flex items-end gap-2 bg-brand-50 rounded-xl p-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder={activeMode === 'general' ? 'Ask EduMaster AI...' : 'Ask about the selected documents...'}
              rows={2}
              className="flex-1 bg-transparent resize-none text-sm text-[#0f172a] placeholder:text-brand-400 outline-none px-2 py-1"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isThinking}
              className="p-2.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
              title="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-brand-400 mt-1 px-2">Shift+Enter for new line, Enter to send</p>
        </div>
      </div>

      <AnimatePresence>
        {setupOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col"
            >
              <div className="px-5 py-4 border-b border-brand-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#0f172a]">New Chat</h2>
                  <p className="text-xs text-brand-500">Select a source scope</p>
                </div>
                <button
                  onClick={() => setSetupOpen(false)}
                  className="ml-auto p-2 rounded-lg hover:bg-brand-50 text-brand-500 transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setChatMode('documents')}
                    className={`text-left rounded-xl border p-4 transition-colors ${
                      chatMode === 'documents'
                        ? 'border-brand-500 bg-brand-50 text-brand-800'
                        : 'border-brand-100 hover:border-brand-300 text-brand-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      <BookOpen className="w-4 h-4" />
                      Document chat
                      {chatMode === 'documents' && <CheckCircle2 className="w-4 h-4 ml-auto text-brand-500" />}
                    </div>
                    <p className="text-xs text-brand-500 mt-1">Subject + documents</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChatMode('general')}
                    className={`text-left rounded-xl border p-4 transition-colors ${
                      chatMode === 'general'
                        ? 'border-brand-500 bg-brand-50 text-brand-800'
                        : 'border-brand-100 hover:border-brand-300 text-brand-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      <MessageCircle className="w-4 h-4" />
                      General chat
                      {chatMode === 'general' && <CheckCircle2 className="w-4 h-4 ml-auto text-brand-500" />}
                    </div>
                    <p className="text-xs text-brand-500 mt-1">No documents</p>
                  </button>
                </div>

                {chatMode === 'documents' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-brand-500">Subject</label>
                      <select
                        value={modalSubjectId}
                        onChange={e => handleSubjectChange(e.target.value)}
                        className="input text-sm mt-1 w-full"
                      >
                        <option value="">Select subject</option>
                        {subjects.map(subject => (
                          <option key={subject.id} value={subject.id}>{subject.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-brand-500">Documents</label>
                        {modalDocuments.length > 0 && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setModalDocumentIds(modalDocuments.map(doc => doc.id))}
                              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                            >
                              Select all
                            </button>
                            <button
                              type="button"
                              onClick={() => setModalDocumentIds([])}
                              className="text-xs font-semibold text-brand-400 hover:text-brand-600"
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </div>

                      {modalSubjectId && modalDocuments.length > 0 ? (
                        <div className="max-h-64 overflow-y-auto rounded-xl border border-brand-100 divide-y divide-brand-50">
                          {modalDocuments.map(doc => {
                            const checked = modalDocumentIds.includes(doc.id)
                            return (
                              <button
                                key={doc.id}
                                type="button"
                                onClick={() => toggleModalDocument(doc.id)}
                                className={`w-full flex items-start gap-3 p-3 text-left transition-colors ${
                                  checked ? 'bg-brand-50' : 'hover:bg-brand-50/70'
                                }`}
                              >
                                <span className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                                  checked ? 'border-brand-500 bg-brand-500 text-white' : 'border-brand-200 bg-white'
                                }`}>
                                  {checked && <CheckCircle2 className="w-3.5 h-3.5" />}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm font-semibold text-[#0f172a] truncate">
                                    {getDocumentDisplayName(doc)}
                                  </span>
                                  <span className="mt-0.5 flex items-center gap-2 text-xs text-brand-500">
                                    <FileText className="w-3.5 h-3.5" />
                                    {doc.chunk_count ? `${doc.chunk_count} chunks` : 'Ready'}
                                  </span>
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-brand-200 bg-brand-50/70 px-4 py-6 text-center">
                          <Sparkles className="w-6 h-6 text-brand-300 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-[#0f172a]">No ready documents for this subject</p>
                          <p className="text-xs text-brand-500 mt-1">Use General chat or upload a processed document.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-brand-100 bg-brand-50 p-4 flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-brand-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#0f172a]">General teacher assistant</p>
                      <p className="text-xs text-brand-500 mt-1">This chat will not search uploaded documents.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-5 py-4 border-t border-brand-100 flex items-center justify-end gap-2">
                <button onClick={() => setSetupOpen(false)} className="btn-ghost text-sm">
                  Cancel
                </button>
                <button
                  onClick={startConfiguredChat}
                  disabled={!canStartChat}
                  className="btn-primary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Start Chat
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
