import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type GroupDetailAddStudentDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   subjectName: string;
   section: string;
   name: string;
   lastName: string;
   dni: string;
   email: string;
   observations: string;
   onNameChange: (value: string) => void;
   onLastNameChange: (value: string) => void;
   onDniChange: (value: string) => void;
   onEmailChange: (value: string) => void;
   onObservationsChange: (value: string) => void;
   onSubmit: () => void;
};

export function GroupDetailAddStudentDialog({
   open,
   onOpenChange,
   subjectName,
   section,
   name,
   lastName,
   dni,
   email,
   observations,
   onNameChange,
   onLastNameChange,
   onDniChange,
   onEmailChange,
   onObservationsChange,
   onSubmit,
}: GroupDetailAddStudentDialogProps) {
   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
               <DialogTitle>Agregar Alumno</DialogTitle>
               <DialogDescription>
                  Agrega un nuevo alumno al grupo {subjectName} - {section}.
               </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
               <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Nombre</Label>
                     <Input
                        className="h-9 text-xs"
                        placeholder="Nombre"
                        value={name}
                        onChange={(event) => onNameChange(event.target.value)}
                     />
                  </div>
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Apellido</Label>
                     <Input
                        className="h-9 text-xs"
                        placeholder="Apellido"
                        value={lastName}
                        onChange={(event) => onLastNameChange(event.target.value)}
                     />
                  </div>
               </div>
               <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">DNI / Legajo</Label>
                  <Input
                     className="h-9 text-xs"
                     placeholder="Ej: 45123678"
                     value={dni}
                     onChange={(event) => onDniChange(event.target.value)}
                  />
               </div>
               <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Email (opcional)</Label>
                  <Input
                     className="h-9 text-xs"
                     type="email"
                     placeholder="alumno@email.com"
                     value={email}
                     onChange={(event) => onEmailChange(event.target.value)}
                  />
               </div>
               <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Observaciones iniciales</Label>
                  <Textarea
                     className="text-xs min-h-[60px] resize-none"
                     placeholder="Notas sobre el alumno..."
                     value={observations}
                     onChange={(event) => onObservationsChange(event.target.value)}
                  />
               </div>
            </div>
            <DialogFooter>
               <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
                  Cancelar
               </Button>
               <Button size="sm" className="text-xs" onClick={onSubmit}>
                  Agregar
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}
