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
} from "@/features/dashboard/constants";
import {
   getAtRiskStudentsFromLiveData,
   getSuggestedDashboardTasks,
} from "@/features/dashboard/dashboard-derived";
import { usePlanningContext } from "@/features/planning";
import { useDashboardContext } from "@/features/dashboard";
import { useStudentsContext } from "@/features/students";
import { useClassroomContext } from "@/features/classroom";
import { useAssessmentsContext } from "@/features/assessments";
import { useActivitiesContext } from "@/features/activities";

function statusClasses(level: SemaphoreLevel) {
   if (level === "red") {
      return {
         tile: "bg-destructive/10",
         value: "text-destructive",
         badge: "bg-destructive/15 text-destructive",
      };
   }
   if (level === "yellow") {
      return {
         tile: "bg-warning/10",
         value: "text-warning-foreground",
         badge: "bg-warning/20 text-warning-foreground",
      };
   }
   return {
      tile: "bg-success/10",
      value: "text-success",
      badge: "bg-success/20 text-success",
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
   const thresholds = getThresholdsForInstitution(activeInstitution);
   const todayStr = getTodayStr();

   const scopedSubjects = getSubjectsByInstitution(activeInstitution);
   const scopedStudents = getStudentsByInstitution(activeInstitution);
   const scopedClasses = classes.filter(
      (classSession) => classSession.institutionId === activeInstitution,
   );
   const scopedTasks = tasks.filter(
      (task) => task.institutionId === activeInstitution,
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
   const prevWindowStart = addDays(todayStr, -7);
   const prevWindowEnd = addDays(todayStr, -1);

   const upcomingWindowClasses = scopedClasses.filter(
      (cls) => cls.date >= todayStr && cls.date <= upcomingWindowEnd,
   );
   const prevWindowClasses = scopedClasses.filter(
      (cls) => cls.date >= prevWindowStart && cls.date <= prevWindowEnd,
   );

   const upcomingUnplanned = upcomingWindowClasses.filter(
      (cls) => cls.status === "sin-planificar",
   ).length;
   const prevUnplanned = prevWindowClasses.filter(
      (cls) => cls.status === "sin-planificar",
   ).length;

   const unplannedPct =
      upcomingWindowClasses.length > 0
         ? Math.round((upcomingUnplanned / upcomingWindowClasses.length) * 100)
         : 0;
   const prevUnplannedPct =
      prevWindowClasses.length > 0
         ? Math.round((prevUnplanned / prevWindowClasses.length) * 100)
         : 0;
   const unplannedTrend = unplannedPct - prevUnplannedPct;

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
         rule: `Rojo >= ${thresholds.atRiskPctCritical}%`,
         actionTo: "/seguimiento?status=en-riesgo",
         actionLabel: "Ver alumnos",
      },
      {
         key: "pending",
         label: "Pendientes",
         value: pendingCount,
         level: pendingLevel,
         detail: `${scopedTasks.filter((task) => !task.done).length} manuales + ${suggestedTasks.length} sugeridas`,
         rule: `Rojo > ${thresholds.pendingCritical - 1} tareas`,
         actionTo: "/#pending-tasks",
         actionLabel: "Ir a tareas",
      },
      {
         key: "unplanned",
         label: "Sin plan",
         value: unplannedCount,
         level: unplannedLevel,
         detail: `${unplannedPct}% en los proximos 7 dias`,
         rule: `Rojo >= ${thresholds.unplannedPctCritical}%`,
         actionTo: "/planificacion?status=sin-planificar",
         actionLabel: "Planificar",
      },
   ] as const;

   const alerts = metrics.filter((metric) => metric.level !== "green");

   return (
      <div>
         <Card>
            <CardContent className="p-4 space-y-3">
               <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                     Semaforo operativo
                  </p>
                  <Badge
                     className={`${statusClasses(globalLevel).badge} border-0 text-[10px]`}
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
                              <Badge className={`${colors.badge} border-0 text-[9px]`}>
                                 {levelLabel(metric.level)}
                              </Badge>
                           </div>
                           <p className="mt-1 text-[10px] text-muted-foreground">
                              {metric.detail}
                           </p>
                           <p className="text-[10px] text-muted-foreground/80">
                              {metric.rule}
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

               <div className="rounded-md border border-border/60 bg-muted/20 px-2.5 py-2">
                  <p className="text-[10px] font-medium text-foreground mb-1">
                     Alertas operativas
                  </p>
                  {alerts.length === 0 ? (
                     <p className="text-[10px] text-muted-foreground">
                        Sin alertas activas para esta institucion.
                     </p>
                  ) : (
                     <div className="space-y-1">
                        {alerts.map((alert) => (
                           <p key={alert.key} className="text-[10px] text-muted-foreground">
                              {alert.label}: {alert.rule} ({levelLabel(alert.level)})
                           </p>
                        ))}
                     </div>
                  )}
                  <p className="mt-1 text-[10px] text-muted-foreground">
                     Tendencia sin plan (7 dias): {unplannedTrend > 0 ? "+" : ""}
                     {unplannedTrend} pts vs semana anterior.
                  </p>
               </div>
            </CardContent>
         </Card>
      </div>
   );
}
