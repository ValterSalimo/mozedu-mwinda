'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { studentCardsApi } from '../api'

// ============================================================================
// Query Keys
// ============================================================================

export const studentCardKeys = {
  all: ['student-cards'] as const,
  templates: () => [...studentCardKeys.all, 'templates'] as const,
  settings: (schoolId: string) => [...studentCardKeys.all, 'settings', schoolId] as const,
  lists: () => [...studentCardKeys.all, 'list'] as const,
  listBySchool: (schoolId: string, year?: string) =>
    [...studentCardKeys.lists(), 'school', schoolId, year] as const,
  listByClass: (classId: string, year?: string) =>
    [...studentCardKeys.lists(), 'class', classId, year] as const,
  details: () => [...studentCardKeys.all, 'detail'] as const,
  detail: (id: string) => [...studentCardKeys.details(), id] as const,
  studentCard: (studentId: string, year: string) =>
    [...studentCardKeys.all, 'student', studentId, year] as const,
}

// ============================================================================
// Types
// ============================================================================

export interface StudentCardTemplate {
  id: string
  name: string
  description: string
  style: string
  front_layout: string
  back_layout: string
  front_html: string
  back_html: string
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SchoolCardSettings {
  id?: string
  school_id: string
  template_id?: string
  primary_color: string
  secondary_color: string
  accent_color: string
  numbering_method: string
  show_qr_code: boolean
  show_barcode: boolean
  show_photo: boolean
  show_blood_type: boolean
  show_emergency: boolean
  card_width: number
  card_height: number
  custom_fields: string
}

export interface StudentCard {
  id: string
  student_id: string
  school_id: string
  class_id?: string
  academic_year: string
  class_number: number
  card_number: string
  qr_code_data: string
  card_pdf_url: string
  status: string
  issued_at: string
  expires_at?: string
  emailed_to_parent: boolean
  emailed_at?: string
  created_at: string
  updated_at: string
  student?: {
    id: string
    user: {
      first_name: string
      last_name: string
      email: string
    }
    profile_image_url?: string
  }
}

export type NumberingMethod = 'alphabetical' | 'first_name' | 'enrollment' | 'manual'

// ============================================================================
// Template Hooks
// ============================================================================

export function useCardTemplates() {
  return useQuery({
    queryKey: studentCardKeys.templates(),
    queryFn: async () => {
      const res = await studentCardsApi.listTemplates()
      return (res.data || []) as StudentCardTemplate[]
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<StudentCardTemplate>) => {
      const res = await studentCardsApi.createTemplate(data as Record<string, unknown>)
      return res.data as StudentCardTemplate
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: studentCardKeys.templates() }),
  })
}

export function useUpdateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<StudentCardTemplate> }) => {
      const res = await studentCardsApi.updateTemplate(id, data as Record<string, unknown>)
      return res.data as StudentCardTemplate
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: studentCardKeys.templates() }),
  })
}

export function useDeleteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => studentCardsApi.deleteTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: studentCardKeys.templates() }),
  })
}

// ============================================================================
// School Settings Hooks
// ============================================================================

export function useSchoolCardSettings(schoolId: string) {
  return useQuery({
    queryKey: studentCardKeys.settings(schoolId),
    queryFn: async () => {
      const res = await studentCardsApi.getSchoolSettings(schoolId)
      return res.data as SchoolCardSettings
    },
    enabled: !!schoolId,
    staleTime: 2 * 60 * 1000,
  })
}

export function useUpdateSchoolCardSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ schoolId, data }: { schoolId: string; data: Partial<SchoolCardSettings> }) => {
      const res = await studentCardsApi.updateSchoolSettings(schoolId, data as Record<string, unknown>)
      return res.data as SchoolCardSettings
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: studentCardKeys.settings(vars.schoolId) })
    },
  })
}

// ============================================================================
// Card Listing Hooks
// ============================================================================

export function useCardsBySchool(
  schoolId: string,
  params?: { year?: string; page?: number; pageSize?: number }
) {
  return useQuery({
    queryKey: studentCardKeys.listBySchool(schoolId, params?.year),
    queryFn: async () => {
      const res = await studentCardsApi.listBySchool(schoolId, {
        year: params?.year,
        page: params?.page,
        page_size: params?.pageSize,
      })
      return {
        cards: (res.data || []) as StudentCard[],
        total: (res as unknown as { total?: number }).total || 0,
      }
    },
    enabled: !!schoolId,
    staleTime: 30 * 1000,
  })
}

export function useCardsByClass(
  classId: string,
  params?: { year?: string; page?: number; pageSize?: number }
) {
  return useQuery({
    queryKey: studentCardKeys.listByClass(classId, params?.year),
    queryFn: async () => {
      const res = await studentCardsApi.listByClass(classId, {
        year: params?.year,
        page: params?.page,
        page_size: params?.pageSize,
      })
      return {
        cards: (res.data || []) as StudentCard[],
        total: (res as unknown as { total?: number }).total || 0,
      }
    },
    enabled: !!classId,
    staleTime: 30 * 1000,
  })
}

// ============================================================================
// Card Generation Hooks
// ============================================================================

export function useGenerateCardForStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ studentId, academicYear }: { studentId: string; academicYear: string }) => {
      const res = await studentCardsApi.generateForStudent(studentId, academicYear)
      return res.data as StudentCard
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentCardKeys.lists() })
    },
  })
}

export function useGenerateCardsForClass() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ classId, academicYear }: { classId: string; academicYear: string }) => {
      const res = await studentCardsApi.generateForClass(classId, academicYear)
      return res.data as StudentCard[]
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentCardKeys.lists() })
    },
  })
}

export function useGenerateCardsForSchool() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ schoolId, academicYear }: { schoolId: string; academicYear: string }) => {
      const res = await studentCardsApi.generateForSchool(schoolId, academicYear)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentCardKeys.lists() })
    },
  })
}

// ============================================================================
// Card Operations Hooks
// ============================================================================

export function useEmailCardToParent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (cardId: string) => studentCardsApi.emailToParent(cardId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentCardKeys.lists() })
    },
  })
}

export function useEmailCardsForClass() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ classId, year }: { classId: string; year: string }) =>
      studentCardsApi.emailForClass(classId, year),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentCardKeys.lists() })
    },
  })
}

export function useRevokeCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (cardId: string) => studentCardsApi.revokeCard(cardId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentCardKeys.lists() })
    },
  })
}

export function useDeleteCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (cardId: string) => studentCardsApi.deleteCard(cardId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentCardKeys.lists() })
    },
  })
}

export function useRenumberClass() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ classId, method }: { classId: string; method: NumberingMethod }) =>
      studentCardsApi.renumberClass(classId, method),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentCardKeys.lists() })
    },
  })
}

export function useRenewCardsForSchool() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ schoolId, academicYear }: { schoolId: string; academicYear: string }) =>
      studentCardsApi.renewForSchool(schoolId, academicYear),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentCardKeys.lists() })
    },
  })
}

// ============================================================================
// HTML Card Preview Hooks
// ============================================================================

export function usePreviewTemplate() {
  return useMutation({
    mutationFn: async ({
      templateId,
      schoolId,
      side,
    }: {
      templateId: string
      schoolId?: string
      side: 'front' | 'back'
    }) => {
      const res = await studentCardsApi.previewTemplate(templateId, schoolId, side)
      return res as { html: string; side: string }
    },
  })
}

export function usePreviewCustomHTML() {
  return useMutation({
    mutationFn: async (data: {
      front_html: string
      back_html: string
      side: 'front' | 'back'
      primary_color: string
      secondary_color: string
      accent_color: string
    }) => {
      const res = await studentCardsApi.previewCustomHTML(data)
      return res as { html: string; side: string }
    },
  })
}

export function useRenderCardHTML() {
  return useMutation({
    mutationFn: async ({ cardId, side }: { cardId: string; side: 'front' | 'back' }) => {
      const res = await studentCardsApi.renderCardHTML(cardId, side)
      return res as unknown as string
    },
  })
}
