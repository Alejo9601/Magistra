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
