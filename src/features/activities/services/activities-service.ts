import {
   classSessions,
   evaluations,
   getAssignmentIdBySubjectId,
   getSubjectIdByAssignmentId,
} from "@/lib/edu-repository";
import { readJsonFromStorage, writeJsonToStorage } from "@/services/local-storage";
import type {
   ActivityStatus,
   ActivityType,
   SubjectActivity,
} from "@/types";

const ACTIVITIES_STORAGE_KEY = "aula.activities";
export type { ActivityStatus, ActivityType, SubjectActivity };

function normalizeLegacyActivityType(value: unknown): ActivityType | null {
   if (value === "practica" || value === "examen" || value === "proyecto" || value === "tarea") {
      return value;
   }
   if (value === "classwork") return "practica";
   if (value === "homework") return "tarea";
   if (value === "project") return "proyecto";
   if (value === "lab") return "practica";
   if (value === "practice_work") return "practica";
   if (value === "exam") return "examen";
   return null;
}

function isActivityStatus(value: unknown): value is ActivityStatus {
   return (
      value === "draft" ||
      value === "planned" ||
      value === "assigned" ||
      value === "completed"
   );
}

function sanitizeDate(value: unknown): string | null {
   if (typeof value !== "string") {
      return null;
   }
   return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function sanitizeActivity(raw: unknown): SubjectActivity | null {
   if (!raw || typeof raw !== "object") {
      return null;
   }
   const input = raw as Partial<SubjectActivity> & {
      esEvaluable?: unknown;
      rubricaId?: unknown;
      fechaInicio?: unknown;
      fechaFin?: unknown;
   };

   const normalizedType = normalizeLegacyActivityType(input.type);
   if (
      typeof input.id !== "string" ||
      typeof input.title !== "string" ||
      !normalizedType ||
      !isActivityStatus(input.status) ||
      !Array.isArray(input.linkedClassIds)
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

   const firstLinkedClassId = input.linkedClassIds.find((id): id is string => typeof id === "string");
   const fallbackStartDate = firstLinkedClassId
      ? classSessions.find((classSession) => classSession.id === firstLinkedClassId)?.date
      : undefined;
   const fechaInicio =
      sanitizeDate(input.fechaInicio) ??
      fallbackStartDate ??
      classSessions.find((classSession) =>
         classSession.subjectId === resolvedSubjectId,
      )?.date ??
      new Date().toISOString().slice(0, 10);

   return {
      id: input.id,
      subjectId: resolvedSubjectId,
      assignmentId: resolvedAssignmentId,
      title: input.title,
      description:
         typeof input.description === "string" ? input.description : undefined,
      type: normalizedType,
      esEvaluable:
         typeof input.esEvaluable === "boolean"
            ? input.esEvaluable
            : normalizedType === "examen",
      rubricaId: typeof input.rubricaId === "string" ? input.rubricaId : undefined,
      fechaInicio,
      fechaFin: sanitizeDate(input.fechaFin) ?? undefined,
      status: input.status,
      linkedClassIds: input.linkedClassIds.filter(
         (id): id is string => typeof id === "string",
      ),
   };
}

function parseActivityLines(source?: string) {
   if (!source) {
      return [];
   }
   const parts = source
      .split(/\r?\n|[.;]/g)
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
   return Array.from(new Set(parts));
}

function titleCase(value: string) {
   return value
      .split(" ")
      .map((chunk) =>
         chunk.length > 0 ? `${chunk[0].toUpperCase()}${chunk.slice(1)}` : chunk,
      )
      .join(" ");
}

function seedActivities(): SubjectActivity[] {
   const grouped = new Map<string, { subjectId: string; assignmentId: string; linkedClassIds: string[]; fechaInicio: string }>();

   classSessions.forEach((classSession) => {
      parseActivityLines(classSession.activities).forEach((title) => {
         const normalizedTitle = title.toLowerCase();
         const assignmentId =
            classSession.assignmentId ??
            getAssignmentIdBySubjectId(classSession.subjectId);
         const key = `${assignmentId}|${normalizedTitle}`;
         const current = grouped.get(key);
         if (current) {
            if (!current.linkedClassIds.includes(classSession.id)) {
               current.linkedClassIds.push(classSession.id);
            }
            return;
         }
         grouped.set(key, {
            assignmentId,
            subjectId: classSession.subjectId,
            linkedClassIds: [classSession.id],
            fechaInicio: classSession.date,
         });
      });
   });

   const seededFromClasses = Array.from(grouped.entries()).map(([key, entry], index) => {
      const [, normalizedTitle] = key.split("|");
      return {
         id: `act-seed-${index + 1}`,
         subjectId: entry.subjectId,
         assignmentId: entry.assignmentId,
         title: titleCase(normalizedTitle),
         type: "practica" as ActivityType,
         esEvaluable: false,
         fechaInicio: entry.fechaInicio,
         status: "planned" as ActivityStatus,
         linkedClassIds: entry.linkedClassIds,
      };
   });

   const seededFromEvaluations = evaluations.map((evaluation, index) => ({
      id: `act-eval-seed-${index + 1}`,
      subjectId: evaluation.subjectId,
      assignmentId: getAssignmentIdBySubjectId(evaluation.subjectId),
      title: evaluation.name,
      type: evaluation.type === "tp" ? ("practica" as ActivityType) : ("examen" as ActivityType),
      esEvaluable: true,
      fechaInicio: evaluation.date,
      fechaFin: evaluation.date,
      status: "assigned" as ActivityStatus,
      linkedClassIds: [],
   }));

   return [...seededFromClasses, ...seededFromEvaluations];
}

export function loadActivities() {
   const seed = seedActivities();
   return readJsonFromStorage(ACTIVITIES_STORAGE_KEY, seed, (raw) => {
      if (!Array.isArray(raw)) {
         return null;
      }
      const sanitized = raw
         .map((entry) => sanitizeActivity(entry))
         .filter((entry): entry is SubjectActivity => entry !== null);
      return sanitized.length > 0 ? sanitized : seed;
   });
}

export function saveActivities(activities: SubjectActivity[]) {
   writeJsonToStorage(ACTIVITIES_STORAGE_KEY, activities);
}

export function createActivityId() {
   return `act-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}
