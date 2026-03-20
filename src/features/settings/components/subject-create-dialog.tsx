import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import { institutions } from "@/lib/edu-repository";

export const periodFormatOptions = [
   { value: "trimestral", label: "Trimestral" },
   { value: "cuatrimestral", label: "Cuatrimestral" },
] as const;

export const blockDurationOptions = [
   { value: 20, label: "20 min" },
   { value: 30, label: "30 min" },
   { value: 40, label: "40 min" },
   { value: 50, label: "50 min" },
   { value: 60, label: "60 min" },
] as const;

type PeriodFormatValue = (typeof periodFormatOptions)[number]["value"];
type BlockDurationValue = (typeof blockDurationOptions)[number]["value"];

export function SubjectCreateDialog({
   open,
   institutionId,
   subjectName,
   course,
   periodFormat,
   blockDurationMinutes,
   copySectionStudents,
   onOpenChange,
   onInstitutionChange,
   onSubjectNameChange,
   onCourseChange,
   onPeriodFormatChange,
   onBlockDurationChange,
   onCopySectionStudentsChange,
   onCancel,
   onSubmit,
}: {
   open: boolean;
   institutionId: string;
   subjectName: string;
   course: string;
   periodFormat: PeriodFormatValue;
   blockDurationMinutes: BlockDurationValue;
   copySectionStudents: boolean;
   onOpenChange: (open: boolean) => void;
   onInstitutionChange: (value: string) => void;
   onSubjectNameChange: (value: string) => void;
   onCourseChange: (value: string) => void;
   onPeriodFormatChange: (value: PeriodFormatValue) => void;
   onBlockDurationChange: (value: BlockDurationValue) => void;
   onCopySectionStudentsChange: (value: boolean) => void;
   onCancel: () => void;
   onSubmit: () => void;
}) {
   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
               <DialogTitle>Agregar materia</DialogTitle>
               <DialogDescription>
                  Crea una nueva materia/curso para una institucion.
               </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-2">
               <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Institucion</Label>
                  <Select value={institutionId} onValueChange={onInstitutionChange}>
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
                  <Input
                     className="h-9 text-xs"
                     value={subjectName}
                     onChange={(event) => onSubjectNameChange(event.target.value)}
                     placeholder="Ej: Matematica"
                  />
               </div>

               <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Curso/Seccion</Label>
                  <Input
                     className="h-9 text-xs"
                     value={course}
                     onChange={(event) => onCourseChange(event.target.value)}
                     placeholder="Ej: 1A"
                  />
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Formato de periodo</Label>
                     <Select
                        value={periodFormat}
                        onValueChange={(value) => onPeriodFormatChange(value as PeriodFormatValue)}
                     >
                        <SelectTrigger className="h-9 text-xs">
                           <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                           {periodFormatOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                 {option.label}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Duracion de bloque</Label>
                     <Select
                        value={String(blockDurationMinutes)}
                        onValueChange={(value) =>
                           onBlockDurationChange(Number(value) as BlockDurationValue)
                        }
                     >
                        <SelectTrigger className="h-9 text-xs">
                           <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                           {blockDurationOptions.map((option) => (
                              <SelectItem key={option.value} value={String(option.value)}>
                                 {option.label}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
               </div>

               <label className="flex items-start gap-2 cursor-pointer">
                  <Checkbox
                     checked={copySectionStudents}
                     onCheckedChange={(checked) => onCopySectionStudentsChange(Boolean(checked))}
                     className="mt-0.5"
                  />
                  <span className="text-xs text-muted-foreground leading-relaxed">
                     Incluir alumnos de otras materias con la misma seccion/division
                     (misma institucion).
                  </span>
               </label>
            </div>

            <DialogFooter>
               <Button variant="outline" size="sm" className="text-xs" onClick={onCancel}>
                  Cancelar
               </Button>
               <Button size="sm" className="text-xs" onClick={onSubmit}>
                  Guardar
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}
