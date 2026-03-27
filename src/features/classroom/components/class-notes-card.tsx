import { Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@/components/ui/tooltip";

export function ClassNotesCard({
   notes,
   onChange,
   onSave,
   lockedMessage,
}: {
   notes: string;
   onChange: (value: string) => void;
   onSave: () => void;
   lockedMessage?: string;
}) {
   return (
      <Card>
         <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold inline-flex items-center gap-2">
               Notas de la clase
               <Tooltip>
                  <TooltipTrigger asChild>
                     <button
                        type="button"
                        className="inline-flex size-6 items-center justify-center rounded-full border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        aria-label="Ayuda sobre notas de la clase"
                     >
                        <Info className="size-3.5" />
                     </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={6} className="max-w-64">
                     Registra observaciones clave de la clase: avances, dificultades y
                     ajustes para el proximo encuentro.
                  </TooltipContent>
               </Tooltip>
            </CardTitle>
         </CardHeader>
         <CardContent className="pt-0">
            {lockedMessage ? (
               <div className="flex min-h-[136px] items-center justify-center rounded-md border border-dashed border-border/70 bg-muted/25 px-3 text-center">
                  <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                     <Info className="size-3.5" />
                     {lockedMessage}
                  </p>
               </div>
            ) : (
               <>
                  <Textarea
                     className="text-xs min-h-[100px] resize-none"
                     placeholder="Registra como resulto la clase vs lo planificado..."
                     value={notes}
                     onChange={(event) => onChange(event.target.value)}
                  />
                  <Button size="sm" className="mt-3 text-xs min-h-9 font-semibold" onClick={onSave}>
                     Guardar notas
                  </Button>
               </>
            )}
         </CardContent>
      </Card>
   );
}
