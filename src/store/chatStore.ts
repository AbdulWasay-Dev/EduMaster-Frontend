import { create } from 'zustand'
import type { ChatMessage } from '@/types'

interface ChatSession {
  id: string
  title: string
  subjectId?: string
  messages: ChatMessage[]
  createdAt: string
}

interface ChatState {
  sessions: ChatSession[]
  activeSessionId: string | null
  createSession: (subjectId?: string) => string
  addMessage: (sessionId: string, message: ChatMessage) => void
  addAIResponse: (sessionId: string, message: ChatMessage) => void
  setActiveSession: (id: string) => void
  clearSessions: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  sessions: [],
  activeSessionId: null,

  createSession: (subjectId) => {
    const id = `session-${Date.now()}`
    const session: ChatSession = {
      id,
      title: 'New Chat',
      subjectId,
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
