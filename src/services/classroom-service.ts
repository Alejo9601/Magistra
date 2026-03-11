import type { AttendanceStatus, ClassroomRecord } from "@/types";
import { readJsonFromStorage, writeJsonToStorage } from "@/services/local-storage";

const CLASSROOM_STORAGE_KEY = "aula.classroom.records";

function isAttendanceStatus(value: unknown): value is AttendanceStatus {
   return value === "P" || value === "A" || value === "T" || value === "J";
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
   };
}

export function loadClassroomRecords() {
   return readJsonFromStorage<Record<string, ClassroomRecord>>(
      CLASSROOM_STORAGE_KEY,
      {},
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
         return Object.fromEntries(entries);
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
   };
}
