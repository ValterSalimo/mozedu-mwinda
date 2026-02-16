'use client'

import { useState, useRef, useEffect } from 'react'
import { Button, Badge, Input, Label } from '@mozedu/ui'
import { useTranslations } from 'next-intl'
import { Loader2, User, Bell, Shield, Globe, Moon, Sun, Save, Camera, Lock, Monitor } from 'lucide-react'
import { useUser, useAuthStore } from '@/lib/stores/auth-store'
import { teachersApi } from '@/lib/api'
import { toast } from 'sonner'
import { useTheme } from '../../theme-provider'
import Image from 'next/image'

export default function SettingsPage() {
  const t = useTranslations('teacher')
  const tCommon = useTranslations('common')
  const user = useUser()
  const checkAuth = useAuthStore(state => state.checkAuth)
  const { theme, setTheme } = useTheme()

  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.entityId) return

    setIsUploading(true)
    try {
      await teachersApi.uploadProfileImage(user.entityId, file)
      await checkAuth() // Refresh user profile
      toast.success(tCommon('success') || 'Profile updated')
    } catch (error) {
      console.error(error)
      toast.error(tCommon('error') || 'Failed to update profile')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
    toast.success(tCommon('saved') || 'Settings saved')
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{tCommon('settings')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('settings.subtitle')}</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {tCommon('save')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <div className="flex items-center gap-2 mb-6">
              <User className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">{t('settings.profile')}</h2>
            </div>

            <div className="flex items-center gap-6 mb-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-border relative">
                  {user.profileImageUrl ? (
                    <Image src={user.profileImageUrl} alt="Profile" fill className="object-cover" />
                  ) : (
                    <User className="h-10 w-10 text-primary" />
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-0 right-0 p-2 bg-primary rounded-full text-white shadow-lg hover:bg-primary/90 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
              <div>
                <p className="font-medium text-foreground text-lg">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click camera icon to change photo
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>{t('settings.firstName')}</Label>
                <Input defaultValue={user.firstName} readOnly className="bg-muted" />
              </div>
              <div>
                <Label>{t('settings.lastName')}</Label>
                <Input defaultValue={user.lastName} readOnly className="bg-muted" />
              </div>
              <div>
                <Label>{t('settings.email')}</Label>
                <Input defaultValue={user.email} readOnly className="bg-muted" />
              </div>
              <div>
                <Label>{t('settings.phone')}</Label>
                <Input defaultValue={user.phone || ''} placeholder={t('settings.phonePlaceholder')} readOnly className="bg-muted" />
              </div>
            </div>

            <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
              <Lock className="h-4 w-4" />
              {t('settings.contactAdminForDetails')}
            </div>
          </div>

          {/* Notification Settings (Simplified/Coming Soon) */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border opacity-80">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">{t('settings.notifications')}</h2>
              </div>
              <Badge variant="secondary">{t('settings.comingSoon')}</Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              {t('settings.notificationComingSoon')}
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Appearance */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">{t('settings.appearance')}</h2>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">{t('settings.theme')}</Label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${theme === 'light' ? 'border-primary bg-primary/10' : 'border-border'}`}
                  >
                    <Sun className="h-4 w-4" />
                    <span className="text-sm">{t('settings.light')}</span>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${theme === 'dark' ? 'border-primary bg-primary/10' : 'border-border'}`}
                  >
                    <Moon className="h-4 w-4" />
                    <span className="text-sm">{t('settings.dark')}</span>
                  </button>
                  <button
                    onClick={() => setTheme('system')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${theme === 'system' ? 'border-primary bg-primary/10' : 'border-border'}`}
                  >
                    <Monitor className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Security (Coming Soon) */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border opacity-80">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">{t('settings.security')}</h2>
              </div>
              <Badge variant="secondary">{t('settings.comingSoon')}</Badge>
            </div>

            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" disabled>
                {t('settings.changePassword')}
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled>
                {t('settings.twoFactor')}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {t('settings.contactITForSecurity')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
