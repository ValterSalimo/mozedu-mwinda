"use client";

import { Settings, Calendar, Users, Building2, Target, BookOpen, Plus, ArrowRight } from "lucide-react";
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { Button } from "@repo/ui/button";
import { Badge } from "@repo/ui/badge";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useCurrentEntity } from "@/lib/hooks/use-current-entity";
import { useTimetablesBySchool, useRoomsBySchool } from "@/lib/hooks/use-timetable";
import { useTeachers } from "@/lib/hooks/use-teachers";

interface TimetableTemplate {
  id: string;
  name: string;
  academic_year: string;
  term: string;
  curriculum_type: string;
  status: string;
  optimization_score?: number;
}

interface Room {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
}

export default function SchedulePage() {
  const t = useTranslations('school');
  const { schoolId, isLoading: entityLoading, isSchoolAdmin } = useCurrentEntity();

  // Fetch summary data - only when we have a schoolId
  const { data: timetables } = useTimetablesBySchool(schoolId || "");
  const { data: rooms } = useRoomsBySchool(schoolId || "");
  const { data: teachers } = useTeachers({ schoolId: schoolId || "", limit: 100 });

  const timetableList: TimetableTemplate[] = (Array.isArray(timetables)
    ? (timetables as unknown[])
    : (Array.isArray((timetables as any)?.data) ? (timetables as any).data : [])) as TimetableTemplate[];

  const roomList: Room[] = (Array.isArray(rooms)
    ? (rooms as unknown[])
    : (Array.isArray((rooms as any)?.data) ? (rooms as any).data : [])) as Room[];

  const teacherList: Teacher[] = Array.isArray(teachers) ? teachers as Teacher[] : [];

  const activeTimetable = timetableList.find((t) => t.status === "active");

  if (entityLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!schoolId) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-muted-foreground">{t('schedule.noSchoolSelected')}</p>
          <p className="text-sm text-muted-foreground mt-2">{t('schedule.noSchoolSelectedSub')}</p>
        </div>
      </div>
    );
  }
  const draftTimetables = timetableList.filter((t) => t.status === "draft").length;

  const menuItems = [
    {
      title: t('schedule.configuration'),
      description: t('schedule.configurationDesc'),
      icon: Settings,
      href: "/school/schedule/configuration",
      color: "bg-blue-500",
      badge: null,
    },
    {
      title: t('schedule.generateSchedule'),
      description: t('schedule.generateScheduleDesc'),
      icon: Calendar,
      href: "/school/schedule/generate",
      color: "bg-green-500",
      badge: activeTimetable ? t('schedule.active') : draftTimetables > 0 ? t('schedule.draftsCount', { count: draftTimetables }) : null,
    },
    {
      title: t('schedule.teacherAvailability'),
      description: t('schedule.teacherAvailabilityDesc'),
      icon: Users,
      href: "/school/schedule/teachers",
      color: "bg-purple-500",
      badge: teacherList.length > 0 ? t('schedule.teachersCount', { count: teacherList.length }) : null,
    },
    {
      title: t('schedule.roomManagement'),
      description: t('schedule.roomManagementDesc'),
      icon: Building2,
      href: "/school/schedule/rooms",
      color: "bg-orange-500",
      badge: roomList.length > 0 ? t('schedule.roomsCount', { count: roomList.length }) : null,
    },
    {
      title: t('schedule.constraintsMenu'),
      description: t('schedule.constraintsMenuDesc'),
      icon: Target,
      href: "/school/schedule/constraints",
      color: "bg-red-500",
      badge: null,
    },
    {
      title: t('schedule.subjectRequirementsMenu'),
      description: t('schedule.subjectRequirementsMenuDesc'),
      icon: BookOpen,
      href: "/school/schedule/subjects",
      color: "bg-teal-500",
      badge: null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('schedule.scheduleManagement')}</h1>
          <p className="text-muted-foreground">
            {t('schedule.scheduleManagementSub')}
          </p>
        </div>
        <Link href="/school/schedule/generate">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('schedule.generateNewSchedule')}
          </Button>
        </Link>
      </div>

      {/* Status Overview */}
      {activeTimetable && (
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('schedule.activeSchedule')}: {activeTimetable.name}
              </CardTitle>
              <Link href="/school/schedule/view">
                <Button variant="outline" size="sm">
                  {t('schedule.viewSchedule')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-green-600 dark:text-green-400">{t('schedule.academicYear')}</p>
                <p className="font-medium">{activeTimetable.academic_year}</p>
              </div>
              <div>
                <p className="text-green-600 dark:text-green-400">{t('schedule.period')}</p>
                <p className="font-medium">{t('schedule.trimester')} {activeTimetable.term || '—'}</p>
              </div>
              <div>
                <p className="text-green-600 dark:text-green-400">{t('schedule.curriculum')}</p>
                <p className="font-medium capitalize">{activeTimetable.curriculum_type}</p>
              </div>
              {activeTimetable.optimization_score && (
                <div>
                  <p className="text-green-600 dark:text-green-400">{t('schedule.score')}</p>
                  <p className="font-medium">{activeTimetable.optimization_score}%</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Menu Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className={`p-2 rounded-lg ${item.color}`}>
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                  {item.badge && (
                    <Badge variant="secondary">{item.badge}</Badge>
                  )}
                </div>
                <CardTitle className="mt-4">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('schedule.totalSchedules')}</CardDescription>
            <CardTitle className="text-3xl">{timetableList.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('schedule.availableRooms')}</CardDescription>
            <CardTitle className="text-3xl">{roomList.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('schedule.teachers')}</CardDescription>
            <CardTitle className="text-3xl">{teacherList.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('schedule.drafts')}</CardDescription>
            <CardTitle className="text-3xl">{draftTimetables}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
