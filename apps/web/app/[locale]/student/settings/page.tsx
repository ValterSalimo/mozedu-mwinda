'use client'

import { useState } from 'react'
import { User, Bell, Lock, Globe, Moon, Sun, Save } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@mozedu/ui'
import { useTranslations } from 'next-intl'

export default function SettingsPage() {
  const t = useTranslations('student')
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [language, setLanguage] = useState('en')
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    push: true,
    grades: true,
    attendance: true,
    messages: true,
  })

  const handleSave = () => {
    alert(t('settings.savedSuccess'))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <CardTitle>{t('settings.profileInfo')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.firstName')}
              </label>
              <input
                type="text"
                defaultValue="Jean"
                className="w-full px-4 py-2 rounded-lg border border-input bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.lastName')}
              </label>
              <input
                type="text"
                defaultValue="Kabila"
                className="w-full px-4 py-2 rounded-lg border border-input bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('settings.emailAddress')}
            </label>
            <input
              type="email"
              defaultValue="jean.kabila@student.mozedu.mz"
              className="w-full px-4 py-2 rounded-lg border border-input bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('settings.phoneNumber')}
            </label>
            <input
              type="tel"
              defaultValue="+243 999 123 456"
              className="w-full px-4 py-2 rounded-lg border border-input bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <CardTitle>{t('settings.appearance')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('settings.theme')}
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${theme === 'light'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
              >
                <Sun className="h-4 w-4" />
                {t('settings.light')}
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${theme === 'dark'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
              >
                <Moon className="h-4 w-4" />
                {t('settings.dark')}
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${theme === 'system'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
              >
                {t('settings.system')}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <CardTitle>{t('settings.languageRegion')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('settings.language')}
            </label>
            <select
              value={language}
              onChange={(e) => {
                const newLocale = e.target.value
                setLanguage(newLocale)

                // Save to cookie
                document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`

                // Save to localStorage
                localStorage.setItem('preferredLanguage', newLocale)

                // Reload page to apply new language
                const currentPath = window.location.pathname.replace(/^\/(fr|en)/, '') || '/'
                window.location.href = `/${newLocale}${currentPath}`
              }}
              className="w-full px-4 py-2 rounded-lg border border-input bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              <option value="fr">🇨🇩 Français (French) - Default</option>
              <option value="en">🇬🇧 English</option>
            </select>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {t('settings.languageNote')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <CardTitle>{t('settings.notifications')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              {t('settings.notificationChannels')}
            </h4>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-700 dark:text-gray-300">{t('settings.emailNotifications')}</span>
                <input
                  type="checkbox"
                  checked={notifications.email}
                  onChange={(e) =>
                    setNotifications({ ...notifications, email: e.target.checked })
                  }
                  className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-700 dark:text-gray-300">{t('settings.smsNotifications')}</span>
                <input
                  type="checkbox"
                  checked={notifications.sms}
                  onChange={(e) =>
                    setNotifications({ ...notifications, sms: e.target.checked })
                  }
                  className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-700 dark:text-gray-300">{t('settings.pushNotifications')}</span>
                <input
                  type="checkbox"
                  checked={notifications.push}
                  onChange={(e) =>
                    setNotifications({ ...notifications, push: e.target.checked })
                  }
                  className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
                />
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              {t('settings.notificationTypes')}
            </h4>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-700 dark:text-gray-300">{t('settings.gradeUpdates')}</span>
                <input
                  type="checkbox"
                  checked={notifications.grades}
                  onChange={(e) =>
                    setNotifications({ ...notifications, grades: e.target.checked })
                  }
                  className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-700 dark:text-gray-300">{t('settings.attendanceAlerts')}</span>
                <input
                  type="checkbox"
                  checked={notifications.attendance}
                  onChange={(e) =>
                    setNotifications({ ...notifications, attendance: e.target.checked })
                  }
                  className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-700 dark:text-gray-300">{t('settings.newMessages')}</span>
                <input
                  type="checkbox"
                  checked={notifications.messages}
                  onChange={(e) =>
                    setNotifications({ ...notifications, messages: e.target.checked })
                  }
                  className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
                />
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <CardTitle>{t('settings.security')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('settings.currentPassword')}
            </label>
            <input
              type="password"
              placeholder={t('settings.currentPasswordPlaceholder')}
              className="w-full px-4 py-2 rounded-lg border border-input bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('settings.newPassword')}
            </label>
            <input
              type="password"
              placeholder={t('settings.newPasswordPlaceholder')}
              className="w-full px-4 py-2 rounded-lg border border-input bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('settings.confirmPassword')}
            </label>
            <input
              type="password"
              placeholder={t('settings.confirmPasswordPlaceholder')}
              className="w-full px-4 py-2 rounded-lg border border-input bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors font-medium"
        >
          <Save className="h-5 w-5" />
          {t('settings.saveChanges')}
        </button>
      </div>
    </div>
  )
}
