'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, Trash2, Clock, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react'
import { Button } from '@mozedu/ui'
import { useNotificationStore } from '@/lib/stores/notification-store'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

export function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false)
    const t = useTranslations('common')
    const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll, fetchNotifications } = useNotificationStore()

    // Fetch on mount + poll every 30s
    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [fetchNotifications])

    const formatDistance = (date: string) => {
        const now = new Date()
        const diff = now.getTime() - new Date(date).getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)

        if (days > 0) return `${days}d`
        if (hours > 0) return `${hours}h`
        if (minutes > 0) return `${minutes}m`
        return t('justNow')
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
            case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-500" />
            case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />
            default: return <Info className="h-4 w-4 text-blue-500" />
        }
    }

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className="relative rounded-xl hover:bg-muted/80"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute right-2 top-2 h-2.5 w-2.5 bg-red-500 rounded-full ring-2 ring-background animate-pulse"></span>
                )}
            </Button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    <div className="absolute right-0 mt-2 w-80 md:w-96 rounded-2xl shadow-2xl bg-card border border-border z-20 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                            <h3 className="font-bold text-foreground">{t('notifications')}</h3>
                            <div className="flex gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                    >
                                        <Check className="h-3 w-3" />
                                        {t('markAllRead')}
                                    </button>
                                )}
                                <button
                                    onClick={clearAll}
                                    className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
                                >
                                    <Trash2 className="h-3 w-3" />
                                    {t('clearAll')}
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto overflow-x-hidden p-2 space-y-1">
                            {notifications.length > 0 ? (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => markAsRead(notification.id)}
                                        className={`p-3 rounded-xl transition-all cursor-pointer group relative ${notification.read ? 'hover:bg-muted/50' : 'bg-primary/5 hover:bg-primary/10'
                                            }`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-1 flex-shrink-0">
                                                {getIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <p className={`text-sm font-semibold truncate pr-6 ${notification.read ? 'text-foreground/80' : 'text-foreground'
                                                        }`}>
                                                        {notification.title}
                                                    </p>
                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                                                        <Clock className="h-2 w-2" />
                                                        {formatDistance(notification.createdAt)}
                                                    </span>
                                                </div>
                                                <p className={`text-xs break-words ${notification.read ? 'text-muted-foreground' : 'text-foreground/70'
                                                    }`}>
                                                    {notification.message}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                removeNotification(notification.id)
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                        {!notification.read && (
                                            <div className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center space-y-3">
                                    <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                                        <Bell className="h-6 w-6 text-muted-foreground/50" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-foreground">{t('noNotifications')}</p>
                                        <p className="text-xs text-muted-foreground">{t('noNotificationsDesc')}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-3 bg-muted/30 border-t border-border mt-1">
                            <Link href="#view-all" className="w-full">
                                <Button variant="ghost" className="w-full text-xs h-8 text-primary hover:text-primary/80">
                                    {t('viewAll')}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
