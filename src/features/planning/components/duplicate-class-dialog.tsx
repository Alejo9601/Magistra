import { CalendarDays, Clock, Copy } from "lucide-react";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ClassSession } from "@/types";

function addDays(dateStr: string, days: number) {
   const [year, month, day] = dateStr.split("-").map(Number);
   const date = new Date(Date.UTC(year, month - 1, day));
   date.setUTCDate(date.getUTCDate() + days);
   const yyyy = date.getUTCFullYear();
   const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
   const dd = String(date.getUTCDate()).padStart(2, "0");
   return `${yyyy}-${mm}-${dd}`;
}

export function DuplicateClassDialog({
   open,
   sourceClass,
   onOpenChange,
   onConfirm,
}: {
   open: boolean;
   sourceClass: ClassSession | null;
   onOpenChange: (open: boolean) => void;
   onConfirm: () => void;
}) {
   const targetDate = sourceClass ? addDays(sourceClass.date, 7) : "";
   const targetDateLabel = targetDate
      ? new Date(`${targetDate}T12:00:00`).toLocaleDateString("es-AR", {
           weekday: "long",
           day: "2-digit",
           month: "long",
        })
      : "";

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
               <DialogTitle className="inline-flex items-center gap-2">
                  <Copy className="size-4" />
                  Confirmar duplicacion de clase
               </DialogTitle>
               <DialogDescription>
                  Vas a crear una nueva clase con la misma configuracion de la clase actual.
               </DialogDescription>
            </DialogHeader>

            {sourceClass ? (
               <div className="space-y-3 rounded-md border border-border/70 bg-muted/20 p-3">
                  <p className="text-xs text-foreground">
                     <span className="font-semibold">Tema:</span> {sourceClass.topic}
                  </p>
                  <p className="inline-flex items-center gap-2 text-xs text-foreground">
                     <CalendarDays className="size-3.5 text-muted-foreground" />
                     <span className="font-semibold">Fecha nueva:</span> {targetDateLabel}
                  </p>
                  <p className="inline-flex items-center gap-2 text-xs text-foreground">
                     <Clock className="size-3.5 text-muted-foreground" />
                     <span className="font-semibold">Hora:</span> {sourceClass.time} hs
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                     Se creara una copia para la semana siguiente ({targetDate}).
                  </p>
               </div>
            ) : null}

            <DialogFooter>
               <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => onOpenChange(false)}
               >
                  Cancelar
               </Button>
               <Button type="button" size="sm" className="text-xs" onClick={onConfirm}>
                  Confirmar y duplicar
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}
