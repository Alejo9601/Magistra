import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { CloseAnalysis } from "@/features/classroom/utils/class-teaching-utils";

export function ClassTeachingCloseDialog({
   open,
   onOpenChange,
   closeAnalysis,
   onConfirm,
}: {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   closeAnalysis: CloseAnalysis;
   onConfirm: () => void;
}) {
   return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
         <AlertDialogContent>
            <AlertDialogHeader>
               {closeAnalysis.hasChanges ? (
                  <>
                     <AlertDialogTitle>Se detectaron cambios respecto a la planificacion</AlertDialogTitle>
                     <AlertDialogDescription>
                        Revisa el resumen y confirma si deseas finalizar con estos cambios.
                     </AlertDialogDescription>
                  </>
               ) : (
                  <>
                     <AlertDialogTitle>La clase coincide con lo planificado</AlertDialogTitle>
                     <AlertDialogDescription>
                        Al confirmar, se cerrara la clase y se completaran los subtemas automaticamente.
                     </AlertDialogDescription>
                  </>
               )}
            </AlertDialogHeader>

            {closeAnalysis.hasChanges ? (
               <div className="space-y-3 text-xs">
                  <div>
                     <p className="font-semibold text-foreground">Subtemas</p>
                     {closeAnalysis.coveredSubtopics.length > 0 ? (
                        <p className="text-muted-foreground mt-1">
                           Dictados: {closeAnalysis.coveredSubtopics.join(", ")}
                        </p>
                     ) : null}
                     {closeAnalysis.missingSubtopics.length > 0 ? (
                        <p className="text-muted-foreground mt-1">
                           Pendientes: {closeAnalysis.missingSubtopics.join(", ")}
                        </p>
                     ) : null}
                  </div>

                  {(closeAnalysis.addedActivities.length > 0 ||
                     closeAnalysis.removedActivities.length > 0) && (
                     <div>
                        <p className="font-semibold text-foreground">Actividades</p>
                        {closeAnalysis.addedActivities.length > 0 ? (
                           <p className="text-muted-foreground mt-1">
                              Agregadas: {closeAnalysis.addedActivities.join(", ")}
                           </p>
                        ) : null}
                        {closeAnalysis.removedActivities.length > 0 ? (
                           <p className="text-muted-foreground mt-1">
                              Quitadas: {closeAnalysis.removedActivities.join(", ")}
                           </p>
                        ) : null}
                     </div>
                  )}
               </div>
            ) : null}

            <AlertDialogFooter>
               {closeAnalysis.hasChanges ? (
                  <>
                     <AlertDialogCancel className="text-xs">Revisar</AlertDialogCancel>
                     <AlertDialogAction className="text-xs" onClick={onConfirm}>
                        Confirmar
                     </AlertDialogAction>
                  </>
               ) : (
                  <>
                     <AlertDialogCancel className="text-xs">Cancelar</AlertDialogCancel>
                     <AlertDialogAction className="text-xs" onClick={onConfirm}>
                        Confirmar cierre
                     </AlertDialogAction>
                  </>
               )}
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );
}
