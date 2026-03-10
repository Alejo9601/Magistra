import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { classSessions, type ClassSession } from "@/lib/edu-repository";

const PLANNING_STORAGE_KEY = "aula.planning.classes";

type ClassInput = Omit<ClassSession, "id">;
type RecurringInput = {
   institutionId: string;
   subjectId: string;
   startDate: string;
   endDate: string;
   slots: Array<{
      dayOfWeek: number;
      time: string;
   }>;
};

type PlanningContextValue = {
   classes: ClassSession[];
   createClass: (input: ClassInput) => ClassSession;
   createRecurringClasses: (input: RecurringInput) => number;
   updateClass: (id: string, updates: Partial<ClassInput>) => void;
   duplicateClass: (
      id: string,
      overrides?: Partial<Pick<ClassInput, "date" | "time" | "status">>,
   ) => ClassSession | null;
   markClassAsTaught: (id: string) => void;
   updateClassNotes: (id: string, notes: string) => void;
};

const PlanningContext = createContext<PlanningContextValue | null>(null);

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

function resolveInitialClasses() {
   if (typeof window === "undefined") {
      return classSessions;
   }

   const persisted = window.localStorage.getItem(PLANNING_STORAGE_KEY);
   if (!persisted) {
      return classSessions;
   }

   try {
      const parsed = JSON.parse(persisted);
      if (!Array.isArray(parsed)) {
         return classSessions;
      }

      const sanitized = parsed
         .map((entry) => sanitizeClassSession(entry))
         .filter((entry): entry is ClassSession => entry !== null);

      return sanitized.length > 0 ? sanitized : classSessions;
   } catch {
      return classSessions;
   }
}

function createClassId() {
   return `cls-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function addDays(dateStr: string, days: number) {
   const date = new Date(`${dateStr}T12:00:00`);
   date.setDate(date.getDate() + days);
   const yyyy = date.getFullYear();
   const mm = String(date.getMonth() + 1).padStart(2, "0");
   const dd = String(date.getDate()).padStart(2, "0");
   return `${yyyy}-${mm}-${dd}`;
}

export function PlanningProvider({ children }: { children: React.ReactNode }) {
   const [classes, setClasses] = useState<ClassSession[]>(resolveInitialClasses);

   useEffect(() => {
      if (typeof window === "undefined") {
         return;
      }

      window.localStorage.setItem(PLANNING_STORAGE_KEY, JSON.stringify(classes));
   }, [classes]);

   const value = useMemo<PlanningContextValue>(
      () => ({
         classes,
         createClass: (input) => {
            const nextClass: ClassSession = {
               ...input,
               id: createClassId(),
            };

            setClasses((prev) => [...prev, nextClass]);
            return nextClass;
         },
         createRecurringClasses: (input) => {
            const scheduleTemplateId = `sch-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            let createdCount = 0;

            setClasses((prev) => {
               const normalizedSlots = input.slots
                  .map((slot) => ({
                     dayOfWeek: slot.dayOfWeek,
                     time: slot.time,
                  }))
                  .filter((slot) => slot.time.trim().length > 0);
               const next = [...prev];
               const existingSlot = new Set(
                  prev.map(
                     (classSession) =>
                        `${classSession.institutionId}|${classSession.subjectId}|${classSession.date}|${classSession.time}`,
                  ),
               );

               const today = new Date();
               const todayAtNoon = new Date(
                  `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}T12:00:00`,
               );
               const cursor = new Date(`${input.startDate}T12:00:00`);
               const end = new Date(`${input.endDate}T12:00:00`);
               if (cursor < todayAtNoon) {
                  cursor.setTime(todayAtNoon.getTime());
               }

               while (cursor <= end) {
                  const dayOfWeek = cursor.getDay();
                  const daySlots = normalizedSlots.filter(
                     (slot) => slot.dayOfWeek === dayOfWeek,
                  );

                  if (daySlots.length > 0) {
                     const yyyy = cursor.getFullYear();
                     const mm = String(cursor.getMonth() + 1).padStart(2, "0");
                     const dd = String(cursor.getDate()).padStart(2, "0");
                     const date = `${yyyy}-${mm}-${dd}`;

                     daySlots.forEach((slot) => {
                        const slotKey = `${input.institutionId}|${input.subjectId}|${date}|${slot.time}`;
                        if (!existingSlot.has(slotKey)) {
                           next.push({
                              id: createClassId(),
                              scheduleTemplateId,
                              institutionId: input.institutionId,
                              subjectId: input.subjectId,
                              date,
                              time: slot.time,
                              topic: "Por planificar",
                              subtopics: [],
                              type: "teorica",
                              status: "sin-planificar",
                           });
                           existingSlot.add(slotKey);
                           createdCount += 1;
                        }
                     });
                  }
                  cursor.setDate(cursor.getDate() + 1);
               }

               return next;
            });

            return createdCount;
         },
         updateClass: (id, updates) => {
            setClasses((prev) =>
               prev.map((classSession) =>
                  classSession.id === id
                     ? {
                          ...classSession,
                          ...updates,
                          id: classSession.id,
                       }
                     : classSession,
               ),
            );
         },
         duplicateClass: (id, overrides) => {
            let duplicated: ClassSession | null = null;

            setClasses((prev) => {
               const source = prev.find((classSession) => classSession.id === id);
               if (!source) {
                  return prev;
               }

               duplicated = {
                  ...source,
                  id: createClassId(),
                  date: overrides?.date ?? addDays(source.date, 7),
                  time: overrides?.time ?? source.time,
                  status: overrides?.status ?? "sin-planificar",
               };

               return [...prev, duplicated];
            });

            return duplicated;
         },
         markClassAsTaught: (id) => {
            setClasses((prev) =>
               prev.map((classSession) =>
                  classSession.id === id
                     ? { ...classSession, status: "finalizada" }
                     : classSession,
               ),
            );
         },
         updateClassNotes: (id, notes) => {
            setClasses((prev) =>
               prev.map((classSession) =>
                  classSession.id === id
                     ? {
                          ...classSession,
                          notes: notes.trim().length > 0 ? notes : undefined,
                       }
                     : classSession,
               ),
            );
         },
      }),
      [classes],
   );

   return (
      <PlanningContext.Provider value={value}>{children}</PlanningContext.Provider>
   );
}

export function usePlanningContext() {
   const context = useContext(PlanningContext);
   if (!context) {
      throw new Error("usePlanningContext must be used within PlanningProvider.");
   }
   return context;
}
