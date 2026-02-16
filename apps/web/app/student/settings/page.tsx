'use client'

import { useState, useRef } from 'react'
import { User, Bell, Lock, Globe, Moon, Sun, Save, Monitor, Loader2, Camera, Upload } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Badge } from '@mozedu/ui'
import { useTranslations } from 'next-intl'
import { useTheme } from '../../theme-provider'
import { useLanguage } from '../../language-provider'
import { useUser, useAuthStore } from '@/lib/stores/auth-store'
import { studentsApi } from '@/lib/api'
import { toast } from 'sonner'
import Image from 'next/image'

export default function SettingsPage() {
  const t = useTranslations('student')
  const { theme, setTheme } = useTheme()
  const { locale, setLocale } = useLanguage()
  const user = useUser()
  const checkAuth = useAuthStore(state => state.checkAuth)

  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.entityId) return

    setIsUploading(true)
    try {
      await studentsApi.uploadProfileImage(user.entityId, file)
      await checkAuth() // Refresh user profile to show new image
      toast.success(t('settings.imageUpdated'))
    } catch (error) {
      console.error(error)
      toast.error(t('settings.imageUpdateFailed'))
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate save for preferences
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
    toast.success(t('settings.savedSuccess'))
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('settings.title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <CardTitle>{t('settings.profileInfo')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image Upload */}
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-primary/10 border-2 border-border relative">
                {user.profileImageUrl ? (
                  <Image src={user.profileImageUrl} alt={t('profile')} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="h-10 w-10 text-primary" />
                  </div>
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
                className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
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
              <h3 className="text-lg font-medium">{user.firstName} {user.lastName}</h3>
              <p className="text-sm text-muted-foreground">{user.role}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('settings.clickCameraToUpdate')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{t('settings.firstName')}</Label>
              <Input value={user.firstName} readOnly className="bg-muted" />
            </div>
            <div>
              <Label>{t('settings.lastName')}</Label>
              <Input value={user.lastName} readOnly className="bg-muted" />
            </div>
          </div>

          <div>
            <Label>{t('settings.email')}</Label>
            <Input value={user.email} readOnly className="bg-muted" />
          </div>

          <div>
            <Label>{t('settings.phone')}</Label>
            <Input value={user.phone || ''} placeholder={t('settings.noPhoneSet')} readOnly className="bg-muted" />
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
            <Lock className="h-4 w-4" />
            {t('settings.contactAdminToUpdate')}
          </div>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-muted-foreground" />
            <CardTitle>{t('settings.appearance')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">{t('settings.theme')}</Label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${theme === 'light'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:bg-accent'
                  }`}
              >
                <Sun className="h-5 w-5" />
                <span className="text-sm">{t('settings.light')}</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${theme === 'dark'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:bg-accent'
                  }`}
              >
                <Moon className="h-5 w-5" />
                <span className="text-sm">{t('settings.dark')}</span>
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`flex flex-col items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${theme === 'system'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:bg-accent'
                  }`}
              >
                <Monitor className="h-5 w-5" />
                <span className="text-sm">{t('settings.system')}</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <CardTitle>{t('settings.language')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div>
            <Label className="mb-2 block">{t('settings.selectLanguage')}</Label>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as 'pt' | 'en' | 'fr' | 'tr')}
              className="w-full px-4 py-2 rounded-lg border border-input bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              <option value="pt">🇲🇿 Português (Portuguese)</option>
              <option value="en">🇬🇧 English</option>
              <option value="fr">🇫🇷 Français (French)</option>
              <option value="tr">🇹🇷 Türkçe (Turkish)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings (Coming Soon) */}
      <Card className="opacity-75">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <CardTitle>{t('settings.notifications')}</CardTitle>
            </div>
            <Badge variant="secondary">{t('comingSoon')}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Advanced notification preferences controls are coming soon. You will currently receive alerts for important updates.
          </p>
        </CardContent>
      </Card>

      {/* Security Settings (Coming Soon) */}
      <Card className="opacity-75">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <CardTitle>{t('settings.security')}</CardTitle>
            </div>
            <Badge variant="secondary">{t('comingSoon')}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Self-service password change and 2FA settings will be available shortly. Please contact IT support for urgent security changes.
          </p>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {t('settings.saveChanges')}
        </Button>
      </div>
    </div>
  )
}
