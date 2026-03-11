import type { ClassSession } from "@/types";
import { readJsonFromStorage, writeJsonToStorage } from "@/services/local-storage";

const PLANNING_STORAGE_KEY = "aula.planning.classes";

function isClassStatus(value: unknown): value is ClassSession["status"] {
   return (
      value === "planificada" ||
      value === "sin-planificar" ||
      value === "finalizada"
   );
}

function isClassType(value: unknown): value is ClassSession["type"] {
   return (
      value === "teorica" ||
      value === "practica" ||
      value === "evaluacion" ||
      value === "repaso" ||
      value === "recuperatorio"
   );
}

function sanitizeClassSession(raw: unknown): ClassSession | null {
   if (!raw || typeof raw !== "object") {
      return null;
   }

   const input = raw as Partial<ClassSession>;
   if (
      typeof input.id !== "string" ||
      typeof input.subjectId !== "string" ||
      typeof input.institutionId !== "string" ||
      typeof input.date !== "string" ||
      typeof input.time !== "string" ||
      typeof input.topic !== "string" ||
      !Array.isArray(input.subtopics) ||
      !isClassType(input.type) ||
      !isClassStatus(input.status)
   ) {
      return null;
   }

   return {
      id: input.id,
      subjectId: input.subjectId,
      institutionId: input.institutionId,
      date: input.date,
      time: input.time,
      scheduleTemplateId:
         typeof input.scheduleTemplateId === "string"
            ? input.scheduleTemplateId
            : undefined,
      topic: input.topic,
      subtopics: input.subtopics.filter(
         (subtopic): subtopic is string => typeof subtopic === "string",
      ),
      type: input.type,
      status: input.status,
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
