import { Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ClassStatusBadge } from "@/features/dashboard/class-status-badge";
import { getInstitutionById, getSubjectById } from "@/lib/edu-repository";
import { getTodayStr } from "@/features/dashboard/constants";
import { usePlanningContext } from "@/features/planning";

export function TodayClasses({ activeInstitution }: { activeInstitution: string }) {
   const { classes } = usePlanningContext();
   const todayStr = getTodayStr();

   const todayClasses = classes.filter(
      (c) => c.date === todayStr && c.institutionId === activeInstitution,
   );

   return (
      <div>
         <h2 className="text-sm font-semibold text-foreground mb-3">Hoy</h2>
         <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {todayClasses.map((cls) => {
               const subject = getSubjectById(cls.subjectId);
               const inst = getInstitutionById(cls.institutionId);
               return (
                  <Card
                     key={cls.id}
                     className="hover:shadow-md transition-shadow py-0 overflow-hidden"
                  >
                     <div
                        className="h-1"
                        style={{ backgroundColor: inst?.color || "#4F46E5" }}
                     />
                     <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                           <Clock className="size-3.5 text-muted-foreground" />
                           <span className="text-xs text-muted-foreground font-medium">
                              {cls.time} hs
                           </span>
                        </div>
                        <p className="text-sm font-semibold text-foreground mb-1">
                           {subject?.name}
                        </p>
                        <p className="text-xs text-muted-foreground mb-0.5">
                           {inst?.name}
                        </p>
                        <p className="text-xs text-muted-foreground mb-3">
                           {subject?.course}
                        </p>
                        <ClassStatusBadge status={cls.status} />
                     </CardContent>
                  </Card>
               );
            })}
         </div>
      </div>
   );
}


