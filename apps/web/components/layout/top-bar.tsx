'use client'

import { useState } from 'react'
import { Menu, Search, Sun, Moon, LogOut, User, Settings as SettingsIcon } from 'lucide-react'
import { Button, Input } from '@mozedu/ui'
import { LanguageSwitcher } from '../language-switcher'
import { NotificationDropdown } from './notification-dropdown'
import { useTranslations } from 'next-intl'
import { useUser, useAuthStore } from '@/lib/stores'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface TopBarProps {
    toggleSidebar: () => void
    roleLabel?: string
    extraActions?: React.ReactNode
}

export function TopBar({ toggleSidebar, roleLabel, extraActions }: TopBarProps) {
    const [isDark, setIsDark] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const t = useTranslations('common')
    const user = useUser()
    const logout = useAuthStore((state) => state.logout)
    const router = useRouter()

    const toggleTheme = () => {
        setIsDark(!isDark)
        document.documentElement.classList.toggle('dark')
    }

    const handleLogout = async () => {
        await logout()
        router.push('/auth/login')
    }

    const initials = user
        ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase()
        : 'U'

    const displayName = user ? `${user.firstName} ${user.lastName}` : (roleLabel || 'User')

    return (
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between px-4 lg:px-6 gap-4 shadow-sm">
            {/* Search and Mobile Menu */}
            <div className="flex items-center gap-4 flex-1">
                <button
                    onClick={toggleSidebar}
                    className="lg:hidden p-2 rounded-xl hover:bg-primary/10 transition-all duration-200"
                >
                    <Menu className="h-6 w-6" />
                </button>

                <div className="flex-1 max-w-md hidden md:block group">
                    <Input
                        type="search"
                        placeholder={t('search')}
                        className="bg-slate-50 dark:bg-slate-800/50 border-0 ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-700 transition-all rounded-xl shadow-inner"
                        leftIcon={<Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />}
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 md:gap-4">
                {extraActions}

                <div className="hidden sm:flex items-center gap-2">
                    <LanguageSwitcher />
                    <div className="h-4 w-[1px] bg-border mx-1" />
                </div>

                <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-xl hover:bg-muted/80">
                    {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>

                <NotificationDropdown />

                {/* User Profile Dropdown */}
                <div className="relative ml-2">
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-3 p-1 rounded-xl hover:bg-muted/80 transition-all group"
                    >
                        <div className="relative">
                            {user?.profileImageUrl ? (
                                <Image src={user.profileImageUrl} alt={displayName} width={36} height={36} className="h-9 w-9 rounded-xl object-cover ring-2 ring-transparent group-hover:ring-primary/20 transition-all" />
                            ) : (
                                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                                    {initials}
                                </div>
                            )}
                            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 ring-2 ring-card" />
                        </div>

                        <div className="hidden lg:block text-left mr-1">
                            <p className="text-sm font-bold text-foreground leading-tight truncate max-w-[120px]">{user?.firstName || 'User'}</p>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{roleLabel || t('student')}</p>
                        </div>
                    </button>

                    {isProfileOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)} />
                            <div className="absolute right-0 mt-2 w-56 rounded-2xl shadow-2xl bg-card/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-slate-900/5 dark:ring-white/10">
                                <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-br from-primary/5 to-cyan-500/5">
                                    <p className="text-sm font-bold text-foreground">{displayName}</p>
                                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                                </div>

                                <div className="p-2">
                                    <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-primary/10 hover:text-primary rounded-xl transition-all duration-200 group">
                                        <User className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                        {t('myProfile')}
                                    </button>
                                    <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-primary/10 hover:text-primary rounded-xl transition-all duration-200 group">
                                        <SettingsIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                        {t('configurations')}
                                    </button>
                                </div>

                                <div className="p-2 border-t border-slate-200/50 dark:border-slate-700/50">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 rounded-xl transition-all duration-200"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        {t('logout')}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    )
}
