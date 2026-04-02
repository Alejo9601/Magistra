import { Button } from "@/components/ui/button";

export function ClassTeachingAttendanceLockCard({
   onEnableManualEdit,
}: {
   onEnableManualEdit: () => void;
}) {
   return (
      <div className="rounded-md border border-dashed border-border/70 bg-muted/25 p-3 text-center">
         <p className="text-xs text-muted-foreground">
            Asistencia no editable: la clase ya esta dictada.
         </p>
         <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-2 text-xs"
            onClick={onEnableManualEdit}
         >
            Editar asistencia igualmente
         </Button>
      </div>
   );
}
