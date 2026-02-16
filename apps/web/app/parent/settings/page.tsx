'use client'

import { useState } from 'react'
import { Button, Badge, Input, Label, Card, CardHeader, CardTitle, CardContent } from '@mozedu/ui'
import { useTranslations } from 'next-intl'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Bell,
  Globe,
  CreditCard,
  Shield,
  Users,
  Save,
  Camera,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Loader2
} from 'lucide-react'
import { useTheme } from '../../theme-provider'
import { useLanguage } from '../../language-provider'
import { useUser, useAuthStore } from '@/lib/stores/auth-store'
import { useParentChildren } from '@/lib/hooks/use-parent'
import { useParentId, useCurrentEntity } from '@/lib/hooks/use-current-entity'
import { toast } from 'sonner'
import Image from 'next/image'

export default function SettingsPage() {
  const t = useTranslations('parent.settings')
  const tCommon = useTranslations('common')
  const [activeSection, setActiveSection] = useState('profile')
  const { theme, setTheme } = useTheme()
  const { locale, setLocale } = useLanguage()
  const user = useUser()

  // Ensure entity is resolved
  useCurrentEntity()
  const parentId = useParentId() || user?.entityId || ''

  // Attempt to fetch children - assuming hook works if it exists, otherwise empty
  // Note: useParentChildren might need an import fix if file structure differs, using best guess from context
  const { data: children = [], isLoading: isLoadingChildren } = useParentChildren(parentId)

  const sections = [
    { id: 'profile', name: t('profile') || 'Profile', icon: User },
    { id: 'notifications', name: t('notifications') || 'Notifications', icon: Bell },
    { id: 'children', name: t('children') || 'Children', icon: Users },
    { id: 'payment', name: t('payment') || 'Payments', icon: CreditCard },
    { id: 'appearance', name: t('appearance') || 'Appearance', icon: Sun },
    { id: 'language', name: t('language') || 'Language', icon: Globe },
    { id: 'security', name: t('security') || 'Security', icon: Shield },
  ]

  if (!user) return null

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">{t('title') || 'Settings'}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('subtitle') || 'Manage your account and preferences'}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${activeSection === section.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground hover:bg-muted'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <span>{section.name}</span>
                    </div>
                    {activeSection === section.id && <ChevronRight className="h-4 w-4" />}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Section */}
          {activeSection === 'profile' && (
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <h2 className="text-xl font-bold text-foreground mb-6">{t('profile') || 'Profile Information'}</h2>

              {/* Avatar */}
              <div className="flex items-center gap-6 mb-6 pb-6 border-b border-border">
                <div className="relative group">
                  <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-3xl overflow-hidden relative">
                    {user.profileImageUrl ? (
                      <Image src={user.profileImageUrl} alt={t('profileAlt')} fill className="object-cover" />
                    ) : (
                      <User className="h-10 w-10" />
                    )}
                  </div>
                  {/* Image Upload Coming Soon */}
                  <div className="absolute bottom-0 right-0 p-2 bg-muted rounded-full shadow-lg border border-border opacity-50 cursor-not-allowed">
                    <Camera className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{user.firstName} {user.lastName}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <Badge variant="secondary" className="mt-2">{t('editPhotoComingSoon')}</Badge>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>{t('firstName')}</Label>
                    <Input value={user.firstName} readOnly className="bg-muted" />
                  </div>
                  <div>
                    <Label>{t('lastName')}</Label>
                    <Input value={user.lastName} readOnly className="bg-muted" />
                  </div>
                </div>

                <div>
                  <Label>{t('email')}</Label>
                  <Input value={user.email} readOnly className="bg-muted" />
                </div>

                <div>
                  <Label>{t('phone')}</Label>
                  <Input value={user.phone || ''} placeholder={t('notSet')} readOnly className="bg-muted" />
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  {t('contactAdminToUpdate')}
                </div>
              </div>
            </div>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border opacity-80">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">{t('notifications') || 'Notifications'}</h2>
                <Badge variant="secondary">{t('comingSoon')}</Badge>
              </div>
              <p className="text-muted-foreground">
                {t('notificationsDescription')}
              </p>
            </div>
          )}

          {/* Children Section */}
          {activeSection === 'children' && (
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">{t('myChildren')}</h2>
                {/* Adding children is usually admin task */}
              </div>

              {isLoadingChildren ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
              ) : children && children.length > 0 ? (
                <div className="space-y-4">
                  {children.map((child: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold overflow-hidden relative">
                          {child.profileImageUrl ? (
                            <Image src={child.profileImageUrl} alt={child.firstName} fill className="object-cover" />
                          ) : (
                            <span>{child.firstName?.[0]}{child.lastName?.[0]}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{child.firstName} {child.lastName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {child.class?.name || t('noClass')} • {child.studentNumber || t('noId')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">{t('noChildrenLinked')}</p>
              )}
            </div>
          )}

          {/* Payment Section */}
          {activeSection === 'payment' && (
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border opacity-80">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">{t('payment') || 'Payment Methods'}</h2>
                <Badge variant="secondary">{t('comingSoon')}</Badge>
              </div>
              <p className="text-muted-foreground">
                {t('paymentDescription')}
              </p>
            </div>
          )}

          {/* Language Section */}
          {activeSection === 'language' && (
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <h2 className="text-xl font-bold text-foreground mb-6">{t('language') || 'Language'}</h2>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-foreground mb-2">{t('systemLanguage')}</label>
                {[
                  { code: 'pt', name: 'Português', flag: '🇲🇿' },
                  { code: 'en', name: 'English', flag: '🇬🇧' },
                  { code: 'fr', name: 'Français', flag: '🇫🇷' },
                  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
                ].map((lang) => (
                  <label
                    key={lang.code}
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${locale === lang.code
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{lang.flag}</span>
                      <span className="font-medium text-foreground">{lang.name}</span>
                    </div>
                    <input
                      type="radio"
                      name="language"
                      checked={locale === lang.code}
                      onChange={() => setLocale(lang.code as any)}
                      className="h-4 w-4 text-primary focus:ring-primary"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Appearance Section */}
          {activeSection === 'appearance' && (
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <h2 className="text-xl font-bold text-foreground mb-6">{t('appearance') || 'Appearance'}</h2>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-foreground mb-2">{t('theme')}</label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex flex-col items-center gap-3 p-6 border-2 rounded-xl transition-all ${theme === 'light'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted'
                      }`}
                  >
                    <Sun className="h-8 w-8 text-primary" />
                    <div className="text-center">
                      <p className="font-medium text-foreground">{t('light')}</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col items-center gap-3 p-6 border-2 rounded-xl transition-all ${theme === 'dark'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted'
                      }`}
                  >
                    <Moon className="h-8 w-8 text-primary" />
                    <div className="text-center">
                      <p className="font-medium text-foreground">{t('dark')}</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setTheme('system')}
                    className={`flex flex-col items-center gap-3 p-6 border-2 rounded-xl transition-all ${theme === 'system'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted'
                      }`}
                  >
                    <Monitor className="h-8 w-8 text-primary" />
                    <div className="text-center">
                      <p className="font-medium text-foreground">{t('system')}</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border opacity-80">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">{t('security') || 'Security'}</h2>
                <Badge variant="secondary">{t('comingSoon')}</Badge>
              </div>
              <p className="text-muted-foreground">
                {t('securityDescription')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
