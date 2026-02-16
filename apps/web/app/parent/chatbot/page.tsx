'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, X, ArrowUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useUser } from '@/lib/stores'
import { useParentChildren, useChildGrades, useChildAttendance } from '@/lib/hooks'
import { useParentId, useCurrentEntity } from '@/lib/hooks/use-current-entity'

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Array<{ id: number; role: 'user' | 'assistant'; content: string }>>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const t = useTranslations('parent')
  const user = useUser()
  
  // Ensure entity is resolved
  useCurrentEntity()
  const parentId = useParentId() || user?.id || ''

  const { data: children = [] } = useParentChildren(parentId)
  // For the chatbot demo, we'll focus on the first child's data
  const firstChild = children[0]
  const { data: grades = [] } = useChildGrades(firstChild?.id || '')
  const { data: attendance } = useChildAttendance(firstChild?.id || '')

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [input])

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || input
    if (!textToSend.trim()) return

    const userMessage = {
      id: messages.length + 1,
      role: 'user' as const,
      content: textToSend,
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    setTimeout(() => {
      const response = generateAIResponse(textToSend)
      const assistantMessage = {
        id: messages.length + 2,
        role: 'assistant' as const,
        content: response,
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsTyping(false)
    }, 1000)
  }

  const generateAIResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase()

    if (lowerQuestion.includes('presença') || lowerQuestion.includes('faltas')) {
      if (!firstChild) return t('chatbot.noChildrenInfo')
      
      const attendanceRate = attendance?.summary?.rate || 0
      const absences = attendance?.records?.filter((r: any) => r.status === 'ABSENT').length || 0
      
      return `**${t('chatbot.attendanceSummaryTitle')}**\n\n${firstChild.firstName} ${firstChild.lastName}:\n• ${t('chatbot.attendanceRateLabel')}: ${attendanceRate}%\n• ${t('chatbot.absencesRecordedLabel')}: ${absences}\n• ${t('chatbot.lastUpdateLabel')}: ${t('chatbot.lastUpdateToday')}`
    }

    if (lowerQuestion.includes('nota') || lowerQuestion.includes('notas') || lowerQuestion.includes('média')) {
      if (!firstChild) return t('chatbot.noChildrenInfo')
      
      const recentGrades = grades.slice(0, 3).map((g: any) => 
        `• ${g.subjectName}: ${g.score}/${g.maxScore}`
      ).join('\n')

      return `**${t('chatbot.academicPerformanceTitle')}**\n\n${firstChild.firstName} ${firstChild.lastName}:\n• ${t('chatbot.overallAverageLabel')}: ${firstChild.average?.toFixed(1) || 'N/A'}\n${recentGrades}\n• ${t('chatbot.positiveProgress')}`
    }

    if (lowerQuestion.includes('professor') || lowerQuestion.includes('feedback')) {
      return `**${t('chatbot.teacherFeedbackTitle')}**\n\n${firstChild?.firstName || t('chatbot.childFallbackName')}:\n${t('chatbot.teacherQuote')}`
    }

    if (lowerQuestion.includes('trabalho') || lowerQuestion.includes('exame') || lowerQuestion.includes('próximo')) {
      return `**${t('chatbot.upcomingEventsTitle')}**\n\n${firstChild?.firstName || t('chatbot.childFallbackName')}:\n• ${t('chatbot.mathExamEvent')}\n• ${t('chatbot.chemistryEvent')}\n• ${t('chatbot.parentsMeetingEvent')}`
    }

    return `${t('chatbot.defaultResponse')}\n\n• ${t('chatbot.helpAttendance')}\n• ${t('chatbot.helpGrades')}\n• ${t('chatbot.helpFeedback')}\n• ${t('chatbot.helpAssignments')}\n• ${t('chatbot.helpBehavior')}\n\n${t('chatbot.helpQuestion')}`
  }

  const suggestedPrompts = [
    t('chatbot.attendanceQuestion'),
    t('chatbot.gradesQuestion'),
    t('chatbot.feedbackQuestion'),
  ]

  return (
    <div className="fixed inset-0 bg-card z-50 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent-100 rounded-lg">
            <Bot className="h-5 w-5 text-accent-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{t('chatbot.title')}</h1>
            <p className="text-xs text-gray-600">{t('chatbot.brandSubtitle')}</p>
          </div>
        </div>
        <button
          onClick={() => window.history.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          // Empty State - Like ChatGPT
          <div className="h-full flex flex-col items-center justify-center px-4 max-w-3xl mx-auto">
            <div className="w-full space-y-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-semibold text-foreground mb-2">
                  {t('chatbot.title')}
                </h2>
                <p className="text-gray-600">
                  {t('chatbot.subtitle')}
                </p>
              </div>

              {/* Suggested Prompts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(prompt)}
                    className="p-4 text-left border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <p className="text-sm text-foreground group-hover:text-gray-900">{prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Chat Messages
          <div className="max-w-3xl mx-auto w-full px-4 py-8 space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-accent-100 rounded-full flex items-center justify-center">
                    <Bot className="h-5 w-5 text-accent-600" />
                  </div>
                )}
                
                <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-accent-500 text-white'
                        : 'bg-gray-100 text-foreground'
                    }`}
                  >
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-accent-100 rounded-full flex items-center justify-center">
                  <Bot className="h-5 w-5 text-accent-600" />
                </div>
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - ChatGPT Style */}
      <div className="border-t border-gray-200 p-4 bg-card">
        <div className="max-w-3xl mx-auto">
          <div className="relative bg-card border border-gray-300 rounded-3xl shadow-sm focus-within:border-accent-500 focus-within:shadow-md transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              placeholder={t('chatbot.placeholder')}
              rows={1}
              className="w-full px-6 py-4 pr-14 bg-transparent border-none outline-none resize-none max-h-48 text-foreground placeholder:text-gray-500"
              style={{ minHeight: '56px' }}
            />
            
            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isTyping}
              className={`absolute right-3 bottom-3 p-2 rounded-full transition-all ${
                input.trim() && !isTyping
                  ? 'bg-accent-500 hover:bg-accent-600 text-white'
                  : 'bg-gray-200 text-muted-foreground cursor-not-allowed'
              }`}
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-3">
            {t('chatbot.disclaimer')}
          </p>
        </div>
      </div>
    </div>
  )
}
