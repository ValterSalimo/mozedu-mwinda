'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { formatDistanceToNow, format } from 'date-fns'
import { Loader2, Send, MessageSquare, Search, Pencil, Trash2, Flag, X, ChevronUp, Ban, Plus, User, School, ArrowLeft, MoreVertical, Check, ChevronDown, Edit2, Trash, Info, ShieldCheck, Users, Settings } from 'lucide-react'
import { Button, Card, CardContent, Input, Badge } from '@mozedu/ui'
import { UserRole } from '@mozedu/types'

import { messagingApi, gqlSubscribe, messagingSubscriptions, type MessagingUserSummary } from '@/lib/api'
import { useUser } from '@/lib/stores'
import Image from 'next/image'

type UiUser = {
  id: string
  firstName?: string
  lastName?: string
  email?: string
  role?: string
  avatarUrl?: string
}
type UiMessage = {
  id: string
  conversationId: string
  senderId: string
  content: string
  contentType: string
  createdAt: string
  isDeleted?: boolean
  sender?: UiUser
}

type Participant = {
  user_id?: string
  userId?: string
  user?: {
    id: string
    first_name?: string
    firstName?: string
    last_name?: string
    lastName?: string
    email?: string
    Email?: string
    role?: string
  }
  first_name?: string
  firstName?: string
  last_name?: string
  lastName?: string
  email?: string
  Email?: string
  role?: string
}

type UiConversation = {
  id: string
  type: 'DIRECT' | 'GROUP' | 'CLASS_GROUP'
  name?: string | null
  avatar_url?: string | null
  last_message_at?: string | null
  last_message?: {
    content?: string
    created_at?: string
    sender_id?: string
  } | null
  unread_count?: number
  other_participant?: {
    id: string
    first_name: string
    last_name: string
    email: string
    avatar_url?: string | null
    role?: string
  } | null
  participants?: Participant[]
}

type UiBulkMessage = {
  id: string
  subject?: string | null
  content: string
  senderId: string
  senderName?: string
  createdAt: string
  sentAt?: string | null
  targetType?: string
  targetValue?: string | null
  channel?: string
}

/** Shape of a bulk message from the REST API */
interface RestBulkMessage {
  id: string
  subject?: string | null
  content: string
  sender_id: string
  sender?: { first_name?: string; last_name?: string }
  created_at: string
  sent_at?: string | null
  target_type?: string
  target_value?: string | null
  channel?: string
}

/** Shape of a bulk message from GraphQL */
interface GraphQLBulkMessage {
  id: string
  subject?: string | null
  content: string
  senderId: string
  sender?: { firstName?: string; lastName?: string }
  createdAt: string
  sentAt?: string | null
  targetType?: string
  targetValue?: string | null
  channel?: string
}

/** Shape of a message from the REST API */
interface RestMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  content_type: string
  created_at: string
  is_deleted?: boolean
  sender?: {
    id: string
    first_name?: string
    last_name?: string
    email?: string
    role?: string
  }
}

/** Shape of a message from GraphQL */
interface GraphQLMessage {
  id: string
  conversationId: string
  senderId: string
  content: string
  contentType: string
  createdAt: string
  isDeleted?: boolean
  sender?: {
    id: string
    firstName?: string
    lastName?: string
    email?: string
    role?: string
  }
}

/** GraphQL subscription event shapes */
interface MessageReceivedEvent { messageReceived: GraphQLMessage }
interface TypingIndicatorEvent { typingIndicator: { userId: string; isTyping: boolean } }
interface UserOnlineStatusEvent { userOnlineStatus: { userId: string; isOnline: boolean } }
interface BulkMessageReceivedEvent { bulkMessageReceived: GraphQLBulkMessage }

function toUiBulkFromRest(m: RestBulkMessage): UiBulkMessage {
  return {
    id: m.id,
    subject: m.subject ?? null,
    content: m.content,
    senderId: m.sender_id,
    senderName: m.sender ? `${m.sender.first_name || ''} ${m.sender.last_name || ''}`.trim() : undefined,
    createdAt: m.created_at,
    sentAt: m.sent_at ?? null,
    targetType: m.target_type,
    targetValue: m.target_value ?? null,
    channel: m.channel,
  }
}

function toUiBulkFromGraphql(m: GraphQLBulkMessage): UiBulkMessage {
  return {
    id: m.id,
    subject: m.subject ?? null,
    content: m.content,
    senderId: m.senderId,
    senderName: m.sender ? `${m.sender.firstName || ''} ${m.sender.lastName || ''}`.trim() : undefined,
    createdAt: m.createdAt,
    sentAt: m.sentAt ?? null,
    targetType: m.targetType,
    targetValue: m.targetValue ?? null,
    channel: m.channel,
  }
}

function displayNameFromConversation(c: UiConversation, currentUserId?: string): string {
  if (c.type === 'DIRECT') {
    // Try other_participant first (most reliable)
    if (c.other_participant) {
      const name = `${c.other_participant.first_name || ''} ${c.other_participant.last_name || ''}`.trim()
      if (name && name.toLowerCase() !== 'conversation' && name.length > 0) return name
      // Fallback to email username
      if (c.other_participant.email) {
        const emailName = c.other_participant.email.split('@')[0]
        if (emailName && emailName.length > 0) return emailName
      }
    }
    // Fallback: try to find the other participant in the list
    if (c.participants && currentUserId) {
      const other = c.participants.find(p => {
        const pUserId = p.user_id || p.userId || p.user?.id
        return pUserId !== currentUserId
      })
      if (other) {
        const u = other.user || other
        const name = `${u.first_name || u.firstName || ''} ${u.last_name || u.lastName || ''}`.trim()
        if (name && name.toLowerCase() !== 'conversation' && name.length > 0) return name
        // Try email fallback
        const email = u.email || u.Email
        if (email) {
          const emailName = email.split('@')[0]
          if (emailName && emailName.length > 0) return emailName
        }
      }
    }
  }

  // For groups, use the name if available
  if (c.name && c.name.toLowerCase() !== 'conversation' && c.name.trim().length > 0) return c.name

  // Type-based fallbacks
  if (c.type === 'DIRECT') return 'Direct Message'
  if (c.type === 'GROUP') return 'Group Chat'
  if (c.type === 'CLASS_GROUP') return 'Class Group'

  return 'Conversation'
}

function toUiMessageFromRest(m: RestMessage): UiMessage {
  return {
    id: m.id,
    conversationId: m.conversation_id,
    senderId: m.sender_id,
    content: m.is_deleted ? '(deleted)' : m.content,
    contentType: m.content_type,
    createdAt: m.created_at,
    isDeleted: m.is_deleted,
    sender: m.sender
      ? {
        id: m.sender.id,
        firstName: m.sender.first_name,
        lastName: m.sender.last_name,
        email: m.sender.email,
        role: m.sender.role,
      }
      : undefined,
  }
}

function toUiMessageFromGraphql(m: GraphQLMessage): UiMessage {
  return {
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    content: m.isDeleted ? '(deleted)' : m.content,
    contentType: m.contentType,
    createdAt: m.createdAt,
    isDeleted: m.isDeleted,
    sender: m.sender
      ? {
        id: m.sender.id,
        firstName: m.sender.firstName,
        lastName: m.sender.lastName,
        email: m.sender.email,
        role: m.sender.role,
      }
      : undefined,
  }
}

// Helper for Avatars
function getInitials(name: string) {
  return name
    .split(' ')
    .filter(p => p.length > 0)
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function getColorForName(name: string) {
  const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500',
    'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500',
    'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500',
    'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

const UserAvatar = React.memo(function UserAvatar({ name, className, role, src }: { name: string, className?: string, role?: string, src?: string | null }) {
  if (src) {
    return (
      <div className={`shrink-0 overflow-hidden rounded-full relative ${className || 'h-10 w-10'}`}>
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            target.parentElement!.classList.add('bg-muted')
          }}
        />
      </div>
    )
  }

  if (role === 'SCHOOL_ADMIN' || role === 'SUPER_ADMIN' || role?.includes('ADMIN')) {
    return (
      <div className={`flex items-center justify-center rounded-full bg-blue-600 text-white shrink-0 ${className || 'h-10 w-10 p-2'}`}>
        <School className="w-1/2 h-1/2" />
      </div>
    )
  }

  const initials = getInitials(name)
  const colorClass = getColorForName(name)

  return (
    <div className={`flex items-center justify-center rounded-full text-white font-medium shrink-0 ${colorClass} ${className || 'h-10 w-10 text-sm'}`}>
      {initials}
    </div>
  )
})

export function MessagingPage({ scope }: { scope: 'school' | 'teacher' | 'student' | 'parent' }) {
  const t = useTranslations(scope)
  const queryClient = useQueryClient()
  const user = useUser()

  const canSendBulk =
    user?.role === UserRole.SCHOOL_ADMIN ||
    user?.role === UserRole.SUPER_ADMIN ||
    user?.role === UserRole.TEACHER ||
    user?.role === UserRole.TEACHER_ADMIN

  const [tab, setTab] = useState<'chats' | 'announcements'>('chats')

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState<UiMessage | null>(null)

  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set())

  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({})
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({})

  const [isNewChatOpen, setIsNewChatOpen] = useState(false)
  const [recipientSearch, setRecipientSearch] = useState('')

  // Group Chat State
  const [isGroupMode, setIsGroupMode] = useState(false)
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<Set<string>>(new Set())
  const [groupName, setGroupName] = useState('')
  const [groupStep, setGroupStep] = useState<'SELECT_MEMBERS' | 'NAME_GROUP'>('SELECT_MEMBERS')

  const bottomRef = useRef<HTMLDivElement | null>(null)
  const allowAutoScrollRef = useRef(true)

  const [bulkDraft, setBulkDraft] = useState({
    subject: '',
    content: '',
    target_type: 'ALL_STUDENTS',
    target_value: '',
    channel: 'IN_APP',
  })

  const { data: bulkReceivedData, isLoading: bulkLoading } = useQuery({
    queryKey: ['messaging', 'bulk', 'received'],
    queryFn: async () => {
      const res = await messagingApi.listReceivedBulkMessages({ page: 1, pageSize: 50 })
      return (res.messages || []).map(toUiBulkFromRest) as UiBulkMessage[]
    },
    enabled: tab === 'announcements',
  })

  const [bulkMessages, setBulkMessages] = useState<UiBulkMessage[]>([])

  useEffect(() => {
    if (tab !== 'announcements') return
    setBulkMessages(bulkReceivedData || [])
  }, [bulkReceivedData, tab])

  useEffect(() => {
    if (tab !== 'announcements') return
    const unsub = gqlSubscribe({ query: messagingSubscriptions.bulkMessageReceived }, (data: BulkMessageReceivedEvent) => {
      const bm = toUiBulkFromGraphql(data.bulkMessageReceived)
      setBulkMessages((prev) => {
        if (prev.some((x) => x.id === bm.id)) return prev
        return [bm, ...prev]
      })
    })
    return () => unsub()
  }, [tab])

  const sendBulkMutation = useMutation({
    mutationFn: async () => {
      const content = bulkDraft.content.trim()
      if (!content) throw new Error('Empty content')
      const created = await messagingApi.createBulkMessage({
        subject: bulkDraft.subject.trim() ? bulkDraft.subject.trim() : undefined,
        content,
        target_type: bulkDraft.target_type,
        target_value: bulkDraft.target_value.trim() ? bulkDraft.target_value.trim() : undefined,
        channel: bulkDraft.channel,
      })
      await messagingApi.sendBulkMessage((created as RestBulkMessage).id)
      return created
    },
    onSuccess: () => {
      setBulkDraft({ subject: '', content: '', target_type: 'ALL_STUDENTS', target_value: '', channel: 'IN_APP' })
      queryClient.invalidateQueries({ queryKey: ['messaging', 'bulk', 'received'] })
    },
  })

  const { data: conversationsData, isLoading: conversationsLoading } = useQuery({
    queryKey: ['messaging', 'conversations'],
    queryFn: () => messagingApi.listConversations({ page: 1, pageSize: 100 }),
  })

  const { data: recipientsData, isLoading: recipientsLoading } = useQuery({
    queryKey: ['messaging', 'recipients'],
    queryFn: messagingApi.getEligibleRecipients,
    enabled: isNewChatOpen,
  })

  const createConversationMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await messagingApi.createDirectConversation(userId)
      return res
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['messaging', 'conversations'] })
      setSelectedConversationId(res.id)
      setIsNewChatOpen(false)
      setRecipientSearch('')
      setIsGroupMode(false)
    },
  })

  const createGroupMutation = useMutation({
    mutationFn: async () => {
      if (!groupName.trim() || selectedGroupMembers.size === 0) return undefined
      const res = await messagingApi.createGroupConversation({
        name: groupName,
        member_ids: Array.from(selectedGroupMembers)
      })
      return res
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['messaging', 'conversations'] })
      if (res?.id) {
        setSelectedConversationId(res.id)
      }
      setIsNewChatOpen(false)
      setIsGroupMode(false)
      setSelectedGroupMembers(new Set())
      setGroupName('')
      setGroupStep('SELECT_MEMBERS')
    }
  })

  useEffect(() => {
    let cancelled = false
    messagingApi
      .listBlockedUsers()
      .then((ids) => {
        if (!cancelled) setBlockedUserIds(new Set(ids))
      })
      .catch(() => { })
    return () => { cancelled = true }
  }, [])

  const conversations = useMemo(() => {
    const items = (conversationsData?.conversations || []) as UiConversation[]
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter((c) => displayNameFromConversation(c, user?.id).toLowerCase().includes(q))
  }, [conversationsData, search, user?.id])



  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['messaging', 'messages', selectedConversationId],
    queryFn: async () => {
      const res = await messagingApi.getMessages(selectedConversationId as string, { limit: 100 })
      // Handle potential API response wrapper (e.g. { data: [...] } vs [...])
      const msgs = Array.isArray(res) ? res : (res as { data?: RestMessage[]; messages?: RestMessage[] }).data || (res as { data?: RestMessage[]; messages?: RestMessage[] }).messages || []
      return Array.isArray(msgs) ? msgs.map(toUiMessageFromRest).reverse() : []
    },
    enabled: !!selectedConversationId,
  })

  const [messages, setMessages] = useState<UiMessage[]>([])

  useEffect(() => {
    setMessages(messagesData || [])
  }, [messagesData])

  // Mark read when opening a conversation
  useEffect(() => {
    if (!selectedConversationId) return
    let cancelled = false
    messagingApi.markConversationRead(selectedConversationId).catch(() => { })
    if (!cancelled) {
      queryClient.invalidateQueries({ queryKey: ['messaging', 'conversations'] })
    }
    return () => { cancelled = true }
  }, [queryClient, selectedConversationId])

  // Presence: best-effort online when the page is open
  useEffect(() => {
    if (!selectedConversationId) return
    messagingApi.setPresence(selectedConversationId, true).catch(() => { })
    return () => {
      messagingApi.setPresence(selectedConversationId, false).catch(() => { })
    }
  }, [selectedConversationId])

  // Realtime subscriptions for the selected conversation
  useEffect(() => {
    if (!selectedConversationId) return

    const unsubscribers: Array<() => void> = []

    unsubscribers.push(
      gqlSubscribe(
        {
          query: messagingSubscriptions.messageReceived,
          variables: { conversationId: selectedConversationId },
        },
        (data: MessageReceivedEvent) => {
          const m = toUiMessageFromGraphql(data.messageReceived)
          setMessages((prev) => {
            if (prev.some((x) => x.id === m.id)) return prev
            return [...prev, m]
          })
          // Update conversation list (last message + unread)
          queryClient.invalidateQueries({ queryKey: ['messaging', 'conversations'] })
        }
      )
    )

    unsubscribers.push(
      gqlSubscribe(
        {
          query: messagingSubscriptions.typingIndicator,
          variables: { conversationId: selectedConversationId },
        },
        (data: TypingIndicatorEvent) => {
          const evt = data.typingIndicator
          setTypingUsers((prev) => ({ ...prev, [evt.userId]: evt.isTyping }))
        }
      )
    )

    unsubscribers.push(
      gqlSubscribe(
        {
          query: messagingSubscriptions.userOnlineStatus,
          variables: { conversationId: selectedConversationId },
        },
        (data: UserOnlineStatusEvent) => {
          const evt = data.userOnlineStatus
          setOnlineUsers((prev) => ({ ...prev, [evt.userId]: evt.isOnline }))
        }
      )
    )

    unsubscribers.push(
      gqlSubscribe(
        {
          query: messagingSubscriptions.conversationUpdated,
          variables: { conversationId: selectedConversationId },
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messaging', 'conversations'] })
        }
      )
    )

    return () => {
      unsubscribers.forEach((u) => u())
      setTypingUsers({})
    }
  }, [queryClient, selectedConversationId])

  useEffect(() => {
    if (!allowAutoScrollRef.current) {
      allowAutoScrollRef.current = true
      return
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, selectedConversationId])

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!selectedConversationId) throw new Error('No conversation selected')
      const content = draft.trim()
      if (!content) return null
      return messagingApi.sendMessage(selectedConversationId, { content, content_type: 'TEXT' })
    },
    onSuccess: (created) => {
      setDraft('')
      if (!created) return
      const m = toUiMessageFromRest(created as RestMessage)
      setMessages((prev) => {
        if (prev.some((x) => x.id === m.id)) return prev
        return [...prev, m]
      })
      queryClient.invalidateQueries({ queryKey: ['messaging', 'conversations'] })
    },
  })

  const editMutation = useMutation({
    mutationFn: async () => {
      if (!editing) throw new Error('No message selected')
      const content = draft.trim()
      if (!content) throw new Error('Empty content')
      await messagingApi.editMessage(editing.id, content)
      return { messageId: editing.id, content }
    },
    onSuccess: (res) => {
      setMessages((prev) => prev.map((m) => (m.id === res.messageId ? { ...m, content: res.content } : m)))
      setEditing(null)
      setDraft('')
      queryClient.invalidateQueries({ queryKey: ['messaging', 'conversations'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await messagingApi.deleteMessage(messageId)
      return messageId
    },
    onSuccess: (messageId) => {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, content: '(deleted)', isDeleted: true } : m)))
      queryClient.invalidateQueries({ queryKey: ['messaging', 'conversations'] })
    },
  })

  const reportMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const reason = (window.prompt(t('messages.reportReasonPrompt')) || '').trim()
      if (!reason) return null
      const description = (window.prompt(t('messages.reportDescriptionPrompt')) || '').trim()
      await messagingApi.reportMessage(messageId, { reason, description })
      return true
    },
  })

  const loadOlderMutation = useMutation({
    mutationFn: async () => {
      if (!selectedConversationId) throw new Error('No conversation selected')
      const oldest = messages[0]
      if (!oldest) return [] as UiMessage[]
      const msgs = await messagingApi.getMessages(selectedConversationId, { before: oldest.createdAt, limit: 50 })
      return msgs.map(toUiMessageFromRest).reverse()
    },
    onSuccess: (older) => {
      if (!older || older.length === 0) return
      allowAutoScrollRef.current = false
      setMessages((prev) => {
        const existing = new Set(prev.map((m) => m.id))
        const deduped = older.filter((m) => !existing.has(m.id))
        return [...deduped, ...prev]
      })
    },
  })

  // Typing indicator (debounced)
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const setTyping = (isTyping: boolean) => {
    if (!selectedConversationId) return
    messagingApi.setTypingIndicator(selectedConversationId, isTyping).catch(() => { })
  }

  const handleDraftChange = useCallback((v: string) => {
    setDraft(v)
    if (!selectedConversationId) return

    setTyping(true)
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => setTyping(false), 900)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId])

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId) || null

  const otherUserOnline = useMemo(() => {
    if (!selectedConversation || selectedConversation.type !== 'DIRECT' || !selectedConversation.other_participant) return null
    return onlineUsers[selectedConversation.other_participant.id] === true
  }, [onlineUsers, selectedConversation])

  const otherUserBlocked = useMemo(() => {
    if (!selectedConversation || selectedConversation.type !== 'DIRECT' || !selectedConversation.other_participant) return false
    return blockedUserIds.has(selectedConversation.other_participant.id)
  }, [blockedUserIds, selectedConversation])

  const typingSummary = useMemo(() => {
    const ids = Object.entries(typingUsers)
      .filter(([id, isTyping]) => isTyping && id !== user?.id)
      .map(([id]) => id)

    if (ids.length === 0) return null
    if (selectedConversation?.type === 'DIRECT') return t('messages.typing')
    return t('messages.peopleTyping', { count: ids.length })
  }, [selectedConversation?.type, t, typingUsers, user?.id])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('messages.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('messages.subtitle')}</p>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant={tab === 'chats' ? 'primary' : 'outline'} size="sm" onClick={() => { setTab('chats'); setIsNewChatOpen(false); setIsGroupMode(false); }}>
              {t('messages.chatsTab')}
            </Button>
            <Button
              variant={tab === 'announcements' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => { setTab('announcements'); setIsNewChatOpen(false) }}
            >
              {t('messages.announcementsTab')}
            </Button>
          </div>
          {tab === 'chats' && !isNewChatOpen && (
            <Button size="sm" onClick={() => setIsNewChatOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('messages.newChat')}
            </Button>
          )}
          {tab === 'chats' && isNewChatOpen && (
            <Button size="sm" variant="ghost" onClick={() => setIsNewChatOpen(false)}>
              {t('messages.cancel')}
            </Button>
          )}
        </div>

        {/* Helper to reset group state when closing */}
        {tab === 'chats' && isNewChatOpen && !isGroupMode && (
          <div className="flex justify-end mt-2">
            <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={() => { setIsGroupMode(true); setGroupStep('SELECT_MEMBERS'); setSelectedGroupMembers(new Set()); }}>
              Create Group Chat
            </Button>
          </div>
        )}
      </div>

      {tab === 'announcements' ? (
        <div className="space-y-4">
          {canSendBulk ? (
            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="font-semibold">{t('messages.sendAnnouncement')}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    value={bulkDraft.subject}
                    onChange={(e) => setBulkDraft((p) => ({ ...p, subject: e.target.value }))}
                    placeholder={t('messages.announcementSubject')}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                      value={bulkDraft.target_type}
                      onChange={(e) => setBulkDraft((p) => ({ ...p, target_type: e.target.value }))}
                    >
                      <option value="ALL_STUDENTS">{t('messages.targetAllStudents')}</option>
                      <option value="ALL_TEACHERS">{t('messages.targetAllTeachers')}</option>
                      <option value="ALL_PARENTS">{t('messages.targetAllParents')}</option>
                      <option value="CLASS">{t('messages.targetClass')}</option>
                      <option value="GRADE">{t('messages.targetGrade')}</option>
                    </select>
                    <select
                      className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                      value={bulkDraft.channel}
                      onChange={(e) => setBulkDraft((p) => ({ ...p, channel: e.target.value }))}
                    >
                      <option value="IN_APP">IN_APP</option>
                      <option value="EMAIL">EMAIL</option>
                      <option value="SMS">SMS</option>
                    </select>
                  </div>
                </div>

                {(bulkDraft.target_type === 'CLASS' || bulkDraft.target_type === 'GRADE') ? (
                  <Input
                    value={bulkDraft.target_value}
                    onChange={(e) => setBulkDraft((p) => ({ ...p, target_value: e.target.value }))}
                    placeholder={
                      bulkDraft.target_type === 'CLASS'
                        ? t('messages.targetClassPlaceholder')
                        : t('messages.targetGradePlaceholder')
                    }
                  />
                ) : null}

                <textarea
                  className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={bulkDraft.content}
                  onChange={(e) => setBulkDraft((p) => ({ ...p, content: e.target.value }))}
                  placeholder={t('messages.announcementContent')}
                />

                <div className="flex justify-end">
                  <Button
                    onClick={() => sendBulkMutation.mutate()}
                    disabled={sendBulkMutation.isPending || !bulkDraft.content.trim()}
                    isLoading={sendBulkMutation.isPending}
                  >
                    {t('messages.sendAnnouncementNow')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="font-semibold">{t('messages.announcementsInbox')}</p>

              {bulkLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : bulkMessages.length === 0 ? (
                <div className="text-sm text-muted-foreground py-10 text-center">{t('messages.noAnnouncements')}</div>
              ) : (
                <div className="space-y-2">
                  {bulkMessages.map((bm) => (
                    <div key={bm.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{bm.subject || t('messages.announcementNoSubject')}</p>
                          <p className="text-xs text-muted-foreground">
                            {bm.senderName ? `${bm.senderName} · ` : ''}
                            {formatDistanceToNow(new Date(bm.sentAt || bm.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => messagingApi.markBulkMessageRead(bm.id).catch(() => { })}
                        >
                          {t('messages.markRead')}
                        </Button>
                      </div>

                      <p className="mt-2 text-sm whitespace-pre-wrap break-words">{bm.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (

        <div className="flex flex-col lg:flex-row h-[calc(100vh-220px)] min-h-[600px] border rounded-lg overflow-hidden bg-background shadow-md">
          {/* LEFT SIDEBAR - Contact List */}
          <div className={`w-full lg:w-[400px] flex flex-col border-r bg-muted/20 ${selectedConversationId ? 'hidden lg:flex' : 'flex'}`}>
            {/* Sidebar Header */}
            <div className="h-16 bg-muted/40 border-b flex items-center justify-between px-4 shrink-0">
              <div className="flex items-center gap-3">
                <UserAvatar
                  name={`${user?.firstName || ''} ${user?.lastName || ''}`}
                  role={user?.role}
                  src={user?.profileImageUrl || user?.avatar}
                  className="h-10 w-10 text-xs shadow-sm ring-2 ring-background"
                />
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold leading-none">{user?.firstName}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 capitalize">{user?.role?.toLowerCase().replace('_', ' ')}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" title={t('messages.newChat')} onClick={() => { setIsNewChatOpen(true); setIsGroupMode(false); }}>
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" title="Settings">
                  <MoreVertical className="h-5 w-5 text-muted-foreground" />
                </Button>
              </div>
            </div>

            {/* Sidebar Search or Header for New Chat */}
            <div className="p-3 bg-muted/10">
              {isNewChatOpen ? (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => { setIsNewChatOpen(false); setRecipientSearch(''); }}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search people..."
                      className="pl-9 h-9 bg-background/50 border-none ring-1 ring-border focus-visible:ring-primary"
                      value={recipientSearch}
                      onChange={(e) => setRecipientSearch(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search chats..."
                    className="pl-9 h-9 bg-background/50 border-none ring-1 ring-border focus-visible:ring-primary"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Sidebar List */}
            <div className="flex-1 overflow-y-auto">
              {isNewChatOpen ? (
                <>
                  {isNewChatOpen && (
                    <div className="p-2">
                      <Input
                        value={recipientSearch}
                        onChange={(e) => setRecipientSearch(e.target.value)}
                        placeholder="Search people..."
                        autoFocus
                        className="h-9 text-sm"
                      />
                    </div>
                  )}

                  {isGroupMode && groupStep === 'NAME_GROUP' ? (
                    <div className="p-4 space-y-4">
                      <Input
                        placeholder="Group Subject"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setGroupStep('SELECT_MEMBERS')}>Back</Button>
                        <Button size="sm" onClick={() => createGroupMutation.mutate()} disabled={!groupName.trim()}>Create</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {isGroupMode && (
                        <div className="px-4 py-2 bg-muted/50 flex justify-between items-center text-xs">
                          <span>{selectedGroupMembers.size} selected</span>
                          {selectedGroupMembers.size > 0 && <Button size="sm" className="h-6 text-xs" onClick={() => setGroupStep('NAME_GROUP')}>Next</Button>}
                        </div>
                      )}

                      {recipientsLoading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>
                      ) : (
                        <div className="space-y-0.5">
                          {(recipientsData || [])
                            .filter(u => `${u.first_name} ${u.last_name} ${u.role}`.toLowerCase().includes(recipientSearch.toLowerCase()))
                            .map(u => {
                              const isSelected = selectedGroupMembers.has(u.id)
                              return (
                                <button
                                  key={u.id}
                                  onClick={() => {
                                    if (isGroupMode) {
                                      const next = new Set(selectedGroupMembers)
                                      if (next.has(u.id)) next.delete(u.id)
                                      else next.add(u.id)
                                      setSelectedGroupMembers(next)
                                    } else {
                                      const existing = conversations.find(c => c.type === 'DIRECT' && c.other_participant?.id === u.id)
                                      if (existing) {
                                        setSelectedConversationId(existing.id)
                                        setIsNewChatOpen(false)
                                      } else {
                                        createConversationMutation.mutate(u.id)
                                      }
                                    }
                                  }}
                                  className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                                >
                                  {isGroupMode && (
                                    <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                                      {isSelected && <div className="h-2 w-2 bg-white rounded-sm" />}
                                    </div>
                                  )}
                                  <UserAvatar
                                    name={`${u.first_name || ''} ${u.last_name || ''}`}
                                    role={u.role}
                                    src={(u as MessagingUserSummary & { avatar_url?: string }).avatar_url}
                                    className="h-10 w-10 text-xs"
                                  />
                                  <div className="min-w-0 border-b flex-1 pb-2">
                                    <p className="text-sm font-medium truncate">{u.first_name} {u.last_name}</p>
                                    <Badge variant="secondary" className="text-[10px] h-4 px-1">{u.role}</Badge>
                                  </div>
                                </button>
                              )
                            })}
                          {!recipientsLoading && recipientsData?.length === 0 && (
                            <p className="text-sm text-center text-muted-foreground py-8">{t('messages.noRecipients')}</p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  {conversationsLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>
                  ) : conversations.length === 0 ? (
                    <div className="text-sm text-center text-muted-foreground py-8">{t('messages.noConversations')}</div>
                  ) : (
                    <div className="space-y-0">
                      {conversations.map((c) => {
                        const active = c.id === selectedConversationId
                        const name = displayNameFromConversation(c, user?.id)
                        const unread = c.unread_count || 0
                        const lastMsg = c.last_message?.content || ''
                        const date = c.last_message_at ? formatDistanceToNow(new Date(c.last_message_at), { addSuffix: false }) : ''

                        return (
                          <button
                            key={c.id}
                            onClick={() => setSelectedConversationId(c.id)}
                            className={`w-full flex items-center gap-3 p-3 text-left transition-all hover:bg-muted/30 relative ${active ? 'bg-muted/60' : ''}`}
                          >
                            {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                            <UserAvatar
                              name={name}
                              src={c.avatar_url || c.other_participant?.avatar_url}
                              role={c.type === 'DIRECT' ? c.other_participant?.role : undefined}
                              className="h-12 w-12 text-sm shrink-0 shadow-sm"
                            />
                            <div className="flex-1 min-w-0 border-b border-muted/30 pb-3 mt-1">
                              <div className="flex justify-between items-center mb-0.5">
                                <p className={`text-sm truncate ${active ? 'font-bold' : 'font-semibold'}`}>{name}</p>
                                <span className="text-[10px] text-muted-foreground shrink-0 uppercase">
                                  {date}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1 min-w-0 max-w-[85%] mt-0.5">
                                  {typingSummary && active ? (
                                    <span className="text-emerald-600 font-medium text-xs truncate">{typingSummary}</span>
                                  ) : (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {c.last_message?.sender_id === user?.id ? (
                                        <span className="text-primary/70 mr-1 font-medium italic">You:</span>
                                      ) : null}
                                      {lastMsg || 'No messages yet'}
                                    </p>
                                  )}
                                </div>
                                {unread > 0 ? (
                                  <Badge className="h-5 min-w-[1.25rem] px-1 text-[10px] flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 border-none font-bold">
                                    {unread}
                                  </Badge>
                                ) : null}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR - Chat Area */}
          <div className={`flex-1 flex flex-col items-center justify-center bg-[#efeae2] dark:bg-[#0b141a] relative ${!selectedConversationId ? 'hidden lg:flex' : 'flex'}`}>
            {!selectedConversationId ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-muted/5 text-center p-8">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-in zoom-in duration-500">
                  <MessageSquare className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Mwinda Messaging</h3>
                <p className="text-muted-foreground max-w-sm mb-8">
                  Send and receive messages with students, teachers, and parents in your school community.
                </p>
                <Button onClick={() => { setIsNewChatOpen(true); setIsGroupMode(false); }} className="rounded-full px-8 shadow-lg hover:shadow-primary/20 transition-all">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('messages.newChat')}
                </Button>
                <div className="mt-12 flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest bg-muted/20 px-4 py-1.5 rounded-full border border-muted/50">
                  <ShieldCheck className="h-3 w-3" />
                  Secure & Private
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col">
                {/* Chat Header */}
                <div className="h-16 px-4 bg-muted/40 border-b flex items-center justify-between shrink-0 shadow-sm z-20 backdrop-blur-md">
                  <div className="flex items-center gap-3 min-w-0">
                    <Button variant="ghost" size="icon" className="lg:hidden -ml-2 rounded-full h-9 w-9" onClick={() => setSelectedConversationId(null)}>
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <UserAvatar
                      name={displayNameFromConversation(selectedConversation!, user?.id)}
                      src={selectedConversation?.avatar_url || selectedConversation?.other_participant?.avatar_url}
                      role={selectedConversation?.type === 'DIRECT' ? selectedConversation?.other_participant?.role : undefined}
                      className="h-10 w-10 text-xs shadow-sm ring-2 ring-background cursor-pointer hover:opacity-90 transition-opacity"
                    />
                    <div className="min-w-0 flex flex-col">
                      <p className="font-bold text-sm truncate leading-none mb-1">{displayNameFromConversation(selectedConversation!, user?.id)}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {typingSummary ? (
                          <span className="text-emerald-500 font-semibold animate-pulse">{typingSummary}</span>
                        ) : (
                          selectedConversation?.type === 'DIRECT'
                            ? (otherUserOnline ? <span className="text-emerald-500 font-medium">Online</span> : 'Click for info')
                            : `${selectedConversation?.participants?.length || 0} members`
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-muted-foreground hover:bg-muted/50" title="More options"><MoreVertical className="h-4.5 w-4.5" /></Button>
                  </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 md:px-12 lg:px-16 space-y-2 bg-[url('https://site-assets.fontawesome.com/releases/v6.5.1/svgs/solid/message-smile.svg')] bg-repeat opacity-100 relative">
                  <div className="absolute inset-0 bg-[#efeae2]/95 dark:bg-[#0b141a]/95 -z-10" /> {/* Overlay pattern opacity hack */}

                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground/30" /></div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded shadow-sm mb-4">
                        Messages are end-to-end encrypted. No one outside of this chat, not even Mwinda, can read or listen to them.
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-center py-2">
                        <Button variant="ghost" size="sm" className="text-xs h-6 rounded-full bg-background/50 backdrop-blur-sm shadow-sm" onClick={() => loadOlderMutation.mutate()} disabled={loadOlderMutation.isPending}>
                          {loadOlderMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ChevronUp className="h-3 w-3 mr-1" />}
                          Load Older
                        </Button>
                      </div>

                      {messages.map((m, idx) => {
                        const mine = m.senderId === user?.id
                        const name = m.sender ? `${m.sender.firstName || ''} ${m.sender.lastName || ''}`.trim() : ''

                        // Bubble logic: check if same sender as previous for spacing
                        const prevMsg = messages[idx - 1]
                        const sameAsPrev = prevMsg && prevMsg.senderId === m.senderId
                        const nextMsg = messages[idx + 1]
                        const sameAsNext = nextMsg && nextMsg.senderId === m.senderId

                        return (
                          <div key={m.id} className={`flex w-full ${mine ? 'justify-end' : 'justify-start'} group ${sameAsPrev ? 'mt-0.5' : 'mt-3'}`}>
                            <div className={`relative max-w-[85%] sm:max-w-[75%] px-3 py-2 rounded-2xl text-[13.5px] leading-relaxed shadow-sm transition-all duration-200 hover:shadow-md border-b border-black/5 ${mine
                              ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-foreground rounded-tr-none'
                              : 'bg-white dark:bg-[#202c33] text-foreground rounded-tl-none'
                              } ${!sameAsPrev ? (mine ? 'rounded-tr-none' : 'rounded-tl-none') : ''}`}>

                              {/* Avatar for others in group */}
                              {selectedConversation?.type !== 'DIRECT' && !mine && !sameAsPrev && (
                                <p className="text-[11px] font-bold text-orange-600 dark:text-orange-400 mb-1 cursor-pointer hover:underline">{name}</p>
                              )}

                              <div className="pb-1 whitespace-pre-wrap break-words min-w-[60px]">
                                {m.content}
                              </div>

                              <div className={`flex items-center justify-end gap-1 mt-0.5 -mr-1 opacity-70`}>
                                <span className={`text-[10px] min-w-fit font-medium ${mine ? 'text-black/50 dark:text-white/50' : 'text-muted-foreground'}`}>
                                  {format(new Date(m.createdAt), 'HH:mm')}
                                </span>
                                {mine && (
                                  <div className="flex ml-0.5">
                                    <Check className="h-3 w-3 text-sky-500 scale-x-110" />
                                    <Check className="h-3 w-3 text-sky-500 -ml-1.5 scale-x-110" />
                                  </div>
                                )}
                              </div>

                              {/* Message Actions - Subtle hovering popover potential here */}
                              <button className={`absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/20 rounded-full hover:bg-background/40`}>
                                <MoreVertical className="h-3 w-3 text-muted-foreground" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </>
                  )}
                  <div ref={bottomRef} className="h-1" />
                </div>

                {/* Footer Input */}
                <div className="min-h-[62px] px-4 py-3 bg-muted/40 border-t flex items-end gap-3 shrink-0 backdrop-blur-md">
                  <div className="flex-1 bg-background rounded-2xl border-none ring-1 ring-border/50 flex items-center min-h-[44px] px-4 py-2 shadow-inner-sm focus-within:ring-primary/20 transition-all">
                    <textarea
                      className="w-full bg-transparent resize-none outline-none text-[15px] max-h-[150px] py-1 scrollbar-thin overflow-y-auto placeholder:text-muted-foreground/60"
                      rows={1}
                      placeholder={editing ? 'Edit message...' : t('messages.typeMessage')}
                      ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                      onInput={(e) => { const target = e.target as HTMLTextAreaElement; target.style.height = 'auto'; target.style.height = target.scrollHeight + 'px'; handleDraftChange(target.value); }}
                      value={draft}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          if (editing) editMutation.mutate()
                          else sendMutation.mutate()
                        }
                        if (e.key === 'Escape' && editing) {
                          setEditing(null)
                          setDraft('')
                        }
                      }}
                    />
                  </div>
                  <Button
                    className={`shrink-0 mb-1 h-11 w-11 rounded-full shadow-lg transition-all duration-300 ${draft.trim() ? 'bg-emerald-600 hover:bg-emerald-700 scale-100' : 'bg-muted-foreground/30 scale-95 opacity-50 cursor-not-allowed'}`}
                    size="icon"
                    onClick={() => (editing ? editMutation.mutate() : sendMutation.mutate())}
                    disabled={!selectedConversationId || !draft.trim()}
                  >
                    {sendMutation.isPending || editMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : (editing ? <Check className="h-5 w-5" /> : <Send className="h-5 w-5" />)}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )
      }
    </div>
  )
}

function LaptopIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16" />
    </svg>
  )
}

function LockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

