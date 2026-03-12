import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import {
   getAssignmentsByInstitution,
   getSubjectById,
   institutions,
} from "@/lib/edu-repository";
import { toast } from "sonner";

const weekDays = [
   { value: 1, label: "Lunes" },
   { value: 2, label: "Martes" },
   { value: 3, label: "Miercoles" },
   { value: 4, label: "Jueves" },
   { value: 5, label: "Viernes" },
   { value: 6, label: "Sabado" },
   { value: 0, label: "Domingo" },
];

type SlotInput = {
   id: string;
   dayOfWeek: number;
   time: string;
};

function createSlot(dayOfWeek = 1, time = "08:00"): SlotInput {
   return {
      id: `slot-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      dayOfWeek,
      time,
   };
}

function todayDate() {
   const now = new Date();
   const yyyy = now.getFullYear();
   const mm = String(now.getMonth() + 1).padStart(2, "0");
   const dd = String(now.getDate()).padStart(2, "0");
   return `${yyyy}-${mm}-${dd}`;
}

function addDays(dateStr: string, days: number) {
   const date = new Date(`${dateStr}T12:00:00`);
   date.setDate(date.getDate() + days);
   const yyyy = date.getFullYear();
   const mm = String(date.getMonth() + 1).padStart(2, "0");
   const dd = String(date.getDate()).padStart(2, "0");
   return `${yyyy}-${mm}-${dd}`;
}

export function ClassScheduleModal({
   open,
   onOpenChange,
   activeInstitution,
   initialInstitutionId,
   initialAssignmentId,
   onSchedule,
}: {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   activeInstitution: string;
   initialInstitutionId?: string;
   initialAssignmentId?: string;
   onSchedule: (payload: {
      institutionId: string;
      assignmentId: string;
      startDate: string;
      endDate: string;
      slots: Array<{
         dayOfWeek: number;
         time: string;
      }>;
   }) => number;
}) {
   const isLockedToInitialSelection = Boolean(initialAssignmentId);
   const isInstitutionLocked = true;
   const institutionId = initialInstitutionId ?? activeInstitution;
   const [assignmentId, setAssignmentId] = useState("");
   const [startDate, setStartDate] = useState(todayDate());
   const [endDate, setEndDate] = useState(addDays(todayDate(), 60));
   const [slots, setSlots] = useState<SlotInput[]>([
      createSlot(1, "08:00"),
      createSlot(3, "08:00"),
   ]);

   const availableAssignments = useMemo(
      () => getAssignmentsByInstitution(institutionId),
      [institutionId],
   );

   const reset = () => {
      const firstAssignmentId =
         getAssignmentsByInstitution(institutionId)[0]?.id ?? "";
      setAssignmentId(initialAssignmentId ?? firstAssignmentId);
      setStartDate(todayDate());
      setEndDate(addDays(todayDate(), 60));
      setSlots([createSlot(1, "08:00"), createSlot(3, "08:00")]);
   };

   const updateSlot = (slotId: string, updates: Partial<SlotInput>) => {
      setSlots((prev) =>
         prev.map((slot) => (slot.id === slotId ? { ...slot, ...updates } : slot)),
      );
   };

   const removeSlot = (slotId: string) => {
      setSlots((prev) => prev.filter((slot) => slot.id !== slotId));
   };

   const addSlot = () => {
      setSlots((prev) => [...prev, createSlot()]);
   };

   const submit = () => {
      if (!assignmentId || !startDate || !endDate) {
         toast.error("Completa institucion, materia y rango de fechas.");
         return;
      }
      if (startDate > endDate) {
         toast.error("La fecha de inicio no puede ser mayor a la fecha de fin.");
         return;
      }
      if (slots.length === 0) {
         toast.error("Agrega al menos un bloque de dia y horario.");
         return;
      }
      if (slots.some((slot) => slot.time.trim().length === 0)) {
         toast.error("Todos los bloques deben tener horario.");
         return;
      }

      const uniqueSlotsMap = new Map<string, { dayOfWeek: number; time: string }>();
      slots.forEach((slot) => {
         uniqueSlotsMap.set(`${slot.dayOfWeek}-${slot.time}`, {
            dayOfWeek: slot.dayOfWeek,
            time: slot.time,
         });
      });
      const normalizedSlots = Array.from(uniqueSlotsMap.values());

      const created = onSchedule({
         institutionId,
         assignmentId,
         startDate,
         endDate,
         slots: normalizedSlots,
      });

      if (created === 0) {
         toast.info("No se crearon clases nuevas (ya existian en esos horarios).");
      } else {
         toast.success(`Se programaron ${created} clases.`);
      }
      onOpenChange(false);
   };

   return (
      <Dialog
         open={open}
         onOpenChange={(isOpen) => {
            onOpenChange(isOpen);
            if (isOpen) reset();
         }}
      >
         <DialogContent className="sm:max-w-[620px]">
            <DialogHeader>
               <DialogTitle>Configurar dias y horario de cursada</DialogTitle>
               <DialogDescription>
                  Un mismo curso puede tener varios bloques semanales con horarios distintos.
               </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
               <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Institucion</Label>
                  <Select
                     value={institutionId}
                     disabled={isLockedToInitialSelection || isInstitutionLocked}
                  >
                     <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Seleccionar..." />
                     </SelectTrigger>
                     <SelectContent>
                        {institutions.map((institution) => (
                           <SelectItem key={institution.id} value={institution.id}>
                              {institution.name}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>

               <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Materia</Label>
                  <Select
                     value={assignmentId}
                     onValueChange={setAssignmentId}
                     disabled={isLockedToInitialSelection}
                  >
                     <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Seleccionar..." />
                     </SelectTrigger>
                     <SelectContent>
                        {availableAssignments.map((assignment) => {
                           const subject = getSubjectById(assignment.subjectId);
                           if (!subject) return null;
                           return (
                              <SelectItem key={assignment.id} value={assignment.id}>
                                 {subject.name} ({assignment.section})
                           </SelectItem>
                           );
                        })}
                     </SelectContent>
                  </Select>
               </div>

               <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Desde</Label>
                  <Input
                     type="date"
                     className="h-9 text-xs"
                     value={startDate}
                     min={todayDate()}
                     onChange={(event) => setStartDate(event.target.value)}
                  />
               </div>

               <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Hasta</Label>
                  <Input
                     type="date"
                     className="h-9 text-xs"
                     value={endDate}
                     min={startDate || todayDate()}
                     onChange={(event) => setEndDate(event.target.value)}
                  />
               </div>
            </div>

            <div className="rounded-lg border border-border/70 p-3">
               <div className="mb-2 flex items-center justify-between">
                  <Label className="text-xs">Bloques semanales (dia + hora)</Label>
                  <Button
                     type="button"
                     variant="outline"
                     size="sm"
                     className="h-7 text-[11px]"
                     onClick={addSlot}
                  >
                     <Plus className="size-3.5 mr-1" />
                     Agregar bloque
                  </Button>
               </div>

               <div className="space-y-2">
                  {slots.map((slot) => (
                     <div
                        key={slot.id}
                        className="grid grid-cols-[minmax(0,1fr)_130px_36px] gap-2"
                     >
                        <Select
                           value={String(slot.dayOfWeek)}
                           onValueChange={(value) =>
                              updateSlot(slot.id, { dayOfWeek: Number(value) })
                           }
                        >
                           <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Dia" />
                           </SelectTrigger>
                           <SelectContent>
                              {weekDays.map((day) => (
                                 <SelectItem key={day.value} value={String(day.value)}>
                                    {day.label}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>

                        <Input
                           type="time"
                           className="h-9 text-xs"
                           value={slot.time}
                           onChange={(event) =>
                              updateSlot(slot.id, { time: event.target.value })
                           }
                        />

                        <Button
                           type="button"
                           variant="ghost"
                           size="icon"
                           className="size-9"
                           onClick={() => removeSlot(slot.id)}
                           disabled={slots.length === 1}
                        >
                           <Trash2 className="size-4 text-muted-foreground" />
                        </Button>
                     </div>
                  ))}
               </div>
            </div>

            <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2">
               <p className="text-[11px] text-muted-foreground">
                  Esta configuracion solo define agenda de cursada. Las clases se crean como{" "}
                  <span className="font-medium text-foreground">sin planificar</span> para
                  completar contenido despues.
               </p>
            </div>

            <DialogFooter>
               <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => onOpenChange(false)}
               >
                  Cancelar
               </Button>
               <Button size="sm" className="text-xs" onClick={submit}>
                  Generar horario
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}
