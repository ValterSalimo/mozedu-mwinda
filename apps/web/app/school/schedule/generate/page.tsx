"use client";

import { useState } from "react";
import { Calendar, Clock, Settings, Download, Sparkles, CheckCircle } from "lucide-react";
import { useTranslations } from 'next-intl';
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { Badge } from "@repo/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@repo/ui/dialog";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/tabs";
import { Loader2 } from "lucide-react";
import { useCurrentEntity } from "@/lib/hooks/use-current-entity";
import { useAuthStore } from "@/lib/stores";
import { useQuery } from "@tanstack/react-query";
import { schoolsApi } from "@/lib/api/client";
import { CURRICULUM_CONFIGS } from "@/lib/constants/country-configs";
import type { CurriculumSystem, CurriculumConfig } from "@mozedu/types";
import {
  useTimetablesBySchool,
  useGenerateTimetable,
  useActivateTimetable,
  useValidateTimetable,
} from "@/lib/hooks/use-timetable";

interface TimetableTemplate {
  id: string;
  name: string;
  academic_year: string;
  term: string;
  curriculum_type: string;
  status: string;
  start_date: string;
  end_date: string;
  optimization_score?: number;
  created_at: string;
}

export default function TimetableGenerationPage() {
  const t = useTranslations('school');
  const { schoolId, isLoading: entityLoading } = useCurrentEntity();
  const user = useAuthStore((state) => state.user);
  const userId = user?.id || "";
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [validatingTimetableId, setValidatingTimetableId] = useState<string | null>(null);

  // Fetch timetables using our hook - must be called before any conditional returns
  const { data: timetables, isLoading } = useTimetablesBySchool(schoolId || "");

  // Fetch school data to get configured curriculums
  const { data: school } = useQuery({
    queryKey: ['school', schoolId],
    queryFn: async () => {
      if (!schoolId) return null;
      const response = await schoolsApi.getById(schoolId);
      return response.data;
    },
    enabled: !!schoolId,
  });

  // Get configured curriculums or default to Mozambique
  const schoolCurriculums = (school as any)?.curriculumSystems || ['MOZAMBIQUE_NATIONAL'];
  const availableCurriculums: CurriculumConfig[] = schoolCurriculums
    .map((sys: string) => CURRICULUM_CONFIGS[sys as CurriculumSystem])
    .filter(Boolean);

  // Mutations using our hooks - must be called before any conditional returns
  const generateTimetable = useGenerateTimetable();
  const activateTimetable = useActivateTimetable();
  
  // Validation query (enabled on demand) - must be called before any conditional returns
  const { data: validationResult, refetch: validateTimetable } = useValidateTimetable(
    validatingTimetableId || ""
  );

  if (entityLoading || !schoolId) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleGenerate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const data = {
      school_id: schoolId,
      name: formData.get("name") as string,
      academic_year: formData.get("academic_year") as string,
      term: formData.get("term") as string,
      curriculum_type: formData.get("curriculum_type") as string,
      start_date: formData.get("start_date") as string,
      end_date: formData.get("end_date") as string,
      algorithm: "genetic" as const,
      generated_by: userId,
    };
    
    generateTimetable.mutate(data, {
      onSuccess: () => {
        setIsDialogOpen(false);
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "draft":
        return "secondary";
      case "archived":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end items-center">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Sparkles className="mr-2 h-4 w-4" />
              {t('schedule.generateNew')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('schedule.generateNew')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <Label htmlFor="name">{t('schedule.timetableName')}</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder={t('schedule.timetableNamePlaceholder')}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="academic_year">{t('schedule.academicYear')}</Label>
                  <Input
                    id="academic_year"
                    name="academic_year"
                    placeholder="2024"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="term">{t('schedule.term')}</Label>
                  <Select name="term" defaultValue="1">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">{t('schedule.term1')}</SelectItem>
                      <SelectItem value="2">{t('schedule.term2')}</SelectItem>
                      <SelectItem value="3">{t('schedule.term3')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="curriculum_type">{t('schedule.curriculumType')}</Label>
                <Select name="curriculum_type" defaultValue={schoolCurriculums[0] || "MOZAMBIQUE_NATIONAL"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCurriculums.map((curriculum: CurriculumConfig) => (
                      <SelectItem key={curriculum.system} value={curriculum.system}>
                        {curriculum.name} ({curriculum.scheduleConfig.periodsPerDay} periods × {curriculum.scheduleConfig.periodDurationMinutes}min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">{t('schedule.startDate')}</Label>
                  <Input id="start_date" name="start_date" type="date" required />
                </div>
                <div>
                  <Label htmlFor="end_date">{t('schedule.endDate')}</Label>
                  <Input id="end_date" name="end_date" type="date" required />
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  {t('schedule.aiGenerationSettings')}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {t('schedule.aiDescription')}
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
                  <li>{t('schedule.avoidDoubleBooking')}</li>
                  <li>{t('schedule.preventConflicts')}</li>
                  <li>{t('schedule.balanceWorkload')}</li>
                  <li>{t('schedule.optimizeRooms')}</li>
                  <li>{t('schedule.minimizeGaps')}</li>
                  <li>{t('schedule.respectRequirements')}</li>
                </ul>
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
                  disabled={generateTimetable.isPending || !schoolId}
                >
                  {generateTimetable.isPending ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      {t('schedule.generating')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      {t('schedule.generate')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">{t('schedule.allTimetables')}</TabsTrigger>
          <TabsTrigger value="active">{t('schedule.active')}</TabsTrigger>
          <TabsTrigger value="draft">{t('schedule.drafts')}</TabsTrigger>
          <TabsTrigger value="archived">{t('schedule.archived')}</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">{t('schedule.loadingTimetables')}</div>
          ) : (
            <div className="grid gap-4">
              {timetables?.data && Array.isArray(timetables.data) && (timetables.data as TimetableTemplate[]).map((timetable: TimetableTemplate) => (
                <Card key={timetable.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          {timetable.name}
                        </CardTitle>
                        <CardDescription>
                          {timetable.academic_year} - Term {timetable.term}
                        </CardDescription>
                      </div>
                      <Badge variant={getStatusColor(timetable.status)}>
                        {timetable.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">{t('schedule.curriculum')}</p>
                        <p className="font-medium capitalize">{timetable.curriculum_type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t('schedule.startDate')}</p>
                        <p className="font-medium">
                          {new Date(timetable.start_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t('schedule.endDate')}</p>
                        <p className="font-medium">
                          {new Date(timetable.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      {timetable.optimization_score && (
                        <div>
                          <p className="text-sm text-muted-foreground">{t('schedule.optimization')}</p>
                          <p className="font-medium">{timetable.optimization_score}%</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          window.location.href = `/school/timetable/view/${timetable.id}`;
                        }}
                      >
                        <Calendar className="mr-2 h-3 w-3" />
                        View Schedule
                      </Button>
                      
                      {timetable.status === "draft" && (
                        <Button
                          size="sm"
                          onClick={() => activateTimetable.mutate(timetable.id)}
                          disabled={activateTimetable.isPending}
                        >
                          <CheckCircle className="mr-2 h-3 w-3" />
                          {t('schedule.activate')}
                        </Button>
                      )}
                      
                      <Button size="sm" variant="outline">
                        <Download className="mr-2 h-3 w-3" />
                        {t('schedule.export')}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setValidatingTimetableId(timetable.id);
                          validateTimetable();
                        }}
                      >
                        <Settings className="mr-2 h-3 w-3" />
                        {t('schedule.validate')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
