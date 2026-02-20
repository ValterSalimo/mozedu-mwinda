/**
 * Chatbot API Client
 * Communicates with the Azure Function orchestrator (POST /api/chat)
 * and the backend REST/GraphQL APIs for session management.
 */

import { getAccessToken, apiClient, ApiError } from './client'
import { graphqlClient } from './graphql'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const getChatbotUrl = () => {
  const url = process.env.NEXT_PUBLIC_CHATBOT_URL || 'https://mozedu-parent-chatbot.azurewebsites.net'
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return process.env.NEXT_PUBLIC_CHATBOT_URL || 'http://localhost:7071'
  }
  return url
}

const CHATBOT_URL = getChatbotUrl()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  intent?: string
  inputTokens?: number
  outputTokens?: number
  toolCalls?: string
  errorType?: string
  createdAt: string
}

export interface ChatSession {
  id: string
  userId: string
  studentId?: string
  service: string
  language: string
  title?: string
  lastIntent?: string
  isActive: boolean
  lastMessageAt?: string
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

export interface ChatResponse {
  response: string
  session_id: string
  intent?: string
  requires_child_selection?: boolean
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  error?: string
}

export interface ChatSessionConnection {
  chatbotSessions: {
    edges: Array<{ node: ChatSession; cursor: string }>
    pageInfo: { hasNextPage: boolean; endCursor?: string }
    totalCount: number
  }
}

export interface ChatMessageConnection {
  chatbotMessages: {
    edges: Array<{ node: ChatMessage; cursor: string }>
    pageInfo: { hasNextPage: boolean; endCursor?: string }
    totalCount: number
  }
}

// ---------------------------------------------------------------------------
// Azure Function API (Orchestrator)
// ---------------------------------------------------------------------------

/**
 * Send a message to the chatbot orchestrator.
 * This calls the Azure Function endpoint, NOT the backend directly.
 */
export async function sendChatMessage(params: {
  message: string
  sessionId?: string
  language?: string
  service?: string
}): Promise<ChatResponse> {
  const token = getAccessToken()
  if (!token) {
    throw new ApiError(401, 'Not authenticated')
  }

  const response = await fetch(`${CHATBOT_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      message: params.message,
      session_id: params.sessionId || undefined,
      language: params.language || getPreferredLanguage(),
      service: params.service || getServiceName(),
    }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new ApiError(response.status, data.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// ---------------------------------------------------------------------------
// Backend GraphQL — Session & Message queries (for history views)
// ---------------------------------------------------------------------------

const CHATBOT_SESSIONS_QUERY = `
  query ChatbotSessions($pagination: PaginationInput) {
    chatbotSessions(pagination: $pagination) {
      edges {
        node {
          id
          userId
          studentId
          service
          language
          title
          lastIntent
          isActive
          lastMessageAt
          expiresAt
          createdAt
          updatedAt
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`

const CHATBOT_SESSION_QUERY = `
  query ChatbotSession($id: UUID!) {
    chatbotSession(id: $id) {
      id
      userId
      studentId
      service
      language
      title
      lastIntent
      isActive
      lastMessageAt
      expiresAt
      createdAt
      updatedAt
    }
  }
`

const CHATBOT_MESSAGES_QUERY = `
  query ChatbotMessages($sessionId: UUID!, $pagination: PaginationInput) {
    chatbotMessages(sessionId: $sessionId, pagination: $pagination) {
      edges {
        node {
          id
          sessionId
          role
          content
          intent
          inputTokens
          outputTokens
          toolCalls
          errorType
          createdAt
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`

/** Fetch chatbot sessions for the current parent (paginated). */
export async function fetchChatbotSessions(pagination?: {
  first?: number
  after?: string
}): Promise<ChatSessionConnection> {
  return graphqlClient<ChatSessionConnection>(CHATBOT_SESSIONS_QUERY, {
    pagination: pagination || { first: 20 },
  })
}

/** Fetch a single chatbot session by ID. */
export async function fetchChatbotSession(
  id: string
): Promise<{ chatbotSession: ChatSession | null }> {
  return graphqlClient<{ chatbotSession: ChatSession | null }>(
    CHATBOT_SESSION_QUERY,
    { id }
  )
}

/** Fetch messages for a chatbot session (paginated). */
export async function fetchChatbotMessages(
  sessionId: string,
  pagination?: { first?: number; after?: string }
): Promise<ChatMessageConnection> {
  return graphqlClient<ChatMessageConnection>(CHATBOT_MESSAGES_QUERY, {
    sessionId,
    pagination: pagination || { first: 50 },
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPreferredLanguage(): string {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('preferredLanguage') || 'pt'
  }
  return 'pt'
}

function getServiceName(): string {
  if (typeof window !== 'undefined') {
    const appName = process.env.NEXT_PUBLIC_APP_NAME || 'mwinda'
    return appName.toLowerCase()
  }
  return 'mwinda'
}
