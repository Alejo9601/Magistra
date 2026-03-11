import {
   classSessions,
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

function isActivityType(value: unknown): value is ActivityType {
   return (
      value === "classwork" ||
      value === "homework" ||
      value === "lab" ||
      value === "project"
   );
}

function isActivityStatus(value: unknown): value is ActivityStatus {
   return (
      value === "draft" ||
      value === "planned" ||
      value === "assigned" ||
      value === "completed"
   );
}

function sanitizeActivity(raw: unknown): SubjectActivity | null {
   if (!raw || typeof raw !== "object") {
      return null;
   }
   const input = raw as Partial<SubjectActivity>;
   if (
      typeof input.id !== "string" ||
      typeof input.title !== "string" ||
      !isActivityType(input.type) ||
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

   return {
      id: input.id,
      subjectId: resolvedSubjectId,
      assignmentId: resolvedAssignmentId,
      title: input.title,
      description:
         typeof input.description === "string" ? input.description : undefined,
      type: input.type,
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
   const grouped = new Map<string, { subjectId: string; assignmentId: string; linkedClassIds: string[] }>();
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
         });
      });
   });

   return Array.from(grouped.entries()).map(([key, entry], index) => {
      const [, normalizedTitle] = key.split("|");
      return {
         id: `act-seed-${index + 1}`,
         subjectId: entry.subjectId,
         assignmentId: entry.assignmentId,
         title: titleCase(normalizedTitle),
         type: "classwork",
         status: "planned",
         linkedClassIds: entry.linkedClassIds,
      };
   });
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
