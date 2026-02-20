'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Bot, ArrowUp, Plus, History, ChevronLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useUser } from '@/lib/stores'
import { useChatbot, useChatbotSessions, type LocalChatMessage } from '@/lib/hooks/use-chatbot'
import type { ChatSession } from '@/lib/api/chatbot'

// ---------------------------------------------------------------------------
// Floating Chat Widget — renders a bubble + slide-out chatbox
// ---------------------------------------------------------------------------

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const t = useTranslations('parent')

  return (
    <>
      {/* Floating Bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 transition-all duration-300"
          aria-label={t('chatbot.title')}
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[420px] h-[100dvh] sm:h-[600px] sm:max-h-[80vh] bg-card rounded-none sm:rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <ChatPanel onClose={() => setIsOpen(false)} />
        </div>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Chat Panel — the actual chat UI (used in both widget and full page)
// ---------------------------------------------------------------------------

interface ChatPanelProps {
  onClose?: () => void
  fullPage?: boolean
}

export function ChatPanel({ onClose, fullPage = false }: ChatPanelProps) {
  const t = useTranslations('parent')
  const user = useUser()
  const chat = useChatbot()
  const { data: sessions = [] } = useChatbotSessions()

  const [input, setInput] = useState('')
  const [view, setView] = useState<'chat' | 'sessions'>('chat')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat.messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [input])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text || chat.isLoading) return
    chat.sendMessage(text)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [input, chat])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const handleSelectSession = useCallback(
    (session: ChatSession) => {
      chat.loadSession(session.id)
      setView('chat')
    },
    [chat]
  )

  const handleNewChat = useCallback(() => {
    chat.newChat()
    setView('chat')
  }, [chat])

  const suggestedPrompts = [
    t('chatbot.attendanceQuestion'),
    t('chatbot.gradesQuestion'),
    t('chatbot.feedbackQuestion'),
  ]

  // Initials for avatar
  const initials = user
    ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase()
    : 'P'

  return (
    <>
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          {view === 'sessions' ? (
            <button
              onClick={() => setView('chat')}
              className="p-1.5 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            </button>
          ) : (
            <div className="p-2 bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 rounded-lg">
              <Bot className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
          )}
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {view === 'sessions' ? t('chatbot.history') : t('chatbot.title')}
            </h2>
            <p className="text-xs text-muted-foreground">
              {view === 'sessions'
                ? t('chatbot.previousConversations')
                : t('chatbot.brandSubtitle')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {view === 'chat' && (
            <>
              <button
                onClick={handleNewChat}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title={t('chatbot.newChat')}
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => setView('sessions')}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title={t('chatbot.history')}
              >
                <History className="h-4 w-4 text-muted-foreground" />
              </button>
            </>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {view === 'sessions' ? (
        <SessionList
          sessions={sessions}
          onSelect={handleSelectSession}
          onNewChat={handleNewChat}
          t={t}
        />
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            {chat.messages.length === 0 ? (
              <EmptyState
                prompts={suggestedPrompts}
                onPrompt={(p) => chat.sendMessage(p)}
                t={t}
              />
            ) : (
              <div className={`w-full px-4 py-4 space-y-4 ${fullPage ? 'max-w-3xl mx-auto' : ''}`}>
                {chat.messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    initials={initials}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border p-3 bg-card shrink-0">
            <div className="relative bg-muted/50 border border-border rounded-2xl focus-within:border-violet-500/50 focus-within:ring-1 focus-within:ring-violet-500/20 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('chatbot.placeholder')}
                rows={1}
                className="w-full px-4 py-3 pr-12 bg-transparent border-none outline-none resize-none max-h-32 text-sm text-foreground placeholder:text-muted-foreground"
                style={{ minHeight: '44px' }}
                disabled={chat.isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || chat.isLoading}
                className={`absolute right-2 bottom-2 p-1.5 rounded-lg transition-all ${
                  input.trim() && !chat.isLoading
                    ? 'bg-violet-600 hover:bg-violet-700 text-white'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              {t('chatbot.disclaimer')}
            </p>
          </div>
        </>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({
  prompts,
  onPrompt,
  t,
}: {
  prompts: string[]
  onPrompt: (text: string) => void
  t: ReturnType<typeof useTranslations>
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center mb-3">
            <Bot className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">{t('chatbot.title')}</h3>
          <p className="text-sm text-muted-foreground mt-1">{t('chatbot.subtitle')}</p>
        </div>

        <div className="space-y-2">
          {prompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => onPrompt(prompt)}
              className="w-full p-3 text-left text-sm border border-border rounded-xl hover:bg-muted/50 hover:border-violet-500/30 transition-all"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Message Bubble
// ---------------------------------------------------------------------------

function MessageBubble({
  message,
  initials,
}: {
  message: LocalChatMessage
  initials: string
}) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center">
          <Bot className="h-4 w-4 text-violet-600 dark:text-violet-400" />
        </div>
      )}

      <div className={`max-w-[85%] ${isUser ? 'order-1' : ''}`}>
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-violet-600 text-white'
              : message.isError
              ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
              : 'bg-muted text-foreground'
          }`}
        >
          {message.isLoading ? (
            <div className="flex items-center gap-1 py-1">
              <div className="h-1.5 w-1.5 bg-muted-foreground/60 rounded-full animate-bounce" />
              <div
                className="h-1.5 w-1.5 bg-muted-foreground/60 rounded-full animate-bounce"
                style={{ animationDelay: '0.15s' }}
              />
              <div
                className="h-1.5 w-1.5 bg-muted-foreground/60 rounded-full animate-bounce"
                style={{ animationDelay: '0.3s' }}
              />
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-[10px] font-semibold">
          {initials}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Session List
// ---------------------------------------------------------------------------

function SessionList({
  sessions,
  onSelect,
  onNewChat,
  t,
}: {
  sessions: ChatSession[]
  onSelect: (session: ChatSession) => void
  onNewChat: () => void
  t: ReturnType<typeof useTranslations>
}) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60_000)
    const diffHours = Math.floor(diffMs / 3_600_000)
    const diffDays = Math.floor(diffMs / 86_400_000)

    if (diffMins < 1) return t('chatbot.justNow')
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return d.toLocaleDateString()
  }

  const intentIcon = (intent?: string) => {
    switch (intent) {
      case 'ATTENDANCE':
        return '📋'
      case 'GRADES':
        return '📊'
      case 'FINANCIAL':
        return '💰'
      case 'SCHEDULE':
        return '📅'
      case 'GENERAL':
        return '💬'
      case 'MULTI':
        return '🔄'
      default:
        return '💭'
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* New Chat button */}
      <button
        onClick={onNewChat}
        className="w-full flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-muted/50 transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
          <Plus className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-medium text-foreground">{t('chatbot.newChat')}</span>
      </button>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <History className="h-8 w-8 mb-2 opacity-50" />
          <p className="text-sm">{t('chatbot.noSessions')}</p>
        </div>
      ) : (
        sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => onSelect(session)}
            className="w-full flex items-start gap-3 px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors text-left"
          >
            <span className="text-lg mt-0.5">{intentIcon(session.lastIntent || undefined)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {session.title || t('chatbot.untitledChat')}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {session.lastMessageAt
                  ? formatDate(session.lastMessageAt)
                  : formatDate(session.createdAt)}
                {session.lastIntent && (
                  <span className="ml-2 text-muted-foreground/70">
                    {session.lastIntent.toLowerCase()}
                  </span>
                )}
              </p>
            </div>
            {session.isActive && (
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2 shrink-0" />
            )}
          </button>
        ))
      )}
    </div>
  )
}
