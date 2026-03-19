import { createContext, useContext, useEffect, useState } from "react";
import type { DashboardTask } from "@/features/dashboard/types";
import {
   loadDashboardTasks,
   saveDashboardTasks,
} from "@/features/dashboard/services/dashboard-service";

type DashboardContextValue = {
   tasks: DashboardTask[];
   toggleTask: (taskId: string, done: boolean) => void;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
   const [tasks, setTasks] = useState<DashboardTask[]>(loadDashboardTasks);

   useEffect(() => {
      saveDashboardTasks(tasks);
   }, [tasks]);

   const value: DashboardContextValue = {
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
   };

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




