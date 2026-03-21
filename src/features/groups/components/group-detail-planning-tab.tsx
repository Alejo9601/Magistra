import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { MonthlyClassesCollapsibleTable } from "@/components/monthly-classes-collapsible-table";
import { TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { ClassSession } from "@/types";

type GroupDetailPlanningTabProps = {
   groupClasses: ClassSession[];
};

export function GroupDetailPlanningTab({ groupClasses }: GroupDetailPlanningTabProps) {
   return (
      <TabsContent value="planificacion">
         <MonthlyClassesCollapsibleTable
            classes={groupClasses}
            emptyMessage="No hay clases planificadas para este grupo."
            tableClassName="min-w-[640px]"
            columns={[
               { label: "Fecha", className: "text-xs" },
               { label: "Tema", className: "text-xs" },
               { label: "Tipo", className: "text-xs" },
               { label: "Estado", className: "text-xs" },
               { label: "Acciones", className: "text-xs text-right" },
            ]}
            renderCells={(cls) => {
               const dateObj = new Date(cls.date + "T12:00:00");

               return (
                  <>
                     <TableCell className="text-xs">
                        {dateObj.toLocaleDateString("es-AR", {
                           day: "2-digit",
                           month: "short",
                        })}{" "}
                        {cls.time}
                     </TableCell>
                     <TableCell className="text-xs font-medium">{cls.topic}</TableCell>
                     <TableCell>
                        <Badge variant="secondary" className="text-[10px] capitalize">
                           {cls.type}
                        </Badge>
                     </TableCell>
                     <TableCell>
                        <Badge
                           className={`border-0 text-[10px] ${
                              cls.status === "planificada"
                                 ? "bg-primary/10 text-primary"
                                 : cls.status === "finalizada"
                                   ? "bg-success/10 text-success"
                                   : "bg-warning/10 text-warning-foreground"
                           }`}
                        >
                           {cls.status === "planificada"
                              ? "Planificada"
                              : cls.status === "finalizada"
                                ? "Finalizada"
                                : "Sin planificar"}
                        </Badge>
                     </TableCell>
                     <TableCell>
                        <div className="flex justify-end">
                           {cls.status === "sin-planificar" ? (
                              <Button asChild size="sm" variant="outline" className="h-7 text-[11px]">
                                 <Link to={`/planificacion?classId=${cls.id}&status=sin-planificar`}>
                                    <Sparkles className="mr-1 size-3.5" />
                                    Planificar
                                 </Link>
                              </Button>
                           ) : null}
                        </div>
                     </TableCell>
                  </>
               );
            }}
         />
      </TabsContent>
   );
}
