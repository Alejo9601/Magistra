import { institutions } from "@/lib/edu-repository";
import { readJsonFromStorage, writeJsonToStorage } from "@/services/local-storage";

const ACTIVE_INSTITUTION_STORAGE_KEY = "aula.activeInstitution";

export function loadActiveInstitution() {
   const fallbackInstitution = institutions[0]?.id ?? "inst-1";
   return readJsonFromStorage(
      ACTIVE_INSTITUTION_STORAGE_KEY,
      fallbackInstitution,
      (raw) => {
         if (typeof raw !== "string") {
            return null;
         }
         return institutions.some((institution) => institution.id === raw)
            ? raw
            : fallbackInstitution;
      },
   );
}

export function saveActiveInstitution(institutionId: string) {
   writeJsonToStorage(ACTIVE_INSTITUTION_STORAGE_KEY, institutionId);
}
