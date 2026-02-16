/**
 * Room Management Hooks
 * For managing rooms used in scheduling
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { roomsApi } from '../api/client'

// ==================== QUERY KEYS ====================

export const roomKeys = {
  all: ['rooms'] as const,
  lists: () => [...roomKeys.all, 'list'] as const,
  list: (schoolId: string, filters?: RoomFilters) => [...roomKeys.lists(), schoolId, filters] as const,
  details: () => [...roomKeys.all, 'detail'] as const,
  detail: (id: string) => [...roomKeys.details(), id] as const,
  availability: (roomId: string) => [...roomKeys.all, 'availability', roomId] as const,
}

// ==================== TYPES ====================

export type RoomType = 'CLASSROOM' | 'LAB' | 'LIBRARY' | 'GYM' | 'AUDITORIUM' | 'COMPUTER_LAB' | 'ART_ROOM' | 'MUSIC_ROOM' | 'OTHER'
export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'CLOSED'

export interface Room {
  id: string
  school_id: string
  name: string
  code: string
  room_type: RoomType
  capacity: number
  floor: string
  building: string
  description?: string
  has_projector: boolean
  has_whiteboard: boolean
  has_smartboard: boolean
  has_computers: boolean
  computer_count?: number
  is_accessible: boolean
  status: RoomStatus
  created_at: string
  updated_at: string
}

export interface RoomFilters {
  room_type?: RoomType
  status?: RoomStatus
  min_capacity?: number
  max_capacity?: number
  floor?: string
  building?: string
  has_projector?: boolean
  has_computers?: boolean
  is_accessible?: boolean
  search?: string
}

export interface CreateRoomInput {
  name: string
  code: string
  room_type: RoomType
  capacity: number
  floor?: string
  building?: string
  description?: string
  has_projector?: boolean
  has_whiteboard?: boolean
  has_smartboard?: boolean
  has_computers?: boolean
  computer_count?: number
  is_accessible?: boolean
}

export interface UpdateRoomInput {
  name?: string
  code?: string
  room_type?: RoomType
  capacity?: number
  floor?: string
  building?: string
  description?: string
  has_projector?: boolean
  has_whiteboard?: boolean
  has_smartboard?: boolean
  has_computers?: boolean
  computer_count?: number
  is_accessible?: boolean
  status?: RoomStatus
}

export interface RoomAvailability {
  id: string
  room_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_available: boolean
  reason?: string
}

// ==================== HOOKS ====================

/**
 * Get all rooms for a school
 */
export function useRooms(schoolId: string, filters?: RoomFilters) {
  return useQuery({
    queryKey: roomKeys.list(schoolId, filters),
    queryFn: async () => {
      const response = await roomsApi.getAll(schoolId, {
        type: filters?.room_type,
        status: filters?.status,
        min_capacity: filters?.min_capacity,
        floor: filters?.floor ? parseInt(filters.floor) : undefined,
        has_projector: filters?.has_projector,
        has_computer: filters?.has_computers,
        is_accessible: filters?.is_accessible,
      })
      return response.data as Room[]
    },
    enabled: !!schoolId,
  })
}

/**
 * Get a single room by ID
 */
export function useRoom(schoolId: string, roomId: string) {
  return useQuery({
    queryKey: roomKeys.detail(roomId),
    queryFn: async () => {
      const response = await roomsApi.getById(schoolId, roomId)
      return response.data as Room
    },
    enabled: !!schoolId && !!roomId,
  })
}

/**
 * Create a new room
 */
export function useCreateRoom(schoolId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateRoomInput) => {
      const response = await roomsApi.create(schoolId, {
        code: data.code,
        name: data.name,
        type: data.room_type,
        capacity: data.capacity,
        floor: data.floor ? parseInt(data.floor) : undefined,
        building: data.building,
        description: data.description,
        has_projector: data.has_projector,
        has_whiteboard: data.has_whiteboard,
        has_computers: data.has_computers,
        computer_count: data.computer_count,
        is_accessible: data.is_accessible,
      })
      return response.data as Room
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roomKeys.lists() })
    },
  })
}

/**
 * Update a room
 */
export function useUpdateRoom(schoolId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ roomId, data }: { roomId: string; data: UpdateRoomInput }) => {
      const response = await roomsApi.update(schoolId, roomId, {
        name: data.name,
        type: data.room_type,
        capacity: data.capacity,
        floor: data.floor ? parseInt(data.floor) : undefined,
        building: data.building,
        description: data.description,
        has_projector: data.has_projector,
        has_whiteboard: data.has_whiteboard,
        has_computers: data.has_computers,
        computer_count: data.computer_count,
        is_accessible: data.is_accessible,
      })
      return response.data as Room
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: roomKeys.lists() })
      queryClient.invalidateQueries({ queryKey: roomKeys.detail(variables.roomId) })
    },
  })
}

/**
 * Delete a room
 */
export function useDeleteRoom(schoolId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (roomId: string) => {
      await roomsApi.delete(schoolId, roomId)
      return roomId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roomKeys.lists() })
    },
  })
}

/**
 * Update room status
 */
export function useUpdateRoomStatus(schoolId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ roomId, status }: { roomId: string; status: RoomStatus }) => {
      const response = await roomsApi.updateStatus(schoolId, roomId, status)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: roomKeys.lists() })
      queryClient.invalidateQueries({ queryKey: roomKeys.detail(variables.roomId) })
    },
  })
}

// ==================== AVAILABILITY HOOKS ====================

/**
 * Get room availability
 */
export function useRoomAvailability(schoolId: string, roomId: string, date?: string) {
  return useQuery({
    queryKey: [...roomKeys.availability(roomId), date],
    queryFn: async () => {
      const response = await roomsApi.getAvailability(schoolId, roomId, date)
      return response.data
    },
    enabled: !!schoolId && !!roomId,
  })
}

/**
 * Set room availability
 */
export function useSetRoomAvailability(schoolId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ roomId, data }: {
      roomId: string
      data: {
        day_of_week: number
        start_time: string
        end_time: string
        is_available: boolean
        reason?: string
      }
    }) => {
      const response = await roomsApi.setAvailability(schoolId, roomId, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: roomKeys.availability(variables.roomId) })
    },
  })
}

/**
 * Update room availability
 */
export function useUpdateRoomAvailability(schoolId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ roomId, availabilityId, data }: {
      roomId: string
      availabilityId: string
      data: Partial<RoomAvailability>
    }) => {
      const response = await roomsApi.updateAvailability(schoolId, roomId, availabilityId, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: roomKeys.availability(variables.roomId) })
    },
  })
}

/**
 * Delete room availability
 */
export function useDeleteRoomAvailability(schoolId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ roomId, availabilityId }: {
      roomId: string
      availabilityId: string
    }) => {
      await roomsApi.deleteAvailability(schoolId, roomId, availabilityId)
      return { roomId, availabilityId }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: roomKeys.availability(variables.roomId) })
    },
  })
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get rooms that meet minimum capacity requirements
 */
export function filterRoomsByCapacity(rooms: Room[], minCapacity: number): Room[] {
  return rooms.filter(room => room.capacity >= minCapacity)
}

/**
 * Get available rooms (status = AVAILABLE)
 */
export function getAvailableRooms(rooms: Room[]): Room[] {
  return rooms.filter(room => room.status === 'AVAILABLE')
}

/**
 * Get rooms by type
 */
export function getRoomsByType(rooms: Room[], type: RoomType): Room[] {
  return rooms.filter(room => room.room_type === type)
}

/**
 * Get rooms suitable for a subject (based on room type)
 */
export function getSuitableRooms(rooms: Room[], subjectName: string): Room[] {
  const subjectLower = subjectName.toLowerCase()
  
  // Map subject keywords to room types
  if (subjectLower.includes('computer') || subjectLower.includes('informática') || subjectLower.includes('tic')) {
    return rooms.filter(r => r.room_type === 'COMPUTER_LAB' || r.has_computers)
  }
  if (subjectLower.includes('física') || subjectLower.includes('química') || subjectLower.includes('biologia') || 
      subjectLower.includes('physics') || subjectLower.includes('chemistry') || subjectLower.includes('biology') ||
      subjectLower.includes('science')) {
    return rooms.filter(r => r.room_type === 'LAB')
  }
  if (subjectLower.includes('art') || subjectLower.includes('desenho') || subjectLower.includes('pintura')) {
    return rooms.filter(r => r.room_type === 'ART_ROOM')
  }
  if (subjectLower.includes('música') || subjectLower.includes('music')) {
    return rooms.filter(r => r.room_type === 'MUSIC_ROOM')
  }
  if (subjectLower.includes('educação física') || subjectLower.includes('physical education') || subjectLower.includes('sports')) {
    return rooms.filter(r => r.room_type === 'GYM')
  }
  
  // Default to classrooms for other subjects
  return rooms.filter(r => r.room_type === 'CLASSROOM')
}

/**
 * Check if a room has all required equipment
 */
export function hasRequiredEquipment(room: Room, requirements: {
  projector?: boolean
  computers?: boolean
  whiteboard?: boolean
  smartboard?: boolean
}): boolean {
  if (requirements.projector && !room.has_projector) return false
  if (requirements.computers && !room.has_computers) return false
  if (requirements.whiteboard && !room.has_whiteboard) return false
  if (requirements.smartboard && !room.has_smartboard) return false
  return true
}
