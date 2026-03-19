import { getTodayStr } from "@/features/dashboard/utils/constants";

export function useDashboardDateRange() {
   const todayStr = getTodayStr();
   const tomorrowDate = new Date(`${todayStr}T12:00:00`);
   tomorrowDate.setDate(tomorrowDate.getDate() + 1);
   const tomorrowStr = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth() + 1).padStart(2, "0")}-${String(tomorrowDate.getDate()).padStart(2, "0")}`;

   return { todayStr, tomorrowStr };
}
