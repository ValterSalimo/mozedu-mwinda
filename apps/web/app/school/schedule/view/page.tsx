'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Calendar, Loader2, ArrowLeft, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { useCurrentEntity } from '@/lib/hooks/use-current-entity'
import { apiClient } from '@/lib/api/client'
import { useClasses } from '@/lib/hooks/use-classes'
import { useTeachers } from '@/lib/hooks/use-teachers'
import { useRoomsBySchool, useTimetablesBySchool } from '@/lib/hooks/use-timetable'

type ViewMode = 'class' | 'teacher' | 'room'

type SchedulePeriod = {
  period_number?: number
  day_of_week?: string
  start_time?: string
  end_time?: string
  period_type?: string
}

type ScheduleSlot = {
  id?: string
  period?: SchedulePeriod
  class?: { id?: string; name?: string; section?: string }
  subject?: { id?: string; name?: string; code?: string }
  teacher?: {
    id?: string
    user?: { first_name?: string; last_name?: string; firstName?: string; lastName?: string }
    first_name?: string
    last_name?: string
  }
  room?: { id?: string; name?: string }
}

const DAYS: Array<{ key: string; idx: number }> = [
  { key: 'monday', idx: 1 },
  { key: 'tuesday', idx: 2 },
  { key: 'wednesday', idx: 3 },
  { key: 'thursday', idx: 4 },
  { key: 'friday', idx: 5 },
]

function toDayIndex(day?: string): number | null {
  if (!day) return null
  const normalized = day.toLowerCase()
  const found = DAYS.find((d) => d.key === normalized)
  return found ? found.idx : null
}

function formatTime(value?: string) {
  if (!value) return ''
  // backend may send "07:30:00" or RFC3339-ish; keep it simple
  return value.length >= 5 ? value.slice(0, 5) : value
}

function teacherName(slot: ScheduleSlot): string {
  const user = slot.teacher?.user
  const first = user?.first_name ?? user?.firstName ?? slot.teacher?.first_name ?? ''
  const last = user?.last_name ?? user?.lastName ?? slot.teacher?.last_name ?? ''
  return `${first} ${last}`.trim()
}

export default function ScheduleViewPage() {
  const { schoolId } = useCurrentEntity()
  const t = useTranslations('school')

  const [viewMode, setViewMode] = useState<ViewMode>('class')
  const [selectedId, setSelectedId] = useState('')
  const [slots, setSlots] = useState<ScheduleSlot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: classesData } = useClasses(schoolId || '')
  const { data: teachersData } = useTeachers({ schoolId: schoolId || '', limit: 200 })
  const { data: roomsData } = useRoomsBySchool(schoolId || '')
  const { data: timetablesData } = useTimetablesBySchool(schoolId || '')

  const classes = Array.isArray(classesData) ? classesData : []
  const teachers = Array.isArray(teachersData) ? teachersData : []
  const rooms = (Array.isArray(roomsData) ? roomsData : (roomsData as any)?.data) || []
  const timetables = (Array.isArray(timetablesData) ? timetablesData : (timetablesData as any)?.data) || []

  const activeTimetable = useMemo(() => {
    const list = Array.isArray(timetables) ? timetables : []
    return list.find((t: any) => t?.status === 'active')
  }, [timetables])

  useEffect(() => {
    setSelectedId('')
    setSlots([])
    setError(null)
  }, [viewMode])

  useEffect(() => {
    const load = async () => {
      if (!schoolId || !selectedId) {
        setSlots([])
        return
      }

      setIsLoading(true)
      setError(null)
      try {
        let endpoint = ''
        if (viewMode === 'class') endpoint = `/api/v1/schools/${schoolId}/schedule/class/${selectedId}`
        if (viewMode === 'teacher') endpoint = `/api/v1/schools/${schoolId}/schedule/teacher/${selectedId}`
        if (viewMode === 'room') endpoint = `/api/v1/schools/${schoolId}/schedule/room/${selectedId}`

        const result = await apiClient<unknown>(endpoint)
        const list = Array.isArray(result) ? (result as ScheduleSlot[]) : ((result as any)?.data as ScheduleSlot[]) || []
        setSlots(list)
      } catch (e: any) {
        setSlots([])
        setError(e?.message || t('schedule.errorLoadingSchedule'))
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [schoolId, selectedId, viewMode])

  const maxPeriods = useMemo(() => {
    const periodNumbers = slots
      .map((s) => s.period?.period_number)
      .filter((n): n is number => typeof n === 'number' && Number.isFinite(n))
    return periodNumbers.length ? Math.max(...periodNumbers) : 8
  }, [slots])

  const slotByDayPeriod = useMemo(() => {
    const map = new Map<string, ScheduleSlot>()
    for (const s of slots) {
      const dayIdx = toDayIndex(s.period?.day_of_week)
      const period = s.period?.period_number
      if (!dayIdx || !period) continue
      map.set(`${dayIdx}:${period}`, s)
    }
    return map
  }, [slots])

  const options = useMemo<Array<{ id: string; label: string }>>(() => {
    if (viewMode === 'class') {
      return classes.map((c: any) => ({ id: c.id as string, label: `${c.name}${c.section ? ` - ${c.section}` : ''}` }))
    }
    if (viewMode === 'teacher') {
      return teachers.map((t: any) => {
        const first = t?.user?.firstName ?? t?.user?.first_name ?? t?.first_name ?? ''
        const last = t?.user?.lastName ?? t?.user?.last_name ?? t?.last_name ?? ''
        return { id: t.id as string, label: `${first} ${last}`.trim() || (t.id as string) }
      })
    }
    return rooms.map((r: any) => ({ id: r.id as string, label: (r.name as string) || (r.id as string) }))
  }, [viewMode, classes, teachers, rooms])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/school/schedule">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{t('schedule.viewSchedules')}</h1>
            <p className="text-muted-foreground">{t('schedule.viewSchedulesSub')}</p>
          </div>
        </div>
        {activeTimetable && (
          <Badge variant="success">{t('schedule.active')}: {activeTimetable.name}</Badge>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{t('schedule.filters')}</CardTitle>
          <CardDescription>{t('schedule.filterDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('schedule.viewBy')}</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as ViewMode)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="class">{t('schedule.class')}</option>
                <option value="teacher">{t('schedule.teacher')}</option>
                <option value="room">{t('schedule.room')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('schedule.select')}</label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="">{t('schedule.selectOption')}</option>
                {options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {!selectedId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center min-h-[360px] text-center">
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <Calendar className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('schedule.selectFilter')}</h3>
            <p className="text-muted-foreground">{t('schedule.selectFilterHint')}</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center min-h-[360px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center min-h-[360px] text-center">
            <AlertCircle className="h-10 w-10 text-destructive mb-3" />
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : slots.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center min-h-[360px] text-center">
            <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">{t('schedule.noScheduleFound')}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4 overflow-x-auto">
            <table className="w-full border-collapse min-w-[900px]">
              <thead>
                <tr>
                  <th className="border p-2 bg-muted/50 w-20">{t('schedule.period')}</th>
                  {DAYS.map((d) => (
                    <th key={d.key} className="border p-2 bg-muted/50">
                      {t(`schedule.${d.key}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: maxPeriods }, (_, i) => i + 1).map((period) => (
                  <tr key={period}>
                    <td className="border p-2 text-center font-medium bg-muted/30">{period}º</td>
                    {DAYS.map((d) => {
                      const s = slotByDayPeriod.get(`${d.idx}:${period}`)
                      const subject = s?.subject?.name || ''
                      const roomName = s?.room?.name || ''
                      const className = s?.class?.name || ''
                      const tName = s ? teacherName(s) : ''
                      const start = formatTime(s?.period?.start_time)
                      const end = formatTime(s?.period?.end_time)

                      return (
                        <td key={d.key} className="border p-1 min-w-[160px] h-20 align-top">
                          {s ? (
                            <div className="p-2 rounded border h-full bg-background">
                              <div className="font-semibold text-sm truncate">{subject || '—'}</div>
                              <div className="text-xs text-muted-foreground truncate">{viewMode !== 'class' ? className : tName}</div>
                              <div className="text-xs text-muted-foreground truncate">{viewMode !== 'room' ? roomName : ''}</div>
                              <div className="text-xs text-muted-foreground">{start && end ? `${start} - ${end}` : ''}</div>
                            </div>
                          ) : null}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
