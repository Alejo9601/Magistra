import { Copy, Edit3, Eye, RotateCcw, ClipboardCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import {
   getAssignmentById,
   getInstitutionById,
   getSubjectById,
} from "@/lib/edu-repository";
import {
   classTypeColors,
   classTypeLabels,
   getStatusColor,
   getStatusLabel,
} from "@/features/planning/utils/constants";
import type { ClassSession } from "@/types";

export function DayClassesDialog({
   selectedDayDate,
   selectedDayClasses,
   onClose,
   onEditClass,
   onReplanClass,
   onDuplicate,
}: {
   selectedDayDate: string | null;
   selectedDayClasses: ClassSession[];
   onClose: () => void;
   onEditClass: (id: string) => void;
   onReplanClass: (id: string) => void;
   onDuplicate: (id: string) => void;
}) {
   return (
      <Dialog
         open={Boolean(selectedDayDate)}
         onOpenChange={(open) => {
            if (!open) {
               onClose();
            }
         }}
      >
         <DialogContent className="sm:max-w-[640px]">
            <DialogHeader>
               <DialogTitle>Clases del dia</DialogTitle>
               <DialogDescription>
                  {selectedDayDate ?? "Selecciona un dia del calendario"}
               </DialogDescription>
            </DialogHeader>

            {selectedDayClasses.length === 0 ? (
               <p className="py-1 text-xs text-muted-foreground">
                  No hay clases para este dia con los filtros actuales.
               </p>
            ) : (
               <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                  {selectedDayClasses.map((cls) => {
                     const subject = getSubjectById(cls.subjectId);
                     const assignment = cls.assignmentId
                        ? getAssignmentById(cls.assignmentId)
                        : null;
                     const inst = getInstitutionById(cls.institutionId);
                     return (
                        <div key={cls.id} className="rounded-lg border border-border/70 p-3">
                           <div className="flex items-start justify-between gap-2">
                              <div>
                                 <p className="text-sm font-semibold text-foreground">
                                    {subject?.name}
                                 </p>
                                 <p className="text-xs text-muted-foreground">
                                    {inst?.name} - {assignment?.section ?? subject?.course} - {cls.time} hs
                                 </p>
                              </div>
                              <Badge className={`border-0 text-[10px] ${getStatusColor(cls.status)}`}>
                                 {getStatusLabel(cls.status)}
                              </Badge>
                           </div>
                           <div className="mt-2 flex flex-wrap gap-1.5">
                              <Badge className={`border-0 text-[10px] ${classTypeColors[cls.type]}`}>
                                 {classTypeLabels[cls.type]}
                              </Badge>
                              <Badge variant="secondary" className="text-[10px]">
                                 {cls.topic}
                              </Badge>
                           </div>
                           <div className="mt-3 flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="size-7" asChild>
                                 <Link to={`/clase/${cls.id}`}>
                                    <Eye className="size-3.5" />
                                 </Link>
                              </Button>
                              <Button variant="ghost" size="icon" className="size-7" asChild>
                                 <Link to={`/clase/${cls.id}/dictado`}>
                                    <ClipboardCheck className="size-3.5" />
                                 </Link>
                              </Button>
                              <Button
                                 variant="ghost"
                                 size="icon"
                                 className="size-7"
                                 title={
                                    cls.status === "planificada"
                                       ? "Replanificar clase"
                                       : "Editar clase"
                                 }
                                 onClick={() =>
                                    cls.status === "planificada"
                                       ? onReplanClass(cls.id)
                                       : onEditClass(cls.id)
                                 }
                              >
                                 {cls.status === "planificada" ? (
                                    <RotateCcw className="size-3.5" />
                                 ) : (
                                    <Edit3 className="size-3.5" />
                                 )}
                              </Button>
                              <Button
                                 variant="ghost"
                                 size="icon"
                                 className="size-7"
                                 onClick={() => onDuplicate(cls.id)}
                              >
                                 <Copy className="size-3.5" />
                              </Button>
                           </div>
                        </div>
                     );
                  })}
               </div>
            )}
         </DialogContent>
      </Dialog>
   );
}

