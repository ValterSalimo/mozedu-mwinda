"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Target, AlertTriangle, Info } from "lucide-react";
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
import {
  useTimetableConstraints,
  useCreateTimetableConstraint,
  useUpdateTimetableConstraint,
  useDeleteTimetableConstraint,
} from "@/lib/hooks/use-timetable";

interface TimetableConstraint {
  id: string;
  school_id: string;
  constraint_type: string;
  constraint_data: Record<string, unknown>;
  priority: number;
  is_hard_constraint: boolean;
  description: string;
  created_at: string;
}

const CONSTRAINT_TYPES = [
  { value: "max_periods_per_day", labelKey: "constraintTypes.maxPeriodsPerDay", descKey: "constraintTypes.maxPeriodsPerDayDesc" },
  { value: "max_consecutive_periods", labelKey: "constraintTypes.maxConsecutivePeriods", descKey: "constraintTypes.maxConsecutivePeriodsDesc" },
  { value: "min_break_between_subjects", labelKey: "constraintTypes.minBreakBetweenSubjects", descKey: "constraintTypes.minBreakBetweenSubjectsDesc" },
  { value: "room_capacity", labelKey: "constraintTypes.roomCapacity", descKey: "constraintTypes.roomCapacityDesc" },
  { value: "teacher_availability", labelKey: "constraintTypes.teacherAvailability", descKey: "constraintTypes.teacherAvailabilityDesc" },
  { value: "no_back_to_back_classes", labelKey: "constraintTypes.noBackToBack", descKey: "constraintTypes.noBackToBackDesc" },
  { value: "preferred_time_slot", labelKey: "constraintTypes.preferredTimeSlot", descKey: "constraintTypes.preferredTimeSlotDesc" },
  { value: "lunch_break", labelKey: "constraintTypes.lunchBreak", descKey: "constraintTypes.lunchBreakDesc" },
  { value: "max_daily_workload", labelKey: "constraintTypes.maxDailyWorkload", descKey: "constraintTypes.maxDailyWorkloadDesc" },
  { value: "custom", labelKey: "constraintTypes.customConstraint", descKey: "constraintTypes.customConstraintDesc" },
];

export default function ConstraintsPage() {
  const t = useTranslations('school');
  const tCommon = useTranslations('common');
  const { schoolId, isLoading: entityLoading } = useCurrentEntity();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConstraint, setEditingConstraint] = useState<TimetableConstraint | null>(null);

  // Fetch constraints - must be called before any conditional returns
  const { data: constraintsData, isLoading } = useTimetableConstraints(schoolId || "");
  const constraints = (constraintsData?.data as TimetableConstraint[]) || [];

  // Mutations - must be called before any conditional returns
  const createConstraint = useCreateTimetableConstraint();
  const updateConstraint = useUpdateTimetableConstraint();
  const deleteConstraint = useDeleteTimetableConstraint();

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

    const constraintType = formData.get("constraint_type") as string;
    const constraintData: Record<string, unknown> = {};

    // Build constraint data based on type
    switch (constraintType) {
      case "max_periods_per_day":
        constraintData.max_periods = parseInt(formData.get("max_value") as string) || 6;
        break;
      case "max_consecutive_periods":
        constraintData.max_consecutive = parseInt(formData.get("max_value") as string) || 3;
        break;
      case "min_break_between_subjects":
        constraintData.min_periods = parseInt(formData.get("max_value") as string) || 2;
        break;
      case "max_daily_workload":
        constraintData.max_hours = parseInt(formData.get("max_value") as string) || 8;
        break;
      default:
        constraintData.value = formData.get("max_value");
    }

    const data = {
      constraint_type: constraintType,
      constraint_data: constraintData,
      priority: parseInt(formData.get("priority") as string) || 5,
      is_hard_constraint: formData.get("is_hard_constraint") === "on",
      description: formData.get("description") as string,
    };

    if (editingConstraint) {
      updateConstraint.mutate(
        { constraintId: editingConstraint.id, data },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
            setEditingConstraint(null);
          },
        }
      );
    } else {
      createConstraint.mutate(
        { schoolId, data },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
          },
        }
      );
    }
  };

  const handleDelete = (constraintId: string) => {
    if (confirm(t('schedule.confirmDeleteConstraint'))) {
      deleteConstraint.mutate(constraintId);
    }
  };

  const openEditDialog = (constraint: TimetableConstraint) => {
    setEditingConstraint(constraint);
    setIsDialogOpen(true);
  };

  const getConstraintTypeLabel = (type: string) => {
    const found = CONSTRAINT_TYPES.find((ct) => ct.value === type);
    return found ? t(found.labelKey) : type;
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    if (priority >= 5) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('schedule.schedulingConstraints')}</h1>
          <p className="text-muted-foreground">
            {t('schedule.schedulingConstraintsDesc')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingConstraint(null)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('schedule.addConstraint')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingConstraint ? t('schedule.editConstraint') : t('schedule.addNewConstraint')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="constraint_type">{t('schedule.constraintType')}</Label>
                <Select
                  name="constraint_type"
                  defaultValue={editingConstraint?.constraint_type || "max_periods_per_day"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONSTRAINT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <span>{t(type.labelKey)}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({t(type.descKey)})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="max_value">{t('schedule.value')}</Label>
                <Input
                  id="max_value"
                  name="max_value"
                  type="number"
                  defaultValue={
                    String(editingConstraint?.constraint_data?.max_periods ||
                    editingConstraint?.constraint_data?.max_consecutive ||
                    editingConstraint?.constraint_data?.min_periods ||
                    editingConstraint?.constraint_data?.max_hours ||
                    editingConstraint?.constraint_data?.value ||
                    "")
                  }
                  placeholder={t('schedule.enterValue')}
                  required
                />
              </div>

              <div>
                <Label htmlFor="priority">{t('schedule.priority')}</Label>
                <Input
                  id="priority"
                  name="priority"
                  type="number"
                  min={1}
                  max={10}
                  defaultValue={editingConstraint?.priority || 5}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t('schedule.priorityHint')}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_hard_constraint"
                  name="is_hard_constraint"
                  defaultChecked={editingConstraint?.is_hard_constraint ?? true}
                />
                <Label htmlFor="is_hard_constraint">
                  {t('schedule.hardConstraintLabel')}
                </Label>
              </div>

              <div>
                <Label htmlFor="description">{t('schedule.description')}</Label>
                <Input
                  id="description"
                  name="description"
                  defaultValue={editingConstraint?.description || ""}
                  placeholder={t('schedule.constraintDescPlaceholder')}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  {tCommon('cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={createConstraint.isPending || updateConstraint.isPending}
                >
                  {createConstraint.isPending || updateConstraint.isPending
                    ? t('schedule.saving')
                    : t('schedule.saveConstraint')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Box */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium">{t('schedule.howConstraintsWork')}:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li><strong>{t('schedule.hardConstraints')}</strong> {t('schedule.hardConstraintsDesc')}</li>
                <li><strong>{t('schedule.softConstraints')}</strong> {t('schedule.softConstraintsDesc')}</li>
                <li><strong>{t('schedule.priorityLabel')}</strong> {t('schedule.priorityDesc')}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Constraints List */}
      {isLoading ? (
        <div className="text-center py-12">{t('schedule.loadingConstraints')}</div>
      ) : constraints.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('schedule.noConstraints')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('schedule.noConstraintsDesc')}
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('schedule.addFirstConstraint')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {constraints.map((constraint) => (
            <Card key={constraint.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {constraint.is_hard_constraint ? (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Target className="h-4 w-4 text-blue-500" />
                    )}
                    <CardTitle className="text-base">
                      {getConstraintTypeLabel(constraint.constraint_type)}
                    </CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(constraint)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(constraint.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {constraint.description && (
                    <p className="text-sm text-muted-foreground">
                      {constraint.description}
                    </p>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant={constraint.is_hard_constraint ? "danger" : "secondary"}>
                      {constraint.is_hard_constraint ? t('schedule.hard') : t('schedule.soft')}
                    </Badge>
                    <Badge className={getPriorityColor(constraint.priority)}>
                      {t('constraintTypes.priorityPrefix')} {constraint.priority}
                    </Badge>
                    <Badge variant="outline">
                      {JSON.stringify(constraint.constraint_data)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
