import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
   classSessions,
   getAssignmentById,
   getAssignmentIdBySubjectId,
   getSubjectById,
} from "@/lib/edu-repository";
import type { ClassBlock, ClassSession } from "@/types";
import {
   createPlanningClassId,
   createPlanningScheduleTemplateId,
   loadPlanningClasses,
   loadPlanningScheduleTemplates,
   savePlanningClasses,
   savePlanningScheduleTemplates,
   type PlanningScheduleTemplate,
} from "@/features/planning/services";

type ClassInput = Omit<ClassSession, "id">;
type RecurringInput = {
   institutionId: string;
   assignmentId: string;
   startDate: string;
   endDate: string;
   slots: Array<{
      dayOfWeek: number;
      time: string;
      blockCount: number;
   }>;
};

type QuickCreateInput = {
   assignmentId: string;
   date: string;
   time: string;
   blockCount: number;
   scheduleTemplateId?: string;
   source?: "manual" | "generated";
};

type ScheduleSlotMatch = {
   scheduleTemplateId: string;
   time: string;
   blockCount: number;
};

type PlanningContextValue = {
   classes: ClassSession[];
   scheduleTemplates: PlanningScheduleTemplate[];
   createClass: (input: ClassInput) => ClassSession;
   createQuickClass: (input: QuickCreateInput) => ClassSession;
   createRecurringClasses: (input: RecurringInput) => number;
   removeClassesByAssignment: (assignmentId: string) => string[];
   updateClass: (id: string, updates: Partial<ClassInput>) => void;
   duplicateClass: (
      id: string,
      overrides?: Partial<Pick<ClassInput, "date" | "time" | "status">>,
   ) => ClassSession | null;
   markClassAsTaught: (id: string) => void;
   updateClassNotes: (id: string, notes: string) => void;
   getScheduleSlotsForDate: (assignmentId: string, date: string) => ScheduleSlotMatch[];
   hasScheduleForPattern: (
      assignmentId: string,
      dayOfWeek: number,
      time: string,
   ) => boolean;
};

const PlanningContext = createContext<PlanningContextValue | null>(null);

function addDays(dateStr: string, days: number) {
   const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
   if (!match) {
      return dateStr;
   }
   const year = Number(match[1]);
   const month = Number(match[2]);
   const day = Number(match[3]);
   const date = new Date(Date.UTC(year, month - 1, day));
   date.setUTCDate(date.getUTCDate() + days);
   const yyyy = date.getUTCFullYear();
   const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
   const dd = String(date.getUTCDate()).padStart(2, "0");
   return `${yyyy}-${mm}-${dd}`;
}

function normalizeBlockDuration(value: number | undefined) {
   if (!value || Number.isNaN(value) || value <= 0) {
      return 40;
   }
   return Math.round(value);
}

function normalizeBlockCount(value: number | undefined) {
   if (!value || Number.isNaN(value) || value <= 0) {
      return 1;
   }
   return Math.max(1, Math.min(3, Math.round(value)));
}

function buildAutoBlocks(blockCount: number): ClassBlock[] {
   return Array.from({ length: blockCount }, (_, index) => ({
      order: index + 1,
      topic: "",
      subtopics: [],
      type: "teorica",
   }));
}

function dateToWeekday(date: string) {
   const parsed = new Date(`${date}T12:00:00`);
   if (Number.isNaN(parsed.getTime())) {
      return null;
   }
   return parsed.getDay();
}

function isWithinRange(date: string, startDate: string, endDate: string) {
   return date >= startDate && date <= endDate;
}

export function PlanningProvider({ children }: { children: React.ReactNode }) {
   const [classes, setClasses] = useState<ClassSession[]>(() =>
      loadPlanningClasses(classSessions).map((classSession) => ({
         ...classSession,
         assignmentId:
            classSession.assignmentId ??
            getAssignmentIdBySubjectId(classSession.subjectId),
      })),
   );

   const [scheduleTemplates, setScheduleTemplates] = useState<PlanningScheduleTemplate[]>(
      loadPlanningScheduleTemplates,
   );

   useEffect(() => {
      savePlanningClasses(classes);
   }, [classes]);

   useEffect(() => {
      savePlanningScheduleTemplates(scheduleTemplates);
   }, [scheduleTemplates]);

   const value: PlanningContextValue = useMemo(
      () => ({
         classes,
         scheduleTemplates,
         createClass: (input) => {
            const assignment = input.assignmentId
               ? getAssignmentById(input.assignmentId)
               : null;
            const nextClass: ClassSession = {
               ...input,
               id: createPlanningClassId(),
               assignmentId:
                  assignment?.id ??
                  input.assignmentId ??
                  getAssignmentIdBySubjectId(input.subjectId),
               subjectId: assignment?.subjectId ?? input.subjectId,
               institutionId: assignment?.institutionId ?? input.institutionId,
               source: input.source ?? "manual",
            };

            setClasses((prev) => [...prev, nextClass]);
            return nextClass;
         },
         createQuickClass: (input) => {
            const assignment = getAssignmentById(input.assignmentId);
            if (!assignment) {
               throw new Error("Assignment not found for quick class creation.");
            }
            const subject = getSubjectById(assignment.subjectId);
            const blockDurationMinutes = normalizeBlockDuration(
               subject?.blockDurationMinutes,
            );
            const blockCount = normalizeBlockCount(input.blockCount);
            const durationMinutes = blockDurationMinutes * blockCount;

            const nextClass: ClassSession = {
               id: createPlanningClassId(),
               institutionId: assignment.institutionId,
               subjectId: assignment.subjectId,
               assignmentId: assignment.id,
               date: input.date,
               time: input.time,
               durationMinutes,
               blockDurationMinutes,
               blocks: buildAutoBlocks(blockCount),
               scheduleTemplateId: input.scheduleTemplateId,
               source: input.source ?? "manual",
               topic: "Por planificar",
               subtopics: [],
               type: "teorica",
               status: "sin_planificar",
            };

            setClasses((prev) => [...prev, nextClass]);
            return nextClass;
         },
         createRecurringClasses: (input) => {
            const templateId = createPlanningScheduleTemplateId();
            let createdCount = 0;

            const normalizedSlots = input.slots
               .map((slot) => ({
                  dayOfWeek: slot.dayOfWeek,
                  time: slot.time,
                  blockCount: normalizeBlockCount(slot.blockCount),
               }))
               .filter((slot) => slot.time.trim().length > 0);

            if (normalizedSlots.length === 0) {
               return 0;
            }

            const assignment = getAssignmentById(input.assignmentId);
            if (!assignment) {
               return 0;
            }

            const subject = getSubjectById(assignment.subjectId);
            const blockDurationMinutes = normalizeBlockDuration(
               subject?.blockDurationMinutes,
            );

            const nextTemplate: PlanningScheduleTemplate = {
               id: templateId,
               institutionId: input.institutionId,
               assignmentId: input.assignmentId,
               startDate: input.startDate,
               endDate: input.endDate,
               slots: normalizedSlots,
               createdAt: new Date().toISOString(),
            };
            setScheduleTemplates((prev) => {
               const withoutAssignment = prev.filter(
                  (template) =>
                     !(
                        template.assignmentId === input.assignmentId &&
                        template.institutionId === input.institutionId
                     ),
               );
               return [...withoutAssignment, nextTemplate];
            });

            setClasses((prev) => {
               const next = [...prev];
               const existingSlot = new Set(
                  prev.map(
                     (classSession) =>
                        `${classSession.assignmentId ?? getAssignmentIdBySubjectId(classSession.subjectId)}|${classSession.date}|${classSession.time}`,
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
                        const slotKey = `${assignment.id}|${date}|${slot.time}`;
                        if (existingSlot.has(slotKey)) {
                           return;
                        }

                        const durationMinutes = slot.blockCount * blockDurationMinutes;

                        next.push({
                           id: createPlanningClassId(),
                           scheduleTemplateId: templateId,
                           source: "generated",
                           institutionId: assignment.institutionId,
                           subjectId: assignment.subjectId,
                           assignmentId: assignment.id,
                           date,
                           time: slot.time,
                           durationMinutes,
                           blockDurationMinutes,
                           blocks: buildAutoBlocks(slot.blockCount),
                           topic: "Por planificar",
                           subtopics: [],
                           type: "teorica",
                           status: "sin_planificar",
                        });
                        existingSlot.add(slotKey);
                        createdCount += 1;
                     });
                  }
                  cursor.setDate(cursor.getDate() + 1);
               }

               return next;
            });

            return createdCount;
         },
         removeClassesByAssignment: (assignmentId) => {
            let removedClassIds: string[] = [];
            setClasses((prev) => {
               removedClassIds = prev
                  .filter(
                     (classSession) =>
                        (classSession.assignmentId ??
                           getAssignmentIdBySubjectId(classSession.subjectId)) ===
                        assignmentId,
                  )
                  .map((classSession) => classSession.id);
               return prev.filter(
                  (classSession) => !removedClassIds.includes(classSession.id),
               );
            });
            return removedClassIds;
         },
         updateClass: (id, updates) => {
            const assignment = updates.assignmentId
               ? getAssignmentById(updates.assignmentId)
               : null;
            setClasses((prev) =>
               prev.map((classSession) =>
                  classSession.id === id
                     ? {
                          ...classSession,
                          ...updates,
                          id: classSession.id,
                          subjectId:
                             assignment?.subjectId ??
                             updates.subjectId ??
                             classSession.subjectId,
                          institutionId:
                             assignment?.institutionId ??
                             updates.institutionId ??
                             classSession.institutionId,
                          assignmentId:
                             assignment?.id ??
                             updates.assignmentId ??
                             classSession.assignmentId,
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
                  id: createPlanningClassId(),
                  source: "manual",
                  date: overrides?.date ?? addDays(source.date, 7),
                  time: overrides?.time ?? source.time,
                  status: overrides?.status ?? "sin_planificar",
               };

               return [...prev, duplicated];
            });

            return duplicated;
         },
         markClassAsTaught: (id) => {
            setClasses((prev) =>
               prev.map((classSession) =>
                  classSession.id === id
                     ? { ...classSession, status: "dictada" }
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
         getScheduleSlotsForDate: (assignmentId, date) => {
            const dayOfWeek = dateToWeekday(date);
            if (dayOfWeek === null) {
               return [];
            }
            return scheduleTemplates
               .filter(
                  (template) =>
                     template.assignmentId === assignmentId &&
                     isWithinRange(date, template.startDate, template.endDate),
               )
               .flatMap((template) =>
                  template.slots
                     .filter((slot) => slot.dayOfWeek === dayOfWeek)
                     .map((slot) => ({
                        scheduleTemplateId: template.id,
                        time: slot.time,
                        blockCount: slot.blockCount,
                     })),
               )
               .sort((a, b) => a.time.localeCompare(b.time));
         },
         hasScheduleForPattern: (assignmentId, dayOfWeek, time) =>
            scheduleTemplates.some(
               (template) =>
                  template.assignmentId === assignmentId &&
                  template.slots.some(
                     (slot) => slot.dayOfWeek === dayOfWeek && slot.time === time,
                  ),
            ),
      }),
      [classes, scheduleTemplates],
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
