import { defaultEduData } from "@/data/default-edu-data";
import { readJsonFromStorage, writeJsonToStorage } from "@/services/local-storage";

export const storageKeys = {
   institutions: "aula.catalog.institutions",
   subjects: "aula.catalog.subjects",
   contentItems: "aula.catalog.content-items",
   students: "aula.students",
   planningClasses: "aula.planning.classes",
   scheduleTemplates: "aula.planning.schedule-templates",
   evaluations: "aula.evaluations",
   attendanceRecords: "aula.attendanceRecords",
   teacherProfile: "aula.teacherProfile",
   activeInstitution: "aula.activeInstitution",
   dashboardThresholds: "aula.dashboard.thresholds",
} as const;

function ensureStorageSeed<T>(key: string, seed: T) {
   if (typeof window === "undefined") {
      return;
   }
   const existing = window.localStorage.getItem(key);
   if (existing !== null) {
      return;
   }
   writeJsonToStorage(key, seed);
}

export function initializeAppDataStorage() {
   ensureStorageSeed(storageKeys.institutions, defaultEduData.institutions);
   ensureStorageSeed(storageKeys.subjects, defaultEduData.subjects);
   ensureStorageSeed(storageKeys.contentItems, defaultEduData.contentItems);
   ensureStorageSeed(storageKeys.students, defaultEduData.students);
   ensureStorageSeed(storageKeys.planningClasses, defaultEduData.classSessions);
   ensureStorageSeed(
      storageKeys.scheduleTemplates,
      defaultEduData.scheduleTemplates ?? [],
   );
   ensureStorageSeed(storageKeys.evaluations, defaultEduData.evaluations);
   ensureStorageSeed(storageKeys.attendanceRecords, defaultEduData.attendanceRecords);
   ensureStorageSeed(storageKeys.teacherProfile, defaultEduData.teacherProfile);
   ensureStorageSeed(storageKeys.dashboardThresholds, {});
   ensureStorageSeed(
      storageKeys.activeInstitution,
      defaultEduData.institutions[0]?.id ?? "",
   );
}

export function getSeededActiveInstitution() {
   return readJsonFromStorage(
      storageKeys.activeInstitution,
      defaultEduData.institutions[0]?.id ?? "",
      (raw) => (typeof raw === "string" ? raw : null),
   );
}
