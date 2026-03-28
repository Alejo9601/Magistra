import type { ClassFormInput } from "@/features/planning/types";
import type {
   Assessment,
   AssessmentStatus,
   AssessmentType,
   ActivityStatus,
   ActivityType,
   ClassStatus,
   EvaluativeFormat,
   SubjectActivity,
} from "@/types";

const evaluativeFormatLabelMap: Record<EvaluativeFormat, string> = {
   oral: "Oral",
   escrito: "Escrito",
   "actividad-practica": "Actividad Practica",
   otro: "Otro",
   "exposicion-oral": "Oral",
   "examen-escrito": "Escrito",
   "examen-oral": "Oral",
   "trabajo-practico-evaluativo": "Actividad Practica",
};

function mapClassStatusToAssessmentStatus(status: ClassStatus): AssessmentStatus {
   if (status === "dictada") {
      return "graded";
   }
   if (status === "planificada" || status === "en_curso") {
      return "scheduled";
   }
   return "draft";
}

function mapClassStatusToActivityStatus(status: ClassStatus): ActivityStatus {
   if (status === "dictada") {
      return "completed";
   }
   if (status === "planificada" || status === "en_curso") {
      return "assigned";
   }
   return "planned";
}

type AssessmentPatchInput = {
   assignmentId?: string;
   linkedClassId?: string;
   title?: string;
   description?: string;
   date?: string;
   type?: AssessmentType;
   status?: AssessmentStatus;
   weight?: number;
   maxScore?: number;
   gradesLoaded?: number;
};

type NewAssessmentInput = {
   assignmentId: string;
   linkedClassId?: string;
   title: string;
   description?: string;
   date: string;
   type: AssessmentType;
   status?: AssessmentStatus;
   weight?: number;
   maxScore?: number;
};

type ActivityPatchInput = {
   assignmentId?: string;
   title?: string;
   description?: string;
   type?: ActivityType;
   status?: ActivityStatus;
   esEvaluable?: boolean;
   rubricaId?: string;
   fechaInicio?: string;
   fechaFin?: string;
   linkedClassIds?: string[];
};

type NewActivityInput = {
   assignmentId: string;
   title: string;
   description?: string;
   type?: ActivityType;
   status?: ActivityStatus;
   esEvaluable?: boolean;
   rubricaId?: string;
   fechaInicio?: string;
   fechaFin?: string;
   linkedClassIds?: string[];
};

type SyncClassLinkedRecordsParams = {
   payload: ClassFormInput;
   effectiveClassId: string;
   effectiveAssignmentId?: string;
   getAssessmentsByAssignment: (assignmentId: string) => Assessment[];
   addAssessment: (input: NewAssessmentInput) => unknown;
   updateAssessment: (id: string, patch: AssessmentPatchInput) => void;
   getActivitiesByAssignment: (assignmentId: string) => SubjectActivity[];
   addActivity: (input: NewActivityInput) => unknown;
   updateActivity: (id: string, patch: ActivityPatchInput) => void;
};

function syncOptionalPracticeActivity({
   payload,
   effectiveClassId,
   effectiveAssignmentId,
   getActivitiesByAssignment,
   addActivity,
   updateActivity,
}: Pick<
   SyncClassLinkedRecordsParams,
   | "payload"
   | "effectiveClassId"
   | "effectiveAssignmentId"
   | "getActivitiesByAssignment"
   | "addActivity"
   | "updateActivity"
>) {
   if (!effectiveAssignmentId) {
      return;
   }
   if (payload.type !== "practica" && payload.type !== "teorico-practica") {
      return;
   }

   const activityName = payload.practiceActivityName?.trim();
   if (!activityName) {
      return;
   }

   const existingActivity = getActivitiesByAssignment(effectiveAssignmentId).find(
      (activity) => activity.linkedClassIds.includes(effectiveClassId),
   );

   const activityType = payload.practiceActivityType ?? "practica";

   if (existingActivity) {
      updateActivity(existingActivity.id, {
         assignmentId: effectiveAssignmentId,
         title: activityName,
         description: payload.practiceActivityDescription,
         type: activityType,
         fechaInicio: payload.date,
         status: mapClassStatusToActivityStatus(payload.status),
         linkedClassIds: Array.from(
            new Set([...existingActivity.linkedClassIds, effectiveClassId]),
         ),
      });
      return;
   }

   addActivity({
      assignmentId: effectiveAssignmentId,
      title: activityName,
      description: payload.practiceActivityDescription,
      type: activityType,
      fechaInicio: payload.date,
      status: mapClassStatusToActivityStatus(payload.status),
      linkedClassIds: [effectiveClassId],
   });
}

export function syncClassLinkedRecords({
   payload,
   effectiveClassId,
   effectiveAssignmentId,
   getAssessmentsByAssignment,
   addAssessment,
   updateAssessment,
   getActivitiesByAssignment,
   addActivity,
   updateActivity,
}: SyncClassLinkedRecordsParams) {
   syncOptionalPracticeActivity({
      payload,
      effectiveClassId,
      effectiveAssignmentId,
      getActivitiesByAssignment,
      addActivity,
      updateActivity,
   });

   if (
      payload.type !== "evaluacion" ||
      !payload.evaluativeFormat ||
      !effectiveAssignmentId
   ) {
      return;
   }

   const isPracticalEvaluation =
      payload.evaluativeFormat === "actividad-practica" ||
      payload.evaluativeFormat === "trabajo-practico-evaluativo";
   const assessmentType: AssessmentType = isPracticalEvaluation
      ? "practice_work"
      : "exam";
   const assessmentBaseName = payload.evaluationName?.trim() || payload.topic;
   const assessmentTitle =
      `${evaluativeFormatLabelMap[payload.evaluativeFormat]}: ${assessmentBaseName}`;

   const existingAssessment = getAssessmentsByAssignment(effectiveAssignmentId).find(
      (assessment) => assessment.linkedClassId === effectiveClassId,
   );

   if (existingAssessment) {
      updateAssessment(existingAssessment.id, {
         assignmentId: effectiveAssignmentId,
         title: assessmentTitle,
         date: payload.date,
         type: assessmentType,
         status: mapClassStatusToAssessmentStatus(payload.status),
      });
   } else {
      addAssessment({
         assignmentId: effectiveAssignmentId,
         linkedClassId: effectiveClassId,
         title: assessmentTitle,
         date: payload.date,
         type: assessmentType,
         status: mapClassStatusToAssessmentStatus(payload.status),
         weight: 1,
         maxScore: 10,
      });
   }

   if (!isPracticalEvaluation) {
      return;
   }

   const activityTitle =
      payload.evaluationName?.trim() ||
      `Actividad practica evaluativa: ${payload.topic}`;
   const existingActivity = getActivitiesByAssignment(effectiveAssignmentId).find(
      (activity) => activity.linkedClassIds.includes(effectiveClassId),
   );

   if (existingActivity) {
      updateActivity(existingActivity.id, {
         assignmentId: effectiveAssignmentId,
         title: activityTitle,
         type: "practica",
         esEvaluable: true,
         fechaInicio: payload.date,
         status: mapClassStatusToActivityStatus(payload.status),
         linkedClassIds: Array.from(
            new Set([...existingActivity.linkedClassIds, effectiveClassId]),
         ),
      });
      return;
   }

   addActivity({
      assignmentId: effectiveAssignmentId,
      title: activityTitle,
      type: "practica",
      esEvaluable: true,
      fechaInicio: payload.date,
      status: mapClassStatusToActivityStatus(payload.status),
      linkedClassIds: [effectiveClassId],
   });
}
