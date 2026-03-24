import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
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
   getAssignmentById,
   getAssignmentsByInstitution,
   getSubjectById,
   institutions,
} from "@/lib/edu-repository";
import { resolveInstitutionId } from "@/features/planning/utils/institution-context-guards";
import { todayDate } from "@/features/planning/utils/class-schedule-utils";

type QuickCreatePayload = {
   assignmentId: string;
   date: string;
   time: string;
   blockCount: number;
   scheduleTemplateId?: string;
};

export function ClassQuickCreateModal({
   open,
   onOpenChange,
   activeInstitution,
   initialDate,
   getScheduleSlotsForDate,
   onSubmit,
}: {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   activeInstitution: string;
   initialDate?: string;
   getScheduleSlotsForDate: (
      assignmentId: string,
      date: string,
   ) => Array<{ scheduleTemplateId: string; time: string; blockCount: number }>;
   onSubmit: (payload: QuickCreatePayload) => void;
}) {
   const institutionId = resolveInstitutionId(activeInstitution, undefined, institutions[0]?.id);
   const availableAssignments = getAssignmentsByInstitution(institutionId);

   const [assignmentId, setAssignmentId] = useState("");
   const [date, setDate] = useState(todayDate());
   const [time, setTime] = useState("08:00");
   const [blockCount, setBlockCount] = useState(1);
   const [matchedTemplateId, setMatchedTemplateId] = useState<string | undefined>(undefined);
   const [isAutoFilledBySchedule, setIsAutoFilledBySchedule] = useState(false);

   useEffect(() => {
      if (!open) {
         return;
      }
      const firstAssignmentId = availableAssignments[0]?.id ?? "";
      setAssignmentId(firstAssignmentId);
      const defaultDate = initialDate ?? todayDate();
      setDate(defaultDate);
      setTime("08:00");
      setBlockCount(1);
      setMatchedTemplateId(undefined);
      setIsAutoFilledBySchedule(false);
   }, [availableAssignments, initialDate, open]);

   const matchingSlots = useMemo(() => {
      if (!assignmentId || !date) {
         return [];
      }
      return getScheduleSlotsForDate(assignmentId, date);
   }, [assignmentId, date, getScheduleSlotsForDate]);

   useEffect(() => {
      if (!open || !assignmentId || !date) {
         return;
      }
      if (matchingSlots.length === 0) {
         setMatchedTemplateId(undefined);
         setIsAutoFilledBySchedule(false);
         return;
      }

      const preferredSlot = matchingSlots[0];
      setTime(preferredSlot.time);
      setBlockCount(preferredSlot.blockCount);
      setMatchedTemplateId(preferredSlot.scheduleTemplateId);
      setIsAutoFilledBySchedule(true);
   }, [assignmentId, date, matchingSlots, open]);

   const selectedAssignment = assignmentId ? getAssignmentById(assignmentId) : null;
   const selectedSubject = selectedAssignment
      ? getSubjectById(selectedAssignment.subjectId)
      : null;

   const submit = () => {
      if (!assignmentId || !date || !time || !blockCount) {
         toast.error("Completa fecha, hora y bloques para crear la clase.");
         return;
      }

      onSubmit({
         assignmentId,
         date,
         time,
         blockCount,
         scheduleTemplateId: matchedTemplateId,
      });
      onOpenChange(false);
   };

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
               <DialogTitle>Nueva clase</DialogTitle>
               <DialogDescription>
                  Crea la clase en segundos. La planificacion la haces despues.
               </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-1">
               <div className="space-y-1.5">
                  <Label className="text-xs">Materia</Label>
                  <Select value={assignmentId} onValueChange={setAssignmentId}>
                     <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Seleccionar materia" />
                     </SelectTrigger>
                     <SelectContent>
                        {availableAssignments.map((assignment) => {
                           const subject = getSubjectById(assignment.subjectId);
                           if (!subject) {
                              return null;
                           }
                           return (
                              <SelectItem key={assignment.id} value={assignment.id}>
                                 {subject.name} ({assignment.section})
                              </SelectItem>
                           );
                        })}
                     </SelectContent>
                  </Select>
               </div>

               <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div className="space-y-1.5">
                     <Label className="text-xs">Fecha</Label>
                     <Input
                        type="date"
                        className="h-9 text-xs"
                        value={date}
                        min={todayDate()}
                        onChange={(event) => setDate(event.target.value)}
                     />
                  </div>
                  <div className="space-y-1.5">
                     <Label className="text-xs">Hora inicio</Label>
                     <Input
                        type="time"
                        className="h-9 text-xs"
                        value={time}
                        onChange={(event) => {
                           setTime(event.target.value);
                           setIsAutoFilledBySchedule(false);
                        }}
                     />
                  </div>
                  <div className="space-y-1.5">
                     <Label className="text-xs">Bloques</Label>
                     <Select
                        value={String(blockCount)}
                        onValueChange={(value) => {
                           setBlockCount(Number(value));
                           setIsAutoFilledBySchedule(false);
                        }}
                     >
                        <SelectTrigger className="h-9 text-xs">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="1">1 bloque</SelectItem>
                           <SelectItem value="2">2 bloques</SelectItem>
                           <SelectItem value="3">3 bloques</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
               </div>

               {isAutoFilledBySchedule ? (
                  <p className="text-[11px] text-primary">
                     Horario autocompletado desde la cursada configurada.
                  </p>
               ) : (
                  <p className="text-[11px] text-muted-foreground">
                     Sin coincidencia con cursada: define solo hora y bloques.
                  </p>
               )}

               <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">Estado inicial</p>
                  <p className="text-xs font-medium text-foreground">sin_planificar</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                     {selectedSubject ? `${selectedSubject.name} · ${selectedAssignment?.section}` : ""}
                  </p>
               </div>
            </div>

            <DialogFooter>
               <Button variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>
                  Cancelar
               </Button>
               <Button size="sm" className="text-xs" onClick={submit}>
                  Crear clase
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}
