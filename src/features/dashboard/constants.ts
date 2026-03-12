import { loadOperativeThresholdOverrides } from "@/features/dashboard/services/operative-thresholds-service";

export type DashboardTask = {
   id: string;
   institutionId: string;
   text: string;
   done: boolean;
};

export type OperativeThresholds = {
   atRiskPctWarning: number;
   atRiskPctCritical: number;
   pendingWarning: number;
   pendingCritical: number;
   unplannedPctWarning: number;
   unplannedPctCritical: number;
   unplannedClassCriticalHours: number;
};

export type SemaphoreLevel = "green" | "yellow" | "red";

export const DEFAULT_THRESHOLDS: OperativeThresholds = {
   atRiskPctWarning: 8,
   atRiskPctCritical: 15,
   pendingWarning: 6,
   pendingCritical: 11,
   unplannedPctWarning: 20,
   unplannedPctCritical: 35,
   unplannedClassCriticalHours: 24,
};

const LEGACY_THRESHOLDS_BY_INSTITUTION: Record<string, Partial<OperativeThresholds>> = {
   "inst-1": {
      atRiskPctWarning: 9,
      pendingWarning: 5,
   },
   "inst-2": {
      atRiskPctCritical: 18,
      unplannedPctWarning: 25,
   },
   "inst-3": {
      pendingCritical: 14,
      unplannedPctCritical: 40,
   },
};

export const initialDashboardTasks: DashboardTask[] = [
   {
      id: "task-1",
      institutionId: "inst-1",
      text: "Cargar notas del TP 1 - Matematica 3ro A",
      done: false,
   },
   {
      id: "task-2",
      institutionId: "inst-1",
      text: "Planificar clase de Fisica del viernes",
      done: false,
   },
   {
      id: "task-3",
      institutionId: "inst-1",
      text: "Subir guia de ejercicios Cap. 4",
      done: false,
   },
   {
      id: "task-4",
      institutionId: "inst-2",
      text: "Revisar asistencia semanal de 4to C",
      done: true,
   },
   {
      id: "task-5",
      institutionId: "inst-2",
      text: "Preparar parcial de Trigonometria",
      done: false,
   },
   {
      id: "task-6",
      institutionId: "inst-3",
      text: "Publicar material de Algebra Lineal",
      done: false,
   },
];

function pad2(value: number) {
   return String(value).padStart(2, "0");
}

export function toIsoDate(date: Date) {
   return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function getTodayStr() {
   return toIsoDate(new Date());
}

export function addDays(dateStr: string, days: number) {
   const date = new Date(`${dateStr}T12:00:00`);
   date.setDate(date.getDate() + days);
   return toIsoDate(date);
}

export function getWeekDaysFromToday() {
   const today = new Date();
   const day = today.getDay();
   const mondayOffset = day === 0 ? -6 : 1 - day;
   const monday = new Date(today);
   monday.setDate(today.getDate() + mondayOffset);

   return Array.from({ length: 5 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return {
         date: toIsoDate(date),
         label: date.toLocaleDateString("es-AR", { weekday: "short" }),
      };
   });
}

export function getThresholdsForInstitution(
   institutionId: string,
): OperativeThresholds {
   const persistedOverrides = loadOperativeThresholdOverrides();
   return {
      ...DEFAULT_THRESHOLDS,
      ...(LEGACY_THRESHOLDS_BY_INSTITUTION[institutionId] ?? {}),
      ...(persistedOverrides[institutionId] ?? {}),
   };
}

export function resolveSemaphoreLevel(
   value: number,
   warning: number,
   critical: number,
): SemaphoreLevel {
   if (value >= critical) return "red";
   if (value >= warning) return "yellow";
   return "green";
}

export function semaphoreScore(level: SemaphoreLevel) {
   if (level === "green") return 100;
   if (level === "yellow") return 60;
   return 25;
}
