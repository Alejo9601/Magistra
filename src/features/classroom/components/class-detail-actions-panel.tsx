import { Copy, Edit3 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function ClassDetailActionsPanel({
   classId,
   canStartClass,
   hasPlanning,
   isPlanned,
   isDictada,
   onEditClass,
   onDuplicate,
}: {
   classId: string;
   canStartClass: boolean;
   hasPlanning: boolean;
   isPlanned: boolean;
   isDictada: boolean;
   onEditClass?: (id: string) => void;
   onDuplicate: () => void;
}) {
   return (
      <div className="mb-4 grid gap-3 md:grid-cols-2">
         <div className="rounded-md border border-border/70 bg-muted/20 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
               Planificacion
            </p>
            <div className="flex flex-wrap gap-2">
               <Button
                  variant="outline"
                  size="sm"
                  className="text-xs min-h-9"
                  onClick={() => (onEditClass ? onEditClass(classId) : undefined)}
                  disabled={!onEditClass || !isPlanned}
               >
                  <Edit3 className="mr-1.5 size-3.5" />
                  Editar planificacion
               </Button>
               <Button
                  variant="outline"
                  size="sm"
                  className="text-xs min-h-9"
                  onClick={onDuplicate}
                  disabled={isDictada}
               >
                  <Copy className="mr-1.5 size-3.5" />
                  Duplicar
               </Button>
            </div>
         </div>

         <div className="rounded-md border border-border/70 bg-muted/20 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
               Ejecucion
            </p>
            <div className="flex flex-wrap gap-2">
               {canStartClass ? (
                  <Button asChild variant="outline" size="sm" className="text-xs min-h-9">
                     <Link to={`/clase/${classId}/dictado`}>Iniciar clase</Link>
                  </Button>
               ) : (
                  <Tooltip>
                     <TooltipTrigger asChild>
                        <span>
                           <Button variant="outline" size="sm" className="text-xs min-h-9" disabled>
                              Iniciar clase
                           </Button>
                        </span>
                     </TooltipTrigger>
                     <TooltipContent side="top" sideOffset={6} className="max-w-64">
                        {!hasPlanning
                           ? "Primero planifica la clase para poder iniciarla."
                           : "Necesitas al menos 1 alumno en el grupo para iniciar la clase."}
                     </TooltipContent>
                  </Tooltip>
               )}
            </div>
         </div>
      </div>
   );
}
