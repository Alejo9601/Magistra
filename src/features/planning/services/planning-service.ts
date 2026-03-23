import type { ClassBlock, ClassSession } from "@/types";
import { readJsonFromStorage, writeJsonToStorage } from "@/services/local-storage";

const PLANNING_STORAGE_KEY = "aula.planning.classes";

function isClassStatus(value: unknown): value is ClassSession["status"] {
   return (
      value === "planificada" ||
      value === "sin-planificar" ||
      value === "finalizada"
   );
}

function normalizeLegacyClassType(value: unknown): Exclude<ClassSession["type"], "oral"> | null {
   if (value === "teorica" || value === "practica" || value === "teorico-practica") {
      return value;
   }
   if (
      value === "evaluacion" ||
      value === "oral" ||
      value === "repaso" ||
      value === "recuperatorio"
   ) {
      return "teorico-practica";
   }
   return null;
}

function isEvaluativeFormat(
   value: unknown,
): value is NonNullable<ClassSession["evaluativeFormat"]> {
   return (
      value === "oral" ||
      value === "escrito" ||
      value === "actividad-practica" ||
      value === "otro" ||
      value === "exposicion-oral" ||
      value === "examen-escrito" ||
      value === "examen-oral" ||
      value === "trabajo-practico-evaluativo"
   );
}

function sanitizePositiveMinutes(value: unknown): number | undefined {
   if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
      return undefined;
   }
   return Math.round(value);
}

function sanitizeBlock(raw: unknown): ClassBlock | null {
   if (!raw || typeof raw !== "object") {
      return null;
   }
   const input = raw as Partial<ClassBlock>;
   const normalizedType = normalizeLegacyClassType((raw as { type?: unknown }).type);

   if (
      typeof input.order !== "number" ||
      typeof input.topic !== "string" ||
      !Array.isArray(input.subtopics) ||
      !normalizedType
   ) {
      return null;
   }

   return {
      order: Math.max(1, Math.floor(input.order)),
      topic: input.topic,
      subtopics: input.subtopics.filter(
         (subtopic): subtopic is string => typeof subtopic === "string",
      ),
      type: normalizedType,
      evaluativeFormat: isEvaluativeFormat(input.evaluativeFormat)
         ? input.evaluativeFormat
         : undefined,
      practiceActivityName:
         typeof input.practiceActivityName === "string" &&
         input.practiceActivityName.trim().length > 0
            ? input.practiceActivityName.trim()
            : undefined,
      practiceActivityDescription:
         typeof input.practiceActivityDescription === "string" &&
         input.practiceActivityDescription.trim().length > 0
            ? input.practiceActivityDescription.trim()
            : undefined,
      evaluationName:
         typeof input.evaluationName === "string" &&
         input.evaluationName.trim().length > 0
            ? input.evaluationName.trim()
            : undefined,
      evaluationDescription:
         typeof input.evaluationDescription === "string" &&
         input.evaluationDescription.trim().length > 0
            ? input.evaluationDescription.trim()
            : undefined,
   };
}

function sanitizeClassSession(raw: unknown): ClassSession | null {
   if (!raw || typeof raw !== "object") {
      return null;
   }

   const input = raw as Partial<ClassSession> & { type?: string };
   const normalizedType = normalizeLegacyClassType(input.type);

   if (
      typeof input.id !== "string" ||
      typeof input.subjectId !== "string" ||
      typeof input.institutionId !== "string" ||
      typeof input.date !== "string" ||
      typeof input.time !== "string" ||
      typeof input.topic !== "string" ||
      !Array.isArray(input.subtopics) ||
      !normalizedType ||
      !isClassStatus(input.status)
   ) {
      return null;
   }

   return {
      id: input.id,
      subjectId: input.subjectId,
      institutionId: input.institutionId,
      assignmentId:
         typeof input.assignmentId === "string" ? input.assignmentId : undefined,
      date: input.date,
      time: input.time,
      durationMinutes: sanitizePositiveMinutes(input.durationMinutes),
      blockDurationMinutes: sanitizePositiveMinutes(input.blockDurationMinutes),
      blocks: Array.isArray(input.blocks)
         ? input.blocks
              .map((entry) => sanitizeBlock(entry))
              .filter((entry): entry is ClassBlock => entry !== null)
              .sort((a, b) => a.order - b.order)
         : undefined,
      scheduleTemplateId:
         typeof input.scheduleTemplateId === "string"
            ? input.scheduleTemplateId
            : undefined,
      topic: input.topic,
      subtopics: input.subtopics.filter(
         (subtopic): subtopic is string => typeof subtopic === "string",
      ),
      type: normalizedType,
      status: input.status,
      evaluativeFormat: isEvaluativeFormat(input.evaluativeFormat)
         ? input.evaluativeFormat
         : undefined,
      practiceActivityName:
         typeof input.practiceActivityName === "string" &&
         input.practiceActivityName.trim().length > 0
            ? input.practiceActivityName.trim()
            : undefined,
      practiceActivityDescription:
         typeof input.practiceActivityDescription === "string" &&
         input.practiceActivityDescription.trim().length > 0
            ? input.practiceActivityDescription.trim()
            : undefined,
      evaluationName:
         typeof input.evaluationName === "string" &&
         input.evaluationName.trim().length > 0
            ? input.evaluationName.trim()
            : undefined,
      evaluationDescription:
         typeof input.evaluationDescription === "string" &&
         input.evaluationDescription.trim().length > 0
            ? input.evaluationDescription.trim()
            : undefined,
      activities:
         typeof input.activities === "string" && input.activities.trim().length > 0
            ? input.activities
            : undefined,
      notes:
         typeof input.notes === "string" && input.notes.trim().length > 0
            ? input.notes
            : undefined,
      resources: Array.isArray(input.resources)
         ? input.resources.filter(
              (resource): resource is string => typeof resource === "string",
           )
         : undefined,
   };
}

export function loadPlanningClasses(seedClasses: ClassSession[]) {
   return readJsonFromStorage(PLANNING_STORAGE_KEY, seedClasses, (raw) => {
      if (!Array.isArray(raw)) {
         return null;
      }
      const sanitized = raw
         .map((entry) => sanitizeClassSession(entry))
         .filter((entry): entry is ClassSession => entry !== null);
      return sanitized.length > 0 ? sanitized : seedClasses;
   });
}

export function savePlanningClasses(classes: ClassSession[]) {
   writeJsonToStorage(PLANNING_STORAGE_KEY, classes);
}

export function createPlanningClassId() {
   return `cls-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

