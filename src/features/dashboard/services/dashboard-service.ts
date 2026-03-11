import {
   initialDashboardTasks,
   type DashboardTask,
} from "@/features/dashboard/constants";
import { readJsonFromStorage, writeJsonToStorage } from "@/services/local-storage";

const DASHBOARD_TASKS_STORAGE_KEY = "aula.dashboard.tasks";

export function loadDashboardTasks() {
   return readJsonFromStorage(DASHBOARD_TASKS_STORAGE_KEY, initialDashboardTasks, (raw) => {
      if (!Array.isArray(raw)) {
         return null;
      }

      const sanitized = raw
         .filter((task): task is DashboardTask => {
            if (!task || typeof task !== "object") {
               return false;
            }
            const candidate = task as Partial<DashboardTask>;
            return (
               typeof candidate.id === "string" &&
               typeof candidate.institutionId === "string" &&
               typeof candidate.text === "string" &&
               typeof candidate.done === "boolean"
            );
         })
         .map((task) => ({
            id: task.id,
            institutionId: task.institutionId,
            text: task.text,
            done: task.done,
         }));

      return sanitized.length > 0 ? sanitized : initialDashboardTasks;
   });
}

export function saveDashboardTasks(tasks: DashboardTask[]) {
   writeJsonToStorage(DASHBOARD_TASKS_STORAGE_KEY, tasks);
}
