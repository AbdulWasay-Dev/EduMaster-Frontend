import { create } from 'zustand'
import type { ChatMessage } from '@/types'

export type ChatMode = 'documents' | 'general'

export interface ChatSession {
  id: string
  title: string
  mode: ChatMode
  subjectId?: string
  documentIds: string[]
  messages: ChatMessage[]
  createdAt: string
}

export interface ChatSessionConfig {
  mode?: ChatMode
  subjectId?: string
  documentIds?: string[]
  title?: string
}

interface ChatState {
  sessions: ChatSession[]
  activeSessionId: string | null
  createSession: (config?: ChatSessionConfig) => string
  addMessage: (sessionId: string, message: ChatMessage) => void
  addAIResponse: (sessionId: string, message: ChatMessage) => void
  setActiveSession: (id: string) => void
  clearSessions: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  sessions: [],
  activeSessionId: null,

  createSession: (config = {}) => {
    const id = `session-${Date.now()}`
    const mode = config.mode ?? (config.subjectId ? 'documents' : 'general')
    const session: ChatSession = {
      id,
      title: config.title ?? (mode === 'general' ? 'General Chat' : 'Document Chat'),
      mode,
      subjectId: config.subjectId,
      documentIds: config.documentIds ?? [],
      messages: [],
      createdAt: new Date().toISOString(),
    }
    set((s) => ({ sessions: [session, ...s.sessions], activeSessionId: id }))
    return id
  },

  addMessage: (sessionId, message) => {
    set((s) => ({
      sessions: s.sessions.map((sess) =>
        sess.id === sessionId
          ? {
              ...sess,
              messages: [...sess.messages, message],
              title: sess.messages.length === 0 && message.role === 'user'
                ? message.content.slice(0, 40)
                : sess.title,
            }
          : sess,
      ),
    }))
  },

  addAIResponse: (sessionId, message) => {
    set((s) => ({
      sessions: s.sessions.map((sess) =>
        sess.id === sessionId
          ? { ...sess, messages: [...sess.messages, message] }
          : sess,
      ),
    }))
  },

  setActiveSession: (id) => set({ activeSessionId: id }),

  clearSessions: () => set({ sessions: [], activeSessionId: null }),
}))
