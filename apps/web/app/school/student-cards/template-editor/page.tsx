'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Button,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@mozedu/ui'
import {
  ArrowLeft,
  CreditCard,
  Eye,
  Code,
  Palette,
  RotateCcw,
  Save,
  Loader2,
  CheckCircle2,
  Smartphone,
  Monitor,
  FlipHorizontal,
} from 'lucide-react'
import Link from 'next/link'
import {
  useCardTemplates,
  usePreviewTemplate,
  usePreviewCustomHTML,
  useUpdateTemplate,
  useSchoolCardSettings,
  useUpdateSchoolCardSettings,
  type StudentCardTemplate,
} from '@/lib/hooks/use-student-cards'
import { useCurrentEntity } from '@/lib/hooks/use-current-entity'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

// ============================================================================
// Template Editor Page
// ============================================================================

export default function CardTemplateEditorPage() {
  const t = useTranslations('school')
  const { schoolId } = useCurrentEntity()
  const { data: templates, isLoading: loadingTemplates } = useCardTemplates()
  const { data: settings } = useSchoolCardSettings(schoolId || '')
  const updateTemplate = useUpdateTemplate()
  const updateSettings = useUpdateSchoolCardSettings()
  const previewTemplate = usePreviewTemplate()
  const previewCustom = usePreviewCustomHTML()

  // State
  const [selectedTemplate, setSelectedTemplate] = useState<StudentCardTemplate | null>(null)
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front')
  const [editorMode, setEditorMode] = useState<'visual' | 'code'>('visual')
  const [previewHtml, setPreviewHtml] = useState<string>('')
  const [frontHtml, setFrontHtml] = useState<string>('')
  const [backHtml, setBackHtml] = useState<string>('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Colors (from settings, editable locally)
  const [primaryColor, setPrimaryColor] = useState('#1e40af')
  const [secondaryColor, setSecondaryColor] = useState('#ffffff')
  const [accentColor, setAccentColor] = useState('#f59e0b')

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Initialize from settings
  useEffect(() => {
    if (settings) {
      setPrimaryColor(settings.primary_color || '#1e40af')
      setSecondaryColor(settings.secondary_color || '#ffffff')
      setAccentColor(settings.accent_color || '#f59e0b')
    }
  }, [settings])

  // Auto-select first template
  useEffect(() => {
    if (templates && templates.length > 0 && !selectedTemplate) {
      const active = templates.find((t) => t.id === settings?.template_id) || templates[0]
      handleSelectTemplate(active)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates, settings])

  // Handle template selection
  const handleSelectTemplate = useCallback(
    (tmpl: StudentCardTemplate) => {
      setSelectedTemplate(tmpl)
      setFrontHtml(tmpl.front_html || '')
      setBackHtml(tmpl.back_html || '')
      setHasUnsavedChanges(false)

      // Fetch server-rendered preview
      if (schoolId) {
        previewTemplate.mutate(
          { templateId: tmpl.id, schoolId, side: activeSide },
          {
            onSuccess: (data) => {
              setPreviewHtml(data.html || '')
            },
          }
        )
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [schoolId, activeSide]
  )

  // Debounced preview update when HTML or colors change
  const triggerPreview = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      previewCustom.mutate(
        {
          front_html: frontHtml,
          back_html: backHtml,
          side: activeSide,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          accent_color: accentColor,
        },
        {
          onSuccess: (data) => {
            setPreviewHtml(data.html || '')
          },
        }
      )
    }, 600)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frontHtml, backHtml, activeSide, primaryColor, secondaryColor, accentColor])

  // Switch card side
  const handleSideChange = (side: 'front' | 'back') => {
    setActiveSide(side)
    if (selectedTemplate && schoolId && !hasUnsavedChanges) {
      previewTemplate.mutate(
        { templateId: selectedTemplate.id, schoolId, side },
        {
          onSuccess: (data) => setPreviewHtml(data.html || ''),
        }
      )
    } else {
      previewCustom.mutate(
        {
          front_html: frontHtml,
          back_html: backHtml,
          side,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          accent_color: accentColor,
        },
        {
          onSuccess: (data) => setPreviewHtml(data.html || ''),
        }
      )
    }
  }

  // Color change handler
  const handleColorChange = (type: 'primary' | 'secondary' | 'accent', value: string) => {
    if (type === 'primary') setPrimaryColor(value)
    else if (type === 'secondary') setSecondaryColor(value)
    else setAccentColor(value)
    setHasUnsavedChanges(true)
  }

  // Trigger preview when colors change
  useEffect(() => {
    if (selectedTemplate && hasUnsavedChanges) {
      triggerPreview()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryColor, secondaryColor, accentColor])

  // HTML change handler
  const handleHtmlChange = (html: string) => {
    if (activeSide === 'front') {
      setFrontHtml(html)
    } else {
      setBackHtml(html)
    }
    setHasUnsavedChanges(true)
    triggerPreview()
  }

  // Save template
  const handleSave = async () => {
    if (!selectedTemplate) return
    try {
      await updateTemplate.mutateAsync({
        id: selectedTemplate.id,
        data: {
          front_html: frontHtml,
          back_html: backHtml,
        },
      })
      // Also save colors
      if (schoolId) {
        await updateSettings.mutateAsync({
          schoolId,
          data: {
            primary_color: primaryColor,
            secondary_color: secondaryColor,
            accent_color: accentColor,
            template_id: selectedTemplate.id,
          },
        })
      }
      setHasUnsavedChanges(false)
      toast.success(t('studentCards.editor.templateSaved'))
    } catch {
      toast.error(t('studentCards.editor.failedToSave'))
    }
  }

  // Reset to default
  const handleReset = () => {
    if (selectedTemplate) {
      handleSelectTemplate(selectedTemplate)
      if (settings) {
        setPrimaryColor(settings.primary_color || '#1e40af')
        setSecondaryColor(settings.secondary_color || '#ffffff')
        setAccentColor(settings.accent_color || '#f59e0b')
      }
      toast.info(t('studentCards.editor.reverted'))
    }
  }

  if (!schoolId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t('studentCards.noSchoolSelected')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/school/student-cards">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t('studentCards.back')}
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('studentCards.editor.title')}</h1>
            <p className="text-muted-foreground text-sm">
              {t('studentCards.editor.subtitle')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {hasUnsavedChanges && (
            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 self-center">
              {t('studentCards.editor.unsavedChanges')}
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={handleReset} disabled={!hasUnsavedChanges}>
            <RotateCcw className="w-4 h-4 mr-2" />
            {t('studentCards.editor.reset')}
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasUnsavedChanges || updateTemplate.isPending}
          >
            {updateTemplate.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {t('studentCards.editor.saveChanges')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Template list + Colors */}
        <div className="lg:col-span-3 space-y-4">
          {/* Template Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{t('studentCards.editor.templates')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loadingTemplates ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                (templates || []).map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => handleSelectTemplate(tmpl)}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                      selectedTemplate?.id === tmpl.id
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-primary/30 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{tmpl.name}</p>
                      {selectedTemplate?.id === tmpl.id && (
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{tmpl.style}</p>
                    {tmpl.is_default && (
                      <Badge className="mt-1.5 text-[10px]" variant="outline">
                        {t('studentCards.default')}
                      </Badge>
                    )}
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Color Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Palette className="w-4 h-4" />
                {t('studentCards.editor.colors')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ColorPicker
                label={t('studentCards.editor.primary')}
                value={primaryColor}
                onChange={(v) => handleColorChange('primary', v)}
              />
              <ColorPicker
                label={t('studentCards.editor.secondary')}
                value={secondaryColor}
                onChange={(v) => handleColorChange('secondary', v)}
              />
              <ColorPicker
                label={t('studentCards.editor.accent')}
                value={accentColor}
                onChange={(v) => handleColorChange('accent', v)}
              />
            </CardContent>
          </Card>

          {/* Template Variables Reference */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{t('studentCards.editor.templateVariables')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-xs font-mono text-muted-foreground max-h-48 overflow-y-auto">
                {[
                  '{{.StudentName}}',
                  '{{.StudentPhoto}}',
                  '{{.DateOfBirth}}',
                  '{{.Gender}}',
                  '{{.BloodType}}',
                  '{{.StudentID}}',
                  '{{.CardNumber}}',
                  '{{.ClassNumber}}',
                  '{{.ClassName}}',
                  '{{.AcademicYear}}',
                  '{{.QRCodeData}}',
                  '{{.SchoolName}}',
                  '{{.SchoolLogo}}',
                  '{{.SchoolAddress}}',
                  '{{.SchoolPhone}}',
                  '{{.SchoolEmail}}',
                  '{{.SchoolWebsite}}',
                  '{{.EmergencyName}}',
                  '{{.EmergencyPhone}}',
                  '{{.PrimaryColor}}',
                  '{{.SecondaryColor}}',
                  '{{.AccentColor}}',
                  '{{.IssuedDate}}',
                  '{{.ExpiryDate}}',
                ].map((v) => (
                  <p
                    key={v}
                    className="px-1.5 py-0.5 bg-muted rounded cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(v)
                      toast.success(t('studentCards.editor.copied', { variable: v }))
                    }}
                    title={t('studentCards.editor.clickToCopy')}
                  >
                    {v}
                  </p>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">{t('studentCards.editor.clickToCopyVariable')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Center: Preview */}
        <div className="lg:col-span-5">
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  {t('studentCards.editor.livePreview')}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant={activeSide === 'front' ? 'primary' : 'outline'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleSideChange('front')}
                  >
                    <CreditCard className="w-3 h-3 mr-1" />
                    {t('studentCards.front')}
                  </Button>
                  <Button
                    variant={activeSide === 'back' ? 'primary' : 'outline'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleSideChange('back')}
                  >
                    <FlipHorizontal className="w-3 h-3 mr-1" />
                    {t('studentCards.back')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                {/* Card Preview */}
                <CardPreviewFrame
                  html={previewHtml}
                  isLoading={previewTemplate.isPending || previewCustom.isPending}
                />
                <p className="text-xs text-muted-foreground text-center">
                  {activeSide === 'front' ? t('studentCards.editor.frontSide') : t('studentCards.editor.backSide')} &middot; ISO ID-1 (85.6mm
                  &times; 53.98mm)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Code Editor */}
        <div className="lg:col-span-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  {t('studentCards.editor.htmlEditor')}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant={editorMode === 'visual' ? 'primary' : 'outline'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setEditorMode('visual')}
                  >
                    <Monitor className="w-3 h-3 mr-1" />
                    {t('studentCards.editor.visual')}
                  </Button>
                  <Button
                    variant={editorMode === 'code' ? 'primary' : 'outline'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setEditorMode('code')}
                  >
                    <Code className="w-3 h-3 mr-1" />
                    {t('studentCards.editor.code')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeSide} onValueChange={(v) => handleSideChange(v as 'front' | 'back')}>
                <TabsList className="w-full grid grid-cols-2 mb-3">
                  <TabsTrigger value="front">{t('studentCards.editor.frontHtml')}</TabsTrigger>
                  <TabsTrigger value="back">{t('studentCards.editor.backHtml')}</TabsTrigger>
                </TabsList>
                <TabsContent value="front">
                  {editorMode === 'code' ? (
                    <HtmlCodeEditor
                      value={frontHtml}
                      onChange={(v) => {
                        setFrontHtml(v)
                        setHasUnsavedChanges(true)
                        handleHtmlChange(v)
                      }}
                    />
                  ) : (
                    <VisualGuide
                      currentHtml={frontHtml}
                      side="front"
                      onInsertVariable={(v) => {
                        const updated = frontHtml + `\n${v}`
                        setFrontHtml(updated)
                        setHasUnsavedChanges(true)
                        handleHtmlChange(updated)
                      }}
                    />
                  )}
                </TabsContent>
                <TabsContent value="back">
                  {editorMode === 'code' ? (
                    <HtmlCodeEditor
                      value={backHtml}
                      onChange={(v) => {
                        setBackHtml(v)
                        setHasUnsavedChanges(true)
                        handleHtmlChange(v)
                      }}
                    />
                  ) : (
                    <VisualGuide
                      currentHtml={backHtml}
                      side="back"
                      onInsertVariable={(v) => {
                        const updated = backHtml + `\n${v}`
                        setBackHtml(updated)
                        setHasUnsavedChanges(true)
                        handleHtmlChange(updated)
                      }}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Sub-Components
// ============================================================================

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          className="w-8 h-8 rounded cursor-pointer border-0 p-0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-xs h-8"
        />
      </div>
    </div>
  )
}

function CardPreviewFrame({
  html,
  isLoading,
}: {
  html: string
  isLoading: boolean
}) {
  const t = useTranslations('school')
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (iframeRef.current && html) {
      const doc = iframeRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(html)
        doc.close()
      }
    }
  }, [html])

  if (isLoading) {
    return (
      <div
        className="border-2 border-dashed border-muted rounded-xl flex items-center justify-center"
        style={{ width: '342px', height: '216px' }}
      >
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
          <p className="text-xs text-muted-foreground mt-2">{t('studentCards.editor.renderingPreview')}</p>
        </div>
      </div>
    )
  }

  if (!html) {
    return (
      <div
        className="border-2 border-dashed border-muted rounded-xl flex items-center justify-center"
        style={{ width: '342px', height: '216px' }}
      >
        <div className="text-center">
          <CreditCard className="w-8 h-8 mx-auto text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground mt-2">{t('studentCards.editor.selectTemplate')}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl overflow-hidden shadow-lg border bg-white"
      style={{ width: '342px', height: '216px' }}
    >
      <iframe
        ref={iframeRef}
        title="Card Preview"
        className="w-full h-full border-0"
        sandbox="allow-same-origin"
        style={{ pointerEvents: 'none' }}
      />
    </div>
  )
}

function HtmlCodeEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const t = useTranslations('school')
  return (
    <div className="space-y-2">
      <textarea
        className="w-full h-[500px] font-mono text-xs p-3 rounded-lg border border-input bg-muted/30 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        placeholder={t('studentCards.editor.htmlPlaceholder')}
      />
      <p className="text-[10px] text-muted-foreground">
        {t('studentCards.editor.syntaxHint')}
      </p>
    </div>
  )
}

function VisualGuide({
  currentHtml,
  side,
  onInsertVariable,
}: {
  currentHtml: string
  side: 'front' | 'back'
  onInsertVariable: (variable: string) => void
}) {
  const t = useTranslations('school')
  const frontSections = [
    {
      title: t('studentCards.editor.headerBar'),
      description: t('studentCards.editor.headerBarDesc'),
      variables: ['{{.SchoolName}}', '{{.SchoolLogo}}'],
    },
    {
      title: t('studentCards.editor.studentPhoto'),
      description: t('studentCards.editor.studentPhotoDesc'),
      variables: ['{{.StudentPhoto}}'],
    },
    {
      title: t('studentCards.editor.studentInformation'),
      description: t('studentCards.editor.studentInformationDesc'),
      variables: [
        '{{.StudentName}}',
        '{{.ClassName}}',
        '{{.ClassNumber}}',
        '{{.CardNumber}}',
        '{{.AcademicYear}}',
      ],
    },
    {
      title: t('studentCards.editor.additionalInfo'),
      description: t('studentCards.editor.additionalInfoDesc'),
      variables: ['{{.DateOfBirth}}', '{{.Gender}}', '{{.BloodType}}', '{{.StudentID}}'],
    },
    {
      title: t('studentCards.editor.footer'),
      description: t('studentCards.editor.footerDesc'),
      variables: ['{{.IssuedDate}}', '{{.ExpiryDate}}'],
    },
  ]

  const backSections = [
    {
      title: t('studentCards.editor.schoolContact'),
      description: t('studentCards.editor.schoolContactDesc'),
      variables: [
        '{{.SchoolAddress}}',
        '{{.SchoolPhone}}',
        '{{.SchoolEmail}}',
        '{{.SchoolWebsite}}',
      ],
    },
    {
      title: t('studentCards.editor.emergencyContact'),
      description: t('studentCards.editor.emergencyContactDesc'),
      variables: ['{{.EmergencyName}}', '{{.EmergencyPhone}}'],
    },
    {
      title: t('studentCards.editor.qrCode'),
      description: t('studentCards.editor.qrCodeDesc'),
      variables: ['{{.QRCodeData}}'],
    },
    {
      title: t('studentCards.editor.cardValidity'),
      description: t('studentCards.editor.cardValidityDesc'),
      variables: ['{{.IssuedDate}}', '{{.ExpiryDate}}'],
    },
  ]

  const sections = side === 'front' ? frontSections : backSections

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground mb-2">
        <p className="font-medium mb-1">{t('studentCards.editor.visualLayoutGuide')}</p>
        <p>{t('studentCards.editor.layoutOverview', { side })}</p>
      </div>

      {sections.map((section) => (
        <div
          key={section.title}
          className="p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
        >
          <p className="text-sm font-medium">{section.title}</p>
          <p className="text-xs text-muted-foreground mb-2">{section.description}</p>
          <div className="flex flex-wrap gap-1">
            {section.variables.map((v) => {
              const isUsed = currentHtml.includes(v)
              return (
                <button
                  key={v}
                  onClick={() => onInsertVariable(v)}
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                    isUsed
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                  }`}
                  title={isUsed ? t('studentCards.editor.usedInTemplate') : t('studentCards.editor.clickToAppend')}
                >
                  {isUsed && <CheckCircle2 className="w-2.5 h-2.5 inline mr-0.5" />}
                  {v}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <div className="pt-2 border-t">
        <p className="text-[10px] text-muted-foreground">
          <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1" />
          {t('studentCards.editor.greenIndicator')}
        </p>
      </div>
    </div>
  )
}
