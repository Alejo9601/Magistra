import { useMemo } from "react";
import { TodayClassesAlertsCard } from "@/features/dashboard/components/today-classes-alerts-card";
import { buildTodayDisplayedAlerts } from "@/features/dashboard/utils/today-classes-alerts";
import { TodayClassesAgendaCard } from "@/features/dashboard/components/today-classes-agenda-card";
import { TodayClassesNextCard } from "@/features/dashboard/components/today-classes-next-card";

import { classDateTimeMs } from "@/features/dashboard/utils/today-classes-utils";
import { useActivitiesContext } from "@/features/activities";
import { useAssessmentsContext } from "@/features/assessments";
import { useClassroomContext } from "@/features/classroom";
import { getThresholdsForInstitution } from "@/features/dashboard/utils/constants";
import { useDashboardDateRange } from "@/features/dashboard/hooks";
import { usePlanningContext } from "@/features/planning";
import { useStudentsContext } from "@/features/students";
import { matchesInstitutionScope } from "@/features/institution";
import { getSubjectsByInstitution } from "@/lib/edu-repository";

const NEAR_START_WINDOW_MS = 60 * 60 * 1000;

export function TodayClasses({ activeInstitution }: { activeInstitution: string }) {
   const { classes } = usePlanningContext();
   const { getStudentsByAssignment } = useStudentsContext();
   const { getRecord } = useClassroomContext();
   const { assessments } = useAssessmentsContext();
   const { activities } = useActivitiesContext();
   const { todayStr, tomorrowStr } = useDashboardDateRange();
   const nowMs = Date.now();
   const thresholds = getThresholdsForInstitution(activeInstitution);

   const todayClasses = useMemo(
      () =>
         classes
            .filter(
               (classSession) =>
                  classSession.date === todayStr &&
                  matchesInstitutionScope(classSession.institutionId, activeInstitution),
            )
            .sort((a, b) => a.time.localeCompare(b.time)),
      [activeInstitution, classes, todayStr],
   );
   const scopedClasses = useMemo(
      () =>
         classes
            .filter((classSession) =>
               matchesInstitutionScope(classSession.institutionId, activeInstitution),
            )
            .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)),
      [activeInstitution, classes],
   );
   const totalSubjects = getSubjectsByInstitution(activeInstitution).length;

   const overdueTodayClass = todayClasses.find(
      (classSession) =>
         classSession.status !== "finalizada" &&
         classDateTimeMs(classSession.date, classSession.time) < nowMs,
   );
   const upcomingTodayClass = todayClasses.find(
      (classSession) =>
         classSession.status !== "finalizada" &&
         classDateTimeMs(classSession.date, classSession.time) >= nowMs,
   );

   const prioritizeUpcomingToday =
      Boolean(overdueTodayClass) &&
      Boolean(upcomingTodayClass) &&
      classDateTimeMs(upcomingTodayClass!.date, upcomingTodayClass!.time) - nowMs <=
         NEAR_START_WINDOW_MS;

   const nextTodayClass = prioritizeUpcomingToday
      ? upcomingTodayClass
      : overdueTodayClass ?? upcomingTodayClass;

   const nextUpcomingClass = scopedClasses.find(
      (classSession) =>
         classSession.status !== "finalizada" &&
         classDateTimeMs(classSession.date, classSession.time) >= nowMs,
   );
   const classCardTarget = nextTodayClass ?? nextUpcomingClass;
   const displayedUrgentAlerts = buildTodayDisplayedAlerts({
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
   });

   return (
      <div>
         <h2 className="text-sm font-semibold text-foreground mb-3">
            Centro operativo de hoy
         </h2>
         <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
            <TodayClassesNextCard
               classCardTarget={classCardTarget}
               isNextToday={Boolean(nextTodayClass)}
               totalSubjects={totalSubjects}
               nowMs={nowMs}
            />

            <TodayClassesAlertsCard alerts={displayedUrgentAlerts} />
         </div>

         <TodayClassesAgendaCard
            todayClasses={todayClasses}
            nowMs={nowMs}
            getStudentsByAssignment={getStudentsByAssignment}
            getRecord={getRecord}
         />
      </div>
   );
}




