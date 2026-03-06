import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Bot, Send } from 'lucide-react'
import LoadingSpinner from '@/components/feedback/LoadingSpinner'
import { getMySubjects, studentRAGQuery } from '@/lib/api/student-portal'

interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
}

export default function StudentAskAIPage() {
  const [subjectId, setSubjectId] = useState('')
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Message[]>([])

  const { data: subjects } = useQuery({
    queryKey: ['student-subjects'],
    queryFn: getMySubjects,
  })

  const askMutation = useMutation({
    mutationFn: () => studentRAGQuery(question, subjectId),
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, role: 'ai', content: data.answer || 'No answer generated.' },
      ])
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, role: 'ai', content: 'Sorry, I could not answer that. Please try again.' },
      ])
    },
  })

  const handleSend = () => {
    if (!question.trim() || !subjectId) return
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', content: question },
    ])
    askMutation.mutate()
    setQuestion('')
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-[calc(100vh-130px)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Ask AI</h1>
        <p className="text-slate-500 text-sm mt-1">Ask questions about your course materials.</p>
      </div>

      {/* Subject selector */}
      <div className="mb-4">
        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="w-full sm:w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">Select a subject...</option>
          {(subjects || []).map((s: { id: string; name: string }) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-slate-100 p-4 space-y-4 mb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-300">
            <Bot className="w-16 h-16 mb-3" />
            <p className="text-sm">Ask a question to get started</p>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-sky-500 text-white'
                : 'bg-slate-100 text-slate-800'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {askMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-xl px-4 py-3">
              <LoadingSpinner size="sm" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={subjectId ? 'Type your question...' : 'Select a subject first'}
          disabled={!subjectId}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!question.trim() || !subjectId || askMutation.isPending}
          className="px-4 py-2.5 rounded-lg bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-60 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}
