import { createContext, useContext, useEffect, useState } from "react";
import type { AttendanceStatus } from "@/features/classroom/constants";
import {
   createFallbackClassroomRecord,
   loadClassroomRecords,
   saveClassroomRecords,
} from "@/features/classroom/services/classroom-service";
import type { ClassroomRecord } from "@/types";

type ClassroomContextValue = {
   getRecord: (classId: string) => ClassroomRecord;
   toggleSubtopic: (classId: string, subtopic: string) => void;
   toggleActivity: (classId: string, activity: string) => void;
   setAttendance: (
      classId: string,
      attendance: Record<string, AttendanceStatus>,
   ) => void;
   setNotes: (classId: string, notes: string) => void;
   removeRecordsByClassIds: (classIds: string[]) => void;
};

const ClassroomContext = createContext<ClassroomContextValue | null>(null);

export function ClassroomProvider({ children }: { children: React.ReactNode }) {
   const [recordsByClass, setRecordsByClass] = useState<Record<string, ClassroomRecord>>(
      loadClassroomRecords,
   );

   useEffect(() => {
      saveClassroomRecords(recordsByClass);
   }, [recordsByClass]);

   const value: ClassroomContextValue = {
         getRecord: (classId) =>
            recordsByClass[classId] ?? createFallbackClassroomRecord(),
         toggleSubtopic: (classId, subtopic) => {
            setRecordsByClass((prev) => {
               const current = prev[classId] ?? createFallbackClassroomRecord();
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
               const current = prev[classId] ?? createFallbackClassroomRecord();
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
               const current = prev[classId] ?? createFallbackClassroomRecord();
               return {
                  ...prev,
                  [classId]: { ...current, attendance },
               };
            });
         },
         setNotes: (classId, notes) => {
            setRecordsByClass((prev) => {
               const current = prev[classId] ?? createFallbackClassroomRecord();
               return {
                  ...prev,
                  [classId]: {
                     ...current,
                     notes: notes.trim().length > 0 ? notes : undefined,
                  },
               };
            });
         },
         removeRecordsByClassIds: (classIds) => {
            if (classIds.length === 0) {
               return;
            }
            const classIdSet = new Set(classIds);
            setRecordsByClass((prev) =>
               Object.fromEntries(
                  Object.entries(prev).filter(([classId]) => !classIdSet.has(classId)),
               ),
            );
         },
      };

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


