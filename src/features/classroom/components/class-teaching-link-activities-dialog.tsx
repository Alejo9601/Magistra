import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SubjectActivity } from "@/types";

export function ClassTeachingLinkActivitiesDialog({
   open,
   onOpenChange,
   search,
   onSearchChange,
   activities,
   selectedActivityIds,
   onToggleSelection,
   onCancel,
   onLink,
}: {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   search: string;
   onSearchChange: (value: string) => void;
   activities: SubjectActivity[];
   selectedActivityIds: string[];
   onToggleSelection: (activityId: string) => void;
   onCancel: () => void;
   onLink: () => void;
}) {
   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
               <DialogTitle>Vincular actividad existente</DialogTitle>
               <DialogDescription>
                  Selecciona una o mas actividades para asociarlas a esta clase.
               </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
               <div className="space-y-1.5">
                  <Label className="text-xs">Buscar actividad</Label>
                  <Input
                     className="h-9 text-xs"
                     placeholder="Buscar por nombre"
                     value={search}
                     onChange={(event) => onSearchChange(event.target.value)}
                  />
               </div>

               <div className="max-h-[280px] overflow-y-auto rounded-md border border-border/60 p-2">
                  {activities.length === 0 ? (
                     <p className="text-xs text-muted-foreground p-2">
                        No hay actividades disponibles para vincular.
                     </p>
                  ) : (
                     <div className="space-y-2">
                        {activities.map((activity) => (
                           <label
                              key={activity.id}
                              className="flex items-start gap-2 rounded-md border border-border/50 p-2 cursor-pointer"
                           >
                              <Checkbox
                                 checked={selectedActivityIds.includes(activity.id)}
                                 onCheckedChange={() => onToggleSelection(activity.id)}
                              />
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
                              </div>
                           </label>
                        ))}
                     </div>
                  )}
               </div>
            </div>

            <DialogFooter>
               <Button variant="outline" size="sm" className="text-xs" onClick={onCancel}>
                  Cancelar
               </Button>
               <Button size="sm" className="text-xs" onClick={onLink}>
                  Vincular
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}
