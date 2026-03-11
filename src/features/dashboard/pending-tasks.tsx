import { CheckSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useDashboardContext } from "@/features/dashboard";

export function PendingTasks({ activeInstitution }: { activeInstitution: string }) {
   const { tasks, toggleTask } = useDashboardContext();
   const scopedTasks = tasks.filter(
      (task) => task.institutionId === activeInstitution,
   );

   return (
      <Card id="pending-tasks">
         <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
               <CheckSquare className="size-4 text-primary" />
               Tareas pendientes
            </CardTitle>
         </CardHeader>
         <CardContent className="pt-0">
            <div className="flex flex-col gap-2">
               {scopedTasks.map((task) => (
                  <label
                     key={task.id}
                     className="flex items-start gap-2.5 py-0.5 cursor-pointer group"
                  >
                     <Checkbox
                        checked={task.done}
                        onCheckedChange={(checked) =>
                           toggleTask(task.id, Boolean(checked))
                        }
                        className="mt-0.5"
                     />
                     <span
                        className={`text-xs leading-relaxed ${task.done ? "line-through text-muted-foreground" : "text-foreground group-hover:text-foreground/80"}`}
                     >
                        {task.text}
                     </span>
                  </label>
               ))}
               {scopedTasks.length === 0 && (
                  <p className="text-xs text-muted-foreground py-2">
                     No hay tareas para esta institucion.
                  </p>
               )}
            </div>
         </CardContent>
      </Card>
   );
}


