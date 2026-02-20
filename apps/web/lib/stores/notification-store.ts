import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiClient } from '../api'

export interface Notification {
    id: string
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    category: string
    createdAt: string
    read: boolean
    link?: string
    referenceId?: string
    referenceType?: string
}

interface BackendNotification {
    id: string
    user_id: string
    school_id?: string | null
    title: string
    message: string
    type: string // INFO, WARNING, ERROR, SUCCESS
    category: string // SYSTEM, ATTENDANCE, GRADE, PAYMENT, COMMUNICATION
    link?: string | null
    reference_id?: string | null
    reference_type?: string | null
    is_read: boolean
    read_at?: string | null
    created_at: string
}

interface NotificationsResponse {
    notifications: BackendNotification[]
    total: number
    limit: number
    offset: number
}

function mapNotification(n: BackendNotification): Notification {
    return {
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type.toLowerCase() as Notification['type'],
        category: n.category || 'SYSTEM',
        createdAt: n.created_at,
        read: n.is_read,
        link: n.link ?? undefined,
        referenceId: n.reference_id ?? undefined,
        referenceType: n.reference_type ?? undefined,
    }
}

interface NotificationState {
    notifications: Notification[]
    unreadCount: number
    loading: boolean
    lastFetched: number | null
    fetchNotifications: () => Promise<void>
    addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void
    markAsRead: (id: string) => void
    markAllAsRead: () => void
    removeNotification: (id: string) => void
    clearAll: () => void
}

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set, get) => ({
            notifications: [],
            unreadCount: 0,
            loading: false,
            lastFetched: null,

            fetchNotifications: async () => {
                const now = Date.now()
                const last = get().lastFetched
                if (last && now - last < 10000) return

                set({ loading: true })
                try {
                    const data = await apiClient<NotificationsResponse>('/api/v1/notifications?limit=50')
                    const notifications = (data.notifications || []).map(mapNotification)
                    const unreadCount = notifications.filter((n) => !n.read).length
                    set({ notifications, unreadCount, lastFetched: now })
                } catch {
                    // Silently fail — keep existing cache
                } finally {
                    set({ loading: false })
                }
            },

            addNotification: (notification) => {
                const newNotification: Notification = {
                    ...notification,
                    id: Math.random().toString(36).substring(7),
                    createdAt: new Date().toISOString(),
                    read: false,
                }
                set((state) => ({
                    notifications: [newNotification, ...state.notifications],
                    unreadCount: state.unreadCount + 1,
                }))
            },

            markAsRead: async (id) => {
                set((state) => {
                    const notifications = state.notifications.map((n) =>
                        n.id === id ? { ...n, read: true } : n
                    )
                    const unreadCount = notifications.filter((n) => !n.read).length
                    return { notifications, unreadCount }
                })
                try {
                    await apiClient(`/api/v1/notifications/${id}/read`, { method: 'PATCH' })
                } catch {
                    get().fetchNotifications()
                }
            },

            markAllAsRead: async () => {
                set((state) => ({
                    notifications: state.notifications.map((n) => ({ ...n, read: true })),
                    unreadCount: 0,
                }))
                try {
                    await apiClient('/api/v1/notifications/read-all', { method: 'PATCH' })
                } catch {
                    get().fetchNotifications()
                }
            },

            removeNotification: async (id) => {
                const prev = get().notifications
                set((state) => {
                    const notifications = state.notifications.filter((n) => n.id !== id)
                    const unreadCount = notifications.filter((n) => !n.read).length
                    return { notifications, unreadCount }
                })
                try {
                    await apiClient(`/api/v1/notifications/${id}`, { method: 'DELETE' })
                } catch {
                    set({ notifications: prev, unreadCount: prev.filter((n) => !n.read).length })
                }
            },

            clearAll: async () => {
                const prev = get().notifications
                set({ notifications: [], unreadCount: 0 })
                try {
                    await apiClient('/api/v1/notifications', { method: 'DELETE' })
                } catch {
                    set({ notifications: prev, unreadCount: prev.filter((n) => !n.read).length })
                }
            },
        }),
        {
            name: 'mwinda-notifications',
        }
    )
)
