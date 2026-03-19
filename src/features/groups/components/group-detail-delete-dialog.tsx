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
import type { GroupPendingDelete } from "@/features/groups/types";

type GroupDetailDeleteDialogProps = {
   pendingDelete: GroupPendingDelete | null;
   onOpenChange: (open: boolean) => void;
   onConfirmDelete: () => void;
};

export function GroupDetailDeleteDialog({
   pendingDelete,
   onOpenChange,
   onConfirmDelete,
}: GroupDetailDeleteDialogProps) {
   return (
      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={onOpenChange}>
         <AlertDialogContent>
            <AlertDialogHeader>
               <AlertDialogTitle>
                  {pendingDelete?.kind === "assessment"
                     ? "Eliminar evaluacion"
                     : "Eliminar actividad"}
               </AlertDialogTitle>
               <AlertDialogDescription>
                  {pendingDelete?.kind === "assessment"
                     ? `Se eliminara la evaluacion "${pendingDelete.title}".`
                     : `Se eliminara la actividad "${pendingDelete?.title}".`}{" "}
                  Esta accion no se puede deshacer.
               </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
               <AlertDialogCancel className="text-xs">Cancelar</AlertDialogCancel>
               <AlertDialogAction
                  className="text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={onConfirmDelete}
               >
                  Eliminar
               </AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );
}
