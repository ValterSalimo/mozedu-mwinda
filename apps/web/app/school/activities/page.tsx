'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Button, Input } from '@mozedu/ui'
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Music,
  Trophy,
  Palette,
  Users,
  Clock,
  MapPin,
  DollarSign,
  Calendar,
  Check,
  X,
  Loader2,
  MoreHorizontal,
  ChevronDown,
  Filter,
} from 'lucide-react'
import {
  useActivities,
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity,
} from '@/lib/hooks'
import { useCurrentEntity } from '@/lib/hooks/use-current-entity'
import { toast } from 'sonner'
import type { Activity, ActivityType, ActivityCategory, ActivityStatus } from '@mozedu/types'

const ACTIVITY_TYPES: { value: ActivityType; label: string; icon: typeof Music }[] = [
  { value: 'SPORT', label: 'Sport', icon: Trophy },
  { value: 'MUSIC', label: 'Music', icon: Music },
  { value: 'ART', label: 'Art', icon: Palette },
  { value: 'CLUB', label: 'Club', icon: Users },
  { value: 'TUTORING', label: 'Tutoring', icon: Users },
  { value: 'LANGUAGE', label: 'Language', icon: Users },
  { value: 'TECHNOLOGY', label: 'Technology', icon: Users },
  { value: 'COMMUNITY', label: 'Community', icon: Users },
  { value: 'OTHER', label: 'Other', icon: Users },
]

const ACTIVITY_CATEGORIES: { value: ActivityCategory; label: string; type: ActivityType }[] = [
  { value: 'TEAM_SPORT', label: 'Team Sport', type: 'SPORT' },
  { value: 'INDIVIDUAL_SPORT', label: 'Individual Sport', type: 'SPORT' },
  { value: 'MARTIAL_ARTS', label: 'Martial Arts', type: 'SPORT' },
  { value: 'AQUATICS', label: 'Aquatics', type: 'SPORT' },
  { value: 'INSTRUMENT', label: 'Instrument', type: 'MUSIC' },
  { value: 'VOCAL', label: 'Vocal', type: 'MUSIC' },
  { value: 'ENSEMBLE', label: 'Ensemble', type: 'MUSIC' },
  { value: 'VISUAL_ART', label: 'Visual Art', type: 'ART' },
  { value: 'PERFORMING_ART', label: 'Performing Art', type: 'ART' },
  { value: 'CRAFT', label: 'Craft', type: 'ART' },
  { value: 'ACADEMIC_CLUB', label: 'Academic Club', type: 'CLUB' },
  { value: 'LANGUAGE_CLUB', label: 'Language Club', type: 'LANGUAGE' },
  { value: 'STEM_CLUB', label: 'STEM Club', type: 'TECHNOLOGY' },
  { value: 'GENERAL', label: 'General', type: 'OTHER' },
]

const COMMON_ACTIVITIES = [
  { name: 'Tennis', activityType: 'SPORT' as ActivityType, category: 'INDIVIDUAL_SPORT' as ActivityCategory, duration: 60 },
  { name: 'Basketball', activityType: 'SPORT' as ActivityType, category: 'TEAM_SPORT' as ActivityCategory, duration: 90 },
  { name: 'Soccer', activityType: 'SPORT' as ActivityType, category: 'TEAM_SPORT' as ActivityCategory, duration: 90 },
  { name: 'Guitar', activityType: 'MUSIC' as ActivityType, category: 'INSTRUMENT' as ActivityCategory, duration: 45 },
  { name: 'Piano', activityType: 'MUSIC' as ActivityType, category: 'INSTRUMENT' as ActivityCategory, duration: 45 },
  { name: 'Choir', activityType: 'MUSIC' as ActivityType, category: 'VOCAL' as ActivityCategory, duration: 60 },
  { name: 'Drama Club', activityType: 'ART' as ActivityType, category: 'PERFORMING_ART' as ActivityCategory, duration: 90 },
  { name: 'Coding Club', activityType: 'TECHNOLOGY' as ActivityType, category: 'STEM_CLUB' as ActivityCategory, duration: 60 },
]

const WEEK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function getActivityTypeIcon(type: ActivityType) {
  const found = ACTIVITY_TYPES.find((t) => t.value === type)
  return found?.icon ?? Users
}

function getCategoryLabel(category: ActivityCategory) {
  return ACTIVITY_CATEGORIES.find((c) => c.value === category)?.label ?? category
}

export default function ActivitiesPage() {
  const t = useTranslations('school')
  const { schoolId } = useCurrentEntity()
  const { data: activities, isLoading, error } = useActivities(schoolId)
  const createMutation = useCreateActivity()
  const updateMutation = useUpdateActivity()
  const deleteMutation = useDeleteActivity()

  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<ActivityType | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<ActivityStatus | 'ALL'>('ALL')
  const [showFilters, setShowFilters] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    activityType: 'SPORT' as ActivityType,
    category: 'TEAM_SPORT' as ActivityCategory,
    dayOfWeek: [] as number[],
    startTime: '16:00',
    endTime: '17:00',
    duration: 60,
    minParticipants: 5,
    maxParticipants: 30,
    location: '',
    requiresSpecialFacility: false,
    instructorId: '',
    externalInstructorName: '',
    hasFee: false,
    feeAmount: 0,
    feeCurrency: 'USD',
    feeFrequency: 'monthly' as 'one_time' | 'monthly' | 'per_session' | 'annual',
    gradeRestrictions: [] as number[],
    equipmentRequired: [] as string[],
    academicYear: new Date().getFullYear().toString(),
  })
  const [newEquipment, setNewEquipment] = useState('')

  const activitiesList: Activity[] = activities || []

  const filteredActivities = useMemo(() => {
    return activitiesList.filter((activity: Activity) => {
      const matchesSearch =
        activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      const matchesType = typeFilter === 'ALL' || activity.activityType === typeFilter
      const matchesStatus = statusFilter === 'ALL' || activity.status === statusFilter
      return matchesSearch && matchesType && matchesStatus
    })
  }, [activitiesList, searchTerm, typeFilter, statusFilter])

  const stats = useMemo(() => ({
    total: activitiesList.length,
    active: activitiesList.filter((a: Activity) => a.status === 'active').length,
    sports: activitiesList.filter((a: Activity) => a.activityType === 'SPORT').length,
    music: activitiesList.filter((a: Activity) => a.activityType === 'MUSIC').length,
    arts: activitiesList.filter((a: Activity) => a.activityType === 'ART').length,
  }), [activitiesList])

  const filteredCategories = useMemo(() => {
    return ACTIVITY_CATEGORIES.filter((c) => c.type === formData.activityType || c.value === 'GENERAL')
  }, [formData.activityType])

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      activityType: 'SPORT',
      category: 'TEAM_SPORT',
      dayOfWeek: [],
      startTime: '16:00',
      endTime: '17:00',
      duration: 60,
      minParticipants: 5,
      maxParticipants: 30,
      location: '',
      requiresSpecialFacility: false,
      instructorId: '',
      externalInstructorName: '',
      hasFee: false,
      feeAmount: 0,
      feeCurrency: 'USD',
      feeFrequency: 'monthly',
      gradeRestrictions: [],
      equipmentRequired: [],
      academicYear: new Date().getFullYear().toString(),
    })
    setNewEquipment('')
    setEditingActivity(null)
  }

  const openCreateModal = () => {
    resetForm()
    setShowModal(true)
  }

  const openEditModal = (activity: Activity) => {
    setEditingActivity(activity)
    setFormData({
      name: activity.name,
      description: activity.description || '',
      activityType: activity.activityType,
      category: activity.category,
      dayOfWeek: activity.dayOfWeek || [],
      startTime: activity.startTime || '16:00',
      endTime: activity.endTime || '17:00',
      duration: activity.duration,
      minParticipants: activity.minParticipants || 5,
      maxParticipants: activity.maxParticipants || 30,
      location: activity.location || '',
      requiresSpecialFacility: activity.requiresSpecialFacility,
      instructorId: activity.instructorId || '',
      externalInstructorName: activity.externalInstructorName || '',
      hasFee: activity.hasFee,
      feeAmount: activity.feeAmount || 0,
      feeCurrency: activity.feeCurrency || 'USD',
      feeFrequency: activity.feeFrequency || 'monthly',
      gradeRestrictions: activity.gradeRestrictions || [],
      equipmentRequired: activity.equipmentRequired || [],
      academicYear: activity.academicYear,
    })
    setShowModal(true)
    setActiveDropdown(null)
  }

  const applyPreset = (preset: (typeof COMMON_ACTIVITIES)[0]) => {
    setFormData((prev) => ({
      ...prev,
      name: preset.name,
      activityType: preset.activityType,
      category: preset.category,
      duration: preset.duration,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!schoolId || !formData.name.trim()) {
      toast.error(t('activities.nameRequired'))
      return
    }

    try {
      if (editingActivity) {
        await updateMutation.mutateAsync({
          id: editingActivity.id,
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          dayOfWeek: formData.dayOfWeek.length > 0 ? formData.dayOfWeek : undefined,
          startTime: formData.startTime || undefined,
          endTime: formData.endTime || undefined,
          duration: formData.duration,
          minParticipants: formData.minParticipants,
          maxParticipants: formData.maxParticipants,
          location: formData.location.trim() || undefined,
          instructorId: formData.instructorId || undefined,
          externalInstructorName: formData.externalInstructorName.trim() || undefined,
          hasFee: formData.hasFee,
          feeAmount: formData.hasFee ? formData.feeAmount : undefined,
          feeCurrency: formData.hasFee ? formData.feeCurrency : undefined,
          feeFrequency: formData.hasFee ? formData.feeFrequency : undefined,
          gradeRestrictions: formData.gradeRestrictions.length > 0 ? formData.gradeRestrictions : undefined,
          equipmentRequired: formData.equipmentRequired.length > 0 ? formData.equipmentRequired : undefined,
        })
        toast.success(t('activities.updated'))
      } else {
        await createMutation.mutateAsync({
          schoolId,
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          activityType: formData.activityType,
          category: formData.category,
          dayOfWeek: formData.dayOfWeek.length > 0 ? formData.dayOfWeek : undefined,
          startTime: formData.startTime || undefined,
          endTime: formData.endTime || undefined,
          duration: formData.duration,
          minParticipants: formData.minParticipants,
          maxParticipants: formData.maxParticipants,
          location: formData.location.trim() || undefined,
          requiresSpecialFacility: formData.requiresSpecialFacility,
          instructorId: formData.instructorId || undefined,
          externalInstructorName: formData.externalInstructorName.trim() || undefined,
          hasFee: formData.hasFee,
          feeAmount: formData.hasFee ? formData.feeAmount : undefined,
          feeCurrency: formData.hasFee ? formData.feeCurrency : undefined,
          feeFrequency: formData.hasFee ? formData.feeFrequency : undefined,
          gradeRestrictions: formData.gradeRestrictions.length > 0 ? formData.gradeRestrictions : undefined,
          equipmentRequired: formData.equipmentRequired.length > 0 ? formData.equipmentRequired : undefined,
          academicYear: formData.academicYear,
        })
        toast.success(t('activities.created'))
      }
      setShowModal(false)
      resetForm()
    } catch (err: any) {
      toast.error(err?.message || t('activities.saveFailed'))
    }
  }

  const handleDelete = async (activity: Activity) => {
    if (!confirm(t('activities.confirmDelete', { name: activity.name }))) return
    try {
      await deleteMutation.mutateAsync(activity.id)
      toast.success(t('activities.deleted'))
    } catch (err: any) {
      toast.error(err?.message || t('activities.deleteFailed'))
    }
    setActiveDropdown(null)
  }

  const toggleDay = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      dayOfWeek: prev.dayOfWeek.includes(day)
        ? prev.dayOfWeek.filter((d) => d !== day)
        : [...prev.dayOfWeek, day],
    }))
  }

  const toggleGrade = (grade: number) => {
    setFormData((prev) => ({
      ...prev,
      gradeRestrictions: prev.gradeRestrictions.includes(grade)
        ? prev.gradeRestrictions.filter((g) => g !== grade)
        : [...prev.gradeRestrictions, grade],
    }))
  }

  const addEquipment = () => {
    if (newEquipment.trim() && !formData.equipmentRequired.includes(newEquipment.trim())) {
      setFormData((prev) => ({
        ...prev,
        equipmentRequired: [...prev.equipmentRequired, newEquipment.trim()],
      }))
      setNewEquipment('')
    }
  }

  const removeEquipment = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      equipmentRequired: prev.equipmentRequired.filter((e) => e !== item),
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
        <p>{t('activities.loadFailed')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('activities.title')}</h1>
          <p className="text-muted-foreground">
            {t('activities.subtitle')}
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          {t('activities.addActivity')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-5">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">{t('activities.total')}</p>
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
              <p className="text-sm text-muted-foreground">{t('activities.active')}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-100 p-2">
              <Trophy className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.sports}</p>
              <p className="text-sm text-muted-foreground">{t('activities.sports')}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2">
              <Music className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.music}</p>
              <p className="text-sm text-muted-foreground">{t('activities.music')}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-pink-100 p-2">
              <Palette className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.arts}</p>
              <p className="text-sm text-muted-foreground">{t('activities.arts')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('activities.searchPlaceholder')}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4 mr-2" />
          {t('activities.filters')}
          <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-4 rounded-lg border bg-card p-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('activities.type')}</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ActivityType | 'ALL')}
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="ALL">{t('activities.allTypes')}</option>
              {ACTIVITY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('activities.status')}</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ActivityStatus | 'ALL')}
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="ALL">{t('activities.allStatus')}</option>
              <option value="active">{t('activities.active')}</option>
              <option value="inactive">{t('activities.inactive')}</option>
              <option value="pending">{t('activities.pending')}</option>
              <option value="cancelled">{t('activities.cancelled')}</option>
            </select>
          </div>
        </div>
      )}

      {/* Activity Cards Grid */}
      {filteredActivities.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-xl border bg-card text-muted-foreground">
          <Calendar className="mb-2 h-12 w-12" />
          <p>{t('activities.noActivities')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredActivities.map((activity: Activity) => {
            const Icon = getActivityTypeIcon(activity.activityType)
            return (
              <div key={activity.id} className="rounded-xl border bg-card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-lg p-2 ${
                        activity.activityType === 'SPORT' ? 'bg-orange-100' :
                        activity.activityType === 'MUSIC' ? 'bg-purple-100' :
                        activity.activityType === 'ART' ? 'bg-pink-100' :
                        activity.activityType === 'CLUB' ? 'bg-blue-100' :
                        activity.activityType === 'TECHNOLOGY' ? 'bg-cyan-100' :
                        'bg-gray-100'
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          activity.activityType === 'SPORT' ? 'text-orange-600' :
                          activity.activityType === 'MUSIC' ? 'text-purple-600' :
                          activity.activityType === 'ART' ? 'text-pink-600' :
                          activity.activityType === 'CLUB' ? 'text-blue-600' :
                          activity.activityType === 'TECHNOLOGY' ? 'text-cyan-600' :
                          'text-gray-600'
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold">{activity.name}</h3>
                      <p className="text-xs text-muted-foreground">{getCategoryLabel(activity.category)}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === activity.id ? null : activity.id)}
                      className="rounded-lg p-1 hover:bg-muted"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {activeDropdown === activity.id && (
                      <div className="absolute right-0 z-10 mt-1 w-32 rounded-lg border bg-card py-1 shadow-lg">
                        <button
                          onClick={() => openEditModal(activity)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                        >
                          <Edit className="h-4 w-4" />
                          {t('activities.edit')}
                        </button>
                        <button
                          onClick={() => handleDelete(activity)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          {t('activities.delete')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {activity.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{activity.description}</p>
                )}

                <div className="space-y-2 text-sm text-muted-foreground">
                  {activity.dayOfWeek && activity.dayOfWeek.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        {activity.dayOfWeek.map((d: number) => WEEK_DAYS[d].slice(0, 3)).join(', ')}
                        {activity.startTime && ` at ${activity.startTime}`}
                      </span>
                    </div>
                  )}
                  {activity.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{activity.location}</span>
                    </div>
                  )}
                  {activity.hasFee && activity.feeAmount && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>
                        {activity.feeAmount} {activity.feeCurrency}/{activity.feeFrequency}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>
                      {activity.currentEnrollment ?? 0}/{activity.maxParticipants ?? '∞'} {t('activities.enrolled')}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      activity.status === 'active' ? 'bg-green-100 text-green-800' :
                      activity.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}
                  >
                    {activity.status}
                  </span>
                  <span className="text-xs text-muted-foreground">{activity.academicYear}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-card p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {editingActivity ? t('activities.editActivity') : t('activities.createActivity')}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick presets */}
            {!editingActivity && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">{t('activities.quickStart')}</label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_ACTIVITIES.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="rounded-full bg-muted px-3 py-1 text-sm hover:bg-muted/80"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('activities.name')} *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder={t('activities.namePlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('activities.academicYear')}</label>
                  <Input
                    value={formData.academicYear}
                    onChange={(e) => setFormData((prev) => ({ ...prev, academicYear: e.target.value }))}
                    disabled={!!editingActivity}
                    placeholder="2024"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('activities.type')} *</label>
                  <select
                    value={formData.activityType}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        activityType: e.target.value as ActivityType,
                        category: 'GENERAL',
                      }))
                    }}
                    disabled={!!editingActivity}
                    className="w-full rounded-md border px-3 py-2 text-sm disabled:bg-muted"
                  >
                    {ACTIVITY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('activities.category')} *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value as ActivityCategory }))}
                    disabled={!!editingActivity}
                    className="w-full rounded-md border px-3 py-2 text-sm disabled:bg-muted"
                  >
                    {filteredCategories.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('activities.description')}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder={t('activities.descriptionPlaceholder')}
                />
              </div>

              {/* Schedule */}
              <div className="rounded-lg border p-4">
                <h4 className="mb-3 font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t('activities.schedule')}
                </h4>
                <div className="mb-3">
                  <label className="block text-sm text-muted-foreground mb-2">{t('activities.daysOfWeek')}</label>
                  <div className="flex flex-wrap gap-2">
                    {WEEK_DAYS.map((day, index) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(index)}
                        className={`rounded-full px-3 py-1 text-sm transition-colors ${
                          formData.dayOfWeek.includes(index)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">{t('activities.startTime')}</label>
                    <Input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">{t('activities.endTime')}</label>
                    <Input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">{t('activities.durationMin')}</label>
                    <Input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData((prev) => ({ ...prev, duration: Number(e.target.value) }))}
                      min={15}
                      max={180}
                    />
                  </div>
                </div>
              </div>

              {/* Location & Capacity */}
              <div className="rounded-lg border p-4">
                <h4 className="mb-3 font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {t('activities.locationAndCapacity')}
                </h4>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">{t('activities.location')}</label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                      placeholder={t('activities.locationPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">{t('activities.minParticipants')}</label>
                    <Input
                      type="number"
                      value={formData.minParticipants}
                      onChange={(e) => setFormData((prev) => ({ ...prev, minParticipants: Number(e.target.value) }))}
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">{t('activities.maxParticipants')}</label>
                    <Input
                      type="number"
                      value={formData.maxParticipants}
                      onChange={(e) => setFormData((prev) => ({ ...prev, maxParticipants: Number(e.target.value) }))}
                      min={1}
                    />
                  </div>
                </div>
              </div>

              {/* Fees */}
              <div className="rounded-lg border p-4">
                <label className="mb-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.hasFee}
                    onChange={(e) => setFormData((prev) => ({ ...prev, hasFee: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    {t('activities.hasFee')}
                  </span>
                </label>
                {formData.hasFee && (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">{t('activities.amount')}</label>
                      <Input
                        type="number"
                        value={formData.feeAmount}
                        onChange={(e) => setFormData((prev) => ({ ...prev, feeAmount: Number(e.target.value) }))}
                        min={0}
                        step={0.01}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">{t('activities.currency')}</label>
                      <select
                        value={formData.feeCurrency}
                        onChange={(e) => setFormData((prev) => ({ ...prev, feeCurrency: e.target.value }))}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="MZN">MZN</option>
                        <option value="ZAR">ZAR</option>
                        <option value="AOA">AOA</option>
                        <option value="CDF">CDF</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">{t('activities.frequency')}</label>
                      <select
                        value={formData.feeFrequency}
                        onChange={(e) => setFormData((prev) => ({ ...prev, feeFrequency: e.target.value as typeof formData.feeFrequency }))}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      >
                        <option value="one_time">{t('activities.oneTime')}</option>
                        <option value="monthly">{t('activities.monthly')}</option>
                        <option value="per_session">{t('activities.perSession')}</option>
                        <option value="annual">{t('activities.annual')}</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Grade Restrictions */}
              <div className="rounded-lg border p-4">
                <h4 className="mb-3 font-medium">{t('activities.gradeRestrictions')}</h4>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => toggleGrade(grade)}
                      className={`rounded-full px-3 py-1 text-sm transition-colors ${
                        formData.gradeRestrictions.includes(grade)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {t('activities.grade', { number: grade })}
                    </button>
                  ))}
                </div>
                {formData.gradeRestrictions.length === 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">{t('activities.noRestrictions')}</p>
                )}
              </div>

              {/* Equipment */}
              <div className="rounded-lg border p-4">
                <h4 className="mb-3 font-medium">{t('activities.equipmentRequired')}</h4>
                <div className="flex gap-2">
                  <Input
                    value={newEquipment}
                    onChange={(e) => setNewEquipment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEquipment())}
                    placeholder={t('activities.equipmentPlaceholder')}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={addEquipment}>
                    {t('activities.add')}
                  </Button>
                </div>
                {formData.equipmentRequired.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.equipmentRequired.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => removeEquipment(item)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>
                  {t('activities.cancel')}
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingActivity ? t('activities.update') : t('activities.create')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
