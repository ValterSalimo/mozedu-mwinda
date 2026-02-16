'use client'

import { useState } from 'react'
import { Button } from '@mozedu/ui'
import {
  Clock,
  Calendar,
  Check,
  X,
  AlertTriangle,
  Save,
  Loader2,
} from 'lucide-react'
import {
  useTeacherAvailability,
  useSetTeacherAvailability,
  useUpdateTeacherAvailability,
  useDeleteTeacherAvailability,
  useApproveTeacherAvailability,
} from '@/lib/hooks/use-teachers'

interface TeacherAvailabilityProps {
  teacherId: string
  schoolId: string
  isAdmin?: boolean
}

interface TimeSlot {
  startTime: string
  endTime: string
  isAvailable: boolean
  isPreference: boolean
  priority: number
}

type TeacherAvailabilityRecord = {
  id: string
  day_of_week: string
  start_time: string
  end_time: string
  is_available: boolean
  is_preference?: boolean
  approved_by_admin?: boolean
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Segunda-feira', short: 'Seg' },
  { value: 'tuesday', label: 'Terça-feira', short: 'Ter' },
  { value: 'wednesday', label: 'Quarta-feira', short: 'Qua' },
  { value: 'thursday', label: 'Quinta-feira', short: 'Qui' },
  { value: 'friday', label: 'Sexta-feira', short: 'Sex' },
  { value: 'saturday', label: 'Sábado', short: 'Sab' },
]

const DEFAULT_TIME_SLOTS = [
  { startTime: '07:00', endTime: '08:00' },
  { startTime: '08:00', endTime: '09:00' },
  { startTime: '09:00', endTime: '10:00' },
  { startTime: '10:00', endTime: '11:00' },
  { startTime: '11:00', endTime: '12:00' },
  { startTime: '13:00', endTime: '14:00' },
  { startTime: '14:00', endTime: '15:00' },
  { startTime: '15:00', endTime: '16:00' },
  { startTime: '16:00', endTime: '17:00' },
]

export function TeacherAvailability({ teacherId, schoolId, isAdmin = false }: TeacherAvailabilityProps) {
  const { data: availability, isLoading } = useTeacherAvailability(schoolId, teacherId)
  const setAvailability = useSetTeacherAvailability(schoolId, teacherId)
  const updateAvailability = useUpdateTeacherAvailability(schoolId, teacherId)
  const deleteAvailability = useDeleteTeacherAvailability(schoolId, teacherId)
  const approveAvailability = useApproveTeacherAvailability(schoolId)

  const [selectedDay, setSelectedDay] = useState('monday')
  const [editMode, setEditMode] = useState(false)
  const [localChanges, setLocalChanges] = useState<Record<string, boolean>>({})

  // Get availability for a specific day and time
  const getSlotStatus = (dayOfWeek: string, startTime: string) => {
    if (!availability || !Array.isArray(availability)) return null
    return (
      availability as TeacherAvailabilityRecord[]
    ).find((a) => a.day_of_week.toLowerCase() === dayOfWeek.toLowerCase() && a.start_time === startTime) || null
  }

  // Toggle slot availability locally
  const toggleSlot = (dayOfWeek: string, startTime: string, endTime: string) => {
    const key = `${dayOfWeek}-${startTime}`
    const existing = getSlotStatus(dayOfWeek, startTime)

    if (existing) {
      setLocalChanges(prev => ({
        ...prev,
        [key]: !(prev[key] ?? existing.is_available)
      }))
    } else {
      setLocalChanges(prev => ({
        ...prev,
        [key]: !(prev[key] ?? true) // Default to available if no record
      }))
    }
  }

  // Save changes
  const handleSave = async () => {
    for (const [key, isAvailable] of Object.entries(localChanges)) {
      const [dayOfWeek, startTime] = key.split('-')
      const slot = DEFAULT_TIME_SLOTS.find(s => s.startTime === startTime)
      if (!slot) continue

      const existing = getSlotStatus(dayOfWeek, startTime)

      if (existing) {
        await updateAvailability.mutateAsync({
          availabilityId: existing.id,
          data: {
            is_available: isAvailable,
            is_preference: !isAdmin, // Teachers set preferences, admins set constraints
          }
        })
      } else {
        await setAvailability.mutateAsync({
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: slot.endTime,
          is_available: isAvailable,
          is_preference: !isAdmin,
          priority: 1,
        })
      }
    }

    setLocalChanges({})
    setEditMode(false)
  }

  // Approve availability (admin only)
  const handleApprove = async (availabilityId: string, approved: boolean) => {
    await approveAvailability.mutateAsync({
      teacherId,
      availabilityId,
      approved,
      admin_notes: approved ? 'Aprovado' : 'Rejeitado pelo administrador',
    })
  }

  // Get display status for a slot
  const getDisplayStatus = (dayOfWeek: string, startTime: string) => {
    const key = `${dayOfWeek}-${startTime}`
    const existing = getSlotStatus(dayOfWeek, startTime)

    if (key in localChanges) {
      return localChanges[key] ? 'available' : 'unavailable'
    }

    if (existing) {
      if (existing.is_available) {
        if (existing.is_preference && !existing.approved_by_admin) {
          return 'pending'
        }
        return 'available'
      }
      return 'unavailable'
    }

    return 'available' // Default
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Disponibilidade do Professor
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {isAdmin
              ? 'Gerir a disponibilidade do professor para o horário escolar'
              : 'Indique os horários em que está disponível para dar aulas'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <Button variant="outline" onClick={() => {
                setLocalChanges({})
                setEditMode(false)
              }}>
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={Object.keys(localChanges).length === 0 || setAvailability.isPending || updateAvailability.isPending}
              >
                <Save className="h-4 w-4 mr-1" />
                Guardar
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditMode(true)}>
              Editar Disponibilidade
            </Button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span>Disponível</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span>Indisponível</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-500" />
          <span>Pendente de Aprovação</span>
        </div>
      </div>

      {/* Day Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {DAYS_OF_WEEK.map(day => (
          <button
            key={day.value}
            onClick={() => setSelectedDay(day.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedDay === day.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80'
              }`}
          >
            <span className="hidden sm:inline">{day.label}</span>
            <span className="sm:hidden">{day.short}</span>
          </button>
        ))}
      </div>

      {/* Time Slots Grid */}
      <div className="grid gap-2">
        {DEFAULT_TIME_SLOTS.map(slot => {
          const status = getDisplayStatus(selectedDay, slot.startTime)
          const existing = getSlotStatus(selectedDay, slot.startTime)

          return (
            <div
              key={slot.startTime}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${editMode ? 'cursor-pointer hover:border-primary' : ''
                } ${status === 'available'
                  ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                  : status === 'pending'
                    ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800'
                    : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                }`}
              onClick={() => editMode && toggleSlot(selectedDay, slot.startTime, slot.endTime)}
            >
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {slot.startTime} - {slot.endTime}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {status === 'available' && (
                  <span className="flex items-center gap-1 text-green-600">
                    <Check className="h-4 w-4" />
                    <span className="text-sm">Disponível</span>
                  </span>
                )}
                {status === 'unavailable' && (
                  <span className="flex items-center gap-1 text-red-600">
                    <X className="h-4 w-4" />
                    <span className="text-sm">Indisponível</span>
                  </span>
                )}
                {status === 'pending' && (
                  <span className="flex items-center gap-1 text-yellow-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">Pendente</span>
                  </span>
                )}

                {/* Admin approval buttons */}
                {isAdmin && existing && existing.is_preference && !existing.approved_by_admin && (
                  <div className="flex items-center gap-1 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-green-600 border-green-600 hover:bg-green-50"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleApprove(existing.id, true)
                      }}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-red-600 border-red-600 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleApprove(existing.id, false)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Weekly Overview (Compact View) */}
      <div className="mt-8">
        <h4 className="text-sm font-semibold mb-3">Visão Semanal</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left p-2 bg-muted">Hora</th>
                {DAYS_OF_WEEK.map(day => (
                  <th key={day.value} className="text-center p-2 bg-muted">
                    {day.short}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEFAULT_TIME_SLOTS.map(slot => (
                <tr key={slot.startTime}>
                  <td className="p-2 border-t text-muted-foreground">
                    {slot.startTime}
                  </td>
                  {DAYS_OF_WEEK.map(day => {
                    const status = getDisplayStatus(day.value, slot.startTime)
                    return (
                      <td key={day.value} className="p-1 border-t text-center">
                        <div
                          className={`w-6 h-6 mx-auto rounded ${status === 'available'
                            ? 'bg-green-500'
                            : status === 'pending'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                            }`}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
