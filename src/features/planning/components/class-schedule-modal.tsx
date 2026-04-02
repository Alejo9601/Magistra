import { useEffect, useMemo, useState } from "react";
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
import { AssignmentSelectField } from "@/features/planning/components/assignment-select-field";
import { ClassScheduleSlotsSection } from "@/features/planning/components/class-schedule-slots-section";
import {
   getAssignmentsByInstitution,
   getAssignmentById,
   getSubjectById,
} from "@/lib/edu-repository";
import {
   resolveAssignmentIdForInstitution,
   resolveInstitutionId,
} from "@/features/planning/utils/institution-context-guards";
import { toast } from "sonner";
import {
   addDays,
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
   const fallbackInstitutionId =
      (initialAssignmentId ? getAssignmentById(initialAssignmentId)?.institutionId : undefined) ??
      initialInstitutionId;
   const institutionId = resolveInstitutionId(
      activeInstitution,
      initialInstitutionId,
      fallbackInstitutionId ?? "all",
   );
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

   const [assignmentId, setAssignmentId] = useState("");
   const selectedAssignment = assignmentId ? getAssignmentById(assignmentId) : null;
   const selectedSubject = selectedAssignment ? getSubjectById(selectedAssignment.subjectId) : null;
   const selectedBlockDuration = selectedSubject?.blockDurationMinutes ?? 40;
   const [startDate, setStartDate] = useState(todayDate());
   const [endDate, setEndDate] = useState(addDays(todayDate(), 60));
   const [focusSlotId, setFocusSlotId] = useState<string | null>(null);
   const [slots, setSlots] = useState<SlotInput[]>([
      createSlot(1, "08:00", 1),
      createSlot(3, "08:00", 1),
   ]);

   useEffect(() => {
      if (!open) {
         return;
      }

      const nextAssignmentId = resolvedInitialAssignmentId || firstAvailableAssignmentId;
      setAssignmentId(nextAssignmentId);
      setStartDate(todayDate());
      setEndDate(addDays(todayDate(), 60));
      setSlots([createSlot(1, "08:00", 1), createSlot(3, "08:00", 1)]);
      setFocusSlotId(null);
   }, [firstAvailableAssignmentId, open, resolvedInitialAssignmentId]);

   const updateSlot = (slotId: string, updates: Partial<SlotInput>) => {
      setSlots((prev) =>
         prev.map((slot) => (slot.id === slotId ? { ...slot, ...updates } : slot)),
      );
   };

   const removeSlot = (slotId: string) => {
      setSlots((prev) => prev.filter((slot) => slot.id !== slotId));
   };

   const inferNextDay = (dayOfWeek: number) => {
      if (dayOfWeek === 1) {
         return 3;
      }
      return dayOfWeek === 5 ? 1 : dayOfWeek + 1;
   };

   const addSlot = () => {
      setSlots((prev) => {
         const last = prev[prev.length - 1];
         const nextSlot = last
            ? createSlot(inferNextDay(last.dayOfWeek), last.time, 1)
            : createSlot();
         setFocusSlotId(nextSlot.id);
         return [...prev, nextSlot];
      });
   };

   const submit = () => {
      if (!assignmentId || !selectedAssignment || !startDate || !endDate) {
         toast.error("No se encontro la materia para programar.");
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
      if (normalizedSlots.length !== slots.length) {
         toast.error("Hay horarios repetidos. Revisa los dias, horas y bloques.");
         return;
      }

      const created = onSchedule({
         institutionId: selectedAssignment.institutionId,
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
         }}
      >
         <DialogContent className="sm:max-w-[720px]">
            <DialogHeader>
               <DialogTitle>Configurar cursada</DialogTitle>
               <DialogDescription>
                  Elegi los dias y horarios en los que das esta materia.
               </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-1">
               <AssignmentSelectField
                  value={assignmentId}
                  assignments={availableAssignments}
                  onValueChange={setAssignmentId}
                  getSubjectById={getSubjectById}
                  triggerClassName="h-9 text-xs w-full"
               />

               <div className="space-y-2">
                  <Label className="text-xs">Periodo</Label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                     <div className="flex flex-col gap-1">
                        <Label className="text-[11px] text-muted-foreground">Desde</Label>
                        <Input
                           type="date"
                           className="h-9 text-xs w-full"
                           value={startDate}
                           min={todayDate()}
                           onChange={(event) => setStartDate(event.target.value)}
                        />
                     </div>
                     <div className="flex flex-col gap-1">
                        <Label className="text-[11px] text-muted-foreground">Hasta</Label>
                        <Input
                           type="date"
                           className="h-9 text-xs w-full"
                           value={endDate}
                           min={startDate || todayDate()}
                           onChange={(event) => setEndDate(event.target.value)}
                        />
                     </div>
                  </div>
               </div>
            </div>

            <ClassScheduleSlotsSection
               selectedBlockDuration={selectedBlockDuration}
               slots={slots}
               onAddSlot={addSlot}
               onUpdateSlot={updateSlot}
               onRemoveSlot={removeSlot}
               focusSlotId={focusSlotId}
               onFocusSlotHandled={() => setFocusSlotId(null)}
            />

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
                  Generar clases automaticamente
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}



