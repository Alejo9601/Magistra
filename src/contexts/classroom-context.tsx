import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AttendanceStatus } from "@/components/clase-detail/constants";

const CLASSROOM_STORAGE_KEY = "aula.classroom.records";

type ClassroomRecord = {
   completedSubtopics: string[];
   completedActivities: string[];
   attendance: Record<string, AttendanceStatus>;
   notes?: string;
};

type ClassroomContextValue = {
   getRecord: (classId: string) => ClassroomRecord;
   toggleSubtopic: (classId: string, subtopic: string) => void;
   toggleActivity: (classId: string, activity: string) => void;
   setAttendance: (
      classId: string,
      attendance: Record<string, AttendanceStatus>,
   ) => void;
   setNotes: (classId: string, notes: string) => void;
};

const ClassroomContext = createContext<ClassroomContextValue | null>(null);

function isAttendanceStatus(value: unknown): value is AttendanceStatus {
   return value === "P" || value === "A" || value === "T" || value === "J";
}

function sanitizeRecord(raw: unknown): ClassroomRecord | null {
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
      ([studentId, status]) => typeof studentId === "string" && isAttendanceStatus(status),
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

function resolveInitialRecords() {
   if (typeof window === "undefined") {
      return {} as Record<string, ClassroomRecord>;
   }
   const persisted = window.localStorage.getItem(CLASSROOM_STORAGE_KEY);
   if (!persisted) {
      return {} as Record<string, ClassroomRecord>;
   }

   try {
      const parsed = JSON.parse(persisted);
      if (!parsed || typeof parsed !== "object") {
         return {} as Record<string, ClassroomRecord>;
      }
      const entries = Object.entries(parsed)
         .map(([classId, value]) => {
            const sanitized = sanitizeRecord(value);
            return sanitized ? ([classId, sanitized] as const) : null;
         })
         .filter((entry): entry is readonly [string, ClassroomRecord] => entry !== null);

      return Object.fromEntries(entries);
   } catch {
      return {} as Record<string, ClassroomRecord>;
   }
}

function fallbackRecord(): ClassroomRecord {
   return {
      completedSubtopics: [],
      completedActivities: [],
      attendance: {},
      notes: undefined,
   };
}

export function ClassroomProvider({ children }: { children: React.ReactNode }) {
   const [recordsByClass, setRecordsByClass] = useState<Record<string, ClassroomRecord>>(
      resolveInitialRecords,
   );

   useEffect(() => {
      if (typeof window === "undefined") {
         return;
      }
      window.localStorage.setItem(
         CLASSROOM_STORAGE_KEY,
         JSON.stringify(recordsByClass),
      );
   }, [recordsByClass]);

   const value = useMemo<ClassroomContextValue>(
      () => ({
         getRecord: (classId) => recordsByClass[classId] ?? fallbackRecord(),
         toggleSubtopic: (classId, subtopic) => {
            setRecordsByClass((prev) => {
               const current = prev[classId] ?? fallbackRecord();
               const hasItem = current.completedSubtopics.includes(subtopic);
               const completedSubtopics = hasItem
                  ? current.completedSubtopics.filter((item) => item !== subtopic)
                  : [...current.completedSubtopics, subtopic];
               return {
                  ...prev,
                  [classId]: { ...current, completedSubtopics },
               };
            });
         },
         toggleActivity: (classId, activity) => {
            setRecordsByClass((prev) => {
               const current = prev[classId] ?? fallbackRecord();
               const hasItem = current.completedActivities.includes(activity);
               const completedActivities = hasItem
                  ? current.completedActivities.filter((item) => item !== activity)
                  : [...current.completedActivities, activity];
               return {
                  ...prev,
                  [classId]: { ...current, completedActivities },
               };
            });
         },
         setAttendance: (classId, attendance) => {
            setRecordsByClass((prev) => {
               const current = prev[classId] ?? fallbackRecord();
               return {
                  ...prev,
                  [classId]: { ...current, attendance },
               };
            });
         },
         setNotes: (classId, notes) => {
            setRecordsByClass((prev) => {
               const current = prev[classId] ?? fallbackRecord();
               return {
                  ...prev,
                  [classId]: {
                     ...current,
                     notes: notes.trim().length > 0 ? notes : undefined,
                  },
               };
            });
         },
      }),
      [recordsByClass],
   );

   return (
      <ClassroomContext.Provider value={value}>{children}</ClassroomContext.Provider>
   );
}

export function useClassroomContext() {
   const context = useContext(ClassroomContext);
   if (!context) {
      throw new Error("useClassroomContext must be used within ClassroomProvider.");
   }
   return context;
}
