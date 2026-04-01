import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SubjectActivity } from "@/types";

export function ClaseDictadoActivitiesCard({
   isFinalized,
   linkedActivitiesSummary,
   linkedActivities,
   onCreateActivity,
   onOpenLinkDialog,
   onUnlinkActivity,
}: {
   isFinalized: boolean;
   linkedActivitiesSummary: {
      total: number;
      evaluables: number;
      completed: number;
      pending: number;
   };
   linkedActivities: SubjectActivity[];
   onCreateActivity: () => void;
   onOpenLinkDialog: () => void;
   onUnlinkActivity: (activityId: string) => void;
}) {
   return (
      <Card>
         <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Actividades</CardTitle>
         </CardHeader>
         <CardContent className="space-y-3 pt-0">
            {isFinalized ? (
               <div className="rounded-md border border-border/60 bg-muted/30 p-3 space-y-1.5">
                  <p className="text-xs font-medium text-foreground">Resumen de actividades</p>
                  <p className="text-[11px] text-muted-foreground">Total: {linkedActivitiesSummary.total}</p>
                  <p className="text-[11px] text-muted-foreground">
                     Evaluables: {linkedActivitiesSummary.evaluables}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                     Completadas: {linkedActivitiesSummary.completed}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                     Pendientes: {linkedActivitiesSummary.pending}
                  </p>
               </div>
            ) : null}

            <Button size="sm" className="w-full text-xs" onClick={onCreateActivity} disabled={isFinalized}>
               Crear nueva actividad
            </Button>
            <Button
               size="sm"
               variant="outline"
               className="w-full text-xs"
               onClick={onOpenLinkDialog}
               disabled={isFinalized}
            >
               Vincular actividad existente
            </Button>

            {linkedActivities.length === 0 ? (
               <p className="text-xs text-muted-foreground">
                  {isFinalized
                     ? "No hubo actividades vinculadas en esta clase."
                     : "No hay actividades vinculadas a esta clase."}
               </p>
            ) : (
               <div className="space-y-2">
                  {linkedActivities.map((activity) => (
                     <div key={activity.id} className="rounded-md border border-border/60 p-2">
                        <div className="flex items-start justify-between gap-2">
                           <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                 <span className="text-xs font-medium text-foreground">{activity.title}</span>
                                 <Badge variant="secondary" className="text-[10px] capitalize">
                                    {activity.type}
                                 </Badge>
                                 {activity.esEvaluable ? (
                                    <Badge className="text-[10px] border-0 bg-primary/10 text-primary">
                                       Evaluable
                                    </Badge>
                                 ) : null}
                              </div>
                              <p className="mt-0.5 text-[11px] text-muted-foreground">
                                 Estado: {activity.status}
                              </p>
                           </div>
                           {!isFinalized ? (
                              <Button
                                 type="button"
                                 variant="ghost"
                                 size="sm"
                                 className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                 onClick={() => onUnlinkActivity(activity.id)}
                              >
                                 Desvincular
                              </Button>
                           ) : null}
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </CardContent>
      </Card>
   );
}
