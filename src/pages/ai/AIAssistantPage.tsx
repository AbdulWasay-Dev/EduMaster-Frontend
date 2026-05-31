import { useState, useRef, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Send, Plus, Bot, User, BookOpen, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import AIThinking from '@/components/feedback/AIThinking'
import { queryRAG } from '@/lib/api/rag'
import { listSubjects } from '@/lib/api/subjects'
import { listDocuments } from '@/lib/api/documents'
import { getDocumentDisplayName, getRAGSourceDisplayName } from '@/lib/displayNames'
import { getInitials, formatDate } from '@/lib/utils'

export default function AIAssistantPage() {
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const user = useAuthStore(s => s.user)

  const { sessions, activeSessionId, createSession, addMessage, addAIResponse, setActiveSession } = useChatStore()
  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: () => listSubjects() })
  const { data: documents = [] } = useQuery({ queryKey: ['documents'], queryFn: () => listDocuments() })

  const activeSession = sessions.find(s => s.id === activeSessionId)
  const documentNameMap = useMemo(
    () => new Map(documents.map(doc => [doc.id, getDocumentDisplayName(doc)])),
    [documents],
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeSession?.messages, isThinking])

  const handleSend = async () => {
    if (!input.trim() || isThinking) return
    const text = input.trim()
    setInput('')

    let sessionId = activeSessionId
    if (!sessionId) {
      sessionId = createSession(selectedSubject || undefined)
    }

    addMessage(sessionId, { id: `msg-${Date.now()}`, role: 'user', content: text, timestamp: new Date().toISOString() })
    setIsThinking(true)

    try {
      const res = await queryRAG({
        query: text,
        subject_id: selectedSubject || undefined,
        top_k: 5,
      })
      addAIResponse(sessionId, { id: `msg-${Date.now()}`, role: 'assistant', content: res.answer, sources: res.sources, timestamp: new Date().toISOString() })
    } catch {
      addAIResponse(sessionId, { id: `msg-${Date.now()}`, role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', timestamp: new Date().toISOString() })
    } finally {
      setIsThinking(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Sessions sidebar */}
      <div className="w-60 shrink-0 hidden lg:flex flex-col gap-2">
        <button
          onClick={() => createSession()}
          className="btn-primary w-full flex items-center gap-2 justify-center text-sm"
        >
          <Plus className="w-4 h-4" /> New Chat
        </button>

        {subjects.length > 0 && (
          <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="input text-sm">
            <option value="">All subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}

        <div className="flex-1 overflow-y-auto space-y-1.5 mt-1">
          {sessions.length === 0 && (
            <p className="text-xs text-brand-400 text-center mt-8">No chats yet. Start a new conversation!</p>
          )}
          {sessions.map(session => (
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
                {session.messages[0]?.content?.slice(0, 28) ?? 'New conversation'}
                {(session.messages[0]?.content?.length ?? 0) > 28 ? '…' : ''}
              </div>
              <div className={`text-xs mt-0.5 ${session.id === activeSessionId ? 'text-white/70' : 'text-brand-400'}`}>
                {session.messages.length} message{session.messages.length !== 1 ? 's' : ''}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col card overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-brand-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-[#0f172a] text-sm">EduMaster AI</h3>
            <p className="text-xs text-brand-500">Powered by your uploaded documents</p>
          </div>
          <button onClick={() => createSession()} className="ml-auto btn-ghost text-xs flex items-center gap-1 lg:hidden">
            <Plus className="w-3.5 h-3.5" /> New
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {!activeSession || activeSession.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center">
                <Bot className="w-8 h-8 text-brand-500" />
              </div>
              <div>
                <h3 className="font-bold text-[#0f172a]">Ask anything about your materials</h3>
                <p className="text-sm text-brand-500 mt-1 max-w-xs">
                  I'll search through your uploaded documents and provide accurate, cited answers.
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
              {activeSession.messages.map((msg, i) => (
                <motion.div
                  key={i}
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
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
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
                      <div className="mt-3 pt-2 border-t border-brand-200 space-y-1">
                        <p className="text-xs font-semibold text-brand-500">Sources:</p>
                        {msg.sources.map((s, si) => {
                          const sourceName = getRAGSourceDisplayName(
                            s,
                            s.document_id ? documentNameMap.get(s.document_id) ?? 'Document source' : 'Document source',
                          )
                          return (
                            <div key={si} className="text-xs text-brand-600 flex items-start gap-1">
                              <BookOpen className="w-3 h-3 mt-0.5 shrink-0 text-brand-400" />
                              <span>{sourceName} {s.page_number ? `(p. ${s.page_number})` : ''}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
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

        {/* Input */}
        <div className="px-4 py-3 border-t border-brand-100">
          <div className="flex items-end gap-2 bg-brand-50 rounded-xl p-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Ask a question about your materials… (Enter to send)"
              rows={2}
              className="flex-1 bg-transparent resize-none text-sm text-[#0f172a] placeholder:text-brand-400 outline-none px-2 py-1"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isThinking}
              className="p-2.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-brand-400 mt-1 px-2">Shift+Enter for new line, Enter to send</p>
        </div>
      </div>
    </div>
  )
}
