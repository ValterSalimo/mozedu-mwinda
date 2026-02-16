'use client'

import { useState } from 'react'
import { Button, Input } from '@mozedu/ui'
import {
  Search,
  Plus,
  Edit,
  Trash2,
  BookOpen,
  Clock,
  Layers,
  Globe,
  Check,
  X,
  Loader2,
  MoreHorizontal,
  ChevronDown,
} from 'lucide-react'
import {
  useCurriculumTracks,
  useCreateCurriculumTrack,
  useUpdateCurriculumTrack,
  useDeleteCurriculumTrack,
} from '@/lib/hooks'
import { useCurrentEntity } from '@/lib/hooks/use-current-entity'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import type { SchoolCurriculumTrack, CurriculumType } from '@mozedu/types'

const CURRICULUM_TYPES: { value: CurriculumType; label: string }[] = [
  { value: 'MOZAMBIQUE_NATIONAL', label: 'Mozambique National' },
  { value: 'ANGOLA_NATIONAL', label: 'Angola National' },
  { value: 'CAMBRIDGE', label: 'Cambridge International' },
  { value: 'SOUTH_AFRICA_CAPS', label: 'South Africa CAPS' },
  { value: 'CONGO_NATIONAL', label: 'Congo National' },
  { value: 'TURKEY_NATIONAL', label: 'Turkey National' },
  { value: 'CUSTOM', label: 'Custom' },
  { value: 'COMBINED', label: 'Combined' },
]

const WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

function getCurriculumLabel(type: CurriculumType): string {
  return CURRICULUM_TYPES.find((t) => t.value === type)?.label ?? type
}

export default function CurriculumTracksPage() {
  const t = useTranslations('school')
  const { schoolId } = useCurrentEntity()
  const { data: tracks, isLoading, error } = useCurriculumTracks(schoolId)
  const createMutation = useCreateCurriculumTrack()
  const updateMutation = useUpdateCurriculumTrack()
  const deleteMutation = useDeleteCurriculumTrack()

  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingTrack, setEditingTrack] = useState<SchoolCurriculumTrack | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    curriculumType: 'MOZAMBIQUE_NATIONAL' as CurriculumType,
    isCombined: false,
    combinedWith: [] as CurriculumType[],
    combinationRatio: '70-30',
    isDefault: false,
    periodsPerDay: 8,
    periodDurationMinutes: 45,
    breakDurationMinutes: 10,
    lunchBreakMinutes: 45,
    schoolDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as string[],
  })

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      curriculumType: 'MOZAMBIQUE_NATIONAL',
      isCombined: false,
      combinedWith: [],
      combinationRatio: '70-30',
      isDefault: false,
      periodsPerDay: 8,
      periodDurationMinutes: 45,
      breakDurationMinutes: 10,
      lunchBreakMinutes: 45,
      schoolDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    })
    setEditingTrack(null)
  }

  const openCreateModal = () => {
    resetForm()
    setShowModal(true)
  }

  const openEditModal = (track: SchoolCurriculumTrack) => {
    setEditingTrack(track)
    setFormData({
      name: track.name,
      description: track.description || '',
      curriculumType: track.curriculumType,
      isCombined: track.isCombined,
      combinedWith: track.combinedWith || [],
      combinationRatio: track.combinationRatio || '70-30',
      isDefault: track.isDefault,
      periodsPerDay: track.scheduleConfig?.periodsPerDay || 8,
      periodDurationMinutes: track.scheduleConfig?.periodDurationMinutes || 45,
      breakDurationMinutes: track.scheduleConfig?.breakDurationMinutes || 10,
      lunchBreakMinutes: track.scheduleConfig?.lunchBreakMinutes || 45,
      schoolDays: track.scheduleConfig?.schoolDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    })
    setShowModal(true)
    setActiveDropdown(null)
  }

  const tracksList: SchoolCurriculumTrack[] = tracks || []
  const filteredTracks = tracksList.filter((track: SchoolCurriculumTrack) =>
    track.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCurriculumLabel(track.curriculumType).toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: tracksList.length,
    active: tracksList.filter((t: SchoolCurriculumTrack) => t.isActive).length,
    combined: tracksList.filter((t: SchoolCurriculumTrack) => t.isCombined).length,
    defaultCount: tracksList.filter((t: SchoolCurriculumTrack) => t.isDefault).length,
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!schoolId || !formData.name.trim()) {
      toast.error(t('curriculumTracks.nameRequired'))
      return
    }

    try {
      const scheduleConfig = {
        periodsPerDay: formData.periodsPerDay,
        periodDurationMinutes: formData.periodDurationMinutes,
        breakDurationMinutes: formData.breakDurationMinutes,
        lunchBreakMinutes: formData.lunchBreakMinutes,
        schoolDays: formData.schoolDays,
      }

      if (editingTrack) {
        await updateMutation.mutateAsync({
          id: editingTrack.id,
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          isCombined: formData.isCombined,
          combinedWith: formData.isCombined ? formData.combinedWith : undefined,
          combinationRatio: formData.isCombined ? formData.combinationRatio : undefined,
          isDefault: formData.isDefault,
          scheduleConfig,
        })
        toast.success(t('curriculumTracks.trackUpdated'))
      } else {
        await createMutation.mutateAsync({
          schoolId,
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          curriculumType: formData.curriculumType,
          isCombined: formData.isCombined,
          combinedWith: formData.isCombined ? formData.combinedWith : undefined,
          combinationRatio: formData.isCombined ? formData.combinationRatio : undefined,
          isDefault: formData.isDefault,
          scheduleConfig,
        })
        toast.success(t('curriculumTracks.trackCreated'))
      }
      setShowModal(false)
      resetForm()
    } catch (err: any) {
      toast.error(err?.message || t('curriculumTracks.failedToSave'))
    }
  }

  const handleDelete = async (track: SchoolCurriculumTrack) => {
    if (!confirm(t('curriculumTracks.confirmDelete', { name: track.name }))) return
    try {
      await deleteMutation.mutateAsync(track.id)
      toast.success(t('curriculumTracks.trackDeleted'))
    } catch (err: any) {
      toast.error(err?.message || t('curriculumTracks.failedToDelete'))
    }
    setActiveDropdown(null)
  }

  const toggleSchoolDay = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      schoolDays: prev.schoolDays.includes(day)
        ? prev.schoolDays.filter((d) => d !== day)
        : [...prev.schoolDays, day],
    }))
  }

  const toggleCombinedWith = (type: CurriculumType) => {
    setFormData((prev) => ({
      ...prev,
      combinedWith: prev.combinedWith.includes(type)
        ? prev.combinedWith.filter((t) => t !== type)
        : [...prev.combinedWith, type],
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-red-500">
        <p>{t('curriculumTracks.failedToLoad')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('curriculumTracks.title')}</h1>
          <p className="text-muted-foreground">
            {t('curriculumTracks.subtitle')}
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          {t('curriculumTracks.addTrack')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">{t('curriculumTracks.totalTracks')}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-sm text-muted-foreground">{t('curriculumTracks.active')}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2">
              <Layers className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.combined}</p>
              <p className="text-sm text-muted-foreground">{t('curriculumTracks.combined')}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-100 p-2">
              <Globe className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.defaultCount}</p>
              <p className="text-sm text-muted-foreground">{t('curriculumTracks.default')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('curriculumTracks.searchPlaceholder')}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {filteredTracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <BookOpen className="mb-2 h-12 w-12" />
            <p>{t('curriculumTracks.noTracksFound')}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">{t('curriculumTracks.nameColumn')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">{t('curriculumTracks.typeColumn')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">{t('curriculumTracks.scheduleColumn')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">{t('curriculumTracks.statusColumn')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">{t('curriculumTracks.flagsColumn')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-muted-foreground">{t('curriculumTracks.actionsColumn')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredTracks.map((track: SchoolCurriculumTrack) => (
                <tr key={track.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{track.name}</p>
                      {track.description && (
                        <p className="text-sm text-muted-foreground">{track.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        {getCurriculumLabel(track.curriculumType)}
                      </span>
                      {track.isCombined && track.combinedWith && track.combinedWith.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {track.combinedWith.map((type: CurriculumType) => (
                            <span
                              key={type}
                              className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-800"
                            >
                              + {getCurriculumLabel(type)}
                            </span>
                          ))}
                          {track.combinationRatio && (
                            <span className="text-xs text-muted-foreground">({track.combinationRatio})</span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {track.scheduleConfig ? (
                      <div>
                        <p>{track.scheduleConfig.periodsPerDay} {t('curriculumTracks.periods')} × {track.scheduleConfig.periodDurationMinutes}min</p>
                        <p className="text-xs">
                          {track.scheduleConfig.schoolDays?.length ?? 5} {t('curriculumTracks.daysWeek')}
                        </p>
                      </div>
                    ) : (
                      <span>{t('curriculumTracks.default')}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        track.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {track.isActive ? t('curriculumTracks.active') : t('curriculumTracks.inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      {track.isDefault && (
                        <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-800">
                          {t('curriculumTracks.default')}
                        </span>
                      )}
                      {track.isCombined && (
                        <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-800">
                          {t('curriculumTracks.combined')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === track.id ? null : track.id)}
                        className="rounded-lg p-2 hover:bg-muted"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {activeDropdown === track.id && (
                        <div className="absolute right-0 z-10 mt-1 w-32 rounded-lg border bg-card py-1 shadow-lg">
                          <button
                            onClick={() => openEditModal(track)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                          >
                            <Edit className="h-4 w-4" />
                            {t('curriculumTracks.edit')}
                          </button>
                          <button
                            onClick={() => handleDelete(track)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            {t('curriculumTracks.delete')}
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-card p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {editingTrack ? t('curriculumTracks.editTrack') : t('curriculumTracks.createTrack')}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('curriculumTracks.nameLabel')}</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder={t('curriculumTracks.namePlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('curriculumTracks.curriculumTypeLabel')}</label>
                  <select
                    value={formData.curriculumType}
                    onChange={(e) => setFormData((prev) => ({ ...prev, curriculumType: e.target.value as CurriculumType }))}
                    disabled={!!editingTrack}
                    className="w-full rounded-md border px-3 py-2 text-sm disabled:bg-muted"
                  >
                    {CURRICULUM_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('curriculumTracks.description')}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder={t('curriculumTracks.descriptionPlaceholder')}
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isCombined}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isCombined: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">{t('curriculumTracks.combinedCurriculum')}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isDefault: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">{t('curriculumTracks.defaultTrack')}</span>
                </label>
              </div>

              {formData.isCombined && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <h4 className="mb-3 font-medium text-blue-900">{t('curriculumTracks.combinedSettings')}</h4>
                  <div className="mb-3">
                    <label className="block text-sm text-blue-800 mb-2">{t('curriculumTracks.additionalCurriculums')}</label>
                    <div className="flex flex-wrap gap-2">
                      {CURRICULUM_TYPES.filter((t) => t.value !== formData.curriculumType && t.value !== 'COMBINED').map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => toggleCombinedWith(t.value)}
                          className={`rounded-full px-3 py-1 text-sm transition-colors ${
                            formData.combinedWith.includes(t.value)
                              ? 'bg-blue-500 text-white'
                              : 'bg-white text-blue-700 hover:bg-blue-100'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-blue-800 mb-1">{t('curriculumTracks.ratio')}</label>
                    <Input
                      value={formData.combinationRatio}
                      onChange={(e) => setFormData((prev) => ({ ...prev, combinationRatio: e.target.value }))}
                      placeholder="70-30"
                      className="bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="rounded-lg border p-4">
                <h4 className="mb-3 font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t('curriculumTracks.scheduleConfig')}
                </h4>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">{t('curriculumTracks.periodsPerDay')}</label>
                    <Input
                      type="number"
                      value={formData.periodsPerDay}
                      onChange={(e) => setFormData((prev) => ({ ...prev, periodsPerDay: Number(e.target.value) }))}
                      min={1}
                      max={12}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">{t('curriculumTracks.periodMin')}</label>
                    <Input
                      type="number"
                      value={formData.periodDurationMinutes}
                      onChange={(e) => setFormData((prev) => ({ ...prev, periodDurationMinutes: Number(e.target.value) }))}
                      min={20}
                      max={90}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">{t('curriculumTracks.breakMin')}</label>
                    <Input
                      type="number"
                      value={formData.breakDurationMinutes}
                      onChange={(e) => setFormData((prev) => ({ ...prev, breakDurationMinutes: Number(e.target.value) }))}
                      min={5}
                      max={30}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">{t('curriculumTracks.lunchMin')}</label>
                    <Input
                      type="number"
                      value={formData.lunchBreakMinutes}
                      onChange={(e) => setFormData((prev) => ({ ...prev, lunchBreakMinutes: Number(e.target.value) }))}
                      min={20}
                      max={90}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm text-muted-foreground mb-2">{t('curriculumTracks.schoolDays')}</label>
                  <div className="flex flex-wrap gap-2">
                    {WEEK_DAYS.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleSchoolDay(day)}
                        className={`rounded-full px-3 py-1 text-sm capitalize transition-colors ${
                          formData.schoolDays.includes(day)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>
                  {t('curriculumTracks.cancel')}
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingTrack ? t('curriculumTracks.update') : t('curriculumTracks.create')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
