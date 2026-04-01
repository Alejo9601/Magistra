import type { ClassroomRecord, Student, SubjectActivity } from "@/types";
import type { AttendanceStatus } from "@/features/classroom/types";

export type LinkedActivitiesSummary = {
   total: number;
   evaluables: number;
   completed: number;
   pending: number;
};

export type CloseAnalysis = {
   hasChanges: boolean;
   hasInitialSubtopicState: boolean;
   missingSubtopics: string[];
   coveredSubtopics: string[];
   addedActivities: string[];
   removedActivities: string[];
};

export function buildAttendanceWithDefaults(
   classStudents: Student[],
   attendance: ClassroomRecord["attendance"],
): Record<string, AttendanceStatus> {
   return Object.fromEntries(
      classStudents.map((student) => [
         student.id,
         attendance[student.id] ?? ("P" as AttendanceStatus),
      ]),
   );
}

export function buildLinkedActivitiesSummary(
   linkedActivities: SubjectActivity[],
): LinkedActivitiesSummary {
   const total = linkedActivities.length;
   const evaluables = linkedActivities.filter((activity) => activity.esEvaluable).length;
   const completed = linkedActivities.filter((activity) => activity.status === "completed").length;

   return {
      total,
      evaluables,
      completed,
      pending: total - completed,
   };
}

export function filterUnlinkedActivitiesByTitle(
   subjectActivities: SubjectActivity[],
   classId: string,
   query: string,
): SubjectActivity[] {
   const unlinked = subjectActivities.filter(
      (activity) => !activity.linkedClassIds.includes(classId),
   );
   const normalizedQuery = query.trim().toLowerCase();

   if (!normalizedQuery) {
      return unlinked.sort((a, b) => a.title.localeCompare(b.title));
   }

   return unlinked
      .filter((activity) => activity.title.toLowerCase().includes(normalizedQuery))
      .sort((a, b) => a.title.localeCompare(b.title));
}

export function analyzeClassClosure({
   subtopics,
   completedSubtopics,
   linkedActivities,
   subjectActivities,
   baselineLinkedActivityIds,
   notes,
   completedActivitiesCount,
   performanceEntriesCount,
}: {
   subtopics: string[];
   completedSubtopics: string[];
   linkedActivities: SubjectActivity[];
   subjectActivities: SubjectActivity[];
   baselineLinkedActivityIds: string[];
   notes?: string;
   completedActivitiesCount: number;
   performanceEntriesCount: number;
}): CloseAnalysis {
   const plannedSubtopics = subtopics.map((item) => item.trim()).filter(Boolean);
   const plannedSubtopicsSet = new Set(plannedSubtopics);

   const missingSubtopics = plannedSubtopics.filter(
      (subtopic) => !completedSubtopics.includes(subtopic),
   );
   const hasUnplannedCompletedSubtopics = completedSubtopics.some(
      (subtopic) => !plannedSubtopicsSet.has(subtopic),
   );
   const hasInitialSubtopicState = completedSubtopics.length === 0 && !hasUnplannedCompletedSubtopics;
   const subtopicsModified =
      hasUnplannedCompletedSubtopics ||
      (completedSubtopics.length > 0 && missingSubtopics.length > 0);

   const currentLinkedIds = linkedActivities.map((activity) => activity.id);
   const baselineSet = new Set(baselineLinkedActivityIds);
   const currentSet = new Set(currentLinkedIds);

   const addedActivities = linkedActivities
      .filter((activity) => !baselineSet.has(activity.id))
      .map((activity) => activity.title);
   const removedActivities = subjectActivities
      .filter((activity) => baselineSet.has(activity.id) && !currentSet.has(activity.id))
      .map((activity) => activity.title);
   const activitiesModified = addedActivities.length > 0 || removedActivities.length > 0;

   const hasManualChanges =
      (notes?.trim().length ?? 0) > 0 ||
      completedActivitiesCount > 0 ||
      performanceEntriesCount > 0;

   return {
      hasChanges: subtopicsModified || activitiesModified || hasManualChanges,
      hasInitialSubtopicState,
      missingSubtopics,
      coveredSubtopics: plannedSubtopics.filter((subtopic) => !missingSubtopics.includes(subtopic)),
      addedActivities,
      removedActivities,
   };
}
