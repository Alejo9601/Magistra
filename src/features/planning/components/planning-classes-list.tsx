import { Edit3, RotateCcw, Eye, Copy, ClipboardCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell } from "@/components/ui/table";
import { MonthlyClassesCollapsibleTable } from "@/components/monthly-classes-collapsible-table";
import {
   getAssignmentById,
   getSubjectById,
   getInstitutionById,
} from "@/lib/edu-repository";
import { Link } from "react-router-dom";
import {
   classTypeColors,
   classTypeLabels,
   getStatusColor,
   getStatusLabel,
} from "@/features/planning/utils/constants";
import type { ClassSession } from "@/types";

type PlanningClassesListProps = {
   classes: ClassSession[];
   isMobile: boolean;
   monthsStateStorageKey: string;
   onClearFilters: () => void;
   onCreateClass: () => void;
   onOpenDetail: (id: string) => void;
   onOpenEdit: (id: string) => void;
   onReplan: (id: string) => void;
   onDuplicate: (id: string) => void;
};

export function PlanningClassesList({
   classes,
   isMobile,
   monthsStateStorageKey,
   onClearFilters,
   onCreateClass,
   onOpenDetail,
   onOpenEdit,
   onReplan,
   onDuplicate,
}: PlanningClassesListProps) {
   return (
      <div className="h-full overflow-auto">
         <MonthlyClassesCollapsibleTable
            classes={classes}
            emptyMessage="No hay clases para los filtros seleccionados."
            emptyAction={
               <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button
                     type="button"
                     size="sm"
                     variant="outline"
                     className="text-xs"
                     onClick={onClearFilters}
                  >
                     Limpiar filtros
                  </Button>
                  <Button
                     type="button"
                     size="sm"
                     className="text-xs"
                     onClick={onCreateClass}
                  >
                     Nueva clase
                  </Button>
               </div>
            }
            tableClassName="min-w-[860px]"
            defaultOpen={false}
            persistKey={monthsStateStorageKey}
            showBulkActions
            isMobile={isMobile}
            renderMonthMeta={(monthClasses) => {
               const total = monthClasses.length;
               const pending = monthClasses.filter(
                  (item) => item.status === "sin_planificar",
               ).length;
               const completed = monthClasses.filter(
                  (item) => item.status === "dictada",
               ).length;
               const pendingPct = total > 0 ? Math.round((pending / total) * 100) : 0;
               const completedPct =
                  total > 0 ? Math.round((completed / total) * 100) : 0;

               return (
                  <>
                     <Badge
                        variant="outline"
                        className="text-[10px] border-0 status-warning"
                     >
                        Sin plan {pendingPct}%
                     </Badge>
                     <Badge variant="outline" className="text-[10px] border-0 status-ok">
                        Dictadas {completedPct}%
                     </Badge>
                  </>
               );
            }}
            renderMobileItem={(cls) => {
               const subject = getSubjectById(cls.subjectId);
               const assignment = cls.assignmentId
                  ? getAssignmentById(cls.assignmentId)
                  : null;
               const inst = getInstitutionById(cls.institutionId);
               const dateObj = new Date(cls.date + "T12:00:00");

               return (
                  <div className="rounded-md border border-border/70 bg-card px-2.5 py-2">
                     <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                           <p className="truncate text-xs font-semibold text-foreground">
                              {subject?.name}
                           </p>
                           <p className="truncate text-[10px] text-muted-foreground">
                              {inst?.name} - {assignment?.section ?? subject?.course}
                           </p>
                           <p className="mt-1 text-[10px] text-foreground">
                              {dateObj.toLocaleDateString("es-AR", {
                                 day: "2-digit",
                                 month: "short",
                              })}{" "}
                              - {cls.time}
                           </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                           <Badge
                              variant="outline"
                              className={`border-0 text-[10px] ${classTypeColors[cls.type]}`}
                           >
                              {classTypeLabels[cls.type]}
                           </Badge>
                           <Badge
                              variant="outline"
                              className={`border-0 text-[10px] ${getStatusColor(cls.status)}`}
                           >
                              {getStatusLabel(cls.status)}
                           </Badge>
                        </div>
                     </div>
                     <p className="mt-1.5 truncate text-[10px] text-muted-foreground">
                        {cls.topic}
                     </p>
                     <div className="mt-2 flex items-center gap-1">
                        <Button
                           variant="ghost"
                           size="icon"
                           className="size-7"
                           title="Ver detalle de clase"
                           onClick={() => onOpenDetail(cls.id)}
                        >
                           <Eye className="size-3.5" />
                        </Button>
                        <Button
                           variant="ghost"
                           size="icon"
                           className="size-7"
                           asChild
                           title="Abrir dictado"
                        >
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
                                 ? onReplan(cls.id)
                                 : onOpenEdit(cls.id)
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
                           title="Duplicar clase"
                           onClick={() => onDuplicate(cls.id)}
                        >
                           <Copy className="size-3.5" />
                        </Button>
                     </div>
                  </div>
               );
            }}
            columns={[
               { label: "Fecha", className: "text-xs" },
               { label: "Materia", className: "text-xs" },
               { label: "Institucion", className: "text-xs" },
               { label: "Curso", className: "text-xs" },
               { label: "Tema", className: "text-xs" },
               { label: "Tipo", className: "text-xs" },
               { label: "Estado", className: "text-xs" },
               { label: "Acciones", className: "text-xs text-right" },
            ]}
            renderCells={(cls) => {
               const subject = getSubjectById(cls.subjectId);
               const assignment = cls.assignmentId
                  ? getAssignmentById(cls.assignmentId)
                  : null;
               const inst = getInstitutionById(cls.institutionId);
               const dateObj = new Date(cls.date + "T12:00:00");

               return (
                  <>
                     <TableCell className="whitespace-nowrap">
                        <div className="text-xs font-semibold text-foreground">
                           {dateObj.toLocaleDateString("es-AR", {
                              day: "2-digit",
                              month: "short",
                           })}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{cls.time} hs</div>
                     </TableCell>
                     <TableCell className="text-xs font-medium">{subject?.name}</TableCell>
                     <TableCell className="text-xs text-muted-foreground">{inst?.name}</TableCell>
                     <TableCell className="text-xs text-muted-foreground">
                        {assignment?.section ?? subject?.course}
                     </TableCell>
                     <TableCell className="text-xs max-w-[190px] truncate">
                        {cls.topic}
                     </TableCell>
                     <TableCell>
                        <Badge
                           variant="outline"
                           className={`border-0 text-[10px] ${classTypeColors[cls.type]}`}
                        >
                           {classTypeLabels[cls.type]}
                        </Badge>
                     </TableCell>
                     <TableCell>
                        <Badge
                           variant="outline"
                           className={`border-0 text-[10px] ${getStatusColor(cls.status)}`}
                        >
                           {getStatusLabel(cls.status)}
                        </Badge>
                     </TableCell>
                     <TableCell>
                        <div className="flex items-center justify-end gap-1">
                           <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              title="Ver detalle de clase"
                              onClick={() => onOpenDetail(cls.id)}
                           >
                              <Eye className="size-3.5" />
                           </Button>
                           <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              asChild
                              title="Abrir dictado"
                           >
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
                                    ? onReplan(cls.id)
                                    : onOpenEdit(cls.id)
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
                              title="Duplicar clase"
                              onClick={() => onDuplicate(cls.id)}
                           >
                              <Copy className="size-3.5" />
                           </Button>
                        </div>
                     </TableCell>
                  </>
               );
            }}
         />
      </div>
   );
}

