import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { institutions, subjects } from "@/lib/edu-repository";
import { contentTypeLabels } from "@/features/content/constants";
import { toast } from "sonner";

export function UploadContentDialog({
   open,
   onOpenChange,
   activeInstitution,
}: {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   activeInstitution: string;
}) {
   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
               <DialogTitle>Subir Contenido</DialogTitle>
               <DialogDescription>
                  Agrega un nuevo recurso al repositorio.
               </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
               <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/40 transition-colors cursor-pointer">
                  <Upload className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                     Arrastra archivos aqui o haz clic para seleccionar
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                     PDF, DOC, PPT, imagenes o ingresa una URL
                  </p>
               </div>
               <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Nombre del recurso</Label>
                  <Input
                     className="h-9 text-xs"
                     placeholder="Ej: Guia de ejercicios Cap. 4"
                  />
               </div>
               <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Descripcion breve</Label>
                  <Textarea
                     className="text-xs min-h-[60px] resize-none"
                     placeholder="Descripcion del contenido..."
                  />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Institucion</Label>
                     <Select>
                        <SelectTrigger className="h-9 text-xs">
                           <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                           {institutions.map((i) => (
                              <SelectItem key={i.id} value={i.id}>
                                 {i.name}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                     <Label className="text-xs">Materia</Label>
                     <Select>
                        <SelectTrigger className="h-9 text-xs">
                           <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                           {subjects
                              .filter((s) => s.institutionId === activeInstitution)
                              .map((s) => (
                                 <SelectItem key={s.id} value={s.id}>
                                    {s.name} ({s.course})
                                 </SelectItem>
                              ))}
                        </SelectContent>
                     </Select>
                  </div>
               </div>
               <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Unidad tematica</Label>
                  <Input
                     className="h-9 text-xs"
                     placeholder="Ej: Ecuaciones, Trigonometria..."
                  />
               </div>
               <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Tipo</Label>
                  <Select>
                     <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Seleccionar tipo..." />
                     </SelectTrigger>
                     <SelectContent>
                        {Object.entries(contentTypeLabels).map(([k, v]) => (
                           <SelectItem key={k} value={k}>
                              {v}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>
            </div>
            <DialogFooter>
               <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="text-xs"
               >
                  Cancelar
               </Button>
               <Button
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                     onOpenChange(false);
                     toast.success("Contenido subido correctamente");
                  }}
               >
                  Guardar
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}

