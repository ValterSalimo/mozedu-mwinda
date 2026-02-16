"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, User, Clock, Calendar } from "lucide-react";
import { useTranslations } from 'next-intl';
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { Badge } from "@repo/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@repo/ui/dialog";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/select";
import { Checkbox } from "@repo/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useCurrentEntity } from "@/lib/hooks/use-current-entity";
import { useTeachers } from "@/lib/hooks";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { timetableApi } from "@/lib/api/client";

interface TeacherAvailability {
  id: string;
  teacher_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  reason?: string;
}

interface Teacher {
  id: string;
  user: {
    firstName: string;
    lastName: string;
  };
  teacherNumber: string;
  specialization?: string;
}

const DAYS_OF_WEEK = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

export default function TeacherConstraintsPage() {
  const t = useTranslations('school');
  const { schoolId, isLoading: entityLoading } = useCurrentEntity();
  
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState<TeacherAvailability | null>(null);
  const queryClient = useQueryClient();

  // Fetch teachers - must be called before any conditional returns
  const { data: teachers, isLoading: loadingTeachers } = useTeachers({
    schoolId: schoolId || "",
    limit: 100,
  });

  // Fetch selected teacher's availability - must be called before any conditional returns
  const { data: availabilityData } = useQuery({
    queryKey: ['teacher-availability', selectedTeacher?.id],
    queryFn: () => timetableApi.getTeacherAvailability(selectedTeacher!.id),
    enabled: !!selectedTeacher?.id,
  });

  const availabilities = (availabilityData?.data as TeacherAvailability[]) || [];

  // Mutations - must be called before any conditional returns
  const createAvailability = useMutation({
    mutationFn: (data: {
      teacherId: string;
      data: {
        day_of_week: string;
        start_time: string;
        end_time: string;
        is_available: boolean;
        reason?: string;
      };
    }) => timetableApi.setTeacherAvailability(data.teacherId, data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['teacher-availability', selectedTeacher?.id],
      });
      setIsDialogOpen(false);
      setEditingAvailability(null);
    },
  });

  const updateAvailability = useMutation({
    mutationFn: (data: {
      teacherId: string;
      availabilityId: string;
      data: Record<string, unknown>;
    }) => timetableApi.updateTeacherAvailability(data.teacherId, data.availabilityId, data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['teacher-availability', selectedTeacher?.id],
      });
      setIsDialogOpen(false);
      setEditingAvailability(null);
    },
  });

  const deleteAvailability = useMutation({
    mutationFn: (data: { teacherId: string; availabilityId: string }) =>
      timetableApi.deleteTeacherAvailability(data.teacherId, data.availabilityId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['teacher-availability', selectedTeacher?.id],
      });
    },
  });

  if (entityLoading || !schoolId) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTeacher) return;

    const formData = new FormData(e.currentTarget);
    const data = {
      day_of_week: formData.get("day_of_week") as string,
      start_time: formData.get("start_time") as string,
      end_time: formData.get("end_time") as string,
      is_available: formData.get("is_available") === "on",
      reason: (formData.get("reason") as string) || undefined,
    };

    if (editingAvailability) {
      updateAvailability.mutate({
        teacherId: selectedTeacher.id,
        availabilityId: editingAvailability.id,
        data,
      });
    } else {
      createAvailability.mutate({
        teacherId: selectedTeacher.id,
        data,
      });
    }
  };

  const getDayColor = (day: string) => {
    const colors: Record<string, string> = {
      monday: "bg-blue-100 text-blue-800",
      tuesday: "bg-green-100 text-green-800",
      wednesday: "bg-yellow-100 text-yellow-800",
      thursday: "bg-purple-100 text-purple-800",
      friday: "bg-pink-100 text-pink-800",
      saturday: "bg-orange-100 text-orange-800",
      sunday: "bg-red-100 text-red-800",
    };
    return colors[day.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teacher Selection Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{t('schedule.selectTeacher')}</CardTitle>
            <CardDescription>{t('schedule.chooseTeacher')}</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTeachers ? (
              <div className="text-center py-4">{t('schedule.loadingTeachers')}</div>
            ) : (
              <div className="space-y-2">
                {teachers && Array.isArray(teachers) && (teachers as Teacher[]).map((teacher) => (
                  <button
                    key={teacher.id}
                    onClick={() => setSelectedTeacher(teacher)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedTeacher?.id === teacher.id
                        ? "border-primary bg-primary/5 dark:bg-primary/10"
                        : "border-gray-200 dark:border-gray-700 hover:border-primary/50 dark:hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <div>
                        <p className="font-medium">
                          {teacher.user.firstName} {teacher.user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {teacher.teacherNumber}
                          {teacher.specialization && ` • ${teacher.specialization}`}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Availability Management Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>
                  {selectedTeacher
                    ? t('schedule.teacherAvailabilityTitle', { name: `${selectedTeacher.user.firstName} ${selectedTeacher.user.lastName}` })
                    : t('schedule.teacherAvailabilityDefault')}
                </CardTitle>
                <CardDescription>
                  {t('schedule.setAvailability')}
                </CardDescription>
              </div>
              {selectedTeacher && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => setEditingAvailability(null)}
                      disabled={!selectedTeacher}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t('schedule.addAvailability')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingAvailability ? t('schedule.editAvailability') : t('schedule.addAvailability')}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="day_of_week">{t('schedule.dayOfWeek')}</Label>
                        <Select
                          name="day_of_week"
                          defaultValue={editingAvailability?.day_of_week || "monday"}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DAYS_OF_WEEK.map((day) => (
                              <SelectItem key={day.value} value={day.value}>
                                {day.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="start_time">{t('schedule.startTime')}</Label>
                          <Input
                            id="start_time"
                            name="start_time"
                            type="time"
                            defaultValue={editingAvailability?.start_time || "08:00"}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="end_time">{t('schedule.endTime')}</Label>
                          <Input
                            id="end_time"
                            name="end_time"
                            type="time"
                            defaultValue={editingAvailability?.end_time || "16:00"}
                            required
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is_available"
                          name="is_available"
                          defaultChecked={editingAvailability?.is_available ?? true}
                        />
                        <label htmlFor="is_available">{t('schedule.availableDuringTime')}</label>
                      </div>

                      <div>
                        <Label htmlFor="reason">{t('schedule.reasonOptional')}</Label>
                        <Input
                          id="reason"
                          name="reason"
                          placeholder={t('schedule.reasonPlaceholder')}
                          defaultValue={editingAvailability?.reason}
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={createAvailability.isPending || updateAvailability.isPending}
                        >
                          {createAvailability.isPending || updateAvailability.isPending
                            ? t('schedule.saving')
                            : t('schedule.save')}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedTeacher ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('schedule.selectTeacherHint')}</p>
              </div>
            ) : availabilities.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('schedule.noAvailability')}</p>
                <p className="text-sm mt-2">
                  {t('schedule.noAvailabilityHint')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {availabilities.map((availability: TeacherAvailability) => (
                  <div
                    key={availability.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <Badge className={getDayColor(availability.day_of_week)}>
                        {availability.day_of_week.charAt(0).toUpperCase() +
                          availability.day_of_week.slice(1)}
                      </Badge>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {availability.start_time} - {availability.end_time}
                        </span>
                      </div>
                      <Badge variant={availability.is_available ? "default" : "secondary"}>
                        {availability.is_available ? t('schedule.available') : t('schedule.unavailable')}
                      </Badge>
                      {availability.reason && (
                        <span className="text-sm text-muted-foreground">
                          ({availability.reason})
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingAvailability(availability);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={deleteAvailability.isPending}
                        onClick={() => {
                          if (
                            confirm(
                              t('schedule.confirmDeleteAvailability')
                            )
                          ) {
                            deleteAvailability.mutate({
                              teacherId: selectedTeacher.id,
                              availabilityId: availability.id,
                            });
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            How Teacher Constraints Work
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                Set availability for each day to indicate when teachers can teach
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                Mark time slots as unavailable for meetings, breaks, or other commitments
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                The AI timetable generator will respect these constraints when creating schedules
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                Teachers without availability constraints can be scheduled anytime during school
                hours
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
