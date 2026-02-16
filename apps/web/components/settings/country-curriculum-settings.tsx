'use client'

import { useState } from 'react'
import { Button, Input } from '@mozedu/ui'
import {
  Globe,
  BookOpen,
  Save,
  Info,
  Loader2,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { schoolsApi } from '@/lib/api/client'
import { toast } from 'sonner'
import { 
  COUNTRY_CONFIGS, 
  CURRICULUM_CONFIGS,
  getCountryConfig,
  getAvailableCurriculumsForCountry 
} from '@/lib/constants/country-configs'
import type { CountryCode, CurriculumSystem, LanguageCode } from '@mozedu/types'

interface CountryCurriculumSettingsProps {
  schoolId: string
}

export function CountryCurriculumSettings({ schoolId }: CountryCurriculumSettingsProps) {
  const queryClient = useQueryClient()
  
  // Fetch school data
  const { data: school, isLoading } = useQuery({
    queryKey: ['school', schoolId],
    queryFn: async () => {
      const response = await schoolsApi.getById(schoolId)
      return response.data
    },
    enabled: !!schoolId,
  })

  const [formData, setFormData] = useState<{
    country: CountryCode
    primaryLanguage: LanguageCode
    primaryCurriculum: CurriculumSystem
    secondaryCurriculums: CurriculumSystem[]
  }>({
    country: (school as any)?.country || 'MZ',
    primaryLanguage: (school as any)?.preferredLanguage || 'pt',
    primaryCurriculum: (school as any)?.curriculumSystems?.[0] || 'MOZAMBIQUE_NATIONAL',
    secondaryCurriculums: (school as any)?.curriculumSystems?.slice(1) || [],
  })

  const [isEditing, setIsEditing] = useState(false)

  // Update school mutation
  const updateSchool = useMutation({
    mutationFn: async (data: typeof formData) => {
      return schoolsApi.update(schoolId, {
        country: data.country,
        preferred_language: data.primaryLanguage,
        curriculum_systems: [data.primaryCurriculum, ...data.secondaryCurriculums],
      })
    },
    onSuccess: () => {
      toast.success('Country and curriculum settings updated successfully')
      queryClient.invalidateQueries({ queryKey: ['school', schoolId] })
      setIsEditing(false)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update settings')
    },
  })

  const handleSave = () => {
    updateSchool.mutate(formData)
  }

  const handleCountryChange = (country: CountryCode) => {
    const countryConfig = getCountryConfig(country)
    setFormData({
      country,
      primaryLanguage: countryConfig.defaultLanguage,
      primaryCurriculum: countryConfig.defaultCurriculum,
      secondaryCurriculums: [],
    })
  }

  const availableCurriculums = formData.country 
    ? getAvailableCurriculumsForCountry(formData.country)
    : Object.values(CURRICULUM_CONFIGS)

  const selectedCountry = getCountryConfig(formData.country)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Country & Curriculum Configuration</h3>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="outline">
            Edit Settings
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                setIsEditing(false)
                // Reset form
                setFormData({
                  country: (school as any)?.country || 'MZ',
                  primaryLanguage: (school as any)?.preferredLanguage || 'pt',
                  primaryCurriculum: (school as any)?.curriculumSystems?.[0] || 'MOZAMBIQUE_NATIONAL',
                  secondaryCurriculums: (school as any)?.curriculumSystems?.slice(1) || [],
                })
              }} 
              variant="outline"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={updateSchool.isPending}
            >
              {updateSchool.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Country Selection */}
      <div className="rounded-lg border p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Select Country
          </label>
          <select
            value={formData.country}
            onChange={(e) => handleCountryChange(e.target.value as CountryCode)}
            disabled={!isEditing}
            className="w-full p-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {Object.entries(COUNTRY_CONFIGS).map(([code, config]) => (
              <option key={code} value={code}>
                {config.name}
              </option>
            ))}
          </select>
        </div>

        {/* Country Info */}
        {selectedCountry && (
          <div className="bg-blue-50 p-3 rounded-md">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 text-blue-600" />
              <div className="text-sm text-blue-900">
                <p><strong>Default Language:</strong> {selectedCountry.defaultLanguage.toUpperCase()}</p>
                <p><strong>Grade Scale:</strong> {selectedCountry.gradeScale.min}-{selectedCountry.gradeScale.max} (Passing: {selectedCountry.gradeScale.passingScore})</p>
                <p><strong>Terms per Year:</strong> {selectedCountry.academicTerms.count}</p>
                {selectedCountry.assessmentTypes.finalExamName && (
                  <p><strong>Final Exam:</strong> {selectedCountry.assessmentTypes.finalExamName}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Language Selection */}
      <div className="rounded-lg border p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Primary Language
          </label>
          <select
            value={formData.primaryLanguage}
            onChange={(e) => setFormData({ ...formData, primaryLanguage: e.target.value as LanguageCode })}
            disabled={!isEditing}
            className="w-full p-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedCountry.supportedLanguages.map((lang) => (
              <option key={lang} value={lang}>
                {lang === 'pt' ? 'Portuguese' : lang === 'en' ? 'English' : lang === 'fr' ? 'French' : 'Turkish'}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            This language will be used for all communications, emails, and notifications
          </p>
        </div>
      </div>

      {/* Curriculum Selection */}
      <div className="rounded-lg border p-4 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-4 w-4" />
          <h4 className="font-medium">Curriculum Systems</h4>
        </div>

        {/* Primary Curriculum */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Primary Curriculum System
          </label>
          <select
            value={formData.primaryCurriculum}
            onChange={(e) => setFormData({ ...formData, primaryCurriculum: e.target.value as CurriculumSystem })}
            disabled={!isEditing}
            className="w-full p-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {availableCurriculums.map((curriculum) => (
              <option key={curriculum.system} value={curriculum.system}>
                {curriculum.name}
              </option>
            ))}
          </select>
          {CURRICULUM_CONFIGS[formData.primaryCurriculum] && (
            <p className="text-xs text-gray-500 mt-1">
              {CURRICULUM_CONFIGS[formData.primaryCurriculum].description}
            </p>
          )}
        </div>

        {/* Secondary Curriculums */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Additional Curriculum Systems (Optional)
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Schools can support multiple curriculum systems simultaneously
          </p>
          <div className="space-y-2">
            {availableCurriculums
              .filter(c => c.system !== formData.primaryCurriculum)
              .map((curriculum) => (
                <label key={curriculum.system} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.secondaryCurriculums.includes(curriculum.system)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          secondaryCurriculums: [...formData.secondaryCurriculums, curriculum.system]
                        })
                      } else {
                        setFormData({
                          ...formData,
                          secondaryCurriculums: formData.secondaryCurriculums.filter(s => s !== curriculum.system)
                        })
                      }
                    }}
                    disabled={!isEditing}
                    className="rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm">{curriculum.name}</span>
                </label>
              ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-lg bg-gray-50 p-4">
        <h4 className="font-medium mb-2">Current Configuration Summary</h4>
        <div className="text-sm text-gray-700 space-y-1">
          <p><strong>Country:</strong> {selectedCountry.name}</p>
          <p><strong>Language:</strong> {formData.primaryLanguage.toUpperCase()}</p>
          <p><strong>Primary Curriculum:</strong> {CURRICULUM_CONFIGS[formData.primaryCurriculum]?.name}</p>
          {formData.secondaryCurriculums.length > 0 && (
            <p>
              <strong>Additional Curriculums:</strong>{' '}
              {formData.secondaryCurriculums.map(s => CURRICULUM_CONFIGS[s]?.name).join(', ')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
