import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import { ClaseDetailContent } from "@/features/classroom/pages";

export function ClassDetailDialog({
   open,
   classId,
   onOpenChange,
   onEditClass,
   onReplanClass,
   onDuplicateClass,
}: {
   open: boolean;
   classId: string | null;
   onOpenChange: (open: boolean) => void;
   onEditClass: (id: string) => void;
   onReplanClass: (id: string) => void;
   onDuplicateClass: (id: string) => void;
}) {
   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-[1100px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
               <DialogTitle>Detalle de clase</DialogTitle>
               <DialogDescription>
                  Informacion completa de la clase seleccionada.
               </DialogDescription>
            </DialogHeader>
            {classId ? (
               <ClaseDetailContent
                  classId={classId}
                  embedded
                  onEditClass={onEditClass}
                  onReplanClass={onReplanClass}
                  onDuplicateClass={onDuplicateClass}
               />
            ) : null}
         </DialogContent>
      </Dialog>
   );
}
