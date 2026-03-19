import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ActivityStatus, ActivityType } from "@/types";

type GroupDetailAddActivityDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   subjectName: string;
   section: string;
   title: string;
   type: ActivityType;
   status: ActivityStatus;
   description: string;
   onTitleChange: (value: string) => void;
   onTypeChange: (value: ActivityType) => void;
   onStatusChange: (value: ActivityStatus) => void;
   onDescriptionChange: (value: string) => void;
   onSubmit: () => void;
};

export function GroupDetailAddActivityDialog({
   open,
   onOpenChange,
   subjectName,
   section,
   title,
   type,
   status,
   description,
   onTitleChange,
   onTypeChange,
   onStatusChange,
   onDescriptionChange,
   onSubmit,
}: GroupDetailAddActivityDialogProps) {
   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
               <DialogTitle>Nueva actividad</DialogTitle>
               <DialogDescription>
                  Crea una actividad para {subjectName} - {section}.
               </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 py-2">
               <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Titulo</Label>
                  <Input className="h-9 text-xs" placeholder="Ej: Guia de ejercicios de funciones" value={title} onChange={(event) => onTitleChange(event.target.value)} />
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Tipo</Label>
                     <Select value={type} onValueChange={(value) => onTypeChange(value as ActivityType)}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="classwork">En clase</SelectItem>
                           <SelectItem value="homework">Tarea</SelectItem>
                           <SelectItem value="lab">Laboratorio</SelectItem>
                           <SelectItem value="project">Proyecto</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Estado</Label>
                     <Select value={status} onValueChange={(value) => onStatusChange(value as ActivityStatus)}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="draft">Borrador</SelectItem>
                           <SelectItem value="planned">Planificada</SelectItem>
                           <SelectItem value="assigned">Asignada</SelectItem>
                           <SelectItem value="completed">Completada</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
               </div>
               <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Descripcion (opcional)</Label>
                  <Textarea className="text-xs min-h-[80px] resize-none" placeholder="Objetivos, consigna y criterios..." value={description} onChange={(event) => onDescriptionChange(event.target.value)} />
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
