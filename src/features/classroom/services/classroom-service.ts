import type {
   AttendanceStatus,
   ClassroomPerformanceEntry,
   ClassroomPerformanceKind,
   ClassroomRecord,
} from "@/types";
import { readJsonFromStorage, writeJsonToStorage } from "@/services/local-storage";
import { attendanceRecords } from "@/lib/edu-repository";

const CLASSROOM_STORAGE_KEY = "aula.classroom.records";

function seedClassroomRecordsFromAttendance() {
   const recordsByClass: Record<string, ClassroomRecord> = {};
   attendanceRecords.forEach((entry) => {
      const current = recordsByClass[entry.classId] ?? {
         completedSubtopics: [],
         completedActivities: [],
         attendance: {},
         notes: undefined,
         performanceEntries: [],
      };
      current.attendance[entry.studentId] = entry.status as AttendanceStatus;
      recordsByClass[entry.classId] = current;
   });
   return recordsByClass;
}

function isAttendanceStatus(value: unknown): value is AttendanceStatus {
   return value === "P" || value === "A" || value === "T" || value === "J";
}

function isClassroomPerformanceKind(value: unknown): value is ClassroomPerformanceKind {
   return value === "activity" || value === "practice_work" || value === "exam";
}

function sanitizePerformanceEntry(raw: unknown): ClassroomPerformanceEntry | null {
   if (!raw || typeof raw !== "object") {
      return null;
   }
   const input = raw as Partial<ClassroomPerformanceEntry>;
   if (
      typeof input.studentId !== "string" ||
      !isClassroomPerformanceKind(input.kind) ||
      (typeof input.score !== "number" && typeof input.score !== "string")
   ) {
      return null;
   }

   return {
      studentId: input.studentId,
      kind: input.kind,
      score: input.score,
      referenceLabel:
         typeof input.referenceLabel === "string" ? input.referenceLabel : undefined,
      note: typeof input.note === "string" ? input.note : undefined,
   };
}

function sanitizeClassroomRecord(raw: unknown): ClassroomRecord | null {
   if (!raw || typeof raw !== "object") {
      return null;
   }
   const input = raw as Partial<ClassroomRecord>;
   if (
      !Array.isArray(input.completedSubtopics) ||
      !Array.isArray(input.completedActivities) ||
      !input.attendance ||
      typeof input.attendance !== "object"
   ) {
      return null;
   }

   const attendanceEntries = Object.entries(input.attendance).filter(
      ([studentId, status]) =>
         typeof studentId === "string" && isAttendanceStatus(status),
   );

   return {
      completedSubtopics: input.completedSubtopics.filter(
         (entry): entry is string => typeof entry === "string",
      ),
      completedActivities: input.completedActivities.filter(
         (entry): entry is string => typeof entry === "string",
      ),
      attendance: Object.fromEntries(attendanceEntries),
      notes: typeof input.notes === "string" ? input.notes : undefined,
      performanceEntries: Array.isArray(input.performanceEntries)
         ? input.performanceEntries
              .map((entry) => sanitizePerformanceEntry(entry))
              .filter((entry): entry is ClassroomPerformanceEntry => entry !== null)
         : [],
   };
}

export function loadClassroomRecords() {
   const seedRecords = seedClassroomRecordsFromAttendance();
   return readJsonFromStorage<Record<string, ClassroomRecord>>(
      CLASSROOM_STORAGE_KEY,
      seedRecords,
      (raw) => {
         if (!raw || typeof raw !== "object") {
            return null;
         }
         const entries = Object.entries(raw)
            .map(([classId, value]) => {
               const sanitized = sanitizeClassroomRecord(value);
               return sanitized ? ([classId, sanitized] as const) : null;
            })
            .filter(
               (entry): entry is readonly [string, ClassroomRecord] =>
                  entry !== null,
            );
         const persisted = Object.fromEntries(entries);
         const mergedEntries = Object.entries(seedRecords).map(([classId, seed]) => {
            const stored = persisted[classId];
            if (!stored) {
               return [classId, seed] as const;
            }
            return [
               classId,
               {
                  completedSubtopics: stored.completedSubtopics,
                  completedActivities: stored.completedActivities,
                  attendance: {
                     ...seed.attendance,
                     ...stored.attendance,
                  },
                  notes: stored.notes,
                  performanceEntries: stored.performanceEntries,
               },
            ] as const;
         });
         const mergedSeed = Object.fromEntries(mergedEntries);
         return {
            ...mergedSeed,
            ...persisted,
         };
      },
   );
}

export function saveClassroomRecords(recordsByClass: Record<string, ClassroomRecord>) {
   writeJsonToStorage(CLASSROOM_STORAGE_KEY, recordsByClass);
}

export function createFallbackClassroomRecord(): ClassroomRecord {
   return {
      completedSubtopics: [],
      completedActivities: [],
      attendance: {},
      notes: undefined,
      performanceEntries: [],
   };
}




