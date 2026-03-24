import type { TodayAlert } from "@/features/dashboard/components/today-classes-alerts-card";
import { getAssignmentById, getAssignmentIdBySubjectId, getSubjectById } from "@/lib/edu-repository";
import type { Assessment, SubjectActivity } from "@/types";
import { isAllInstitutionsScope } from "@/features/institution";

type AttendanceStatus = "P" | "A" | "T" | "J";

type ClassSessionLike = {
   id: string;
   subjectId: string;
   assignmentId?: string;
   institutionId: string;
   date: string;
   time: string;
   status: "planificada" | "sin_planificar" | "dictada";
};

type ThresholdsLike = {
   unplannedClassCriticalHours: number;
};

function classDateTimeMs(date: string, time: string) {
   return new Date(`${date}T${time}:00`).getTime();
}

function computeAttendancePct(statuses: AttendanceStatus[]) {
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

export function buildTodayDisplayedAlerts({
   todayClasses,
   scopedClasses,
   nowMs,
   todayStr,
   tomorrowStr,
   thresholds,
   assessments,
   activities,
   activeInstitution,
   getStudentsByAssignment,
   getRecord,
}: {
   todayClasses: ClassSessionLike[];
   scopedClasses: ClassSessionLike[];
   nowMs: number;
   todayStr: string;
   tomorrowStr: string;
   thresholds: ThresholdsLike;
   assessments: Assessment[];
   activities: SubjectActivity[];
   activeInstitution: string;
   getStudentsByAssignment: (assignmentId: string) => Array<{ id: string }>;
   getRecord: (classId: string) => {
      attendance: Record<string, AttendanceStatus | undefined>;
   };
}) {
   const alerts: TodayAlert[] = [];

   todayClasses.forEach((classSession) => {
      const classDateMs = classDateTimeMs(classSession.date, classSession.time);
      const subjectName = getSubjectById(classSession.subjectId)?.name ?? "Clase";
      const assignmentId =
         classSession.assignmentId ?? getAssignmentIdBySubjectId(classSession.subjectId);
      const students = getStudentsByAssignment(assignmentId);
      const record = getRecord(classSession.id);
      const attendanceValues = students
         .map((student) => record.attendance[student.id])
         .filter((status): status is AttendanceStatus => Boolean(status));
      const hasAttendance = attendanceValues.length > 0;

      if (classSession.status === "sin_planificar") {
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
            actionTo: "/planificacion?status=sin_planificar",
            actionLabel: "Planificar",
         });
      }

      if (classDateMs <= nowMs && classSession.status !== "dictada") {
         const minutesSinceStart = Math.floor((nowMs - classDateMs) / (1000 * 60));
         const severity: TodayAlert["severity"] =
            minutesSinceStart >= 60 ? "high" : "medium";
         alerts.push({
            id: `close-${classSession.id}`,
            text: `${classSession.time} - ${subjectName} abierta sin cierre (${minutesSinceStart} min)`,
            severity,
            priority: Math.max(0, 120 - minutesSinceStart),
            actionTo: `/clase/${classSession.id}/dictado`,
            actionLabel: "Cerrar clase",
         });
      }

      if (classSession.status === "dictada" && !hasAttendance && students.length > 0) {
         alerts.push({
            id: `att-${classSession.id}`,
            text: `${classSession.time} - ${subjectName} dictada sin asistencia registrada`,
            severity: "high",
            priority: 10,
            actionTo: `/clase/${classSession.id}/dictado`,
            actionLabel: "Tomar asistencia",
         });
      }

      if (classSession.status === "dictada" && hasAttendance) {
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
            classSession.status === "sin_planificar" &&
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
            actionTo: "/planificacion?status=sin_planificar",
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
            isAllInstitutionsScope(activeInstitution) ||
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

   return criticalAlerts.length > 0
      ? criticalAlerts.slice(0, 4)
      : sortedAlerts.slice(0, 2);
}




