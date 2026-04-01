import { Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function ClaseDetailUnplannedAlert({
   classId,
   onEditClass,
}: {
   classId: string;
   onEditClass?: (id: string) => void;
}) {
   const handlePlanNow = () => {
      if (!onEditClass) {
         return;
      }

      onEditClass(classId);
      toast.message("Abriendo planificacion", {
         description: "Define contenidos, recursos y estructura de la clase.",
      });
   };

   return (
      <div className="mb-4 rounded-md border border-warning/40 bg-warning/10 p-3">
         <p className="text-sm font-medium text-foreground">Esta clase no esta planificada</p>
         <Button
            variant="outline"
            size="sm"
            className="mt-2 text-xs min-h-9"
            onClick={handlePlanNow}
            disabled={!onEditClass}
         >
            <Tooltip>
               <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1.5">
                     Planificar ahora
                     <Info className="size-3.5 text-muted-foreground" />
                  </span>
               </TooltipTrigger>
               <TooltipContent side="top" sideOffset={6} className="max-w-56">
                  Establecer detalles de la clase y dejarla lista para dictado.
               </TooltipContent>
            </Tooltip>
         </Button>
      </div>
   );
}
