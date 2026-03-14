import { useMemo } from "react";
import { Calendar, Star, ShieldAlert, ArrowLeft, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
   attendanceRecords,
   getAssignmentById,
   getAssignmentIdBySubjectId,
   getSubjectById,
   getInstitutionById,
} from "@/lib/edu-repository";
import { useStudentsContext } from "@/features/students";
import { usePlanningContext } from "@/features/planning";
import { useClassroomContext } from "@/features/classroom";

export function StudentProfile({
   studentId,
   onBack,
   activeInstitution,
   assignmentId,
}: {
   studentId: string;
   onBack: () => void;
   activeInstitution: string;
   assignmentId?: string;
}) {
   const { students } = useStudentsContext();
   const { classes } = usePlanningContext();
   const { getRecord } = useClassroomContext();
   const student = students.find((s) => s.id === studentId);

   if (!student) return null;

   const selectedAssignment = assignmentId ? getAssignmentById(assignmentId) : null;
   const scopedSubjectId = selectedAssignment?.subjectId;
   const studentSubjects = (scopedSubjectId ? [scopedSubjectId] : student.subjectIds)
      .map((sid) => getSubjectById(sid))
      .filter((subject) => Boolean(subject))
      .filter((subject) => subject?.institutionId === activeInstitution);
   const firstSubject = studentSubjects[0] || getSubjectById(student.subjectIds[0]);
   const inst = firstSubject ? getInstitutionById(firstSubject.institutionId) : null;

   const attendanceEntries = useMemo(() => {
      const relevantClasses = classes.filter((classSession) => {
         if (classSession.institutionId !== activeInstitution) {
            return false;
         }
         if (!scopedSubjectId) {
            return student.subjectIds.includes(classSession.subjectId);
         }
         const classAssignmentId =
            classSession.assignmentId ?? getAssignmentIdBySubjectId(classSession.subjectId);
         return classAssignmentId === assignmentId;
      });

      const seededAttendanceByClass = new Map(
         attendanceRecords
            .filter((entry) => entry.studentId === studentId)
            .map(
               (entry) =>
                  [entry.classId, entry.status as "P" | "A" | "T" | "J"] as const,
            ),
      );

      return relevantClasses
         .map((classSession) => {
            const fromClassroom = getRecord(classSession.id).attendance[studentId];
            const fallback = seededAttendanceByClass.get(classSession.id);
            return {
               classId: classSession.id,
               date: classSession.date,
               status: fromClassroom ?? fallback,
            };
         })
         .filter(
            (
               entry,
            ): entry is { classId: string; date: string; status: "P" | "A" | "T" | "J" } =>
               Boolean(entry.status),
         );
   }, [activeInstitution, assignmentId, classes, getRecord, scopedSubjectId, student.subjectIds, studentId]);

   const attendancePct = useMemo(() => {
      if (attendanceEntries.length === 0) {
         return student.attendance;
      }
      const attendedWeight = attendanceEntries.reduce((sum, entry) => {
         if (entry.status === "P" || entry.status === "J") return sum + 1;
         if (entry.status === "T") return sum + 0.5;
         return sum;
      }, 0);
      return Math.round((attendedWeight / attendanceEntries.length) * 100);
   }, [attendanceEntries, student.attendance]);

   const attendanceByDate = useMemo(() => {
      const grouped = new Map<string, Array<"P" | "A" | "T" | "J">>();
      attendanceEntries.forEach((entry) => {
         const list = grouped.get(entry.date) ?? [];
         list.push(entry.status);
         grouped.set(entry.date, list);
      });

      return new Map(
         Array.from(grouped.entries()).map(([date, statuses]) => {
            let aggregated: "present" | "absent" | "late" | "justified";
            if (statuses.includes("A")) {
               aggregated = "absent";
            } else if (statuses.includes("T")) {
               aggregated = "late";
            } else if (statuses.includes("J")) {
               aggregated = "justified";
            } else {
               aggregated = "present";
            }
            return [date, aggregated] as const;
         }),
      );
   }, [attendanceEntries]);

   const calendarDays = useMemo(() => {
      const today = new Date();
      return Array.from({ length: 28 }, (_, index) => {
         const date = new Date(today);
         date.setDate(today.getDate() - (27 - index));
         const yyyy = date.getFullYear();
         const mm = String(date.getMonth() + 1).padStart(2, "0");
         const dd = String(date.getDate()).padStart(2, "0");
         const dateStr = `${yyyy}-${mm}-${dd}`;
         return {
            date: dateStr,
            day: date.getDate(),
            status: attendanceByDate.get(dateStr) ?? "none",
         };
      });
   }, [attendanceByDate]);

   const calendarOffset = useMemo(() => {
      if (calendarDays.length === 0) {
         return 0;
      }
      const firstDate = new Date(`${calendarDays[0].date}T12:00:00`);
      const jsDay = firstDate.getDay();
      return (jsDay + 6) % 7;
   }, [calendarDays]);

   const absentCount = attendanceEntries.filter((entry) => entry.status === "A").length;
   const lateCount = attendanceEntries.filter((entry) => entry.status === "T").length;

   const hasGrades = student.average > 0;
   const hasEnoughAttendanceEvidence = attendanceEntries.length >= 2;
   const riskLevel =
      student.status === "en-riesgo"
         ? "alto"
         : !hasGrades && !hasEnoughAttendanceEvidence
           ? "sin-datos"
           : attendancePct < 65 || (hasGrades && student.average < 6)
             ? "alto"
             : attendancePct < 80 || (hasGrades && student.average < 7)
               ? "medio"
               : "bajo";

   const observations = student.observations
      ? [
           {
              date: null,
              text: student.observations,
           },
        ]
      : [];

   return (
      <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:p-6">
         <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" className="size-8" onClick={onBack}>
               <ArrowLeft className="size-4" />
            </Button>
            <div className="flex items-center gap-3">
               <Avatar className="size-12">
                  <AvatarFallback className="bg-primary/10 text-primary text-base font-bold">
                     {student.name[0]}
                     {student.lastName[0]}
                  </AvatarFallback>
               </Avatar>
               <div>
                  <h1 className="text-xl font-bold text-foreground">
                     {student.name} {student.lastName}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                     {inst?.name} - {firstSubject?.name} - {firstSubject?.course}
                  </p>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
               <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                     <Calendar className="size-5 text-primary" />
                  </div>
                  <div>
                     <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {assignmentId ? "Asistencia del grupo" : "Asistencia general"}
                     </p>
                     <p
                        className={`text-2xl font-bold ${attendancePct >= 80 ? "text-success" : attendancePct >= 65 ? "text-warning-foreground" : "text-destructive"}`}
                     >
                        {attendancePct}%
                     </p>
                  </div>
               </CardContent>
            </Card>
            <Card>
               <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-warning/10">
                     <Star className="size-5 text-warning-foreground" />
                  </div>
                  <div>
                     <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Promedio
                     </p>
                     <p className="text-2xl font-bold text-foreground">
                        {student.average > 0 ? student.average.toFixed(1) : "Sin datos"}
                     </p>
                  </div>
               </CardContent>
            </Card>
            <Card>
               <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10">
                     <ShieldAlert className="size-5 text-destructive" />
                  </div>
                  <div>
                     <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Riesgo academico
                     </p>
                     <Badge
                        className={`border-0 text-[10px] capitalize ${riskLevel === "alto" ? "bg-destructive/15 text-destructive" : riskLevel === "medio" ? "bg-warning/15 text-warning-foreground" : riskLevel === "bajo" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}
                     >
                        {riskLevel === "sin-datos" ? "sin datos" : riskLevel}
                     </Badge>
                  </div>
               </CardContent>
            </Card>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6">
               <Card>
                  <CardHeader className="pb-3">
                     <CardTitle className="text-sm font-semibold">
                        Historial de asistencias (ultimos 28 dias)
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                     <div className="grid grid-cols-7 gap-1.5">
                        {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
                           <div
                              key={d}
                              className="text-center text-[10px] font-medium text-muted-foreground pb-1"
                           >
                              {d}
                           </div>
                        ))}
                        {Array.from({ length: calendarOffset }).map((_, i) => (
                           <div key={`empty-${i}`} />
                        ))}
                        {calendarDays.map((d) => (
                           <div
                              key={d.date}
                              className={`flex items-center justify-center size-8 rounded-md text-[10px] font-medium ${
                                 d.status === "present"
                                    ? "bg-success/15 text-success"
                                    : d.status === "absent"
                                      ? "bg-destructive/15 text-destructive"
                                      : d.status === "late"
                                        ? "bg-warning/15 text-warning-foreground"
                                        : d.status === "justified"
                                          ? "bg-info/15 text-info"
                                        : "bg-muted text-muted-foreground"
                              }`}
                           >
                              {d.day}
                           </div>
                        ))}
                     </div>
                  </CardContent>
               </Card>

               <Card>
                  <CardHeader className="pb-3">
                     <CardTitle className="text-sm font-semibold">Indicadores de riesgo</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2">
                           <p className="text-[10px] text-muted-foreground uppercase">Ausencias</p>
                           <p className="text-lg font-semibold text-foreground">{absentCount}</p>
                        </div>
                        <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2">
                           <p className="text-[10px] text-muted-foreground uppercase">Tardanzas</p>
                           <p className="text-lg font-semibold text-foreground">{lateCount}</p>
                        </div>
                        <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2">
                           <p className="text-[10px] text-muted-foreground uppercase">Clases computadas</p>
                           <p className="text-lg font-semibold text-foreground">{attendanceEntries.length}</p>
                        </div>
                     </div>
                  </CardContent>
               </Card>
            </div>

            <div>
               <Card>
                  <CardHeader className="pb-3">
                     <CardTitle className="text-sm font-semibold">Observaciones</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                     <div className="flex flex-col gap-0">
                        {observations.map((obs, idx) => {
                           const dateObj = obs.date ? new Date(obs.date + "T12:00:00") : null;
                           return (
                              <div key={idx} className="relative flex gap-3 pb-4 last:pb-0">
                                 {idx < observations.length - 1 && (
                                    <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border" />
                                 )}
                                 <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted">
                                    <MessageSquare className="size-3 text-muted-foreground" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    {obs.date && dateObj && (
                                       <p className="text-[10px] text-muted-foreground mb-1">
                                          {dateObj.toLocaleDateString("es-AR", {
                                             day: "2-digit",
                                             month: "short",
                                             year: "numeric",
                                          })}
                                       </p>
                                    )}
                                    <p className="text-xs text-foreground leading-relaxed">{obs.text}</p>
                                 </div>
                              </div>
                           );
                        })}
                        {observations.length === 0 && (
                           <p className="text-xs text-muted-foreground">Sin observaciones registradas.</p>
                        )}
                     </div>
                  </CardContent>
               </Card>
            </div>
         </div>
      </div>
   );
}
