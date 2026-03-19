import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";

type InstitutionOption = {
   id: string;
   name: string;
};

type AssignmentOption = {
   id: string;
   subjectId: string;
   section: string;
};

export function ClassMetaFields({
   institutionId,
   isInstitutionLocked,
   institutions,
   assignmentId,
   onAssignmentChange,
   availableAssignments,
   resolveSubjectName,
   date,
   time,
   dateMin,
   isScheduledSlotLocked,
   onDateChange,
   onTimeChange,
}: {
   institutionId: string;
   isInstitutionLocked: boolean;
   institutions: InstitutionOption[];
   assignmentId: string;
   onAssignmentChange: (assignmentId: string) => void;
   availableAssignments: AssignmentOption[];
   resolveSubjectName: (subjectId: string) => string | null;
   date: string;
   time: string;
   dateMin?: string;
   isScheduledSlotLocked: boolean;
   onDateChange: (value: string) => void;
   onTimeChange: (value: string) => void;
}) {
   return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
         <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Institucion</Label>
            <Select value={institutionId} disabled={isInstitutionLocked}>
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
            <Select value={assignmentId} onValueChange={onAssignmentChange}>
               <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Seleccionar..." />
               </SelectTrigger>
               <SelectContent>
                  {availableAssignments.map((assignment) => {
                     const subjectName = resolveSubjectName(assignment.subjectId);
                     if (!subjectName) {
                        return null;
                     }
                     return (
                        <SelectItem key={assignment.id} value={assignment.id}>
                           {subjectName} ({assignment.section})
                        </SelectItem>
                     );
                  })}
               </SelectContent>
            </Select>
         </div>

         <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Fecha</Label>
            <Input
               type="date"
               className="h-9 text-xs"
               value={date}
               min={dateMin}
               disabled={isScheduledSlotLocked}
               onChange={(event) => onDateChange(event.target.value)}
            />
         </div>

         <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Hora</Label>
            <Input
               type="time"
               className="h-9 text-xs"
               value={time}
               disabled={isScheduledSlotLocked}
               onChange={(event) => onTimeChange(event.target.value)}
            />
         </div>
      </div>
   );
}

