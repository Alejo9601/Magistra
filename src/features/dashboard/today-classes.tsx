import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
   AlertTriangle,
   CalendarCheck2,
   ClipboardCheck,
   PlayCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useActivitiesContext } from "@/features/activities";
import { useAssessmentsContext } from "@/features/assessments";
import { useClassroomContext } from "@/features/classroom";
import { ClassStatusBadge } from "@/features/dashboard/class-status-badge";
import { getThresholdsForInstitution, getTodayStr } from "@/features/dashboard/constants";
import { usePlanningContext } from "@/features/planning";
import { useStudentsContext } from "@/features/students";
import {
   getAssignmentById,
   getAssignmentIdBySubjectId,
   getInstitutionById,
   getSubjectsByInstitution,
   getSubjectById,
} from "@/lib/edu-repository";

type TodayAlert = {
   id: string;
   text: string;
   severity: "high" | "medium";
   priority: number;
   actionTo?: string;
   actionLabel?: string;
};

function classDateTimeMs(date: string, time: string) {
   return new Date(`${date}T${time}:00`).getTime();
}

function formatCountdown(targetMs: number, nowMs: number) {
   const diff = targetMs - nowMs;
   if (diff <= 0) {
      return "En curso o pendiente de cierre";
   }
   const totalMinutes = Math.round(diff / (1000 * 60));
   if (totalMinutes < 60) {
      return `Empieza en ${totalMinutes} min`;
   }
   const hours = Math.floor(totalMinutes / 60);
   const minutes = totalMinutes % 60;
   return minutes > 0
      ? `Empieza en ${hours} h ${minutes} min`
      : `Empieza en ${hours} h`;
}

function formatAgendaState(classDateMs: number, nowMs: number, status: string) {
   if (status === "finalizada") {
      return "Finalizada";
   }
   if (classDateMs <= nowMs) {
      return "En curso";
   }
   return "Pendiente";
}

function computeAttendancePct(statuses: Array<"P" | "A" | "T" | "J">) {
   if (statuses.length === 0) {
      return null;
   }
   const attendedWeight = statuses.reduce((sum, status) => {
      if (status === "P" || status === "J") return sum + 1;
      if (status === "T") return sum + 0.5;
      return sum;
   }, 0);
   return Math.round((attendedWeight / statuses.length) * 100);
}

export function TodayClasses({ activeInstitution }: { activeInstitution: string }) {
   const { classes } = usePlanningContext();
   const { getStudentsByAssignment } = useStudentsContext();
   const { getRecord } = useClassroomContext();
   const { assessments } = useAssessmentsContext();
   const { activities } = useActivitiesContext();
   const todayStr = getTodayStr();
   const tomorrowDate = new Date(`${todayStr}T12:00:00`);
   tomorrowDate.setDate(tomorrowDate.getDate() + 1);
   const tomorrowStr = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth() + 1).padStart(2, "0")}-${String(tomorrowDate.getDate()).padStart(2, "0")}`;
   const nowMs = Date.now();
   const thresholds = getThresholdsForInstitution(activeInstitution);

   const todayClasses = useMemo(
      () =>
         classes
            .filter(
               (classSession) =>
                  classSession.date === todayStr &&
                  classSession.institutionId === activeInstitution,
            )
            .sort((a, b) => a.time.localeCompare(b.time)),
      [activeInstitution, classes, todayStr],
   );
   const scopedClasses = useMemo(
      () =>
         classes
            .filter((classSession) => classSession.institutionId === activeInstitution)
            .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)),
      [activeInstitution, classes],
   );
   const totalSubjects = getSubjectsByInstitution(activeInstitution).length;

   const nextTodayClass = todayClasses.find(
      (classSession) =>
         classSession.status !== "finalizada" &&
         classDateTimeMs(classSession.date, classSession.time) >= nowMs,
   );
   const nextUpcomingClass = scopedClasses.find(
      (classSession) =>
         classSession.status !== "finalizada" &&
         classDateTimeMs(classSession.date, classSession.time) >= nowMs,
   );
   const classCardTarget = nextTodayClass ?? nextUpcomingClass;

   const alerts: TodayAlert[] = [];
   todayClasses.forEach((classSession) => {
      const classDateMs = classDateTimeMs(classSession.date, classSession.time);
      const subjectName = getSubjectById(classSession.subjectId)?.name ?? "Clase";
      const assignmentId =
         classSession.assignmentId ??
         getAssignmentIdBySubjectId(classSession.subjectId);
      const students = getStudentsByAssignment(assignmentId);
      const record = getRecord(classSession.id);
      const attendanceValues = students
         .map((student) => record.attendance[student.id])
         .filter((status): status is "P" | "A" | "T" | "J" => Boolean(status));
      const hasAttendance = attendanceValues.length > 0;

      if (classSession.status === "sin-planificar") {
         const hoursToClass = Math.max(
            0,
            Math.floor((classDateMs - nowMs) / (1000 * 60 * 60)),
         );
         const severity: TodayAlert["severity"] =
            hoursToClass <= thresholds.unplannedClassCriticalHours
               ? "high"
               : "medium";
         alerts.push({
            id: `plan-${classSession.id}`,
            text: `${classSession.time} - ${subjectName} sin planificar (${hoursToClass}h para iniciar)`,
            severity,
            priority: hoursToClass,
            actionTo: "/planificacion?status=sin-planificar",
            actionLabel: "Planificar",
         });
      }
      if (classDateMs <= nowMs && classSession.status !== "finalizada") {
         const minutesSinceStart = Math.floor((nowMs - classDateMs) / (1000 * 60));
         const severity: TodayAlert["severity"] = minutesSinceStart >= 60 ? "high" : "medium";
         alerts.push({
            id: `close-${classSession.id}`,
            text: `${classSession.time} - ${subjectName} abierta sin cierre (${minutesSinceStart} min)`,
            severity,
            priority: Math.max(0, 120 - minutesSinceStart),
            actionTo: `/clase/${classSession.id}/dictado`,
            actionLabel: "Cerrar clase",
         });
      }
      if (classSession.status === "finalizada" && !hasAttendance && students.length > 0) {
         alerts.push({
            id: `att-${classSession.id}`,
            text: `${classSession.time} - ${subjectName} finalizada sin asistencia registrada`,
            severity: "high",
            priority: 10,
            actionTo: `/clase/${classSession.id}/dictado`,
            actionLabel: "Tomar asistencia",
         });
      }
      if (classSession.status === "finalizada" && hasAttendance) {
         const attendancePct = computeAttendancePct(attendanceValues);
         if (attendancePct !== null && attendancePct < 65) {
            alerts.push({
               id: `low-att-${classSession.id}`,
               text: `${classSession.time} - ${subjectName} con asistencia baja (${attendancePct}%)`,
               severity: "high",
               priority: 20,
               actionTo: "/seguimiento?status=en-riesgo",
               actionLabel: "Ver alumnos",
            });
         }
      }
   });

   scopedClasses
      .filter(
         (classSession) =>
            classSession.status === "sin-planificar" &&
            classSession.date > todayStr &&
            classSession.date <= tomorrowStr,
      )
      .forEach((classSession) => {
         const classDateMs = classDateTimeMs(classSession.date, classSession.time);
         const hoursToClass = Math.max(
            0,
            Math.floor((classDateMs - nowMs) / (1000 * 60 * 60)),
         );
         const severity: TodayAlert["severity"] =
            hoursToClass <= thresholds.unplannedClassCriticalHours
               ? "high"
               : "medium";
         const subjectName = getSubjectById(classSession.subjectId)?.name ?? "Clase";
         alerts.push({
            id: `upcoming-plan-${classSession.id}`,
            text: `${classSession.date} ${classSession.time} - ${subjectName} sin planificar`,
            severity,
            priority: hoursToClass,
            actionTo: "/planificacion?status=sin-planificar",
            actionLabel: "Planificar",
         });
      });

   const scopedAssessments = assessments
      .filter((assessment) => {
         const assignment = assessment.assignmentId
            ? getAssignmentById(assessment.assignmentId)
            : null;
         return (
            assessment.date >= todayStr &&
            assessment.date <= tomorrowStr &&
            (assessment.status === "draft" || assessment.status === "scheduled") &&
            (assignment?.institutionId ?? activeInstitution) === activeInstitution
         );
      })
      .sort((a, b) => a.date.localeCompare(b.date));

   scopedAssessments.forEach((assessment) => {
      alerts.push({
         id: `assessment-${assessment.id}`,
         text: `${assessment.date === todayStr ? "Hoy" : "Manana"} - revisar evaluacion: ${assessment.title}`,
         severity: assessment.date === todayStr ? "high" : "medium",
         priority: assessment.date === todayStr ? 12 : 36,
      });
   });

   const scopedActivities = activities.filter((activity) => {
      if (activity.status === "completed") {
         return false;
      }
      return todayClasses.some((classSession) =>
         activity.linkedClassIds.includes(classSession.id),
      );
   });
   if (scopedActivities.length > 0) {
      alerts.push({
         id: "activities-today",
         text: `${scopedActivities.length} actividad(es) vinculadas para clases de hoy`,
         severity: "medium",
         priority: 60,
      });
   }
   const sortedAlerts = [...alerts].sort((a, b) => {
      if (a.severity !== b.severity) {
         return a.severity === "high" ? -1 : 1;
      }
      return a.priority - b.priority;
   });
   const criticalAlerts = sortedAlerts.filter((alert) => alert.severity === "high");
   const displayedUrgentAlerts =
      criticalAlerts.length > 0 ? criticalAlerts.slice(0, 4) : sortedAlerts.slice(0, 2);

   return (
      <div>
         <h2 className="text-sm font-semibold text-foreground mb-3">
            Centro operativo de hoy
         </h2>
         <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
            <Card className="xl:col-span-2 py-0 overflow-hidden">
               <div className="h-1 bg-primary/70" />
               <CardContent className="p-4">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                     {nextTodayClass ? "Proxima clase de hoy" : "Proxima clase"}
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
                              <Badge className="bg-muted text-muted-foreground border-0 text-[10px]">
                                 {totalSubjects} materias activas
                              </Badge>
                              <Badge className="bg-muted text-muted-foreground border-0 text-[10px]">
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
                                       {classCardTarget.subtopics
                                          .slice(0, 3)
                                          .map((subtopic) => (
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
                                 {classCardTarget.resources &&
                                    classCardTarget.resources.length > 0 && (
                                       <div className="mt-2">
                                          <Badge className="bg-primary/10 text-primary border-0 text-[10px]">
                                             {classCardTarget.resources.length} recurso
                                             {classCardTarget.resources.length > 1
                                                ? "s"
                                                : ""}
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

            <Card>
               <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                     <AlertTriangle className="size-4 text-warning-foreground" />
                     Alertas criticas
                  </CardTitle>
               </CardHeader>
               <CardContent className="pt-0">
                  {displayedUrgentAlerts.length === 0 ? (
                     <p className="text-xs text-muted-foreground">
                        Sin alertas criticas por ahora.
                     </p>
                  ) : (
                     <div className="max-h-[205px] overflow-y-auto pr-1 space-y-2">
                        {displayedUrgentAlerts.map((alert) => (
                           <div key={alert.id} className="rounded-md border border-border/70 p-2">
                              <p className="text-xs text-foreground">{alert.text}</p>
                              <div className="mt-1 flex items-center justify-between gap-2">
                                 <Badge
                                    className={`border-0 text-[10px] ${
                                       alert.severity === "high"
                                          ? "bg-destructive/15 text-destructive"
                                          : "bg-warning/15 text-warning-foreground"
                                    }`}
                                 >
                                  {alert.severity === "high" ? "Alta" : "Media"}
                                 </Badge>
                                 {alert.actionTo && alert.actionLabel && (
                                    <Button asChild variant="link" className="h-auto p-0 text-[11px]">
                                       <Link to={alert.actionTo}>{alert.actionLabel}</Link>
                                    </Button>
                                 )}
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </CardContent>
            </Card>
         </div>

         <Card className="mt-3">
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
                              (status): status is "P" | "A" | "T" | "J" =>
                                 Boolean(status),
                           );
                        const attendancePct = computeAttendancePct(attendanceStatuses);
                        const classState = formatAgendaState(
                           classDateTimeMs(cls.date, cls.time),
                           nowMs,
                           cls.status,
                        );
                        const planned = cls.status !== "sin-planificar";
                        const attendanceLoaded = attendanceStatuses.length > 0;
                        const closed = cls.status === "finalizada";

                        return (
                           <div
                              key={cls.id}
                              className="rounded-lg border border-border/70 p-3"
                           >
                              <div className="flex items-start justify-between gap-2">
                                 <div>
                                    <p className="text-sm font-semibold text-foreground">
                                       {subject?.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                       {inst?.name} - {cls.time} hs
                                    </p>
                                 </div>
                                 <div className="flex flex-col items-end gap-1">
                                    <ClassStatusBadge status={cls.status} />
                                    <Badge variant="secondary" className="text-[10px]">
                                       {classState}
                                    </Badge>
                                 </div>
                              </div>

                              <div className="mt-2 flex flex-wrap gap-1.5">
                                 <Badge variant="secondary" className="text-[10px]">
                                    {planned ? "Planificada" : "Sin planificar"}
                                 </Badge>
                                 <Badge variant="secondary" className="text-[10px]">
                                    {attendanceLoaded ? "Asistencia cargada" : "Sin asistencia"}
                                 </Badge>
                                 <Badge variant="secondary" className="text-[10px]">
                                    {closed ? "Clase cerrada" : "Clase abierta"}
                                 </Badge>
                                 {attendancePct !== null && (
                                    <Badge
                                       className={`border-0 text-[10px] ${
                                          attendancePct >= 80
                                             ? "bg-success/15 text-success"
                                             : attendancePct >= 65
                                               ? "bg-warning/15 text-warning-foreground"
                                               : "bg-destructive/15 text-destructive"
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
                                    <Link to={`/clase/${cls.id}`}>
                                       Ver detalle
                                    </Link>
                                 </Button>
                                 <Button asChild variant="ghost" size="sm" className="h-7 text-[11px]">
                                    <Link to="/seguimiento?status=en-riesgo">
                                       Seguimiento
                                    </Link>
                                 </Button>
                              </div>
                           </div>
                        );
                     })}
                  </div>
               )}
            </CardContent>
         </Card>
      </div>
   );
}
