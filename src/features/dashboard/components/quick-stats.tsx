import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSubjectsByInstitution } from "@/lib/edu-repository";
import {
   addDays,
   getThresholdsForInstitution,
   getTodayStr,
   resolveSemaphoreLevel,
   semaphoreScore,
   type SemaphoreLevel,
} from "@/features/dashboard/utils/constants";
import {
   getAtRiskStudentsFromLiveData,
   getSuggestedDashboardTasks,
} from "@/features/dashboard/utils/dashboard-derived";
import { usePlanningContext } from "@/features/planning";
import { useDashboardContext } from "@/features/dashboard";
import { useStudentsContext } from "@/features/students";
import { useClassroomContext } from "@/features/classroom";
import { useAssessmentsContext } from "@/features/assessments";
import { useActivitiesContext } from "@/features/activities";
import { isAllInstitutionsScope, matchesInstitutionScope } from "@/features/institution";

function statusClasses(level: SemaphoreLevel) {
   if (level === "red") {
      return {
         tile: "bg-destructive/22 ring-1 ring-destructive/45",
         value: "text-destructive-foreground",
         badge: "alert-high",
      };
   }
   if (level === "yellow") {
      return {
         tile: "bg-warning/22 ring-1 ring-warning/45",
         value: "text-warning-foreground",
         badge: "alert-medium",
      };
   }
   return {
      tile: "bg-success/22 ring-1 ring-success/45",
      value: "text-success-foreground",
      badge: "status-ok",
   };
}

function levelLabel(level: SemaphoreLevel) {
   if (level === "red") return "Critico";
   if (level === "yellow") return "Atencion";
   return "Estable";
}

export function QuickStats({ activeInstitution }: { activeInstitution: string }) {
   const { classes } = usePlanningContext();
   const { tasks } = useDashboardContext();
   const { getStudentsByInstitution } = useStudentsContext();
   const { getRecord } = useClassroomContext();
   const { assessments } = useAssessmentsContext();
   const { activities } = useActivitiesContext();
   const thresholds = getThresholdsForInstitution(
      isAllInstitutionsScope(activeInstitution) ? "" : activeInstitution,
   );
   const todayStr = getTodayStr();

   const scopedSubjects = getSubjectsByInstitution(activeInstitution);
   const scopedStudents = getStudentsByInstitution(activeInstitution);
   const scopedClasses = classes.filter(
      (classSession) =>
         matchesInstitutionScope(classSession.institutionId, activeInstitution),
   );
   const scopedTasks = tasks.filter(
      (task) => matchesInstitutionScope(task.institutionId, activeInstitution),
   );

   const liveAtRiskStudents = getAtRiskStudentsFromLiveData(
      scopedStudents,
      scopedClasses,
      (classId, studentId) => getRecord(classId).attendance[studentId],
   );
   const suggestedTasks = getSuggestedDashboardTasks({
      todayStr,
      classes: scopedClasses,
      assessments: assessments.filter((assessment) =>
         scopedSubjects.some((subject) => subject.id === assessment.subjectId),
      ),
      activities: activities.filter((activity) =>
         scopedSubjects.some((subject) => subject.id === activity.subjectId),
      ),
      atRiskStudents: liveAtRiskStudents,
   });

   const atRiskCount = liveAtRiskStudents.length;
   const pendingCount =
      scopedTasks.filter((task) => !task.done).length + suggestedTasks.length;
   const unplannedCount = scopedClasses.filter(
      (cls) => cls.status === "sin-planificar",
   ).length;

   const totalStudents = scopedStudents.length;
   const atRiskPct =
      totalStudents > 0 ? Math.round((atRiskCount / totalStudents) * 100) : 0;

   const upcomingWindowEnd = addDays(todayStr, 6);

   const upcomingWindowClasses = scopedClasses.filter(
      (cls) => cls.date >= todayStr && cls.date <= upcomingWindowEnd,
   );

   const upcomingUnplanned = upcomingWindowClasses.filter(
      (cls) => cls.status === "sin-planificar",
   ).length;

   const unplannedPct =
      upcomingWindowClasses.length > 0
         ? Math.round((upcomingUnplanned / upcomingWindowClasses.length) * 100)
         : 0;

   const atRiskLevel = resolveSemaphoreLevel(
      atRiskPct,
      thresholds.atRiskPctWarning,
      thresholds.atRiskPctCritical,
   );
   const pendingLevel = resolveSemaphoreLevel(
      pendingCount,
      thresholds.pendingWarning,
      thresholds.pendingCritical,
   );
   const unplannedLevel = resolveSemaphoreLevel(
      unplannedPct,
      thresholds.unplannedPctWarning,
      thresholds.unplannedPctCritical,
   );

   const healthScore = Math.round(
      semaphoreScore(atRiskLevel) * 0.4 +
         semaphoreScore(pendingLevel) * 0.3 +
         semaphoreScore(unplannedLevel) * 0.3,
   );
   const globalLevel: SemaphoreLevel =
      healthScore >= 85 ? "green" : healthScore >= 60 ? "yellow" : "red";

   const metrics = [
      {
         key: "risk",
         label: "En riesgo",
         value: atRiskCount,
         level: atRiskLevel,
         detail: `${atRiskPct}% de ${totalStudents} alumnos`,
         summary: "Controla asistencia y rendimiento de alumnos con alerta.",
         actionTo: "/seguimiento?status=en-riesgo",
         actionLabel: "Ver alumnos",
      },
      {
         key: "pending",
         label: "Pendientes",
         value: pendingCount,
         level: pendingLevel,
         detail: `${scopedTasks.filter((task) => !task.done).length} manuales + ${suggestedTasks.length} sugeridas`,
         summary: "Prioriza tareas operativas para hoy y proximos dias.",
         actionTo: "/#pending-tasks",
         actionLabel: "Ir a tareas",
      },
      {
         key: "unplanned",
         label: "Sin plan",
         value: unplannedCount,
         level: unplannedLevel,
         detail: `${unplannedPct}% en los proximos 7 dias`,
         summary: "Reduce clases sin planificar en la semana activa.",
         actionTo: "/planificacion?status=sin-planificar",
         actionLabel: "Planificar",
      },
   ] as const;

   const topAtRiskStudents = liveAtRiskStudents.slice(0, 4);

   return (
      <div>
         <Card className="app-panel">
            <CardContent className="p-4 space-y-3">
               <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                     Semaforo operativo
                  </p>
                  <Badge
                     variant="outline"
                     className={`${statusClasses(globalLevel).badge} max-w-full border-0 text-[10px]`}
                  >
                     Salud {healthScore}/100 - {levelLabel(globalLevel)}
                  </Badge>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {metrics.map((metric) => {
                     const colors = statusClasses(metric.level);
                     return (
                        <div key={metric.key} className={`rounded-lg px-2 py-2 ${colors.tile}`}>
                           <div className="flex items-start justify-between gap-2">
                              <div>
                                 <p className={`text-xl font-bold ${colors.value}`}>
                                    {metric.value}
                                 </p>
                                 <p className="text-[10px] text-muted-foreground">
                                    {metric.label}
                                 </p>
                              </div>
                              <Badge variant="outline" className={`${colors.badge} max-w-full border-0 text-[9px]`}>
                                 {levelLabel(metric.level)}
                              </Badge>
                           </div>
                           <p className="mt-1 break-words text-[10px] text-muted-foreground">
                              {metric.detail}
                           </p>
                           <p className="break-words text-[10px] text-muted-foreground/80">
                              {metric.summary}
                           </p>
                           <Button
                              asChild
                              variant="link"
                              className="h-auto p-0 mt-1 text-[10px]"
                           >
                              <Link to={metric.actionTo}>{metric.actionLabel}</Link>
                           </Button>
                        </div>
                     );
                  })}
               </div>

               <div className="rounded-md border border-border/60 bg-background px-2.5 py-2">
                  <div className="flex items-center justify-between gap-2">
                     <p className="text-[10px] font-medium text-foreground">
                        Seguimiento de riesgo
                     </p>
                     <Button
                        asChild
                        variant="link"
                        className="h-auto p-0 text-[10px]"
                     >
                        <Link to="/seguimiento?status=en-riesgo">Abrir seguimiento</Link>
                     </Button>
                  </div>
                  {topAtRiskStudents.length === 0 ? (
                     <p className="mt-1 text-[10px] text-muted-foreground">
                        Sin alumnos en riesgo en el alcance seleccionado.
                     </p>
                  ) : (
                     <div className="mt-1.5 space-y-1">
                        {topAtRiskStudents.map((student) => (
                           <div
                              key={student.id}
                              className="flex items-center justify-between gap-2 rounded-sm bg-muted/30 px-1.5 py-1"
                           >
                              <p className="text-[10px] text-foreground truncate">
                                 {student.lastName}, {student.name}
                              </p>
                                 <Badge variant="outline" className="max-w-[45%] border-0 bg-destructive/15 text-destructive text-[9px]">
                                    {student.average < 6 ? `Prom. ${student.average}` : "Asistencia baja"}
                                 </Badge>
                           </div>
                        ))}
                     </div>
                  )}
               </div>

            </CardContent>
         </Card>
      </div>
   );
}



