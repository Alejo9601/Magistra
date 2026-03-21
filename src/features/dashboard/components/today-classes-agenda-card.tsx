import { Link } from "react-router-dom";
import { CalendarCheck2, ClipboardCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClassStatusBadge } from "@/features/dashboard/components/class-status-badge";
import {
   classDateTimeMs,
   computeAttendancePct,
   formatAgendaState,
} from "@/features/dashboard/utils/today-classes-utils";
import {
   getAssignmentIdBySubjectId,
   getInstitutionById,
   getSubjectById,
} from "@/lib/edu-repository";
import type { ClassSession } from "@/types";

type AttendanceStatus = "P" | "A" | "T" | "J";

type StudentLike = { id: string };

type ClassRecordLike = {
   attendance: Record<string, AttendanceStatus | undefined>;
};

export function TodayClassesAgendaCard({
   todayClasses,
   nowMs,
   getStudentsByAssignment,
   getRecord,
}: {
   todayClasses: ClassSession[];
   nowMs: number;
   getStudentsByAssignment: (assignmentId: string) => StudentLike[];
   getRecord: (classId: string) => ClassRecordLike;
}) {
   return (
      <Card className="app-panel mt-3">
         <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
               <CalendarCheck2 className="size-4 text-primary" />
               Agenda de hoy
            </CardTitle>
         </CardHeader>
         <CardContent className="pt-0">
            {todayClasses.length === 0 ? (
               <p className="text-xs text-muted-foreground">
                  No hay clases cargadas para hoy.
               </p>
            ) : (
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                  {todayClasses.map((cls) => {
                     const subject = getSubjectById(cls.subjectId);
                     const inst = getInstitutionById(cls.institutionId);
                     const assignmentId =
                        cls.assignmentId ?? getAssignmentIdBySubjectId(cls.subjectId);
                     const students = getStudentsByAssignment(assignmentId);
                     const record = getRecord(cls.id);
                     const attendanceStatuses = students
                        .map((student) => record.attendance[student.id])
                        .filter(
                           (status): status is AttendanceStatus => Boolean(status),
                        );
                     const attendancePct = computeAttendancePct(attendanceStatuses);
                     const classState = formatAgendaState(
                        classDateTimeMs(cls.date, cls.time),
                        nowMs,
                        cls.status,
                     );
                     const attendanceLoaded = attendanceStatuses.length > 0;

                     return (
                        <div key={cls.id} className="rounded-lg border border-border/70 p-3">
                           <div className="flex items-start justify-between gap-2">
                              <div>
                                 <p className="text-sm font-semibold text-foreground break-words">
                                    {subject?.name}
                                 </p>
                                 <p className="text-xs text-muted-foreground break-words">
                                    {inst?.name} - {cls.time} hs
                                 </p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                 <ClassStatusBadge status={cls.status} />
                                 {cls.status !== "finalizada" && (
                                    <Badge variant="secondary" className="text-[10px]">
                                       {classState}
                                    </Badge>
                                 )}
                              </div>
                           </div>

                           <div className="mt-2 flex flex-wrap gap-1.5">
                              <Badge variant="secondary" className="text-[10px]">
                                 {attendanceLoaded ? "Asistencia cargada" : "Sin asistencia"}
                              </Badge>
                              {attendancePct !== null && (
                                 <Badge
                                    variant="outline"
                                    className={`border-0 text-[10px] ${
                                       attendancePct >= 80
                                          ? "status-ok"
                                          : attendancePct >= 65
                                            ? "status-warning"
                                            : "status-critical"
                                    }`}
                                 >
                                    Asistencia {attendancePct}%
                                 </Badge>
                              )}
                           </div>

                           <div className="mt-3 flex flex-wrap gap-1.5">
                              <Button asChild variant="outline" size="sm" className="h-7 text-[11px]">
                                 <Link to={`/clase/${cls.id}/dictado`}>
                                    <ClipboardCheck className="size-3.5 mr-1.5" />
                                    Dictado
                                 </Link>
                              </Button>
                              <Button asChild variant="ghost" size="sm" className="h-7 text-[11px]">
                                 <Link to={`/clase/${cls.id}`}>Ver detalle</Link>
                              </Button>
                              <Button asChild variant="ghost" size="sm" className="h-7 text-[11px]">
                                 <Link to="/seguimiento?status=en-riesgo">Seguimiento</Link>
                              </Button>
                           </div>
                        </div>
                     );
                  })}
               </div>
            )}
         </CardContent>
      </Card>
   );
}

