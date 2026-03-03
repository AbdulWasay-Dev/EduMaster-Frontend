import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, CheckCheck, Trash2, FileText, ScrollText, CheckSquare, Bot, Users } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import { formatDate } from '@/lib/utils'

type NotifType = 'document' | 'paper' | 'grading' | 'ai' | 'system'

interface Notif {
  id: string
  type: NotifType
  title: string
  body: string
  read: boolean
  created_at: string
}

const ICON_MAP: Record<NotifType, React.ElementType> = {
  document: FileText, paper: ScrollText, grading: CheckSquare, ai: Bot, system: Users,
}
const COLOR_MAP: Record<NotifType, string> = {
  document: 'bg-amber-100 text-amber-600',
  paper:    'bg-brand-100 text-brand-600',
  grading:  'bg-emerald-100 text-emerald-600',
  ai:       'bg-violet-100 text-violet-600',
  system:   'bg-cyan-100 text-cyan-600',
}

const SAMPLE: Notif[] = [
  { id:'1', type:'grading',  title:'Grading complete',          body:'10 answer sheets for Class 9A have been graded. Avg score: 78%.',       read:false, created_at: new Date(Date.now()-5*60*1000).toISOString() },
  { id:'2', type:'paper',    title:'Paper published',           body:'Chapter 5 Quiz has been published and is ready to distribute.',          read:false, created_at: new Date(Date.now()-2*60*60*1000).toISOString() },
  { id:'3', type:'document', title:'Document processed',        body:'"Biology Unit 3.pdf" has finished processing and is ready for RAG.',    read:false, created_at: new Date(Date.now()-5*60*60*1000).toISOString() },
  { id:'4', type:'ai',       title:'AI query answered',         body:'Your question about photosynthesis was answered using 3 sources.',       read:true,  created_at: new Date(Date.now()-24*60*60*1000).toISOString() },
  { id:'5', type:'system',   title:'New student enrolled',      body:'Alice Johnson has been added to Class 9A.',                              read:true,  created_at: new Date(Date.now()-2*24*60*60*1000).toISOString() },
  { id:'6', type:'grading',  title:'Grading complete',          body:'5 answer sheets for Class 10B have been graded. Avg score: 83%.',        read:true,  created_at: new Date(Date.now()-3*24*60*60*1000).toISOString() },
]

const TABS = ['All', 'Unread', 'Documents', 'Papers', 'Grading'] as const
type Tab = typeof TABS[number]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notif[]>(SAMPLE)
  const [activeTab, setActiveTab] = useState<Tab>('All')

  const filtered = notifications.filter(n => {
    if (activeTab === 'All') return true
    if (activeTab === 'Unread') return !n.read
    if (activeTab === 'Documents') return n.type === 'document'
    if (activeTab === 'Papers') return n.type === 'paper'
    if (activeTab === 'Grading') return n.type === 'grading'
    return true
  })

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  const markRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  const remove = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
        action={
          unreadCount > 0 ? (
            <button onClick={markAllRead} className="btn-ghost flex items-center gap-2 text-sm">
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-brand-50 p-1 rounded-xl w-fit flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-white text-brand-900 shadow-sm' : 'text-brand-600 hover:text-brand-900'
            }`}
          >
            {tab}
            {tab === 'Unread' && unreadCount > 0 && (
              <span className="ml-1.5 bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="card p-12 flex flex-col items-center gap-3 text-center">
            <Bell className="w-10 h-10 text-brand-300" />
            <p className="text-brand-500 font-medium">No notifications here</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filtered.map(notif => {
              const Icon = ICON_MAP[notif.type]
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0 } as any}
                  transition={{ duration: 0.2 }}
                  onClick={() => markRead(notif.id)}
                  className={`card p-4 flex items-start gap-4 cursor-pointer group transition-all ${!notif.read ? 'border-l-4 border-l-brand-500' : ''}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${COLOR_MAP[notif.type]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold ${notif.read ? 'text-brand-700' : 'text-[#1C0A00]'}`}>
                        {notif.title}
                        {!notif.read && <span className="ml-2 w-2 h-2 bg-brand-500 rounded-full inline-block align-middle" />}
                      </p>
                      <span className="text-[10px] text-brand-400 whitespace-nowrap shrink-0">{formatDate(notif.created_at)}</span>
                    </div>
                    <p className="text-xs text-brand-600 mt-0.5">{notif.body}</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); remove(notif.id) }}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-400 hover:text-red-600 transition-all shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
