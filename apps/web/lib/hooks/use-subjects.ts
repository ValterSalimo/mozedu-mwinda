
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { subjectsApi } from '../api/client'

export const subjectKeys = {
    all: ['subjects'] as const,
    lists: () => [...subjectKeys.all, 'list'] as const,
    list: (filters: SubjectListFilters) => [...subjectKeys.lists(), filters] as const,
    details: () => [...subjectKeys.all, 'detail'] as const,
    detail: (id: string) => [...subjectKeys.details(), id] as const,
}

export interface SubjectListFilters {
    page?: number
    pageSize?: number
    gradeLevel?: number
}

export interface Subject {
    id: string
    name: string
    code: string
    description?: string
    grade_level: number
    created_at: string
}

export function useSubjects(filters: SubjectListFilters = {}) {
    return useQuery({
        queryKey: subjectKeys.list(filters),
        queryFn: async () => {
            const response = await subjectsApi.getAll(filters)
            // The API returns { data: [...], total: ... } inside ApiResponse.data actually?
            // Check client.ts implementation: apiClient returns response.json().
            // If backend returns { "data": [], "total": ... }, then response is that object.
            // But client.ts wraps return type in ApiResponse<T>.
            // Let's assume response.data is the payload if successfully wrapped, or response IS the payload.
            // In client.ts: return response.json().
            // And backend handlers usually return c.JSON(200, gin.H{ "data": ... })
            // So response will be { data: [...], total: ... }

            const payload = response as unknown as { data: Subject[]; total: number }
            return payload.data
        },
    })
}

export function useCreateSubject() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: {
            name: string
            code: string
            description?: string
            grade_level: number
        }) => {
            const response = await subjectsApi.create(data)
            return response
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: subjectKeys.lists() })
        },
    })
}
