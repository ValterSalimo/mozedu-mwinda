'use client'

import { useState, useMemo } from 'react'
import { Button } from '@mozedu/ui'
import { useTranslations } from 'next-intl'
import {
  Calendar,
  Clock,
  Users,
  BookOpen,
  FileText,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Loader2,
} from 'lucide-react'
import { useParentChildren, useClassTimetable, useParentId, useCurrentEntity } from '@/lib/hooks'
import { useUser } from '@/lib/stores'

export default function SchedulePage() {
  const t = useTranslations('parent.schedule')
  const user = useUser()

  // Ensure entity is resolved
  useCurrentEntity()
  const parentId = useParentId() || user?.id || ''

  const { data: childrenList, isLoading: childrenLoading } = useParentChildren(parentId)

  const [selectedChildId, setSelectedChildId] = useState<string>('')
  const [selectedView, setSelectedView] = useState('week')
  const [currentWeek, setCurrentWeek] = useState(0)

  // Select first child by default when data loads
  const activeChildId = useMemo(() => {
    if (selectedChildId) return selectedChildId
    if (childrenList && childrenList.length > 0) return childrenList[0].id
    return ''
  }, [childrenList, selectedChildId])

  const selectedChild = useMemo(() => {
    if (!childrenList) return null
    return childrenList.find(c => c.id === activeChildId) || null
  }, [childrenList, activeChildId])

  const views = [
    { id: 'week', name: t('weeklySchedule') || 'Semana' },
    { id: 'month', name: 'Mês' },
  ]

  const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']

  // Fetch schedule
  const { data: timetableData, isLoading: timetableLoading } = useClassTimetable(
    selectedChild?.school?.id || '',
    selectedChild?.class?.id || '',
    undefined // Fetch master timetable (no specific date)
  )

  const schedule = useMemo(() => {
    if (!timetableData) return []

    // Map days string to index (0-4)
    const dayMap: Record<string, number> = {
      'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3, 'friday': 4,
      'segunda': 0, 'terça': 1, 'quarta': 2, 'quinta': 3, 'sexta': 4, // Portuguese just in case
      'segunda-feira': 0, 'terça-feira': 1, 'quarta-feira': 2, 'quinta-feira': 3, 'sexta-feira': 4,
      'MONDAY': 0, 'TUESDAY': 1, 'WEDNESDAY': 2, 'THURSDAY': 3, 'FRIDAY': 4
    }

    return timetableData.map((slot: any) => ({
      day: typeof slot.day_of_week === 'number'
        ? slot.day_of_week - 1 // Assume 1-based index from backend if number
        : dayMap[slot.day_of_week?.toLowerCase()] ?? 0,
      time: slot.start_time?.slice(0, 5) || '',
      subject: slot.subject?.name || 'Disciplina',
      teacher: slot.teacher?.user
        ? `${slot.teacher.user.first_name} ${slot.teacher.user.last_name}`
        : 'Professor',
      room: slot.room?.code || 'Sala'
    }))
  }, [timetableData])

  const isLoading = childrenLoading || (!!selectedChild && timetableLoading)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!childrenList || childrenList.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">{t('noChildrenFound')}</h3>
        <p className="text-sm text-muted-foreground">Não foram encontrados educandos associados à sua conta.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('scheduleNav') || 'Horários'}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('subtitle') || 'Consulte o horário escolar dos seus educandos'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => {
            if (!schedule || schedule.length === 0) {
              alert('Nenhum horário para exportar')
              return
            }
            
            const headers = ['Dia', 'Hora', 'Disciplina', 'Professor', 'Sala']
            const csvContent = [
              headers.join(','),
              ...schedule.map((slot: any) => [
                days[slot.day] || '',
                slot.time,
                `"${slot.subject}"`,
                `"${slot.teacher}"`,
                slot.room
              ].join(','))
            ].join('\n')

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `horario-${selectedChild?.firstName || 'schedule'}-${new Date().toISOString().split('T')[0]}.csv`
            a.click()
            window.URL.revokeObjectURL(url)
          }}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-card rounded-xl p-4 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Child Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {childrenList.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedChildId(c.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeChildId === c.id
                  ? 'bg-accent-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${activeChildId === c.id ? 'bg-white text-accent-600' : 'bg-gray-300 text-gray-600'
                  }`}>
                  {c.firstName.charAt(0)}{c.lastName.charAt(0)}
                </div>
                <span className="font-medium">{c.firstName}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {/* View Selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {views.map((view) => (
                <button
                  key={view.id}
                  onClick={() => setSelectedView(view.id)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${selectedView === view.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {view.name}
                </button>
              ))}
            </div>

            {/* Week Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setCurrentWeek(c => c - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[100px] text-center">
                {currentWeek === 0 ? 'Esta Semana' : currentWeek > 0 ? `Próxima (${currentWeek})` : `Anterior (${Math.abs(currentWeek)})`}
              </span>
              <Button variant="ghost" size="icon" onClick={() => setCurrentWeek(c => c + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        {schedule.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Horário não disponível</h3>
            <p className="text-sm text-muted-foreground">
              O horário escolar para {selectedChild?.firstName} ainda não está disponível ou não foi publicado.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header */}
              <div className="grid grid-cols-6 border-b border-gray-200 bg-gray-50">
                <div className="p-4 text-sm font-medium text-gray-500 text-center border-r border-gray-200">
                  Horário
                </div>
                {days.map((day, index) => (
                  <div key={index} className="p-4 text-sm font-medium text-gray-900 text-center border-r border-gray-200 last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>

              {/* Time Slots */}
              {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'].map((time, timeIndex) => (
                <div key={timeIndex} className="grid grid-cols-6 border-b border-gray-200 last:border-b-0">
                  <div className="p-4 text-sm text-gray-500 text-center border-r border-gray-200 bg-gray-50">
                    {time}
                  </div>
                  {days.map((_, dayIndex) => {
                    // This logic would be replaced by real schedule matching
                    const slot = schedule.find(s => s.day === dayIndex && s.time.startsWith(time))

                    return (
                      <div key={dayIndex} className="p-2 border-r border-gray-200 last:border-r-0 min-h-[100px]">
                        {slot ? (
                          <div className="h-full p-3 rounded-lg bg-blue-50 border border-blue-100 hover:shadow-md transition-shadow cursor-pointer">
                            <p className="font-bold text-blue-700 text-sm mb-1">{slot.subject}</p>
                            <div className="flex items-center gap-1 text-xs text-blue-600 mb-1">
                              <Users className="h-3 w-3" />
                              <span>{slot.teacher}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-blue-500">
                              <Clock className="h-3 w-3" />
                              <span>{slot.room}</span>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
