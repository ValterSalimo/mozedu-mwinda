"use client";

import { useState } from "react";
import { useTranslations } from 'next-intl';
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { Badge } from "@repo/ui/badge";
import { useToast } from "@repo/ui";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth-store";

interface ScheduledSession {
  id: string;
  timetable_slot_id?: string;
  teacher_id: string;
  class_id: string;
  subject_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  is_scheduled: boolean;
  room_id?: string;
  class: { id: string; name: string };
  subject: { id: string; name: string };
  room?: { id: string; name: string; code: string };
}

interface AttendanceComparison {
  scheduled_sessions: number;
  actual_sessions: number;
  missed_sessions: number;
  unscheduled_sessions: number;
}

export default function AttendanceSchedulePage() {
  const t = useTranslations('teacher');
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const user = useAuthStore((s) => s.user);
  const teacherId = user?.entityId || user?.id || '';

  // Fetch scheduled sessions for today
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["scheduledSessions", teacherId, selectedDate],
    queryFn: () =>
      apiClient<ScheduledSession[]>(
        `/api/v1/timetable-attendance/teachers/${teacherId}/scheduled?date=${selectedDate}`
      ),
    enabled: !!teacherId,
  });

  // Fetch comparison stats for the week
  const startOfWeek = getMonday(new Date(selectedDate));
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);

  const { data: comparison } = useQuery({
    queryKey: ["attendanceComparison", teacherId, startOfWeek],
    queryFn: () =>
      apiClient<AttendanceComparison>(
        `/api/v1/timetable-attendance/teachers/${teacherId}/comparison?start_date=${formatDate(startOfWeek)}&end_date=${formatDate(endOfWeek)}`
      ),
    enabled: !!teacherId,
  });

  const startSession = async (sessionId: string) => {
    try {
      await apiClient(`/api/v1/attendance/sessions/${sessionId}/start`, {
        method: "POST",
      });
      toast({
        title: t('attendanceSchedule.successTitle'),
        description: t('attendanceSchedule.sessionStarted'),
      });
    } catch (error) {
      toast({
        title: t('attendanceSchedule.errorTitle'),
        description: t('attendanceSchedule.failedToStart'),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('attendanceSchedule.title')}</h1>
          <p className="text-muted-foreground">{t('attendanceSchedule.description')}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      {/* Stats Cards */}
      {comparison && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('attendanceSchedule.scheduledSessions')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{comparison.scheduled_sessions}</div>
              <p className="text-xs text-muted-foreground">{t('attendanceSchedule.thisWeek')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('attendanceSchedule.sessionsHeld')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {comparison.actual_sessions}
              </div>
              <p className="text-xs text-muted-foreground">
                {comparison.scheduled_sessions > 0
                  ? Math.round((comparison.actual_sessions / comparison.scheduled_sessions) * 100)
                  : 0}
                {t('attendanceSchedule.completion')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('attendanceSchedule.missedSessions')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{comparison.missed_sessions}</div>
              <p className="text-xs text-muted-foreground">{t('attendanceSchedule.notConducted')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('attendanceSchedule.extraSessions')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {comparison.unscheduled_sessions}
              </div>
              <p className="text-xs text-muted-foreground">{t('attendanceSchedule.unscheduled')}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {t('attendanceSchedule.todaySchedule')}
          </CardTitle>
          <CardDescription>
            {new Date(selectedDate).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">{t('attendanceSchedule.loadingSchedule')}</div>
          ) : sessions && sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.map((session: ScheduledSession) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {formatTime(session.start_time)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(session.end_time)}
                      </span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{session.subject.name}</h3>
                        {session.is_scheduled && (
                          <Badge variant="outline">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            {t('attendanceSchedule.scheduled')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{session.class.name}</p>
                      {session.room && (
                        <p className="text-xs text-muted-foreground">
                          {t('attendanceSchedule.room')} {session.room.code} - {session.room.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {session.is_active ? (
                      <Badge variant="default" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {t('attendanceSchedule.active')}
                      </Badge>
                    ) : isPast(session.end_time) ? (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        {t('attendanceSchedule.completed')}
                      </Badge>
                    ) : isPast(session.start_time) ? (
                      <Badge variant="danger" className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {t('attendanceSchedule.missed')}
                      </Badge>
                    ) : (
                      <Button size="sm" onClick={() => startSession(session.id)}>
                        {t('attendanceSchedule.startSession')}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t('attendanceSchedule.noScheduledSessions')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t('attendanceSchedule.statusLegend')}</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              <CalendarIcon className="h-3 w-3 mr-1" />
              {t('attendanceSchedule.scheduled')}
            </Badge>
            <span className="text-muted-foreground">{t('attendanceSchedule.autoCreated')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default">{t('attendanceSchedule.active')}</Badge>
            <span className="text-muted-foreground">{t('attendanceSchedule.inProgress')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="danger">{t('attendanceSchedule.missed')}</Badge>
            <span className="text-muted-foreground">{t('attendanceSchedule.notStartedOnTime')}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper functions
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatTime(timeStr: string): string {
  const date = new Date(timeStr);
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function isPast(timeStr: string): boolean {
  return new Date(timeStr) < new Date();
}
