import { BookOpen, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/table";
import {
   activityStatusBadgeClass,
   activityStatusLabel,
   activityTypeLabel,
} from "@/features/groups/utils";
import type { SubjectActivity } from "@/types";

type GroupDetailActivitiesTabProps = {
   groupActivities: SubjectActivity[];
   onAddActivity: () => void;
   onDeleteActivity: (activityId: string, title: string) => void;
   onGradeActivity: (activityId: string) => void;
};

function formatDate(value?: string) {
   if (!value) return "-";
   return new Date(`${value}T12:00:00`).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
   });
}

export function GroupDetailActivitiesTab({
   groupActivities,
   onAddActivity,
   onDeleteActivity,
   onGradeActivity,
}: GroupDetailActivitiesTabProps) {
   return (
      <TabsContent value="actividades">
         <div className="mt-2 mb-3 flex items-center justify-end">
            <Button size="sm" className="text-xs" onClick={onAddActivity}>
               <Plus className="size-3.5 mr-1.5" />
               Crear actividad
            </Button>
         </div>
         <Card className="mt-2">
            <CardContent className="p-0">
               <Table className="min-w-[980px]">
                  <TableHeader>
                     <TableRow>
                        <TableHead className="text-xs">Actividad</TableHead>
                        <TableHead className="text-xs">Tipo</TableHead>
                        <TableHead className="text-xs">Evaluable</TableHead>
                        <TableHead className="text-xs">Fecha</TableHead>
                        <TableHead className="text-xs">Estado</TableHead>
                        <TableHead className="text-xs">Clases vinculadas</TableHead>
                        <TableHead className="text-xs text-right">Acciones</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {groupActivities.map((activity) => (
                        <TableRow key={activity.id} className="hover:bg-muted/30">
                           <TableCell className="text-xs font-medium">
                              <div>
                                 <p>{activity.title}</p>
                                 {activity.description && (
                                    <p className="text-[11px] text-muted-foreground mt-1">
                                       {activity.description}
                                    </p>
                                 )}
                              </div>
                           </TableCell>
                           <TableCell>
                              <Badge variant="secondary" className="text-[10px] capitalize">
                                 {activityTypeLabel[activity.type]}
                              </Badge>
                           </TableCell>
                           <TableCell>
                              {activity.esEvaluable ? (
                                 <Badge className="border-0 text-[10px] bg-primary/10 text-primary">
                                    Si
                                 </Badge>
                              ) : (
                                 <span className="text-xs text-muted-foreground">No</span>
                              )}
                           </TableCell>
                           <TableCell className="text-xs text-muted-foreground">
                              {formatDate(activity.fechaInicio)}
                              {activity.fechaFin ? ` - ${formatDate(activity.fechaFin)}` : ""}
                           </TableCell>
                           <TableCell>
                              <Badge
                                 className={`border-0 text-[10px] ${activityStatusBadgeClass[activity.status]}`}
                              >
                                 {activityStatusLabel[activity.status]}
                              </Badge>
                           </TableCell>
                           <TableCell className="text-xs text-muted-foreground">
                              {activity.linkedClassIds.length}
                           </TableCell>
                           <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                 <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-[11px]"
                                    onClick={() => onGradeActivity(activity.id)}
                                 >
                                    Calificar
                                 </Button>
                                 <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-7"
                                    onClick={() => onDeleteActivity(activity.id, activity.title)}
                                 >
                                    <Trash2 className="size-3.5 text-muted-foreground" />
                                 </Button>
                              </div>
                           </TableCell>
                        </TableRow>
                     ))}
                     {groupActivities.length === 0 && (
                        <TableRow>
                           <TableCell colSpan={7} className="text-center py-8">
                              <BookOpen className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                              <p className="text-xs text-muted-foreground">No hay actividades registradas</p>
                              <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={onAddActivity}>
                                 <Plus className="size-3.5 mr-1.5" />
                                 Crear actividad
                              </Button>
                           </TableCell>
                        </TableRow>
                     )}
                  </TableBody>
               </Table>
            </CardContent>
         </Card>
      </TabsContent>
   );
}
