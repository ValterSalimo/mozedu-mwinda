'use client'

import { useState } from 'react'
import { Button } from '@mozedu/ui'
import { Mail, Globe, Save, Plus, Edit, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { LanguageCode } from '@mozedu/types'

interface EmailTemplate {
  id: string
  templateKey: string
  language: LanguageCode
  subject: string
  body: string
  variables: string[]
  category: 'attendance' | 'grades' | 'general' | 'payment' | 'report'
}

interface EmailTemplateManagerProps {
  schoolId: string
}

// Sample template keys - these would come from backend
const TEMPLATE_CATEGORIES = [
  { key: 'attendance', label: 'Attendance Notifications' },
  { key: 'grades', label: 'Grade Reports' },
  { key: 'general', label: 'General Communications' },
  { key: 'payment', label: 'Payment Reminders' },
  { key: 'report', label: 'Progress Reports' },
]

const LANGUAGES: { code: LanguageCode; name: string }[] = [
  { code: 'pt', name: 'Portuguese' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'tr', name: 'Turkish' },
]

export function EmailTemplateManager({ schoolId }: EmailTemplateManagerProps) {
  const t = useTranslations('emailTemplates')
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('pt')
  const [selectedCategory, setSelectedCategory] = useState('attendance')
  const [isEditing, setIsEditing] = useState(false)

  // Sample templates - would come from API
  const [templates, setTemplates] = useState<EmailTemplate[]>([
    {
      id: '1',
      templateKey: 'student_absent',
      language: 'pt',
      subject: 'Notificação de Ausência - {{studentName}}',
      body: 'Prezado(a) {{parentName}},\n\nInformamos que o(a) aluno(a) {{studentName}} esteve ausente na aula de {{subject}} no dia {{date}}.\n\nPor favor, justifique a ausência através do portal ou contacte a escola.\n\nCordialmente,\n{{schoolName}}',
      variables: ['studentName', 'parentName', 'subject', 'date', 'schoolName'],
      category: 'attendance',
    },
    {
      id: '2',
      templateKey: 'student_absent',
      language: 'en',
      subject: 'Absence Notification - {{studentName}}',
      body: 'Dear {{parentName}},\n\nWe inform you that student {{studentName}} was absent from {{subject}} class on {{date}}.\n\nPlease justify the absence through the portal or contact the school.\n\nBest regards,\n{{schoolName}}',
      variables: ['studentName', 'parentName', 'subject', 'date', 'schoolName'],
      category: 'attendance',
    },
  ])

  const currentTemplates = templates.filter(
    t => t.language === selectedLanguage && t.category === selectedCategory
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          <h3 className="text-lg font-semibold">{t('title')}</h3>
        </div>
        <Button onClick={() => setIsEditing(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Language and Category Selector */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2 flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {t('selectLanguage')}
          </label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value as LanguageCode)}
            className="w-full p-2 border rounded-md"
            aria-label="Select language"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Template Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full p-2 border rounded-md"
            aria-label="Template category"
          >
            {TEMPLATE_CATEGORIES.map((cat) => (
              <option key={cat.key} value={cat.key}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium mb-2">Email Templates</h4>
        <p className="text-sm text-gray-700">
          Email templates allow you to send consistent communications to parents, students, and staff
          in their preferred language. Templates support variables like {'{{studentName}}'}, {'{{date}}'}, etc.
        </p>
      </div>

      {/* Templates List */}
      <div className="space-y-4">
        <h4 className="font-medium">
          {selectedLanguage.toUpperCase()} Templates - {selectedCategory}
        </h4>
        
        {currentTemplates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No templates found for this language and category.
            <br />
            <Button variant="outline" className="mt-4" onClick={() => setIsEditing(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Template
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {currentTemplates.map((template) => (
              <div key={template.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h5 className="font-medium">{template.subject}</h5>
                    <p className="text-sm text-gray-500 mt-1">
                      Key: {template.templateKey}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" aria-label="Edit template">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" aria-label="Delete template">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded p-3 mb-3">
                  <div className="text-sm font-medium mb-1">Subject:</div>
                  <div className="text-sm">{template.subject}</div>
                </div>

                <div className="bg-gray-50 rounded p-3">
                  <div className="text-sm font-medium mb-1">Body:</div>
                  <pre className="text-sm whitespace-pre-wrap font-sans">{template.body}</pre>
                </div>

                <div className="mt-3">
                  <div className="text-sm font-medium mb-1">{t('variables')}:</div>
                  <div className="flex flex-wrap gap-2">
                    {template.variables.map((variable) => (
                      <span
                        key={variable}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                      >
                        {'{{' + variable + '}}'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usage Guide */}
      <div className="rounded-lg bg-gray-50 p-4">
        <h4 className="font-medium mb-2">Usage Guide</h4>
        <div className="text-sm text-gray-700 space-y-2">
          <p>
            <strong>Available Variables:</strong> Use variables in your templates to personalize emails:
          </p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li><code>{'{{studentName}}'}</code> - Student&apos;s full name</li>
            <li><code>{'{{parentName}}'}</code> - Parent/Guardian name</li>
            <li><code>{'{{schoolName}}'}</code> - School name</li>
            <li><code>{'{{date}}'}</code> - Current or relevant date</li>
            <li><code>{'{{subject}}'}</code> - Subject/course name</li>
            <li><code>{'{{grade}}'}</code> - Grade or score</li>
            <li><code>{'{{term}}'}</code> - Academic term</li>
          </ul>
          <p className="mt-3">
            <strong>Best Practices:</strong>
          </p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Keep subject lines clear and concise</li>
            <li>Use formal, respectful language</li>
            <li>Include all necessary context</li>
            <li>Test templates before deploying</li>
            <li>Maintain consistent formatting across languages</li>
          </ul>
        </div>
      </div>

      {/* Note about backend integration */}
      <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Email template management requires backend integration. 
          Contact your system administrator to enable this feature.
        </p>
      </div>
    </div>
  )
}
