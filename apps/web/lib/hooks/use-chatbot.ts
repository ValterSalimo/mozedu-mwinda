/**
 * Chatbot Hooks — React Query hooks for the parent AI chatbot.
 *
 * - useChatbotSessions  — list all sessions (session list page)
 * - useChatbotMessages  — load message history for a session
 * - useSendMessage       — mutation to send a message to the orchestrator
 * - useChatbotState      — local state manager for active chat UI
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useCallback, useReducer, useRef } from 'react'
import {
  sendChatMessage,
  fetchChatbotSessions,
  fetchChatbotMessages,
  type ChatMessage,
  type ChatSession,
  type ChatResponse,
} from '../api/chatbot'

// ==================== Query Keys ====================

export const chatbotKeys = {
  all: ['chatbot'] as const,
  sessions: () => [...chatbotKeys.all, 'sessions'] as const,
  session: (id: string) => [...chatbotKeys.all, 'session', id] as const,
  messages: (sessionId: string) => [...chatbotKeys.all, 'messages', sessionId] as const,
}

// ==================== Sessions Hook ====================

export function useChatbotSessions() {
  return useQuery({
    queryKey: chatbotKeys.sessions(),
    queryFn: async () => {
      const data = await fetchChatbotSessions({ first: 50 })
      return data.chatbotSessions.edges.map((e) => e.node)
    },
    staleTime: 30_000, // 30s — sessions don't change rapidly
  })
}

// ==================== Messages Hook ====================

export function useChatbotMessages(sessionId: string | undefined) {
  return useQuery({
    queryKey: chatbotKeys.messages(sessionId || ''),
    queryFn: async () => {
      if (!sessionId) return []
      const data = await fetchChatbotMessages(sessionId, { first: 100 })
      return data.chatbotMessages.edges.map((e) => e.node)
    },
    enabled: !!sessionId,
    staleTime: 10_000,
  })
}

// ==================== Send Message Mutation ====================

export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: sendChatMessage,
    onSuccess: (data) => {
      // Invalidate sessions list (new session may have been created)
      queryClient.invalidateQueries({ queryKey: chatbotKeys.sessions() })
      // Invalidate messages for this session
      if (data.session_id) {
        queryClient.invalidateQueries({
          queryKey: chatbotKeys.messages(data.session_id),
        })
      }
    },
  })
}

// ==================== Chat State Manager ====================

/** A message in the local chat UI (includes optimistic user messages + streamed responses). */
export interface LocalChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  intent?: string
  isLoading?: boolean
  isError?: boolean
  requiresChildSelection?: boolean
  createdAt: string
}

interface ChatState {
  sessionId: string | null
  messages: LocalChatMessage[]
  isLoading: boolean
  error: string | null
}

type ChatAction =
  | { type: 'ADD_USER_MESSAGE'; message: LocalChatMessage }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'ADD_ASSISTANT_MESSAGE'; message: LocalChatMessage }
  | { type: 'UPDATE_ASSISTANT_MESSAGE'; id: string; content: string; isLoading?: boolean }
  | { type: 'SET_SESSION_ID'; sessionId: string }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOAD_HISTORY'; messages: LocalChatMessage[]; sessionId: string }
  | { type: 'NEW_CHAT' }

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ADD_USER_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.message],
        isLoading: true,
        error: null,
      }
    case 'SET_LOADING':
      return { ...state, isLoading: action.loading }
    case 'ADD_ASSISTANT_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.message],
        isLoading: false,
      }
    case 'UPDATE_ASSISTANT_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.id
            ? { ...m, content: action.content, isLoading: action.isLoading ?? m.isLoading }
            : m
        ),
      }
    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.sessionId }
    case 'SET_ERROR':
      return { ...state, error: action.error, isLoading: false }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    case 'LOAD_HISTORY':
      return {
        ...state,
        messages: action.messages,
        sessionId: action.sessionId,
        isLoading: false,
        error: null,
      }
    case 'NEW_CHAT':
      return {
        sessionId: null,
        messages: [],
        isLoading: false,
        error: null,
      }
    default:
      return state
  }
}

/**
 * useChatbot — full chat state manager for the chat widget/page.
 *
 * Manages local optimistic messages, calls the Azure Function,
 * and updates session state.
 */
export function useChatbot() {
  const [state, dispatch] = useReducer(chatReducer, {
    sessionId: null,
    messages: [],
    isLoading: false,
    error: null,
  })

  const queryClient = useQueryClient()
  const messageIdCounter = useRef(0)

  const genId = () => {
    messageIdCounter.current += 1
    return `local-${Date.now()}-${messageIdCounter.current}`
  }

  /** Send a message to the chatbot orchestrator. */
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || state.isLoading) return

      // Add user message optimistically
      const userMsg: LocalChatMessage = {
        id: genId(),
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
      }
      dispatch({ type: 'ADD_USER_MESSAGE', message: userMsg })

      // Add loading placeholder for assistant
      const loadingId = genId()
      dispatch({
        type: 'ADD_ASSISTANT_MESSAGE',
        message: {
          id: loadingId,
          role: 'assistant',
          content: '',
          isLoading: true,
          createdAt: new Date().toISOString(),
        },
      })

      try {
        const response = await sendChatMessage({
          message: trimmed,
          sessionId: state.sessionId || undefined,
        })

        // Update session ID if new
        if (response.session_id && response.session_id !== state.sessionId) {
          dispatch({ type: 'SET_SESSION_ID', sessionId: response.session_id })
        }

        // Replace loading message with real response
        dispatch({
          type: 'UPDATE_ASSISTANT_MESSAGE',
          id: loadingId,
          content: response.response,
          isLoading: false,
        })

        // Handle child selection
        if (response.requires_child_selection) {
          // The response already contains the selection prompt
          // The parent will respond with the child name in the next message
        }

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: chatbotKeys.sessions() })
        if (response.session_id) {
          queryClient.invalidateQueries({
            queryKey: chatbotKeys.messages(response.session_id),
          })
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to send message'
        dispatch({
          type: 'UPDATE_ASSISTANT_MESSAGE',
          id: loadingId,
          content: errorMessage,
          isLoading: false,
        })
        dispatch({ type: 'SET_ERROR', error: errorMessage })
      }
    },
    [state.sessionId, state.isLoading, queryClient]
  )

  /** Load an existing session's messages. */
  const loadSession = useCallback(
    async (sessionId: string) => {
      try {
        dispatch({ type: 'SET_LOADING', loading: true })
        const data = await fetchChatbotMessages(sessionId, { first: 100 })
        const messages: LocalChatMessage[] = data.chatbotMessages.edges.map((e) => ({
          id: e.node.id,
          role: e.node.role as 'user' | 'assistant',
          content: e.node.content,
          intent: e.node.intent || undefined,
          createdAt: e.node.createdAt,
        }))
        dispatch({ type: 'LOAD_HISTORY', messages, sessionId })
      } catch {
        dispatch({ type: 'SET_ERROR', error: 'Failed to load conversation' })
      }
    },
    []
  )

  /** Start a fresh conversation. */
  const newChat = useCallback(() => {
    dispatch({ type: 'NEW_CHAT' })
  }, [])

  return {
    messages: state.messages,
    sessionId: state.sessionId,
    isLoading: state.isLoading,
    error: state.error,
    sendMessage,
    loadSession,
    newChat,
  }
}

// Re-export types
export type { ChatMessage, ChatSession, ChatResponse }
