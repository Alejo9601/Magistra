import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ActivityType } from "@/types";

export function ClassTeachingCreateActivityDialog({
   open,
   onOpenChange,
   title,
   activityType,
   description,
   evaluable,
   onTitleChange,
   onActivityTypeChange,
   onDescriptionChange,
   onEvaluableChange,
   onCancel,
   onCreate,
}: {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   title: string;
   activityType: ActivityType;
   description: string;
   evaluable: boolean;
   onTitleChange: (value: string) => void;
   onActivityTypeChange: (value: ActivityType) => void;
   onDescriptionChange: (value: string) => void;
   onEvaluableChange: (value: boolean) => void;
   onCancel: () => void;
   onCreate: () => void;
}) {
   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
               <DialogTitle>Nueva actividad</DialogTitle>
               <DialogDescription>Crea y vincula una actividad para esta clase.</DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
               <div className="space-y-1.5">
                  <Label className="text-xs">Nombre de la actividad</Label>
                  <Input
                     className="h-9 text-xs"
                     placeholder="Ej: Trabajo practico de funciones"
                     value={title}
                     onChange={(event) => onTitleChange(event.target.value)}
                  />
               </div>

               <div className="space-y-1.5">
                  <Label className="text-xs">Tipo</Label>
                  <Select value={activityType} onValueChange={(value) => onActivityTypeChange(value as ActivityType)}>
                     <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="practica">Practica</SelectItem>
                        <SelectItem value="examen">Examen</SelectItem>
                        <SelectItem value="proyecto">Proyecto</SelectItem>
                        <SelectItem value="tarea">Tarea</SelectItem>
                     </SelectContent>
                  </Select>
               </div>

               <label className="flex items-center gap-2 text-xs text-foreground">
                  <Checkbox checked={evaluable} onCheckedChange={(checked) => onEvaluableChange(Boolean(checked))} />
                  Es evaluable
               </label>

               <div className="space-y-1.5">
                  <Label className="text-xs">Descripcion (opcional)</Label>
                  <Textarea
                     className="text-xs min-h-[80px] resize-none"
                     placeholder="Consigna, objetivo o notas para la actividad..."
                     value={description}
                     onChange={(event) => onDescriptionChange(event.target.value)}
                  />
               </div>
            </div>

            <DialogFooter>
               <Button variant="outline" size="sm" className="text-xs" onClick={onCancel}>
                  Cancelar
               </Button>
               <Button size="sm" className="text-xs" onClick={onCreate}>
                  Crear y vincular
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}
