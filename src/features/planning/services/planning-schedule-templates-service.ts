import { readJsonFromStorage, writeJsonToStorage } from "@/services/local-storage";

export type PlanningScheduleTemplateSlot = {
   dayOfWeek: number;
   time: string;
   blockCount: number;
};

export type PlanningScheduleTemplate = {
   id: string;
   institutionId: string;
   assignmentId: string;
   startDate: string;
   endDate: string;
   slots: PlanningScheduleTemplateSlot[];
   createdAt: string;
};

const PLANNING_TEMPLATES_STORAGE_KEY = "aula.planning.schedule-templates";

function sanitizeSlot(raw: unknown): PlanningScheduleTemplateSlot | null {
   if (!raw || typeof raw !== "object") {
      return null;
   }
   const input = raw as Partial<PlanningScheduleTemplateSlot>;
   if (
      typeof input.dayOfWeek !== "number" ||
      input.dayOfWeek < 0 ||
      input.dayOfWeek > 6 ||
      typeof input.time !== "string" ||
      input.time.trim().length === 0 ||
      typeof input.blockCount !== "number" ||
      input.blockCount <= 0
   ) {
      return null;
   }
   return {
      dayOfWeek: Math.round(input.dayOfWeek),
      time: input.time,
      blockCount: Math.max(1, Math.min(3, Math.round(input.blockCount))),
   };
}

function sanitizeTemplate(raw: unknown): PlanningScheduleTemplate | null {
   if (!raw || typeof raw !== "object") {
      return null;
   }
   const input = raw as Partial<PlanningScheduleTemplate>;
   if (
      typeof input.id !== "string" ||
      typeof input.institutionId !== "string" ||
      typeof input.assignmentId !== "string" ||
      typeof input.startDate !== "string" ||
      typeof input.endDate !== "string" ||
      !Array.isArray(input.slots)
   ) {
      return null;
   }

   const slots = input.slots
      .map((slot) => sanitizeSlot(slot))
      .filter((slot): slot is PlanningScheduleTemplateSlot => slot !== null);

   if (slots.length === 0) {
      return null;
   }

   return {
      id: input.id,
      institutionId: input.institutionId,
      assignmentId: input.assignmentId,
      startDate: input.startDate,
      endDate: input.endDate,
      slots,
      createdAt:
         typeof input.createdAt === "string" && input.createdAt.length > 0
            ? input.createdAt
            : new Date().toISOString(),
   };
}

export function loadPlanningScheduleTemplates() {
   return readJsonFromStorage(PLANNING_TEMPLATES_STORAGE_KEY, [] as PlanningScheduleTemplate[], (raw) => {
      if (!Array.isArray(raw)) {
         return null;
      }
      return raw
         .map((item) => sanitizeTemplate(item))
         .filter((item): item is PlanningScheduleTemplate => item !== null);
   });
}

export function savePlanningScheduleTemplates(
   templates: PlanningScheduleTemplate[],
) {
   writeJsonToStorage(PLANNING_TEMPLATES_STORAGE_KEY, templates);
}

export function createPlanningScheduleTemplateId() {
   return `schtpl-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}
