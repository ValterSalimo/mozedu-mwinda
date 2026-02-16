import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Notification {
    id: string
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    createdAt: string
    read: boolean
    link?: string
}

interface NotificationState {
    notifications: Notification[]
    unreadCount: number
    addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void
    markAsRead: (id: string) => void
    markAllAsRead: () => void
    removeNotification: (id: string) => void
    clearAll: () => void
}

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set, get) => ({
            notifications: [
                {
                    id: '1',
                    title: 'Bienvenue sur Mwinda',
                    message: 'Explorez les nouvelles fonctionnalités de votre portail.',
                    type: 'info',
                    createdAt: new Date().toISOString(),
                    read: false,
                },
                {
                    id: '2',
                    title: 'Horário Atualizado',
                    message: 'O horário da turma 10A foi atualizado para o próximo trimestre.',
                    type: 'warning',
                    createdAt: new Date(Date.now() - 3600000).toISOString(),
                    read: false,
                }
            ],
            unreadCount: 2,

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

            markAsRead: (id) => {
                set((state) => {
                    const notifications = state.notifications.map((n) =>
                        n.id === id ? { ...n, read: true } : n
                    )
                    const unreadCount = notifications.filter((n) => !n.read).length
                    return { notifications, unreadCount }
                })
            },

            markAllAsRead: () => {
                set((state) => ({
                    notifications: state.notifications.map((n) => ({ ...n, read: true })),
                    unreadCount: 0,
                }))
            },

            removeNotification: (id) => {
                set((state) => {
                    const notifications = state.notifications.filter((n) => n.id !== id)
                    const unreadCount = notifications.filter((n) => !n.read).length
                    return { notifications, unreadCount }
                })
            },

            clearAll: () => {
                set({ notifications: [], unreadCount: 0 })
            },
        }),
        {
            name: 'Mwinda-notifications',
        }
    )
)
