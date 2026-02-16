"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, BookOpen, Beaker, Monitor, Clock } from "lucide-react";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { timetableApi, apiClient } from "@/lib/api/client";

interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  gradeLevel?: number;
}

interface SubjectRequirement {
  id: string;
  subject_id: string;
  requires_lab: boolean;
  requires_computers: boolean;
  requires_projector: boolean;
  min_consecutive_periods: number;
  max_consecutive_periods: number;
  preferred_time_slot?: string;
  requires_special_room: boolean;
  special_equipment?: string;
}

export default function SubjectRequirementsPage() {
  const t = useTranslations('school');
  const { schoolId, isLoading: entityLoading } = useCurrentEntity();
  
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch subjects using REST API - must be called before any conditional returns
  const { data: subjectsData, isLoading: loadingSubjects } = useQuery({
    queryKey: ["subjects-all"],
    queryFn: async () => {
      const response = await apiClient<{ data: Subject[] }>("/api/v1/subjects?limit=100");
      return response.data || [];
    },
    enabled: !!schoolId,
  });

  const subjects: Subject[] = subjectsData || [];

  // Fetch requirement for selected subject - must be called before any conditional returns
  const { data: requirementData } = useQuery({
    queryKey: ["subject-requirement", selectedSubject?.id],
    queryFn: async () => {
      const response = await timetableApi.getSubjectRequirement(selectedSubject!.id);
      return response.data as SubjectRequirement;
    },
    enabled: !!selectedSubject?.id,
  });

  // Mutations - must be called before any conditional returns
  const saveRequirement = useMutation({
    mutationFn: async (data: {
      subjectId: string;
      requirement: Partial<SubjectRequirement>;
    }) => {
      if (requirementData?.id) {
        return timetableApi.updateSubjectRequirement(data.subjectId, data.requirement);
      }
      return timetableApi.setSubjectRequirement(data.subjectId, data.requirement as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["subject-requirement", selectedSubject?.id],
      });
      setIsDialogOpen(false);
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
    if (!selectedSubject) return;

    const formData = new FormData(e.currentTarget);
    const data = {
      requires_lab: formData.get("requires_lab") === "on",
      requires_computers: formData.get("requires_computers") === "on",
      requires_projector: formData.get("requires_projector") === "on",
      min_consecutive_periods: parseInt(formData.get("min_consecutive_periods") as string) || 1,
      max_consecutive_periods: parseInt(formData.get("max_consecutive_periods") as string) || 2,
      preferred_time_slot: formData.get("preferred_time_slot") as string || undefined,
      requires_special_room: formData.get("requires_special_room") === "on",
      special_equipment: (formData.get("special_equipment") as string) || undefined,
    };

    saveRequirement.mutate({
      subjectId: selectedSubject.id,
      requirement: data,
    });
  };

  const getRequirementBadges = (req: SubjectRequirement | undefined) => {
    if (!req) return [];
    const badges = [];
    if (req.requires_lab) badges.push({ label: t('schedule.lab'), icon: Beaker, color: "bg-purple-100 text-purple-800" });
    if (req.requires_computers) badges.push({ label: t('schedule.computers'), icon: Monitor, color: "bg-blue-100 text-blue-800" });
    if (req.requires_projector) badges.push({ label: t('schedule.projector'), icon: Monitor, color: "bg-green-100 text-green-800" });
    if (req.preferred_time_slot) badges.push({ label: req.preferred_time_slot, icon: Clock, color: "bg-yellow-100 text-yellow-800" });
    return badges;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('schedule.subjectRequirements')}</h1>
          <p className="text-muted-foreground">
            {t('schedule.configureSubjectRequirements')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject Selection Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{t('schedule.selectSubject')}</CardTitle>
            <CardDescription>{t('schedule.chooseSubject')}</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSubjects ? (
              <div className="text-center py-4">{t('schedule.loadingSubjects')}</div>
            ) : subjects.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                {t('schedule.noSubjectsFound')}
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {subjects.map((subject) => (
                  <button
                    key={subject.id}
                    onClick={() => setSelectedSubject(subject)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedSubject?.id === subject.id
                        ? "border-primary bg-primary/5 dark:bg-primary/10"
                        : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <div>
                        <p className="font-medium">{subject.name}</p>
                        <p className="text-xs text-muted-foreground">{subject.code}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Requirements Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>
                  {selectedSubject
                    ? t('schedule.requirementsFor', { name: selectedSubject.name })
                    : t('schedule.subjectRequirements')}
                </CardTitle>
                <CardDescription>
                  {selectedSubject
                    ? t('schedule.configureRequirements')
                    : t('schedule.selectSubjectHint')}
                </CardDescription>
              </div>
              {selectedSubject && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Edit className="mr-2 h-4 w-4" />
                      {t('schedule.editRequirements')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>{t('schedule.editRequirementsFor', { name: selectedSubject.name })}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-4">
                        <h4 className="font-medium">{t('schedule.roomRequirements')}</h4>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="requires_lab"
                              name="requires_lab"
                              defaultChecked={requirementData?.requires_lab}
                            />
                            <Label htmlFor="requires_lab">{t('schedule.requiresLab')}</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="requires_computers"
                              name="requires_computers"
                              defaultChecked={requirementData?.requires_computers}
                            />
                            <Label htmlFor="requires_computers">{t('schedule.requiresComputers')}</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="requires_projector"
                              name="requires_projector"
                              defaultChecked={requirementData?.requires_projector}
                            />
                            <Label htmlFor="requires_projector">{t('schedule.requiresProjector')}</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="requires_special_room"
                              name="requires_special_room"
                              defaultChecked={requirementData?.requires_special_room}
                            />
                            <Label htmlFor="requires_special_room">{t('schedule.requiresSpecialRoom')}</Label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">{t('schedule.periodSettings')}</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="min_consecutive_periods">{t('schedule.minConsecutivePeriods')}</Label>
                            <Input
                              id="min_consecutive_periods"
                              name="min_consecutive_periods"
                              type="number"
                              min={1}
                              max={4}
                              defaultValue={requirementData?.min_consecutive_periods || 1}
                            />
                          </div>
                          <div>
                            <Label htmlFor="max_consecutive_periods">{t('schedule.maxConsecutivePeriods')}</Label>
                            <Input
                              id="max_consecutive_periods"
                              name="max_consecutive_periods"
                              type="number"
                              min={1}
                              max={4}
                              defaultValue={requirementData?.max_consecutive_periods || 2}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="preferred_time_slot">{t('schedule.preferredTimeSlot')}</Label>
                        <Select
                          name="preferred_time_slot"
                          defaultValue={requirementData?.preferred_time_slot || "any"}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">{t('schedule.anyTime')}</SelectItem>
                            <SelectItem value="morning">{t('schedule.morningPeriods')}</SelectItem>
                            <SelectItem value="afternoon">{t('schedule.afternoonPeriods')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('schedule.preferredTimeSlotHint')}
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="special_equipment">{t('schedule.specialEquipmentOptional')}</Label>
                        <Input
                          id="special_equipment"
                          name="special_equipment"
                          defaultValue={requirementData?.special_equipment || ""}
                          placeholder={t('schedule.specialEquipmentPlaceholder')}
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
                        <Button type="submit" disabled={saveRequirement.isPending}>
                          {saveRequirement.isPending ? t('schedule.saving') : t('schedule.saveRequirements')}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedSubject ? (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('schedule.selectSubjectHint')}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Current Requirements Display */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">{t('schedule.roomRequirements')}</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Beaker className={`h-4 w-4 ${requirementData?.requires_lab ? "text-purple-600" : "text-gray-300"}`} />
                        <span className={requirementData?.requires_lab ? "" : "text-muted-foreground"}>
                          {t('schedule.laboratory')} {requirementData?.requires_lab ? t('schedule.required') : t('schedule.notRequired')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Monitor className={`h-4 w-4 ${requirementData?.requires_computers ? "text-blue-600" : "text-gray-300"}`} />
                        <span className={requirementData?.requires_computers ? "" : "text-muted-foreground"}>
                          {t('schedule.computers')} {requirementData?.requires_computers ? t('schedule.required') : t('schedule.notRequired')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Monitor className={`h-4 w-4 ${requirementData?.requires_projector ? "text-green-600" : "text-gray-300"}`} />
                        <span className={requirementData?.requires_projector ? "" : "text-muted-foreground"}>
                          {t('schedule.projector')} {requirementData?.requires_projector ? t('schedule.required') : t('schedule.notRequired')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">{t('schedule.schedulingPreferences')}</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span>
                          {t('schedule.preferred')}: {requirementData?.preferred_time_slot === "morning" ? t('schedule.morning') :
                                     requirementData?.preferred_time_slot === "afternoon" ? t('schedule.afternoon') : t('schedule.anyTime')}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm">
                          {t('schedule.consecutivePeriods')}: {requirementData?.min_consecutive_periods || 1} - {requirementData?.max_consecutive_periods || 2}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {requirementData?.special_equipment && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">{t('schedule.specialEquipment')}</h4>
                    <p>{requirementData.special_equipment}</p>
                  </div>
                )}

                {/* Quick Badges */}
                <div className="flex flex-wrap gap-2">
                  {getRequirementBadges(requirementData).map((badge, idx) => (
                    <Badge key={idx} className={badge.color}>
                      <badge.icon className="h-3 w-3 mr-1" />
                      {badge.label}
                    </Badge>
                  ))}
                  {getRequirementBadges(requirementData).length === 0 && (
                    <span className="text-muted-foreground text-sm">{t('schedule.noSpecialRequirements')}</span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
