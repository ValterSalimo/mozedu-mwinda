import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { graphqlClient, queries } from '../api/graphql'
import { classesApi } from '../api/client'

export const classKeys = {
  all: ['classes'] as const,
  lists: () => [...classKeys.all, 'list'] as const,
  list: (schoolId: string) => [...classKeys.lists(), schoolId] as const,
}

export function useClasses(schoolId?: string) {
  return useQuery({
    queryKey: classKeys.list(schoolId || ''),
    queryFn: async () => {
      if (!schoolId) return []
      // Attempting to use REST API as fallback if GraphQL fails or for simplicity, 
      // but keeping GraphQL as primary if it works. 
      // Actually let's switch to REST to be consistent with mutations if GraphQL is partial.
      // But preserving existing logic as requested.
      const response = await graphqlClient<{ school: { classes: { edges: Array<{ node: any }> } } }>(
        queries.schoolClasses,
        { id: schoolId }
      )
      return response.school?.classes?.edges.map(edge => edge.node) || []
    },
    enabled: !!schoolId,
  })
}

export interface CreateClassData {
  school_id: string
  name: string
  grade_level: number
  academic_year: string
  class_teacher_id?: string
  max_students?: number
}

export function useCreateClass() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateClassData) => {
      const response = await classesApi.create(data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.lists() })
    },
  })
}

export function useDeleteClass() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await classesApi.delete(id)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.lists() })
    },
  })
}
