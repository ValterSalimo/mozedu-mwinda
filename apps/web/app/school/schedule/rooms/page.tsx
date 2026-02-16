"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, MapPin } from "lucide-react";
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
  useRoomsBySchool,
  useCreateRoom,
  useUpdateRoom,
  useDeleteRoom,
} from "@/lib/hooks/use-timetable";

interface Room {
  id: string;
  name: string;
  code: string;
  room_type: string;
  capacity: number;
  floor?: number;
  building?: string;
  has_projector: boolean;
  has_computers: boolean;
  has_lab_equipment: boolean;
  is_available: boolean;
}

export default function RoomsManagementPage() {
  const t = useTranslations('school');
  const { schoolId, isLoading: entityLoading } = useCurrentEntity();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  // Fetch rooms using our hook - must be called before any conditional returns
  const { data: rooms, isLoading } = useRoomsBySchool(schoolId || "");

  // Mutations using our hooks - must be called before any conditional returns
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();

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
      code: formData.get("code") as string,
      name: formData.get("name") as string,
      capacity: parseInt(formData.get("capacity") as string),
      room_type: formData.get("room_type") as string,
      floor: formData.get("floor") ? parseInt(formData.get("floor") as string) : undefined,
      building: (formData.get("building") as string) || undefined,
      has_projector: formData.get("has_projector") === "on",
      has_computers: formData.get("has_computers") === "on",
      has_lab_equipment: formData.get("has_lab_equipment") === "on",
      is_available: formData.get("is_available") === "on",
    };
    
    // Use appropriate mutation based on whether we're editing or creating
    if (editingRoom) {
      updateRoom.mutate({ roomId: editingRoom.id, data }, {
        onSuccess: () => {
          setIsDialogOpen(false);
          setEditingRoom(null);
        },
      });
    } else {
      createRoom.mutate({ schoolId, data }, {
        onSuccess: () => {
          setIsDialogOpen(false);
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end items-center">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingRoom(null)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('schedule.addRoom')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingRoom ? t('schedule.editRoom') : t('schedule.addNewRoom')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">{t('schedule.roomName')}</Label>
                  <Input id="name" name="name" defaultValue={editingRoom?.name} required />
                </div>
                <div>
                  <Label htmlFor="code">{t('schedule.roomCode')}</Label>
                  <Input id="code" name="code" defaultValue={editingRoom?.code} required />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="room_type">{t('schedule.roomType')}</Label>
                  <Select name="room_type" defaultValue={editingRoom?.room_type || "classroom"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classroom">{t('schedule.classroom')}</SelectItem>
                      <SelectItem value="lab">{t('schedule.lab')}</SelectItem>
                      <SelectItem value="library">{t('schedule.library')}</SelectItem>
                      <SelectItem value="gym">{t('schedule.gymnasium')}</SelectItem>
                      <SelectItem value="auditorium">{t('schedule.auditorium')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="capacity">{t('schedule.capacity')}</Label>
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    defaultValue={editingRoom?.capacity || 40}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="floor">{t('schedule.floor')}</Label>
                  <Input id="floor" name="floor" type="number" defaultValue={editingRoom?.floor} />
                </div>
                <div>
                  <Label htmlFor="building">{t('schedule.building')}</Label>
                  <Input id="building" name="building" defaultValue={editingRoom?.building} />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>{t('schedule.facilities')}</Label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="has_projector"
                      name="has_projector"
                      defaultChecked={editingRoom?.has_projector}
                    />
                    <label htmlFor="has_projector">{t('schedule.projector')}</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="has_computers"
                      name="has_computers"
                      defaultChecked={editingRoom?.has_computers}
                    />
                    <label htmlFor="has_computers">{t('schedule.computers')}</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="has_lab_equipment"
                      name="has_lab_equipment"
                      defaultChecked={editingRoom?.has_lab_equipment}
                    />
                    <label htmlFor="has_lab_equipment">{t('schedule.labEquipment')}</label>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_available"
                  name="is_available"
                  defaultChecked={editingRoom?.is_available ?? true}
                />
                <label htmlFor="is_available">{t('schedule.roomAvailable')}</label>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createRoom.isPending || updateRoom.isPending || !schoolId}
                >
                  {createRoom.isPending || updateRoom.isPending ? t('schedule.saving') : t('schedule.saveRoom')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12">{t('schedule.loadingRooms')}</div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms?.data && Array.isArray(rooms.data) && (rooms.data as Room[]).map((room: Room) => (
            <Card key={room.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {room.name}
                    </CardTitle>
                    <CardDescription>{room.code}</CardDescription>
                  </div>
                  <Badge variant={room.is_available ? "default" : "secondary"}>
                    {room.is_available ? t('schedule.available') : t('schedule.unavailable')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('schedule.type')}:</span>
                  <span className="font-medium capitalize">{room.room_type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('schedule.capacity')}:</span>
                  <span className="font-medium">{room.capacity} {t('schedule.students')}</span>
                </div>
                {room.floor && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('schedule.floor')}:</span>
                    <span className="font-medium">{room.floor}</span>
                  </div>
                )}
                {room.building && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('schedule.building')}:</span>
                    <span className="font-medium">{room.building}</span>
                  </div>
                )}
                
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2">{t('schedule.facilities')}:</p>
                  <div className="flex flex-wrap gap-1">
                    {room.has_projector && <Badge variant="outline">{t('schedule.projector')}</Badge>}
                    {room.has_computers && <Badge variant="outline">{t('schedule.computers')}</Badge>}
                    {room.has_lab_equipment && <Badge variant="outline">{t('schedule.labEquipment')}</Badge>}
                    {!room.has_projector && !room.has_computers && !room.has_lab_equipment && (
                      <span className="text-xs text-muted-foreground">{t('schedule.noSpecialFacilities')}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setEditingRoom(room);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    {t('schedule.edit')}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={deleteRoom.isPending}
                    onClick={() => {
                      if (confirm(t('schedule.confirmDeleteRoom'))) {
                        deleteRoom.mutate(room.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
