import { institutions } from "@/lib/edu-repository";
import { readJsonFromStorage, writeJsonToStorage } from "@/services/local-storage";
import { storageKeys } from "@/services/app-data-bootstrap-service";

export function loadActiveInstitution() {
   const fallbackInstitution = institutions[0]?.id ?? "inst-1";
   return readJsonFromStorage(
      storageKeys.activeInstitution,
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
   writeJsonToStorage(storageKeys.activeInstitution, institutionId);
}
