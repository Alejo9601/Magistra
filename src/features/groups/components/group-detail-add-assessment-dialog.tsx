import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AssessmentStatus } from "@/types";
import {
   primaryEvaluativeFormatOptions,
   type PrimaryEvaluativeFormat,
} from "@/features/groups/utils/group-detail-utils";

type GroupDetailAddAssessmentDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   subjectName: string;
   section: string;
   title: string;
   evaluativeFormat: PrimaryEvaluativeFormat;
   date: string;
   status: AssessmentStatus;
   weight: string;
   maxScore: string;
   description: string;
   onTitleChange: (value: string) => void;
   onEvaluativeFormatChange: (value: PrimaryEvaluativeFormat) => void;
   onDateChange: (value: string) => void;
   onStatusChange: (value: AssessmentStatus) => void;
   onWeightChange: (value: string) => void;
   onMaxScoreChange: (value: string) => void;
   onDescriptionChange: (value: string) => void;
   onSubmit: () => void;
};

export function GroupDetailAddAssessmentDialog({
   open,
   onOpenChange,
   subjectName,
   section,
   title,
   evaluativeFormat,
   date,
   status,
   weight,
   maxScore,
   description,
   onTitleChange,
   onEvaluativeFormatChange,
   onDateChange,
   onStatusChange,
   onWeightChange,
   onMaxScoreChange,
   onDescriptionChange,
   onSubmit,
}: GroupDetailAddAssessmentDialogProps) {
   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
               <DialogTitle>Nueva evaluacion</DialogTitle>
               <DialogDescription>
                  Crea una instancia evaluativa para {subjectName} - {section}.
               </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 py-2">
               <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Nombre de la evaluacion</Label>
                  <Input
                     className="h-9 text-xs"
                     placeholder="Ej: Parcial 1 - Algebra"
                     value={title}
                     onChange={(event) => onTitleChange(event.target.value)}
                  />
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Tipo de evaluacion</Label>
                     <Select value={evaluativeFormat} onValueChange={(value) => onEvaluativeFormatChange(value as PrimaryEvaluativeFormat)}>
                        <SelectTrigger className="h-9 text-xs">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           {primaryEvaluativeFormatOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                 {option.label}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Fecha</Label>
                     <Input
                        className="h-9 text-xs"
                        type="date"
                        value={date}
                        onChange={(event) => onDateChange(event.target.value)}
                     />
                  </div>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Estado</Label>
                     <Select value={status} onValueChange={(value) => onStatusChange(value as AssessmentStatus)}>
                        <SelectTrigger className="h-9 text-xs">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="draft">Borrador</SelectItem>
                           <SelectItem value="scheduled">Programada</SelectItem>
                           <SelectItem value="published">Publicada</SelectItem>
                           <SelectItem value="graded">Corregida</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Ponderacion</Label>
                     <Input className="h-9 text-xs" type="number" min="0.1" step="0.1" value={weight} onChange={(event) => onWeightChange(event.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Nota maxima</Label>
                     <Input className="h-9 text-xs" type="number" min="1" step="1" value={maxScore} onChange={(event) => onMaxScoreChange(event.target.value)} />
                  </div>
               </div>
               <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Descripcion (opcional)</Label>
                  <Textarea className="text-xs min-h-[80px] resize-none" placeholder="Criterios, consigna, alcance..." value={description} onChange={(event) => onDescriptionChange(event.target.value)} />
               </div>
            </div>
            <DialogFooter>
               <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
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
