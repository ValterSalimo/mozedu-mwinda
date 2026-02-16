"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { useTranslations } from 'next-intl';
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/select";
import { Loader2 } from "lucide-react";
import { useCurrentEntity } from "@/lib/hooks/use-current-entity";
import {
  useSchoolConfiguration,
  useCreateSchoolConfiguration,
  useUpdateSchoolConfiguration,
} from "@/lib/hooks";

export default function ConfigurationPage() {
  const t = useTranslations('school');
  const { schoolId, isLoading: entityLoading } = useCurrentEntity();
  
  const [academicYear, setAcademicYear] = useState("2024");

  // Fetch configuration using our hook - must be called before any conditional returns
  const { data: config, isLoading } = useSchoolConfiguration(schoolId || "", academicYear);

  // Create/Update mutations using our hooks - must be called before any conditional returns
  const createConfig = useCreateSchoolConfiguration();
  const updateConfig = useUpdateSchoolConfiguration();

  if (entityLoading || !schoolId) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      academic_year: formData.get("academic_year") as string,
      curriculum_type: formData.get("curriculum_type") as 'national' | 'cambridge',
      school_start_time: formData.get("school_start_time") as string,
      school_end_time: formData.get("school_end_time") as string,
      period_duration_minutes: parseInt(formData.get("period_duration_minutes") as string),
      break_duration_minutes: parseInt(formData.get("break_duration_minutes") as string),
      lunch_duration_minutes: parseInt(formData.get("lunch_duration_minutes") as string),
      morning_break_after_period: parseInt(formData.get("morning_break_after_period") as string),
      lunch_break_after_period: parseInt(formData.get("lunch_break_after_period") as string),
      national_periods_per_day: parseInt(formData.get("national_periods_per_day") as string),
      cambridge_periods_per_day: parseInt(formData.get("cambridge_periods_per_day") as string),
      cambridge_period_duration_minutes: parseInt(
        formData.get("cambridge_period_duration_minutes") as string
      ),
    };
    
    // Use appropriate mutation based on whether config exists
    if (config?.data && (config.data as any).id) {
      updateConfig.mutate({ 
        schoolId, 
        data: { ...(config.data as any), ...data } 
      });
    } else {
      createConfig.mutate({ schoolId, data });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('schedule.timetableSettings')}</CardTitle>
          <CardDescription>
            {t('schedule.timetableSettingsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="academic_year">{t('schedule.academicYear')}</Label>
                <Input
                  id="academic_year"
                  name="academic_year"
                  defaultValue={(config?.data as any)?.academic_year || "2024"}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAcademicYear(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="curriculum_type">{t('schedule.curriculumType')}</Label>
                <Select
                  name="curriculum_type"
                  defaultValue={(config?.data as any)?.curriculum_type || "national"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="national">{t('schedule.national')}</SelectItem>
                    <SelectItem value="cambridge">{t('schedule.cambridge')}</SelectItem>
                    <SelectItem value="combined">{t('schedule.combined')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('schedule.schoolHours')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="school_start_time">{t('schedule.schoolStartTime')}</Label>
                  <Input
                    id="school_start_time"
                    name="school_start_time"
                    type="time"
                    defaultValue={(config?.data as any)?.school_start_time || "07:30"}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="school_end_time">{t('schedule.schoolEndTime')}</Label>
                  <Input
                    id="school_end_time"
                    name="school_end_time"
                    type="time"
                    defaultValue={(config?.data as any)?.school_end_time || "16:00"}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('schedule.nationalCurriculumSettings')}</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="national_periods_per_day">{t('schedule.periodsPerDay')}</Label>
                  <Input
                    id="national_periods_per_day"
                    name="national_periods_per_day"
                    type="number"
                    defaultValue={(config?.data as any)?.national_periods_per_day || 8}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="period_duration_minutes">{t('schedule.periodDuration')}</Label>
                  <Input
                    id="period_duration_minutes"
                    name="period_duration_minutes"
                    type="number"
                    defaultValue={(config?.data as any)?.period_duration_minutes || 45}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('schedule.cambridgeCurriculumSettings')}</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cambridge_periods_per_day">{t('schedule.periodsPerDay')}</Label>
                  <Input
                    id="cambridge_periods_per_day"
                    name="cambridge_periods_per_day"
                    type="number"
                    defaultValue={(config?.data as any)?.cambridge_periods_per_day || 6}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cambridge_period_duration_minutes">
                    {t('schedule.periodDuration')}
                  </Label>
                  <Input
                    id="cambridge_period_duration_minutes"
                    name="cambridge_period_duration_minutes"
                    type="number"
                    defaultValue={(config?.data as any)?.cambridge_period_duration_minutes || 60}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('schedule.breakTimes')}</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="break_duration_minutes">{t('schedule.breakDuration')}</Label>
                  <Input
                    id="break_duration_minutes"
                    name="break_duration_minutes"
                    type="number"
                    defaultValue={(config?.data as any)?.break_duration_minutes || 15}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="morning_break_after_period">{t('schedule.morningBreakAfterPeriod')}</Label>
                  <Input
                    id="morning_break_after_period"
                    name="morning_break_after_period"
                    type="number"
                    defaultValue={(config?.data as any)?.morning_break_after_period || 2}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="lunch_duration_minutes">{t('schedule.lunchDuration')}</Label>
                  <Input
                    id="lunch_duration_minutes"
                    name="lunch_duration_minutes"
                    type="number"
                    defaultValue={(config?.data as any)?.lunch_duration_minutes || 60}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lunch_break_after_period">{t('schedule.lunchBreakAfterPeriod')}</Label>
                  <Input
                    id="lunch_break_after_period"
                    name="lunch_break_after_period"
                    type="number"
                    defaultValue={(config?.data as any)?.lunch_break_after_period || 4}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={createConfig.isPending || updateConfig.isPending || !schoolId}
              >
                <Save className="mr-2 h-4 w-4" />
                {createConfig.isPending || updateConfig.isPending ? t('schedule.saving') : t('schedule.saveConfiguration')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
