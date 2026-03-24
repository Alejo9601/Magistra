import { Link } from "react-router-dom";
import { PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { classDateTimeMs, formatCountdown } from "@/features/dashboard/utils/today-classes-utils";
import { getInstitutionById, getSubjectById } from "@/lib/edu-repository";
import type { ClassSession } from "@/types";

export function TodayClassesNextCard({
   classCardTarget,
   isNextToday,
   totalSubjects,
   nowMs,
}: {
   classCardTarget: ClassSession | undefined;
   isNextToday: boolean;
   totalSubjects: number;
   nowMs: number;
}) {
   const classCardTargetMs = classCardTarget
      ? classDateTimeMs(classCardTarget.date, classCardTarget.time)
      : null;

   const title =
      isNextToday && classCardTarget && classCardTarget.status !== "dictada" && classCardTargetMs !== null && classCardTargetMs <= nowMs
         ? "Clase de hoy pendiente de cierre"
         : isNextToday
            ? "Proxima clase de hoy"
            : "Proxima clase";

   return (
      <Card className="app-panel xl:col-span-2 py-0 overflow-hidden">
         <div className="h-1 bg-primary/70" />
         <CardContent className="p-4">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
               {title}
            </p>
            {classCardTarget ? (
               <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-3 md:gap-4">
                  <div>
                     <p className="text-lg font-semibold text-foreground">
                        {getSubjectById(classCardTarget.subjectId)?.name}
                     </p>
                     <p className="text-xs text-muted-foreground">
                        {getSubjectById(classCardTarget.subjectId)?.course}
                     </p>
                     <p className="mt-1 text-xs text-muted-foreground">
                        {classCardTarget.date} - {classCardTarget.time} hs
                     </p>
                     <p className="mt-1 text-[11px] text-primary font-medium">
                        {formatCountdown(
                           classDateTimeMs(classCardTarget.date, classCardTarget.time),
                           nowMs,
                        )}
                     </p>
                     <div className="mt-3 flex flex-wrap gap-1.5">
                        <Badge className="max-w-full bg-muted text-muted-foreground border-0 text-[10px]">
                           {totalSubjects} materias activas
                        </Badge>
                        <Badge
                           className="max-w-[220px] truncate bg-muted text-muted-foreground border-0 text-[10px]"
                           title={getInstitutionById(classCardTarget.institutionId)?.name}
                        >
                           {getInstitutionById(classCardTarget.institutionId)?.name}
                        </Badge>
                        <Button asChild size="sm" className="h-6 rounded-md px-2 text-[10px]">
                           <Link to={`/clase/${classCardTarget.id}/dictado`}>
                              <PlayCircle className="size-3.5 mr-1.5" />
                              Ir a dictado
                           </Link>
                        </Button>
                     </div>
                  </div>
                  <div className="md:border-l md:border-border/70 md:pl-4">
                     {classCardTarget.topic ? (
                        <>
                           <p className="text-[11px] font-medium text-foreground">
                              {classCardTarget.topic}
                           </p>
                           {classCardTarget.subtopics.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                 {classCardTarget.subtopics.slice(0, 3).map((subtopic) => (
                                    <Badge
                                       key={subtopic}
                                       className="bg-background border border-border text-muted-foreground text-[10px] px-1.5"
                                    >
                                       {subtopic}
                                    </Badge>
                                 ))}
                              </div>
                           )}
                           {classCardTarget.activities && (
                              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                                 {classCardTarget.activities}
                              </p>
                           )}
                           {classCardTarget.resources && classCardTarget.resources.length > 0 && (
                              <div className="mt-2">
                                 <Badge className="bg-primary/10 text-primary border-0 text-[10px]">
                                    {classCardTarget.resources.length} recurso
                                    {classCardTarget.resources.length > 1 ? "s" : ""}
                                 </Badge>
                              </div>
                           )}
                        </>
                     ) : (
                        <p className="text-xs text-muted-foreground">
                           Sin contenido cargado para esta clase.
                        </p>
                     )}
                  </div>
               </div>
            ) : (
               <p className="mt-2 text-xs text-muted-foreground">
                  No hay clases pendientes para esta institucion.
               </p>
            )}
         </CardContent>
      </Card>
   );
}

