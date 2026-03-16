import {
   evaluations,
   getAssignmentIdBySubjectId,
   getSubjectIdByAssignmentId,
} from "@/lib/edu-repository";
import { readJsonFromStorage, writeJsonToStorage } from "@/services/local-storage";
import type {
   Assessment,
   AssessmentStatus,
   AssessmentType,
} from "@/types";

const ASSESSMENTS_STORAGE_KEY = "aula.assessments";
export type { Assessment, AssessmentStatus, AssessmentType };

function isAssessmentType(value: unknown): value is AssessmentType {
   return value === "exam" || value === "practice_work";
}

function isAssessmentStatus(value: unknown): value is AssessmentStatus {
   return (
      value === "draft" ||
      value === "scheduled" ||
      value === "published" ||
      value === "graded"
   );
}

function sanitizeAssessment(raw: unknown): Assessment | null {
   if (!raw || typeof raw !== "object") {
      return null;
   }

   const input = raw as Partial<Assessment>;
   if (
      typeof input.id !== "string" ||
      typeof input.title !== "string" ||
      typeof input.date !== "string" ||
      !isAssessmentType(input.type) ||
      !isAssessmentStatus(input.status) ||
      typeof input.weight !== "number" ||
      typeof input.maxScore !== "number" ||
      typeof input.gradesLoaded !== "number"
   ) {
      return null;
   }

   const resolvedSubjectId =
      typeof input.subjectId === "string"
         ? input.subjectId
         : typeof input.assignmentId === "string"
            ? getSubjectIdByAssignmentId(input.assignmentId)
            : undefined;

   const resolvedAssignmentId =
      typeof input.assignmentId === "string"
         ? input.assignmentId
         : resolvedSubjectId
            ? getAssignmentIdBySubjectId(resolvedSubjectId)
            : undefined;

   if (!resolvedSubjectId || !resolvedAssignmentId) {
      return null;
   }

   return {
      id: input.id,
      subjectId: resolvedSubjectId,
      assignmentId: resolvedAssignmentId,
      title: input.title,
      linkedClassId:
         typeof input.linkedClassId === "string" ? input.linkedClassId : undefined,
      description:
         typeof input.description === "string" ? input.description : undefined,
      date: input.date,
      type: input.type,
      status: input.status,
      weight: input.weight,
      maxScore: input.maxScore,
      gradesLoaded: input.gradesLoaded,
   };
}

function seedAssessments(): Assessment[] {
   return evaluations.map((evaluation) => ({
      id: evaluation.id,
      subjectId: evaluation.subjectId,
      assignmentId: getAssignmentIdBySubjectId(evaluation.subjectId),
      title: evaluation.name,
      linkedClassId: undefined,
      date: evaluation.date,
      description: undefined,
      type: evaluation.type === "tp" ? "practice_work" : "exam",
      status: "scheduled",
      weight: 1,
      maxScore: 10,
      gradesLoaded: evaluation.grades.length,
   }));
}

export function loadAssessments() {
   const seed = seedAssessments();
   return readJsonFromStorage(ASSESSMENTS_STORAGE_KEY, seed, (raw) => {
      if (!Array.isArray(raw)) {
         return null;
      }
      const sanitized = raw
         .map((entry) => sanitizeAssessment(entry))
         .filter((entry): entry is Assessment => entry !== null);
      return sanitized.length > 0 ? sanitized : seed;
   });
}

export function saveAssessments(assessments: Assessment[]) {
   writeJsonToStorage(ASSESSMENTS_STORAGE_KEY, assessments);
}

export function createAssessmentId() {
   return `asm-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}
