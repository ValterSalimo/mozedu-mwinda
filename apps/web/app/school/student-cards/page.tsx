'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Badge } from '@mozedu/ui'
import {
  Search,
  CreditCard,
  Download,
  Mail,
  RefreshCw,
  Users,
  Printer,
  ChevronDown,
  Loader2,
  Eye,
  Trash2,
  Hash,
  Settings,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Palette,
} from 'lucide-react'
import Link from 'next/link'
import {
  useCardsBySchool,
  useCardsByClass,
  useGenerateCardsForClass,
  useGenerateCardsForSchool,
  useEmailCardToParent,
  useEmailCardsForClass,
  useRevokeCard,
  useDeleteCard,
  useRenumberClass,
  useRenewCardsForSchool,
  useSchoolCardSettings,
  useCardTemplates,
  useUpdateSchoolCardSettings,
  useRenderCardHTML,
  type StudentCard,
  type NumberingMethod,
} from '@/lib/hooks/use-student-cards'
import { useClasses } from '@/lib/hooks/use-classes'
import { useCurrentEntity } from '@/lib/hooks/use-current-entity'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

const currentAcademicYear = () => {
  const now = new Date()
  return now.getMonth() >= 8 ? `${now.getFullYear()}/${now.getFullYear() + 1}` : `${now.getFullYear() - 1}/${now.getFullYear()}`
}

export default function StudentCardsPage() {
  const t = useTranslations('school')
  const { schoolId } = useCurrentEntity()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [academicYear] = useState(currentAcademicYear())
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [selectedCard, setSelectedCard] = useState<StudentCard | null>(null)

  // Data fetching
  const { data: classesData } = useClasses(schoolId || '')
  const { data: settingsData } = useSchoolCardSettings(schoolId || '')

  const { data: schoolCardsData, isLoading: loadingSchoolCards } = useCardsBySchool(
    schoolId || '',
    { year: academicYear }
  )
  const { data: classCardsData, isLoading: loadingClassCards } = useCardsByClass(
    selectedClassId,
    { year: academicYear }
  )

  // Mutations
  const generateForClass = useGenerateCardsForClass()
  const generateForSchool = useGenerateCardsForSchool()
  const emailToParent = useEmailCardToParent()
  const emailForClass = useEmailCardsForClass()
  const revokeCard = useRevokeCard()
  const deleteCard = useDeleteCard()
  const renumberClass = useRenumberClass()
  const renewCards = useRenewCardsForSchool()

  // Derived data
  const cards = useMemo(() => {
    const source = selectedClassId ? classCardsData?.cards : schoolCardsData?.cards
    if (!source) return []
    if (!searchTerm) return source
    const term = searchTerm.toLowerCase()
    return source.filter(
      (c) =>
        c.card_number?.toLowerCase().includes(term) ||
        c.student?.user?.first_name?.toLowerCase().includes(term) ||
        c.student?.user?.last_name?.toLowerCase().includes(term)
    )
  }, [selectedClassId, classCardsData, schoolCardsData, searchTerm])

  const isLoading = selectedClassId ? loadingClassCards : loadingSchoolCards
  const totalCards = selectedClassId ? classCardsData?.total : schoolCardsData?.total

  const stats = useMemo(() => {
    const all = schoolCardsData?.cards || []
    return {
      total: all.length,
      active: all.filter((c) => c.status === 'active').length,
      emailed: all.filter((c) => c.emailed_to_parent).length,
      pending: all.filter((c) => c.status === 'pending').length,
    }
  }, [schoolCardsData])

  const classes = useMemo(() => {
    if (!classesData) return []
    const raw = Array.isArray(classesData) ? classesData : (classesData as unknown as { classes?: unknown[] })?.classes || []
    return raw as Array<{ id: string; name: string; grade_level?: number; section?: string; academic_year?: string }>
  }, [classesData])

  // Handlers
  const handleGenerateForClass = async (classId: string) => {
    try {
      const result = await generateForClass.mutateAsync({ classId, academicYear })
      toast.success(t('studentCards.generatedCount', { count: (result as StudentCard[])?.length || 0 }))
    } catch {
      toast.error(t('studentCards.failedToGenerate'))
    }
  }

  const handleGenerateForSchool = async () => {
    try {
      await generateForSchool.mutateAsync({ schoolId: schoolId!, academicYear })
      toast.success(t('studentCards.cardsGeneratedAll'))
    } catch {
      toast.error(t('studentCards.failedToGenerate'))
    }
  }

  const handleEmailToParent = async (cardId: string) => {
    try {
      await emailToParent.mutateAsync(cardId)
      toast.success(t('studentCards.cardEmailedToParent'))
    } catch {
      toast.error(t('studentCards.failedToEmailCard'))
    }
  }

  const handleEmailForClass = async (classId: string) => {
    try {
      await emailForClass.mutateAsync({ classId, year: academicYear })
      toast.success(t('studentCards.cardsEmailedToParents'))
    } catch {
      toast.error(t('studentCards.failedToEmailCards'))
    }
  }

  const handleRevokeCard = async (cardId: string) => {
    try {
      await revokeCard.mutateAsync(cardId)
      toast.success(t('studentCards.cardRevoked'))
    } catch {
      toast.error(t('studentCards.failedToRevokeCard'))
    }
  }

  const handleDeleteCard = async (cardId: string) => {
    try {
      await deleteCard.mutateAsync(cardId)
      toast.success(t('studentCards.cardDeleted'))
    } catch {
      toast.error(t('studentCards.failedToDeleteCard'))
    }
  }

  const handleRenumberClass = async (classId: string, method: NumberingMethod) => {
    try {
      await renumberClass.mutateAsync({ classId, method })
      toast.success(t('studentCards.classRenumbered'))
    } catch {
      toast.error(t('studentCards.failedToRenumberClass'))
    }
  }

  const handleRenewCards = async () => {
    try {
      await renewCards.mutateAsync({ schoolId: schoolId!, academicYear })
      toast.success(t('studentCards.cardsRenewed'))
    } catch {
      toast.error(t('studentCards.failedToRenewCards'))
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><CheckCircle2 className="w-3 h-3 mr-1" />{t('studentCards.statusActive')}</Badge>
      case 'expired':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"><AlertCircle className="w-3 h-3 mr-1" />{t('studentCards.statusExpired')}</Badge>
      case 'revoked':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"><XCircle className="w-3 h-3 mr-1" />{t('studentCards.statusRevoked')}</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">{status}</Badge>
    }
  }

  const handleDownloadCard = (card: StudentCard) => {
    if (card.card_pdf_url) {
      window.open(card.card_pdf_url, '_blank')
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('studentCards.title')}</h1>
          <p className="text-muted-foreground">{t('studentCards.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/school/student-cards/template-editor">
            <Button variant="outline" size="sm">
              <Palette className="w-4 h-4 mr-2" />
              {t('studentCards.templateEditor')}
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => setShowSettingsModal(true)}>
            <Settings className="w-4 h-4 mr-2" />
            {t('studentCards.cardSettings')}
          </Button>
          <Button
            size="sm"
            onClick={handleGenerateForSchool}
            disabled={generateForSchool.isPending}
          >
            {generateForSchool.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4 mr-2" />
            )}
            {t('studentCards.generateAllCards')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
                <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('studentCards.totalCards')}</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/30">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('studentCards.active')}</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/30">
                <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('studentCards.emailed')}</p>
                <p className="text-2xl font-bold">{stats.emailed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg dark:bg-yellow-900/30">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('studentCards.pending')}</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('studentCards.searchPlaceholder')}
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <select
                className="h-10 px-3 pr-8 rounded-md border border-input bg-background text-sm appearance-none cursor-pointer"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                <option value="">{t('studentCards.allClasses')}</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
            {selectedClassId && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateForClass(selectedClassId)}
                  disabled={generateForClass.isPending}
                >
                  {generateForClass.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4 mr-1" />
                  )}
                  {t('studentCards.generate')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEmailForClass(selectedClassId)}
                  disabled={emailForClass.isPending}
                >
                  <Mail className="w-4 h-4 mr-1" />
                  {t('studentCards.emailAll')}
                </Button>
                <div className="relative">
                  <select
                    className="h-8 px-2 pr-6 rounded border border-input bg-background text-xs appearance-none cursor-pointer"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleRenumberClass(selectedClassId, e.target.value as NumberingMethod)
                        e.target.value = ''
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>{t('studentCards.renumber')}</option>
                    <option value="alphabetical">{t('studentCards.alphabeticalLastName')}</option>
                    <option value="first_name">{t('studentCards.byFirstName')}</option>
                    <option value="enrollment">{t('studentCards.byEnrollmentDate')}</option>
                  </select>
                  <Hash className="absolute right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cards Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {selectedClassId
                ? t('studentCards.classCards', { count: cards.length })
                : t('studentCards.allCards', { count: totalCards || cards.length })}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleRenewCards} disabled={renewCards.isPending}>
              <RefreshCw className={`w-4 h-4 mr-1 ${renewCards.isPending ? 'animate-spin' : ''}`} />
              {t('studentCards.renewYear')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : cards.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-sm font-medium text-muted-foreground">{t('studentCards.noCardsFound')}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedClassId
                  ? t('studentCards.generateForClassHint')
                  : t('studentCards.generateForSchoolHint')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">{t('studentCards.numberAbbrev')}</th>
                    <th className="pb-3 font-medium text-muted-foreground">{t('studentCards.student')}</th>
                    <th className="pb-3 font-medium text-muted-foreground">{t('studentCards.cardNumber')}</th>
                    <th className="pb-3 font-medium text-muted-foreground">{t('studentCards.status')}</th>
                    <th className="pb-3 font-medium text-muted-foreground">{t('studentCards.emailed')}</th>
                    <th className="pb-3 font-medium text-muted-foreground">{t('studentCards.issued')}</th>
                    <th className="pb-3 font-medium text-muted-foreground text-right">{t('studentCards.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((card) => (
                    <tr key={card.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 font-mono text-xs">{card.class_number}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                            {card.student?.user?.first_name?.[0]}
                            {card.student?.user?.last_name?.[0]}
                          </div>
                          <div>
                            <p className="font-medium">
                              {card.student?.user?.first_name} {card.student?.user?.last_name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 font-mono text-xs">{card.card_number}</td>
                      <td className="py-3">{getStatusBadge(card.status)}</td>
                      <td className="py-3">
                        {card.emailed_to_parent ? (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {t('studentCards.sent')}
                          </Badge>
                        ) : (
                          <Badge variant="outline">{t('studentCards.notSent')}</Badge>
                        )}
                      </td>
                      <td className="py-3 text-xs text-muted-foreground">
                        {card.issued_at ? new Date(card.issued_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCard(card)}
                            title={t('studentCards.view')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadCard(card)}
                            title={t('studentCards.downloadPdf')}
                            disabled={!card.card_pdf_url}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEmailToParent(card.id)}
                            title={t('studentCards.emailToParent')}
                            disabled={emailToParent.isPending}
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeCard(card.id)}
                            title={t('studentCards.revoke')}
                            disabled={card.status === 'revoked'}
                          >
                            <XCircle className="w-4 h-4 text-orange-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCard(card.id)}
                            title={t('studentCards.delete')}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card Preview Modal */}
      {selectedCard && (
        <CardPreviewModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onDownload={handleDownloadCard}
          onEmail={handleEmailToParent}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <CardSettingsModal
          schoolId={schoolId}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  )
}

// ============================================================================
// Card Preview Modal (with HTML render)
// ============================================================================

function CardPreviewModal({
  card,
  onClose,
  onDownload,
  onEmail,
}: {
  card: StudentCard
  onClose: () => void
  onDownload: (card: StudentCard) => void
  onEmail: (cardId: string) => void
}) {
  const t = useTranslations('school')
  const [side, setSide] = useState<'front' | 'back'>('front')
  const renderCard = useRenderCardHTML()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    renderCard.mutate(
      { cardId: card.id, side },
      {
        onSuccess: (html) => {
          if (iframeRef.current) {
            const doc = iframeRef.current.contentDocument
            if (doc) {
              doc.open()
              doc.write(typeof html === 'string' ? html : '')
              doc.close()
            }
          }
        },
        onError: () => {
          if (iframeRef.current) {
            const doc = iframeRef.current.contentDocument
            if (doc) {
              doc.open()
              doc.write('<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#888;font-family:sans-serif;font-size:14px;">Card preview unavailable</div>')
              doc.close()
            }
          }
        },
      }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id, side])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-background rounded-xl shadow-xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t('studentCards.studentIdCard')}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <XCircle className="w-5 h-5" />
          </Button>
        </div>

        {/* Side toggle */}
        <div className="flex gap-2 mb-4 justify-center">
          <Button
            variant={side === 'front' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSide('front')}
          >
            <CreditCard className="w-3 h-3 mr-1" />
            {t('studentCards.front')}
          </Button>
          <Button
            variant={side === 'back' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSide('back')}
          >
            {t('studentCards.back')}
          </Button>
        </div>

        {/* Rendered Card */}
        <div className="flex justify-center mb-4">
          {renderCard.isPending ? (
            <div
              className="border-2 border-dashed border-muted rounded-xl flex items-center justify-center"
              style={{ width: '342px', height: '216px' }}
            >
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div
              className="rounded-xl overflow-hidden shadow-lg border bg-white"
              style={{ width: '342px', height: '216px' }}
            >
              <iframe
                ref={iframeRef}
                title="Card Preview"
                className="w-full h-full border-0"
                sandbox="allow-same-origin allow-scripts"
                style={{ pointerEvents: 'none' }}
              />
            </div>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground mb-4">
          {card.student?.user?.first_name} {card.student?.user?.last_name} &middot; {card.card_number}
        </p>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => onDownload(card)}>
            <Download className="w-4 h-4 mr-2" />
            {t('studentCards.downloadPdf')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            {t('studentCards.print')}
          </Button>
          <Button size="sm" onClick={() => onEmail(card.id)}>
            <Mail className="w-4 h-4 mr-2" />
            {t('studentCards.emailToParentBtn')}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Card Settings Modal (inline component)
// ============================================================================

function CardSettingsModal({ schoolId, onClose }: { schoolId: string; onClose: () => void }) {
  const t = useTranslations('school')
  const { data: settings, isLoading } = useSchoolCardSettings(schoolId)
  const { data: templates } = useCardTemplates()
  const updateSettings = useUpdateSchoolCardSettings()

  const [form, setForm] = useState<Record<string, unknown>>({})

  const currentSettings = useMemo(() => {
    if (!settings) return null
    return { ...settings, ...form }
  }, [settings, form])

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({ schoolId, data: form as Record<string, unknown> })
      toast.success(t('studentCards.settingsSaved'))
      onClose()
    } catch {
      toast.error(t('studentCards.failedToSaveSettings'))
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background rounded-xl p-8">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-background rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{t('studentCards.cardSettings')}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <XCircle className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Template Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">{t('studentCards.cardTemplate')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(templates || []).map((tmpl) => (
                <button
                  key={tmpl.id}
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${
                    (currentSettings as { template_id?: string })?.template_id === tmpl.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setForm({ ...form, template_id: tmpl.id })}
                >
                  <p className="font-medium text-sm">{tmpl.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{tmpl.description}</p>
                  {tmpl.is_default && (
                    <Badge className="mt-2 text-xs" variant="outline">{t('studentCards.default')}</Badge>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">{t('studentCards.primaryColor')}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="w-10 h-10 rounded cursor-pointer border-0"
                  value={(currentSettings as { primary_color?: string })?.primary_color || '#1e40af'}
                  onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                />
                <Input
                  value={(currentSettings as { primary_color?: string })?.primary_color || '#1e40af'}
                  onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('studentCards.secondaryColor')}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="w-10 h-10 rounded cursor-pointer border-0"
                  value={(currentSettings as { secondary_color?: string })?.secondary_color || '#ffffff'}
                  onChange={(e) => setForm({ ...form, secondary_color: e.target.value })}
                />
                <Input
                  value={(currentSettings as { secondary_color?: string })?.secondary_color || '#ffffff'}
                  onChange={(e) => setForm({ ...form, secondary_color: e.target.value })}
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('studentCards.accentColor')}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="w-10 h-10 rounded cursor-pointer border-0"
                  value={(currentSettings as { accent_color?: string })?.accent_color || '#f59e0b'}
                  onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                />
                <Input
                  value={(currentSettings as { accent_color?: string })?.accent_color || '#f59e0b'}
                  onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Numbering Method */}
          <div>
            <label className="text-sm font-medium mb-2 block">{t('studentCards.numberingMethod')}</label>
            <select
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              value={(currentSettings as { numbering_method?: string })?.numbering_method || 'alphabetical'}
              onChange={(e) => setForm({ ...form, numbering_method: e.target.value })}
            >
              <option value="alphabetical">{t('studentCards.alphabeticalDefault')}</option>
              <option value="first_name">{t('studentCards.alphabeticalFirstName')}</option>
              <option value="enrollment">{t('studentCards.byEnrollmentDate')}</option>
              <option value="manual">{t('studentCards.manual')}</option>
            </select>
          </div>

          {/* Toggle options */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'show_qr_code', labelKey: 'showQrCode' },
              { key: 'show_photo', labelKey: 'showPhoto' },
              { key: 'show_emergency', labelKey: 'showEmergencyContact' },
              { key: 'show_blood_type', labelKey: 'showBloodType' },
              { key: 'show_barcode', labelKey: 'showBarcode' },
            ].map(({ key, labelKey }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={
                    (currentSettings as Record<string, unknown>)?.[key] as boolean ?? true
                  }
                  onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                />
                <span className="text-sm">{t(`studentCards.${labelKey}`)}</span>
              </label>
            ))}
          </div>

          {/* Color Preview */}
          <div>
            <label className="text-sm font-medium mb-2 block">{t('studentCards.preview')}</label>
            <div
              className="rounded-xl border overflow-hidden"
              style={{ maxWidth: '342px' }}
            >
              <div
                className="px-4 py-2 text-white text-xs font-bold"
                style={{ backgroundColor: (currentSettings as { primary_color?: string })?.primary_color || '#1e40af' }}
              >
                ESCOLA EXEMPLO
              </div>
              <div
                className="p-4 flex items-center gap-3"
                style={{ backgroundColor: (currentSettings as { secondary_color?: string })?.secondary_color || '#ffffff' }}
              >
                <div className="w-12 h-14 bg-gray-200 rounded border flex items-center justify-center">
                  <Users className="w-6 h-6 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#333' }}>{t('studentCards.sampleName')}</p>
                  <p className="text-xs text-gray-500">No. 15 | 10A</p>
                  <p className="text-xs font-mono" style={{ color: (currentSettings as { primary_color?: string })?.primary_color || '#1e40af' }}>
                    EPM-2026-10A-15
                  </p>
                </div>
              </div>
              <div
                className="h-1"
                style={{ backgroundColor: (currentSettings as { accent_color?: string })?.accent_color || '#f59e0b' }}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>{t('studentCards.cancel')}</Button>
          <Button onClick={handleSave} disabled={updateSettings.isPending}>
            {updateSettings.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t('studentCards.saveSettings')}
          </Button>
        </div>
      </div>
    </div>
  )
}
