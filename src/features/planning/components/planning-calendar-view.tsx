import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getInstitutionById, getSubjectById } from "@/lib/edu-repository";
import type { ClassSession } from "@/types";
import type { TouchEvent } from "react";

export type PlanningMonthDay = {
   day: number;
   dateStr: string;
   dayClasses: ClassSession[];
   isPastDate: boolean;
};

type PlanningCalendarViewProps = {
   isMobile: boolean;
   startDayOfWeek: number;
   monthDays: PlanningMonthDay[];
   weeks: (number | null)[][];
   year: number;
   month: number;
   filteredClasses: ClassSession[];
   todayStr: string;
   onTouchStart: (event: TouchEvent<HTMLDivElement>) => void;
   onTouchEnd: (event: TouchEvent<HTMLDivElement>) => void;
   onOpenDayDetails: (dateStr: string) => void;
   onCreateClass: (dateStr: string) => void;
   onEditClass: (id: string) => void;
};

export function PlanningCalendarView({
   isMobile,
   startDayOfWeek,
   monthDays,
   weeks,
   year,
   month,
   filteredClasses,
   todayStr,
   onTouchStart,
   onTouchEnd,
   onOpenDayDetails,
   onCreateClass,
   onEditClass,
}: PlanningCalendarViewProps) {
   return (
      <Card className="w-full">
         <CardContent className="overflow-x-auto p-0">
            {isMobile ? (
               <div className="p-1.5" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
                  <div className="mb-1 grid grid-cols-7 gap-1">
                     {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
                        <div
                           key={day}
                           className="py-1 text-center text-[10px] font-semibold text-muted-foreground"
                        >
                           {day}
                        </div>
                     ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                     {Array.from({ length: startDayOfWeek }).map((_, idx) => (
                        <div
                           key={`mobile-empty-${idx}`}
                           className="aspect-square rounded-md bg-muted/10"
                        />
                     ))}
                     {monthDays.map(({ day, dateStr, dayClasses, isPastDate }) => {
                        const hasClasses = dayClasses.length > 0;
                        return (
                           <button
                              key={dateStr}
                              type="button"
                              onClick={() => {
                                 if (hasClasses) {
                                    onOpenDayDetails(dateStr);
                                    return;
                                 }
                                 if (!isPastDate) {
                                    onCreateClass(dateStr);
                                 }
                              }}
                              className={`aspect-square rounded-md border p-1 text-left transition-colors ${
                                 isPastDate
                                    ? "border-border/60 bg-muted/45"
                                    : "border-border/70 bg-card hover:bg-muted/40"
                              }`}
                              title={
                                 hasClasses
                                    ? "Ver clases del dia"
                                    : isPastDate
                                      ? "Fecha pasada"
                                      : "Nueva clase"
                              }
                           >
                              <p
                                 className={`text-[11px] font-semibold ${isPastDate ? "text-foreground/70" : "text-foreground"}`}
                              >
                                 {day}
                              </p>
                              <div className="mt-1 flex flex-wrap gap-0.5">
                                 {dayClasses.slice(0, 3).map((cls) => {
                                    const inst = getInstitutionById(cls.institutionId);
                                    return (
                                       <span
                                          key={cls.id}
                                          className="size-1.5 rounded-full"
                                          style={{
                                             backgroundColor: inst?.color ?? "#4F46E5",
                                          }}
                                       />
                                    );
                                 })}
                                 {dayClasses.length > 3 && (
                                    <span className="text-[9px] leading-none text-primary">
                                       +{dayClasses.length - 3}
                                    </span>
                                 )}
                              </div>
                           </button>
                        );
                     })}
                  </div>
               </div>
            ) : (
               <div className="grid grid-cols-7">
                  {["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"].map((day) => (
                     <div
                        key={day}
                        className="border-b border-r border-border last:border-r-0 p-2 text-center"
                     >
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                           {day}
                        </span>
                     </div>
                  ))}
                  {weeks.flat().map((day, idx) => {
                     const dateStr = day
                        ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                        : "";
                     const dayClasses = day
                        ? filteredClasses.filter((classSession) => classSession.date === dateStr)
                        : [];
                     const isPastDate = Boolean(day && dateStr < todayStr);
                     return (
                        <div
                           key={idx}
                           className={`min-h-[92px] border-b border-r border-border last:border-r-0 p-1.5 ${day ? (isPastDate ? "bg-muted/55 ring-1 ring-inset ring-border/70" : "hover:bg-muted/30") : "bg-muted/10"}`}
                        >
                           {day && (
                              <>
                                 <div className="flex items-center justify-between gap-1">
                                    <span
                                       className={`text-xs font-medium ${isPastDate ? "text-foreground/75" : "text-foreground"}`}
                                    >
                                       {day}
                                    </span>
                                    <button
                                       onClick={() => {
                                          if (isPastDate) return;
                                          onCreateClass(dateStr);
                                       }}
                                       disabled={isPastDate}
                                       className={`size-5 inline-flex items-center justify-center rounded ${isPastDate ? "bg-muted/70 text-muted-foreground/70 cursor-not-allowed" : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"}`}
                                       title={
                                          isPastDate
                                             ? "No se pueden crear clases en fechas pasadas"
                                             : "Nueva clase"
                                       }
                                    >
                                       <Plus className="size-3" />
                                    </button>
                                 </div>
                                 <div className="mt-1 flex flex-col gap-0.5">
                                    {dayClasses.slice(0, 3).map((cls) => {
                                       const inst = getInstitutionById(cls.institutionId);
                                       const subject = getSubjectById(cls.subjectId);
                                       return (
                                          <button
                                             key={cls.id}
                                             onClick={() => {
                                                if (cls.status === "planificada") {
                                                   onOpenDayDetails(dateStr);
                                                   return;
                                                }
                                                onEditClass(cls.id);
                                             }}
                                             className={`w-full cursor-pointer text-left rounded px-1 py-0.5 text-[10px] font-medium truncate ${isPastDate ? "opacity-85" : ""}`}
                                             style={{
                                                backgroundColor: (inst?.color ?? "#4F46E5") + "15",
                                                color: inst?.color ?? "#4F46E5",
                                             }}
                                          >
                                             {subject?.name}
                                          </button>
                                       );
                                    })}
                                    {dayClasses.length > 3 && (
                                       <button
                                          type="button"
                                          onClick={() => onOpenDayDetails(dateStr)}
                                          className="text-[9px] text-primary px-1 text-left hover:underline"
                                       >
                                          +{dayClasses.length - 3} mas
                                       </button>
                                    )}
                                 </div>
                              </>
                           )}
                        </div>
                     );
                  })}
               </div>
            )}
         </CardContent>
      </Card>
   );
}
