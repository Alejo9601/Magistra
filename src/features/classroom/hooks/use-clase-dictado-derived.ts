import { useMemo } from "react";
import type { ClassSession, ClassroomRecord, Student, SubjectActivity } from "@/types";
import {
   analyzeClassClosure,
   buildAttendanceWithDefaults,
   buildLinkedActivitiesSummary,
   filterUnlinkedActivitiesByTitle,
} from "@/features/classroom/utils/clase-dictado-utils";

export function useClaseDictadoDerived({
   cls,
   classStudents,
   subjectActivities,
   record,
   linkSearch,
   baselineLinkedActivityIds,
   performanceEntriesLength,
}: {
   cls: ClassSession;
   classStudents: Student[];
   subjectActivities: SubjectActivity[];
   record: ClassroomRecord;
   linkSearch: string;
   baselineLinkedActivityIds: string[];
   performanceEntriesLength: number;
}) {
   const linkedActivities = useMemo(
      () =>
         [...subjectActivities]
            .filter((activity) => activity.linkedClassIds.includes(cls.id))
            .sort((a, b) => a.title.localeCompare(b.title)),
      [cls.id, subjectActivities],
   );

   const linkedActivitiesSummary = useMemo(() => {
      return buildLinkedActivitiesSummary(linkedActivities);
   }, [linkedActivities]);

   const filteredUnlinkedActivities = useMemo(() => {
      return filterUnlinkedActivitiesByTitle(subjectActivities, cls.id, linkSearch);
   }, [cls.id, linkSearch, subjectActivities]);

   const attendanceWithDefaults = useMemo(() => {
      return buildAttendanceWithDefaults(classStudents, record.attendance);
   }, [classStudents, record.attendance]);

   const isFinalized = cls.status === "dictada";
   const showGradesSection =
      cls.type === "evaluacion" || cls.type === "practica" || cls.type === "teorico-practica";

   const classDateLabel = useMemo(() => {
      return new Date(`${cls.date}T12:00:00`).toLocaleDateString("es-AR", {
         weekday: "short",
         day: "2-digit",
         month: "short",
      });
   }, [cls.date]);

   const closeAnalysis = useMemo(() => {
      return analyzeClassClosure({
         subtopics: cls.subtopics,
         completedSubtopics: record.completedSubtopics,
         linkedActivities,
         subjectActivities,
         baselineLinkedActivityIds,
         notes: record.notes,
         completedActivitiesCount: record.completedActivities.length,
         performanceEntriesCount: performanceEntriesLength,
      });
   }, [
      baselineLinkedActivityIds,
      cls.subtopics,
      linkedActivities,
      performanceEntriesLength,
      record.completedActivities.length,
      record.completedSubtopics,
      record.notes,
      subjectActivities,
   ]);

   return {
      linkedActivities,
      linkedActivitiesSummary,
      filteredUnlinkedActivities,
      attendanceWithDefaults,
      isFinalized,
      showGradesSection,
      classDateLabel,
      closeAnalysis,
   };
}
