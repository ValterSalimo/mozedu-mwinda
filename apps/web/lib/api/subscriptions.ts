/**
 * GraphQL subscriptions helper (graphql-ws)
 * Uses connection init payload for auth (browser WebSockets cannot set headers).
 */

import { createClient, type Client, type SubscribePayload } from 'graphql-ws'
import { getAccessToken } from './client'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/graphql'

let wsClient: Client | null = null

function getClient(): Client {
  if (!wsClient) {
    wsClient = createClient({
      url: WS_URL,
      lazy: true,
      retryAttempts: Infinity,
      keepAlive: 10_000,
      connectionParams: () => {
        const token = getAccessToken()
        if (!token) return {}
        return { Authorization: `Bearer ${token}` }
      },
    })
  }
  return wsClient
}

export type Unsubscribe = () => void

export function gqlSubscribe<TData = unknown>(payload: SubscribePayload, onNext: (data: TData) => void, onError?: (err: unknown) => void): Unsubscribe {
  const client = getClient()
  let disposed = false

  const dispose = client.subscribe(payload, {
    next: (result) => {
      if (disposed) return
      if (result.data) onNext(result.data as TData)
    },
    error: (err) => {
      if (disposed) return
      onError?.(err)
    },
    complete: () => {
      // no-op
    },
  })

  return () => {
    disposed = true
    dispose()
  }
}

// ==================== SUBSCRIPTION DOCUMENTS ====================

export const messagingSubscriptions = {
  messageReceived: `
    subscription MessageReceived($conversationId: UUID!) {
      messageReceived(conversationId: $conversationId) {
        id
        conversationId
        senderId
        content
        contentType
        replyToId
        isEdited
        editedAt
        isDeleted
        deletedAt
        createdAt
        updatedAt
        sender {
          id
          firstName
          lastName
          email
          role
        }
      }
    }
  `,
  typingIndicator: `
    subscription TypingIndicator($conversationId: UUID!) {
      typingIndicator(conversationId: $conversationId) {
        conversationId
        userId
        isTyping
      }
    }
  `,
  conversationUpdated: `
    subscription ConversationUpdated($conversationId: UUID!) {
      conversationUpdated(conversationId: $conversationId) {
        id
        type
        name
        description
        avatarUrl
        classId
        schoolId
        maxMembers
        isActive
        lastMessageAt
        updatedAt
        unreadCount
        lastMessage {
          id
          conversationId
          senderId
          content
          contentType
          createdAt
          sender {
            id
            firstName
            lastName
            email
            role
          }
        }
        participants {
          id
          userId
          role
          isMuted
          lastReadAt
          joinedAt
          leftAt
          user {
            id
            firstName
            lastName
            email
            role
          }
        }
      }
    }
  `,
  userOnlineStatus: `
    subscription UserOnlineStatus($conversationId: UUID!) {
      userOnlineStatus(conversationId: $conversationId) {
        userId
        isOnline
      }
    }
  `,

  bulkMessageReceived: `
    subscription BulkMessageReceived {
      bulkMessageReceived {
        id
        senderId
        schoolId
        subject
        content
        targetType
        targetValue
        channel
        status
        scheduledAt
        sentAt
        totalRecipients
        deliveredCount
        readCount
        createdAt
        updatedAt
        sender {
          id
          firstName
          lastName
          email
          role
        }
      }
    }
  `,
}
