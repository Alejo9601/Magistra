import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
   initialDashboardTasks,
   type DashboardTask,
} from "@/components/dashboard/constants";

const DASHBOARD_TASKS_STORAGE_KEY = "aula.dashboard.tasks";

type DashboardContextValue = {
   tasks: DashboardTask[];
   toggleTask: (taskId: string, done: boolean) => void;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

function resolveInitialTasks() {
   if (typeof window === "undefined") {
      return initialDashboardTasks;
   }

   const persisted = window.localStorage.getItem(DASHBOARD_TASKS_STORAGE_KEY);
   if (!persisted) {
      return initialDashboardTasks;
   }

   try {
      const parsed = JSON.parse(persisted);
      if (!Array.isArray(parsed)) {
         return initialDashboardTasks;
      }

      const sanitized = parsed
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
   } catch {
      return initialDashboardTasks;
   }
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
   const [tasks, setTasks] = useState<DashboardTask[]>(resolveInitialTasks);

   useEffect(() => {
      if (typeof window === "undefined") {
         return;
      }
      window.localStorage.setItem(DASHBOARD_TASKS_STORAGE_KEY, JSON.stringify(tasks));
   }, [tasks]);

   const value = useMemo<DashboardContextValue>(
      () => ({
         tasks,
         toggleTask: (taskId, done) => {
            setTasks((prev) =>
               prev.map((task) =>
                  task.id === taskId
                     ? {
                          ...task,
                          done,
                       }
                     : task,
               ),
            );
         },
      }),
      [tasks],
   );

   return (
      <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
   );
}

export function useDashboardContext() {
   const context = useContext(DashboardContext);
   if (!context) {
      throw new Error("useDashboardContext must be used within DashboardProvider.");
   }
   return context;
}
