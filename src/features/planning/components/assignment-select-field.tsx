import { Label } from "@/components/ui/label";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import type { Subject, TeachingAssignment } from "@/types";

type AssignmentOption = Pick<TeachingAssignment, "id" | "section" | "subjectId">;

export function AssignmentSelectField({
   label = "Materia",
   value,
   assignments,
   onValueChange,
   getSubjectById,
   triggerClassName = "h-9 text-xs",
}: {
   label?: string;
   value: string;
   assignments: AssignmentOption[];
   onValueChange: (value: string) => void;
   getSubjectById: (subjectId: string) => Subject | undefined;
   triggerClassName?: string;
}) {
   return (
      <div className="space-y-1.5 w-full">
         <Label className="text-xs">{label}</Label>
         <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className={triggerClassName}>
               <SelectValue placeholder="Seleccionar materia" />
            </SelectTrigger>
            <SelectContent>
               {assignments.map((assignment) => {
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
   );
}
