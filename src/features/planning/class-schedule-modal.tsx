import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { ClassScheduleSlotsSection } from "@/features/planning/components/class-schedule-slots-section";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import {
   getAssignmentsByInstitution,
   getAssignmentById,
   getSubjectById,
   institutions,
} from "@/lib/edu-repository";
import {
   resolveAssignmentIdForInstitution,
   resolveInstitutionId,
} from "@/features/planning/institution-context-guards";
import { toast } from "sonner";
import {
   addDays,
   adjustSlotBlockCount,
   createSlot,
   normalizeSlotsForSchedule,
   todayDate,
   type SlotInput,
} from "@/features/planning/utils/class-schedule-utils";

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
         blockCount: number;
      }>;
   }) => number;
}) {
   const isInstitutionLocked = true;
   const institutionId = resolveInstitutionId(activeInstitution, initialInstitutionId);
   const availableAssignments = getAssignmentsByInstitution(institutionId);

   const resolvedInitialAssignmentId = useMemo(
      () =>
         resolveAssignmentIdForInstitution({
            institutionId,
            candidateAssignmentId: initialAssignmentId,
            assignmentsByInstitution: availableAssignments,
            getAssignmentById,
         }),
      [availableAssignments, initialAssignmentId, institutionId],
   );

   const firstAvailableAssignmentId = availableAssignments[0]?.id ?? "";

   const isLockedToInitialSelection = Boolean(resolvedInitialAssignmentId);

   const [assignmentId, setAssignmentId] = useState("");
   const selectedAssignment = assignmentId ? getAssignmentById(assignmentId) : null;
   const selectedSubject = selectedAssignment ? getSubjectById(selectedAssignment.subjectId) : null;
   const selectedBlockDuration = selectedSubject?.blockDurationMinutes ?? 40;
   const [startDate, setStartDate] = useState(todayDate());
   const [endDate, setEndDate] = useState(addDays(todayDate(), 60));
   const [pendingDeleteSlotId, setPendingDeleteSlotId] = useState<string | null>(
      null,
   );
   const [slots, setSlots] = useState<SlotInput[]>([
      createSlot(1, "08:00", 1),
      createSlot(3, "08:00", 1),
   ]);

   useEffect(() => {
      if (!open) {
         return;
      }

      const nextAssignmentId =
         resolvedInitialAssignmentId || firstAvailableAssignmentId;
      setAssignmentId(nextAssignmentId);
      setStartDate(todayDate());
      setEndDate(addDays(todayDate(), 60));
      setSlots([createSlot(1, "08:00", 1), createSlot(3, "08:00", 1)]);
   }, [firstAvailableAssignmentId, open, resolvedInitialAssignmentId]);

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

   const adjustBlockCount = (slotId: string, delta: number) => {
      setSlots((prev) =>
         prev.map((slot) => {
            if (slot.id !== slotId) {
               return slot;
            }
            return { ...slot, blockCount: adjustSlotBlockCount(slot.blockCount, delta) };
         }),
      );
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
         toast.error("Todos los bloques deben tener hora de inicio.");
         return;
      }

      const normalizedSlots = normalizeSlotsForSchedule(slots);

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
      <>
         <Dialog
            open={open}
            onOpenChange={(isOpen) => {
               onOpenChange(isOpen);
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

               <ClassScheduleSlotsSection
                  selectedBlockDuration={selectedBlockDuration}
                  slots={slots}
                  onAddSlot={addSlot}
                  onUpdateSlot={updateSlot}
                  onAdjustBlockCount={adjustBlockCount}
                  onRequestDeleteSlot={setPendingDeleteSlotId}
               />

               <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">
                     La cantidad de bloques por clase define la duracion total automaticamente
                     segun la duracion de bloque configurada en la materia.
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

         <AlertDialog
            open={Boolean(pendingDeleteSlotId)}
            onOpenChange={(open) => {
               if (!open) setPendingDeleteSlotId(null);
            }}
         >
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>Eliminar bloque</AlertDialogTitle>
                  <AlertDialogDescription>
                     Se eliminara este bloque semanal de dia y horario.
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel className="text-xs">Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                     className="text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
                     onClick={() => {
                        if (!pendingDeleteSlotId) return;
                        removeSlot(pendingDeleteSlotId);
                        setPendingDeleteSlotId(null);
                     }}
                  >
                     Eliminar
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>
      </>
   );
}










