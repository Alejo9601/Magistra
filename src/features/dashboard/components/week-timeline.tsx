import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import { ClassStatusBadge } from "@/features/dashboard/components/class-status-badge";
import { getInstitutionById, getSubjectById } from "@/lib/edu-repository";
import {
   getTodayStr,
   getWeekDaysFromToday,
} from "@/features/dashboard/utils/constants";
import { usePlanningContext } from "@/features/planning";

export function WeekTimeline({ activeInstitution }: { activeInstitution: string }) {
   const { classes } = usePlanningContext();
   const todayStr = getTodayStr();
   const weekDays = getWeekDaysFromToday();
   const [selectedDate, setSelectedDate] = useState<string | null>(null);

   const selectedDayData =
      weekDays.find((day) => day.date === selectedDate) ?? null;
   const selectedDayClasses = useMemo(
      () =>
         classes
            .filter(
               (classSession) =>
                  classSession.date === selectedDate &&
                  classSession.institutionId === activeInstitution,
            )
            .sort((a, b) => a.time.localeCompare(b.time)),
      [activeInstitution, classes, selectedDate],
   );

   return (
      <div>
         <h2 className="text-sm font-semibold text-foreground mb-3">
            Agenda proxima (7 dias)
         </h2>
         <Card className="app-panel">
            <CardContent className="p-4">
               <div className="-mx-1 overflow-x-auto px-1">
                  <div className="grid min-w-[620px] grid-cols-7 gap-1">
                  {weekDays.map(({ date, label }) => {
                     const isToday = date === todayStr;
                     const dayClasses = classes.filter(
                        (c) => c.date === date && c.institutionId === activeInstitution,
                     );
                     return (
                        <button
                           key={date}
                           type="button"
                           onClick={() => setSelectedDate(date)}
                           className={`rounded-lg p-3 text-center transition-colors ${isToday ? "bg-primary/5 ring-1 ring-primary/20" : "hover:bg-muted/50"}`}
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
                                 const inst = getInstitutionById(cls.institutionId);
                                 return (
                                    <div
                                       key={cls.id}
                                       className="size-2 rounded-full"
                                       style={{
                                          backgroundColor: inst?.color || "#4F46E5",
                                       }}
                                       title={`${getSubjectById(cls.subjectId)?.name} - ${cls.time}`}
                                    />
                                 );
                              })}
                              {dayClasses.length === 0 && (
                                 <div className="size-2 rounded-full bg-muted" />
                              )}
                           </div>
                        </button>
                     );
                  })}
                  </div>
               </div>
            </CardContent>
         </Card>

         <Dialog
            open={Boolean(selectedDate)}
            onOpenChange={(open) => {
               if (!open) {
                  setSelectedDate(null);
               }
            }}
         >
            <DialogContent className="sm:max-w-[560px]">
               <DialogHeader>
                  <DialogTitle>Detalle del dia</DialogTitle>
                  <DialogDescription>
                     {selectedDayData
                        ? `${selectedDayData.label.replace(".", "")} ${selectedDayData.date}`
                        : "Selecciona un dia"}
                  </DialogDescription>
               </DialogHeader>
               {selectedDayClasses.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">
                     No hay clases programadas para este dia.
                  </p>
               ) : (
                  <div className="max-h-[360px] overflow-y-auto pr-1 space-y-2">
                     {selectedDayClasses.map((classSession) => {
                        const subject = getSubjectById(classSession.subjectId);
                        const institution = getInstitutionById(classSession.institutionId);
                        return (
                           <div
                              key={classSession.id}
                              className="rounded-lg border border-border/70 p-3"
                           >
                              <div className="flex items-start justify-between gap-2">
                                 <div>
                                    <p className="text-sm font-semibold text-foreground">
                                       {subject?.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                       {institution?.name} - {classSession.time} hs
                                    </p>
                                 </div>
                                 <ClassStatusBadge status={classSession.status} />
                              </div>
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                 <Badge variant="secondary" className="text-[10px]">
                                    {subject?.course}
                                 </Badge>
                                 {classSession.topic && (
                                    <Badge variant="secondary" className="text-[10px]">
                                       {classSession.topic}
                                    </Badge>
                                 )}
                              </div>
                              <div className="mt-3 flex items-center gap-2">
                                 <Button asChild variant="outline" size="sm" className="h-7 text-[11px]">
                                    <Link to={`/clase/${classSession.id}`}>Ver detalle</Link>
                                 </Button>
                                 <Button asChild size="sm" className="h-7 text-[11px]">
                                    <Link to={`/clase/${classSession.id}/dictado`}>Ir a dictado</Link>
                                 </Button>
                              </div>
                           </div>
                        );
                     })}
                  </div>
               )}
            </DialogContent>
         </Dialog>
      </div>
   );
}

