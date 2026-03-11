import { Card, CardContent } from "@/components/ui/card";
import { getInstitutionById, getSubjectById } from "@/lib/edu-repository";
import {
   getTodayStr,
   getWeekDaysFromToday,
} from "@/features/dashboard/constants";
import { usePlanningContext } from "@/features/planning";

export function WeekTimeline({ activeInstitution }: { activeInstitution: string }) {
   const { classes } = usePlanningContext();
   const todayStr = getTodayStr();
   const weekDays = getWeekDaysFromToday();

   return (
      <div>
         <h2 className="text-sm font-semibold text-foreground mb-3">
            Esta semana
         </h2>
         <Card>
            <CardContent className="p-4">
               <div className="flex gap-1">
                  {weekDays.map(({ date, label }) => {
                     const isToday = date === todayStr;
                     const dayClasses = classes.filter(
                        (c) =>
                           c.date === date &&
                           c.institutionId === activeInstitution,
                     );
                     return (
                        <div
                           key={date}
                           className={`flex-1 rounded-lg p-3 text-center transition-colors ${isToday ? "bg-primary/5 ring-1 ring-primary/20" : "hover:bg-muted/50"}`}
                        >
                           <p
                              className={`text-[10px] font-medium mb-1 capitalize ${isToday ? "text-primary" : "text-muted-foreground"}`}
                           >
                              {label.replace(".", "")}
                           </p>
                           <p
                              className={`text-xs font-semibold mb-2 ${isToday ? "text-primary" : "text-foreground"}`}
                           >
                              {parseInt(date.split("-")[2], 10)}
                           </p>
                           <div className="flex flex-wrap justify-center gap-1">
                              {dayClasses.map((cls) => {
                                 const inst = getInstitutionById(
                                    cls.institutionId,
                                 );
                                 return (
                                    <div
                                       key={cls.id}
                                       className="size-2 rounded-full"
                                       style={{
                                          backgroundColor:
                                             inst?.color || "#4F46E5",
                                       }}
                                       title={`${getSubjectById(cls.subjectId)?.name} - ${cls.time}`}
                                    />
                                 );
                              })}
                              {dayClasses.length === 0 && (
                                 <div className="size-2 rounded-full bg-muted" />
                              )}
                           </div>
                        </div>
                     );
                  })}
               </div>
            </CardContent>
         </Card>
      </div>
   );
}


